import type {
  DraftAxis,
  DraftManifest,
  DraftPage,
} from '@design-drafts/conventions';

export interface ResolvedManifest {
  manifest: DraftManifest;
  /** URL of the manifest, used to resolve page paths against. */
  manifestUrl: URL;
}

/**
 * Fetch the draft manifest from `/draft.config.json`. Returns null if the file
 * is missing or unparseable — callers should treat that as "this isn't a
 * draft page, do nothing".
 *
 * Note: full schema validation lives in `@design-drafts/conventions`'s
 * `parseDraftManifest`, but it pulls in ajv (~100KB) which would blow the
 * toolbar bundle budget. We do a minimal structural shape check instead and
 * trust that anything served at `/draft.config.json` was written by tooling
 * that already ran the strict validator.
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

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return null;
  }

  if (!isDraftManifestShape(raw)) return null;
  return { manifest: raw, manifestUrl };
}

function isDraftManifestShape(value: unknown): value is DraftManifest {
  if (!value || typeof value !== 'object') return false;
  const v = value as { name?: unknown; pages?: unknown; axes?: unknown };
  if (typeof v.name !== 'string') return false;
  if (!Array.isArray(v.pages)) return false;
  for (const page of v.pages) {
    if (!page || typeof page !== 'object') return false;
    const p = page as { path?: unknown; coordinates?: unknown };
    if (typeof p.path !== 'string') return false;
    if (!p.coordinates || typeof p.coordinates !== 'object') return false;
  }
  if (v.axes !== undefined && !Array.isArray(v.axes)) return false;
  return true;
}

/**
 * Build a stable canonical key for a coordinate map. Keys are sorted by axis
 * name so that the order in which they were written doesn't matter.
 */
export function coordsToKey(coordinates: Record<string, string>): string {
  const entries = Object.entries(coordinates).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  return entries.map(([k, v]) => `${k}=${v}`).join('&');
}

/**
 * Index pages by canonical coordinate key for O(1) neighbour lookup.
 */
export function indexPagesByCoords(
  pages: DraftPage[]
): Map<string, DraftPage> {
  const out = new Map<string, DraftPage>();
  for (const page of pages) {
    out.set(coordsToKey(page.coordinates), page);
  }
  return out;
}

/**
 * Find the page whose path matches the current URL. Falls back to the first
 * page if nothing matches — callers should treat that as "we don't know where
 * the user is, but we still want to show something".
 */
export function findCurrentPage(
  manifest: DraftManifest,
  manifestUrl: URL
): DraftPage | undefined {
  if (manifest.pages.length === 0) return undefined;
  const current = window.location.pathname;
  for (const page of manifest.pages) {
    const resolved = new URL(page.path, manifestUrl).pathname;
    if (resolved === current) return page;
  }
  // Fall back: pick the first page whose resolved path looks like an index,
  // otherwise just the first declared page. This avoids crashing when the
  // user lands on the draft root or some unrelated URL.
  for (const page of manifest.pages) {
    if (/(^|\/)index\.html?$/.test(page.path)) return page;
  }
  return manifest.pages[0];
}

/**
 * Build the destination URL for a page entry, preserving the current
 * search string so that ad-hoc query params survive page switches.
 */
export function pageHref(page: DraftPage, manifestUrl: URL): string {
  const target = new URL(page.path, manifestUrl);
  target.search = window.location.search;
  return target.href;
}

/**
 * For an axis-choice combination, find the page that would be reached by
 * flipping just that axis on the current coordinates. Returns undefined when
 * no such page exists in the manifest (sparse coverage) — callers render
 * those choices as disabled.
 */
export function findNeighbourPage(
  axis: DraftAxis,
  choiceName: string,
  currentCoords: Record<string, string>,
  pageIndex: Map<string, DraftPage>
): DraftPage | undefined {
  const candidate = { ...currentCoords, [axis.name]: choiceName };
  return pageIndex.get(coordsToKey(candidate));
}
