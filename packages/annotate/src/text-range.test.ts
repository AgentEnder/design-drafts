// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildTextRange,
  containerElementOf,
  isElementVisible,
  quoteInContext,
  resolveTextRange,
  textZones,
  visibleTextRects,
  type TextRangeSelector,
} from './text-range.js';

/** Build a Range over the first occurrence of `needle` inside `root`. Stands
 * in for what the browser hands us from `window.getSelection()`. */
function rangeOver(root: Element, needle: string): Range {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const at = node.data.indexOf(needle);
    if (at !== -1) {
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + needle.length);
      return range;
    }
    node = walker.nextNode() as Text | null;
  }
  throw new Error(`no text node in the fixture contains ${JSON.stringify(needle)}`);
}

/** buildTextRange returns the selector plus the elements behind each zone;
 * most tests only care about the selector. */
function selectorFor(root: Element, range: Range): TextRangeSelector | null {
  return buildTextRange(root, range)?.selector ?? null;
}

function html(markup: string): Element {
  document.body.innerHTML = markup;
  return document.body.firstElementChild!;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('buildTextRange', () => {
  it('captures the selected text with its surrounding context', () => {
    const root = html('<p>Ships in under a minute, every time.</p>');

    const selector = selectorFor(root, rangeOver(root, 'under a minute'));

    expect(selector).toEqual({
      exact: 'under a minute',
      prefix: 'Ships in ',
      suffix: ', every time.',
      start: 9,
      end: 23,
    });
  });

  it('measures offsets across element boundaries', () => {
    const root = html('<p>Ships <em>fast</em> and cheap.</p>');

    const selector = selectorFor(root, rangeOver(root, 'cheap'));

    // "Ships fast and cheap." — the <em> contributes its text inline.
    expect(selector?.start).toBe(15);
    expect(selector?.exact).toBe('cheap');
    expect(selector?.prefix).toBe('Ships fast and ');
  });

  it('ignores script and style text when measuring offsets', () => {
    const root = html(
      '<div><style>p { color: red }</style><p>Real copy here.</p></div>'
    );

    const selector = selectorFor(root, rangeOver(root, 'copy'));

    expect(selector?.start).toBe(5);
  });

  it('returns null for a collapsed range', () => {
    const root = html('<p>Nothing selected.</p>');
    const range = rangeOver(root, 'Nothing');
    range.collapse(true);

    expect(selectorFor(root, range)).toBeNull();
  });

  it('returns null when the selection is only whitespace', () => {
    const root = html('<p>a   b</p>');

    expect(selectorFor(root, rangeOver(root, '   '))).toBeNull();
  });
});

describe('resolveTextRange', () => {
  it('round-trips against an unchanged document', () => {
    const root = html('<p>Ships in under a minute, every time.</p>');
    const selector = selectorFor(root, rangeOver(root, 'under a minute'))!;

    const resolved = resolveTextRange(root, selector);

    expect(resolved?.toString()).toBe('under a minute');
  });

  it('recovers when text is inserted ahead of the quote', () => {
    const root = html('<p>Ships in under a minute, every time.</p>');
    const selector = selectorFor(root, rangeOver(root, 'under a minute'))!;

    root.textContent = 'Deploys and ships in under a minute, every time.';
    const resolved = resolveTextRange(root, selector);

    expect(resolved?.toString()).toBe('under a minute');
    // Recovered at the shifted offset, not the captured one.
    expect(resolved?.startOffset).toBe(21);
  });

  it('uses surrounding context to pick between repeated quotes', () => {
    const root = html(
      '<p>Free for teams. Pay as you grow. Free for schools.</p>'
    );
    const selector = selectorFor(root, rangeOver(root, 'Free for schools'))!;
    // Trim back to just the ambiguous word, keeping its captured context.
    selector.exact = 'Free';
    selector.end = selector.start + 4;
    selector.suffix = ' for schools.';

    // Prepending text invalidates the captured offsets, so only context can
    // tell the two "Free"s apart.
    root.textContent =
      'New! Free for teams. Pay as you grow. Free for schools.';
    const resolved = resolveTextRange(root, selector);

    expect(resolved?.startOffset).toBe(38);
  });

  it('prefers the captured offset while it still holds', () => {
    const root = html('<p>Free for teams. Free for schools.</p>');

    const resolved = resolveTextRange(root, {
      exact: 'Free',
      prefix: 'for teams. ',
      suffix: ' for schools.',
      start: 16,
      end: 20,
    });

    expect(resolved?.startOffset).toBe(16);
  });

  it('breaks ties toward the captured offset when context is unhelpful', () => {
    const root = html('<p>Free. Free. Free.</p>');
    // No context at all: every occurrence scores identically, so only
    // distance from the captured offset (the third "Free") can decide.
    const selector = {
      exact: 'Free',
      prefix: '',
      suffix: '',
      start: 12,
      end: 16,
    };

    root.textContent = 'X Free. Free. Free.';
    const resolved = resolveTextRange(root, selector);

    expect(resolved?.startOffset).toBe(14);
  });

  it('returns null when the quoted text is gone', () => {
    const root = html('<p>Ships in under a minute, every time.</p>');
    const selector = selectorFor(root, rangeOver(root, 'under a minute'))!;

    root.textContent = 'Completely rewritten marketing copy.';

    expect(resolveTextRange(root, selector)).toBeNull();
  });

  it('rebuilds a range that spans element boundaries', () => {
    const root = html('<p>Ships <em>fast</em> and cheap.</p>');
    const range = document.createRange();
    const text = root.firstChild as Text;
    const tail = root.lastChild as Text;
    range.setStart(text, 6); // just before "fast"
    range.setEnd(tail, 4); // through "... and"
    const selector = selectorFor(root, range)!;

    const resolved = resolveTextRange(root, selector);

    expect(selector.exact).toBe('fast and');
    expect(resolved?.toString()).toBe('fast and');
  });
});

describe('containerElementOf', () => {
  it('promotes a text-node ancestor to its element', () => {
    const root = html('<p>Ships in under a minute.</p>');

    expect(containerElementOf(rangeOver(root, 'under'))).toBe(root);
  });

  it('returns the common ancestor for a multi-element selection', () => {
    const root = html('<div><p>First para.</p><p>Second para.</p></div>');
    const range = document.createRange();
    range.setStart(root.firstElementChild!.firstChild!, 0);
    range.setEnd(root.lastElementChild!.firstChild!, 6);

    expect(containerElementOf(range)).toBe(root);
  });
});

describe('quoteInContext', () => {
  it('delimits the quote inside its neighbouring words', () => {
    expect(
      quoteInContext({
        exact: 'the',
        prefix: 'Drag ',
        suffix: ' button up onto the bar.',
        start: 5,
        end: 8,
      })
    ).toBe('Drag ⟦the⟧ button up onto the bar.');
  });

  it('marks context that ran past what was captured', () => {
    const root = html(
      '<p>' + 'padding words here. '.repeat(6) + 'the target phrase' +
      ' and then plenty more text after it to overflow the window.</p>'
    );
    const selector = selectorFor(root, rangeOver(root, 'target'))!;

    // Both sides were capped at capture time, so both should say so.
    expect(quoteInContext(selector).startsWith('…')).toBe(true);
    expect(quoteInContext(selector).endsWith('…')).toBe(true);
  });

  it('adds no ellipsis when the whole neighbourhood fits', () => {
    const root = html('<p>Drag the button.</p>');
    const selector = selectorFor(root, rangeOver(root, 'the'))!;

    expect(quoteInContext(selector)).toBe('Drag ⟦the⟧ button.');
  });

  it('collapses newlines and indentation from the source markup', () => {
    const root = html('<p>Drag\n      the\n      button.</p>');
    const selector = selectorFor(root, rangeOver(root, 'the'))!;

    expect(quoteInContext(selector)).toBe('Drag ⟦the⟧ button.');
  });
});

describe('textZones', () => {
  /** Select everything inside `root`, the way a reviewer dragging across a
   * whole sentence would. */
  function selectAll(root: Element): Range {
    const range = document.createRange();
    range.selectNodeContents(root);
    return range;
  }

  it('splits a selection where inline markup interrupts it', () => {
    // The MDX behind this is `Ships in **under a minute**, every time.` —
    // grepping the whole rendered sentence would miss on the asterisks.
    const root = html(
      '<p>Ships in <strong>under a minute</strong>, every time.</p>'
    );
    const selector = selectorFor(root, selectAll(root))!;

    expect(textZones(selector)).toEqual([
      'Ships in',
      'under a minute',
      ', every time.',
    ]);
  });

  it('reports one zone when no markup interrupts the selection', () => {
    const root = html('<p>Ships in under a minute, every time.</p>');
    const selector = selectorFor(root, selectAll(root))!;

    expect(textZones(selector)).toEqual(['Ships in under a minute, every time.']);
  });

  it('splits around a link', () => {
    const root = html('<p>See <a href="/docs">the docs</a> for more.</p>');
    const selector = selectorFor(root, selectAll(root))!;

    expect(textZones(selector)).toEqual(['See', 'the docs', 'for more.']);
  });

  it('only counts the markup the selection actually crosses', () => {
    const root = html('<p>Plain start. <em>Emphasised</em> tail.</p>');
    // Stop before the <em>, so the selection stays inside one text node.
    const range = document.createRange();
    range.setStart(root.firstChild!, 0);
    range.setEnd(root.firstChild!, 12);
    const selector = selectorFor(root, range)!;

    expect(textZones(selector)).toEqual(['Plain start.']);
  });

  it('does not split on adjacent text nodes under the same parent', () => {
    // Two text nodes, no markup between them — nothing for a grep to trip on.
    const root = html('<p></p>');
    root.appendChild(document.createTextNode('Ships in '));
    root.appendChild(document.createTextNode('under a minute.'));
    const selector = selectorFor(root, selectAll(root))!;

    expect(textZones(selector)).toEqual(['Ships in under a minute.']);
  });

  it('keeps a whitespace-only run as an empty entry, to stay index-aligned', () => {
    // The space between the two <em>s is its own zone. It is useless as a
    // search target, but dropping it here would misalign every later zone
    // from the element it came from.
    const root = html('<p><em>Bold</em> <em>words</em></p>');
    const selector = selectorFor(root, selectAll(root))!;

    expect(textZones(selector)).toEqual(['Bold', '', 'words']);
  });

  it('returns one element per zone, index-aligned', () => {
    const root = html(
      '<p>Ships in <strong>under a minute</strong>, every time.</p>'
    );
    const capture = buildTextRange(root, selectAll(root))!;

    expect(capture.elements.length).toBe(textZones(capture.selector).length);
    expect(capture.elements.map((el) => el.tagName)).toEqual([
      'P',
      'STRONG',
      'P',
    ]);
  });
});

describe('isElementVisible', () => {
  it('reports visible when the engine has no checkVisibility (jsdom)', () => {
    expect(isElementVisible(document.createElement('span'))).toBe(true);
  });

  it('trusts checkVisibility and asks it about opacity and visibility', () => {
    const el = document.createElement('span');
    let asked: unknown;
    Object.defineProperty(el, 'checkVisibility', {
      value: (options?: unknown): boolean => {
        asked = options;
        return false;
      },
    });

    expect(isElementVisible(el)).toBe(false);
    expect(asked).toMatchObject({
      opacityProperty: true,
      visibilityProperty: true,
    });
  });
});

describe('visibleTextRects', () => {
  // jsdom does no layout and implements no Range.getClientRects — the walker
  // has to come back empty rather than throw, because the overlay mounts in
  // this exact environment for every other test in this package.
  it('survives an engine without Range.getClientRects', () => {
    const root = html('<p>Ships in under a minute</p>');
    const range = rangeOver(root, 'under a minute');

    expect(visibleTextRects(range)).toEqual([]);
  });
});
