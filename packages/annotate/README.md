# @design-drafts/annotate

Framework-agnostic annotation overlay for static draft previews. Reviewers
hover semantic blocks, click to leave a comment, and the overlay anchors
the comment to a stable selector so it survives minor DOM changes between
draft iterations.

## Usage

Drop the bundle into the host page via a CDN reference — no build step, no
file to copy:

```html
<!-- Pin a major version (recommended); unpkg serves the published bundle. -->
<script src="https://unpkg.com/@design-drafts/annotate@0/dist/annotate.js" defer></script>

<!-- jsDelivr works too: -->
<script src="https://cdn.jsdelivr.net/npm/@design-drafts/annotate@0/dist/annotate.js" defer></script>
```

Or self-host by copying the built bundle next to your pages:

```html
<script src="/path/to/annotate.js" defer></script>
```

The script is inert by default. To activate the overlay:

- append `?annotate=1` to the URL, or
- click the **Annotate** toggle in the top-right corner, or
- call `window.DesignDraftsAnnotate.activate()` from another script.

When active, hovering an element outlines the nearest semantic block
(heading, section, button, image, paragraph, …). Clicking pins a comment.
Comments live in the right-side drawer and can be edited or deleted.

## Persistence

Annotations are stored in `localStorage` under
`dd:annotate:<page-url>` (the URL is normalized to drop the `annotate` and
`toolbar` query params and any hash so the same page renders the same
annotations across toggle states).

### Security note

`localStorage` is shared with **every** script that runs on the same
origin, including any script the draft itself ships. A malicious or buggy
draft could read or modify annotations. Don't use this overlay to capture
sensitive feedback. The intended use is informal review of trusted draft
previews.

## Selector strategy

Annotations are anchored to a `SelectorBundle` with four layered fallbacks:

1. `data-annotate-id` on the element (author opt-in).
2. The element's `id`, if it doesn't look framework-generated.
3. Nearest heading text plus an offset within the page.
4. Structural CSS path with `nth-of-type`.

At resolve time the bundle is tried 1 → 4; the panel marks an annotation
as **stale** if every strategy fails (typically because the page was
restructured).

## Coexistence with other overlays

The overlay mounts a Shadow DOM host at `z-index: 2147483100` (one notch
above the toolbar package's reserved band). It uses `pointer-events: none`
on the host and only opts specific UI surfaces (panel, pins, composer)
into pointer events, so it doesn't intercept regular page clicks unless
the picker is actively listening.

## Build

```sh
pnpm exec nx build annotate
```

Outputs a single IIFE bundle to `dist/annotate.js`.
