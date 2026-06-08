import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import {
  homeConfigPath,
  promptAndPersist,
  readHomeConfigValue,
} from '../config';
import { capture, exec, succeeds } from '../exec';
import {
  inlineTsconfig,
  parseCatalog,
  resolveSitePackageJson,
  resolveTemplateRef,
  rewriteViteBase,
} from './rewrites';
import {
  DEPLOY_WORKFLOW,
  GITIGNORE,
  HOST_MARKER,
  NOJEKYLL,
} from './templates';

export const CANONICAL_REPO = 'AgentEnder/design-drafts';
const CANONICAL_URL = `https://github.com/${CANONICAL_REPO}.git`;
const DEFAULT_BRANCH = 'main';
const SITE_SUBDIR = 'packages/site';
const WORKFLOW_PATH = '.github/workflows/deploy-preview.yml';

// Files we transform on the way in rather than copying verbatim.
const TRANSFORMED = new Set([
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
]);

export interface InitHostOptions {
  path: string;
  repo?: string;
  templateRef?: string;
  cliVersion: string;
}

function repoName(repo: string): string {
  return repo.includes('/') ? repo.split('/').pop()! : repo;
}

function detectRemoteRepo(targetDir: string): string | undefined {
  const url = capture('git remote get-url origin', targetDir);
  if (!url) return undefined;
  // git@github.com:org/repo.git  or  https://github.com/org/repo(.git)
  const match = url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  return match?.[1];
}

/** True when the target already carries our generated workflow. */
function alreadyConfigured(targetDir: string): boolean {
  const workflow = join(targetDir, WORKFLOW_PATH);
  if (!existsSync(workflow)) return false;
  return readFileSync(workflow, 'utf-8').includes(HOST_MARKER);
}

/** Sparse-checks-out the canonical site source + the root files we need to
 * resolve it (catalog + base tsconfig) into a temp dir, returning that path. */
function sparseCheckout(ref: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'design-drafts-host-'));
  exec(`git clone --filter=blob:none --no-checkout ${CANONICAL_URL} .`, tmp);
  exec(
    `git sparse-checkout set --no-cone ${SITE_SUBDIR} pnpm-workspace.yaml tsconfig.base.json`,
    tmp
  );
  exec(`git checkout ${ref}`, tmp);
  return tmp;
}

export function writeScaffold(
  checkout: string,
  targetDir: string,
  repo: string
): void {
  const siteDir = join(checkout, SITE_SUBDIR);

  // Copy the site verbatim, then overwrite the files that need rewriting.
  cpSync(siteDir, targetDir, {
    recursive: true,
    filter: (src) => !TRANSFORMED.has(src.slice(siteDir.length + 1)),
  });

  const catalog = parseCatalog(
    readFileSync(join(checkout, 'pnpm-workspace.yaml'), 'utf-8')
  );
  writeFileSync(
    join(targetDir, 'package.json'),
    resolveSitePackageJson(
      readFileSync(join(siteDir, 'package.json'), 'utf-8'),
      catalog
    )
  );

  const viteRaw = readFileSync(join(siteDir, 'vite.config.ts'), 'utf-8');
  writeFileSync(
    join(targetDir, 'vite.config.ts'),
    rewriteViteBase(viteRaw, repo)
  );

  writeFileSync(
    join(targetDir, 'tsconfig.json'),
    inlineTsconfig(
      readFileSync(join(siteDir, 'tsconfig.json'), 'utf-8'),
      readFileSync(join(checkout, 'tsconfig.base.json'), 'utf-8')
    )
  );

  // Generated (not checked out) files.
  const workflowDest = join(targetDir, WORKFLOW_PATH);
  mkdirSync(dirname(workflowDest), { recursive: true });
  writeFileSync(workflowDest, DEPLOY_WORKFLOW);
  writeFileSync(join(targetDir, '.nojekyll'), NOJEKYLL);
  writeFileSync(join(targetDir, '.gitignore'), GITIGNORE);
}

function commitScaffold(targetDir: string): void {
  if (!existsSync(join(targetDir, '.git'))) {
    exec(`git init -b ${DEFAULT_BRANCH}`, targetDir);
  }
  exec('git add .', targetDir);
  // `|| true`-style guard: a no-op commit (re-run with no changes) shouldn't abort.
  if (capture('git status --porcelain', targetDir)) {
    exec('git commit -m "chore: scaffold design-drafts host"', targetDir);
  }
}

/** Best-effort GitHub wiring. Never hard-fails: the local scaffold already
 * succeeded, so any gh gap becomes printed manual steps. */
function configureGitHub(targetDir: string, repo: string): void {
  if (!succeeds('gh auth status', targetDir)) {
    printManualSteps(repo, 'GitHub CLI (`gh`) is not installed or authenticated');
    return;
  }

  if (!detectRemoteRepo(targetDir)) {
    exec(`git remote add origin git@github.com:${repo}.git`, targetDir);
  }

  if (!succeeds(`gh repo view ${repo}`, targetDir)) {
    if (!succeeds(`gh repo create ${repo} --public`, targetDir)) {
      printManualSteps(repo, `could not create ${repo}`);
      return;
    }
  }

  if (!succeeds(`git push -u origin ${DEFAULT_BRANCH}`, targetDir)) {
    printManualSteps(repo, 'could not push main');
    return;
  }

  enablePages(targetDir, repo);
}

/** Sets the Pages source to "GitHub Actions" (build_type=workflow). */
function enablePages(targetDir: string, repo: string): void {
  const create = `gh api -X POST /repos/${repo}/pages -f build_type=workflow`;
  const update = `gh api -X PUT /repos/${repo}/pages -f build_type=workflow`;
  if (succeeds(create, targetDir) || succeeds(update, targetDir)) {
    console.log(`Enabled GitHub Pages (Actions source) on ${repo}.`);
    return;
  }
  console.warn(
    `Warning: could not enable GitHub Pages on ${repo}.\n` +
      `Enable it manually: Settings -> Pages -> Build and deployment -> Source: GitHub Actions.`
  );
}

function printManualSteps(repo: string, reason: string): void {
  console.warn(
    `\nScaffold written, but GitHub setup was skipped (${reason}).\n` +
      `Finish manually:\n` +
      `  git -C <host> push -u origin main   # to https://github.com/${repo}\n` +
      `  Settings -> Pages -> Source: GitHub Actions\n`
  );
}

export async function initHost(opts: InitHostOptions): Promise<void> {
  const targetDir = resolve(opts.path);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const repo = await promptAndPersist(
    opts.repo ?? readHomeConfigValue('repo') ?? detectRemoteRepo(targetDir),
    'repo',
    homeConfigPath,
    'GitHub repo for the host (org/repo):'
  );

  if (alreadyConfigured(targetDir)) {
    console.log(`Host already configured at ${targetDir}; re-ensuring Pages.`);
    enablePages(targetDir, repo);
    return;
  }

  const ref = resolveTemplateRef({
    override: opts.templateRef,
    cliVersion: opts.cliVersion,
    defaultBranch: DEFAULT_BRANCH,
    tagExists: (tag) =>
      Boolean(capture(`git ls-remote --tags ${CANONICAL_URL} ${tag}`, targetDir)),
  });

  console.log(`Scaffolding host "${repoName(repo)}" from ${CANONICAL_REPO}@${ref}...`);
  const checkout = sparseCheckout(ref);
  try {
    writeScaffold(checkout, targetDir, repo);
  } finally {
    rmSync(checkout, { recursive: true, force: true });
  }

  commitScaffold(targetDir);
  configureGitHub(targetDir, repo);

  console.log(`\nHost scaffolded at ${targetDir}.`);
}
