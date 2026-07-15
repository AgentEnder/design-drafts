import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { MarkdownPage } from '@design-drafts/markdown-site';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type IndexPrompt,
  persistMarkdownIndexToManifest,
  readMarkdownIndexFromManifest,
  resolveMarkdownIndex,
} from './markdown-index';

let dir: string;
let manifestPath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dd-md-index-'));
  manifestPath = join(dir, 'design-drafts.config.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(relPath: string, content: string): void {
  const abs = join(dir, relPath);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content);
}

/** A prompt stub that records whether it ran and returns a fixed choice. */
function stubPrompt(choice: string | null) {
  const calls: (readonly MarkdownPage[])[] = [];
  const prompt: IndexPrompt = (candidates) => {
    calls.push(candidates);
    return Promise.resolve(choice);
  };
  return { prompt, calls };
}

describe('readMarkdownIndexFromManifest', () => {
  it('returns the persisted source path', () => {
    write('design-drafts.config.json', '{"markdownIndex": "notes.md"}');
    expect(readMarkdownIndexFromManifest(manifestPath)).toBe('notes.md');
  });

  it('returns null when the generated listing was chosen', () => {
    write('design-drafts.config.json', '{"markdownIndex": null}');
    expect(readMarkdownIndexFromManifest(manifestPath)).toBeNull();
  });

  it('returns undefined for a missing manifest, missing field, or junk', () => {
    expect(readMarkdownIndexFromManifest(manifestPath)).toBeUndefined();
    write('design-drafts.config.json', '{}');
    expect(readMarkdownIndexFromManifest(manifestPath)).toBeUndefined();
    write('design-drafts.config.json', '{"markdownIndex": 42}');
    expect(readMarkdownIndexFromManifest(manifestPath)).toBeUndefined();
    write('design-drafts.config.json', 'not json');
    expect(readMarkdownIndexFromManifest(manifestPath)).toBeUndefined();
  });
});

describe('persistMarkdownIndexToManifest', () => {
  it('merges the choice into an existing manifest, preserving other fields', () => {
    write('design-drafts.config.json', '{"name": "My Draft"}');
    persistMarkdownIndexToManifest(manifestPath, 'notes.md', dir);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest).toEqual({ name: 'My Draft', markdownIndex: 'notes.md' });
  });

  it('persists the generated-listing choice as null', () => {
    write('design-drafts.config.json', '{"name": "My Draft"}');
    persistMarkdownIndexToManifest(manifestPath, null, dir);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.markdownIndex).toBeNull();
  });

  it('creates a valid manifest named after the directory when none exists', () => {
    // preview runs against manifest-less markdown folders; an answer given
    // there must still stick.
    persistMarkdownIndexToManifest(manifestPath, 'notes.md', dir);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.markdownIndex).toBe('notes.md');
    expect(typeof manifest.name).toBe('string');
    expect(manifest.name.length).toBeGreaterThan(0);
    expect(manifest.pages).toEqual([{ coordinates: {}, path: 'index.html' }]);
    expect(manifest.createdAt).toBeTruthy();
  });
});

describe('resolveMarkdownIndex', () => {
  it('preselects a README without prompting', async () => {
    write('README.md', '# Home');
    write('notes.md', '# Notes');
    const { prompt, calls } = stubPrompt('notes.md');
    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('honors a persisted doc choice without prompting', async () => {
    write('notes.md', '# Notes');
    write('design-drafts.config.json', '{"markdownIndex": "notes.md"}');
    const { prompt, calls } = stubPrompt(null);
    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBe('notes.md');
    expect(calls).toHaveLength(0);
  });

  it('honors a persisted generated-listing choice without prompting', async () => {
    write('notes.md', '# Notes');
    write('design-drafts.config.json', '{"markdownIndex": null}');
    const { prompt, calls } = stubPrompt('notes.md');
    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('prompts with only the root-level docs and persists the answer', async () => {
    write('notes.md', '# Notes');
    write('zoo.md', '# Zoo');
    write('guides/setup.md', '# Setup');
    write('design-drafts.config.json', '{"name": "My Draft"}');
    const { prompt, calls } = stubPrompt('zoo.md');

    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBe('zoo.md');
    expect(calls).toHaveLength(1);
    expect(calls[0].map((p) => p.sourcePath)).toEqual(['notes.md', 'zoo.md']);
    expect(readMarkdownIndexFromManifest(manifestPath)).toBe('zoo.md');
  });

  it('persists the answer even when the draft has no manifest yet', async () => {
    // The `preview` path: a bare markdown folder, no config file at all.
    write('notes.md', '# Notes');
    const { prompt } = stubPrompt('notes.md');

    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBe('notes.md');
    expect(readMarkdownIndexFromManifest(manifestPath)).toBe('notes.md');
  });

  it('re-prompts when the persisted doc no longer exists', async () => {
    write('notes.md', '# Notes');
    write('design-drafts.config.json', '{"markdownIndex": "gone.md"}');
    const { prompt, calls } = stubPrompt('notes.md');

    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBe('notes.md');
    expect(calls).toHaveLength(1);
    expect(readMarkdownIndexFromManifest(manifestPath)).toBe('notes.md');
  });

  it('returns undefined for the generated-listing answer and persists null', async () => {
    write('notes.md', '# Notes');
    write('design-drafts.config.json', '{"name": "My Draft"}');
    const { prompt } = stubPrompt(null);

    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBeUndefined();
    expect(readMarkdownIndexFromManifest(manifestPath)).toBeNull();
  });

  it('returns undefined for non-markdown drafts without prompting', async () => {
    write('index.html', '<!doctype html>');
    const { prompt, calls } = stubPrompt(null);
    expect(await resolveMarkdownIndex(dir, manifestPath, prompt)).toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});
