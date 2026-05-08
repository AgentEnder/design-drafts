import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { text } from '@clack/prompts';
import { cli, ConfigurationProviders } from 'cli-forge';

import { refAdd } from './ref-add.js';

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
  description:
    'Push static site previews as branches and manage draft references.',
})
  .command('push', {
    description:
      'Push a draft directory to a design-drafts repo as a preview branch.',
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

      const branchName = `${prefix}${siteName}`;
      const tmpDir = mkdtempSync(join(tmpdir(), 'design-drafts-'));

      try {
        cpSync(sourcePath, tmpDir, { recursive: true });
        exec('git init', tmpDir);
        exec(`git checkout -b ${branchName}`, tmpDir);
        exec(`git remote add origin git@github.com:${repo}.git`, tmpDir);
        exec('git add .', tmpDir);
        exec('git commit -m "push site preview"', tmpDir);
        exec(`git push --force origin ${branchName}`, tmpDir);

        console.log(`\nPushed "${branchName}" to ${repo}`);
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    },
  })
  .command('ref', {
    description:
      "Manage a draft's references/ directory (links and inspiration screenshots).",
    builder: (args) =>
      args.command('add', {
        description:
          'Add a reference URL or screenshot to references/. URL → references/links.md (with --note); image URL or local image → references/inspiration/.',
        builder: (sub) =>
          sub
            .positional('source', {
              type: 'string',
              description: 'URL or local file path to add as a reference',
            })
            .option('note', {
              type: 'string',
              description:
                'Annotation describing what is being cited. Required for non-image URLs.',
            })
            .option('name', {
              type: 'string',
              description:
                'Override the filename used in references/inspiration/ (extension is added if missing).',
            })
            .option('draft', {
              type: 'string',
              description:
                'Path to the draft directory containing draft.config.json (default: cwd).',
            }),
        handler: async (args) => {
          if (!args.source) {
            console.error(
              'design-drafts ref add requires a <source> argument (URL or file path).'
            );
            process.exit(1);
          }
          try {
            await refAdd({
              source: args.source,
              note: args.note,
              name: args.name,
              draft: args.draft,
            });
          } catch (error) {
            console.error(
              error instanceof Error ? error.message : String(error)
            );
            process.exit(1);
          }
        },
      }),
  });

await app.forge();
