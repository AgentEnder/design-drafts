import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub the interactive prompt so the fallback branch is deterministic and needs
// no TTY. The CLI funnels every prompt through @clack/prompts' `text`.
vi.mock('@clack/prompts', () => ({
  text: vi.fn(async () => 'prompted-name'),
}));

import {
  persistSiteNameToManifest,
  readManifestName,
  resolveSiteName,
} from './site-config';

let dir: string;
let manifestPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dd-site-config-'));
  manifestPath = join(dir, 'design-drafts.config.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('resolveSiteName', () => {
  it('returns an explicit --site-name as-is without prompting', async () => {
    const result = await resolveSiteName('my-preview', manifestPath);
    expect(result).toEqual({ siteName: 'my-preview', fromPrompt: false });
  });

  it('derives a slug from the manifest name without prompting', async () => {
    writeFileSync(
      manifestPath,
      JSON.stringify({ name: 'Toolbar Redesign Demo', pages: [] })
    );
    const result = await resolveSiteName(undefined, manifestPath);
    expect(result).toEqual({
      siteName: 'toolbar-redesign-demo',
      fromPrompt: false,
    });
  });

  it('prompts and flags fromPrompt when there is no manifest name', async () => {
    // No manifest on disk at all — the fallback path.
    const result = await resolveSiteName(undefined, manifestPath);
    expect(result).toEqual({ siteName: 'prompted-name', fromPrompt: true });
  });

  it('prompts when a manifest exists but has no usable name', async () => {
    writeFileSync(manifestPath, JSON.stringify({ pages: [] }));
    const result = await resolveSiteName(undefined, manifestPath);
    expect(result.fromPrompt).toBe(true);
  });
});

describe('readManifestName', () => {
  it('returns undefined when the manifest is missing or has no name', () => {
    expect(readManifestName(manifestPath)).toBeUndefined();
    writeFileSync(manifestPath, JSON.stringify({ pages: [] }));
    expect(readManifestName(manifestPath)).toBeUndefined();
  });
});

describe('persistSiteNameToManifest', () => {
  it('creates a valid manifest when none exists', () => {
    persistSiteNameToManifest(manifestPath, 'fresh-draft', '2026-01-01T00:00:00.000Z');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('fresh-draft');
    // A created manifest must be usable by the toolbar/conventions, so it needs
    // the structural fields, not just a name.
    expect(Array.isArray(manifest.pages)).toBe(true);
    expect(manifest.$schema).toMatch(/draft-manifest\.schema\.json$/);
  });

  it('adds the name to an existing manifest, preserving other fields', () => {
    writeFileSync(
      manifestPath,
      JSON.stringify({ prompt: 'keep me', pages: [{ coordinates: {}, path: 'index.html' }] })
    );
    persistSiteNameToManifest(manifestPath, 'added-name', '2026-01-01T00:00:00.000Z');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('added-name');
    expect(manifest.prompt).toBe('keep me');
    expect(manifest.pages).toEqual([{ coordinates: {}, path: 'index.html' }]);
  });

  it('updates a different existing name', () => {
    writeFileSync(manifestPath, JSON.stringify({ name: 'old', pages: [] }));
    persistSiteNameToManifest(manifestPath, 'new', '2026-01-01T00:00:00.000Z');
    expect(JSON.parse(readFileSync(manifestPath, 'utf-8')).name).toBe('new');
  });

  it('leaves the file byte-for-byte unchanged when the name already matches', () => {
    const original = JSON.stringify({ name: 'same', pages: [] });
    writeFileSync(manifestPath, original);
    persistSiteNameToManifest(manifestPath, 'same', '2026-01-01T00:00:00.000Z');
    expect(readFileSync(manifestPath, 'utf-8')).toBe(original);
  });

  it('does not clobber an unparseable manifest', () => {
    const garbage = '{ not json ';
    writeFileSync(manifestPath, garbage);
    persistSiteNameToManifest(manifestPath, 'whatever', '2026-01-01T00:00:00.000Z');
    expect(readFileSync(manifestPath, 'utf-8')).toBe(garbage);
  });
});
