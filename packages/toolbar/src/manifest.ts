import type { DraftManifest, DraftPage } from '@design-drafts/conventions';
import { discoverManifest } from '@design-drafts/conventions/discover';

export interface ResolvedManifest {
  manifest: DraftManifest;
  /** URL of the manifest, used to resolve page paths against. */
  manifestUrl: URL;
}

/**
 * Locate and fetch the draft manifest by walking up from the current page (see
 * `@design-drafts/conventions/discover`). Returns null when no draft root is
 * found — callers should treat that as "this isn't a draft page, do nothing".
 *
 * Note: full schema validation lives in `@design-drafts/conventions`'s
 * `parseDraftManifest`, but it pulls in ajv (~100KB) which would blow the
 * toolbar bundle budget. We do a minimal structural shape check instead and
 * trust that anything served as the manifest was written by tooling that
 * already ran the strict validator.
 */
export async function loadManifest(): Promise<ResolvedManifest | null> {
  const found = await discoverManifest(
    window.location.href,
    isDraftManifestShape
  );
  if (!found) return null;
  return { manifest: found.manifest, manifestUrl: found.manifestUrl };
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

/** One axis whose value differs from the current page after an auto-route. */
export interface ChangedAxis {
  axis: string;
  value: string;
}

/** Where selecting a choice will take you, and what else moves to get there. */
export interface ChoiceTarget {
  page: DraftPage;
  /**
   * Axes other than the one being selected whose value differs between the
   * current page and the target. Empty for a plain one-axis flip; non-empty
   * when the grid is sparse and we had to move sideways to reach the choice.
   */
  changedAxes: ChangedAxis[];
}

/**
 * Resolve where selecting `choiceName` on `axisName` should navigate, given the
 * current coordinates.
 *
 * Drafts are sparse: there isn't always a page that differs from the current
 * one by only the chosen axis. Rather than dead-end such choices, we pick the
 * *nearest* page that demonstrates the choice — the one that forces the fewest
 * other axes to change — and report which axes those are so the UI can show the
 * cross-axis jump (e.g. "also sets Theme → Calm"). Ties break by manifest
 * declaration order, giving authors control over the canonical fallback.
 *
 * Returns undefined only when no page in the draft uses the choice at all; the
 * UI renders those as truly disabled.
 */
export function resolveChoiceTarget(
  axisName: string,
  choiceName: string,
  currentCoords: Record<string, string>,
  pages: DraftPage[]
): ChoiceTarget | undefined {
  let best: DraftPage | undefined;
  let bestDistance = Infinity;

  for (const page of pages) {
    if (page.coordinates[axisName] !== choiceName) continue;
    const distance = coordinateDistance(axisName, currentCoords, page.coordinates);
    // Strict `<` keeps the first page at a given distance, so equal-distance
    // candidates fall back to manifest declaration order.
    if (distance < bestDistance) {
      best = page;
      bestDistance = distance;
    }
  }

  if (!best) return undefined;

  const changedAxes: ChangedAxis[] = [];
  for (const [axis, value] of Object.entries(currentCoords)) {
    if (axis === axisName) continue;
    const targetValue = best.coordinates[axis];
    if (targetValue !== undefined && targetValue !== value) {
      changedAxes.push({ axis, value: targetValue });
    }
  }

  return { page: best, changedAxes };
}

/**
 * Count how many axes (other than `axisName`) the target page changes relative
 * to the current coordinates. Only axes present in `currentCoords` count, so an
 * off-axis page (which pins fewer coordinates) measures distance over what it
 * actually constrains.
 */
function coordinateDistance(
  axisName: string,
  currentCoords: Record<string, string>,
  targetCoords: Record<string, string>
): number {
  let distance = 0;
  for (const [axis, value] of Object.entries(currentCoords)) {
    if (axis === axisName) continue;
    if (targetCoords[axis] !== value) distance += 1;
  }
  return distance;
}

/**
 * Turn an axis/choice identifier slug into a human-friendly label, used as a
 * fallback when the manifest doesn't supply an explicit `label`. Separators
 * (`-`, `_`) become spaces and each word is capitalised.
 */
export function humanizeName(name: string): string {
  return name
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
