import type {
  DraftManifest,
  DraftNamedEntry,
  DraftPageEntry,
} from '@design-drafts/conventions';

export type ManifestEntry = DraftPageEntry | DraftNamedEntry;

export interface ResolvedManifest {
  manifest: DraftManifest;
  /** Path to the manifest, used to resolve entry paths against. */
  manifestUrl: URL;
}

/**
 * Fetch the draft manifest from `/draft.config.json`. Returns null if the file
 * is missing or unparseable — callers should treat that as "this isn't a
 * draft page, do nothing".
 */
export async function loadManifest(): Promise<ResolvedManifest | null> {
  const manifestUrl = new URL('/draft.config.json', window.location.origin);
  let response: Response;
  try {
    response = await fetch(manifestUrl.href, { cache: 'no-cache' });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  let manifest: DraftManifest;
  try {
    manifest = (await response.json()) as DraftManifest;
  } catch {
    return null;
  }

  // Minimal shape check: a draft manifest must at least be an object with a
  // `name`. We don't re-run full schema validation in the browser to keep the
  // bundle small.
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    typeof (manifest as { name?: unknown }).name !== 'string'
  ) {
    return null;
  }

  return { manifest, manifestUrl };
}

/**
 * Determine the active entry in a list by matching against the current page's
 * pathname. Falls back to the first entry if no match.
 */
export function findActiveEntry<T extends ManifestEntry>(
  entries: T[] | undefined,
  manifestUrl: URL
): T | undefined {
  if (!entries || entries.length === 0) return undefined;
  const current = window.location.pathname;
  for (const entry of entries) {
    const resolved = new URL(entry.path, manifestUrl).pathname;
    if (resolved === current) return entry;
  }
  return undefined;
}

/**
 * Build the destination URL for a manifest entry, preserving the current
 * search string so that ad-hoc query params survive page switches.
 */
export function entryHref(entry: ManifestEntry, manifestUrl: URL): string {
  const target = new URL(entry.path, manifestUrl);
  target.search = window.location.search;
  return target.href;
}
