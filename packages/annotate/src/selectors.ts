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

import { readComponentInfo } from './component.js';
import {
  buildTextRange,
  quoteInContext,
  type TextRangeSelector,
} from './text-range.js';

/** Classes kept per element. Utility-first CSS puts dozens on a node; authors
 * conventionally write the meaningful one first ("card rounded-md p-4"), so
 * taking the first few keeps the signal and drops the wall. */
const MAX_CLASSES = 4;

/** Ancestors kept in the trail, counting from the element outward. */
const MAX_TRAIL = 5;

/** A quote at or below this length can't identify a place on its own — "the",
 * "Free", "Save" — so labels show it inside its sentence instead. Kept low on
 * purpose: a phrase long enough to be searched for is better as a plain quote
 * than as a long context window in a heading. */
const SHORT_QUOTE = 12;

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
  // Present only on text annotations: which run of characters inside the
  // element the comment is about. See text-range.ts.
  textRange?: TextRangeSelector | null;
  // Where in the SOURCE this element came from ("src/pages/about.mdx:42:7"),
  // when the page volunteers it. See readSourceRef.
  sourceRef?: string | null;
  // One entry per element the annotation touches: the annotated element for
  // an element annotation, one per markup zone for a text annotation that
  // crosses elements. Optional only because annotations stored before this
  // existed don't have it.
  anchors?: ElementAnchor[];
  // Tag and classes up the tree from the annotated element, outermost first:
  // "main.site > section.pricing > div.card > p.card__desc".
  trail?: string | null;
  // React component chain, when the page is React and its names survived the
  // build. See component.ts.
  component?: string | null;
}

/** A single element, named two ways.
 *
 * Both selectors are checked at capture time to match that element and
 * nothing else — a selector that matches three paragraphs tells a reader
 * less than no selector, because it looks precise. */
export interface ElementAnchor {
  css: string;
  xpath: string;
  tagName: string;
  /** False when neither strategy could be narrowed to this one element. */
  unique: boolean;
  /** This element's own classes, in authored order, capped. Kept verbatim —
   * a hashed CSS-module name still carries its module ("Text-module__Text"),
   * and a utility class appears literally in the JSX that emitted it. */
  classes?: string[];
}

export function buildAnchor(element: Element): ElementAnchor {
  const { css, xpath } = selectorsFor(element);
  const anchor: ElementAnchor = {
    css,
    xpath,
    tagName: element.tagName.toLowerCase(),
    unique: cssMatchesOnly(css, element) && xpathMatchesOnly(xpath, element),
  };
  const classes = classesOf(element);
  if (classes.length) anchor.classes = classes;
  return anchor;
}

function classesOf(element: Element): string[] {
  return Array.from(element.classList).slice(0, MAX_CLASSES);
}

/** Tag and classes from the element up to the document, outermost first.
 *
 * Where the anchor's CSS is a precise selector, this is a description: what
 * kind of thing this is and what it sits inside. `div.card > p.card__desc`
 * says more about where to look in a component tree than any positional path
 * does, and the class names are searchable in both markup and stylesheets. */
function trailOf(element: Element): string | null {
  const steps: string[] = [];
  for (
    let el: Element | null = element;
    el && el !== document.documentElement && steps.length < MAX_TRAIL;
    el = el.parentElement
  ) {
    const classes = classesOf(el);
    const suffix = classes.length
      ? '.' + classes.map((name) => name.replace(/\s+/g, '')).join('.')
      : '';
    steps.unshift(el.tagName.toLowerCase() + suffix);
  }
  return steps.length ? steps.join(' > ') : null;
}

/**
 * The two selectors that name this element, kept deliberately symmetric.
 *
 * An earlier version picked each independently — the CSS from the "shortest
 * prefix that happens to be unique" walk, the XPath from a full positional
 * path. On a page with one `<strong>` that produced `strong` next to
 * `/html/body/main/p[1]/strong[1]`. Both matched exactly one element, so both
 * passed verification, and the pair still read as a bug: one of them is
 * unique only by accident of this page's contents.
 *
 * So both come from the same decision here. Whatever scope is chosen — an
 * author's handle, an id, or the document root — both selectors start there
 * and take the same steps down.
 */
function selectorsFor(element: Element): { css: string; xpath: string } {
  const annotateId = getAnnotateId(element);
  if (annotateId && !annotateId.includes('"')) {
    const candidate = {
      css: `[data-annotate-id="${cssEscape(annotateId)}"]`,
      xpath: `//*[@data-annotate-id="${annotateId}"]`,
    };
    if (resolvesOnlyTo(candidate, element)) return candidate;
  }

  const id = getStableId(element);
  if (id && !id.includes('"')) {
    const candidate = {
      css: `#${cssEscape(id)}`,
      xpath: `//*[@id="${id}"]`,
    };
    if (resolvesOnlyTo(candidate, element)) return candidate;
  }

  return scopedSelectors(element);
}

function resolvesOnlyTo(
  candidate: { css: string; xpath: string },
  element: Element
): boolean {
  return (
    cssMatchesOnly(candidate.css, element) &&
    xpathMatchesOnly(candidate.xpath, element)
  );
}

/**
 * A positional walk down to the element, in both dialects at once.
 *
 * The walk stops at the nearest ancestor carrying a usable id rather than
 * always running to `/html`: it is shorter, and it survives markup being
 * reshuffled above that ancestor. A level with no same-tag siblings takes no
 * index, which keeps the common case readable — and is still unique, because
 * the result is verified before it is used.
 */
function scopedSelectors(element: Element): { css: string; xpath: string } {
  const cssSteps: string[] = [];
  const xpathSteps: string[] = [];

  for (let el: Element | null = element; el; el = el.parentElement) {
    const parent = el.parentElement;
    const tag = el.tagName.toLowerCase();

    if (!parent) {
      cssSteps.unshift(tag);
      xpathSteps.unshift(`/${tag}`);
      break;
    }

    if (el !== element) {
      const id = getStableId(el);
      if (id && !id.includes('"') && cssMatchesOnly(`#${cssEscape(id)}`, el)) {
        cssSteps.unshift(`#${cssEscape(id)}`);
        xpathSteps.unshift(`//*[@id="${id}"]`);
        break;
      }
    }

    const twins = Array.from(parent.children).filter(
      (child) => child.tagName === el!.tagName
    );
    const nth = twins.length === 1 ? null : twins.indexOf(el) + 1;
    cssSteps.unshift(nth === null ? tag : `${tag}:nth-of-type(${nth})`);
    xpathSteps.unshift(nth === null ? `/${tag}` : `/${tag}[${nth}]`);
  }

  return { css: cssSteps.join(' > '), xpath: xpathSteps.join('') };
}

function cssMatchesOnly(selector: string, element: Element): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch {
    return false;
  }
}

function xpathMatchesOnly(expression: string, element: Element): boolean {
  if (typeof document.evaluate !== 'function') return false;
  try {
    const result = document.evaluate(
      expression,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    return result.snapshotLength === 1 && result.snapshotItem(0) === element;
  } catch {
    return false;
  }
}

// `range`, when given, narrows the annotation from the whole element to the
// selected text inside it. The element half of the bundle is built either
// way — it's what locates the container at resolve time.
export function buildSelector(
  element: Element,
  range?: Range | null
): SelectorBundle {
  const bundle: SelectorBundle = {
    annotateId: getAnnotateId(element),
    sourceRef: readSourceRef(element),
    elementId: getStableId(element),
    cssPath: getCssPath(element),
    headingAnchor: getHeadingAnchor(element),
    tagName: element.tagName.toLowerCase(),
    preview: getPreview(element),
    anchors: [buildAnchor(element)],
    trail: trailOf(element),
  };

  // A component name only ever adds to a source hint; an attribute the page
  // published outranks anything inferred from a framework's internals.
  const component = readComponentInfo(element);
  if (component) {
    if (component.trail) {
      bundle.component = `${component.trail} (${component.framework})`;
    }
    if (!bundle.sourceRef && component.source) {
      bundle.sourceRef = component.source;
    }
  }
  if (range) {
    const capture = buildTextRange(element, range);
    if (capture) {
      bundle.textRange = capture.selector;
      // One anchor per markup zone. A selection inside a single element
      // yields exactly one, which is the same promise as an element
      // annotation; a selection crossing <strong> or <a> names each element
      // it actually touched, rather than only their common ancestor.
      if (capture.elements.length) {
        bundle.anchors = capture.elements.map(buildAnchor);
      }
    }
  }
  return bundle;
}

/** One-line label for the panel entry and the markdown export. */
export function describeAnchor(bundle: SelectorBundle): string {
  const tag = bundle.tagName;
  if (bundle.textRange) {
    const { exact } = bundle.textRange;
    // Short quotes are shown in context; a drawer entry reading `li · "the"`
    // tells the reviewer nothing about which "the" they highlighted.
    if (exact.trim().length <= SHORT_QUOTE) {
      return `${tag} · ${quoteInContext(bundle.textRange, 28)}`;
    }
    return `${tag} · “${truncate(exact, 60)}”`;
  }
  if (bundle.annotateId) return `${tag} · #${bundle.annotateId}`;
  if (bundle.headingAnchor) {
    return `${tag} · under “${bundle.headingAnchor.text}”`;
  }
  if (bundle.elementId) return `${tag}#${bundle.elementId}`;
  return `${tag} · ${bundle.preview}`;
}

/** Multi-line detail for the entry's tooltip. */
export function describeSelector(
  bundle: SelectorBundle,
  stale: boolean
): string {
  const lines: string[] = [];
  if (stale) {
    lines.push(
      bundle.textRange
        ? 'STALE — the quoted text is no longer on this page'
        : 'STALE — selector did not resolve on this page'
    );
  }
  if (bundle.textRange) {
    lines.push(`Text: ${quoteInContext(bundle.textRange)}`);
  }
  lines.push(`Selector: ${bundle.cssPath || '(none)'}`);
  if (bundle.annotateId) lines.push(`data-annotate-id: ${bundle.annotateId}`);
  if (bundle.elementId) lines.push(`#${bundle.elementId}`);
  if (bundle.headingAnchor) {
    lines.push(
      `Near heading “${bundle.headingAnchor.text}” (offset +${bundle.headingAnchor.offset})`
    );
  }
  if (!bundle.textRange && bundle.preview) {
    lines.push(`Preview: ${bundle.preview}`);
  }
  return lines.join('\n');
}

function truncate(value: string, max: number): string {
  const flat = value.trim().replace(/\s+/g, ' ');
  return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
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

/**
 * A source location, if the page is willing to say where it came from.
 *
 * ADR 0001 turned down runtime fiber-tree scraping to get this, and that still
 * holds — but reading an attribute the page already put in the DOM costs
 * nothing and is framework-agnostic. Three conventions are understood:
 *
 *   - `data-draft-source="file:line:col"` — ours, and what a future
 *     build-time tagger should emit. Authors can also write it by hand.
 *   - `data-v-inspector` — vite-plugin-vue-inspector, present in Vue dev builds.
 *   - `data-inspector-relative-path` + `-line` + `-column` — the React
 *     inspector plugins, present in React dev builds.
 *
 * The walk goes up to the nearest tagged ancestor, because a tagger marks
 * component roots rather than every text node.
 */
function readSourceRef(element: Element): string | null {
  for (
    let el: Element | null = element;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    const own = el.getAttribute('data-draft-source');
    if (own?.trim()) return own.trim();

    const vue = el.getAttribute('data-v-inspector');
    if (vue?.trim()) return vue.trim();

    const path = el.getAttribute('data-inspector-relative-path');
    if (path?.trim()) {
      const line = el.getAttribute('data-inspector-line');
      const column = el.getAttribute('data-inspector-column');
      return [path.trim(), line, column].filter(Boolean).join(':');
    }
  }
  return null;
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
