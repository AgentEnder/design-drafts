# @design-drafts/toolbar

A framework-agnostic, single-file toolbar that lets reviewers switch between
the design choices declared in a draft's `design-drafts.config.json`.

A draft is described as a set of **axes** (e.g. `theme`, `layout`, `page`)
and a sparse list of **pages**, where each page records the axis coordinates
it represents. The toolbar renders one switcher per axis, highlights the
choices that match the page you're currently on, and auto-routes to the nearest
page when you pick a choice that wasn't drafted at the current coordinate.

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

1. Fetches `/design-drafts.config.json`. If it 404s or is malformed, the script exits
   silently — safe to ship on any page.
2. Renders an unobtrusive bar at the bottom of the viewport with one switcher
   per axis declared in the manifest. Each axis and choice is shown by its
   `label` (falling back to a humanised form of its `name`); the longer
   `description` becomes a tooltip.
3. Determines the current page by matching the URL against each page's `path`,
   then for each axis highlights the choice the current page sits on.
4. **Auto-routes sparse choices.** Picking a choice with no exact one-axis
   neighbour navigates to the nearest page that demonstrates it (the one that
   moves the fewest other axes) and notes what else changed, e.g. "also sets
   Theme → Calm". A choice is disabled only when no page uses it at all.
5. On selecting a different choice, navigates to the matching page's file.
   The current querystring is preserved so shareable URLs survive page
   switches; after an auto-route, the axes that moved briefly highlight on the
   destination page.

## Visibility

- **Hide for one page load** — append `?toolbar=0` to the URL.
- **Force-show** (clearing the session-hide flag) — append `?toolbar=1`.
- **Hide for the session** — click the × on the toolbar, or press
  **Cmd + .** (macOS) / **Ctrl + .** (everything else). The preference is
  stored in `sessionStorage`, so closing the tab resets it.

The shortcut is suppressed while typing in inputs, textareas, or
contenteditable regions.

## What it looks like

A compact bar centered along the bottom edge: a light "paper" surface with a
hairline border and a soft elevation shadow (so it reads cleanly over both light
and dark pages), system sans type, and one restrained accent on the active
selection. Each axis is a button that opens a small custom listbox; going custom
lets each choice carry a secondary "also sets …" hint for auto-routed
combinations, and the listbox implements the keyboard and ARIA behavior
(`aria-activedescendant`, arrow keys, type-ahead, Esc) a native `<select>` would
otherwise provide.

Plugins slotted into the bar (e.g. `<dd-annotations>`) inherit the bar's theme
through the `--dd-*` CSS custom properties declared on the host element.

## Build

```sh
pnpm --filter @design-drafts/toolbar build
```

The build produces a single self-executing IIFE at `dist/toolbar.js`.
