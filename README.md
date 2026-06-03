# Turnbuckle brand assets

Product identity for **Turnbuckle**. Visual guidelines live in [`index.html`](./index.html) —
open it in a browser (`pnpm nx preview brand-guidelines`). This README is the developer-facing
manifest: what each file is and how to ship it.

> Two brand layers, kept apart: **Turnbuckle's** identity is crimson `#C8102E` / charcoal `#2B2D42`
> (product chrome, marketing, app icon). Each promotion themes its *own* space via the design-system
> tokens (default primary blue `#3b82f6`). Never present product crimson as a tenant brand color, and
> keep it distinct from the design system's `danger` red `#ef4444`.

## Layout

All assets live under `icons/<asset>/<size>-<variant>.<fmt>` — `<size>` is `vector` for SVGs and the
pixel size for rasters; `<variant>` is `light` / `dark` (plus `square` for the full-bleed raster source).

| Asset | Files | Use |
|-------|-------|-----|
| **Hero mark** (ring corner) | `icons/mark/vector-{light,dark}.svg` | ≥ 48px — splashes, marketing, large chrome |
| **Reduced glyph** | `icons/glyph/vector-{light,dark}.svg` | 16–32px in dense UI that already has a surface behind it |
| **Lockup** (mark + wordmark) | `icons/lockup/vector-{light,dark}.svg` | Primary signature — headers, footers, anywhere the name fits |
| **Favicon/app-icon tile** | `icons/tile/vector-dark.svg` (default) · `vector-light.svg` | The same glyph seated on a charcoal tile for the favicon/app-icon slot |
| **Square tile** (full-bleed) | `icons/tile/vector-square.svg` | Raster source for OS-masked icons; not for direct display |

`-dark` variants are for dark surfaces — the charcoal post/ropes die on dark, so swap to mist + bright crimson.

The tile is **not a separate mark** — it's the corner mark shrunk onto a square because the browser requires a favicon
and the bare glyph mushes at 16px. It's never seen alone (a tab title / app label is always adjacent), so it isn't
optimised for standalone legibility.

## Shippable icons (`icons/tile/`)

Rasterised from `vector-square.svg`:

`multi-dark.ico` (16/32/48) · `16-dark.png` · `32-dark.png` · `48-dark.png` ·
`180-dark.png` · `192-dark.png` · `512-dark.png`

Drop into `<head>`:

```html
<link rel="icon" href="/icons/tile/multi-dark.ico" sizes="any">
<link rel="icon" href="/icons/tile/vector-dark.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/tile/180-dark.png">
<link rel="manifest" href="/site.webmanifest">
```

These are the **product** favicon/app icon (login, marketing, the product shell). Tenant-facing
admin/public views still resolve a promotion's own favicon dynamically — don't replace that wiring.

## Nx project

This folder is the `brand-guidelines` Nx project. Targets:

```bash
pnpm nx regenerate-icons brand-guidelines   # rebuild icons/tile/ rasters from the vector source
pnpm nx build brand-guidelines               # alias — runs regenerate-icons
pnpm nx preview brand-guidelines             # open index.html in a browser (macOS)
```

## Regenerating the raster set

Whenever you edit `icons/tile/vector-square.svg`, rebuild the committed raster set so the shipped
favicons match. The recipe lives in [`scripts/regenerate-icons.sh`](./scripts/regenerate-icons.sh)
(the single source of truth — the Nx target just calls it):

```bash
pnpm nx regenerate-icons brand-guidelines
```

Requires `rsvg-convert` (librsvg) + `magick` (ImageMagick) — `brew install librsvg imagemagick`.
