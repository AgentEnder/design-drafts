# Design Drafts — Initial Setup Plan

Created: 2026-04-16
Status: Active

## Goal

Create a monorepo that lets developers push static site previews to a shared GitHub repo, where each preview gets its own subdirectory on gh-pages with an auto-generated index page linking to all previews.

## Context

This is a greenfield project. Two packages:

- **site** — A Vike SSG app on `main` that builds a static index page. At build time it scans a staging directory for subdirectories (each representing a branch/preview) and generates links to them.
- **cli** — A cli-forge CLI tool that pushes a local directory's contents as a named branch to the repo. A GitHub Actions workflow then rolls that branch into gh-pages.

Configuration uses a two-file strategy:
- `~/.design-drafts.config.json` — stores `repo` (org/repo), shared across all projects
- `./design-drafts.config.json` — stores `site-name`, specific to the project being deployed

## Approach

### Step 1: Repository & Nx scaffolding

Create the git repo, pnpm workspace, Nx config, and shared tsconfig.

Files:
- `package.json` (workspace root, private)
- `pnpm-workspace.yaml`
- `nx.json`
- `tsconfig.base.json`
- `.gitignore`

### Step 2: CLI package (`packages/cli`)

Create the cli-forge CLI with:
- A single command (no subcommands) with positional `path` (default `.`) and options `repo`, `site-name`
- Two `.config()` registrations for `design-drafts.config.json` (cli-forge walks up the tree, finding both project-level and home-dir files)
- First-run logic: check if each config file exists, prompt if missing, write via `fs.writeFileSync`
- Handler: copy path contents to a temp dir, `git init`, `git checkout -b <site-name>`, `git remote add origin`, `git add .`, `git commit`, `git push --force`, cleanup temp dir, then run `gh pr create --web` to open PR creation in the browser

Files:
- `packages/cli/package.json`
- `packages/cli/tsconfig.json`
- `packages/cli/src/index.ts`

### Step 3: Vike site package (`packages/site`)

Create the SSG app:
- `+config.ts` with `prerender: true`, extends `vikeReact`
- `+onCreateGlobalContext.server.ts` reads `PAGES_DIR` env var, scans for subdirectories, exposes `branches` array
- `+Layout.tsx` with minimal styling
- `index/+Page.tsx` renders branch list with links
- `index/+data.ts` reads from `globalContext.branches`

Files:
- `packages/site/package.json`
- `packages/site/vite.config.ts`
- `packages/site/tsconfig.json`
- `packages/site/pages/+config.ts`
- `packages/site/pages/+Head.tsx`
- `packages/site/pages/+Layout.tsx`
- `packages/site/pages/+onCreateGlobalContext.server.ts`
- `packages/site/pages/index/+Page.tsx`
- `packages/site/pages/index/+data.ts`

### Step 4: GitHub Actions workflow

Create `.github/workflows/deploy-preview.yml`:
- Triggers on `pull_request` events: `opened`, `synchronize`, `reopened`, `closed`
- Uses `nx-github-pages` for deployment (see cli-forge docs-site pattern)
- Uses a concurrency group keyed on workflow name to serialize gh-pages updates
- On PR opened/synchronize/reopened: checkout main, install, checkout gh-pages to staging dir, copy PR branch content into `<staging>/<branch-name>/`, build Vike site with `PAGES_DIR` pointing to staging, deploy with nx-github-pages
- On PR closed: checkout main, install, checkout gh-pages to staging dir, remove `<staging>/<branch-name>/`, rebuild index, deploy

## Acceptance Criteria

- `pnpm install` succeeds from a clean clone
- `npx nx build cli` produces a runnable CLI
- `npx nx build site` produces static HTML with an index page
- Running the CLI with `--repo` and `--site-name` flags pushes a branch to a GitHub repo
- First run without config files prompts for values and writes both config files
- Subsequent runs read config from files without prompting
- The GitHub Actions workflow deploys branch content + rebuilt index to gh-pages
- Branch deletion removes the directory and rebuilds the index

## Dependencies

- Node.js 20+
- pnpm
- GitHub repo with Pages enabled on gh-pages branch

## Risks & Open Questions

- **gh-pages bootstrap**: First deployment needs an orphan gh-pages branch. The workflow should handle creating it if it doesn't exist.
- **Concurrent pushes**: Two branches pushed simultaneously could race on gh-pages. GitHub Actions concurrency groups can mitigate this.
