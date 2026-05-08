// Hover/click picker. The job: given a pointer position, pick the single
// "most meaningful" semantic block at that point. Prefer one good guess over
// a noisy outline that flickers between every layout div.
//
// Strategy:
//   1. Get the element stack at the point with elementsFromPoint().
//   2. Filter out our own shadow root and a few infrastructure tags.
//   3. Walk the stack from the top (innermost) outward, scoring each
//      element with a heuristic. The first element scoring above the
//      threshold wins. If nothing scores, fall back to the topmost
//      candidate.

const SEMANTIC_TAGS = new Set([
  'SECTION',
  'ARTICLE',
  'ASIDE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'NAV',
  'FORM',
  'FIGURE',
]);

const INTERACTIVE_TAGS = new Set([
  'BUTTON',
  'A',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'LABEL',
]);

const MEDIA_TAGS = new Set(['IMG', 'VIDEO', 'PICTURE', 'CANVAS', 'SVG']);

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

const SKIP_TAGS = new Set(['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT']);

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

  // Walk inward-out and score each candidate. Pick the highest scorer that
  // also passes a minimum threshold. Ties broken by stack position (prefer
  // the more specific / inner element).
  let best: { el: Element; score: number; depth: number } | null = null;
  for (let i = 0; i < filtered.length; i++) {
    const el = filtered[i];
    if (!el) continue;
    const score = scoreElement(el);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { el, score, depth: i };
    }
  }

  if (!best) {
    // Nothing semantic — fall back to the innermost non-skipped element.
    const fallback = filtered[0];
    if (!fallback) return null;
    return { element: fallback, rect: fallback.getBoundingClientRect() };
  }

  return { element: best.el, rect: best.el.getBoundingClientRect() };
}

function scoreElement(element: Element): number {
  const tag = element.tagName;

  // Author-marked elements always win.
  if (element.hasAttribute('data-annotate-id')) return 100;

  // Structural semantic landmarks.
  if (SEMANTIC_TAGS.has(tag)) return 70;

  // Headings are an obvious target.
  if (HEADING_TAGS.has(tag)) return 65;

  // Interactive controls.
  if (INTERACTIVE_TAGS.has(tag)) {
    // <a> with no text and no aria-label is probably wrapping something
    // else worth picking; demote it.
    if (tag === 'A') {
      const text = (element.textContent || '').trim();
      if (!text && !element.getAttribute('aria-label')) return 30;
    }
    return 60;
  }

  // Media.
  if (MEDIA_TAGS.has(tag)) return 55;

  // Paragraphs with substantive text content.
  if (tag === 'P') {
    const text = (element.textContent || '').trim();
    if (text.length > 40) return 50;
    if (text.length > 0) return 35;
    return 0;
  }

  // List items as anchorable targets.
  if (tag === 'LI') return 40;

  // Card-like divs: a div with a heading descendant and a non-trivial size
  // is usually a card or section.
  if (tag === 'DIV' || tag === 'SPAN') {
    if (element.querySelector('h1, h2, h3, h4, h5, h6')) {
      // Only credit a div that wraps a heading if it has its own bounded
      // box (non-zero width/height) and isn't just the body wrapper.
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.width < window.innerWidth) {
        return 45;
      }
    }
    if (element.getAttribute('role')) return 35;
  }

  // Elements with explicit ARIA role gain a small score.
  if (element.getAttribute('role')) return 30;

  return 0;
}
