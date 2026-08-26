import { describe, expect, it } from 'vitest';

import { annotationsToMarkdown } from './export.js';
import type { SelectorBundle } from './selectors.js';
import type { Annotation } from './storage.js';

function bundle(overrides: Partial<SelectorBundle> = {}): SelectorBundle {
  return {
    annotateId: null,
    elementId: null,
    cssPath: 'main > p',
    headingAnchor: null,
    tagName: 'p',
    preview: 'Ships in under a minute',
    anchors: [
      {
        css: 'main > p',
        xpath: '/html/body/main/p[1]',
        tagName: 'p',
        unique: true,
      },
    ],
    ...overrides,
  };
}

function annotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'a1',
    comment: 'tighten this copy',
    createdAt: 1,
    updatedAt: 1,
    selector: bundle(),
    ...overrides,
  };
}

describe('annotationsToMarkdown', () => {
  it('renders a page section per page, numbered within each page', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://localhost:4321/index.html',
          annotations: [annotation(), annotation({ id: 'a2', comment: 'more air' })],
        },
        {
          url: 'http://localhost:4321/pricing.html',
          annotations: [annotation({ id: 'a3', comment: 'reorder tiers' })],
        },
      ],
      { draftId: 'turnbuckle-marketing', exportedAt: '2026-08-26T12:00:00.000Z' }
    );

    expect(md).toContain('- Draft: `turnbuckle-marketing`');
    expect(md).toContain('- Exported: 2026-08-26T12:00:00.000Z');
    expect(md).toContain('- Annotations: 3');
    expect(md).toContain('## http://localhost:4321/index.html');
    expect(md).toContain('## http://localhost:4321/pricing.html');
    expect(md).toContain('### 1.');
    expect(md).toContain('### 2.');
    // Numbering restarts on the second page, matching the panel's pins.
    expect(md.split('### 1.').length - 1).toBe(2);
  });

  it('disambiguates a short quote with its surrounding words', () => {
    // Reported from a real export: `li · "the"` named no particular place,
    // even though the context to place it was already captured.
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({
                tagName: 'li',
                cssPath: 'li:nth-of-type(2)',
                headingAnchor: { text: 'If the bookmarks bar is hidden', offset: 0 },
                textRange: {
                  exact: 'the',
                  prefix: 'Drag ',
                  suffix: ' button up onto the bar.',
                  start: 5,
                  end: 8,
                },
              }),
            }),
          ],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).toContain('- Context: Drag ⟦the⟧ button up onto the bar.');
    expect(md).toContain('- Section: “If the bookmarks bar is hidden”');
  });

  it('marks the DOM anchor as a rendered coordinate, and puts text first', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({
                headingAnchor: { text: 'Pricing', offset: 0 },
                textRange: {
                  exact: 'under a minute',
                  prefix: 'Ships in ',
                  suffix: ', every time.',
                  start: 9,
                  end: 23,
                },
              }),
            }),
          ],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).toContain('(rendered DOM');
    // An agent editing source should meet the verbatim text before the
    // selectors, which describe output rather than source.
    expect(md.indexOf('- Context:')).toBeLessThan(md.indexOf('- CSS:'));
    expect(md.indexOf('- Section:')).toBeLessThan(md.indexOf('- Context:'));
  });

  it('surfaces a source location when the page volunteered one', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({ sourceRef: 'src/pages/about.mdx:42:7' }),
            }),
          ],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).toContain('- Source: `src/pages/about.mdx:42:7`');
  });

  it('falls back to the block text for an element annotation', () => {
    const md = annotationsToMarkdown(
      [{ url: 'http://x/', annotations: [annotation()] }],
      { exportedAt: 'now' }
    );

    expect(md).toContain('- Text: Ships in under a minute');
  });

  it('lists searchable runs when the selection crossed inline markup', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({
                anchors: [
                  { css: '#lede', xpath: '/html/body/p[1]', tagName: 'p', unique: true },
                  { css: '#lede > strong', xpath: '/html/body/p[1]/strong[1]', tagName: 'strong', unique: true },
                  { css: '#lede', xpath: '/html/body/p[1]', tagName: 'p', unique: true },
                ],
                textRange: {
                  exact: 'Ships in under a minute, every time.',
                  prefix: '',
                  suffix: '',
                  start: 0,
                  end: 36,
                  zones: [9, 23],
                },
              }),
            }),
          ],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).toContain('crosses inline markup');
    expect(md).toContain('1. `Ships in`');
    expect(md).toContain('2. `under a minute`');
    expect(md).toContain('3. `, every time.`');
    // Each run carries the element that actually holds it.
    expect(md).toContain('- CSS: `#lede > strong`');
    expect(md).toContain('- XPath: `/html/body/p[1]/strong[1]`');
  });

  it('stays quiet about zones when the selection is one unbroken run', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({
                textRange: {
                  exact: 'under a minute',
                  prefix: 'Ships in ',
                  suffix: '.',
                  start: 9,
                  end: 23,
                },
              }),
            }),
          ],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).not.toContain('crosses inline markup');
    // A single element still gets both selectors.
    expect(md).toContain('- CSS: `main > p`');
    expect(md).toContain('- XPath: `/html/body/main/p[1]`');
  });

  it('quotes the selected text for a text annotation', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({
                textRange: {
                  exact: 'ships in under a minute',
                  prefix: 'It ',
                  suffix: ', every time.',
                  start: 3,
                  end: 26,
                },
              }),
            }),
          ],
        },
      ],
      { exportedAt: '2026-08-26T12:00:00.000Z' }
    );

    expect(md).toContain('- Context: It ⟦ships in under a minute⟧, every time.');

  });

  it('omits the context line for an element annotation', () => {
    const md = annotationsToMarkdown(
      [{ url: 'http://x/', annotations: [annotation()] }],
      { exportedAt: '2026-08-26T12:00:00.000Z' }
    );

    expect(md).not.toContain('- Context:');
  });

  it('omits the draft line when the page declared no draft', () => {
    const md = annotationsToMarkdown(
      [{ url: 'http://x/', annotations: [annotation()] }],
      { exportedAt: '2026-08-26T12:00:00.000Z' }
    );

    expect(md).not.toContain('- Draft:');
  });

  it('keeps a multi-line comment intact', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [annotation({ comment: 'first line\n\nsecond line' })],
        },
      ],
      { exportedAt: '2026-08-26T12:00:00.000Z' }
    );

    expect(md).toContain('first line\n\nsecond line');
  });

  it('skips pages that have no annotations', () => {
    const md = annotationsToMarkdown(
      [
        { url: 'http://x/empty.html', annotations: [] },
        { url: 'http://x/', annotations: [annotation()] },
      ],
      { exportedAt: '2026-08-26T12:00:00.000Z' }
    );

    expect(md).not.toContain('empty.html');
  });
});

describe('anchor reporting', () => {
  it('flags a selector that could not be narrowed to one element', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [
            annotation({
              selector: bundle({
                anchors: [
                  { css: 'p', xpath: '/html/body/p', tagName: 'p', unique: false },
                ],
              }),
            }),
          ],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).toContain('WARNING: matches more than one element');
  });

  it('says nothing about uniqueness when the selectors are unique', () => {
    const md = annotationsToMarkdown(
      [{ url: 'http://x/', annotations: [annotation()] }],
      { exportedAt: 'now' }
    );

    expect(md).not.toContain('WARNING');
  });

  it('falls back to the container path for an annotation stored before anchors', () => {
    const md = annotationsToMarkdown(
      [
        {
          url: 'http://x/',
          annotations: [annotation({ selector: bundle({ anchors: undefined }) })],
        },
      ],
      { exportedAt: 'now' }
    );

    expect(md).toContain('- Anchor: `main > p` (rendered DOM)');
  });
});
