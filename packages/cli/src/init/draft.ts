import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { localConfigPath, promptAndPersist } from '../config';
import { slugifySiteName, validateSiteName } from '../site-name';
import { draftConfig, DRAFT_INDEX_HTML } from './templates';

export interface InitDraftOptions {
  path: string;
  siteName?: string;
}

/** Writes the file only if it is absent, logging which path it created and
 * which it left untouched. Returns true when a file was written. */
function writeIfAbsent(filePath: string, contents: string): boolean {
  const name = basename(filePath);
  if (existsSync(filePath)) {
    console.log(`  skipped ${name} (already exists)`);
    return false;
  }
  writeFileSync(filePath, contents);
  console.log(`  created ${name}`);
  return true;
}

export async function initDraft(opts: InitDraftOptions): Promise<void> {
  const targetDir = resolve(opts.path);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  let siteName = await promptAndPersist(
    opts.siteName,
    'site-name',
    localConfigPath,
    'Site name for this draft:'
  );

  const validation = validateSiteName(siteName);
  if (!validation.ok) {
    const fixed = validation.suggestion ?? slugifySiteName(siteName);
    console.warn(
      `"${siteName}" is not a valid site-name (${validation.reason}); using "${fixed}".`
    );
    siteName = fixed;
  }

  // Don't clobber an existing draft manifest or page on re-run; report what
  // each file did so a re-run reads as "nothing to do" rather than a fresh
  // scaffold.
  console.log(`\nScaffolding draft "${siteName}" in ${targetDir}:`);
  const wroteManifest = writeIfAbsent(
    join(targetDir, 'draft.config.json'),
    draftConfig(siteName, new Date().toISOString())
  );
  const wroteIndex = writeIfAbsent(
    join(targetDir, 'index.html'),
    DRAFT_INDEX_HTML
  );

  if (!wroteManifest && !wroteIndex) {
    console.log(
      `\nDraft "${siteName}" was already scaffolded; nothing to write.`
    );
    return;
  }

  console.log(
    `\nDraft "${siteName}" ready.\n` +
      `Edit index.html, then run \`design-drafts\` here to publish a preview.`
  );
}
