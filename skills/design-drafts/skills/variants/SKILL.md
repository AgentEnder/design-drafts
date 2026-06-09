---
name: design-drafts:variants
description: Generate an actual design draft — semantic, multi-page HTML plus a valid `draft.config.json` — from a `references/brief.md` (and the references gathered alongside it). Reads the brief, the annotated `links.md`, and the `inspiration/` screenshots, plans a small set of axes and pages, and writes complete HTML files wired to the toolbar and annotate overlays. Use when a draft directory has a `references/brief.md` but no pages yet, when the user says "build the draft", "generate the variants", "turn the brief into pages", "make the draft from this brief", or when `design-drafts:brief` has just finished and the user wants the actual design. Do NOT use to write the brief itself — that is `design-drafts:brief`.
---

# design-drafts:variants

You turn a brief into a real, reviewable design draft: a handful of complete
HTML pages across a small set of axes, plus a valid `draft.config.json` the
toolbar can read. This is the step that produces the thing reviewers look at.

Two rules govern everything below:

1. **The brief is the source of truth.** Every design decision should trace back
   to `references/brief.md` or the references beside it. If the brief says `TBD`
   on something you need, ask — do not invent a plausible answer and bury it in
   markup.
2. **Avoid the median draft — and reach past it.** Dodging the anti-pattern
   catalog is necessary but not sufficient: a page can avoid every named trope
   and still be flavorless. So treat the catalog as the floor, not the goal. For
   the actual visual craft — type pairing, color with intent, asymmetry, real
   hierarchy — lean on the `frontend-design` skill if it's available; it exists
   precisely to produce distinctive, non-generic interfaces. Your job is to wire
   that craft to the brief and the manifest. A draft that hits three anti-patterns
   wasted the brief; a draft that hits zero and is still forgettable wasted the
   references.

## Before you start

1. **Confirm the working directory.** Find `draft.config.json` in the draft
   directory (the cwd, or a path the user names). If there is no draft directory
   yet, scaffold one with `design-drafts init draft <dir>` — it writes a valid
   starter `draft.config.json` and an `index.html` already wired to the overlays.
   You will rewrite both as you generate.

2. **Require a brief.** Read `references/brief.md`. If it is missing, stop and
   say: "There's no brief here yet. Run `design-drafts:brief` first so I'm
   building from your decisions instead of guessing." Do not generate from a
   premise you invented. The minimum viable brief is four things: who it's for,
   what it's doing, what it must not look like, and a sentence or two of voice —
   if even that is absent, go back to the brief skill.

3. **Read the references.** These ground the design in specifics:
   - `references/links.md` — annotated URLs. The annotation says *what* is being
     cited ("density of the long list, NOT the indigo accent"). Honor the
     negative annotations as hard as the positive ones.
   - `references/inspiration/*` — screenshots. The filename is the citation
     (`linear-empty-state-density.png` is being cited for density, not color).
   - Do **not** read `references/explore.md`. That is working material for the
     brief skill; the brief already folded its picks in. Reading it risks
     reviving directions the user walked away from.

4. **Read the bundled references once, silently.** They ship with this plugin:
   - `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` — the catalog of defaults
     to steer away from. Cite entries by number when you make a choice that
     dodges one ("asymmetric hero to avoid #6").
   - `${CLAUDE_PLUGIN_ROOT}/reference/axes-and-coordinates.md` — the manifest
     model: what makes a good axis, how `pages[]` and `coordinates` work, the
     on-disk layout, and the exact `draft.config.json` shape. You will follow
     this when writing the manifest.
   - `${CLAUDE_PLUGIN_ROOT}/reference/references-protocol.md` — the authority on
     what lives in `references/`: what `links.md` annotations mean, why
     `explore.md` is off-limits to this skill, and the filename-as-citation rule
     for `inspiration/`.

## Plan before you generate

Do not start writing HTML cold. Produce a short plan and confirm it with the
user first — generating eight pages they didn't want is expensive to undo.

1. **Derive the axes** from the brief's picks. An axis is a question a reviewer
   answers by clicking (theme, layout, density, hero `variant`, …). Keep it to
   **one to three axes**. They must be independent — if `theme` and `layout`
   always co-vary, they are one axis. Use lowercase identifiers. A draft with no
   axis worth comparing is a legal single-page draft; don't invent axes to fill
   space.

2. **Decide what "multi-page" means here.** Two shapes, often combined:
   - **A variant grid** — the same page (say the landing page) realized across
     `theme × layout` so a reviewer can compare directions.
   - **A multi-section site** — distinct pages (home, pricing, about) modelled
     with a `page` axis whose choices are the section names. Axes that don't
     apply to a given section take a `none` choice (see
     `${CLAUDE_PLUGIN_ROOT}/reference/axes-and-coordinates.md`).
   Most drafts are one or the other; some are both (a `page` axis crossed with a
   `theme` axis). Pick the shape the brief actually calls for.

3. **Each variant must be a real alternative.** A coordinate is worth a file only
   if a reviewer could defensibly pick it over its neighbour. `theme: [dark, light]`
   that's a pure color-swap, or `layout: [split, stacked]` that's a trivial
   reflow, is fake variance — collapse it. Differences should be substantive
   enough to argue about.

4. **Choose the page set.** `pages[]` is the cartesian points you actually build,
   and coverage is sparse by default. Pick the **4–8 combinations that show the
   trade-offs the brief cares about**, not the full grid. Put the canonical
   combination first — it's the toolbar's default on a fresh visit.

5. **State the plan back:** "Two axes — `theme` (dark, light) and `layout`
   (split, stacked) — and I'll build four of the four combinations for the
   landing page. Dark-split loads first. Sound right?" Adjust on their feedback.

## Authoring the pages

Each entry in `pages[]` is a **complete, standalone HTML file**. Quality lives
here.

### Structure and semantics

- Use real semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`,
  `<article>`, `<footer>`, a single `<h1>` per page with a sane heading
  hierarchy, `<button>` for actions, `<figure>`/`<figcaption>` for media.
- Write **real content from the brief** — the actual audience, the actual value,
  the voice the brief specified. No lorem ipsum, no "Empower your team to…"
  filler. If you're tempted to write placeholder copy, you're missing a brief
  answer — ask for it.
- Accessibility is part of "high quality": alt text on images, labelled form
  controls, sufficient contrast, focus styles, `lang` on `<html>`.

### Visual craft and imagery

- If `frontend-design` is available, use it for the look — type scale, palette,
  spacing rhythm, the distinctive moves. This skill owns the brief, the axes, and
  the manifest; let the design skill own the craft.
- Ground the visuals in `inspiration/`: the screenshots are reference, not
  clip-art. Borrow the *quality being cited* (a typographic pairing, a density, a
  rhythm) — do not paste the images into the page.
- For imagery the page genuinely needs (hero, illustration), prefer real assets
  in `shared/assets/` or honest CSS/SVG art over decorative stock and AI-tile
  icons (anti-patterns #4, #9). A placeholder image is the visual equivalent of
  lorem ipsum — if you need one, you're missing a brief answer.

### Annotation-ready markup

Reviewers comment on this draft via the annotate overlay, which anchors comments
to a stable selector. Help it:

- Put a `data-annotate-id="<stable-name>"` on each major block (`hero`,
  `feature-list`, `pricing`, `footer`, …). Stable ids survive the small DOM
  changes between draft iterations, so comments don't go stale.
- Prefer meaningful `id`s and semantic structure over `<div>` soup — the
  overlay's fallbacks (heading text, structural path) work far better on a
  well-structured page.

### Wire the overlays on every page

Every page must load the toolbar (axis switcher) and annotate (review overlay).
Put these at the end of `<body>`, exactly as the scaffold does:

```html
<script src="https://unpkg.com/@design-drafts/toolbar@0/dist/toolbar.js" defer></script>
<script src="https://unpkg.com/@design-drafts/annotate@0/dist/annotate.js" defer></script>
```

A page missing the toolbar script can't be switched away from; a page missing
annotate can't be reviewed. Both are inert until needed, so they're safe on
every page.

### Layout on disk

Follow the convention in `${CLAUDE_PLUGIN_ROOT}/reference/axes-and-coordinates.md`:

```
my-draft/
  draft.config.json
  pages/<page>/<combo>.html      # e.g. pages/home/dark-split.html
  shared/styles/tokens.css       # CSS every page links
  shared/assets/...              # shared images, fonts
```

- Keep every page at the **same nesting depth** so the relative link to
  `shared/` (`../../shared/styles/tokens.css`) is copy-paste identical.
- **Never use absolute paths** (`/styles/...`) — they break once the draft is
  deployed under a sub-path. The manifest schema rejects them.
- Share what's reused (tokens, base styles) in `shared/`; keep single-use assets
  next to the page that uses them.

## Writing `draft.config.json`

Write a manifest that validates against the schema (see
`${CLAUDE_PLUGIN_ROOT}/reference/axes-and-coordinates.md` for the full shape). It
must have:

- `name` — the draft's human-readable label (not `siteName`; that field is not
  in the schema and makes the manifest invalid).
- `axes` — each `{ name, description?, choices: [{ name, description? }] }`.
- `pages` — one entry per file you built, each with `coordinates` (a choice per
  declared axis — use a `none` choice for axes that don't apply to a page) and a
  relative `path`. The first entry is the default.
- `prompt` — set to `"references/brief.md"` so the provenance points back at the
  brief.
- `createdAt` — an ISO 8601 timestamp. Use the actual current time (e.g.
  `date -u +%Y-%m-%dT%H:%M:%S.000Z`), not the literal from the example below.

Example:

```json
{
  "$schema": "https://design-drafts.dev/schemas/draft-manifest.schema.json",
  "name": "Threadline landing exploration",
  "prompt": "references/brief.md",
  "axes": [
    { "name": "theme", "choices": [{ "name": "dark" }, { "name": "light" }] },
    { "name": "layout", "choices": [{ "name": "split" }, { "name": "stacked" }] }
  ],
  "pages": [
    { "coordinates": { "theme": "dark", "layout": "split" }, "path": "pages/home/dark-split.html" },
    { "coordinates": { "theme": "dark", "layout": "stacked" }, "path": "pages/home/dark-stacked.html" },
    { "coordinates": { "theme": "light", "layout": "split" }, "path": "pages/home/light-split.html" },
    { "coordinates": { "theme": "light", "layout": "stacked" }, "path": "pages/home/light-stacked.html" }
  ],
  "createdAt": "2026-06-08T12:00:00.000Z"
}
```

## Verify before you hand off

Walk this list before telling the user you're done. Two quiet failure modes to
catch here: an **invalid manifest** makes the toolbar silently no-op (it looks
like the toolbar just never appears), and a **manifest path with no file behind
it** validates fine but 404s in the frame when a reviewer switches to it.

1. **Every `path` exists** on disk and resolves relative to the draft root. (The
   schema validator does not check the filesystem — this one is on you.)
2. **Coordinates are consistent** — every page specifies every declared axis, and
   each value matches a `choice.name` on that axis.
3. **Default first** — `pages[0]` is the combination you want to load on a fresh
   visit.
4. **Overlays present** — every page ends with both the toolbar and annotate
   `<script>` tags.
5. **No anti-patterns shipped** — re-read the page against the catalog. If it
   reads like the median landing page, it failed the brief.
6. **No absolute paths**, consistent nesting depth, real content (no filler).

## After generating

1. Summarize what you built: "Four pages across `theme × layout`, dark-split is
   the default, shared tokens in `shared/styles/`. Manifest written and validated."
2. Print the next step exactly as: `` Next: run `design-drafts` from this
   directory to publish a preview branch. ``
3. Do not run the publish command yourself unless the user asks — they may want
   to review locally first.

## Anti-patterns for this skill itself

- **Generating without a brief.** If you find yourself inventing the audience or
  the voice, stop — that's the brief skill's job. Build from decisions, not
  guesses.
- **Cartesian explosion.** Building all 12 of a 2×2×3 grid because you can.
  Sparse coverage of the meaningful combinations beats exhaustive coverage of
  combinations nobody asked about.
- **Lorem / filler copy.** Placeholder text means a missing brief answer. Ask for
  it instead of papering over it.
- **Forgetting the overlays.** A page without the toolbar/annotate scripts can't
  be switched or reviewed. Put both on every page.
- **An invalid manifest.** `siteName` instead of `name`, a missing `pages`, a
  coordinate that names an undeclared choice — any of these makes the toolbar
  silently disappear. Validate.
- **Absolute paths.** `/shared/styles/tokens.css` works locally and breaks in
  deployment. Always relative.
- **Inventing axes to look thorough.** An axis with one choice, or two axes that
  co-vary, is noise. Fewer real axes beat more fake ones.
- **Shipping the anti-pattern catalog.** Indigo-violet hero, three-column feature
  grid, "Built for modern teams." If the draft converges on these, the references
  weren't used.

## See also

- `design-drafts:brief` — the upstream skill. Writes the `references/brief.md`
  this skill consumes.
- `design-drafts:explore` — the brainstorm before the brief. Not read by this
  skill, but it's where the axes were first proposed.
- `${CLAUDE_PLUGIN_ROOT}/reference/axes-and-coordinates.md` — the manifest model
  and `draft.config.json` shape. Follow it when writing the manifest.
- `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` — the catalog to steer away
  from, cited by entry number.
- `${CLAUDE_PLUGIN_ROOT}/reference/references-protocol.md` — what lives in
  `references/` and which files this skill reads.
