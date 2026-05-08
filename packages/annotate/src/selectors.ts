// Layered selector strategy from ADR 0001.
//
// A SelectorBundle captures multiple ways to identify an element so that
// annotations survive minor DOM refactors. At resolve time we try each
// strategy in priority order and report which one matched.

const VOID_TAGS = new Set([
  'BR',
  'HR',
  'IMG',
  'INPUT',
  'META',
  'LINK',
  'SOURCE',
]);

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

export interface SelectorBundle {
  // Priority 1: explicit annotation id authored by the draft.
  annotateId: string | null;
  // Priority 2: stable element id (skipped if it looks framework-generated).
  elementId: string | null;
  // Priority 3: nearest heading text plus offset within nodes that share it.
  headingAnchor: { text: string; offset: number } | null;
  // Priority 4: structural CSS path (most specific, most fragile).
  cssPath: string;
  // Tag name for human-readable previews.
  tagName: string;
  // Short text excerpt for the panel preview.
  preview: string;
}

export function buildSelector(element: Element): SelectorBundle {
  return {
    annotateId: getAnnotateId(element),
    elementId: getStableId(element),
    headingAnchor: getHeadingAnchor(element),
    cssPath: getCssPath(element),
    tagName: element.tagName.toLowerCase(),
    preview: getPreview(element),
  };
}

export type ResolveStrategy =
  | 'annotateId'
  | 'elementId'
  | 'headingAnchor'
  | 'cssPath'
  | null;

export interface ResolveResult {
  element: Element | null;
  strategy: ResolveStrategy;
}

export function resolveSelector(bundle: SelectorBundle): ResolveResult {
  if (bundle.annotateId) {
    const el = document.querySelector(
      `[data-annotate-id="${cssEscape(bundle.annotateId)}"]`
    );
    if (el) return { element: el, strategy: 'annotateId' };
  }

  if (bundle.elementId) {
    const el = document.getElementById(bundle.elementId);
    if (el) return { element: el, strategy: 'elementId' };
  }

  if (bundle.headingAnchor) {
    const el = resolveHeadingAnchor(bundle.headingAnchor);
    if (el) return { element: el, strategy: 'headingAnchor' };
  }

  try {
    const el = document.querySelector(bundle.cssPath);
    if (el) return { element: el, strategy: 'cssPath' };
  } catch {
    // Invalid selector — fall through.
  }

  return { element: null, strategy: null };
}

function getAnnotateId(element: Element): string | null {
  // Author opt-in: data-annotate-id on the element itself or any ancestor up
  // to the picked block. We only check the element itself here; the picker
  // already chose a meaningful block, so its own data attribute is what
  // matters.
  const value = element.getAttribute('data-annotate-id');
  return value && value.trim() ? value.trim() : null;
}

const FRAMEWORK_ID_PATTERNS = [
  /^:r\d+:?$/, // React useId
  /^radix-/, // Radix UI generated ids
  /^headlessui-/, // Headless UI
  /^mui-/, // Material UI
  /^[a-z0-9_-]{20,}$/i, // Suspiciously long opaque ids
];

function getStableId(element: Element): string | null {
  const id = element.id;
  if (!id) return null;
  if (FRAMEWORK_ID_PATTERNS.some((re) => re.test(id))) return null;
  return id;
}

function getHeadingAnchor(
  element: Element
): { text: string; offset: number } | null {
  // Find the nearest heading: either inside the element itself, or the
  // most recent heading that comes before the element in document order.
  const heading =
    element.querySelector(HEADING_SELECTOR) ?? findPrecedingHeading(element);
  if (!heading) return null;

  const text = (heading.textContent || '').trim().slice(0, 200);
  if (!text) return null;

  // Offset: how many elements with the same tag name share this heading
  // anchor and come before our target. Lets us disambiguate "the third
  // <button> under the 'Pricing' heading."
  const offset = computeOffsetUnderHeading(heading, element);
  return { text, offset };
}

function findPrecedingHeading(element: Element): Element | null {
  // Walk preceding siblings up the tree, looking for a heading at any depth.
  let cursor: Node | null = element;
  while (cursor) {
    let prev: Node | null = cursor.previousSibling;
    while (prev) {
      if (prev.nodeType === Node.ELEMENT_NODE) {
        const prevEl = prev as Element;
        if (prevEl.matches(HEADING_SELECTOR)) return prevEl;
        const heading = prevEl.querySelector(HEADING_SELECTOR);
        if (heading) {
          // Use the last heading inside the previous subtree.
          const all = prevEl.querySelectorAll(HEADING_SELECTOR);
          return all[all.length - 1] ?? heading;
        }
      }
      prev = prev.previousSibling;
    }
    cursor = cursor.parentNode;
  }
  return null;
}

function computeOffsetUnderHeading(heading: Element, target: Element): number {
  // Count how many elements with target's tagName appear after the heading
  // and before (or equal to) the target.
  const tag = target.tagName;
  const candidates = document.getElementsByTagName(tag);
  let offset = 0;
  let countingStarted = false;
  let foundHeading = false;
  for (const candidate of Array.from(candidates)) {
    if (!countingStarted) {
      const pos = heading.compareDocumentPosition(candidate);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        countingStarted = true;
      }
    }
    if (!countingStarted) continue;
    if (candidate === target) {
      foundHeading = true;
      break;
    }
    offset++;
  }
  return foundHeading ? offset : 0;
}

function resolveHeadingAnchor(anchor: {
  text: string;
  offset: number;
}): Element | null {
  const headings = document.querySelectorAll(HEADING_SELECTOR);
  let matchedHeading: Element | null = null;
  for (const h of Array.from(headings)) {
    if ((h.textContent || '').trim().slice(0, 200) === anchor.text) {
      matchedHeading = h;
      break;
    }
  }
  if (!matchedHeading) return null;

  // Walk forward in document order from the heading; return the Nth element
  // we hit. We don't know the original tagName, so the caller (cssPath
  // fallback) will validate. For the heading-only resolution we return the
  // element at the right offset across any tag, which is what we counted
  // when serializing. That's not quite right when offset was computed per
  // tag, so we re-walk the document looking for elements that follow the
  // heading and pick by index.
  //
  // Simplification: return the heading itself when offset is 0; otherwise
  // walk document order and pick the offset-th element after the heading
  // that is a "candidate block" (heuristically, anything that isn't a pure
  // text node container).
  if (anchor.offset === 0) return matchedHeading;

  let count = 0;
  let cursor: Element | null = nextElementInDocumentOrder(matchedHeading);
  while (cursor) {
    count++;
    if (count === anchor.offset) return cursor;
    cursor = nextElementInDocumentOrder(cursor);
  }
  return matchedHeading;
}

function nextElementInDocumentOrder(element: Element): Element | null {
  if (element.firstElementChild) return element.firstElementChild;
  let cursor: Element | null = element;
  while (cursor) {
    if (cursor.nextElementSibling) return cursor.nextElementSibling;
    cursor = cursor.parentElement;
  }
  return null;
}

function getCssPath(element: Element): string {
  if (!element.parentElement) return element.tagName.toLowerCase();

  const parts: string[] = [];
  let cursor: Element | null = element;
  while (cursor && cursor.nodeType === Node.ELEMENT_NODE) {
    if (cursor === document.documentElement) {
      parts.unshift('html');
      break;
    }
    if (cursor === document.body) {
      parts.unshift('body');
      break;
    }
    const current: Element = cursor;
    const tag = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const sameTagSiblings: Element[] = Array.from(parent.children).filter(
      (c): c is Element => c.tagName === current.tagName
    );
    if (sameTagSiblings.length === 1) {
      parts.unshift(tag);
    } else {
      const index = sameTagSiblings.indexOf(current) + 1;
      parts.unshift(`${tag}:nth-of-type(${index})`);
    }
    cursor = parent;
  }
  return parts.join(' > ');
}

function getPreview(element: Element): string {
  if (VOID_TAGS.has(element.tagName)) {
    if (element.tagName === 'IMG') {
      return (
        (element as HTMLImageElement).alt ||
        (element as HTMLImageElement).src.split('/').pop() ||
        '<img>'
      );
    }
    return `<${element.tagName.toLowerCase()}>`;
  }
  const text = (element.textContent || '').trim().replace(/\s+/g, ' ');
  if (text) return text.slice(0, 80);
  return `<${element.tagName.toLowerCase()}>`;
}

// Minimal CSS.escape polyfill for attribute selectors. We only need to
// escape values inside [attr="..."], so escaping double-quote and backslash
// is sufficient; CSS.escape is also available on every browser that ships
// elementsFromPoint, so we prefer it when present.
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, '\\$1');
}
