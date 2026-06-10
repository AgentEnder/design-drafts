import { describe, expect, it, vi } from 'vitest';

import { candidateRoots, discoverManifest, draftRoot } from './discover.js';

describe('candidateRoots', () => {
  const roots = (href: string): string[] =>
    [...candidateRoots(href)].map((url) => url.href);

  it('yields just the origin root for a page at the site root', () => {
    expect(roots('https://host/index.html')).toEqual(['https://host/']);
  });

  it('treats the origin root itself (trailing slash) as a single candidate', () => {
    expect(roots('https://host/')).toEqual(['https://host/']);
  });

  it('walks up from a nested page to the origin root', () => {
    expect(roots('https://host/pages/home/x.html')).toEqual([
      'https://host/pages/home/',
      'https://host/pages/',
      'https://host/',
    ]);
  });

  it('handles a draft deployed under a sub-path (GitHub Pages)', () => {
    expect(roots('https://owner.github.io/repo/site/index.html')).toEqual([
      'https://owner.github.io/repo/site/',
      'https://owner.github.io/repo/',
      'https://owner.github.io/',
    ]);
  });

  it('walks up from a nested page inside a sub-path deployment', () => {
    expect(
      roots('https://owner.github.io/repo/site/pages/home/dark.html')
    ).toEqual([
      'https://owner.github.io/repo/site/pages/home/',
      'https://owner.github.io/repo/site/pages/',
      'https://owner.github.io/repo/site/',
      'https://owner.github.io/repo/',
      'https://owner.github.io/',
    ]);
  });

  it('starts from a directory URL (trailing slash) without dropping it', () => {
    expect(roots('https://host/repo/site/')).toEqual([
      'https://host/repo/site/',
      'https://host/repo/',
      'https://host/',
    ]);
  });

  it('ignores the query string and hash when locating the directory', () => {
    expect(roots('https://host/pages/x.html?toolbar=0#frag')).toEqual([
      'https://host/pages/',
      'https://host/',
    ]);
  });
});

describe('draftRoot', () => {
  it('returns the directory containing the manifest, with a trailing slash', () => {
    expect(
      draftRoot(new URL('https://o.github.io/repo/site/design-drafts.config.json'))
    ).toBe('https://o.github.io/repo/site/');
  });
});

describe('discoverManifest', () => {
  const isThing = (raw: unknown): raw is { ok: true } =>
    !!raw && typeof raw === 'object' && (raw as { ok?: unknown }).ok === true;

  // Build a fake fetch that returns 200 + JSON only for the listed URLs.
  function fakeFetch(found: Record<string, unknown>): typeof fetch {
    return vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url in found) {
        return new Response(JSON.stringify(found[url]), { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    }) as unknown as typeof fetch;
  }

  it('returns the manifest at the nearest ancestor that has one', async () => {
    const fetchImpl = fakeFetch({
      'https://o.github.io/repo/site/design-drafts.config.json': { ok: true },
    });
    const result = await discoverManifest(
      'https://o.github.io/repo/site/pages/home/dark.html',
      isThing,
      fetchImpl
    );
    expect(result?.manifestUrl.href).toBe(
      'https://o.github.io/repo/site/design-drafts.config.json'
    );
    expect(result?.manifest).toEqual({ ok: true });
  });

  it('stops at the closest root when manifests exist at multiple levels', async () => {
    const fetchImpl = fakeFetch({
      'https://o.github.io/repo/site/design-drafts.config.json': { ok: true },
      'https://o.github.io/design-drafts.config.json': { ok: true },
    });
    const result = await discoverManifest(
      'https://o.github.io/repo/site/index.html',
      isThing,
      fetchImpl
    );
    expect(result?.manifestUrl.href).toBe(
      'https://o.github.io/repo/site/design-drafts.config.json'
    );
  });

  it('skips a manifest that fails validation and keeps walking up', async () => {
    const fetchImpl = fakeFetch({
      // A same-named file that isn't a real manifest sits beside the page.
      'https://o.github.io/repo/site/design-drafts.config.json': { ok: false },
      'https://o.github.io/design-drafts.config.json': { ok: true },
    });
    const result = await discoverManifest(
      'https://o.github.io/repo/site/index.html',
      isThing,
      fetchImpl
    );
    expect(result?.manifestUrl.href).toBe(
      'https://o.github.io/design-drafts.config.json'
    );
  });

  it('returns null when no ancestor has a manifest', async () => {
    const result = await discoverManifest(
      'https://o.github.io/repo/site/index.html',
      isThing,
      fakeFetch({})
    );
    expect(result).toBeNull();
  });
});
