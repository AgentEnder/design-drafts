import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { text } from '@clack/prompts';
import { cli, ConfigurationProviders } from 'cli-forge';

const CONFIG_FILENAME = 'design-drafts.config.json';

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

function exec(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: 'inherit' });
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

    const tmpDir = mkdtempSync(join(tmpdir(), 'design-drafts-'));

    try {
      cpSync(sourcePath, tmpDir, { recursive: true });
      exec('git init', tmpDir);
      exec(`git checkout -b ${siteName}`, tmpDir);
      exec(`git remote add origin git@github.com:${repo}.git`, tmpDir);
      exec('git add .', tmpDir);
      exec('git commit -m "push site preview"', tmpDir);
      exec(`git push --force origin ${siteName}`, tmpDir);

      console.log(`\nPushed "${siteName}" to ${repo}`);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  },
});

await app.forge();
