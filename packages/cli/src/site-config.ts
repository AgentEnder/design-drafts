import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { promptForValue } from './config';
import { draftConfig } from './init/templates';
import { slugifySiteName } from './site-name';

export interface ResolvedSiteName {
  siteName: string;
  /** True when the value came from an interactive prompt (nothing else supplied
   * it). The caller persists these into the manifest so the next push derives
   * the name instead of re-prompting; explicit/derived names are left alone. */
  fromPrompt: boolean;
}

/** Reads the manifest's human-readable `name` so the push can derive a
 * site-name from it. Returns undefined when there is no manifest, it doesn't
 * parse, or it has no usable `name`. */
export function readManifestName(manifestPath: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object') return undefined;
  const name = (parsed as Record<string, unknown>).name;
  return typeof name === 'string' && name.trim() ? name : undefined;
}

/**
 * The identity generated pages declare so the annotate overlay can tell this
 * draft's annotations from another's (see `@design-drafts/conventions/draft-id`).
 *
 * It is the same slug `resolveSiteName` derives from the manifest name — the
 * draft's branch and gh-pages directory. Deriving it rather than storing an id
 * keeps the manifest as the one place a draft is named, and means a page
 * previewed on localhost and the same page deployed to gh-pages declare the
 * same draft. Undefined when the draft has no manifest name yet (a markdown
 * folder before its first push); such pages are scoped by URL alone, as they
 * always have been.
 */
export function resolveDraftId(manifestPath: string): string | undefined {
  const name = readManifestName(manifestPath);
  if (!name) return undefined;
  return slugifySiteName(name) || undefined;
}

/**
 * Resolves the site-name (the branch/preview directory name) for a push.
 *
 * Precedence: an explicit `--site-name` wins; otherwise we derive it from the
 * manifest's `name` by slugifying it (so "Toolbar redesign demo" becomes
 * "toolbar-redesign-demo"). Only when there is no manifest name to read do we
 * fall back to prompting — and we flag that case so the caller can record the
 * answer in the manifest, keeping it as the single per-draft store.
 */
export async function resolveSiteName(
  explicit: string | undefined,
  manifestPath: string
): Promise<ResolvedSiteName> {
  if (explicit) return { siteName: explicit, fromPrompt: false };

  const fromManifest = readManifestName(manifestPath);
  if (fromManifest) {
    const slug = slugifySiteName(fromManifest);
    if (slug) return { siteName: slug, fromPrompt: false };
  }

  const siteName = await promptForValue(
    undefined,
    'site-name',
    'Site name for this preview:'
  );
  return { siteName, fromPrompt: true };
}

/**
 * Records `siteName` as the manifest's `name` so future pushes derive it
 * instead of re-prompting. Creates a minimal valid manifest when none exists;
 * otherwise merges into the existing one, preserving every other field. An
 * unparseable manifest is left untouched rather than clobbered.
 */
export function persistSiteNameToManifest(
  manifestPath: string,
  siteName: string,
  createdAt: string
): void {
  if (!existsSync(manifestPath)) {
    writeFileSync(manifestPath, draftConfig(siteName, createdAt));
    return;
  }

  let manifest: Record<string, unknown>;
  try {
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (!parsed || typeof parsed !== 'object') return;
    manifest = parsed as Record<string, unknown>;
  } catch {
    return;
  }

  if (manifest.name === siteName) return;
  manifest.name = siteName;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
