# Recommended Draft Directory Layout

A draft is just a static directory the CLI publishes verbatim. The toolbar and
the index site only know about the files listed in `draft.config.json`; nothing
walks the filesystem. So the layout below is a *convention*, not a contract —
it exists because it makes manifests boring to write and diffs easy to read.

## The shape

```
my-draft/
  draft.config.json
  index.html
  pages/
    pricing.html
    about.html
  variants/
    minimal.html
    maximal.html
  themes/
    light.html
    dark.html
  layouts/
    centered.html
    split.html
  references/
    brief.md
  shared/
    assets/
      logo.svg
    styles/
      tokens.css
```

Top-level entries map one-to-one onto the manifest's axes. `pages/` holds the
distinct *destinations* of the draft (landing, pricing, about). `variants/`,
`themes/`, and `layouts/` each hold full HTML files that represent one position
on that axis. `references/` holds the brief and any source material the agent
was given. `shared/` holds anything more than one HTML file links to.

## Why files, not components

Every entry in the manifest points at a *complete HTML file*. Not a fragment,
not a partial, not a JSON description of a component tree. The toolbar swaps
between variants by changing the iframe's `src`. That's the whole mechanism.

This is deliberate. Drafts are produced by agents writing arbitrary static
output — Vue, Svelte, hand-written HTML, a Figma export, whatever. The only
thing the toolbar can rely on is that each entry is a URL it can navigate to.
If you build your variants out of shared partials at author time, that's fine,
but the published artifact is always a flat set of HTML files.

## How the toolbar discovers entries

The toolbar reads `draft.config.json` and renders a switcher for each axis
present. It does **not** scan `variants/` looking for HTML files. A file on
disk that isn't referenced in the manifest is invisible to the toolbar — which
is useful for keeping work-in-progress around without exposing it.

Concretely, this means:

- Adding a file to `variants/` doesn't add it to the switcher. You also have
  to add it to `manifest.variants[]`.
- Renaming a file requires updating its `path` in the manifest. The CLI
  doesn't rewrite paths.
- The order of entries in the manifest is the order they appear in the
  switcher. Put the canonical version first.

## Relative paths between files

The CLI publishes the draft directory verbatim under a per-draft URL prefix.
That means `variants/minimal.html` and `pages/pricing.html` need to reach
`shared/assets/logo.svg` via relative paths that are correct *from where the
file lives*:

```html
<!-- variants/minimal.html -->
<link rel="stylesheet" href="../shared/styles/tokens.css">
<img src="../shared/assets/logo.svg" alt="">
```

```html
<!-- index.html -->
<link rel="stylesheet" href="./shared/styles/tokens.css">
<img src="./shared/assets/logo.svg" alt="">
```

Two practical consequences:

1. **Don't use absolute paths starting with `/`.** They'll resolve to the
   gh-pages root, not your draft root, and break in deployment. The schema
   rejects absolute `path` values for this reason.
2. **Use the same nesting depth for all variants.** If `variants/minimal.html`
   uses `../shared/...` then `variants/maximal.html` should too. Putting some
   variants under `variants/foo/index.html` and others under
   `variants/bar.html` means you maintain two different sets of relative
   paths. Pick one nesting depth and stick with it.

## Shared assets

Anything more than one HTML file links to should live in `shared/`. The
convention is:

- `shared/assets/` — images, fonts, SVGs, icons.
- `shared/styles/` — CSS files. Design tokens, base styles, anything you
  expect every variant to use.
- `shared/scripts/` — client-side JS shared across variants.

Variant-specific assets stay next to the variant. If `variants/maximal.html`
needs a hero illustration that no other file uses, put it in
`variants/maximal.assets/hero.png` rather than polluting `shared/`. The point
of `shared/` is "this is reused" — single-use assets next to the file that
uses them is easier to clean up later.

## What goes in `references/`

The agent's brief, any source material it was given, links to relevant ADRs
or design references. The manifest's `prompt` field can either inline the
brief or point at a file in `references/`:

```json
{
  "prompt": "references/brief.md"
}
```

`references/` is included in the published draft — reviewers can read the
brief alongside the design. If you have material you don't want published,
don't put it here; the CLI ships the directory unchanged.

## What the CLI does (and doesn't do)

The CLI is a dumb pipe. It takes the draft directory, force-pushes it to a
named branch, and a workflow rolls that branch into gh-pages under
`/<draft-name>/`. There is no build step, no template expansion, no
manifest rewriting. What you have on disk is what gets deployed.

That means:

- No `.gitignore`-style exclusions. If you don't want a file shipped, don't
  put it in the draft directory.
- No magic "index" generation. If you want `/` to work, ship `index.html`.
- No path rewriting between local and deployed. If `<a href="./pages/pricing.html">`
  works locally, it works deployed.

## Optional: when to skip an axis

You don't have to populate every axis. A draft with one variant and one theme
should just omit `variants` and `themes` from the manifest entirely — the
toolbar will only render switchers for axes that exist. Entries with a single
item are noise.

A common pattern for a quick exploration:

```
my-quick-draft/
  draft.config.json
  index.html
  variants/
    a.html
    b.html
  references/brief.md
```

Manifest declares `pages` (just one — `index.html`) and `variants`. No themes,
no layouts. Add axes when you have something to compare.

## See also

- [`packages/conventions/schemas/draft-manifest.schema.json`](../../packages/conventions/schemas/draft-manifest.schema.json) — the JSON Schema, the source of truth for what's allowed.
- [`examples/sample-draft/`](../../examples/sample-draft/) — a marketing-site exploration exercising every axis.
- [`examples/internal-tool-dashboard/`](../../examples/internal-tool-dashboard/) — an internal admin shell with data-dense vs card-driven variants.
- [`examples/docs-portal/`](../../examples/docs-portal/) — a developer docs portal exercising layout and theme axes.
