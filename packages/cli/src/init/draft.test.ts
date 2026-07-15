import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { initDraft } from './draft';

describe('initDraft', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-init-draft-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('scaffolds a manifest and placeholder index.html in an empty directory', async () => {
    await initDraft({ path: dir, siteName: 'my-draft' });

    expect(existsSync(join(dir, 'design-drafts.config.json'))).toBe(true);
    expect(existsSync(join(dir, 'index.html'))).toBe(true);
  });

  it('skips the placeholder index.html in a markdown draft', async () => {
    // A placeholder .html would flip the folder out of markdown-draft
    // detection, so push/preview would never render the .md files.
    writeFileSync(join(dir, 'README.md'), '# Docs');
    await initDraft({ path: dir, siteName: 'my-docs' });

    expect(existsSync(join(dir, 'design-drafts.config.json'))).toBe(true);
    expect(existsSync(join(dir, 'index.html'))).toBe(false);
  });

  // The id annotate filters on is the site-name slug, so a name that needed
  // slugifying must reach index.html in its slugified form — the same form the
  // push derives from the manifest for every other page of the draft.
  it('declares the slugified site-name as the draft id', async () => {
    await initDraft({ path: dir, siteName: 'My Draft!' });

    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toContain(
      '<meta name="draftId" content="my-draft" />'
    );
  });

  it('never clobbers existing files on re-run', async () => {
    writeFileSync(join(dir, 'index.html'), '<h1>mine</h1>');
    await initDraft({ path: dir, siteName: 'my-draft' });

    expect(readFileSync(join(dir, 'index.html'), 'utf-8')).toBe('<h1>mine</h1>');
  });
});
