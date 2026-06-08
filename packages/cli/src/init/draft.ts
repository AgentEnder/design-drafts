import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { localConfigPath, promptAndPersist } from '../config';
import { slugifySiteName, validateSiteName } from '../site-name';
import { draftConfig, DRAFT_INDEX_HTML } from './templates';

export interface InitDraftOptions {
  path: string;
  siteName?: string;
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

  // Don't clobber an existing draft manifest or page on re-run.
  const manifestPath = join(targetDir, 'draft.config.json');
  if (!existsSync(manifestPath)) {
    writeFileSync(manifestPath, draftConfig(siteName));
  }
  const indexPath = join(targetDir, 'index.html');
  if (!existsSync(indexPath)) {
    writeFileSync(indexPath, DRAFT_INDEX_HTML);
  }

  console.log(
    `\nDraft "${siteName}" scaffolded at ${targetDir}.\n` +
      `Edit index.html, then run \`design-drafts\` here to publish a preview.`
  );
}
