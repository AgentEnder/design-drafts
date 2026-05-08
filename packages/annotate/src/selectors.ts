// Layered selector strategy from ADR 0001.
//
// A SelectorBundle captures multiple ways to identify an element so that
// annotations survive minor DOM refactors. At resolve time we try each
// strategy in priority order and report which one matched.
//
// The cssPath is built bottom-up and trimmed to the SHORTEST prefix that
// still uniquely identifies the element. That gives us "least specific
// selector that matches exactly one element" — short, readable, and
// resilient to insertions far up the tree (a wrapper div added at the
// root doesn't invalidate a selector that didn't depend on the root).

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
  // Priority 3: cssPath — minimal unique selector at capture time.
  cssPath: string;
  // Priority 4 (recovery only): nearest heading text plus offset within
  // same-tag elements that follow it.
  headingAnchor: { text: string; offset: number } | null;
  // Tag name for human-readable previews and for tag-aware recovery.
  tagName: string;
  // Short text excerpt for the panel preview.
  preview: string;
}

export function buildSelector(element: Element): SelectorBundle {
  return {
    annotateId: getAnnotateId(element),
    elementId: getStableId(element),
    cssPath: getCssPath(element),
    headingAnchor: getHeadingAnchor(element),
    tagName: element.tagName.toLowerCase(),
    preview: getPreview(element),
  };
}

export type ResolveStrategy =
  | 'annotateId'
  | 'elementId'
  | 'cssPath'
  | 'headingAnchor'
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

  // cssPath BEFORE headingAnchor — cssPath is precise at capture time. Only
  // fall through to headingAnchor when cssPath fails to resolve to exactly
  // one element (DOM has changed since capture).
  if (bundle.cssPath) {
    try {
      const matches = document.querySelectorAll(bundle.cssPath);
      if (matches.length === 1) {
        return { element: matches[0]!, strategy: 'cssPath' };
      }
    } catch {
      // Invalid selector — fall through.
    }
  }

  if (bundle.headingAnchor) {
    const el = resolveHeadingAnchor(bundle.headingAnchor, bundle.tagName);
    if (el) return { element: el, strategy: 'headingAnchor' };
  }

  return { element: null, strategy: null };
}

function getAnnotateId(element: Element): string | null {
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
  const heading =
    element.querySelector(HEADING_SELECTOR) ?? findPrecedingHeading(element);
  if (!heading) return null;

  const text = (heading.textContent || '').trim().slice(0, 200);
  if (!text) return null;

  const offset = computeOffsetUnderHeading(heading, element);
  return { text, offset };
}

function findPrecedingHeading(element: Element): Element | null {
  let cursor: Node | null = element;
  while (cursor) {
    let prev: Node | null = cursor.previousSibling;
    while (prev) {
      if (prev.nodeType === Node.ELEMENT_NODE) {
        const prevEl = prev as Element;
        if (prevEl.matches(HEADING_SELECTOR)) return prevEl;
        const heading = prevEl.querySelector(HEADING_SELECTOR);
        if (heading) {
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

// Count how many elements with target's tagName appear after the heading
// and before the target. Stored offset = capture-time count; resolution
// uses the same-tag walk to look up the same offset.
function computeOffsetUnderHeading(heading: Element, target: Element): number {
  const tag = target.tagName;
  const candidates = document.getElementsByTagName(tag);
  let offset = 0;
  let countingStarted = false;
  let found = false;
  for (const candidate of Array.from(candidates)) {
    if (!countingStarted) {
      const pos = heading.compareDocumentPosition(candidate);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        countingStarted = true;
      }
    }
    if (!countingStarted) continue;
    if (candidate === target) {
      found = true;
      break;
    }
    offset++;
  }
  return found ? offset : 0;
}

function resolveHeadingAnchor(
  anchor: { text: string; offset: number },
  tagName: string
): Element | null {
  const headings = document.querySelectorAll(HEADING_SELECTOR);
  let matchedHeading: Element | null = null;
  for (const h of Array.from(headings)) {
    if ((h.textContent || '').trim().slice(0, 200) === anchor.text) {
      matchedHeading = h;
      break;
    }
  }
  if (!matchedHeading) return null;

  // Walk same-tag candidates that follow the heading. This mirrors the
  // capture-time count in computeOffsetUnderHeading — both walk by tagName,
  // so the offset arithmetic agrees.
  const candidates = document.getElementsByTagName(tagName.toUpperCase());
  let count = 0;
  for (const candidate of Array.from(candidates)) {
    const pos = matchedHeading.compareDocumentPosition(candidate);
    if (!(pos & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
    if (count === anchor.offset) return candidate;
    count++;
  }
  return null;
}

// Build the shortest CSS path that uniquely identifies the element. Walk
// from the element upward, prepending one segment at a time; stop as soon
// as the joined path matches exactly one element in the document.
//
// Each segment uses the most-stable disambiguator available:
//   1. tag if no same-tag siblings under the parent
//   2. tag.class if a single class makes it unique among siblings
//   3. tag:nth-of-type(N) as last resort
function getCssPath(element: Element): string {
  if (element === document.documentElement) return 'html';
  if (element === document.body) return 'body';

  const parts: string[] = [];
  let cursor: Element | null = element;
  while (cursor && cursor !== document.documentElement) {
    if (cursor === document.body) {
      parts.unshift('body');
      break;
    }
    parts.unshift(elementSegment(cursor));

    const path = parts.join(' > ');
    try {
      if (document.querySelectorAll(path).length === 1) {
        return path;
      }
    } catch {
      // Invalid combination — keep walking and let the next ancestor
      // disambiguate.
    }
    cursor = cursor.parentElement;
  }
  return parts.join(' > ');
}

function elementSegment(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (!parent) return tag;

  // Try classes that disambiguate among siblings.
  for (const cls of Array.from(element.classList)) {
    const sel = `${tag}.${cssEscape(cls)}`;
    let matches = 0;
    for (const sibling of Array.from(parent.children)) {
      try {
        if (sibling.matches(sel)) matches++;
      } catch {
        // Invalid class name — skip.
      }
      if (matches > 1) break;
    }
    if (matches === 1) return sel;
  }

  const sameTagSiblings = Array.from(parent.children).filter(
    (c): c is Element => c.tagName === element.tagName
  );
  if (sameTagSiblings.length === 1) return tag;
  const index = sameTagSiblings.indexOf(element) + 1;
  return `${tag}:nth-of-type(${index})`;
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
