# Axes and Coordinates: the draft manifest model

A draft is a small slice of design space. You name the dimensions (**axes**),
enumerate the values each can take (**choices**), and then list the specific
points you actually built (**pages**). The toolbar reads this model from
`draft.config.json` and renders one switcher per axis; switching a choice
navigates to the page that holds that combination.

This file is the reference for two things:

1. **What makes a good axis** — used when brainstorming (`design-drafts:explore`).
2. **How to write a valid `draft.config.json`** — used when generating the draft
   (`design-drafts:variants`).

## The model in one picture

```
axes        theme: [dark, light]      layout: [split, stacked]
              │                          │
coordinates   {theme: "dark", layout: "split"}   ← one point in the grid
              │
pages         { coordinates: {...}, path: "pages/home/dark-split.html" }
```

An **axis** is a question a reviewer can answer by clicking. A **choice** is one
answer. A page's **coordinates** pin every axis to one choice. A **page** is a
real HTML file at one coordinate.

## Picking axes

An axis is a question you want a reviewer to be able to answer by clicking. Good
axes are:

- **Independent.** Switching `theme` should not change the layout. If two axes
  always co-vary, collapse them into one. Co-varying axes produce a grid full of
  combinations nobody would ever build.
- **Few in number.** Three or four axes is the practical ceiling. Beyond that the
  cartesian product gets unreadable and you stop building combinations honestly.
- **Lower-cased identifiers** matching `^[a-z][a-z0-9_-]*$`. `theme`, `layout`,
  `density`, `page`. The toolbar uses these as URL params and switcher labels.

If a draft has only one obvious dimension, use one axis. A draft with **no axes**
is also legal — that is a single-page proposal. Don't invent axes to fill space;
an axis with one choice is noise.

**The `none` choice.** When an axis is only meaningful on some pages (a hero
`variant` matters on the landing page but not on `pricing` or `about`), give it a
`none` choice. Pages where it doesn't apply use `coordinates: { variant: "none", … }`.
Every page must specify every declared axis, so `none` is how a page opts out
cleanly.

## Pages are points, not pages

`pages[]` is the list of cartesian points you actually built. Three rules follow:

1. **Coverage is sparse by default.** Axes `theme × layout × variant` =
   2×2×3 = 12 possible points; you do not have to build all 12. Build the 4–8
   that show the trade-offs you care about. The toolbar auto-routes to the
   nearest page that demonstrates a choice, and greys a choice out only when no
   page uses it at all.
2. **Every page specifies every axis.** This is enforced by the validator. It
   lets the toolbar always answer "what are this page's coordinates?" without
   guessing. Use `none` for axes that don't apply to a page.
3. **Paths are unique.** Two pages can't point at the same file. Choice-name
   values within `coordinates` must match a `name` declared on that axis.

## Sparse coverage and auto-route

The toolbar handles sparse grids by **auto-routing**. When you select a choice
that has no page at the current coordinate (same on every axis but the one you
flipped), the toolbar jumps to the *nearest* page that demonstrates that choice —
the one that forces the fewest other axes to change — and shows what else moved
("also sets Theme → Calm"). Ties break toward the closest page, then the
earliest-declared in `pages[]`, which is why the canonical combination goes
first. So a choice paired with only one value of another axis is **still
reachable**; there are no greyed-out dead ends from scattered coverage.

A choice is disabled only when **no page uses it at all**. That's the one real
trap left: declare a choice on an axis but never build a page with it, and it
shows up permanently greyed. So the rule shrinks to: **every choice must appear
on at least one page.**

Two things still make a draft nicer to review, even though they're no longer
correctness requirements:

- **Full cross** for small grids. A 2×2 or 2×3 is only four to six pages — just
  build them all, and every switch is a clean one-axis flip with no sideways
  jump.
- **Connected sparse** if you drop combinations. Keep the set connected (sweep
  one axis against a fixed baseline — a "plus sign" through the grid) rather than
  scattering far-apart corners. Auto-route still reaches the corners, but from a
  connected set each jump moves only one or two axes, so the "also sets …" hint
  stays short and the change stays legible. Scattered corners make auto-route
  rewrite several axes at once.

## The manifest shape (`draft.config.json`)

Lives at the root of the draft directory. Fields:

| field | required | shape |
|-------|----------|-------|
| `name` | ✅ | human-readable label, non-empty string |
| `pages` | ✅ | array, **at least one** `{ coordinates, path, description? }` |
| `createdAt` | ✅ | ISO 8601 timestamp (`2026-06-08T12:00:00.000Z`) |
| `axes` | optional | array of `{ name, label?, description?, choices: [{ name, label?, description? }] }` |
| `description` | optional | longer explanation of what the draft explores |
| `prompt` | optional | the brief — free text, or a path like `references/brief.md` |
| `source` | optional | `{ sha?, repo?, author? }` provenance |
| `$schema` | optional | `https://design-drafts.dev/schemas/draft-manifest.schema.json` |

Constraints worth remembering:

- **No extra keys.** The schema is `additionalProperties: false` — a stray field
  (e.g. `siteName`) makes the manifest invalid and the toolbar silently no-ops.
- **Axis names** match `^[a-z][a-z0-9_-]*$` (must start with a lowercase letter).
  **Choice names** match `^[a-z0-9][a-z0-9_-]*$` (may also start with a digit).
- **`label` vs `name` vs `description`.** `name` is the slug used in coordinates
  and URLs. `label` is the short human text the toolbar shows (e.g. `"Cinematic"`)
  — set it; without it the toolbar humanises the slug, which is only a rough
  guess. `description` is prose shown as a tooltip, never as the primary label.
- **`path` is relative**, must not start with `/`, and must not escape the draft
  root with `..`. Absolute paths break in deployment (they resolve to the site
  root, not the draft root).

### A complete example

```json
{
  "$schema": "https://design-drafts.dev/schemas/draft-manifest.schema.json",
  "name": "Threadline marketing exploration",
  "prompt": "references/brief.md",
  "axes": [
    {
      "name": "theme",
      "label": "Theme",
      "description": "Overall palette and mood",
      "choices": [
        { "name": "dark", "label": "Dark", "description": "Near-black, one warm accent" },
        { "name": "light", "label": "Light", "description": "Paper-white, ink type" }
      ]
    },
    {
      "name": "layout",
      "label": "Layout",
      "choices": [
        { "name": "split", "label": "Split" },
        { "name": "stacked", "label": "Stacked" }
      ]
    }
  ],
  "pages": [
    { "coordinates": { "theme": "dark", "layout": "split" }, "path": "pages/home/dark-split.html" },
    { "coordinates": { "theme": "dark", "layout": "stacked" }, "path": "pages/home/dark-stacked.html" },
    { "coordinates": { "theme": "light", "layout": "split" }, "path": "pages/home/light-split.html" }
  ],
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

This is sparse on purpose: `theme:light × layout:stacked` was not built. Both
its choices still appear elsewhere, so selecting `stacked` from `light-split`
auto-routes to `dark-stacked` (and notes "also sets Theme → Dark"). The first
entry in `pages[]` is the default the toolbar loads on a fresh visit, and the
tie-breaker when a choice is reachable from several pages — put the canonical
combination first.

### The smallest legal manifest

A single-page proposal with no axes:

```json
{
  "name": "Quick test",
  "pages": [{ "coordinates": {}, "path": "index.html" }],
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

## On-disk convention

The schema lets `path` be any relative HTML file under the draft root. The
recommended layout:

```
my-draft/
  draft.config.json
  pages/
    <page>/
      <other-coords-joined-with-dash>.html
  references/
    brief.md
  shared/
    assets/      # images, fonts, SVGs
    styles/      # CSS, design tokens
    scripts/     # shared client JS
```

So `{ page: "landing", theme: "dark", layout: "split" }` lives at
`pages/landing/dark-split.html`. Two reasons the convention matters even though
the schema doesn't enforce it:

- **Reviewer comprehension.** When the path mirrors the coordinates, a stale link
  in review still tells you which combination you're looking at.
- **`grep`-ability.** "Show me every dark landing variant" becomes
  `ls pages/landing/*dark*` instead of cross-referencing the manifest.

If the convention doesn't fit (one axis, per-page directories feel heavy), put
files at the top level and reference them directly. The validator only cares that
the path resolves.

## Why complete HTML files, not components

Every `pages[]` entry points at a **complete HTML file** — not a fragment, not a
component tree. The toolbar swaps coordinates by changing the iframe `src`; a URL
it can navigate to is the only thing it relies on. Build your pages from shared
partials at author time if you like, but the published artifact is always a flat
set of HTML files.

## Relative paths between files

The draft directory is published verbatim under a per-draft URL prefix. A file at
`pages/landing/dark-split.html` reaches `shared/styles/tokens.css` via
`../../shared/styles/tokens.css`. Two consequences:

1. **No absolute paths** starting with `/` — they resolve to the deploy root, not
   the draft root, and break. The schema rejects absolute `path` values.
2. **Keep all pages at the same nesting depth.** If every page is
   `pages/<page>/<combo>.html`, every page uses `../../shared/…` and the CSS link
   is a copy-paste. Mixing depths means maintaining two sets of relative paths.
