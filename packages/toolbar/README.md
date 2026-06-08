# @design-drafts/toolbar

A framework-agnostic, single-file toolbar that lets reviewers switch between
the design choices declared in a draft's `draft.config.json`.

A draft is described as a set of **axes** (e.g. `theme`, `layout`, `page`)
and a sparse list of **pages**, where each page records the axis coordinates
it represents. The toolbar renders one switcher per axis, highlights the
choices that match the page you're currently on, and disables choices that
have no matching neighbour from your current coordinate.

The toolbar is a router with a UI: every page in the manifest is a real HTML
file, and switching simply navigates to it. There is no client-side CSS
swapping and no runtime dependency on React, Vue, or any other framework.

## Usage

Drop one `<script>` tag at the bottom of every page in your draft (or in a
shared partial). The simplest option is a CDN reference — no build step, no
file to copy:

```html
<!-- Pin a major version (recommended); unpkg serves the published bundle. -->
<script src="https://unpkg.com/@design-drafts/toolbar@0/dist/toolbar.js" defer></script>

<!-- jsDelivr works too: -->
<script src="https://cdn.jsdelivr.net/npm/@design-drafts/toolbar@0/dist/toolbar.js" defer></script>
```

Or self-host by copying the bundle next to your pages and referencing it
relatively:

```html
<script src="/toolbar.js" defer></script>
```

The script:

1. Fetches `/draft.config.json`. If it 404s or is malformed, the script exits
   silently — safe to ship on any page.
2. Renders an unobtrusive bar at the bottom of the viewport with one switcher
   per axis declared in the manifest. The axis name (or its `description`) is
   the section label.
3. Determines the current page by matching the URL against each page's `path`,
   then for each axis highlights the choice the current page sits on.
4. Disables choices that have no neighbour at the current coordinates — i.e.
   when no page exists with the same coordinates except that axis flipped to
   the candidate choice. Sparse coverage is fine; you simply can't navigate
   to a combination that wasn't drafted.
5. On selecting a different choice, navigates to the matching page's file.
   The current querystring is preserved so shareable URLs survive page
   switches.

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
restrained accent color on the active selection. Each axis is a labeled
native `<select>`, which keeps keyboard and screen-reader behavior
correct without re-implementing dropdown logic.

## Build

```sh
pnpm --filter @design-drafts/toolbar build
```

The build produces a single self-executing IIFE at `dist/toolbar.js`.
