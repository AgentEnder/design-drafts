// @design-drafts/annotate — framework-agnostic annotation overlay for drafts.
//
// SECURITY NOTE: comments are stored in localStorage, which is shared with
// any script on the page. Don't capture sensitive feedback through this
// tool. See README.md.
//
// Lifecycle:
//   1. Script loads. We don't touch the page until the toggle activates.
//   2. Activation: ?annotate=1 in the URL, manual toggle click, or
//      window.DesignDraftsAnnotate.activate() programmatic call.
//   3. While active: pointermove + click on the document drive the picker.
//      The shadow root holds an outline, pin elements, the composer, and
//      the panel.
//   4. Deactivation: stop listening, hide overlay, keep storage intact.

import {
  discoverManifest,
  draftRoot,
} from '@design-drafts/conventions/discover';
import { readDraftId } from '@design-drafts/conventions/draft-id';

import {
  annotationsToMarkdown,
  exportFilename,
  type ExportPage,
} from './export.js';
import { pickAtPoint, type PickResult } from './picker.js';
import {
  buildSelector,
  describeAnchor,
  describeSelector,
  resolveSelector,
  type SelectorBundle,
} from './selectors.js';
import { HOST_ID, STYLES } from './styles.js';
import { containerElementOf, resolveTextRange } from './text-range.js';
import {
  currentPageUrl,
  clearAnnotations,
  deleteAnnotation,
  generateId,
  loadAnnotations,
  loadAnnotationsByUrl,
  saveAnnotation,
  type Annotation,
} from './storage.js';

interface AnnotateApi {
  activate(): void;
  deactivate(): void;
  toggle(): void;
  isActive(): boolean;
}

interface PinView {
  annotation: Annotation;
  element: Element | null;
  /** Set only for a text annotation whose quote still resolves. When the
   * annotation has a textRange but this is null the annotation is stale —
   * see refreshPins. */
  range: Range | null;
  pinNode: HTMLElement;
  /** One tint node per line box of `range`; empty for element annotations. */
  highlightNodes: HTMLElement[];
  number: number;
  stale: boolean;
}

/** What an annotation points at: a whole element, or a run of text inside
 * one. Everything that positions UI against an annotation — outline, pin,
 * flash, scroll — works on this rather than on Element alone. */
type AnchorTarget = Element | Range;

const QUERY_PARAM = 'annotate';

/** Everything a page might hang a keyboard shortcut or an input mirror off. */
const KEY_EVENTS = [
  'keydown',
  'keyup',
  'keypress',
  'input',
  'beforeinput',
] as const;

const CLEAR_LABEL = 'Clear';
/** How long the panel's Clear stays armed before it forgets it was asked. */
const CLEAR_ARM_MS = 4000;
/** How long a button wears a result before returning to its own label. */
const FLASH_MS = 1600;

/** Says something on the button itself, then puts `label` back — the panel has
 * nowhere to put a toast, and a result belongs on the control that produced it.
 * Skips the reset if the panel closed in the meantime. */
function flashLabel(button: HTMLElement, message: string, label: string): void {
  button.textContent = message;
  window.setTimeout(() => {
    if (button.isConnected) button.textContent = label;
  }, FLASH_MS);
}

function stopIfActive(overlay: { isActive(): boolean }) {
  return (event: Event): void => {
    if (overlay.isActive()) event.stopPropagation();
  };
}

/** Commits the note in `field` on ⌘↵ (⌃↵ elsewhere), so a reviewer whose
 * hands are already on the keys never has to go find Save.
 *
 * Bound on the field rather than added to the overlay's window handler:
 * only the textarea knows which note is under the cursor — the composer's
 * new one, or one of the panel's entries. A bare Enter is left alone; a
 * note is prose and needs its line breaks. */
function saveOnCommandEnter(field: HTMLTextAreaElement, save: () => void): void {
  field.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    save();
  });
}

/** Names the modifier the reviewer actually has, for the hint on Save. */
function commandKeyLabel(): string {
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ? '⌘' : 'Ctrl+';
}

export type AnnotateMode = 'standalone' | 'integrated';

export interface AnnotateOverlayOptions {
  mode?: AnnotateMode;
  // In integrated mode, the trigger lives outside the overlay's shadow root
  // (typically in the toolbar's slot). The overlay reads the trigger's
  // position to anchor the panel above it.
  triggerElement?: HTMLElement | null;
}

// Minimal "is this a draft manifest" gate for root discovery. Annotate only
// needs to confirm a manifest is present to locate the draft root — the toolbar
// owns the fuller shape check — so we keep this cheap and dependency-free.
function isManifestLike(raw: unknown): raw is { name: string } {
  if (!raw || typeof raw !== 'object') return false;
  const v = raw as { name?: unknown; pages?: unknown };
  return typeof v.name === 'string' && Array.isArray(v.pages);
}

class AnnotateOverlay {
  private host: HTMLElement | null = null;
  private root: ShadowRoot | null = null;
  private outlineEl: HTMLElement | null = null;
  private outlineLabelEl: HTMLElement | null = null;
  private mode: AnnotateMode;
  private triggerElement: HTMLElement | null;

  constructor(options: AnnotateOverlayOptions = {}) {
    this.mode = options.mode ?? 'standalone';
    this.triggerElement = options.triggerElement ?? null;
  }

  setTriggerElement(el: HTMLElement | null): void {
    this.triggerElement = el;
  }
  private panelEl: HTMLElement | null = null;
  private panelBodyEl: HTMLElement | null = null;
  private panelTabsEl: HTMLElement | null = null;
  private currentTab: string = currentPageUrl();
  private toggleEl: HTMLElement | null = null;
  private composerEl: HTMLElement | null = null;
  private pinLayer: HTMLElement | null = null;
  private highlightLayer: HTMLElement | null = null;
  /** Tint nodes for the selection being commented on but not yet saved. */
  private pendingHighlight: HTMLElement[] = [];

  private active = false;
  // Which pages the panel may show, and which annotations on them are ours.
  //
  // `draftScope` is a URL prefix: the origin (every page on the host) until the
  // manifest is found, then the draft root, so co-deployed drafts don't bleed
  // into each other. Resolved lazily on first activation.
  //
  // `draftId` is what the page itself declares (a generated page always does;
  // a hand-written one may not). It is the only thing that separates drafts a
  // preview server serves from the same `localhost:<port>/` URL, where the
  // scope prefix is identical for all of them.
  private draftScope: string = window.location.origin + '/';
  private scopeRequested = false;
  private readonly draftId = readDraftId(document);
  private hovered: PickResult | null = null;
  private composing: {
    selector: SelectorBundle;
    element: Element;
    range: Range | null;
  } | null = null;
  private editing: { id: string } | null = null;
  /** Non-null while the panel's Clear is armed (see clearAll). */
  private clearArmTimer: number | null = null;
  private pins: PinView[] = [];

  private rafScheduled = false;

  mount(): void {
    if (this.host) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    // Defensive: ensure the host node itself paints nothing.
    host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483100; pointer-events: none;';
    const root = host.attachShadow({ mode: 'open' });

    // A constructable stylesheet rather than a <style> element. Chrome
    // enforces `style-src` on DOM-inserted <style> tags, so on a site with a
    // strict policy the bookmarklet would attach an overlay with no styles at
    // all — worse than not attaching. adoptedStyleSheets isn't inline style
    // and isn't checked, so the overlay renders wherever it runs.
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLES);
    root.adoptedStyleSheets = [sheet];

    // Highlights paint under the pins, so a pin sitting at the end of a
    // quote is never washed out by its own tint.
    const highlightLayer = document.createElement('div');
    highlightLayer.style.cssText =
      'position: absolute; inset: 0; pointer-events: none;';
    root.appendChild(highlightLayer);

    const pinLayer = document.createElement('div');
    pinLayer.style.cssText =
      'position: absolute; inset: 0; pointer-events: none;';
    root.appendChild(pinLayer);

    const outline = document.createElement('div');
    outline.className = 'outline';
    const outlineLabel = document.createElement('div');
    outlineLabel.className = 'outline-label';
    outline.appendChild(outlineLabel);
    root.appendChild(outline);

    // Keyboard events are `composed`, so anything typed into the composer
    // escapes the shadow root and carries on to the page — retargeted, so by
    // the time a page hotkey handler sees it `event.target` is this host
    // <div> rather than a <textarea>. The usual "ignore keys typed in a form
    // field" guard therefore doesn't fire, and a comment containing "t"
    // triggers GitHub's file finder mid-sentence.
    //
    // Stopping them here, on the host, is the right place: the composer has
    // already had the event by then (this is the bubble phase), and the page
    // never will. The overlay's own key handling lives on window's capture
    // phase, which runs earlier still, so Escape keeps working.
    for (const type of KEY_EVENTS) {
      host.addEventListener(type, stopIfActive(this));
    }

    document.documentElement.appendChild(host);

    this.host = host;
    this.root = root;
    this.outlineEl = outline;
    this.outlineLabelEl = outlineLabel;
    this.pinLayer = pinLayer;
    this.highlightLayer = highlightLayer;

    this.renderToggle();
    this.refreshPins();
  }

  unmount(): void {
    if (!this.host) return;
    this.host.remove();
    this.host = null;
    this.root = null;
    this.outlineEl = null;
    this.outlineLabelEl = null;
    this.panelEl = null;
    this.panelBodyEl = null;
    this.toggleEl = null;
    this.composerEl = null;
    this.pinLayer = null;
    this.highlightLayer = null;
    this.pendingHighlight = [];
    this.pins = [];
  }

  isActive(): boolean {
    return this.active;
  }

  // Find the draft root once, the first time the overlay is used. Until it
  // resolves the panel is origin-scoped (a harmless superset); on success it
  // narrows and re-renders any open panel.
  private ensureDraftScope(): void {
    if (this.scopeRequested) return;
    this.scopeRequested = true;
    void discoverManifest(window.location.href, isManifestLike).then((found) => {
      if (!found) return;
      this.draftScope = draftRoot(found.manifestUrl);
      if (this.panelBodyEl) this.renderPanel();
    });
  }

  activate(): void {
    if (this.active) return;
    this.ensureDraftScope();
    this.mount();
    this.active = true;
    // On `window` rather than `document`: capture runs window → document →
    // … → target, so a page that registers its own capture-phase handler on
    // window would otherwise see every click before the overlay does.
    window.addEventListener('pointermove', this.onPointerMove, true);
    window.addEventListener('click', this.onClick, true);
    window.addEventListener('auxclick', this.onClick, true);
    window.addEventListener('mousedown', this.onMouseButton, true);
    window.addEventListener('mouseup', this.onMouseButton, true);
    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange, true);
    this.renderToggle();
    this.openPanel();
    this.refreshPins();

    // ?reveal=<annotation-id> in the URL means we just navigated here from
    // a Reveal click on another page. Scroll-and-flash the target.
    const params = new URLSearchParams(window.location.search);
    const revealId = params.get('reveal');
    if (revealId) {
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete('reveal');
      window.history.replaceState(null, '', cleaned.toString());
      // Defer briefly so layout has settled and pins have resolved.
      setTimeout(() => {
        const pin = this.pins.find((p) => p.annotation.id === revealId);
        if (pin?.element) {
          const target: AnchorTarget = pin.range ?? pin.element;
          this.scrollTargetIntoView(target);
          setTimeout(() => this.flash(target), 280);
        }
      }, 60);
    }
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('auxclick', this.onClick, true);
    window.removeEventListener('mousedown', this.onMouseButton, true);
    window.removeEventListener('mouseup', this.onMouseButton, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('scroll', this.onViewportChange, true);
    window.removeEventListener('resize', this.onViewportChange, true);
    this.hovered = null;
    this.composing = null;
    this.closeComposer();
    this.closePanel();
    this.hideOutline();
    this.clearPins();
    this.renderToggle();
  }

  toggle(): void {
    if (this.active) this.deactivate();
    else this.activate();
  }

  // ---- pointer / click handlers ----

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.active) return;
    if (this.composing) return;
    // A held button means the reviewer is dragging out a text selection.
    // Outlining whatever block the cursor crosses is noise during that.
    if (event.buttons !== 0) {
      this.hovered = null;
      this.hideOutline();
      return;
    }
    if (this.eventCrossesOverlay(event)) {
      this.hovered = null;
      this.hideOutline();
      return;
    }
    const pick = pickAtPoint(event.clientX, event.clientY, this.host);
    if (!pick) {
      this.hovered = null;
      this.hideOutline();
      return;
    }
    this.hovered = pick;
    this.drawOutline(pick.element, describeElement(pick.element));
  };

  // Mouse button events are stopped but NOT default-prevented: the browser's
  // own text selection is a default action, so preventing it would break the
  // thing the reviewer is here to do. Stopping propagation is enough to keep
  // a page that routes on mousedown from navigating out from under them.
  private onMouseButton = (event: MouseEvent): void => {
    if (!this.active) return;
    if (this.eventCrossesOverlay(event)) return;
    event.stopPropagation();
  };

  private onClick = (event: MouseEvent): void => {
    if (!this.active) return;
    if (this.eventCrossesOverlay(event)) return;

    // While annotating, the page is inert: a click is always a pick, never a
    // navigation. A link is a perfectly reasonable thing to want to comment
    // on, and letting it navigate takes the page away — along with any
    // half-written comment. This runs before every early return below, so
    // there is no path on which a click reaches the page.
    event.preventDefault();
    event.stopPropagation();

    // Composer already open: swallow the click rather than discarding what
    // has been typed. Escape and Cancel are the ways out.
    if (this.composing) return;

    // A live text selection is a more specific statement of intent than
    // whatever element is under the cursor, so it wins. Snapshot the Range
    // now: focusing the composer's textarea collapses the document
    // selection, and from here on we paint our own highlight from this copy.
    const range = pageSelectionRange();
    const container = range ? containerElementOf(range) : null;
    if (range && container) {
      const selector = buildSelector(container, range);
      if (selector.textRange) {
        this.composing = { selector, element: container, range };
        this.openComposer(boundsOf(range), range);
        return;
      }
    }

    const pick = pickAtPoint(event.clientX, event.clientY, this.host);
    if (!pick) return;
    const selector = buildSelector(pick.element);
    this.composing = { selector, element: pick.element, range: null };
    this.openComposer(pick.rect, null);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      if (this.composing) {
        this.closeComposer();
        this.composing = null;
        return;
      }
      if (this.editing) {
        this.editing = null;
        this.renderPanel();
        return;
      }
    }
  };

  private onViewportChange = (): void => {
    if (this.rafScheduled) return;
    this.rafScheduled = true;
    requestAnimationFrame(() => {
      this.rafScheduled = false;
      this.repositionPins();
      if (this.composing?.range) {
        this.syncHighlight(
          this.pendingHighlight,
          rectsOf(this.composing.range),
          'range-highlight pending'
        );
      }
      if (this.hovered) {
        this.drawOutline(this.hovered.element, describeElement(this.hovered.element));
      }
    });
  };

  // ---- outline ----

  private drawOutline(target: AnchorTarget, label: string): void {
    if (!this.outlineEl || !this.outlineLabelEl) return;
    const rect = boundsOf(target);
    if (rect.width === 0 && rect.height === 0) {
      this.hideOutline();
      return;
    }
    Object.assign(this.outlineEl.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    this.outlineEl.classList.add('visible');
    this.outlineLabelEl.textContent = label;
  }

  private hideOutline(): void {
    if (!this.outlineEl) return;
    this.outlineEl.classList.remove('visible');
  }

  // ---- composer ----

  private openComposer(rect: DOMRect, range: Range | null): void {
    this.closeComposer();
    if (!this.root) return;
    const node = document.createElement('div');
    node.className = 'composer';

    // The document selection is about to be collapsed by the textarea taking
    // focus, so paint our own copy of it while the reviewer types.
    if (range) {
      this.syncHighlight(
        this.pendingHighlight,
        rectsOf(range),
        'range-highlight pending'
      );
    }

    const textarea = document.createElement('textarea');
    textarea.placeholder = range
      ? 'Leave a note on this text…'
      : 'Leave a note for this element…';
    textarea.rows = 3;

    const actions = document.createElement('div');
    actions.className = 'composer-actions';

    const cancel = document.createElement('button');
    cancel.className = 'btn ghost';
    cancel.textContent = 'Cancel';
    cancel.type = 'button';
    cancel.addEventListener('click', () => {
      this.closeComposer();
      this.composing = null;
    });

    const save = document.createElement('button');
    save.className = 'btn primary';
    save.textContent = 'Save';
    save.type = 'button';
    save.title = `Save (${commandKeyLabel()}↵)`;
    const commit = (): void => {
      const value = textarea.value.trim();
      if (!value || !this.composing) {
        this.closeComposer();
        this.composing = null;
        return;
      }
      const now = Date.now();
      const annotation: Annotation = {
        id: generateId(),
        draftId: this.draftId,
        selector: this.composing.selector,
        comment: value,
        createdAt: now,
        updatedAt: now,
      };
      saveAnnotation(annotation, currentPageUrl());
      this.composing = null;
      this.closeComposer();
      this.refreshPins();
      this.renderPanel();
    };
    save.addEventListener('click', commit);
    saveOnCommandEnter(textarea, commit);

    actions.appendChild(cancel);
    actions.appendChild(save);
    node.appendChild(textarea);
    node.appendChild(actions);

    positionFloating(node, rect);
    this.root.appendChild(node);
    this.composerEl = node;

    // Position via measured size after the node is in the DOM.
    requestAnimationFrame(() => positionFloating(node, rect));
    setTimeout(() => textarea.focus(), 0);
  }

  private closeComposer(): void {
    if (this.composerEl) {
      this.composerEl.remove();
      this.composerEl = null;
      // Drop the browser selection along with the composer. The overlay
      // paints its own highlight from the snapshotted Range from here on, so
      // leaving the live selection up double-tints the words — and worse, a
      // later click elsewhere would read it as fresh intent and re-annotate
      // the same text instead of what was actually clicked.
      window.getSelection()?.removeAllRanges();
    }
    this.syncHighlight(this.pendingHighlight, []);
  }

  // ---- pins ----

  private refreshPins(): void {
    this.clearPins();
    if (!this.pinLayer) return;
    const annotations = loadAnnotations(this.draftId);
    annotations.forEach((annotation, index) => {
      const result = resolveSelector(annotation.selector);
      const textRange = annotation.selector.textRange;

      // A text annotation whose container resolves but whose quote is gone
      // is stale, not "close enough": silently widening a note about six
      // words into a note about the whole paragraph changes what it says.
      const range =
        textRange && result.element
          ? resolveTextRange(result.element, textRange)
          : null;
      const element = textRange && !range ? null : result.element;
      const stale = !element;

      const pinNode = document.createElement('button');
      pinNode.type = 'button';
      pinNode.className = 'pin';
      pinNode.textContent = String(index + 1);
      pinNode.title = annotation.comment.slice(0, 200);
      if (stale) pinNode.classList.add('stale');

      const pin: PinView = {
        annotation,
        element,
        range,
        pinNode,
        highlightNodes: [],
        number: index + 1,
        stale,
      };

      pinNode.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editing = { id: annotation.id };
        this.openPanel();
        this.renderPanel();
        this.scrollEntryIntoView(annotation.id);
      });

      if (element) {
        pinNode.addEventListener('pointerenter', () => {
          // A text annotation already shows exactly which words it covers;
          // deepening its tint reads better than boxing the line runs.
          if (pin.range) {
            for (const node of pin.highlightNodes) {
              node.classList.add('hovered');
            }
            return;
          }
          this.drawOutline(element, describeElement(element));
        });
        pinNode.addEventListener('pointerleave', () => {
          for (const node of pin.highlightNodes) {
            node.classList.remove('hovered');
          }
          this.hideOutline();
        });
      }

      this.pinLayer!.appendChild(pinNode);
      this.pins.push(pin);
    });
    this.repositionPins();
  }

  private clearPins(): void {
    for (const pin of this.pins) {
      pin.pinNode.remove();
      for (const node of pin.highlightNodes) node.remove();
    }
    this.pins = [];
  }

  /** Reconcile a list of tint nodes against a list of rects, reusing what's
   * already mounted. Called every animation frame during a scroll, so it
   * mutates in place rather than rebuilding the nodes. */
  private syncHighlight(
    nodes: HTMLElement[],
    rects: DOMRect[],
    className = 'range-highlight'
  ): void {
    if (!this.highlightLayer) return;
    while (nodes.length > rects.length) nodes.pop()?.remove();
    while (nodes.length < rects.length) {
      const node = document.createElement('div');
      node.className = className;
      this.highlightLayer.appendChild(node);
      nodes.push(node);
    }
    rects.forEach((rect, i) => {
      const node = nodes[i];
      if (!node) return;
      node.style.left = `${rect.left}px`;
      node.style.top = `${rect.top}px`;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
    });
  }

  private repositionPins(): void {
    // Pin's CSS uses transform: translate(-50%, -100%), so the (left, top)
    // we set is the bottom-center of the pin's bounding box.
    //
    // Default placement: the pin's bottom-LEFT vertex (which is also the
    // squared border-radius corner — the visual "tail") sits at the
    // element's top-right corner. The pin hangs up-and-to-the-right of
    // the element, with its tail pointing down-left into the element.
    //
    //   pin.bottomLeft = (rect.right, rect.top)
    //   pin.center.x   = rect.right + halfPin
    //   pin.bottom.y   = rect.top
    //
    // Clamp into the viewport so the pin stays visible whenever any part
    // of the element is on-screen. Hide entirely only when the element
    // doesn't intersect the viewport at all.
    const PIN_SIZE = 22;
    const MARGIN = 4;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const halfPin = PIN_SIZE / 2;

    for (const pin of this.pins) {
      if (!pin.element) {
        pin.pinNode.style.display = 'none';
        this.syncHighlight(pin.highlightNodes, []);
        continue;
      }

      // A text annotation gets one rect per line box, so a quote that wraps
      // tints each line instead of one box swallowing the margins. The pin
      // anchors to the LAST of them — it sits just past the end of the
      // quoted words rather than off the paragraph's corner.
      const rects = rectsOf(pin.range ?? pin.element);
      this.syncHighlight(pin.highlightNodes, pin.range ? rects : []);
      const rect = pin.range ? rects[rects.length - 1] : rects[0];
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        pin.pinNode.style.display = 'none';
        continue;
      }

      const intersects =
        rect.right > 0 && rect.left < vw && rect.bottom > 0 && rect.top < vh;
      if (!intersects) {
        pin.pinNode.style.display = 'none';
        continue;
      }

      const naturalX = rect.right + halfPin;
      const naturalY = rect.top;
      let x = naturalX;
      let y = naturalY;

      // Pin's bounding box after the translate:
      //   x range: [x - halfPin, x + halfPin]
      //   y range: [y - PIN_SIZE, y]
      const minX = MARGIN + halfPin;
      const maxX = vw - MARGIN - halfPin;
      if (x < minX) x = minX;
      if (x > maxX) x = maxX;

      const minY = MARGIN + PIN_SIZE;
      const maxY = vh - MARGIN;
      if (y < minY) y = minY;
      if (y > maxY) y = maxY;

      // When the natural top-right-of-element anchor was clamped, the pin
      // is no longer hanging off the corner — it's inside the element's
      // bounds. Drop the squared "tail" corner; render as a circle.
      const clamped = x !== naturalX || y !== naturalY;
      pin.pinNode.classList.toggle('clamped', clamped);

      pin.pinNode.style.display = '';
      pin.pinNode.style.left = `${x}px`;
      pin.pinNode.style.top = `${y}px`;
    }
  }

  // ---- panel ----

  private openPanel(): void {
    if (!this.root || this.panelEl) return;
    const panel = document.createElement('div');
    panel.className =
      this.mode === 'integrated' ? 'panel integrated' : 'panel';

    const head = document.createElement('div');
    head.className = 'panel-head';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Annotations';
    head.appendChild(title);

    const actions = document.createElement('div');
    actions.className = 'panel-head-actions';

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'btn ghost';
    exportBtn.textContent = 'Export';
    exportBtn.title =
      'Copy every annotation on this draft as markdown, ready to paste to an agent';
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.exportMarkdown(exportBtn);
    });
    actions.appendChild(exportBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn ghost clear-all';
    clearBtn.textContent = CLEAR_LABEL;
    clearBtn.title = 'Delete every annotation on this draft';
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearAll(clearBtn);
    });
    actions.appendChild(clearBtn);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn ghost';
    close.textContent = 'Hide';
    close.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.deactivate();
    });
    actions.appendChild(close);
    head.appendChild(actions);

    const tabs = document.createElement('div');
    tabs.className = 'panel-tabs';

    const body = document.createElement('div');
    body.className = 'panel-body';

    panel.appendChild(head);
    panel.appendChild(tabs);
    panel.appendChild(body);
    this.root.appendChild(panel);
    this.panelEl = panel;
    this.panelTabsEl = tabs;
    this.panelBodyEl = body;
    // Reset to current page when reopening the panel.
    this.currentTab = currentPageUrl();
    this.renderPanel();
  }

  private closePanel(): void {
    this.disarmClear();
    if (this.panelEl) {
      this.panelEl.remove();
      this.panelEl = null;
      this.panelBodyEl = null;
      this.panelTabsEl = null;
    }
  }

  private renderPanel(): void {
    if (!this.panelBodyEl || !this.panelTabsEl) return;

    const currentUrl = currentPageUrl();
    const allByUrl = loadAnnotationsByUrl(this.draftScope, this.draftId);
    // Always show the current page as a tab even if it has no annotations
    // yet — the panel doubles as an empty-state prompt.
    if (!allByUrl.has(currentUrl)) allByUrl.set(currentUrl, []);

    // If the active tab no longer has any annotations and isn't the
    // current page, fall back to the current page.
    if (!allByUrl.has(this.currentTab)) this.currentTab = currentUrl;

    // ---- tabs ----
    this.panelTabsEl.replaceChildren();
    const sortedTabs = Array.from(allByUrl.entries()).sort(([a], [b]) => {
      if (a === currentUrl) return -1;
      if (b === currentUrl) return 1;
      return a.localeCompare(b);
    });
    for (const [url, list] of sortedTabs) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className =
        'panel-tab' + (url === this.currentTab ? ' active' : '');
      tab.title = url;
      const label = document.createElement('span');
      label.className = 'panel-tab-label';
      label.textContent = formatTabLabel(url, currentUrl);
      const count = document.createElement('span');
      count.className = 'panel-tab-count';
      count.textContent = String(list.length);
      tab.appendChild(label);
      tab.appendChild(count);
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.currentTab = url;
        this.renderPanel();
      });
      this.panelTabsEl.appendChild(tab);
    }

    // ---- body ----
    this.panelBodyEl.replaceChildren();
    const annotations = allByUrl.get(this.currentTab) ?? [];
    const isCurrentPage = this.currentTab === currentUrl;

    if (!annotations.length) {
      const empty = document.createElement('div');
      empty.className = 'panel-empty';
      empty.textContent = isCurrentPage
        ? 'No annotations yet. Click any block on the page to leave one.'
        : 'No annotations on this page.';
      this.panelBodyEl.appendChild(empty);
      return;
    }

    annotations.forEach((annotation, index) => {
      const stale = isCurrentPage
        ? (this.pinByAnnotationId(annotation.id)?.stale ?? false)
        : false;
      const entry = this.renderEntry(
        annotation,
        index + 1,
        stale,
        this.currentTab
      );
      this.panelBodyEl!.appendChild(entry);
    });
  }

  private pinByAnnotationId(id: string): PinView | undefined {
    return this.pins.find((p) => p.annotation.id === id);
  }

  private renderEntry(
    annotation: Annotation,
    number: number,
    stale: boolean,
    pageUrl: string
  ): HTMLElement {
    const node = document.createElement('div');
    node.className = 'entry';
    node.dataset.id = annotation.id;

    const head = document.createElement('div');
    head.className = 'entry-head';

    const num = document.createElement('div');
    num.className = 'entry-num';
    if (stale) num.classList.add('stale');
    num.textContent = String(number);
    head.appendChild(num);

    const anchor = document.createElement('div');
    anchor.className = 'entry-anchor';
    const anchorText = stale
      ? `${describeAnchor(annotation.selector)} · stale`
      : describeAnchor(annotation.selector);
    anchor.textContent = anchorText;
    anchor.title = describeSelector(annotation.selector, stale);
    head.appendChild(anchor);

    node.appendChild(head);

    if (this.editing?.id === annotation.id) {
      const textarea = document.createElement('textarea');
      textarea.className = 'field';
      textarea.value = annotation.comment;
      textarea.rows = 3;

      const actions = document.createElement('div');
      actions.className = 'entry-actions';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn ghost';
      cancel.textContent = 'Cancel';
      cancel.addEventListener('click', () => {
        this.editing = null;
        this.renderPanel();
      });
      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'btn primary';
      save.textContent = 'Save';
      save.title = `Save (${commandKeyLabel()}↵)`;
      const commit = (): void => {
        const next = textarea.value.trim();
        if (!next) return;
        saveAnnotation(
          { ...annotation, comment: next, updatedAt: Date.now() },
          pageUrl
        );
        this.editing = null;
        this.renderPanel();
      };
      save.addEventListener('click', commit);
      saveOnCommandEnter(textarea, commit);
      actions.appendChild(cancel);
      actions.appendChild(save);

      node.appendChild(textarea);
      node.appendChild(actions);
      setTimeout(() => textarea.focus(), 0);
    } else {
      const body = document.createElement('div');
      body.className = 'entry-body';
      body.textContent = annotation.comment;
      node.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'entry-actions';

      const reveal = document.createElement('button');
      reveal.type = 'button';
      reveal.className = 'btn ghost';
      reveal.textContent = 'Reveal';
      reveal.disabled = stale;
      reveal.addEventListener('click', () => {
        if (pageUrl === currentPageUrl()) {
          const pin = this.pins.find(
            (p) => p.annotation.id === annotation.id
          );
          if (!pin?.element) return;
          const target: AnchorTarget = pin.range ?? pin.element;
          this.scrollTargetIntoView(target);
          setTimeout(() => this.flash(target), 220);
          return;
        }
        // Navigate to the other page with reveal intent. The destination
        // page picks up `?reveal=<id>` in activate() and runs the same
        // scroll-and-flash flow once its DOM has loaded.
        try {
          const nav = new URL(pageUrl);
          nav.searchParams.set('annotate', '1');
          nav.searchParams.set('reveal', annotation.id);
          window.location.href = nav.toString();
        } catch {
          // pageUrl unparseable — bail silently.
        }
      });

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn ghost';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        this.editing = { id: annotation.id };
        this.renderPanel();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn ghost danger';
      remove.textContent = 'Delete';
      remove.addEventListener('click', () => {
        deleteAnnotation(annotation.id, pageUrl);
        this.refreshPins();
        this.renderPanel();
      });

      actions.appendChild(reveal);
      actions.appendChild(edit);
      actions.appendChild(remove);
      node.appendChild(actions);
    }

    return node;
  }

  private scrollEntryIntoView(id: string): void {
    if (!this.panelBodyEl) return;
    const entry = this.panelBodyEl.querySelector(
      `[data-id="${cssEscapeAttr(id)}"]`
    );
    entry?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---- export ----

  // Render every annotation on every page of this draft as one markdown
  // document and put it on the clipboard. Falls back to a file download:
  // the async clipboard API needs a secure context, and a preview served
  // over plain http on a LAN address isn't one.
  private exportMarkdown(button: HTMLElement): void {
    const currentUrl = currentPageUrl();
    const byUrl = loadAnnotationsByUrl(this.draftScope, this.draftId);
    const pages: ExportPage[] = Array.from(byUrl.entries())
      .sort(([a], [b]) => {
        if (a === currentUrl) return -1;
        if (b === currentUrl) return 1;
        return a.localeCompare(b);
      })
      .map(([url, annotations]) => ({ url, annotations }));

    const flash = (message: string): void =>
      flashLabel(button, message, 'Export');

    if (!pages.some((page) => page.annotations.length)) {
      flash('Nothing yet');
      return;
    }

    const markdown = annotationsToMarkdown(pages, {
      draftId: this.draftId,
      exportedAt: new Date().toISOString(),
    });

    void copyText(markdown).then(
      () => flash('Copied'),
      () => {
        downloadText(markdown, exportFilename(this.draftId));
        flash('Downloaded');
      }
    );
  }

  // ---- clear ----

  // Wipes exactly what Export would have produced: this draft, every page.
  //
  // Two steps, because there is no undo behind it. The first click arms the
  // button and says what it is about to take; the second commits. An armed
  // button disarms itself, so a panel left open never sits one stray click
  // away from losing a review.
  private clearAll(button: HTMLElement): void {
    if (this.clearArmTimer !== null) {
      this.disarmClear();
      const removed = clearAnnotations(this.draftScope, this.draftId);
      this.editing = null;
      this.refreshPins();
      this.renderPanel();
      flashLabel(button, `Cleared ${removed}`, CLEAR_LABEL);
      return;
    }

    let total = 0;
    for (const list of loadAnnotationsByUrl(
      this.draftScope,
      this.draftId
    ).values()) {
      total += list.length;
    }
    if (!total) {
      flashLabel(button, 'Nothing yet', CLEAR_LABEL);
      return;
    }

    button.classList.add('armed');
    button.textContent = `Clear all ${total}?`;
    this.clearArmTimer = window.setTimeout(() => {
      this.clearArmTimer = null;
      button.classList.remove('armed');
      button.textContent = CLEAR_LABEL;
    }, CLEAR_ARM_MS);
  }

  private disarmClear(): void {
    if (this.clearArmTimer === null) return;
    window.clearTimeout(this.clearArmTimer);
    this.clearArmTimer = null;
    const button = this.panelEl?.querySelector('.clear-all');
    button?.classList.remove('armed');
  }

  // ---- toggle button ----

  private renderToggle(): void {
    if (!this.root) return;
    if (this.toggleEl) {
      this.toggleEl.remove();
      this.toggleEl = null;
    }
    if (this.active) return; // panel header has its own Hide button
    if (this.mode === 'integrated') return; // trigger lives outside the overlay (see DesignDraftsAnnotations)
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toggle';
    button.innerHTML = '';
    const dot = document.createElement('span');
    dot.className = 'toggle-dot';
    button.appendChild(dot);
    const label = document.createElement('span');
    label.textContent = 'Annotate';
    button.appendChild(label);
    button.addEventListener('click', () => this.toggle());
    this.root.appendChild(button);
    this.toggleEl = button;
  }

  // ---- helpers ----

  // Briefly flash a translucent overlay over the given element to draw the
  // eye after a Reveal scroll. Repositions every animation frame for the
  // flash duration so user scrolling during the flash doesn't desync the
  // overlay from its target.
  private flash(target: AnchorTarget): void {
    if (!this.root) return;
    const initial = rectsOf(target);
    if (!initial.length) return;

    const nodes = initial.map(() => {
      const node = document.createElement('div');
      node.className = 'flash';
      this.root!.appendChild(node);
      return node;
    });

    const FLASH_MS = 1100;
    const start = performance.now();
    const tick = (): void => {
      const rects = rectsOf(target);
      nodes.forEach((node, i) => {
        const r = rects[i];
        if (!r) {
          node.style.display = 'none';
          return;
        }
        node.style.display = '';
        node.style.left = `${r.left}px`;
        node.style.top = `${r.top}px`;
        node.style.width = `${r.width}px`;
        node.style.height = `${r.height}px`;
      });
      if (performance.now() - start < FLASH_MS) {
        requestAnimationFrame(tick);
      } else {
        for (const node of nodes) node.remove();
      }
    };
    requestAnimationFrame(tick);
  }

  /** Bring an annotation's target to the middle of the viewport. A Range has
   * no scrollIntoView of its own, so scroll to its measured box instead. */
  private scrollTargetIntoView(target: AnchorTarget): void {
    if (target instanceof Range) {
      const rect = boundsOf(target);
      const top =
        window.scrollY + rect.top - (window.innerHeight - rect.height) / 2;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private isInsideOverlay(target: EventTarget | null): boolean {
    if (!this.host) return false;
    if (!(target instanceof Node)) return false;
    return this.host.contains(target) || this.host === target;
  }

  // Robust shadow-DOM-aware overlay check using composedPath, which
  // includes nodes inside the shadow tree even when event.target has been
  // retargeted at the boundary.
  //
  // In integrated mode the picker also has to recognize the trigger
  // element's *host chain* (the <dd-annotations> custom element and any
  // <dd-toolbar> ancestor) as overlay UI — otherwise clicks on the
  // toolbar's hide button or axis switchers get swallowed by the picker's
  // capture-phase preventDefault.
  private eventCrossesOverlay(event: Event): boolean {
    if (!this.host) return false;
    const path =
      typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(this.host)) return true;
    if (this.triggerElement) {
      let cursor: Element | null = this.triggerElement;
      while (cursor) {
        if (cursor === document.body || cursor === document.documentElement) {
          break;
        }
        if (path.includes(cursor)) return true;
        cursor = cursor.parentElement;
      }
    }
    return this.isInsideOverlay(event.target);
  }
}

/** The reviewer's current page selection, or null when there isn't one worth
 * annotating. Selections inside a shadow tree — ours, or a draft's own web
 * components — are skipped, matching the element picker, which also can't see
 * past a shadow boundary. */
function pageSelectionRange(): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!range || range.collapsed) return null;
  if (!range.toString().trim()) return null;
  if (range.commonAncestorContainer.getRootNode() !== document) return null;
  return range.cloneRange();
}

/** Boxes to paint for a target. An element has one; a Range has one per line
 * box it wraps across. jsdom implements neither Range method, so both are
 * guarded — the overlay has to survive being mounted in a test environment. */
function rectsOf(target: AnchorTarget): DOMRect[] {
  if (target instanceof Range) {
    if (typeof target.getClientRects !== 'function') return [];
    return Array.from(target.getClientRects());
  }
  return [target.getBoundingClientRect()];
}

/** The single box enclosing a target, for outlines and scroll math. */
function boundsOf(target: AnchorTarget): DOMRect {
  if (target instanceof Range && typeof target.getBoundingClientRect !== 'function') {
    return new DOMRect(0, 0, 0, 0);
  }
  return target.getBoundingClientRect();
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('clipboard unavailable');
}

function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'text/markdown;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke on the next turn so the navigation has already started.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const cls = element.classList.length
    ? `.${Array.from(element.classList).slice(0, 2).join('.')}`
    : '';
  return `${tag}${id}${cls}`;
}

function formatTabLabel(url: string, currentUrl: string): string {
  if (url === currentUrl) return 'This page';
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (!segments.length) return parsed.host;
    return segments[segments.length - 1] ?? parsed.host;
  } catch {
    return url;
  }
}

function positionFloating(node: HTMLElement, rect: DOMRect): void {
  const padding = 8;
  const width = node.offsetWidth || 280;
  const height = node.offsetHeight || 120;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Try below-left of the target; flip up if there isn't room.
  let left = rect.left;
  let top = rect.bottom + padding;
  if (top + height > vh) {
    top = Math.max(padding, rect.top - height - padding);
  }
  if (left + width > vw - padding) {
    left = Math.max(padding, vw - width - padding);
  }
  if (left < padding) left = padding;
  node.style.left = `${left}px`;
  node.style.top = `${top}px`;
}

function cssEscapeAttr(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }
  return value.replace(/(["\\])/g, '\\$1');
}

// ---- bootstrap ----

function isQueryParamActive(): boolean {
  try {
    const url = new URL(window.location.href);
    const value = url.searchParams.get(QUERY_PARAM);
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

/**
 * `<dd-annotations>` — the annotate overlay as a custom element.
 *
 * Standalone (no parent toolbar): renders a floating toggle + panel at the
 * top-right of the viewport. Identical to the old IIFE behavior.
 *
 * Inside `<dd-toolbar>`: renders an inline trigger button via this
 * element's own shadow DOM (which appears in the toolbar's slot). Click
 * activates the picker AND opens the annotations panel positioned above
 * the toolbar bar instead of floating at the top-right. Pins, outline,
 * and composer continue to live in a separate floating shadow root —
 * they're page-positioned overlays regardless of mode.
 */
const ANNOTATE_TAG = 'dd-annotations';

// In integrated mode the trigger lives inside the toolbar's bar, so it reads
// the toolbar's `--dd-*` theming vars (which cascade through the light-DOM slot)
// to match its surface. Fallbacks keep it legible on a dark bar / standalone.
const TRIGGER_STYLES = `
:host { display: inline-flex; }
.trigger {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 13px;
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--dd-text-dim, #9b9ba0);
  cursor: pointer;
  white-space: nowrap;
}
.trigger:hover { color: var(--dd-text, #f5f5f5); }
.trigger.active { color: var(--dd-accent, #4f46e5); }
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dd-text-dim, #6b6b70);
}
.trigger.active .dot { background: var(--dd-accent, #4f46e5); }
`;

class DesignDraftsAnnotations extends HTMLElement {
  private overlay: AnnotateOverlay | null = null;
  private trigger: HTMLButtonElement | null = null;
  private mode: AnnotateMode = 'standalone';

  connectedCallback(): void {
    if (this.overlay) return;
    if (typeof document === 'undefined') return;

    // Detect whether we're hosted inside a <dd-toolbar>. If so, render an
    // inline trigger button that surfaces in the toolbar's slot.
    this.mode = this.closest('dd-toolbar') ? 'integrated' : 'standalone';

    if (this.mode === 'integrated') {
      const shadow = this.shadowRoot ?? this.attachShadow({ mode: 'open' });
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(TRIGGER_STYLES);
      shadow.adoptedStyleSheets = [sheet];
      shadow.innerHTML = `
        <button class="trigger" type="button">
          <span class="dot" aria-hidden="true"></span>
          <span>Annotate</span>
        </button>
      `;
      const button = shadow.querySelector<HTMLButtonElement>('.trigger');
      if (button) {
        this.trigger = button;
        button.addEventListener('click', () => this.overlay?.toggle());
      }
    }

    this.overlay = new AnnotateOverlay({
      mode: this.mode,
      triggerElement: this.mode === 'integrated' ? this : null,
    });
    this.overlay.mount();

    // Reflect activation state onto the trigger button so it can take
    // an "active" style when the user has the overlay open.
    if (this.trigger) {
      const reflect = (): void => {
        if (this.overlay?.isActive()) this.trigger?.classList.add('active');
        else this.trigger?.classList.remove('active');
      };
      // Poll briefly — AnnotateOverlay doesn't currently emit events.
      // Lightweight enough.
      this.addEventListener('click', reflect, true);
      const interval = window.setInterval(reflect, 250);
      this.addEventListener(
        'dd-annotations-disconnect',
        () => window.clearInterval(interval),
        { once: true }
      );
    }

    if (isQueryParamActive()) {
      this.overlay.activate();
    }
  }

  disconnectedCallback(): void {
    this.dispatchEvent(new CustomEvent('dd-annotations-disconnect'));
    this.overlay?.deactivate();
    this.overlay?.unmount();
    this.overlay = null;
    this.trigger = null;
  }

  // Public API for programmatic control. Mirrors the old window
  // .DesignDraftsAnnotate global, which is also still exposed.
  activate(): void {
    this.overlay?.activate();
  }
  deactivate(): void {
    this.overlay?.deactivate();
  }
  toggle(): void {
    this.overlay?.toggle();
  }
  isActive(): boolean {
    return this.overlay?.isActive() ?? false;
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(ANNOTATE_TAG)) {
  customElements.define(ANNOTATE_TAG, DesignDraftsAnnotations);
}

// Auto-mount: ensure exactly one <dd-annotations> exists in the DOM.
//
// If a <dd-toolbar> is present we mount inside it (so the annotate trigger
// becomes part of the toolbar bar). Otherwise we mount on body for the
// standalone floating treatment.
function autoMountAnnotate(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(ANNOTATE_TAG)) return;
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', autoMountAnnotate, {
      once: true,
    });
    return;
  }
  const auto = document.createElement(ANNOTATE_TAG);
  auto.setAttribute('data-auto', '');
  const toolbar = document.querySelector('dd-toolbar');
  if (toolbar) {
    toolbar.appendChild(auto);
  } else {
    document.body.appendChild(auto);
  }

  // Mirror the public API onto window for backward compatibility with
  // window.DesignDraftsAnnotate consumers.
  (window as unknown as { DesignDraftsAnnotate?: AnnotateApi })
    .DesignDraftsAnnotate = auto as unknown as AnnotateApi;
}

autoMountAnnotate();

export type { AnnotateApi };
