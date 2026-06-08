# design-drafts `init` command group

- Date: 2026-06-08
- Status: Accepted (brainstormed)
- Closes: #20 (`setup-host`), partially #21 (`new` → `init draft`)

## Problem

Hosting design-drafts needs a GitHub repo that (a) carries the draft-index
site, (b) runs the deploy workflow, and (c) has Pages enabled. There is no
automation for that; users assemble it by hand. We also lack a one-liner to
scaffold a draft and reach first publish.

## Command surface

```
design-drafts <path>     # unchanged: push a built dir as a draft branch
design-drafts init host  # scaffold a host repo (this design's core)
design-drafts init draft # scaffold a draft session locally
design-drafts init       # magic one-liner: host (if needed) → draft → push
```

`init` is a cli-forge parent command with `host`/`draft` subcommands and its
own handler. The existing push command stays the bare-args default.

## Host repo model

The host is a **standalone single-project Vike site** — NOT a clone of this
monorepo and NOT an nx workspace. `packages/site`'s contents are promoted to
the host root:

```
<host>/
  package.json     from site, rewritten: catalog: → concrete versions, `nx` field dropped
  vite.config.ts   from site, base '/design-drafts/' → '/<host-repo-name>/'
  tsconfig.json    from site, `extends ../../tsconfig.base.json` inlined
  pages/**         from site, verbatim
  .github/workflows/deploy-preview.yml   generated, non-nx (see below)
  .nojekyll
  .gitignore
```

Author-side packages (cli/annotate/toolbar) are never vendored. `nx` and
`nx-github-pages` disappear: build is plain `vike build`, deploy is the
workflow's job.

### Where files come from

A blobless clone (`--filter=blob:none --no-checkout`) with a cone-mode sparse
checkout of `packages/site`, then copy its contents to the host root and apply
the rewrites. Cone mode always materialises top-level files, so the root files
we read (`pnpm-workspace.yaml`'s catalog, `tsconfig.base.json`) come along
without being listed, while sibling packages stay excluded. Default `<ref>` is
the tag matching the CLI version (`v<version>`), falling back to `main` when
that tag is absent; `--template-ref` overrides. The workflow/.nojekyll/.gitignore
are generated from CLI-side string templates, not checked out.

### Rewrites (pure functions, unit-tested)

- `resolveCatalog(sitePkg, catalogMap)` — replace every `catalog:` specifier
  in dependencies/devDependencies with the concrete version from the canonical
  `pnpm-workspace.yaml` catalog (read from the sparse checkout). Drop the
  `nx` field.
- `rewriteViteBase(source, repoName)` — replace the `base: '…'` literal with
  `/<repoName>/`.
- `inlineTsconfig(siteTsconfig, baseTsconfig)` — merge the tiny base
  compilerOptions in and drop `extends`.

## Deploy workflow (non-nx)

Pages **source = "GitHub Actions"**. The **gh-pages branch is the durable
store** of all previews (not the Pages source). Two jobs:

- `build` (push `drafts/**` | PR | workflow_dispatch | delete `drafts/**`):
  checkout main → setup pnpm/node → install → git identity → checkout gh-pages
  into `.gh-pages-staging` worktree (start fresh if absent) → on non-delete,
  shallow-clone the draft branch, strip `.github`, replace `<staging>/<preview>`;
  on delete, `rm -rf <staging>/<preview>` → `pnpm build` with
  `PAGES_DIR=.gh-pages-staging` → copy `dist/client/*` into staging + `.nojekyll`
  → push staging to gh-pages (persist) → `actions/upload-pages-artifact` (path
  = staging).
- `deploy` (needs build): `permissions: pages: write, id-token: write`,
  `environment: github-pages`, `actions/deploy-pages@v4`.

## `init host` behavior

The host site rarely needs local edits, so the base case scaffolds into a
**throwaway tmpdir** and discards it once the GitHub repo is set up. `--path`
opts into a persistent, customizable directory.

1. Pick the target dir: `--path` (resolved, persistent) or a fresh tmpdir
   (default, discarded on success). Resolve repo `org/repo` (`--repo`, else home
   config, else — only for `--path` — `git remote get-url origin`, else prompt).
2. Resolve ref (`--template-ref` || `v<cliVersion>` if tag exists || `main`).
3. Idempotency (`--path` only — a tmpdir is always fresh): if the workflow + a
   host-marked `package.json` already exist, print "already configured", still
   (re)ensure Pages, exit 0.
4. Sparse-checkout + copy + rewrites; generate workflow/.nojekyll/.gitignore.
5. `git init -b main`, add, commit.
6. Interactive gate: prompt visibility (`--private` skips) and a confirm before
   any outward action (`--yes` skips). On decline, keep the scaffold and print
   manual steps.
7. GitHub: if the repo doesn't exist, `gh repo create … --source … --remote
   origin --push` (gh sets the remote with the user's configured protocol and
   pushes — no hardcoded URL). If it exists, add a remote via the detected
   protocol (`gh config get git_protocol`, else ssh) and push.
8. Enable Pages: `gh api POST /repos/{repo}/pages -f build_type=workflow`
   (PUT to update if it already exists). On any `gh` failure (missing, unauthed,
   missing scopes) print exact manual steps and continue — never hard-fail the
   scaffold that already succeeded.
9. Cleanup: a throwaway tmpdir is removed on a successful push and kept on
   failure (so the user can finish manually); a `--path` dir is always kept.

The gh-pages store is **not** pre-created; the first workflow run initializes it.

## `init draft`

Scaffold a buildable draft directory: write `draft.config.json` (with a
`prompt` field the push command already reads) and a minimal `index.html`
skeleton. Persist `repo`/`site-name` to local config. Print next steps.

## `init` (magic)

Read home config. If `repo` is unset → run `init host` flow first. Then run
`init draft`, then the push. The smallest path from nothing to a live preview.

## Testing

- Unit (vitest, new to the cli package): `resolveCatalog`, `rewriteViteBase`,
  `inlineTsconfig`, version→ref selection, host-already-configured detection.
- Git/gh/network orchestration stays thin and is exercised manually (treated
  like `main()` glue).

## Out of scope (YAGNI)

- `list`/`delete` commands (#22), custom domains, multi-host config profiles.
