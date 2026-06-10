# Toolbar demo

A tiny, local-only draft for iterating on the `@design-drafts/toolbar` and
`@design-drafts/annotate` overlays. The pages load the **built workspace
packages** (not the CDN) so you can see your local changes:

```html
<script src="./node_modules/@design-drafts/toolbar/dist/toolbar.js" defer></script>
<script src="./node_modules/@design-drafts/annotate/dist/annotate.js" defer></script>
```

`node_modules/@design-drafts/*` are pnpm workspace symlinks into `packages/*`,
so they always point at the current source — you just need to rebuild.

## Run it

```sh
# 1. build the packages you're iterating on (from the repo root)
pnpm --filter @design-drafts/toolbar build
pnpm --filter @design-drafts/annotate build

# 2. serve this directory (design-drafts.config.json must be at the served root)
node packages/cli/bin.js preview demo
# …or any static server rooted in demo/, e.g. `python3 -m http.server` from here
```

Then refresh the browser after each rebuild.

## What it exercises

- **Light/paper bar over light *and* dark pages** — `bold-photo.html` is dark on
  purpose, to check the bar's contrast and elevation.
- **Short labels** — every axis/choice has a human `label` plus a longer
  `description` (the thing that used to overflow the bar).
- **Sparse auto-route** — the `media` axis only has an `illustration` page under
  the `calm` theme. From `bold-photo` / `editorial-photo`, choosing
  *Media → Illustration* has no one-axis neighbour, so it must auto-route to
  `calm-illustration.html` and also flip *Theme → Calm*.
