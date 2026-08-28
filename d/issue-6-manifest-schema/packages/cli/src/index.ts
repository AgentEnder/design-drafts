import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { text } from '@clack/prompts';
import { cli, ConfigurationProviders } from 'cli-forge';

const CONFIG_FILENAME = 'design-drafts.config.json';

const homeConfigPath = join(homedir(), CONFIG_FILENAME);
const localConfigPath = join(process.cwd(), CONFIG_FILENAME);

async function ensureConfig(
  path: string,
  key: string,
  promptMessage: string
): Promise<void> {
  if (existsSync(path)) {
    const contents = JSON.parse(
      (await import('node:fs')).readFileSync(path, 'utf-8')
    );
    if (contents[key]) return;
  }

  const value = await text({
    message: promptMessage,
    validate: (v) => {
      if (!v?.trim()) return `${key} is required`;
    },
  });

  if (typeof value !== 'string') {
    process.exit(1);
  }

  const existing = existsSync(path)
    ? JSON.parse(
        (await import('node:fs')).readFileSync(path, 'utf-8')
      )
    : {};

  writeFileSync(path, JSON.stringify({ ...existing, [key]: value }, null, 2) + '\n');
}

function exec(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: 'inherit' });
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
      .config(ConfigurationProviders.JsonFile(CONFIG_FILENAME)),

  handler: async (args) => {
    await ensureConfig(homeConfigPath, 'repo', 'GitHub repo (org/repo):');
    await ensureConfig(localConfigPath, 'site-name', 'Site name for this preview:');

    // Re-read config values after prompting (they may have just been written)
    const homeConfig = JSON.parse(
      (await import('node:fs')).readFileSync(homeConfigPath, 'utf-8')
    );
    const localConfig = JSON.parse(
      (await import('node:fs')).readFileSync(localConfigPath, 'utf-8')
    );

    const repo: string = args.repo ?? homeConfig.repo;
    const siteName: string = args['site-name'] ?? localConfig['site-name'];
    const sourcePath = resolve(args.path);

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
