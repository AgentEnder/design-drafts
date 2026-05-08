# @design-drafts/toolbar

A framework-agnostic, single-file toolbar that lets reviewers switch between
the pages, variants, themes, and layouts declared in a draft's
`draft.config.json`.

The toolbar is a router with a UI: every entry in the manifest is a real HTML
file, and switching simply navigates to it. There is no client-side CSS
swapping and no runtime dependency on React, Vue, or any other framework.

## Usage

Drop one `<script>` tag at the bottom of every page in your draft (or in a
shared partial):

```html
<script src="/toolbar.js" defer></script>
```

The script:

1. Fetches `/draft.config.json`. If it 404s, the script exits silently — safe
   to ship on any page.
2. Renders an unobtrusive bar at the bottom of the viewport with switchers
   for the sections present in the manifest.
3. Clicking an entry navigates to that file. The current querystring is
   preserved so shareable URLs survive page switches.

## Visibility

- **Hide for one page load** — append `?toolbar=0` to the URL.
- **Force-show** (clearing the session-hide flag) — append `?toolbar=1`.
- **Hide for the session** — click the × on the toolbar, or press
  **Cmd + .** (macOS) / **Ctrl + .** (everything else). The preference is
  stored in `sessionStorage`, so closing the tab resets it.

The shortcut is suppressed while typing in inputs, textareas, or
contenteditable regions.

## What it looks like

A single 44-pixel-tall bar centered along the bottom edge with a thin
hairline border, solid near-black surface (no backdrop blur), and one
restrained accent color on the active selection. Each section is a labeled
native `<select>`, which keeps keyboard and screen-reader behavior
correct without re-implementing dropdown logic.

## Build

```sh
pnpm --filter @design-drafts/toolbar build
```

The build produces a single self-executing IIFE at `dist/toolbar.js`.
