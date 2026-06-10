import type { DraftPage } from '@design-drafts/conventions';
import { describe, expect, it } from 'vitest';

import { humanizeName, resolveChoiceTarget } from './manifest.js';

function page(coordinates: Record<string, string>, path: string): DraftPage {
  return { coordinates, path };
}

// A deliberately sparse grid: theme = {calm, bold, editorial} × media = {photo,
// illustration}, but illustration only exists under calm.
const PAGES: DraftPage[] = [
  page({ theme: 'calm', media: 'photo' }, 'index.html'),
  page({ theme: 'bold', media: 'photo' }, 'bold-photo.html'),
  page({ theme: 'editorial', media: 'photo' }, 'editorial-photo.html'),
  page({ theme: 'calm', media: 'illustration' }, 'calm-illustration.html'),
];

describe('resolveChoiceTarget', () => {
  it('flips a single axis when a direct neighbour exists, with no other changes', () => {
    const target = resolveChoiceTarget(
      'theme',
      'bold',
      { theme: 'calm', media: 'photo' },
      PAGES
    );
    expect(target?.page.path).toBe('bold-photo.html');
    expect(target?.changedAxes).toEqual([]);
  });

  it('returns the current page when the choice is already selected', () => {
    const target = resolveChoiceTarget(
      'theme',
      'calm',
      { theme: 'calm', media: 'photo' },
      PAGES
    );
    expect(target?.page.path).toBe('index.html');
    expect(target?.changedAxes).toEqual([]);
  });

  it('auto-routes to the nearest page and reports the other axes it had to move', () => {
    // From bold·photo there is no bold·illustration — must jump to calm·illustration.
    const target = resolveChoiceTarget(
      'media',
      'illustration',
      { theme: 'bold', media: 'photo' },
      PAGES
    );
    expect(target?.page.path).toBe('calm-illustration.html');
    expect(target?.changedAxes).toEqual([{ axis: 'theme', value: 'calm' }]);
  });

  it('returns undefined when no page demonstrates the choice at all', () => {
    const target = resolveChoiceTarget(
      'media',
      'video',
      { theme: 'bold', media: 'photo' },
      PAGES
    );
    expect(target).toBeUndefined();
  });

  it('resolves from an off-axis page (no current coordinate for the axis)', () => {
    // An overview page that sits on no axis. Picking any choice should still route.
    const target = resolveChoiceTarget('media', 'illustration', {}, PAGES);
    expect(target?.page.path).toBe('calm-illustration.html');
    // Nothing in the current (empty) coords differs, so no axes are reported as changed.
    expect(target?.changedAxes).toEqual([]);
  });

  it('prefers the closest candidate, then manifest declaration order on ties', () => {
    // Two illustration pages equidistant (both differ only by theme) from a
    // current page that is off the theme axis: declaration order wins.
    const pages: DraftPage[] = [
      page({ theme: 'bold', media: 'photo' }, 'bold-photo.html'),
      page({ theme: 'editorial', media: 'illustration' }, 'ed-illo.html'),
      page({ theme: 'calm', media: 'illustration' }, 'calm-illo.html'),
    ];
    const target = resolveChoiceTarget(
      'media',
      'illustration',
      { media: 'photo' },
      pages
    );
    expect(target?.page.path).toBe('ed-illo.html');
  });
});

describe('humanizeName', () => {
  it('title-cases a single token', () => {
    expect(humanizeName('cinematic')).toBe('Cinematic');
  });

  it('splits hyphen/underscore separators into words', () => {
    expect(humanizeName('notion-approachable')).toBe('Notion Approachable');
    expect(humanizeName('left_rail')).toBe('Left Rail');
  });

  it('keeps embedded numbers attached to their token', () => {
    expect(humanizeName('v2-layout')).toBe('V2 Layout');
  });
});
