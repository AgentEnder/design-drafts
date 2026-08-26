// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { buildAnchor, buildSelector } from './selectors.js';

function html(markup: string): void {
  document.body.innerHTML = markup;
}

/** The contract every anchor has to keep: both selectors find this element
 * and nothing else. Checked against the live document, not against what the
 * builder claimed. */
function resolvesOnlyTo(
  anchor: { css: string; xpath: string },
  element: Element
): { css: boolean; xpath: boolean } {
  const css = document.querySelectorAll(anchor.css);
  const xpath = document.evaluate(
    anchor.xpath,
    document,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  return {
    css: css.length === 1 && css[0] === element,
    xpath: xpath.snapshotLength === 1 && xpath.snapshotItem(0) === element,
  };
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('buildAnchor', () => {
  it('names one element with both a CSS and an XPath selector', () => {
    html('<main><p>first</p><p>second</p></main>');
    const target = document.querySelectorAll('p')[1]!;

    const anchor = buildAnchor(target);

    expect(anchor.tagName).toBe('p');
    expect(anchor.unique).toBe(true);
    expect(resolvesOnlyTo(anchor, target)).toEqual({ css: true, xpath: true });
  });

  it('prefers an author id over a positional path', () => {
    html('<main><p id="lede">first</p><p>second</p></main>');
    const target = document.getElementById('lede')!;

    const anchor = buildAnchor(target);

    expect(anchor.css).toBe('#lede');
    expect(anchor.xpath).toBe('//*[@id="lede"]');
    expect(resolvesOnlyTo(anchor, target)).toEqual({ css: true, xpath: true });
  });

  it('prefers data-annotate-id above everything', () => {
    html('<main><p data-annotate-id="hero" id="lede">first</p></main>');
    const target = document.querySelector('p')!;

    expect(buildAnchor(target).css).toBe('[data-annotate-id="hero"]');
  });

  it('refuses a duplicated id rather than trusting it', () => {
    // Invalid HTML, but it is out there. An id that matches two elements is
    // exactly the case where a selector looks precise and is not.
    html('<main><p id="dup">first</p><p id="dup">second</p></main>');
    const target = document.querySelectorAll('p')[1]!;

    const anchor = buildAnchor(target);

    expect(anchor.css).not.toBe('#dup');
    expect(anchor.unique).toBe(true);
    expect(resolvesOnlyTo(anchor, target)).toEqual({ css: true, xpath: true });
  });

  it('stays unique among many identical siblings', () => {
    html(`<main><ul>${'<li>item</li>'.repeat(12)}</ul></main>`);
    const items = Array.from(document.querySelectorAll('li'));

    for (const item of items) {
      const anchor = buildAnchor(item);
      expect(resolvesOnlyTo(anchor, item)).toEqual({ css: true, xpath: true });
    }
  });

  it('stays unique through deeply repeated structure', () => {
    html(
      `<main>${'<section><div><p><span>x</span></p></div></section>'.repeat(4)}</main>`
    );
    const spans = Array.from(document.querySelectorAll('span'));

    for (const span of spans) {
      expect(resolvesOnlyTo(buildAnchor(span), span)).toEqual({
        css: true,
        xpath: true,
      });
    }
  });
});

describe('CSS and XPath stay symmetric', () => {
  it('scopes a lone child rather than leaning on it being the only one', () => {
    // Only one <strong> on the page, so the bare selector `strong` would match
    // exactly one element and pass verification — while telling the reader
    // nothing, and breaking the moment a second <strong> is added.
    html('<main><p id="lede">Ships <strong>fast</strong>.</p></main>');
    const target = document.querySelector('strong')!;

    const anchor = buildAnchor(target);

    expect(anchor.css).toBe('#lede > strong');
    expect(anchor.xpath).toBe('//*[@id="lede"]/strong');
    expect(resolvesOnlyTo(anchor, target)).toEqual({ css: true, xpath: true });
  });

  it('walks from the nearest id rather than always from the root', () => {
    html('<main><section id="pricing"><div><p>Tiers.</p></div></section></main>');
    const target = document.querySelector('p')!;

    expect(buildAnchor(target).css).toBe('#pricing > div > p');
    expect(buildAnchor(target).xpath).toBe('//*[@id="pricing"]/div/p');
  });

  it('walks from the document root when no id is available', () => {
    html('<main><p>first</p><p>second</p></main>');
    const target = document.querySelectorAll('p')[1]!;

    const anchor = buildAnchor(target);

    expect(anchor.css).toBe('html > body > main > p:nth-of-type(2)');
    expect(anchor.xpath).toBe('/html/body/main/p[2]');
    expect(resolvesOnlyTo(anchor, target)).toEqual({ css: true, xpath: true });
  });

  it('indexes only the levels that have same-tag siblings', () => {
    html('<main><ul><li>a</li><li>b</li></ul></main>');
    const target = document.querySelectorAll('li')[1]!;

    // main and ul are alone at their level; only li needs an index.
    expect(buildAnchor(target).xpath).toBe('/html/body/main/ul/li[2]');
  });
});

describe('buildSelector anchors', () => {
  it('gives an element annotation exactly one anchor', () => {
    html('<main><p>first</p><p>second</p></main>');
    const target = document.querySelectorAll('p')[1]!;

    const bundle = buildSelector(target);

    expect(bundle.anchors).toHaveLength(1);
    expect(resolvesOnlyTo(bundle.anchors![0]!, target)).toEqual({
      css: true,
      xpath: true,
    });
  });

  it('gives a text selection inside one element exactly one anchor', () => {
    html('<main><p id="lede">Ships in under a minute.</p></main>');
    const p = document.getElementById('lede')!;
    const range = document.createRange();
    range.setStart(p.firstChild!, 9);
    range.setEnd(p.firstChild!, 23);

    const bundle = buildSelector(p, range);

    expect(bundle.anchors).toHaveLength(1);
    expect(bundle.anchors![0]!.tagName).toBe('p');
  });

  it('names every element a selection crosses, in order', () => {
    html(
      '<main><p id="lede">Ships in <strong>under a minute</strong>, every ' +
        'time. See <a href="/docs">the docs</a> for more.</p></main>'
    );
    const p = document.getElementById('lede')!;
    const range = document.createRange();
    range.selectNodeContents(p);

    const bundle = buildSelector(p, range);

    expect(bundle.anchors!.map((a) => a.tagName)).toEqual([
      'p',
      'strong',
      'p',
      'a',
      'p',
    ]);
    for (const anchor of bundle.anchors!) {
      expect(anchor.unique).toBe(true);
    }
  });

  it('resolves each crossed-element anchor to that exact element', () => {
    html(
      '<main><p>Ships in <strong>under a minute</strong>, every time.</p></main>'
    );
    const p = document.querySelector('p')!;
    const range = document.createRange();
    range.selectNodeContents(p);

    const bundle = buildSelector(p, range);
    const expected = [p, document.querySelector('strong')!, p];

    bundle.anchors!.forEach((anchor, i) => {
      expect(resolvesOnlyTo(anchor, expected[i]!)).toEqual({
        css: true,
        xpath: true,
      });
    });
  });

  it('distinguishes two <strong>s inside the same paragraph', () => {
    html(
      '<main><p>Ships <strong>fast</strong> and <strong>cheap</strong>.</p></main>'
    );
    const p = document.querySelector('p')!;
    const range = document.createRange();
    range.selectNodeContents(p);

    const anchors = buildSelector(p, range).anchors!;
    const strongs = Array.from(document.querySelectorAll('strong'));

    // Zones: "Ships " / "fast" / " and " / "cheap" / "."
    expect(anchors[1]!.css).not.toBe(anchors[3]!.css);
    expect(resolvesOnlyTo(anchors[1]!, strongs[0]!).css).toBe(true);
    expect(resolvesOnlyTo(anchors[3]!, strongs[1]!).css).toBe(true);
  });

  it('names both paragraphs when a selection spans two of them', () => {
    html('<main><div><p>First para.</p><p>Second para.</p></div></main>');
    const div = document.querySelector('div')!;
    const range = document.createRange();
    range.setStart(div.firstElementChild!.firstChild!, 0);
    range.setEnd(div.lastElementChild!.firstChild!, 6);

    const bundle = buildSelector(div, range);

    expect(bundle.anchors!.map((a) => a.tagName)).toEqual(['p', 'p']);
    expect(bundle.anchors![0]!.css).not.toBe(bundle.anchors![1]!.css);
  });
});

describe('classes and trail', () => {
  it('records the element’s own classes in authored order', () => {
    html('<main><p class="card__desc text-sm font-medium">copy</p></main>');

    expect(buildAnchor(document.querySelector('p')!).classes).toEqual([
      'card__desc',
      'text-sm',
      'font-medium',
    ]);
  });

  it('caps a utility-class wall, keeping the ones written first', () => {
    // Authors put the meaningful class first and utilities after it, so the
    // head of the list is the part worth carrying.
    html(
      '<main><p class="card__desc flex items-center gap-2 px-4 py-2 rounded-md">' +
        'copy</p></main>'
    );

    expect(buildAnchor(document.querySelector('p')!).classes).toEqual([
      'card__desc',
      'flex',
      'items-center',
      'gap-2',
    ]);
  });

  it('keeps a hashed CSS-module class, which still names its module', () => {
    html('<main><p class="Text-module__Text___XeGJJ">copy</p></main>');

    expect(buildAnchor(document.querySelector('p')!).classes).toEqual([
      'Text-module__Text___XeGJJ',
    ]);
  });

  it('omits classes entirely when the element has none', () => {
    html('<main><p>copy</p></main>');

    expect(buildAnchor(document.querySelector('p')!).classes).toBeUndefined();
  });

  it('describes the element and its parents as a trail', () => {
    html(
      '<main class="site"><section class="pricing"><div class="card p-4">' +
        '<p class="card__desc">copy</p></div></section></main>'
    );

    expect(buildSelector(document.querySelector('p')!).trail).toBe(
      'body > main.site > section.pricing > div.card.p-4 > p.card__desc'
    );
  });

  it('reports no component on a page that is not React', () => {
    html('<main><p>copy</p></main>');

    expect(buildSelector(document.querySelector('p')!).component).toBeUndefined();
  });
});
