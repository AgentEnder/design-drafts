# @design-drafts/cli

Push static site previews as branches to a **design-drafts** repo, and have
them deployed to GitHub Pages automatically.

A *host* repo collects many *draft* previews. You scaffold a host once, then
push any built static directory as a draft branch; a GitHub Actions workflow
publishes each branch under its own path on GitHub Pages and an index site
links them all together.

## Install

```sh
# one-off
npx @design-drafts/cli --help

# or install globally for the `design-drafts` binary
npm i -g @design-drafts/cli
```

## Commands

### `design-drafts push [path]`

Push a built static directory (default `.`) as a draft preview branch. This is
the default command, so `design-drafts ./dist` works too.

```sh
design-drafts push ./dist --repo my-org/design-previews --site-name homepage-v2
```

- `--repo <org/repo>` — the host repo to push to (remembered after the first run).
- `--site-name <name>` — branch/preview name (prompted if omitted).
- `--prefix <prefix>` — branch prefix for previews (default `drafts/`; pass `""` to push without one).

**Markdown-only folders** are rendered into a browsable site at push time:
every `.md` file becomes a GitHub-flavored html page (tables, task lists,
syntax-highlighted code, heading anchors) with a light/dark theme toggle and
Pagefind full-text search. `README.md` becomes `index.html`, and relative links
between markdown files are rewritten to the rendered pages. The sidebar mirrors
your folder layout — one collapsible group per directory, opened to wherever you
are — so a draft with `guides/` and `reference/` reads as those sections rather
than one long list. Search result links are wired to the GitHub Pages url
inferred from `--repo`. Folders that contain any `.html` are pushed as-is.

### `design-drafts build [path]`

Render a draft (default `.`) into a directory of static files — exactly the
content `push` deploys, without git, a remote, or GitHub.

```sh
design-drafts build ./my-draft --out ../my-draft-site
```

- `--out <dir>` — **required.** Where to write the built site. It must sit
  outside the draft: html left inside would make the next `preview` or `push`
  read the draft as a hand-written html one and ship this build instead. There
  is no default, because every obvious one breaks that rule.
- `--base <path>` — the absolute path the built site will be served under, which
  is what search result links resolve against. Defaults to the GitHub Pages path
  derived from `--repo` when one is configured (so `build` and `push` agree),
  otherwise `/`.
- `--force` — replace the contents of a non-empty `--out`.
- `--site-name`, `--repo`, `--prefix` — as for `push`.

The one thing it does not reproduce is the deploy workflow `push` embeds in the
branch: that is how a branch gets deployed, not part of the site, and the deploy
strips it back out before publishing.

### `design-drafts init host`

Scaffold a new GitHub repo configured to host draft previews (deploy workflow,
index site, Pages setup).

```sh
design-drafts init host --repo my-org/design-previews
```

- `--private` — create the GitHub repo as private.
- `--yes` — skip the confirmation prompt before GitHub setup.

### `design-drafts init draft [directory]`

Scaffold a new draft directory locally.

```sh
design-drafts init draft ./my-draft
```

### `design-drafts preview [path]`

Serve a work-in-progress draft directory (default `.`) over HTTP so you can view
it locally before pushing. The directory must contain a `design-drafts.config.json`.

```sh
design-drafts preview ./my-draft
```

- `--port <n>` — port to serve on (default `4321`; auto-increments to the next
  free port unless you set it explicitly).
- `--no-open` — don't open a browser, just print the URL.

Markdown drafts are rendered on the fly, so the preview matches what a push
deploys — including search: the index builds in the background while the
server comes up (the search box shows progress until it's ready) and reflects
the content at preview start; restart the preview to re-index new content.

When a requested directory has no `index.html` (e.g. a draft whose pages are
`about.html`, `pricing.html`, … with no home page yet), the server returns a
generated index linking to every page in the draft so you can navigate without
one. It wears the same chrome as a rendered page — the draft's name, the theme
toggle — and lays the pages out as the directory tree you wrote, one collapsible
folder per directory, rather than a flat list of paths. `push` and `build` bake
the same listing onto disk, since gh-pages 404s an index-less directory.

`design-drafts.config.json` is re-read on every request, so renaming the draft
or re-designating its index takes effect without a restart. Open pages are told
about the change over a small server-sent-events channel and refresh
themselves — nothing to click, and nothing of the channel is baked into a
pushed draft.

Pages reference the toolbar and annotate overlays from a CDN at a pinned
release. When a *local* build of one is installed — as
`node_modules/@design-drafts/toolbar/dist/toolbar.js` next to the draft, in
any of its ancestor directories, or next to the CLI itself — the preview
serves that build instead, rewriting the page's CDN reference on the way out.
The draft's own copy wins over the CLI's. The CLI-relative lookup is what
makes a globally linked checkout of this repo serve its freshly built
overlays for a draft in any other repo; a CLI installed from the registry
carries no overlay builds (they are devDependencies), so published installs
keep the CDN. The startup banner says when local builds are in play. The
lookup runs per request, so rebuilding an overlay mid-session takes effect on
the next reload; the files on disk keep their pinned CDN reference, and
pushed drafts are untouched.

## Configuration

Shared options (`--repo`, `--site-name`, `--template-ref`) can be supplied via
flags, the `DESIGN_DRAFTS_*` environment variables, or a JSON config file. The
`--repo` value is persisted to a per-user config after the first successful
push, so subsequent runs don't need it.

## License

MIT
