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

import { confirm, isCancel, select } from '@clack/prompts';

import {
  homeConfigPath,
  promptAndPersist,
  readHomeConfigValue,
} from '../config';
import { capture, exec, succeeds } from '../exec';
import { githubRemoteUrl } from '../github';
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
  // Override the throwaway tmpdir with a persistent directory you intend to
  // customize. Undefined means "scaffold in a tmpdir and discard it once the
  // GitHub repo is set up" — the common case, since the index site rarely needs
  // local edits.
  path?: string;
  repo?: string;
  templateRef?: string;
  cliVersion: string;
  // Repository visibility. Undefined => prompt interactively.
  private?: boolean;
  // Skip the confirmation prompt before outward GitHub actions.
  yes?: boolean;
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

/** Sparse-checks-out the canonical site source into a temp dir, returning that
 * path. Cone mode (the recommended default) always materialises top-level
 * files, so the root files we read to resolve the site (pnpm-workspace.yaml's
 * catalog and tsconfig.base.json) come along without listing them, while the
 * sibling packages stay excluded. */
function sparseCheckout(ref: string): string {
  const tmp = mkdtempSync(join(tmpdir(), 'design-drafts-host-'));
  exec(`git clone --filter=blob:none --no-checkout ${CANONICAL_URL} .`, tmp);
  exec(`git sparse-checkout set ${SITE_SUBDIR}`, tmp);
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
 * succeeded, so any gh gap becomes printed manual steps. Returns true when the
 * repo is set up and pushed (so the caller can discard a throwaway scaffold). */
function configureGitHub(
  targetDir: string,
  repo: string,
  isPrivate: boolean
): boolean {
  if (!succeeds('gh auth status', targetDir)) {
    printManualSteps(
      repo,
      targetDir,
      'GitHub CLI (`gh`) is not installed or authenticated'
    );
    return false;
  }

  const visibility = isPrivate ? '--private' : '--public';

  if (!succeeds(`gh repo view ${repo}`, targetDir)) {
    // gh creates the repo, sets the `origin` remote using the user's configured
    // git protocol, and pushes — one step, correct auth, no hardcoded URL.
    const create = `gh repo create ${repo} ${visibility} --source ${JSON.stringify(
      targetDir
    )} --remote origin --push`;
    if (!succeeds(create, targetDir)) {
      printManualSteps(repo, targetDir, `could not create ${repo}`);
      return false;
    }
    enablePages(targetDir, repo);
    return true;
  }

  // Repo already exists — ensure a remote (with working auth) and push.
  if (!detectRemoteRepo(targetDir)) {
    exec(`git remote add origin ${githubRemoteUrl(repo, targetDir)}`, targetDir);
  }
  if (!succeeds(`git push -u origin ${DEFAULT_BRANCH}`, targetDir)) {
    printManualSteps(repo, targetDir, 'could not push main');
    return false;
  }

  enablePages(targetDir, repo);
  return true;
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

function printManualSteps(
  repo: string,
  targetDir: string,
  reason: string
): void {
  console.warn(
    `\nScaffold is at ${targetDir}, but GitHub setup was skipped (${reason}).\n` +
      `Finish manually:\n` +
      `  gh repo create ${repo} --public --source ${JSON.stringify(
        targetDir
      )} --remote origin --push\n` +
      `  Settings -> Pages -> Source: GitHub Actions\n`
  );
}

/** Resolves repo visibility, prompting interactively when not preset. */
async function resolveVisibility(opts: InitHostOptions): Promise<boolean> {
  if (typeof opts.private === 'boolean') return opts.private;
  const choice = await select({
    message: 'Repository visibility:',
    options: [
      { value: false, label: 'Public', hint: 'required for free GitHub Pages' },
      { value: true, label: 'Private', hint: 'Pages needs GitHub Pro/Team' },
    ],
    initialValue: false,
  });
  if (isCancel(choice)) process.exit(1);
  return choice as boolean;
}

/** Confirmation gate before the outward GitHub actions (create/push/Pages). */
async function confirmGitHub(repo: string, isPrivate: boolean): Promise<boolean> {
  const answer = await confirm({
    message: `Create ${
      isPrivate ? 'private' : 'public'
    } repo ${repo} on GitHub, push the scaffold, and enable Pages?`,
  });
  if (isCancel(answer)) process.exit(1);
  return answer === true;
}

export async function initHost(opts: InitHostOptions): Promise<void> {
  // The base case scaffolds into a throwaway tmpdir and discards it once the
  // GitHub repo is set up; `--path` opts into a persistent, customizable copy.
  const usingTmp = !opts.path;
  const targetDir = opts.path
    ? resolve(opts.path)
    : mkdtempSync(join(tmpdir(), 'design-drafts-host-scaffold-'));
  if (opts.path && !existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const repo = await promptAndPersist(
    opts.repo ??
      readHomeConfigValue('repo') ??
      (opts.path ? detectRemoteRepo(targetDir) : undefined),
    'repo',
    homeConfigPath,
    'GitHub repo for the host (org/repo):'
  );

  // Idempotency only applies to a persistent directory; a tmpdir is always fresh.
  if (opts.path && alreadyConfigured(targetDir)) {
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

  console.log(
    `Scaffolding host "${repoName(repo)}" from ${CANONICAL_REPO}@${ref}...`
  );
  const checkout = sparseCheckout(ref);
  try {
    writeScaffold(checkout, targetDir, repo);
  } finally {
    rmSync(checkout, { recursive: true, force: true });
  }
  commitScaffold(targetDir);

  const isPrivate = await resolveVisibility(opts);
  if (!(opts.yes || (await confirmGitHub(repo, isPrivate)))) {
    console.log(
      `\nStopped before GitHub setup. The scaffold is at ${targetDir}.`
    );
    printManualSteps(repo, targetDir, 'cancelled');
    return;
  }

  const pushed = configureGitHub(targetDir, repo, isPrivate);

  if (!usingTmp) {
    console.log(`\nHost scaffolded at ${targetDir}.`);
    return;
  }

  // Throwaway scaffold: discard it on success, but keep it if the push didn't
  // land so the user still has something to finish manually.
  if (pushed) {
    rmSync(targetDir, { recursive: true, force: true });
    console.log(
      `\nHost ready at https://github.com/${repo} (local scaffold discarded).`
    );
  } else {
    console.log(`\nKept the scaffold at ${targetDir} so you can finish the push.`);
  }
}
