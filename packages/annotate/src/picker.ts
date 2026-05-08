// Hover/click picker. Given a pointer position, pick the single element the
// user is most likely pointing at.
//
// Strategy: walk the elementsFromPoint stack innermost-out and return the
// first element that's a meaningful target (a heading, a button, a table
// cell, a paragraph, an author-marked element, …). Raw layout containers
// (a bare <div>, an inline <span>) are skipped so the walk continues to the
// parent. If nothing matches before we run off the top, the innermost
// non-skipped element wins as a fallback.
//
// This intentionally biases toward the inner element. Earlier the picker
// scored every element in the stack and returned the highest score, which
// guaranteed outer landmarks (<section>, <article>) won — you could never
// pick a table row because the surrounding section always scored higher.

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

const INTERACTIVE_TAGS = new Set([
  'BUTTON',
  'A',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'LABEL',
  'SUMMARY',
  'DETAILS',
]);

const MEDIA_TAGS = new Set(['IMG', 'VIDEO', 'PICTURE', 'CANVAS', 'SVG', 'AUDIO']);

const TABLE_TAGS = new Set(['TABLE', 'TR', 'TD', 'TH', 'CAPTION']);

const TABLE_GROUP_TAGS = new Set(['THEAD', 'TBODY', 'TFOOT']);

const DEFINITION_TAGS = new Set(['DL', 'DT', 'DD']);

const FIGURE_TAGS = new Set(['FIGURE', 'FIGCAPTION', 'BLOCKQUOTE']);

const SEMANTIC_LANDMARKS = new Set([
  'SECTION',
  'ARTICLE',
  'ASIDE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'NAV',
  'FORM',
]);

const SKIP_TAGS = new Set(['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT']);

const CARDLIKE_CLASS = /\b(card|tile|panel|widget|module|chip|badge|pill|item|row|cell|entry)\b/;

export interface PickResult {
  element: Element;
  rect: DOMRect;
}

export function pickAtPoint(
  x: number,
  y: number,
  ignoreRoot: Node | null
): PickResult | null {
  const stack = document.elementsFromPoint(x, y);
  if (!stack.length) return null;

  const filtered = stack.filter((el) => {
    if (ignoreRoot && (el === ignoreRoot || ignoreRoot.contains(el))) {
      return false;
    }
    if (SKIP_TAGS.has(el.tagName)) return false;
    return true;
  });

  if (!filtered.length) return null;

  for (const el of filtered) {
    if (isMeaningfulTarget(el)) {
      return { element: el, rect: el.getBoundingClientRect() };
    }
  }

  // Nothing matched a meaningful-target rule (e.g. all generic divs all the
  // way up). Fall back to the innermost non-skipped element so the picker
  // never returns null when the user is pointing at something visible.
  const fallback = filtered[0];
  if (!fallback) return null;
  return { element: fallback, rect: fallback.getBoundingClientRect() };
}

function isMeaningfulTarget(element: Element): boolean {
  const tag = element.tagName;

  // Author-marked elements always win.
  if (element.hasAttribute('data-annotate-id')) return true;

  // Tag-based stop matches — these are the user's most likely target when
  // their pointer is on or inside one.
  if (HEADING_TAGS.has(tag)) return true;
  if (INTERACTIVE_TAGS.has(tag)) {
    // An <a> with no text and no aria-label is usually wrapping something
    // else worth picking; let the walk continue.
    if (tag === 'A') {
      const text = (element.textContent || '').trim();
      if (!text && !element.getAttribute('aria-label')) return false;
    }
    return true;
  }
  if (MEDIA_TAGS.has(tag)) return true;
  if (TABLE_TAGS.has(tag)) return true;
  if (DEFINITION_TAGS.has(tag)) return true;
  if (FIGURE_TAGS.has(tag)) return true;
  if (tag === 'LI') return true;

  // Paragraphs with any text content. Empty <p> tags (often used as
  // spacers) don't count.
  if (tag === 'P') {
    const text = (element.textContent || '').trim();
    return text.length > 0;
  }

  // Pre/code blocks read as discrete targets.
  if (tag === 'PRE' || tag === 'CODE') return true;

  // Table groups (thead/tbody/tfoot) — pick if the user is inside one and
  // nothing more specific matched. Rows and cells take precedence because
  // they appear earlier in the stack walk.
  if (TABLE_GROUP_TAGS.has(tag)) return true;

  // Author-meaningful divs/spans: explicit role, or a class name that hints
  // at being a UI block (`card`, `tile`, `row`, etc.).
  if (tag === 'DIV' || tag === 'SPAN') {
    if (element.hasAttribute('role')) return true;
    if (CARDLIKE_CLASS.test((element.getAttribute('class') || '').toLowerCase())) {
      return true;
    }
    return false;
  }

  // Top-level semantic landmarks — meaningful, but appear far up the stack
  // so they only win when nothing more specific matched first.
  if (SEMANTIC_LANDMARKS.has(tag)) return true;

  return false;
}
