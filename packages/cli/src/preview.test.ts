import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  collectHtmlPages,
  contentTypeFor,
  createPreviewServer,
  ensureDraftIndex,
  prepareMarkdownSearch,
  type PreviewSearch,
  renderDirectoryIndex,
  resolveServedFile,
} from './preview';

describe('contentTypeFor', () => {
  it('maps known extensions', () => {
    expect(contentTypeFor('index.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeFor('styles.css')).toBe('text/css; charset=utf-8');
    expect(contentTypeFor('logo.png')).toBe('image/png');
    expect(contentTypeFor('font.woff2')).toBe('font/woff2');
  });

  it('is case-insensitive on the extension', () => {
    expect(contentTypeFor('PAGE.HTML')).toBe('text/html; charset=utf-8');
  });

  it('serves markdown as plain text, so "view raw" displays instead of downloading', () => {
    expect(contentTypeFor('README.md')).toBe('text/plain; charset=utf-8');
  });

  it('falls back to octet-stream for unknown or missing extensions', () => {
    expect(contentTypeFor('archive.xyz')).toBe('application/octet-stream');
    expect(contentTypeFor('Makefile')).toBe('application/octet-stream');
  });
});

describe('resolveServedFile', () => {
  const root = '/draft/root';

  it('resolves the root path to the draft directory itself', () => {
    expect(resolveServedFile(root, '/')).toBe(root);
  });

  it('resolves files and nested paths under the root', () => {
    expect(resolveServedFile(root, '/index.html')).toBe(join(root, 'index.html'));
    expect(resolveServedFile(root, '/pages/a/b.html')).toBe(
      join(root, 'pages', 'a', 'b.html')
    );
  });

  it('strips query strings and hashes before resolving', () => {
    expect(resolveServedFile(root, '/index.html?theme=dark')).toBe(
      join(root, 'index.html')
    );
    expect(resolveServedFile(root, '/index.html#section')).toBe(
      join(root, 'index.html')
    );
  });

  it('rejects paths that escape the draft root', () => {
    expect(resolveServedFile(root, '/../secret')).toBeNull();
    expect(resolveServedFile(root, '/pages/../../etc/passwd')).toBeNull();
  });

  it('rejects percent-encoded traversal attempts', () => {
    expect(resolveServedFile(root, '/%2e%2e/secret')).toBeNull();
  });

  it('rejects malformed percent-encoding', () => {
    expect(resolveServedFile(root, '/%')).toBeNull();
  });
});

describe('createPreviewServer', () => {
  let dir: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-'));
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    writeFileSync(join(dir, 'index.html'), '<h1>home</h1>');
    mkdirSync(join(dir, 'pages', 'sub'), { recursive: true });
    writeFileSync(join(dir, 'pages', 'sub', 'p.html'), '<h1>nested</h1>');
    mkdirSync(join(dir, 'pages', 'withindex'), { recursive: true });
    writeFileSync(join(dir, 'pages', 'withindex', 'index.html'), '<h1>sub-index</h1>');

    server = createPreviewServer(dir);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('serves index.html at the root', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toContain('home');
  });

  it('serves nested pages', async () => {
    const res = await fetch(`${baseUrl}/pages/sub/p.html`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nested');
  });

  it('serves index.html for directory requests', async () => {
    const res = await fetch(`${baseUrl}/pages/withindex/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('sub-index');
  });

  it('returns 404 for missing files', async () => {
    const res = await fetch(`${baseUrl}/does-not-exist.html`);
    expect(res.status).toBe(404);
  });

  it('serves a generated page index for a directory without an index.html', async () => {
    const res = await fetch(`${baseUrl}/pages/sub/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const html = await res.text();
    // The fallback lists every page in the draft, linked root-absolute.
    expect(html).toContain('href="/pages/sub/p.html"');
    expect(html).toContain('href="/pages/withindex/index.html"');
  });
});

describe('createPreviewServer with no root index.html', () => {
  let dir: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-noindex-'));
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    writeFileSync(join(dir, 'about.html'), '<h1>about</h1>');

    server = createPreviewServer(dir);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('serves a generated page index at the root', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toContain('href="/about.html"');
  });

  it('serves the generated index for /index.html too', async () => {
    const res = await fetch(`${baseUrl}/index.html`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('href="/about.html"');
  });
});

describe('createPreviewServer over a markdown draft', () => {
  let dir: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-md-'));
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    writeFileSync(join(dir, 'README.md'), '# Home\n\nWelcome!');
    mkdirSync(join(dir, 'guides'), { recursive: true });
    writeFileSync(join(dir, 'guides', 'setup.md'), '# Setup\n\nSteps.');

    server = createPreviewServer(dir);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('renders README.md for the root request', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const html = await res.text();
    expect(html).toContain('Welcome!');
    expect(html).toContain('<!doctype html>');
  });

  it('renders the markdown twin of a requested html page', async () => {
    const res = await fetch(`${baseUrl}/guides/setup.html`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Steps.');
  });

  it('serves raw markdown when the .md file itself is requested', async () => {
    // The "view raw" link on every rendered page points here; a push ships the
    // same .md sources, so the link resolves on gh-pages too.
    const res = await fetch(`${baseUrl}/guides/setup.md`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('# Setup\n\nSteps.');
  });

  it('still 404s for html paths with no markdown twin', async () => {
    const res = await fetch(`${baseUrl}/nope.html`);
    expect(res.status).toBe(404);
  });

  it('carries the injected reload client on rendered pages', async () => {
    const html = await (await fetch(`${baseUrl}/guides/setup.html`)).text();
    expect(html).toContain('data-design-drafts-preview="reload"');
  });

  it('leaves search out of rendered pages when no bundle is configured', async () => {
    const res = await fetch(`${baseUrl}/`);
    // The shared chrome bundle mentions search internally; the guarantee is
    // that no search markup renders without a bundle configured.
    const html = await res.text();
    expect(html).not.toContain('class="search-dialog"');
    expect(html).not.toContain('data-ui-script');
  });
});

describe('createPreviewServer with a designated index doc', () => {
  let dir: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-index-'));
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    writeFileSync(join(dir, 'notes.md'), '# Notes\n\nChosen index content.');
    writeFileSync(join(dir, 'zoo.md'), '# Zoo');

    server = createPreviewServer(dir, { indexSource: 'notes.md' });
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('serves the chosen doc at the root and at /index.html', async () => {
    expect(await (await fetch(`${baseUrl}/`)).text()).toContain(
      'Chosen index content.'
    );
    expect(await (await fetch(`${baseUrl}/index.html`)).text()).toContain(
      'Chosen index content.'
    );
  });

  it('also serves the chosen doc under its default name, so relative links resolve', async () => {
    // Another page's `[see](notes.md)` rewrites to `notes.html`.
    const res = await fetch(`${baseUrl}/notes.html`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Chosen index content.');
  });
});

describe('createPreviewServer with background search', () => {
  let dir: string;
  let bundleDir: string;
  let search: () => PreviewSearch;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-search-'));
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    writeFileSync(join(dir, 'README.md'), '# Home\n\nWelcome!');
    mkdirSync(join(dir, 'guides'), { recursive: true });
    writeFileSync(join(dir, 'guides', 'setup.md'), '# Setup');

    // A stand-in for the staging dir prepareMarkdownSearch builds: the server
    // only needs its pagefind/ contents to exist.
    bundleDir = mkdtempSync(join(tmpdir(), 'design-drafts-bundle-'));
    mkdirSync(join(bundleDir, 'pagefind'), { recursive: true });
    writeFileSync(join(bundleDir, 'pagefind', 'pagefind-ui.js'), '// ui stub');

    search = () => ({ phase: 'ready', bundleDir });
    server = createPreviewServer(dir, { search: () => search() });
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
    rmSync(bundleDir, { recursive: true, force: true });
  });

  it('wires the search UI into rendered pages with a root baseUrl', async () => {
    const html = await (await fetch(`${baseUrl}/`)).text();
    expect(html).toContain('id="dd-search"');
    expect(html).toContain('data-base-url="/"');

    const nested = await (await fetch(`${baseUrl}/guides/setup.html`)).text();
    expect(nested).toContain('"../pagefind/pagefind-ui.js"');
  });

  it('serves the pagefind bundle from the staging directory once ready', async () => {
    const res = await fetch(`${baseUrl}/pagefind/pagefind-ui.js`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('// ui stub');
  });

  it('answers 503 for bundle files while the index is still building', async () => {
    search = () => ({ phase: 'building' });
    const res = await fetch(`${baseUrl}/pagefind/pagefind-ui.js`);
    expect(res.status).toBe(503);
    // Pages still render with the search placeholder while building.
    const html = await (await fetch(`${baseUrl}/`)).text();
    expect(html).toContain('id="dd-search"');
  });

  it('answers 404 for bundle files when indexing failed', async () => {
    search = () => ({ phase: 'failed' });
    const res = await fetch(`${baseUrl}/pagefind/pagefind-ui.js`);
    expect(res.status).toBe(404);
  });

  it('404s for bundle files that do not exist', async () => {
    const res = await fetch(`${baseUrl}/pagefind/nope.js`);
    expect(res.status).toBe(404);
  });
});

describe('prepareMarkdownSearch', () => {
  let dir: string;
  let staging: string | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-prepare-search-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    if (staging) rmSync(staging, { recursive: true, force: true });
    staging = undefined;
  });

  it('builds a real pagefind bundle for a markdown draft', async () => {
    writeFileSync(join(dir, 'README.md'), '# Docs\n\nSearchable words.');
    staging = await prepareMarkdownSearch(dir);
    expect(staging).toBeDefined();
    expect(existsSync(join(staging as string, 'pagefind', 'pagefind-ui.js'))).toBe(true);
  }, 30_000);

  it('returns undefined for a classic html draft', async () => {
    writeFileSync(join(dir, 'index.html'), '<!doctype html>');
    staging = await prepareMarkdownSearch(dir);
    expect(staging).toBeUndefined();
  });
});

describe('createPreviewServer over a markdown draft with no README', () => {
  let dir: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-md-noreadme-'));
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    writeFileSync(join(dir, 'notes.md'), '# Notes');

    server = createPreviewServer(dir);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('lists the rendered markdown pages in the generated root index', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('href="/notes.html"');
  });

  it('serves the generated index for /index.html, matching what a push bakes', async () => {
    // Every rendered page's brand link points at index.html; a push always
    // bakes one (ensureDraftIndex), so preview must answer it too.
    const res = await fetch(`${baseUrl}/index.html`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('href="/notes.html"');
  });
});

describe('createPreviewServer over an identified markdown draft', () => {
  let dir: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-draft-id-'));
    writeFileSync(
      join(dir, 'design-drafts.config.json'),
      JSON.stringify({ name: 'My Docs Site' })
    );
    writeFileSync(join(dir, 'README.md'), '# Home');

    server = createPreviewServer(dir);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  // Preview is where drafts actually collide: every draft is served from a
  // localhost URL, so without the declaration the overlay cannot tell whose
  // annotations it is looking at. The id is the same slug the push derives
  // from the manifest name, so annotations don't change identity on deploy.
  it('declares the draft id derived from the manifest name', async () => {
    const html = await (await fetch(`${baseUrl}/`)).text();
    expect(html).toContain('<meta name="draftId" content="my-docs-site"/>');
  });
});

describe('createPreviewServer re-reading the manifest per request', () => {
  let dir: string;
  let manifestPath: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;

  const startServer = async (
    options?: Parameters<typeof createPreviewServer>[1]
  ): Promise<void> => {
    server = createPreviewServer(dir, options);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-reread-'));
    manifestPath = join(dir, 'design-drafts.config.json');
  });

  afterEach(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  it('picks up a renamed draft without a restart', async () => {
    // The draft id scopes annotations, so a stale one files this session's
    // notes under the old draft — the one staleness with a real consequence.
    writeFileSync(manifestPath, JSON.stringify({ name: 'My Docs Site' }));
    writeFileSync(join(dir, 'README.md'), '# Home');
    await startServer();

    expect(await (await fetch(`${baseUrl}/`)).text()).toContain(
      '<meta name="draftId" content="my-docs-site"/>'
    );

    writeFileSync(manifestPath, JSON.stringify({ name: 'Renamed Draft' }));
    expect(await (await fetch(`${baseUrl}/`)).text()).toContain(
      '<meta name="draftId" content="renamed-draft"/>'
    );
  });

  it('degrades to no draft id for a half-written manifest instead of erroring', async () => {
    writeFileSync(manifestPath, JSON.stringify({ name: 'My Docs Site' }));
    writeFileSync(join(dir, 'README.md'), '# Home');
    await startServer();

    // Editors save in bursts; catching the file mid-write is the normal case.
    writeFileSync(manifestPath, '{"name": "My Doc');
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Home');
    expect(html).not.toContain('<meta name="draftId"');
  });

  it('serves the newly designated index without a restart', async () => {
    writeFileSync(manifestPath, JSON.stringify({ markdownIndex: 'notes.md' }));
    writeFileSync(join(dir, 'notes.md'), '# Notes\n\nNotes content.');
    writeFileSync(join(dir, 'zoo.md'), '# Zoo\n\nZoo content.');
    await startServer({ indexSource: 'notes.md' });

    expect(await (await fetch(`${baseUrl}/`)).text()).toContain('Notes content.');

    writeFileSync(manifestPath, JSON.stringify({ markdownIndex: 'zoo.md' }));
    expect(await (await fetch(`${baseUrl}/`)).text()).toContain('Zoo content.');
  });

  it('keeps the startup answer when the manifest designates nothing', async () => {
    // `resolveMarkdownIndex` can only settle this draft by prompting, and a
    // request must never fire a prompt — so the startup answer stands.
    writeFileSync(manifestPath, '{}');
    writeFileSync(join(dir, 'notes.md'), '# Notes\n\nNotes content.');
    writeFileSync(join(dir, 'zoo.md'), '# Zoo\n\nZoo content.');
    await startServer({ indexSource: 'notes.md' });

    expect(await (await fetch(`${baseUrl}/`)).text()).toContain('Notes content.');
  });
});

/** Opens the reload stream and accumulates it into a buffer the test can poll.
 * A raw stream rather than `EventSource` so the test can abort deterministically
 * in teardown — an open stream keeps `server.close()` from ever completing. */
function openReloadStream(baseUrl: string): {
  ready: Promise<Response>;
  text: () => string;
  close: () => Promise<void>;
} {
  const controller = new AbortController();
  let received = '';
  const ready = fetch(`${baseUrl}/__design-drafts/reload`, {
    signal: controller.signal,
  });
  const drained = ready
    .then(async (res) => {
      const reader = (res.body as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) return;
        received += decoder.decode(value, { stream: true });
      }
    })
    .catch(() => {
      /* aborted in teardown, or the endpoint answered without a body */
    });
  return {
    ready,
    text: () => received,
    close: async () => {
      controller.abort();
      await drained;
    },
  };
}

/** Polls until `predicate` holds, so a timing-sensitive assertion never rides
 * on a guessed sleep duration. */
async function waitFor(
  predicate: () => boolean,
  what: string,
  timeoutMs = 5_000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((res) => setTimeout(res, 10));
  }
  throw new Error(`Timed out waiting for ${what}`);
}

/**
 * Runs the injected reload client against stubbed browser globals, so the
 * contract the toolbar will rely on — the event fires first, `location.reload()`
 * only when nobody handled it — is pinned without driving a real browser.
 */
async function runReloadClient(
  baseUrl: string,
  protocol: string
): Promise<{
  window: EventTarget;
  streams: string[];
  reloads: number;
  emit: () => void;
}> {
  const html = await (await fetch(`${baseUrl}/index.html`)).text();
  const source = /<script data-design-drafts-preview="reload">([\s\S]*?)<\/script>/.exec(
    html
  );
  if (!source) throw new Error('no reload client was injected');

  const streams: string[] = [];
  const handlers: (() => void)[] = [];
  class StubEventSource {
    constructor(url: string) {
      streams.push(url);
    }
    addEventListener(type: string, handler: () => void): void {
      expect(type).toBe('manifest-changed');
      handlers.push(handler);
    }
  }
  const state = {
    window: new EventTarget(),
    streams,
    reloads: 0,
    emit: () => handlers.forEach((handler) => handler()),
  };
  const location = { protocol, reload: () => void (state.reloads += 1) };

  // Parameters shadow the real globals, so the snippet runs against the stubs.
  new Function(
    'window',
    'location',
    'EventSource',
    'CustomEvent',
    source[1]
  )(state.window, location, StubEventSource, CustomEvent);
  return state;
}

describe('createPreviewServer live reload channel', () => {
  let dir: string;
  let manifestPath: string;
  let server: ReturnType<typeof createPreviewServer>;
  let baseUrl: string;
  let streams: ReturnType<typeof openReloadStream>[];

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-preview-reload-'));
    manifestPath = join(dir, 'design-drafts.config.json');
    writeFileSync(manifestPath, JSON.stringify({ name: 'Reload Draft' }));
    writeFileSync(join(dir, 'index.html'), '<html><body><h1>home</h1></body></html>');
    writeFileSync(join(dir, 'styles.css'), 'body { color: red; }');
    writeFileSync(join(dir, 'notes.txt'), 'plain');
    mkdirSync(join(dir, 'pages', 'sub'), { recursive: true });
    writeFileSync(join(dir, 'pages', 'sub', 'p.html'), '<h1>nested</h1>');
    streams = [];

    server = createPreviewServer(dir);
    await new Promise<void>((res) => server.listen(0, '127.0.0.1', res));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await Promise.all(streams.map((stream) => stream.close()));
    await new Promise<void>((res) => server.close(() => res()));
    rmSync(dir, { recursive: true, force: true });
  });

  const open = (): ReturnType<typeof openReloadStream> => {
    const stream = openReloadStream(baseUrl);
    streams.push(stream);
    return stream;
  };

  it('injects the reload client into served html', async () => {
    const html = await (await fetch(`${baseUrl}/index.html`)).text();
    expect(html).toContain('data-design-drafts-preview="reload"');
    expect(html).toContain('/__design-drafts/reload');
    // Injected before </body>, so the document stays well-formed.
    expect(html.indexOf('data-design-drafts-preview')).toBeLessThan(
      html.lastIndexOf('</body>')
    );
  });

  it('recomputes Content-Length for the rewritten html body', async () => {
    const res = await fetch(`${baseUrl}/index.html`);
    const html = await res.text();
    expect(Number(res.headers.get('content-length'))).toBe(
      Buffer.byteLength(html)
    );
  });

  it('injects into the generated directory listing too', async () => {
    expect(await (await fetch(`${baseUrl}/pages/sub/`)).text()).toContain(
      'data-design-drafts-preview="reload"'
    );
  });

  it('leaves non-html responses byte-identical', async () => {
    expect(await (await fetch(`${baseUrl}/styles.css`)).text()).toBe(
      'body { color: red; }'
    );
    expect(await (await fetch(`${baseUrl}/notes.txt`)).text()).toBe('plain');
  });

  it('serves the reload endpoint as an event stream', async () => {
    const res = await open().ready;
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/event-stream');
  });

  it('emits a manifest-changed event when the manifest is edited', async () => {
    const stream = open();
    await stream.ready;
    await waitFor(() => stream.text().includes('retry:'), 'the stream preamble');

    writeFileSync(manifestPath, JSON.stringify({ name: 'Renamed Mid Session' }));
    await waitFor(
      () => stream.text().includes('event: manifest-changed'),
      'the manifest-changed event'
    );
  });

  it('keeps serving other listeners after one disconnects', async () => {
    // A closed tab must not wedge the channel or leak its response object.
    const closing = open();
    const staying = open();
    await Promise.all([closing.ready, staying.ready]);
    await waitFor(() => staying.text().includes('retry:'), 'the stream preamble');
    await closing.close();

    writeFileSync(manifestPath, JSON.stringify({ name: 'Still Listening' }));
    await waitFor(
      () => staying.text().includes('event: manifest-changed'),
      'the surviving listener to be notified'
    );
  });

  it('reloads the page when nothing handles the event', async () => {
    const client = await runReloadClient(baseUrl, 'http:');
    expect(client.streams).toEqual(['/__design-drafts/reload']);

    client.emit();
    expect(client.reloads).toBe(1);
  });

  it('stands down when a listener cancels the event', async () => {
    // The upgrade path: a published toolbar that rebuilds its axis switchers in
    // place cancels the event and keeps the page's scroll position and state.
    const client = await runReloadClient(baseUrl, 'http:');
    client.window.addEventListener('design-drafts:manifest-changed', (event) => {
      event.preventDefault();
    });

    client.emit();
    expect(client.reloads).toBe(0);
  });

  it('is inert on a page opened from disk', async () => {
    const client = await runReloadClient(baseUrl, 'file:');
    expect(client.streams).toEqual([]);
    expect(client.reloads).toBe(0);
  });

  it('ignores writes to files other than the manifest', async () => {
    const stream = open();
    await stream.ready;
    await waitFor(() => stream.text().includes('retry:'), 'the stream preamble');

    writeFileSync(join(dir, 'styles.css'), 'body { color: blue; }');
    // Nothing to wait for, so prove the negative by letting the watcher's
    // debounce elapse several times over before asserting.
    await new Promise((res) => setTimeout(res, 300));
    expect(stream.text()).not.toContain('event: manifest-changed');
  });
});

describe('renderDirectoryIndex', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-render-'));
    writeFileSync(join(dir, 'about.html'), '');
    mkdirSync(join(dir, 'pages'), { recursive: true });
    writeFileSync(join(dir, 'pages', 'p.html'), '');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('links root-absolute by default (for the preview server)', () => {
    const html = renderDirectoryIndex(dir);
    expect(html).toContain('href="/about.html"');
    expect(html).toContain('href="/pages/p.html"');
  });

  it('links relative when rootAbsoluteLinks is false (for a deploy base path)', () => {
    const html = renderDirectoryIndex(dir, { rootAbsoluteLinks: false });
    expect(html).toContain('href="about.html"');
    expect(html).toContain('href="pages/p.html"');
    expect(html).not.toContain('href="/');
  });

  it('omits excluded pages, so an index page is not listed twice', () => {
    // A markdown index writes an alias copy (README.html next to index.html);
    // the listing should show the page once.
    writeFileSync(join(dir, 'README.html'), '');
    const html = renderDirectoryIndex(dir, { exclude: ['README.html'] });
    expect(html).not.toContain('href="/README.html"');
    expect(html).toContain('href="/about.html"');
  });
});

describe('ensureDraftIndex', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-ensure-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes a relative-link index when none exists', () => {
    writeFileSync(join(dir, 'about.html'), '');
    ensureDraftIndex(dir);

    const indexPath = join(dir, 'index.html');
    expect(existsSync(indexPath)).toBe(true);
    const html = readFileSync(indexPath, 'utf-8');
    // Relative links so they resolve under the gh-pages /<site>/ base path.
    expect(html).toContain('href="about.html"');
    expect(html).not.toContain('href="/about.html"');
  });

  it('leaves an existing index.html untouched', () => {
    writeFileSync(join(dir, 'index.html'), '<h1>mine</h1>');
    ensureDraftIndex(dir);
    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toBe('<h1>mine</h1>');
  });

  it('bakes no preview-only reload client into the pushed index', () => {
    // The reload client is injected at serve time; `push` copies files, so
    // nothing from the preview channel can reach a deployed draft.
    writeFileSync(join(dir, 'about.html'), '');
    ensureDraftIndex(dir);
    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).not.toContain(
      'data-design-drafts-preview'
    );
  });
});

describe('collectHtmlPages', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-collect-'));
    writeFileSync(join(dir, 'b.html'), '');
    writeFileSync(join(dir, 'a.html'), '');
    writeFileSync(join(dir, 'styles.css'), '');
    mkdirSync(join(dir, 'pages', 'sub'), { recursive: true });
    writeFileSync(join(dir, 'pages', 'sub', 'p.html'), '');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns html pages as sorted, root-relative POSIX paths', () => {
    expect(collectHtmlPages(dir)).toEqual([
      'a.html',
      'b.html',
      'pages/sub/p.html',
    ]);
  });

  it('ignores non-html files', () => {
    expect(collectHtmlPages(dir)).not.toContain('styles.css');
  });
});
