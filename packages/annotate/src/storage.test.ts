// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearAnnotations,
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
    saveAnnotation(annotation({ draftId: 'toolbar-redesign' }), currentPageUrl());

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
  // The panel's Clear button wipes exactly what Export would have produced:
  // this draft, every page of it, and nothing else.
  describe('clearing a draft', () => {
    const scope = 'http://localhost/';

    it('removes the draft from every page under the scope', () => {
      seed('http://localhost/index.html', [
        annotation({ id: 'home', draftId: 'toolbar-redesign' }),
      ]);
      seed('http://localhost/pricing.html', [
        annotation({ id: 'pricing', draftId: 'toolbar-redesign' }),
      ]);

      expect(clearAnnotations(scope, 'toolbar-redesign')).toBe(2);
      expect(loadAnnotationsByUrl(scope, 'toolbar-redesign').size).toBe(0);
    });

    it('leaves another draft sharing the very same URL alone', () => {
      seed('http://localhost/index.html', [
        annotation({ id: 'mine', draftId: 'toolbar-redesign' }),
        annotation({ id: 'theirs', draftId: 'pricing-page' }),
      ]);

      expect(clearAnnotations(scope, 'toolbar-redesign')).toBe(1);
      expect(
        loadAnnotationsByUrl(scope, 'pricing-page')
          .get('http://localhost/index.html')
          ?.map((a) => a.id)
      ).toEqual(['theirs']);
    });

    it('leaves pages outside the scope alone', () => {
      seed('http://localhost/other/index.html', [
        annotation({ id: 'elsewhere', draftId: 'toolbar-redesign' }),
      ]);

      expect(clearAnnotations('http://localhost/mine/', 'toolbar-redesign')).toBe(0);
      expect(
        loadAnnotationsByUrl('http://localhost/other/', 'toolbar-redesign').size
      ).toBe(1);
    });

    // Walking localStorage by index while removing keys as you go skips
    // entries, so a later page would survive a clear that reported it gone.
    it('clears every page, not every other one', () => {
      for (const page of ['a', 'b', 'c', 'd']) {
        seed(`http://localhost/${page}.html`, [
          annotation({ id: page, draftId: 'toolbar-redesign' }),
        ]);
      }

      expect(clearAnnotations(scope, 'toolbar-redesign')).toBe(4);
      expect(window.localStorage.length).toBe(0);
    });

    it('keeps a page whose other draft still has annotations on it', () => {
      seed('http://localhost/index.html', [
        annotation({ id: 'mine', draftId: 'toolbar-redesign' }),
        annotation({ id: 'theirs', draftId: 'pricing-page' }),
      ]);

      clearAnnotations(scope, 'toolbar-redesign');

      expect(window.localStorage.length).toBe(1);
    });

    it('clears only unidentified annotations for a page that declares no draft', () => {
      seed('http://localhost/index.html', [
        annotation({ id: 'legacy' }),
        annotation({ id: 'theirs', draftId: 'pricing-page' }),
      ]);

      expect(clearAnnotations(scope, undefined)).toBe(1);
      expect(loadAnnotationsByUrl(scope, 'pricing-page').size).toBe(1);
    });
  });
});
