# Recommended Draft Directory Layout

A draft is just a static directory the CLI publishes verbatim. The toolbar and
the index site only know about the files listed in `draft.config.json`; nothing
walks the filesystem. So the layout below is a *convention*, not a contract —
it exists because it makes manifests boring to write and diffs easy to read.

## Axes and pages: the manifest model

A draft is a small slice of design space. You name the dimensions (axes), enumerate the values they can take (choices), and then list the specific points (pages) you actually built.

```ts
type Axis    = { name: string; choices: { name: string }[] };
type Page    = { coordinates: Record<string, string>; path: string };
type Manifest = { axes?: Axis[]; pages: Page[]; ... };
```

There is no implicit grouping by directory. A page at `pages/landing/bold-dark-split.html` has nothing to do with the directory name `landing` — what makes it the landing page is `coordinates.page === "landing"`. The directory layout below is just a tidy place to put the files.

## Picking axes

An axis is a question you want a reviewer to be able to answer by clicking. Good axes are:

- **Independent.** Switching `theme` should not change the layout. If two axes always co-vary, collapse them into one.
- **Few in number.** Three or four axes is the practical ceiling. Beyond that the cartesian gets unreadable and you stop building combinations honestly.
- **Lower-cased identifiers.** `theme`, `layout`, `density`, `page`. The toolbar uses these as URL params and switcher labels.

If a draft only has one obvious dimension, just use one axis. A draft with no axes is also legal — that's a single-page proposal. Don't invent axes to fill space; entries with one choice are noise.

A pattern worth knowing: when an axis is only meaningful on some pages (a hero `variant` only matters on the landing page, not on `pricing` or `about`), give it a `none` choice. Pages where the axis doesn't apply use `coordinates: { variant: "none", ... }`. The validator requires every page to specify every declared axis, so `none` is how you opt out cleanly.

## Pages are points, not pages

`pages[]` is the list of cartesian points you actually built. Each entry pins every axis to a specific choice and points at one HTML file. Three things follow from that:

1. **Coverage is sparse by default.** A draft with axes `theme × layout × variant` has 2×2×3 = 12 possible points; you do not have to build all 12. Build the 4–8 that show off the trade-offs you care about. The toolbar greys out switcher choices that have no neighbour from the current coordinate.
2. **Every page must specify every axis.** This is enforced by the validator, not just etiquette. It means the toolbar can always answer "what are this page's coordinates?" without guessing.
3. **Paths are unique.** Two pages can't both point at `pages/landing/foo.html`. If you want two coordinates to share a file, just pick one and skip the other.

## On-disk convention

The schema lets `path` be any relative HTML file under the draft root. The recommended convention is:

```
my-draft/
  draft.config.json
  pages/
    <page>/
      <other-coords-joined-with-dash>.html
  references/
    brief.md
  shared/
    assets/
      logo.svg
    styles/
      tokens.css
```

So `{ page: "landing", theme: "dark", layout: "split", variant: "bold-hero" }` lives at `pages/landing/bold-hero-dark-split.html`. The leading `pages/<page>/` makes per-page diffs easy to read; the rest of the coordinates collapse into the filename in the order they appear in `axes[]`.

Two reasons this convention matters even though the schema doesn't enforce it:

- **Reviewer comprehension.** When the file path mirrors the coordinates, a stale link in code review still tells you what page you're looking at.
- **`grep`-ability.** "Show me every dark-mode landing variant" becomes `ls pages/landing/*-dark-*` instead of cross-referencing the manifest.

If the convention doesn't fit — for example, if you only have one axis and the per-page directory feels heavy — just put files at the top level and reference them directly. The validator only cares that the path resolves.

## Why files, not components

Every entry in the manifest points at a *complete HTML file*. Not a fragment, not a partial, not a JSON description of a component tree. The toolbar swaps between coordinates by changing the iframe's `src`. That's the whole mechanism.

This is deliberate. Drafts are produced by agents writing arbitrary static output — Vue, Svelte, hand-written HTML, a Figma export, whatever. The only thing the toolbar can rely on is that each entry is a URL it can navigate to. If you build your pages out of shared partials at author time, that's fine, but the published artifact is always a flat set of HTML files.

## How the toolbar discovers entries

The toolbar reads `draft.config.json` and renders one switcher per axis. It does **not** scan `pages/` looking for HTML files. A file on disk that isn't referenced in the manifest is invisible to the toolbar — which is useful for keeping work-in-progress around without exposing it.

Concretely:

- Adding a file under `pages/` doesn't add it to the switcher. You also have to add an entry to `manifest.pages[]` with its coordinates.
- Renaming a file requires updating its `path` in the manifest. The CLI doesn't rewrite paths.
- The order of entries in `pages[]` is the order the toolbar picks defaults from. Put the canonical combination first so it's the one that loads on a fresh visit.

## Relative paths between files

The CLI publishes the draft directory verbatim under a per-draft URL prefix. That means a file at `pages/landing/bold-dark-split.html` reaches `shared/styles/tokens.css` via `../../shared/styles/tokens.css`. Two consequences:

1. **Don't use absolute paths starting with `/`.** They'll resolve to the gh-pages root, not your draft root, and break in deployment. The schema rejects absolute `path` values for this reason.
2. **Use the same nesting depth for all pages.** If you put every page under `pages/<page>/<combo>.html` then every page uses `../../shared/...` and your CSS link is a copy-paste. Mixing depths means you maintain two different sets of relative paths.

## Shared assets

Anything more than one HTML file links to should live in `shared/`. The convention is:

- `shared/assets/` — images, fonts, SVGs, icons.
- `shared/styles/` — CSS files. Design tokens, base styles, anything you expect every page to use.
- `shared/scripts/` — client-side JS shared across pages.

Page-specific assets stay next to the page. If `pages/landing/product-dark-split.html` needs a hero illustration that no other file uses, put it in `pages/landing/product-dark-split.assets/hero.png` rather than polluting `shared/`. The point of `shared/` is "this is reused" — single-use assets next to the file that uses them are easier to clean up later.

## What goes in `references/`

The agent's brief, any source material it was given, links to relevant ADRs or design references. The manifest's `prompt` field can either inline the brief or point at a file in `references/`:

```json
{
  "prompt": "references/brief.md"
}
```

`references/` is included in the published draft — reviewers can read the brief alongside the design. If you have material you don't want published, don't put it here; the CLI ships the directory unchanged.

## What the CLI does (and doesn't do)

The CLI is a dumb pipe. It takes the draft directory, force-pushes it to a named branch, and a workflow rolls that branch into gh-pages under `/<draft-name>/`. There is no build step, no template expansion, no manifest rewriting. What you have on disk is what gets deployed.

That means:

- No `.gitignore`-style exclusions. If you don't want a file shipped, don't put it in the draft directory.
- No magic "index" generation. The toolbar picks a default page from `pages[0]`; if you want `/` itself to work standalone, ship an `index.html` and reference it from a page entry.
- No path rewriting between local and deployed. If `<a href="../api/none-paper-three-pane.html">` works locally, it works deployed.

## Optional: a single-axis draft

A quick exploration with one axis and a handful of choices:

```
my-quick-draft/
  draft.config.json
  pages/
    home/
      a.html
      b.html
  references/brief.md
```

```json
{
  "axes": [
    { "name": "variant", "choices": [{ "name": "a" }, { "name": "b" }] }
  ],
  "pages": [
    { "coordinates": { "variant": "a" }, "path": "pages/home/a.html" },
    { "coordinates": { "variant": "b" }, "path": "pages/home/b.html" }
  ]
}
```

No themes, no layouts, no `page` axis. Add axes when you have something to compare. A two-choice axis is the smallest unit that benefits from this whole setup.

## See also

- [`packages/conventions/schemas/draft-manifest.schema.json`](../../packages/conventions/schemas/draft-manifest.schema.json) — the JSON Schema, the source of truth for what's allowed.
- [`examples/sample-draft/`](../../examples/sample-draft/) — a marketing-site exploration over `page × variant × theme × layout`.
- [`examples/internal-tool-dashboard/`](../../examples/internal-tool-dashboard/) — an internal admin shell with `none`-coded variant axes.
- [`examples/docs-portal/`](../../examples/docs-portal/) — a docs portal with sparse coverage across `page × variant × theme × layout`.
