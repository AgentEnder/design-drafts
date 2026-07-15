// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  currentPageUrl,
  loadAnnotations,
  loadAnnotationsByUrl,
  saveAnnotation,
  type Annotation,
} from './storage.js';

function annotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'a1',
    comment: 'tighten this',
    createdAt: 1,
    updatedAt: 1,
    selector: { tagName: 'section' },
    ...overrides,
  } as Annotation;
}

/** Writes a storage entry for `url` directly, standing in for annotations left
 * behind by an earlier visit — to another page, or to another draft served at
 * this same URL. */
function seed(url: string, annotations: Annotation[]): void {
  window.localStorage.setItem('dd:annotate:' + url, JSON.stringify(annotations));
}

describe('annotation storage scoped by draft', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState(null, '', '/index.html');
  });

  it('keeps annotations written for this draft', () => {
    saveAnnotation(annotation({ draftId: 'toolbar-redesign' }));

    expect(loadAnnotations('toolbar-redesign')).toHaveLength(1);
  });

  // The reason this exists: a preview server hands every draft the same
  // localhost URL, so URL scoping alone cannot tell one draft's annotations
  // from the next one's.
  it('hides annotations another draft left at this very URL', () => {
    seed(currentPageUrl(), [
      annotation({ id: 'mine', draftId: 'toolbar-redesign' }),
      annotation({ id: 'theirs', draftId: 'pricing-page' }),
    ]);

    expect(loadAnnotations('toolbar-redesign').map((a) => a.id)).toEqual(['mine']);
  });

  it('hides an identified draft from a page that declares none', () => {
    seed(currentPageUrl(), [annotation({ id: 'theirs', draftId: 'pricing-page' })]);

    expect(loadAnnotations(undefined)).toEqual([]);
  });

  // Hand-written drafts declare no id and never have. They keep working: their
  // annotations are scoped by URL alone, exactly as before.
  it('keeps unidentified annotations for a page that declares no draft', () => {
    seed(currentPageUrl(), [annotation({ id: 'legacy' })]);

    expect(loadAnnotations(undefined).map((a) => a.id)).toEqual(['legacy']);
  });

  describe('sibling-page panel', () => {
    const scope = 'http://localhost/';

    it('lists sibling pages of this draft', () => {
      seed('http://localhost/pricing.html', [
        annotation({ id: 'sibling', draftId: 'toolbar-redesign' }),
      ]);

      const byUrl = loadAnnotationsByUrl(scope, 'toolbar-redesign');

      expect([...byUrl.keys()]).toEqual(['http://localhost/pricing.html']);
    });

    it('drops a sibling page that belongs to another draft', () => {
      seed('http://localhost/pricing.html', [
        annotation({ id: 'theirs', draftId: 'pricing-page' }),
      ]);

      expect(loadAnnotationsByUrl(scope, 'toolbar-redesign').size).toBe(0);
    });

    it('drops the other draft from a page the two drafts share', () => {
      seed('http://localhost/pricing.html', [
        annotation({ id: 'mine', draftId: 'toolbar-redesign' }),
        annotation({ id: 'theirs', draftId: 'pricing-page' }),
      ]);

      const byUrl = loadAnnotationsByUrl(scope, 'toolbar-redesign');

      expect(byUrl.get('http://localhost/pricing.html')?.map((a) => a.id)).toEqual([
        'mine',
      ]);
    });
  });
});
