# Turnbuckle brand assets

Product identity for **Turnbuckle**. Visual guidelines live in [`brand.html`](./brand.html) —
open it in a browser. This README is the developer-facing manifest: what each file is and how to ship it.

> Two brand layers, kept apart: **Turnbuckle's** identity is crimson `#C8102E` / charcoal `#2B2D42`
> (product chrome, marketing, app icon). Each promotion themes its *own* space via the design-system
> tokens (default primary blue `#3b82f6`). Never present product crimson as a tenant brand color, and
> keep it distinct from the design system's `danger` red `#ef4444`.

## The two marks

| Asset | File | Use |
|-------|------|-----|
| **Hero mark** (ring corner) | `tb-mark.svg` / `tb-mark-dark.svg` | Pictorial mark ≥ 48px — splashes, marketing, large chrome |
| **Reduced glyph** | `tb-favicon.svg` / `tb-favicon-dark.svg` | Pictorial mark 16–32px in dense UI (not favicons — see below) |
| **Lockup** (mark + wordmark) | `tb-lockup.svg` / `tb-lockup-dark.svg` | Primary signature — headers, footers, anywhere the name fits |
| **Monogram “T”** (pad on a post) | `tb-monogram.svg` / `tb-monogram-dark.svg` | The mark distilled to a letter, no tile — inline favicons, chips |
| **Monogram tile** | `tb-tile.svg` (dark, default) · `tb-tile-light.svg` | **App icon & favicon** — reads where the pictorial mark dissolves |
| **Square tile** (full-bleed) | `tb-tile-square.svg` | Raster source for OS-masked icons; not for direct display |

`-dark` variants are for dark surfaces — the charcoal post/ropes die on dark, so swap to mist + bright crimson.

## Shippable icons (`icons/`)

Rasterised from `tb-tile-square.svg` (favicon.svg is the rounded `tb-tile.svg`):

`favicon.ico` (16/32/48) · `favicon.svg` · `favicon-16.png` · `favicon-32.png` ·
`apple-touch-icon.png` (180) · `icon-192.png` · `icon-512.png`

Drop into `<head>`:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

These are the **product** favicon/app icon (login, marketing, the product shell). Tenant-facing
admin/public views still resolve a promotion's own favicon dynamically — don't replace that wiring.

## Regenerating the raster set

Edit the source SVG, then rebuild (`rsvg-convert` + `magick` / ImageMagick):

```bash
cd .ai/turnbuckle-logos
for s in 16 32 48 180 192 512; do rsvg-convert -w $s -h $s tb-tile-square.svg -o icons/icon-$s.png; done
cp icons/icon-180.png icons/apple-touch-icon.png
cp icons/icon-16.png icons/favicon-16.png && cp icons/icon-32.png icons/favicon-32.png
magick icons/icon-16.png icons/icon-32.png icons/icon-48.png icons/favicon.ico
cp tb-tile.svg icons/favicon.svg
```
