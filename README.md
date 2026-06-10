# design-drafts

Publish static design explorations as browsable, shareable previews — and let
reviewers switch between every design choice with a toolbar and leave feedback
inline.

A **draft** is a plain directory of HTML files plus a `design-drafts.config.json`
manifest. You push it with one command; a GitHub Action deploys it to a
per-draft URL on GitHub Pages. The published preview carries a small toolbar
that lets a reviewer flip between themes, layouts, and any other dimension you
defined — because each of those is a real HTML file the toolbar navigates to.

```
your draft dir                CLI                 GitHub                gh-pages
─────────────────────────     ─────────────       ──────────────       ─────────────────
design-drafts.config.json     design-drafts  ──▶  branch              ──▶  /<draft-name>/
pages/*.html                    (force-push)      drafts/<name>            + index site
references/                                        ▼                        + toolbar.js
                                                   Deploy Preview workflow
```

There is no build step and no template expansion. What you have on disk is what
gets deployed.

---

## The core idea: axes and pages

A draft is a small slice of design space. You name the dimensions you want a
reviewer to be able to compare (**axes**), enumerate the values each can take
(**choices**), then list the specific combinations you actually built
(**pages**). Each page pins every axis to one choice and points at one HTML
file:

```jsonc
{
  "axes": [
    { "name": "theme",  "choices": [{ "name": "light" }, { "name": "dark" }] },
    { "name": "layout", "choices": [{ "name": "centered" }, { "name": "split" }] }
  ],
  "pages": [
    { "coordinates": { "theme": "light", "layout": "centered" }, "path": "pages/light-centered.html" },
    { "coordinates": { "theme": "dark",  "layout": "split"    }, "path": "pages/dark-split.html" }
  ]
}
```

Two things follow:

- **Coverage is sparse by default.** Axes `theme × layout × variant` define a
  cartesian of every possible combination, but you only build the few that show
  off the trade-offs you care about. The toolbar greys out choices that have no
  drafted neighbour.
- **The toolbar is a router, not a CSS swapper.** Switching `theme` from light
  to dark just navigates the iframe to the HTML file at the matching
  coordinates. Each entry is a complete, standalone page — written by hand, by
  an agent, or exported from anything.

See [`docs/conventions/layout.md`](docs/conventions/layout.md) for the full
manifest model and the recommended on-disk layout.

---

## Quick start

The CLI lives in this monorepo and is not published to npm. Build it once, then
run it from anywhere against any draft directory:

```sh
pnpm install
pnpm --filter @design-drafts/cli build
# the binary is packages/cli/bin.js; alias or `pnpm link` it as `design-drafts`
```

### 1. Scaffold a host and a draft

The first time, you need a GitHub repo to host previews. `init` sets one up (if
you don't have one configured) and scaffolds a starter draft in the current
directory:

```sh
design-drafts init
```

This walks you through creating the host repo, then writes a
`design-drafts.config.json` and a placeholder `index.html`. The two halves are also available on their own:

| Command                  | What it does                                              |
| ------------------------ | --------------------------------------------------------- |
| `design-drafts init host`  | Scaffold the GitHub repo that hosts previews (idempotent) |
| `design-drafts init draft` | Scaffold a new draft directory only                       |

### 2. Build the draft

Replace the placeholder `index.html` with your real pages, fill in the axes and
pages in `design-drafts.config.json`, and (recommended) add a `references/brief.md` so
agents and reviewers know the intent. See
[`docs/conventions/references-protocol.md`](docs/conventions/references-protocol.md).

### 3. Publish

From the draft directory:

```sh
design-drafts                 # push "." as a preview (push is the default command)
design-drafts ./path/to/draft # or point at a directory
```

The CLI copies the directory to a throwaway tmpdir, embeds the deploy workflow,
force-pushes it to `drafts/<site-name>`, and exits. The
[`Deploy Preview`](.github/workflows/deploy-preview.yml) workflow then publishes
it to `https://<owner>.github.io/<repo>/<site-name>/`.

> The **push** publishes the preview — a pull request is *not* required for
> deployment.

### 4. (Optional) Open a PR for review

The push alone publishes the preview, so a PR is only needed when you want a
durable thread for review feedback (e.g. to collect annotations). Today you open
that PR yourself against `main` once the branch is pushed.

> An opt-in `--pr` flag (run `gh pr create --web` after a successful push) is the
> accepted design but not yet implemented — see
> [`docs/adr/0002-pr-flow.md`](docs/adr/0002-pr-flow.md).

---

## Reviewing a preview

Every published page carries two framework-agnostic, single-file scripts:

### Toolbar — switch between design choices

A 44px bar at the bottom of the viewport with one `<select>` per axis. It reads
`design-drafts.config.json`, highlights the current page's coordinates, and disables
choices with no drafted neighbour. Selecting a different choice navigates to the
matching file (preserving the querystring).

- **Hide for one load:** `?toolbar=0` · **force-show:** `?toolbar=1`
- **Hide for the session:** click ×, or **Cmd/Ctrl + .**

Full details: [`packages/toolbar/README.md`](packages/toolbar/README.md).

### Annotate — leave inline feedback

An overlay (activated with `?annotate=1` or a toggle) that lets a reviewer click
any element and pin a comment to it. Comments are stored locally in the
browser.

> ⚠️ Annotations live in `localStorage`, shared with any script on the page —
> don't capture sensitive feedback through it.

### The index site

The deployed root (`/`) is a small Vike/React app
([`packages/site`](packages/site)) that lists every live `drafts/*` preview so
reviewers have one place to find them. It is rebuilt on every deploy.

---

## Configuration

`push` resolves each value from, in order: a CLI flag, an env var
(`DESIGN_DRAFTS_*`), then the global `~/design-drafts.config.json`. The site name
is the exception — it's derived from the manifest's `name` (slugified), so a
draft's `design-drafts.config.json` is the only place it lives. Missing required
values are prompted for; `--repo` and `--prefix` are persisted globally.

| Setting     | Flag          | Notes                                                            |
| ----------- | ------------- | ---------------------------------------------------------------- |
| Host repo   | `--repo`      | `owner/name`. Saved globally **after** a successful push.        |
| Site name   | `--site-name` | Branch/preview directory name. Defaults to the manifest's `name` (slugified); the flag overrides. |
| Branch prefix | `--prefix`  | Default `drafts/`. Pass `""` to push without a prefix. Saved globally. |
| Template ref | `--template-ref` | Ref of this repo used to scaffold the host workflow.         |

Each push also records source metadata in the commit message (source SHA, repo,
author, the manifest's `prompt`, and a hash of `design-drafts.config.json`) so a
preview is traceable back to what produced it.

---

## Repository layout

This is an [Nx](https://nx.dev) + pnpm monorepo.

| Package                                          | Role                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| [`packages/cli`](packages/cli)                   | The `design-drafts` CLI: `init`, `init host`, `init draft`, and `push` (`$0`). |
| [`packages/conventions`](packages/conventions)   | The draft manifest TypeBox schema, JSON Schema, and validator — source of truth. |
| [`packages/toolbar`](packages/toolbar)           | The single-file axis switcher injected into every preview.                    |
| [`packages/annotate`](packages/annotate)         | The single-file inline-annotation overlay.                                    |
| [`packages/site`](packages/site)                 | The Vike/React index site that lists live previews.                           |
| [`examples/`](examples)                          | Worked drafts: a marketing site, a docs portal, an internal dashboard.        |
| [`docs/`](docs)                                  | Conventions, ADRs, and the anti-pattern catalog.                              |

### Development

```sh
pnpm install
pnpm nx run-many -t build           # build all packages
pnpm nx run-many -t typecheck       # typecheck all packages
pnpm --filter @design-drafts/cli test
pnpm --filter @design-drafts/site dev   # run the index site locally
```

---

## Further reading

- [`docs/conventions/layout.md`](docs/conventions/layout.md) — the manifest
  model, picking axes, and the on-disk layout convention.
- [`docs/conventions/references-protocol.md`](docs/conventions/references-protocol.md)
  — what goes in `references/` and why drafts without it look generic.
- [`docs/anti-patterns.md`](docs/anti-patterns.md) — what design drafts should
  *not* converge on.
- [`docs/adr/`](docs/adr) — accepted architectural decisions (annotation picker,
  PR flow).
- [`examples/`](examples) — three complete drafts to copy from.
</content>
</invoke>
