# @design-drafts/markdown-site

Renders a markdown-only draft directory into a themed static site: one
GitHub-flavored html page per `.md` file, light/dark theme, collapsible
sections, per-page table of contents, and Pagefind full-text search.

## Architecture

This package is **private and never published** — it is built with vite and
its built output is bundled into `@design-drafts/cli` by tsdown.

Two vite builds plus a declaration emit (`pnpm build`):

1. **Client** (`vite.client.config.ts`): `src/client/` — typed browser modules
   (theme toggle, collapsible sections, toc scroll-spy, spotlight search) plus
   the stylesheets — bundled and minified to `dist/client/page.js` (IIFE) and
   `dist/client/page.css`, since every rendered page inlines a copy. Tests
   asserting on the inlined chrome must use minification-stable tokens
   (string literals, property/global names — never whitespace-sensitive
   expressions).
2. **Node** (`vite.node.config.ts`): `src/node/` — the markdown renderer and a
   Preact-rendered page shell (`page.tsx`, via `preact-render-to-string`) that
   inlines the built client assets with vite's native `?raw` imports — bundled
   to `dist/node/index.js`. preact and `@design-drafts/conventions` are
   bundled in; `marked`, `highlight.js`, and `pagefind` stay external.
3. `tsc -p tsconfig.types.json` emits the public API's `.d.ts` to
   `dist/types/`.

The client chrome ships as one bundle inlined into every page; each behavior
activates only when its markup is present (no toc rail → no scroll-spy, no
search dialog → no pagefind loading).

Tests exercise `src/node/` directly but read the **built** client assets, so
the `test` target depends on `build` (wired via nx).

## ⚠️ Dependency rule

`dist/node/index.js` keeps `marked`, `marked-highlight`, `highlight.js`, and
`pagefind` (a native binary that can never be bundled) as external imports.
Because the CLI bundles this dist, those packages **must also be declared in
`packages/cli/package.json` `dependencies`**, or the published CLI will crash
with `ERR_MODULE_NOT_FOUND` on users' machines while working fine in this
repo.
