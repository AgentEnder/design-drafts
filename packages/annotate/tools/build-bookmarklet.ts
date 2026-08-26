// Emit dist/bookmarklet.html — the drag-to-install page for the bookmarklet.
//
// Chrome will not let you paste a `javascript:` URL into the address bar, and
// typing one into the bookmark editor by hand is a bad time. Dragging a link
// onto the bookmarks bar is the path that actually works, and a link is
// something a static page can provide. unpkg serves this file straight from
// the published package, so the install page needs no hosting of its own.
//
// Runs after tsdown as part of `pnpm build`, and reads the bundle tsdown just
// wrote — the bookmarklet carries that bundle inline rather than fetching it,
// so the two are built together or not at all.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pkg from '../package.json' with { type: 'json' };
import { bookmarkletUrl } from '../src/bookmarklet.js';

const here = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(here, '..', 'dist', 'annotate.js');
const bundle = readFileSync(bundlePath, 'utf8');
const url = bookmarkletUrl(bundle);
const sizeKb = (n: number): string => (n / 1024).toFixed(1) + ' kB';

const ACCENT = '#4f46e5';
const SURFACE = '#fbfaf8';
const TEXT = '#1d1d20';
const MUTED = '#6b6b70';
const BORDER = 'rgba(0, 0, 0, 0.12)';

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Annotate anything — @design-drafts/annotate v${pkg.version}</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    padding: 48px 24px 96px;
    background: ${SURFACE};
    color: ${TEXT};
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  }
  main { max-width: 40rem; margin: 0 auto; }
  h1 { font-size: 1.5rem; margin: 0 0 0.25rem; letter-spacing: -0.01em; }
  .version { color: ${MUTED}; font-size: 0.8125rem; margin: 0 0 2rem; }
  h2 { font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.06em;
       color: ${MUTED}; margin: 2.5rem 0 0.75rem; font-weight: 600; }
  p { margin: 0 0 1rem; }
  ol { margin: 0 0 1rem; padding-left: 1.25rem; }
  li { margin-bottom: 0.4rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
         font-size: 0.875em; background: rgba(0,0,0,0.05);
         padding: 0.1em 0.35em; border-radius: 4px; }
  .grab {
    display: inline-block;
    padding: 10px 20px;
    background: ${ACCENT};
    color: #fff;
    border-radius: 8px;
    font-weight: 600;
    text-decoration: none;
    cursor: grab;
  }
  .grab:active { cursor: grabbing; }
  .drag-note { color: ${MUTED}; font-size: 0.875rem; margin-top: 0.75rem; }
  textarea {
    width: 100%;
    min-height: 7rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.75rem;
    line-height: 1.5;
    padding: 10px;
    border: 1px solid ${BORDER};
    border-radius: 8px;
    background: #fff;
    color: ${TEXT};
    resize: vertical;
  }
  hr { border: 0; border-top: 1px solid ${BORDER}; margin: 3rem 0; }
</style>
</head>
<body>
<main>
  <h1>Annotate anything</h1>
  <p class="version">@design-drafts/annotate v${pkg.version}</p>

  <p>
    Drag this link to your bookmarks bar. Clicking it on any page loads the
    annotation overlay onto that page: hover to outline a block, or highlight
    text to comment on the exact words. Click it again to switch the overlay
    off.
  </p>

  <p><a class="grab" href="${escapeAttr(url)}">Annotate</a></p>
  <p class="drag-note">
    Drag the button — Chrome refuses a pasted <code>javascript:</code> URL in
    the address bar, so dragging is the way it gets installed.
  </p>

  <h2>If the bookmarks bar is hidden</h2>
  <ol>
    <li>Press <code>⌘⇧B</code> (or <code>Ctrl+Shift+B</code>) to show it.</li>
    <li>Drag the button up onto the bar.</li>
  </ol>
  <p>
    Or make a bookmark by hand and paste the code below into its
    <em>URL</em> field — the bookmark editor accepts <code>javascript:</code>
    even though the address bar doesn't. It is
    ${sizeKb(url.length)} of encoded source; click once to select all of it.
  </p>
  <textarea readonly spellcheck="false" onclick="this.select()">${escapeAttr(url)}</textarea>

  <h2>Where the notes go</h2>
  <p>
    Into that site's <code>localStorage</code>, under the page's URL. They stay
    on your machine and in your browser; nothing is uploaded. The panel's
    <strong>Export</strong> button copies them all out as markdown.
  </p>
  <p>
    Because storage is per-origin, notes you leave on one site are invisible on
    every other. Clearing site data clears them too.
  </p>

  <h2>It carries its own code</h2>
  <p>
    The whole overlay is inside the bookmark — nothing is fetched when you
    click it, so it works offline and on sites that block third-party
    scripts. A bookmarklet that pulled the script from a CDN would be turned
    away by any page with a real <code>Content-Security-Policy</code>;
    a browser exempts the bookmark's own code from that policy, so this one
    gets through.
  </p>
  <p>
    The trade is that the bookmark is frozen at v${pkg.version}. To pick up a
    later version, come back here and drag it again.
  </p>

  <h2>Sites where it still won't work</h2>
  <p>
    <code>chrome://</code> pages, the Chrome Web Store, and other browser-owned
    pages don't run bookmarklets at all. On a page built from frames, the
    overlay attaches to the top document only.
  </p>

  <hr />
  <p class="version">
    Self-contained: ${sizeKb(bundle.length)} of overlay, ${sizeKb(url.length)}
    once encoded into the bookmark URL.
  </p>
</main>
</body>
</html>
`;

const out = join(here, '..', 'dist', 'bookmarklet.html');
writeFileSync(out, html);
writeFileSync(join(here, '..', 'dist', 'bookmarklet.txt'), url + '\n');
console.log(`bookmarklet: ${out}`);
