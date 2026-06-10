// Draft-root discovery, shared by the browser bundles (toolbar, annotate).
//
// A draft is served at the origin root locally (`design-drafts preview`) but
// under a sub-path when deployed (`https://<owner>.github.io/<repo>/<site>/`),
// and pages nest to arbitrary depth (`pages/<page>/<combo>.html`). The same
// HTML must work in both, so we discover the draft root from where the page
// actually sits — walking up until we find the manifest — rather than assuming
// it lives at a fixed path.
//
// This module is dependency-free and intentionally kept out of `index.ts`'s
// barrel (which pulls in ajv via `validate.ts`) so it stays cheap to bundle
// into a <script>-tag IIFE. Import it from `@design-drafts/conventions/discover`.

const MANIFEST_FILENAME = 'design-drafts.config.json';

/**
 * Yield the directory of the page at `href`, then each parent directory, up to
 * and including the origin root. Each URL ends in a trailing slash so a relative
 * manifest filename resolves *inside* that directory. The query string and hash
 * are ignored — only the path's directory matters.
 */
export function* candidateRoots(href: string): Generator<URL> {
  const url = new URL(href);
  // Directory of the current document: keep a trailing slash as-is, otherwise
  // drop the filename segment.
  let dir = url.pathname.endsWith('/')
    ? url.pathname
    : url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1);

  while (true) {
    yield new URL(dir, url.origin);
    if (dir === '/') break;
    // Strip the last path segment: "/a/b/" -> "/a/". Search before the trailing
    // slash (length - 2) so we find the *previous* separator.
    dir = dir.slice(0, dir.lastIndexOf('/', dir.length - 2) + 1);
  }
}

export interface DiscoveredManifest<T> {
  /** URL the manifest was found at; resolve page paths against this. */
  manifestUrl: URL;
  manifest: T;
}

/**
 * Walk up from `href`, fetching `design-drafts.config.json` at each candidate
 * root, and return the first one whose body passes `isValid`. Returns null when
 * no draft root is found — callers treat that as "this isn't a draft page".
 *
 * `isValid` is supplied by the caller so each consumer decides what counts as a
 * manifest (the toolbar checks the full page shape; annotate only needs to know
 * a manifest is *there* to locate the root). `fetchImpl` is injectable for tests.
 */
export async function discoverManifest<T>(
  href: string,
  isValid: (raw: unknown) => raw is T,
  fetchImpl: typeof fetch = fetch
): Promise<DiscoveredManifest<T> | null> {
  for (const root of candidateRoots(href)) {
    const manifestUrl = new URL(MANIFEST_FILENAME, root);
    const raw = await fetchManifest(manifestUrl, fetchImpl);
    if (raw !== null && isValid(raw)) {
      return { manifestUrl, manifest: raw };
    }
  }
  return null;
}

/** The directory containing the manifest — the draft root. Always ends in '/'.
 * Use it to scope sibling lookups (e.g. annotations) to a single draft. */
export function draftRoot(manifestUrl: URL): string {
  return new URL('.', manifestUrl).href;
}

/** Fetch and parse a candidate manifest URL, returning null on any failure
 * (network error, non-2xx, or invalid JSON) so the caller can keep walking. */
async function fetchManifest(
  url: URL,
  fetchImpl: typeof fetch
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(url.href, { cache: 'no-cache' });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}
