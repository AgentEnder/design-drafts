import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  collectHtmlPages,
  contentTypeFor,
  createPreviewServer,
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
    writeFileSync(join(dir, 'draft.config.json'), '{}');
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
    writeFileSync(join(dir, 'draft.config.json'), '{}');
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
