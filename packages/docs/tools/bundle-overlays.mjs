// Point the built docs at this repo's overlay bundles instead of the CDN.
//
// A rendered page loads the toolbar and annotate overlays from unpkg, which
// serves the last published release. That is right for a consumer's draft: it
// gets a version that exists, without a build step. It is wrong for these
// docs, which are the one site that has to show what this repo currently does
// — otherwise the docs demonstrate the previous release, and every overlay
// change looks broken until it ships.
//
// So this runs after `design-drafts build` and swaps the CDN URLs for copies
// of the workspace bundles, leaving the docs self-contained. Nothing here
// touches the renderer, so no consumer path changes.
//
// It is deliberately loud. A silent no-op here republishes the docs still
// pointing at the CDN, which is the failure it exists to prevent.

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, join, posix, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '..', 'dist');
/** Where the copies land, relative to `dist`. */
const OVERLAY_DIR = 'overlays';

/** Each overlay: the CDN URL a rendered page carries, and the workspace build
 * that replaces it. Keyed by the file name the copy takes. */
const OVERLAYS = [
  {
    file: 'annotate.js',
    url: 'https://unpkg.com/@design-drafts/annotate@0/dist/annotate.js',
    built: resolve(here, '..', '..', 'annotate', 'dist', 'annotate.js'),
  },
  {
    file: 'toolbar.js',
    url: 'https://unpkg.com/@design-drafts/toolbar@0/dist/toolbar.js',
    built: resolve(here, '..', '..', 'toolbar', 'dist', 'toolbar.js'),
  },
];

/** Every .html under `dir`, at any depth. */
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

if (!existsSync(dist)) {
  throw new Error(`No build to rewrite at ${dist}. Run the docs build first.`);
}

const pages = htmlFiles(dist);
if (pages.length === 0) {
  throw new Error(`No pages found under ${dist}.`);
}

// Only the overlays a page actually asks for: the docs ship no toolbar today,
// having no manifest to switch between, and copying an unreferenced bundle
// would put a file nobody loads on the site.
const contents = new Map(pages.map((page) => [page, readFileSync(page, 'utf-8')]));
const referenced = OVERLAYS.filter((overlay) =>
  [...contents.values()].some((html) => html.includes(overlay.url))
);

if (referenced.length === 0) {
  // Already rewritten is a fine state to be in: the build wipes `dist` and
  // re-renders before calling this, so the only way here is running it twice
  // by hand. Anything else is the failure this file exists to catch.
  const done = [...contents.values()].some((html) =>
    html.includes(`${OVERLAY_DIR}/`)
  );
  if (done) {
    console.log(`Overlays already bundled into ${OVERLAY_DIR}/; nothing to do.`);
    process.exit(0);
  }
  throw new Error(
    `None of the pages under ${dist} reference an overlay CDN url. ` +
      `Either the renderer stopped emitting them, or the urls here are stale:\n` +
      OVERLAYS.map((o) => `  ${o.url}`).join('\n')
  );
}

mkdirSync(join(dist, OVERLAY_DIR), { recursive: true });
for (const overlay of referenced) {
  if (!existsSync(overlay.built)) {
    throw new Error(
      `${overlay.file} is referenced by the docs but not built at ${overlay.built}.`
    );
  }
  copyFileSync(overlay.built, join(dist, OVERLAY_DIR, overlay.file));
}

for (const [page, html] of contents) {
  // Relative, so a page in a subdirectory resolves the copy as well as one at
  // the root does.
  const toRoot = relative(dirname(page), dist).split(sep).join('/');
  const prefix = toRoot ? `${toRoot}/` : './';
  let rewritten = html;
  for (const overlay of referenced) {
    rewritten = rewritten.replaceAll(
      overlay.url,
      `${prefix}${posix.join(OVERLAY_DIR, overlay.file)}`
    );
  }
  if (rewritten !== html) writeFileSync(page, rewritten);
}

const leftover = pages.filter((page) =>
  OVERLAYS.some((o) => readFileSync(page, 'utf-8').includes(o.url))
);
if (leftover.length > 0) {
  throw new Error(
    `These pages still point at the CDN after rewriting:\n` +
      leftover.map((p) => `  ${relative(dist, p)}`).join('\n')
  );
}

console.log(
  `Bundled ${referenced.map((o) => o.file).join(', ')} into ${OVERLAY_DIR}/ ` +
    `across ${pages.length} page${pages.length === 1 ? '' : 's'}.`
);
