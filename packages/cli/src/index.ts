import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { cli, ConfigurationProviders } from 'cli-forge';

import pkg from '../package.json';
import {
  CONFIG_FILENAME,
  homeConfigPath,
  homeJsonProvider,
  localConfigPath,
  promptAndPersist,
  resolvePrefix,
} from './config';
import { capture, exec } from './exec';
import { githubRemoteUrl } from './github';
import { initDraft } from './init/draft';
import { initHost } from './init/host';
import { init } from './init/init';
import { validateSiteName } from './site-name';

const CLI_VERSION: string = pkg.version;

// Draft branches are orphan branches containing only the published site content.
// The `push` event resolves a workflow from the pushed ref, so for the deploy to
// auto-trigger the workflow file must live on the draft branch itself. We embed
// the host repo's canonical copy (from its default branch) before committing.
// The deploy workflow strips this `.github/` dir back out before publishing so
// it never leaks into the preview site.
const DEFAULT_BRANCH = 'main';
const WORKFLOW_PATH = '.github/workflows/deploy-preview.yml';

async function embedDeployWorkflow(repo: string, tmpDir: string): Promise<void> {
  const url = `https://raw.githubusercontent.com/${repo}/${DEFAULT_BRANCH}/${WORKFLOW_PATH}`;
  let contents: string;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    contents = await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `Warning: could not fetch deploy workflow from ${url} (${reason}).\n` +
        `The preview will not auto-deploy. Trigger it manually with:\n` +
        `  gh workflow run deploy-preview.yml -f branch=<branch> --repo ${repo}`
    );
    return;
  }

  const destination = join(tmpDir, WORKFLOW_PATH);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

interface SourceMetadata {
  sha?: string;
  repo?: string;
  authorName?: string;
  authorEmail?: string;
}

function getSourceMetadata(sourcePath: string): SourceMetadata {
  // git config falls back to global automatically when no local value is set,
  // so a single `git config user.name` invocation handles the spec's
  // "local then global" rule on its own.
  return {
    sha: capture('git rev-parse HEAD', sourcePath),
    repo: capture('git remote get-url origin', sourcePath),
    authorName: capture('git config user.name', sourcePath),
    authorEmail: capture('git config user.email', sourcePath),
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

interface PushArgs {
  // Optional in the type because cli-forge pins a $0 command's handler args to
  // the parent shape (without the builder's positional); the positional's `.`
  // default means it is always present at runtime.
  path?: string;
  repo?: string;
  'site-name'?: string;
  prefix?: string;
}

async function pushHandler(args: PushArgs): Promise<void> {
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
  const sourcePath = resolve(args.path ?? '.');

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
    await embedDeployWorkflow(repo, tmpDir);
    exec('git init', tmpDir);
    exec(`git checkout -b ${branchName}`, tmpDir);
    exec(`git remote add origin ${githubRemoteUrl(repo, tmpDir)}`, tmpDir);
    exec('git add .', tmpDir);
    exec(`git commit -F ${JSON.stringify(messageFile)}`, tmpDir);
    exec(`git push --force origin ${branchName}`, tmpDir);

    console.log(`\nPushed "${branchName}" to ${repo}`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
    rmSync(messageFile, { force: true });
  }
}

// Shared options (repo / site-name / template-ref / env / config) live on the
// root so every command sees them. `push` is the `$0` default command: its
// greedy `path` positional is deferred by cli-forge until the discovery loop
// confirms no explicit subcommand matched, so it can't swallow an `init host`
// /`init draft` subcommand token. The `init` parent intentionally has no
// positional for the same reason.
const app = cli('design-drafts', {
  description: 'Push static site previews as branches to a design-drafts repo',
  builder: (args) =>
    args
      .option('repo', {
        type: 'string',
        description: 'GitHub repo in org/repo form',
      })
      .option('site-name', {
        type: 'string',
        description: 'Name for this site preview (becomes the branch name)',
      })
      .option('template-ref', {
        type: 'string',
        description:
          'Ref of the canonical repo to scaffold the host site from (default: matching version tag, else main)',
      })
      .env({ prefix: 'DESIGN_DRAFTS' })
      .config(homeJsonProvider)
      .config(ConfigurationProviders.JsonFile(CONFIG_FILENAME))
      .command('init', {
        description:
          'Scaffold a host repo and/or a draft (no subcommand = guided one-liner)',
        builder: (initArgs) =>
          initArgs
            .command('host', {
              description: 'Scaffold a GitHub repo to host draft previews',
              builder: (b) =>
                b
                  .option('path', {
                    type: 'string',
                    description:
                      'Persist the scaffold to this directory instead of a throwaway tmpdir',
                  })
                  .option('private', {
                    type: 'boolean',
                    description:
                      'Create a private repo (default: prompt; Pages needs Pro/Team for private)',
                  })
                  .option('yes', {
                    type: 'boolean',
                    description: 'Skip the confirmation prompt before GitHub setup',
                  }),
              handler: (a) =>
                initHost({
                  path: a.path,
                  repo: a.repo,
                  templateRef: a['template-ref'],
                  private: a.private,
                  yes: a.yes,
                  cliVersion: CLI_VERSION,
                }),
            })
            .command('draft', {
              description: 'Scaffold a new draft directory',
              builder: (b) =>
                b.positional('path', {
                  type: 'string',
                  default: '.',
                  description: 'Directory to scaffold the draft into',
                }),
              handler: (a) =>
                initDraft({ path: a.path, siteName: a['site-name'] }),
            }),
        handler: (a) =>
          init({
            path: '.',
            repo: a.repo,
            siteName: a['site-name'],
            templateRef: a['template-ref'],
            cliVersion: CLI_VERSION,
          }),
      })
      // `push` is the `$0` default, registered LAST: its builder adds the greedy
      // `path` positional, and trailing it in the chain lets cli-forge infer
      // those args into the handler rather than pinning them to the parent shape.
      .command('push', {
        alias: ['$0'],
        description: 'Push a built directory as a draft preview branch',
        // cli-forge can't infer a $0 command's builder-extended args into the
        // handler when sibling commands exist, so we erase the builder return
        // type here and keep `pushHandler` explicitly typed (PushArgs) instead.
        builder: (b) =>
          b
            .positional('path', {
              type: 'string',
              default: '.',
              description: 'Directory to push as a site preview',
            })
            .option('prefix', {
              type: 'string',
              description:
                'Branch prefix used when pushing previews (default: "drafts/"). Pass an empty string to push without a prefix.',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }) as any,
        handler: pushHandler,
      }),
});

await app.forge();
