// Text-range anchoring — the "which words" half of an annotation.
//
// ADR 0001's SelectorBundle answers "which element". A text annotation adds
// a second question on top of it: which run of characters inside that
// element. The two stay separate on purpose — every recovery strategy the
// element bundle already has (data-annotate-id, id, cssPath, headingAnchor)
// applies unchanged, and this module only has to find the quote once the
// container is in hand.
//
// The selector pairs a quote with a position, which is what the W3C Web
// Annotation Data Model does (TextQuoteSelector + TextPositionSelector) and
// for the same reason: offsets are exact but break on any edit earlier in
// the document, quotes survive edits but are ambiguous when the text
// repeats. Together they cover each other.
//
// Offsets are measured against THIS module's text walk, not `textContent`
// and not `range.toString()`. Capture and resolution share `textNodesOf`,
// so their arithmetic agrees by construction, and an inline <script> added
// between draft iterations doesn't shift every offset on the page.

import { HOST_ID } from './styles.js';

/** Characters of context kept on either side of the quote. Enough to
 * disambiguate repeated UI copy ("Learn more", "Free") without bloating
 * every stored annotation. */
const CONTEXT_LEN = 48;

/** Ceiling on a stored quote. A review comment on 4000 characters of prose
 * is really a comment on the section; past this we clamp rather than let
 * localStorage grow without bound. */
const MAX_EXACT = 4000;

const NON_TEXT_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);

export interface TextRangeSelector {
  /** The selected text, verbatim. */
  exact: string;
  /** Up to CONTEXT_LEN characters of container text immediately before it. */
  prefix: string;
  /** Up to CONTEXT_LEN characters immediately after it. */
  suffix: string;
  /** Character offsets of the quote within the container's text. */
  start: number;
  end: number;
  /** Offsets within `exact` where the surrounding markup changes — see
   * textZones. Absent or empty when the selection sits in one text node. */
  zones?: number[];
}

/** The element a range should be anchored to: its common ancestor, promoted
 * out of a text node. A selection inside one paragraph anchors to that
 * paragraph; one spanning two paragraphs anchors to their shared parent. */
export function containerElementOf(range: Range): Element | null {
  const node = range.commonAncestorContainer;
  if (node.nodeType === Node.ELEMENT_NODE) return node as Element;
  return node.parentElement;
}

export interface TextRangeCapture {
  selector: TextRangeSelector;
  /** The element holding each zone, in document order. Always the same length
   * as `textZones(selector)`, so the two pair up index by index. Elements
   * can't be serialised, so the caller turns them into anchors right away. */
  elements: Element[];
}

export function buildTextRange(
  container: Element,
  range: Range
): TextRangeCapture | null {
  if (range.collapsed) return null;
  const nodes = textNodesOf(container);
  if (!nodes.length) return null;
  const text = joinText(nodes);

  let start = charOffsetOf(nodes, range.startContainer, range.startOffset);
  let end = charOffsetOf(nodes, range.endContainer, range.endOffset);
  if (end < start) [start, end] = [end, start];
  if (end - start > MAX_EXACT) end = start + MAX_EXACT;

  const exact = text.slice(start, end);
  // A whitespace-only selection is a stray drag, not a comment target.
  if (!exact.trim()) return null;

  const selector: TextRangeSelector = {
    exact,
    prefix: text.slice(Math.max(0, start - CONTEXT_LEN), start),
    suffix: text.slice(end, end + CONTEXT_LEN),
    start,
    end,
  };

  const split = splitZones(nodes, start, end);
  // The first zone always starts at 0, so only the later boundaries are worth
  // storing; textZones puts the 0 back.
  const boundaries = split.slice(1).map((zone) => zone.offset);
  if (boundaries.length) selector.zones = boundaries;

  return { selector, elements: split.map((zone) => zone.element) };
}

/**
 * The selection broken into runs that no inline markup interrupts.
 *
 * The rendered text of `Ships in **under a minute**, every time.` is one
 * sentence, but the MDX behind it is not — grepping the whole sentence misses
 * on the asterisks. Each run here lies inside a single element, so whatever
 * source produced the page contains it verbatim, and their order is a much
 * stronger fingerprint for the region than any single run.
 *
 * Returns one entry when nothing interrupts the selection, which is the
 * common case and means the caller can skip reporting zones at all.
 */
export function textZones(selector: TextRangeSelector): string[] {
  const cuts = [0, ...(selector.zones ?? []), selector.exact.length];
  const out: string[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    // Entries can come back empty — a run of pure whitespace between two
    // elements. They are kept so the result stays index-aligned with the
    // captured elements; the caller drops them when reporting.
    out.push(selector.exact.slice(cuts[i], cuts[i + 1]).replace(/\s+/g, ' ').trim());
  }
  return out;
}

/** Where the enclosing element changes across the selection, and what that
 * element is.
 *
 * The test is the PARENT element, not the text node: a DOM that happens to
 * hold two adjacent text nodes under one parent has no markup between them,
 * so splitting there would invent a boundary the source doesn't have.
 *
 * Every contributing node with a new parent produces an entry, with no
 * filtering — the offsets and the elements have to stay in lockstep, and a
 * dropped entry would silently misalign a zone with the element it came from. */
function splitZones(
  nodes: Text[],
  start: number,
  end: number
): Array<{ offset: number; element: Element }> {
  const out: Array<{ offset: number; element: Element }> = [];
  let cursor = 0;
  let previousParent: Element | null = null;

  for (const node of nodes) {
    const nodeStart = cursor;
    const nodeEnd = cursor + node.data.length;
    cursor = nodeEnd;
    if (nodeEnd <= start || nodeStart >= end) continue;

    const parent = node.parentElement;
    if (!parent) continue;
    if (previousParent === null) {
      out.push({ offset: 0, element: parent });
    } else if (parent !== previousParent) {
      out.push({ offset: Math.max(nodeStart, start) - start, element: parent });
    }
    previousParent = parent;
  }
  return out;
}

/**
 * Find the quote again inside `container`, or null if it's gone.
 *
 * 1. Position: the captured offsets still hold the captured text. Same-DOM
 *    fast path, and the common case while a reviewer is still on the page.
 * 2. Quote: score every occurrence of the text by how much of its captured
 *    context still surrounds it, tie-breaking toward the captured offset.
 * 3. Gone: the text no longer appears. The caller treats this as stale.
 */
export function resolveTextRange(
  container: Element,
  selector: TextRangeSelector
): Range | null {
  if (!selector.exact) return null;
  const nodes = textNodesOf(container);
  if (!nodes.length) return null;
  const text = joinText(nodes);

  if (text.slice(selector.start, selector.end) === selector.exact) {
    return rangeAt(nodes, selector.start, selector.end);
  }

  const at = bestOccurrence(text, selector);
  if (at === -1) return null;
  return rangeAt(nodes, at, at + selector.exact.length);
}

/** Text nodes under `container` in document order, skipping subtrees whose
 * text is never rendered as copy and the overlay's own shadow host. */
export function textNodesOf(container: Element): Text[] {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      let el = (node as Text).parentElement;
      const stop = container.parentElement;
      while (el && el !== stop) {
        if (NON_TEXT_TAGS.has(el.tagName) || el.id === HOST_ID) {
          return NodeFilter.FILTER_REJECT;
        }
        el = el.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const out: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    out.push(n as Text);
  }
  return out;
}

function joinText(nodes: Text[]): string {
  let out = '';
  for (const node of nodes) out += node.data;
  return out;
}

/** Character offset of a DOM boundary point within the joined text.
 *
 * A selection's boundaries aren't always text nodes — select whole blocks
 * and the browser hands back (element, childIndex) pairs. Rather than
 * special-case that, compare the boundary against each text node with a
 * collapsed probe range, which handles both shapes identically. */
function charOffsetOf(nodes: Text[], node: Node, offset: number): number {
  const probe = document.createRange();
  try {
    probe.setStart(node, offset);
    probe.collapse(true);
  } catch {
    return 0;
  }

  let total = 0;
  for (const text of nodes) {
    // comparePoint: -1 the point precedes the probe, 0 it is the probe,
    // 1 it follows. The probe is collapsed, so this reads as "is this
    // position before / at / after the boundary".
    if (probe.comparePoint(text, text.length) <= 0) {
      total += text.length;
      continue;
    }
    if (probe.comparePoint(text, 0) >= 0) return total;
    for (let i = 1; i < text.length; i++) {
      if (probe.comparePoint(text, i) >= 0) return total + i;
    }
    return total + text.length;
  }
  return total;
}

function bestOccurrence(text: string, selector: TextRangeSelector): number {
  const { exact, prefix, suffix, start } = selector;
  let best = -1;
  let bestScore = -Infinity;

  for (let at = text.indexOf(exact); at !== -1; at = text.indexOf(exact, at + 1)) {
    const before = text.slice(Math.max(0, at - prefix.length), at);
    const after = text.slice(at + exact.length, at + exact.length + suffix.length);
    const context =
      commonSuffixLength(before, prefix) + commonPrefixLength(after, suffix);
    // Context dominates; distance from the captured offset only breaks
    // ties, so an unchanged neighbourhood always beats a nearby stranger.
    const score = context * 10000 - Math.min(9999, Math.abs(at - start));
    if (score > bestScore) {
      bestScore = score;
      best = at;
    }
  }
  return best;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function commonSuffixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

function rangeAt(nodes: Text[], start: number, end: number): Range | null {
  const from = locate(nodes, start);
  const to = locate(nodes, end);
  if (!from || !to) return null;
  const range = document.createRange();
  try {
    range.setStart(from.node, from.offset);
    range.setEnd(to.node, to.offset);
  } catch {
    return null;
  }
  return range;
}

function locate(
  nodes: Text[],
  offset: number
): { node: Text; offset: number } | null {
  let total = 0;
  for (const node of nodes) {
    if (offset <= total + node.data.length) {
      return { node, offset: offset - total };
    }
    total += node.data.length;
  }
  const last = nodes[nodes.length - 1];
  return last ? { node: last, offset: last.data.length } : null;
}

/** `checkVisibility` shipped with two generations of option names —
 * `checkOpacity`/`checkVisibilityCSS` first, `opacityProperty`/
 * `visibilityProperty` once the spec settled. Passing both sets means every
 * engine that has the method honours the request. */
interface VisibilityCheckOptions {
  checkOpacity?: boolean;
  checkVisibilityCSS?: boolean;
  opacityProperty?: boolean;
  visibilityProperty?: boolean;
}

/**
 * Whether `element` would actually be seen by a reader.
 *
 * `checkVisibility` walks the ancestor chain and covers `display: none`,
 * `visibility: hidden`, `opacity: 0` and `content-visibility` in one call.
 * Where it doesn't exist (jsdom; older engines) everything reports visible —
 * degrading to the old behaviour is safer than painting nothing.
 */
export function isElementVisible(element: Element): boolean {
  const check = (
    element as Element & {
      checkVisibility?: (options?: VisibilityCheckOptions) => boolean;
    }
  ).checkVisibility;
  if (typeof check !== 'function') return true;
  return check.call(element, {
    checkOpacity: true,
    checkVisibilityCSS: true,
    opacityProperty: true,
    visibilityProperty: true,
  });
}

/**
 * The boxes to paint for `range` — one per line box of its VISIBLE text.
 *
 * `range.getClientRects()` alone is wrong in two ways. It reports layout, not
 * visibility: text hidden with `visibility: hidden` or `opacity: 0` (a
 * citation popover parked in the DOM for hover) keeps its rects, so a
 * selection swept across it paints tint lines where the reader sees nothing.
 * And Chrome adds the border boxes of whole elements contained in the range
 * on top of the text rects, double-tinting even fully visible selections.
 *
 * Walking the range's text nodes fixes both: only text contributes, and each
 * node's parent is vetted with `isElementVisible` before its rects count.
 * The walk is `textNodesOf`, the same one capture and resolution use.
 * Visibility filtering stays a PAINT-time concern — offsets deliberately
 * still count hidden text, so an annotation's anchor doesn't shift when a
 * popover opens or closes between visits.
 */
export function visibleTextRects(range: Range): DOMRect[] {
  // jsdom implements neither Range.getClientRects nor layout; the overlay
  // has to survive being mounted in a test environment.
  if (typeof range.getClientRects !== 'function') return [];
  const container = containerElementOf(range);
  if (!container) return [];

  const visibleParents = new Map<Element, boolean>();
  const isVisibleCached = (parent: Element): boolean => {
    let known = visibleParents.get(parent);
    if (known === undefined) {
      known = isElementVisible(parent);
      visibleParents.set(parent, known);
    }
    return known;
  };

  const rects: DOMRect[] = [];
  for (const node of textNodesOf(container)) {
    let intersects: boolean;
    try {
      intersects = range.intersectsNode(node);
    } catch {
      continue;
    }
    if (!intersects) continue;
    const parent = node.parentElement;
    if (!parent || !isVisibleCached(parent)) continue;

    // Clamp the node's span to the selection, so the first and last nodes
    // contribute only their selected characters.
    const sub = document.createRange();
    try {
      sub.setStart(node, 0);
      sub.setEnd(node, node.data.length);
      if (sub.compareBoundaryPoints(Range.START_TO_START, range) < 0) {
        sub.setStart(range.startContainer, range.startOffset);
      }
      if (sub.compareBoundaryPoints(Range.END_TO_END, range) > 0) {
        sub.setEnd(range.endContainer, range.endOffset);
      }
    } catch {
      continue;
    }
    if (typeof sub.getClientRects !== 'function') continue;
    for (const rect of Array.from(sub.getClientRects())) {
      // A zero-area rect is a collapsed artifact, not a line of text.
      if (rect.width > 0 && rect.height > 0) rects.push(rect);
    }
  }
  return rects;
}

/** Render the quote inside its captured neighbourhood, with the selected run
 * delimited. A short quote — "the", "Free", "Save" — identifies nothing on its
 * own, in the panel or in an export; the words around it are what make it a
 * specific place on the page. Brackets rather than bold or quotes because the
 * surrounding text may itself contain markdown or quote characters.
 *
 * `window` caps each side, so a long quote still reads as its own thing.
 */
export function quoteInContext(
  selector: TextRangeSelector,
  window = CONTEXT_LEN
): string {
  const flatten = (value: string): string => value.replace(/\s+/g, ' ');
  const prefix = flatten(selector.prefix);
  const suffix = flatten(selector.suffix);
  const before = prefix.slice(-window);
  const after = suffix.slice(0, window);
  // Ellipsis when the text was cut here OR when it was already at the capture
  // cap, which means the sentence continued past what we stored. Without the
  // second case the context reads as if it ended mid-word on purpose.
  // Compare against the RAW stored value, not the flattened one: collapsing
  // whitespace shrinks it below the cap, which would hide the fact that the
  // sentence continued past what we captured.
  const cut = (shown: string, flat: string, raw: string): boolean =>
    shown.length < flat.length || raw.length >= CONTEXT_LEN;
  const lead = cut(before, prefix, selector.prefix) ? '…' : '';
  const tail = cut(after, suffix, selector.suffix) ? '…' : '';
  return `${lead}${before}⟦${flatten(selector.exact)}⟧${after}${tail}`;
}
