import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resolveDraftDir } from './draft-dir';

describe('resolveDraftDir', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'design-drafts-draft-dir-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('accepts a directory with a manifest', () => {
    writeFileSync(join(dir, 'design-drafts.config.json'), '{}');
    expect(resolveDraftDir(dir)).toBe(dir);
  });

  it('accepts a markdown-only directory without a manifest', () => {
    writeFileSync(join(dir, 'README.md'), '# Docs');
    expect(resolveDraftDir(dir)).toBe(dir);
  });

  it('rejects a directory with neither manifest nor markdown', () => {
    writeFileSync(join(dir, 'index.html'), '<!doctype html>');
    expect(() => resolveDraftDir(dir)).toThrow(/design-drafts\.config\.json/);
  });
});
