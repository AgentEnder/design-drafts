import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

import { isCancel, select } from '@clack/prompts';
import {
  collectMarkdownPages,
  isMarkdownDraft,
  type MarkdownPage,
} from '@design-drafts/markdown-site';

import { draftConfig } from './init/templates';
import { slugifySiteName } from './site-name';

/** A prompt asking which page should be the draft's index. Returns a
 * candidate's sourcePath, or null for the generated page listing. */
export type IndexPrompt = (
  candidates: readonly MarkdownPage[]
) => Promise<string | null>;

/**
 * Reads the manifest's persisted index choice: a root-relative markdown path,
 * null when the generated listing was chosen, or undefined when nothing was
 * ever chosen (or the manifest is missing/unreadable).
 */
export function readMarkdownIndexFromManifest(
  manifestPath: string
): string | null | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    return undefined;
  }
  if (!parsed || typeof parsed !== 'object') return undefined;
  const value = (parsed as Record<string, unknown>).markdownIndex;
  if (value === null) return null;
  return typeof value === 'string' && value ? value : undefined;
}

/**
 * Records the index choice in the manifest so future pushes and previews skip
 * the prompt. A markdown draft often has no manifest yet (`preview` runs
 * without one), so this creates a minimal valid one — named after the
 * directory, the same slug a push would derive — rather than dropping an
 * answer the user just gave us. An unparseable manifest is left untouched.
 */
export function persistMarkdownIndexToManifest(
  manifestPath: string,
  choice: string | null,
  draftDir: string
): void {
  if (!existsSync(manifestPath)) {
    const siteName = slugifySiteName(basename(draftDir)) || 'draft';
    const created = JSON.parse(
      draftConfig(siteName, new Date().toISOString())
    ) as Record<string, unknown>;
    created.markdownIndex = choice;
    writeFileSync(manifestPath, JSON.stringify(created, null, 2) + '\n');
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
  if (manifest.markdownIndex === choice) return;
  manifest.markdownIndex = choice;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

const promptWithSelect: IndexPrompt = async (candidates) => {
  const choice = await select<string | null>({
    message: 'No README.md here — what should the draft index be?',
    options: [
      { value: null, label: 'A generated listing of every page' },
      ...candidates.map((page) => ({
        value: page.sourcePath as string | null,
        label: page.title,
        hint: page.sourcePath,
      })),
    ],
  });
  if (isCancel(choice)) {
    process.exit(1);
  }
  return choice;
};

/**
 * Decides which markdown source should render as the draft's `index.html`,
 * for the renderer's `indexSource` option (undefined = no designated doc:
 * either a README/index.md already claims the index, or the generated listing
 * was chosen and `ensureDraftIndex`/the preview server provide it).
 *
 * README.md (or index.md) is preselected without asking. Otherwise the
 * persisted manifest choice wins; failing that — including a persisted doc
 * that no longer exists — the user picks between the generated listing and
 * any doc at the draft root, and the answer is persisted.
 */
export async function resolveMarkdownIndex(
  dir: string,
  manifestPath: string,
  prompt: IndexPrompt = promptWithSelect
): Promise<string | undefined> {
  if (!isMarkdownDraft(dir)) return undefined;
  const pages = collectMarkdownPages(dir);
  if (pages.some((page) => page.outputPath === 'index.html')) return undefined;

  const persisted = readMarkdownIndexFromManifest(manifestPath);
  if (persisted === null) return undefined;
  if (
    typeof persisted === 'string' &&
    pages.some((page) => page.sourcePath === persisted)
  ) {
    return persisted;
  }

  const candidates = pages.filter((page) => !page.sourcePath.includes('/'));
  if (candidates.length === 0) return undefined;
  const choice = await prompt(candidates);
  persistMarkdownIndexToManifest(manifestPath, choice, dir);
  console.log(
    choice
      ? `Saved "${choice}" as the draft index in design-drafts.config.json`
      : 'Saved the generated page listing as the draft index in design-drafts.config.json'
  );
  return choice ?? undefined;
}
