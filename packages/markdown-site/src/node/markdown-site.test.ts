import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  buildSearchIndex,
  collectMarkdownPages,
  isMarkdownDraft,
  renderMarkdownDocument,
  renderMarkdownPageAt,
  renderMarkdownSite,
} from './index';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dd-md-test-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(relPath: string, content: string): void {
  const abs = join(dir, relPath);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content);
}

describe('isMarkdownDraft', () => {
  it('is true for a directory of markdown files with no html', () => {
    write('README.md', '# Hi');
    write('guides/setup.md', '# Setup');
    expect(isMarkdownDraft(dir)).toBe(true);
  });

  it('is false when any html page exists', () => {
    write('notes.md', '# Notes');
    write('index.html', '<!doctype html>');
    expect(isMarkdownDraft(dir)).toBe(false);
  });

  it('is false when there is no markdown at all', () => {
    write('styles.css', 'body {}');
    expect(isMarkdownDraft(dir)).toBe(false);
  });

  it('ignores node_modules and dot-directories', () => {
    write('README.md', '# Hi');
    write('node_modules/pkg/index.html', '<!doctype html>');
    write('.github/workflows/deploy.md', '# not a page');
    expect(isMarkdownDraft(dir)).toBe(true);
  });

  it('ignores the references/ convention directory', () => {
    // references/ holds reviewer-facing meta (briefs, links), never pages —
    // its markdown alone must not make a directory a markdown draft.
    write('references/brief.md', '# Brief');
    expect(isMarkdownDraft(dir)).toBe(false);
  });
});

describe('collectMarkdownPages', () => {
  it('maps each markdown file to a sibling html output path', () => {
    write('notes.md', '# Notes');
    write('guides/setup.md', '# Setup');
    const pages = collectMarkdownPages(dir);
    expect(pages.map((p) => [p.sourcePath, p.outputPath])).toEqual([
      ['guides/setup.md', 'guides/setup.html'],
      ['notes.md', 'notes.html'],
    ]);
  });

  it('renders README.md as index.html when no index.md exists', () => {
    write('README.md', '# Project');
    const pages = collectMarkdownPages(dir);
    expect(pages).toHaveLength(1);
    expect(pages[0].sourcePath).toBe('README.md');
    expect(pages[0].outputPath).toBe('index.html');
  });

  it('lets index.md claim index.html, README.md falls back to README.html', () => {
    write('index.md', '# Home');
    write('README.md', '# Readme');
    const pages = collectMarkdownPages(dir);
    expect(pages.map((p) => [p.sourcePath, p.outputPath])).toEqual([
      ['index.md', 'index.html'],
      ['README.md', 'README.html'],
    ]);
  });

  it('takes the page title from the first heading, falling back to the filename', () => {
    write('README.md', 'intro text\n\n# The Real Title\n');
    write('untitled.md', 'no headings here');
    const pages = collectMarkdownPages(dir);
    const bySource = Object.fromEntries(pages.map((p) => [p.sourcePath, p.title]));
    expect(bySource['README.md']).toBe('The Real Title');
    expect(bySource['untitled.md']).toBe('untitled');
  });

  it('sorts the index page first, then alphabetically', () => {
    write('zebra.md', '# Z');
    write('README.md', '# Home');
    write('alpha.md', '# A');
    const pages = collectMarkdownPages(dir);
    expect(pages.map((p) => p.outputPath)).toEqual([
      'index.html',
      'alpha.html',
      'zebra.html',
    ]);
  });

  it('skips node_modules, dot-directories, and references/', () => {
    write('README.md', '# Hi');
    write('node_modules/pkg/README.md', '# dep');
    write('.hidden/notes.md', '# hidden');
    write('references/brief.md', '# Brief');
    const pages = collectMarkdownPages(dir);
    expect(pages.map((p) => p.sourcePath)).toEqual(['README.md']);
  });

  it('lets an explicit indexSource claim index.html, beating the README convention', () => {
    write('notes.md', '# Notes');
    write('README.md', '# Readme');
    const pages = collectMarkdownPages(dir, { indexSource: 'notes.md' });
    expect(pages.map((p) => [p.sourcePath, p.outputPath])).toEqual([
      ['notes.md', 'index.html'],
      ['README.md', 'README.html'],
    ]);
  });

  it('aliases an index page at its own name, so relative links to it resolve', () => {
    // `[see](notes.md)` rewrites to `notes.html` — that file has to exist even
    // though notes.md is what renders as the index.
    write('notes.md', '# Notes');
    const [index] = collectMarkdownPages(dir, { indexSource: 'notes.md' });
    expect(index.outputPath).toBe('index.html');
    expect(index.aliasPaths).toEqual(['notes.html']);
  });

  it('aliases a README index at README.html', () => {
    write('README.md', '# Home');
    const [index] = collectMarkdownPages(dir);
    expect(index.outputPath).toBe('index.html');
    expect(index.aliasPaths).toEqual(['README.html']);
  });

  it('gives index.md no alias — it already renders to its own name', () => {
    write('index.md', '# Home');
    const [index] = collectMarkdownPages(dir);
    expect(index.outputPath).toBe('index.html');
    expect(index.aliasPaths).toEqual([]);
  });

  it('aliases a nested directory index too', () => {
    write('README.md', '# Home');
    write('guides/README.md', '# Guides');
    const nested = collectMarkdownPages(dir).find(
      (p) => p.sourcePath === 'guides/README.md'
    );
    expect(nested?.outputPath).toBe('guides/index.html');
    expect(nested?.aliasPaths).toEqual(['guides/README.html']);
  });

  it('ignores an indexSource that matches no page', () => {
    write('notes.md', '# Notes');
    const pages = collectMarkdownPages(dir, { indexSource: 'gone.md' });
    expect(pages.map((p) => p.outputPath)).toEqual(['notes.html']);
  });
});

describe('renderMarkdownDocument', () => {
  it('renders GFM tables', () => {
    const html = renderMarkdownDocument('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('renders GFM task lists as checkboxes', () => {
    const html = renderMarkdownDocument('- [x] done\n- [ ] todo');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
  });

  it('renders GFM strikethrough', () => {
    const html = renderMarkdownDocument('~~gone~~');
    expect(html).toContain('<del>gone</del>');
  });

  it('syntax-highlights fenced code blocks with a known language', () => {
    const html = renderMarkdownDocument('```ts\nconst x: number = 1;\n```');
    expect(html).toContain('language-ts');
    expect(html).toContain('hljs-keyword');
  });

  it('escapes code fenced with an unknown language without highlighting', () => {
    const html = renderMarkdownDocument('```nosuchlang\n<script>alert(1)</script>\n```');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('adds GitHub-style ids to headings', () => {
    const html = renderMarkdownDocument('# Hello World!\n\n## Hello World!');
    expect(html).toContain('<h1 id="hello-world"');
    expect(html).toContain('<h2 id="hello-world-1"');
  });

  it('rewrites relative markdown links to their html twins', () => {
    const html = renderMarkdownDocument('[other](./other.md) [deep](sub/deep.md#part)');
    expect(html).toContain('href="./other.html"');
    expect(html).toContain('href="sub/deep.html#part"');
  });

  it('rewrites README links to the index page', () => {
    const html = renderMarkdownDocument('[home](README.md)');
    expect(html).toContain('href="index.html"');
  });

  it('leaves absolute urls alone, even when they end in .md', () => {
    const html = renderMarkdownDocument('[raw](https://example.com/file.md)');
    expect(html).toContain('href="https://example.com/file.md"');
  });
});

describe('renderMarkdownDocument collapsible sections', () => {
  it('wraps each heading and its content in an open details section', () => {
    const html = renderMarkdownDocument('# A\n\nalpha\n\n# B\n\nbeta');
    expect(html.match(/<details class="md-section" open>/g)).toHaveLength(2);
    expect(html).toContain('<summary><h1 id="a">A</h1></summary>');
    // A's section closes before B's opens — collapsing A never hides B.
    expect(html.indexOf('</details>')).toBeLessThan(html.indexOf('<h1 id="b"'));
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('</details>'));
  });

  it('spans a section to the next heading of the same or higher level', () => {
    const html = renderMarkdownDocument('## X\n\nx\n\n### X1\n\nx1\n\n## Y\n\ny');
    // X1 nests inside X, so collapsing X hides X1; Y is a sibling of X.
    const xStart = html.indexOf('<h2 id="x"');
    const x1Start = html.indexOf('<h3 id="x1"');
    const yStart = html.indexOf('<h2 id="y"');
    const xEnd = html.slice(0, yStart).lastIndexOf('</details>');
    expect(x1Start).toBeGreaterThan(xStart);
    expect(x1Start).toBeLessThan(xEnd);
    expect(html.match(/<details class="md-section" open>/g)).toHaveLength(3);
  });

  it('leaves content before the first heading unwrapped', () => {
    const html = renderMarkdownDocument('intro paragraph\n\n# A\n\nbody');
    expect(html.indexOf('intro paragraph')).toBeLessThan(html.indexOf('<details'));
  });

  it('does not sectionize headings nested inside other blocks', () => {
    const html = renderMarkdownDocument('> # Quoted heading\n\ntext');
    expect(html).not.toContain('<details');
    expect(html).toContain('Quoted heading');
  });

  it('resolves reference links defined in a different section', () => {
    const html = renderMarkdownDocument(
      '# A\n\nsee [the spec][spec]\n\n# B\n\n[spec]: https://example.com/spec'
    );
    expect(html).toContain('href="https://example.com/spec"');
  });
});

describe('renderMarkdownSite with search', () => {
  it('wires the pagefind UI with page-relative bundle paths and the deploy baseUrl', () => {
    write('README.md', '# Docs');
    write('guides/setup.md', '# Setup');
    renderMarkdownSite(dir, {
      siteName: 'docs',
      search: { basePath: '/previews/docs/' },
    });

    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    // The bundle is loaded lazily by a loader script (with retry, so a
    // still-building preview index shows progress instead of a dead box).
    expect(index).toContain('"pagefind/pagefind-ui.js"');
    expect(index).toContain('"pagefind/pagefind-ui.css"');
    expect(index).toContain('Building search index');
    // The container id is namespaced so a "## Search" heading (slug "search")
    // can't collide with it.
    expect(index).toContain('id="dd-search"');
    expect(index).toContain('data-base-url="/previews/docs/"');
    expect(index).toContain('data-pagefind-body');

    const nested = readFileSync(join(dir, 'guides/setup.html'), 'utf-8');
    expect(nested).toContain('"../pagefind/pagefind-ui.js"');
    expect(nested).toContain('"../pagefind/pagefind-ui.css"');
  });

  it('presents search as a spotlight dialog with a header trigger', () => {
    write('README.md', '# Docs');
    renderMarkdownSite(dir, { search: { basePath: '/x/' } });
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).toContain('class="search-trigger"');
    expect(html).toContain('<dialog class="search-dialog"');
    expect(html).toContain('showModal');
    // Cmd/Ctrl+K and / open it from the keyboard. Asserted via tokens the
    // minifier cannot rename (property access, event-name literal).
    expect(html).toContain('metaKey');
    expect(html).toContain('keydown');
  });

  it('renders the chosen indexSource doc to index.html', () => {
    write('notes.md', '# My Notes\n\nNote content.');
    write('other.md', '# Other');

    // On-the-fly first: writing the site makes the dir no longer markdown-only.
    const rendered = renderMarkdownPageAt(dir, 'index.html', {
      indexSource: 'notes.md',
    });
    expect(rendered).toContain('Note content.');

    renderMarkdownSite(dir, { indexSource: 'notes.md' });
    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(index).toContain('Note content.');
  });

  it('also writes the index under its own name, so relative links resolve', () => {
    // `[notes](notes.md)` from another page rewrites to `notes.html`.
    write('notes.md', '# My Notes\n\nNote content.');
    write('other.md', '# Other\n\nSee [notes](notes.md).');
    renderMarkdownSite(dir, { indexSource: 'notes.md' });

    expect(readFileSync(join(dir, 'other.html'), 'utf-8')).toContain(
      'href="notes.html"'
    );
    expect(readFileSync(join(dir, 'notes.html'), 'utf-8')).toContain(
      'Note content.'
    );
  });

  it('writes a README index under README.html too', () => {
    write('README.md', '# Home\n\nHome content.');
    write('other.md', '# Other');
    renderMarkdownSite(dir);

    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toContain('Home content.');
    expect(readFileSync(join(dir, 'README.html'), 'utf-8')).toContain('Home content.');
  });

  it('serves an alias page on the fly, matching what a push bakes', () => {
    write('notes.md', '# My Notes\n\nNote content.');
    write('other.md', '# Other');
    const rendered = renderMarkdownPageAt(dir, 'notes.html', {
      indexSource: 'notes.md',
    });
    expect(rendered).toContain('Note content.');
  });

  it('keeps the alias copy out of the search index, so results are not doubled', () => {
    write('notes.md', '# My Notes\n\nNote content.');
    write('other.md', '# Other');
    renderMarkdownSite(dir, {
      indexSource: 'notes.md',
      search: { basePath: '/x/' },
    });

    // Pagefind indexes only pages carrying data-pagefind-body once any page
    // has it, so the canonical index is indexed and its alias twin is not.
    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toContain(
      'data-pagefind-body'
    );
    const alias = readFileSync(join(dir, 'notes.html'), 'utf-8');
    expect(alias).not.toContain('data-pagefind-body');
    // The alias still offers working search, and points readers at the
    // canonical url.
    expect(alias).toContain('class="search-trigger"');
    expect(alias).toContain('<link rel="canonical" href="index.html"');
  });

  it('offers a copy button carrying the page\'s raw markdown', () => {
    write('README.md', '# Docs\n\nRaw *markdown* body.');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');

    expect(html).toContain('class="copy-markdown"');
    // The source rides along as JSON so the button works offline, on
    // gh-pages, and from file:// — no fetch of the .md needed.
    expect(html).toContain('id="dd-markdown-source"');
    expect(html).toContain('type="application/json"');
    const source = html.match(
      /<script type="application\/json" id="dd-markdown-source">([\s\S]*?)<\/script>/
    );
    expect(JSON.parse(source![1])).toBe('# Docs\n\nRaw *markdown* body.');
  });

  it('links to the raw .md source, which ships alongside the rendered pages', () => {
    write('README.md', '# Docs');
    write('guides/setup.md', '# Setup');
    renderMarkdownSite(dir);

    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(index).toContain('class="view-raw"');
    expect(index).toContain('href="README.md"');
    // The source sits next to the page it renders, so the link is relative.
    const nested = readFileSync(join(dir, 'guides/setup.html'), 'utf-8');
    expect(nested).toContain('href="setup.md"');
    // The sources are kept, not consumed.
    expect(existsSync(join(dir, 'README.md'))).toBe(true);
  });

  it('offers copy as the primary action, with view raw behind a dropdown', () => {
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');

    // A split button: primary action, then a caret that toggles the menu.
    expect(html).toContain('class="md-actions"');
    expect(html).toContain('class="copy-markdown"');
    expect(html).toContain('class="md-actions-toggle"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-haspopup="true"');
    // The secondary action lives inside the (initially hidden) menu.
    const menu = html.match(/<div class="md-actions-menu"[\s\S]*?<\/div>/)?.[0];
    expect(menu).toContain('class="view-raw"');
    expect(menu).toContain('View raw');
    expect(menu).toContain('hidden');
  });

  it('ships a lightbox for enlarging content images', () => {
    write('README.md', '# Docs\n\n![A diagram](diagram.png)');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');

    // The overlay is a native <dialog>, and images opt in by being in the body.
    expect(html).toContain('class="lightbox"');
    expect(html).toContain('lightbox-image');
    expect(html).toContain('lightbox-caption');
    // The image itself stays a plain markdown image — the client wires the
    // click, so nothing is baked into the rendered markdown.
    expect(html).toContain('<img src="diagram.png" alt="A diagram">');
  });

  it('ships an animated checkmark for copy feedback', () => {
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');

    // The tick is inline svg (no icon font, no request) and draws itself in.
    expect(html).toContain('class="copy-check"');
    expect(html).toContain('<svg');
    expect(html).toContain('dd-check-draw');
  });

  it('points an index alias at the same raw source as the index', () => {
    write('notes.md', '# My Notes');
    write('other.md', '# Other');
    renderMarkdownSite(dir, { indexSource: 'notes.md' });

    for (const page of ['index.html', 'notes.html']) {
      expect(readFileSync(join(dir, page), 'utf-8')).toContain('href="notes.md"');
    }
  });

  it('embeds markdown that contains a closing script tag without breaking out', () => {
    write('README.md', '# Docs\n\n```html\n</script><script>alert(1)</script>\n```');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');

    // Every `<` in the embedded source is escaped, so the tag can't terminate
    // the script element early.
    expect(html).not.toContain('</script><script>alert(1)');
    const source = html.match(
      /<script type="application\/json" id="dd-markdown-source">([\s\S]*?)<\/script>/
    );
    expect(JSON.parse(source![1])).toContain('</script><script>alert(1)</script>');
  });

  it('carries the index page\'s markdown on its alias copy too', () => {
    write('notes.md', '# My Notes\n\nNote body.');
    write('other.md', '# Other');
    renderMarkdownSite(dir, { indexSource: 'notes.md' });

    for (const page of ['index.html', 'notes.html']) {
      const html = readFileSync(join(dir, page), 'utf-8');
      const source = html.match(
        /<script type="application\/json" id="dd-markdown-source">([\s\S]*?)<\/script>/
      );
      expect(JSON.parse(source![1])).toBe('# My Notes\n\nNote body.');
    }
  });

  it('renders no search markup when search is not configured', () => {
    // The shared chrome bundle ships on every page (its search module just
    // never activates), so the guarantee is about markup: nothing to click,
    // no pagefind bundle referenced.
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).not.toContain('class="search-dialog"');
    expect(html).not.toContain('data-ui-script');
    expect(html).not.toContain('class="search-trigger"');
    expect(html).not.toContain('data-pagefind-body');
  });
});

describe('buildSearchIndex', () => {
  it('writes a pagefind bundle next to the rendered pages', async () => {
    write('README.md', '# Docs\n\nSearchable words live here.');
    write('guides/setup.md', '# Setup\n\nInstall the things.');
    renderMarkdownSite(dir, { search: { basePath: '/previews/docs/' } });

    await expect(buildSearchIndex(dir)).resolves.toBe(true);
    expect(existsSync(join(dir, 'pagefind', 'pagefind.js'))).toBe(true);
    expect(existsSync(join(dir, 'pagefind', 'pagefind-ui.js'))).toBe(true);
    expect(existsSync(join(dir, 'pagefind', 'pagefind-ui.css'))).toBe(true);
  }, 30_000);
});

describe('renderMarkdownSite', () => {
  it('does nothing when the directory is not a markdown draft', () => {
    write('index.html', '<!doctype html>');
    write('references/brief.md', '# Brief');
    expect(renderMarkdownSite(dir)).toBe(false);
    expect(existsSync(join(dir, 'references/brief.html'))).toBe(false);
  });

  it('writes a full html page per markdown file and keeps the sources', () => {
    write('README.md', '# My Docs\n\nHello.');
    write('guides/setup.md', '# Setup\n\nSteps.');
    expect(renderMarkdownSite(dir, { siteName: 'my-docs' })).toBe(true);

    expect(existsSync(join(dir, 'index.html'))).toBe(true);
    expect(existsSync(join(dir, 'guides/setup.html'))).toBe(true);
    expect(existsSync(join(dir, 'README.md'))).toBe(true);

    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(index).toContain('<!doctype html>');
    expect(index).toContain('<title>My Docs</title>');
    expect(index).toContain('Hello.');
  });

  // Every page of the draft must declare the same id, because that is what the
  // annotate overlay filters on — a page that declares nothing pools its
  // annotations with every other unidentified draft at the same preview URL.
  it('declares the draft id on every page', () => {
    write('README.md', '# My Docs');
    write('guides/setup.md', '# Setup');
    renderMarkdownSite(dir, { draftId: 'my-docs' });

    const tag = '<meta name="draftId" content="my-docs"/>';
    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toContain(tag);
    expect(readFileSync(join(dir, 'guides/setup.html'), 'utf-8')).toContain(tag);
  });

  it('declares no draft id when the draft has no manifest to derive one from', () => {
    write('README.md', '# My Docs');
    renderMarkdownSite(dir);

    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).not.toContain('draftId');
  });

  it('ships a light/dark theme with a toggle on every page', () => {
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).toContain('data-theme');
    expect(html).toContain('prefers-color-scheme: dark');
    expect(html).toContain('theme-toggle');
  });

  it('uses a soft paper-and-ink light palette, not pure white and black', () => {
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).not.toContain('--bg: #ffffff');
    expect(html).not.toContain('--bg: #fff;');
    expect(html).not.toContain('--fg: #000');
  });

  it('renders a floating per-page toc from the section headings', () => {
    write(
      'README.md',
      '# Docs\n\n## Getting Started\n\ntext\n\n## Usage\n\ntext\n\n### Advanced Usage\n\ntext'
    );
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).toContain('class="toc"');
    expect(html).toContain('On this page');
    expect(html).toContain('href="#getting-started"');
    expect(html).toContain('href="#usage"');
    expect(html).toContain('href="#advanced-usage"');
    // The h1 is the page title, not a section — it stays out of the toc.
    expect(html).not.toContain('href="#docs"');
    // Scroll-spy highlights the section in view.
    expect(html).toContain('IntersectionObserver');
  });

  it('expands collapsed sections when the url hash targets content inside them', () => {
    // A search result or toc link must never land on a hidden anchor.
    write('README.md', '# Docs\n\n## One\n\ntext\n\n## Two\n\ntext');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).toContain('closest("details")');
    expect(html).toContain('hashchange');
  });

  it('flash-highlights the element targeted by the url hash', () => {
    // Search results and toc entries land on #anchors; the target should glow
    // briefly so the reader's eye finds it.
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).toContain(':target');
    expect(html).toContain('anchor-flash');
  });

  it('omits the toc when a page has fewer than two section headings', () => {
    write('README.md', '# Docs\n\n## Only Section\n\ntext');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    // The scroll-spy code rides the shared bundle either way; the guarantee
    // is that no toc rail is rendered for it to drive.
    expect(html).not.toContain('class="toc"');
  });

  it('links sibling pages in a nav with paths relative to each page', () => {
    write('README.md', '# Home');
    write('guides/setup.md', '# Setup');
    renderMarkdownSite(dir);

    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(index).toContain('href="guides/setup.html"');

    const nested = readFileSync(join(dir, 'guides/setup.html'), 'utf-8');
    expect(nested).toContain('href="../index.html"');
  });

  it('omits the nav for a single-page draft', () => {
    write('README.md', '# Home');
    renderMarkdownSite(dir);
    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(index).not.toContain('<nav');
  });

  it('groups the nav by directory, one collapsible folder per level', () => {
    write('README.md', '# Home');
    write('guides/setup.md', '# Setup');
    write('reference/advanced/tuning.md', '# Tuning');
    renderMarkdownSite(dir);

    const index = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(index).toContain('<summary>Guides</summary>');
    expect(index).toContain('<summary>Reference</summary>');
    expect(index).toContain('<summary>Advanced</summary>');
  });

  it('opens only the folders holding the page being rendered', () => {
    write('README.md', '# Home');
    write('guides/setup.md', '# Setup');
    write('reference/cli.md', '# CLI');
    renderMarkdownSite(dir);

    // `<details open>` is the whole mechanism — no script runs to expand the
    // current branch, so a draft opened straight off disk behaves the same.
    const nested = readFileSync(join(dir, 'guides/setup.html'), 'utf-8');
    expect(nested).toContain('<details open><summary>Guides</summary>');
    expect(nested).toContain('<details><summary>Reference</summary>');
  });

  it('includes the toolbar and annotate overlay scripts', () => {
    write('README.md', '# Docs');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    expect(html).toContain('@design-drafts/toolbar');
    expect(html).toContain('@design-drafts/annotate');
  });

  it('renders on the fly without writing when asked for one page', () => {
    write('README.md', '# Home\n\nWelcome!');
    write('guides/setup.md', '# Setup');

    const html = renderMarkdownPageAt(dir, 'guides/setup.html');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>Setup</title>');
    expect(html).toContain('href="../index.html"');
    expect(existsSync(join(dir, 'guides/setup.html'))).toBe(false);
  });

  it('renders README.md when asked for index.html', () => {
    write('README.md', '# Home\n\nWelcome!');
    const html = renderMarkdownPageAt(dir, 'index.html');
    expect(html).toContain('Welcome!');
  });

  it('returns null for paths no markdown page renders to', () => {
    write('README.md', '# Home');
    expect(renderMarkdownPageAt(dir, 'missing.html')).toBeNull();
  });

  it('returns null inside a classic html draft', () => {
    write('index.html', '<!doctype html>');
    write('references/brief.md', '# Brief');
    expect(renderMarkdownPageAt(dir, 'references/brief.html')).toBeNull();
  });

  it('escapes html-sensitive characters in derived titles', () => {
    write('README.md', '# Docs <script> & "quotes"');
    renderMarkdownSite(dir);
    const html = readFileSync(join(dir, 'index.html'), 'utf-8');
    // preact-render-to-string escapes &, <, and " in text (a bare > is
    // harmless in html text content).
    expect(html).toContain('<title>Docs &lt;script> &amp; &quot;quotes&quot;</title>');
  });
});
