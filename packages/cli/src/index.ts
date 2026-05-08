import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

import { text } from '@clack/prompts';
import { cli, ConfigurationProviders } from 'cli-forge';

const CONFIG_FILENAME = 'design-drafts.config.json';
const DEFAULT_PREFIX = 'drafts/';

const homeConfigPath = join(homedir(), CONFIG_FILENAME);
const localConfigPath = join(process.cwd(), CONFIG_FILENAME);

// JsonFile() walks up from cwd and only finds the nearest match, which means
// the home-level config is invisible when cwd isn't under $HOME. Register an
// explicit provider so it's always read.
const homeJsonProvider = {
  resolve: () => (existsSync(homeConfigPath) ? homeConfigPath : undefined),
  load: (filename: string) => JSON.parse(readFileSync(filename, 'utf-8')),
};

async function promptAndPersist(
  existing: string | undefined,
  argKey: string,
  configPath: string,
  promptMessage: string
): Promise<string> {
  if (existing) return existing;

  const value = await text({
    message: promptMessage,
    validate: (v) => {
      if (!v?.trim()) return `${argKey} is required`;
    },
  });

  if (typeof value !== 'string') {
    process.exit(1);
  }

  const previousFile = existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, 'utf-8'))
    : {};
  writeFileSync(
    configPath,
    JSON.stringify({ ...previousFile, [argKey]: value }, null, 2) + '\n'
  );
  return value;
}

function resolvePrefix(existing: string | undefined): string {
  // Treat undefined as "no value configured" -> use default and persist it so the
  // home config visibly records the value for users who want to edit it later.
  // Treat an explicit empty string as a deliberate opt-out (no prefix); honor it
  // and persist it so the choice is durable.
  if (typeof existing === 'string') {
    persistHomeConfigValue('prefix', existing);
    return existing;
  }

  persistHomeConfigValue('prefix', DEFAULT_PREFIX);
  return DEFAULT_PREFIX;
}

function persistHomeConfigValue(key: string, value: string): void {
  const previousFile = existsSync(homeConfigPath)
    ? JSON.parse(readFileSync(homeConfigPath, 'utf-8'))
    : {};
  if (previousFile[key] === value) return;
  writeFileSync(
    homeConfigPath,
    JSON.stringify({ ...previousFile, [key]: value }, null, 2) + '\n'
  );
}

function exec(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: 'inherit' });
}

interface SourceMetadata {
  sha?: string;
  repo?: string;
  authorName?: string;
  authorEmail?: string;
}

function captureGit(command: string, cwd: string): string | undefined {
  try {
    const out = execSync(command, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    const trimmed = out.toString('utf-8').trim();
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

function getSourceMetadata(sourcePath: string): SourceMetadata {
  // git config falls back to global automatically when no local value is set,
  // so a single `git config user.name` invocation handles the spec's
  // "local then global" rule on its own.
  return {
    sha: captureGit('git rev-parse HEAD', sourcePath),
    repo: captureGit('git remote get-url origin', sourcePath),
    authorName: captureGit('git config user.name', sourcePath),
    authorEmail: captureGit('git config user.email', sourcePath),
  };
}

function hashManifest(manifestPath: string): string | undefined {
  try {
    // Hash the bytes as a utf-8 string. Reading as a Buffer trips a Node type
    // mismatch with crypto's `BinaryLike`, and the manifest is canonical JSON
    // anyway, so a string round-trip is fine.
    const content = readFileSync(manifestPath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return undefined;
  }
}

function readManifestPrompt(
  manifestPath: string,
  sourcePath: string
): string | undefined {
  let raw: string;
  try {
    raw = readFileSync(manifestPath, 'utf-8');
  } catch {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('prompt' in (parsed as Record<string, unknown>))
  ) {
    return undefined;
  }
  const prompt = (parsed as Record<string, unknown>).prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return undefined;
  }

  // If the prompt looks like a path that resolves and the file is short,
  // inline its contents. Otherwise, pass through the literal string (which
  // covers both unresolved paths and free-text summaries).
  const candidatePath = isAbsolute(prompt) ? prompt : join(sourcePath, prompt);
  try {
    const stat = statSync(candidatePath);
    if (stat.isFile() && stat.size < 200) {
      const inline = readFileSync(candidatePath, 'utf-8').trim();
      if (inline) {
        // Collapse to a single line for commit-message friendliness.
        return inline.replace(/\s+/g, ' ');
      }
    }
  } catch {
    // Not a path or doesn't resolve; fall through and use the literal string.
  }

  return prompt.replace(/\s+/g, ' ');
}

function sanitizeAuthorName(name: string): string {
  // git's `Name <email>` author format treats `<` and `>` as delimiters.
  // Replace them with parentheses so we never produce a malformed line.
  return name.replace(/</g, '(').replace(/>/g, ')');
}

interface CommitMessageOptions {
  siteName: string;
  metadata: SourceMetadata;
  prompt?: string;
  draftConfigSha?: string;
}

/**
 * Builds the structured commit message used for every draft push.
 *
 * Format:
 *
 *     push: <site-name>
 *
 *     source-sha: <sha>
 *     source-repo: <repo>
 *     author: <Name <email>>
 *     prompt: <one-line summary or path>
 *     draft-config-sha: <sha256 of draft.config.json>
 *
 * Each trailer line is omitted when its data is unavailable (no source git
 * repo, no manifest, no `prompt` field, etc.). The site-name subject line is
 * always present.
 */
function buildCommitMessage(opts: CommitMessageOptions): string {
  const lines: string[] = [`push: ${opts.siteName}`, ''];

  const { metadata } = opts;
  if (metadata.sha) {
    lines.push(`source-sha: ${metadata.sha}`);
  }
  if (metadata.repo) {
    lines.push(`source-repo: ${metadata.repo}`);
  }
  if (metadata.authorName && metadata.authorEmail) {
    const safeName = sanitizeAuthorName(metadata.authorName);
    lines.push(`author: ${safeName} <${metadata.authorEmail}>`);
  }
  if (opts.prompt) {
    lines.push(`prompt: ${opts.prompt}`);
  }
  if (opts.draftConfigSha) {
    lines.push(`draft-config-sha: ${opts.draftConfigSha}`);
  }

  // If no trailers were appended, drop the blank separator line so we don't
  // emit a trailing empty line for trivial commits.
  if (lines.length === 2) {
    lines.pop();
  }

  return lines.join('\n') + '\n';
}

const SITE_NAME_PATTERN = /^[a-z0-9][a-z0-9-_]{0,62}$/;

function slugifySiteName(input: string): string {
  const lowered = input.toLowerCase();
  const replaced = lowered.replace(/[^a-z0-9_-]+/g, '-');
  const trimmed = replaced.replace(/^-+/, '').replace(/-+$/, '');
  // Ensure first character is alphanumeric (the regex allows _ or - normally,
  // but our pattern requires the leading char to be [a-z0-9]).
  const leading = trimmed.replace(/^[-_]+/, '');
  return leading.slice(0, 63);
}

function validateSiteName(
  name: string
): { ok: true } | { ok: false; reason: string; suggestion?: string } {
  if (!name || !name.trim()) {
    return { ok: false, reason: 'site-name must not be empty' };
  }
  if (name.length > 63) {
    const suggestion = slugifySiteName(name);
    return {
      ok: false,
      reason: 'site-name must be 63 characters or fewer',
      suggestion: suggestion || undefined,
    };
  }
  if (!SITE_NAME_PATTERN.test(name)) {
    const suggestion = slugifySiteName(name);
    return {
      ok: false,
      reason:
        'site-name must start with a lowercase letter or digit and contain only lowercase letters, digits, hyphens, or underscores',
      suggestion: suggestion || undefined,
    };
  }
  return { ok: true };
}

const app = cli('design-drafts', {
  description: 'Push static site previews as branches to a design-drafts repo',
  builder: (args) =>
    args
      .positional('path', {
        type: 'string',
        default: '.',
        description: 'Directory to push as a site preview',
      })
      .option('repo', {
        type: 'string',
        description: 'GitHub repo in org/repo form',
      })
      .option('site-name', {
        type: 'string',
        description: 'Name for this site preview (becomes the branch name)',
      })
      .option('prefix', {
        type: 'string',
        description:
          'Branch prefix used when pushing previews (default: "drafts/"). Pass an empty string to push without a prefix.',
      })
      .env({ prefix: 'DESIGN_DRAFTS' })
      .config(homeJsonProvider)
      .config(ConfigurationProviders.JsonFile(CONFIG_FILENAME)),

  handler: async (args) => {
    const repo = await promptAndPersist(
      args.repo,
      'repo',
      homeConfigPath,
      'GitHub repo (org/repo):'
    );
    const siteName = await promptAndPersist(
      args['site-name'],
      'site-name',
      localConfigPath,
      'Site name for this preview:'
    );
    const prefix = resolvePrefix(args.prefix);
    const sourcePath = resolve(args.path);

    const validation = validateSiteName(siteName);
    if (!validation.ok) {
      console.error(`Invalid site-name "${siteName}": ${validation.reason}`);
      if (validation.suggestion) {
        console.error(`Try: ${validation.suggestion}`);
      }
      process.exit(1);
    }

    if (!existsSync(sourcePath)) {
      console.error(`Path does not exist: ${sourcePath}`);
      process.exit(1);
    }

    // Capture metadata about the SOURCE path before we copy it into a tmpdir.
    // The tmpdir gets a fresh `git init` and won't carry the source repo's
    // history, remotes, or config — so we have to read all of that from the
    // user's actual working directory.
    const manifestPath = join(sourcePath, 'draft.config.json');
    const metadata = getSourceMetadata(sourcePath);
    const draftConfigSha = hashManifest(manifestPath);
    const prompt = readManifestPrompt(manifestPath, sourcePath);
    const commitMessage = buildCommitMessage({
      siteName,
      metadata,
      prompt,
      draftConfigSha,
    });

    const branchName = `${prefix}${siteName}`;
    const tmpDir = mkdtempSync(join(tmpdir(), 'design-drafts-'));
    // Keep the commit message OUTSIDE the working tree so `git add .` can't
    // accidentally stage it. `git commit -F` is the cleanest way to feed a
    // multi-line, blank-line-containing message without quoting headaches.
    const messageFile = join(tmpdir(), `design-drafts-msg-${process.pid}.txt`);
    writeFileSync(messageFile, commitMessage);

    try {
      cpSync(sourcePath, tmpDir, { recursive: true });
      exec('git init', tmpDir);
      exec(`git checkout -b ${branchName}`, tmpDir);
      exec(`git remote add origin git@github.com:${repo}.git`, tmpDir);
      exec('git add .', tmpDir);
      exec(`git commit -F ${JSON.stringify(messageFile)}`, tmpDir);
      exec(`git push --force origin ${branchName}`, tmpDir);

      console.log(`\nPushed "${branchName}" to ${repo}`);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
      rmSync(messageFile, { force: true });
    }
  },
});

await app.forge();
