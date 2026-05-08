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

import { pickAtPoint, type PickResult } from './picker.js';
import {
  buildSelector,
  resolveSelector,
  type SelectorBundle,
} from './selectors.js';
import { STYLES } from './styles.js';
import {
  deleteAnnotation,
  generateId,
  loadAnnotations,
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
  pinNode: HTMLElement;
  number: number;
  stale: boolean;
}

const HOST_ID = 'design-drafts-annotate-root';
const QUERY_PARAM = 'annotate';

class AnnotateOverlay {
  private host: HTMLElement | null = null;
  private root: ShadowRoot | null = null;
  private outlineEl: HTMLElement | null = null;
  private outlineLabelEl: HTMLElement | null = null;
  private panelEl: HTMLElement | null = null;
  private panelBodyEl: HTMLElement | null = null;
  private toggleEl: HTMLElement | null = null;
  private composerEl: HTMLElement | null = null;
  private pinLayer: HTMLElement | null = null;

  private active = false;
  private hovered: PickResult | null = null;
  private composing: { selector: SelectorBundle; element: Element } | null =
    null;
  private editing: { id: string } | null = null;
  private pins: PinView[] = [];

  private rafScheduled = false;

  mount(): void {
    if (this.host) return;
    const host = document.createElement('div');
    host.id = HOST_ID;
    // Defensive: ensure the host node itself paints nothing.
    host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483100; pointer-events: none;';
    const root = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = STYLES;
    root.appendChild(style);

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

    document.documentElement.appendChild(host);

    this.host = host;
    this.root = root;
    this.outlineEl = outline;
    this.outlineLabelEl = outlineLabel;
    this.pinLayer = pinLayer;

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
    this.pins = [];
  }

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    if (this.active) return;
    this.mount();
    this.active = true;
    document.addEventListener('pointermove', this.onPointerMove, true);
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('scroll', this.onViewportChange, true);
    window.addEventListener('resize', this.onViewportChange, true);
    this.renderToggle();
    this.openPanel();
    this.refreshPins();
  }

  deactivate(): void {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('pointermove', this.onPointerMove, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
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
    this.drawOutline(pick);
  };

  private onClick = (event: MouseEvent): void => {
    if (!this.active) return;
    if (this.eventCrossesOverlay(event)) return;
    if (this.composing) return;
    const pick = pickAtPoint(event.clientX, event.clientY, this.host);
    if (!pick) return;
    event.preventDefault();
    event.stopPropagation();
    const selector = buildSelector(pick.element);
    this.composing = { selector, element: pick.element };
    this.openComposer(pick.rect);
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
      if (this.hovered) this.drawOutline(this.hovered);
    });
  };

  // ---- outline ----

  private drawOutline(pick: PickResult): void {
    if (!this.outlineEl || !this.outlineLabelEl) return;
    const rect = pick.element.getBoundingClientRect();
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
    this.outlineLabelEl.textContent = describeElement(pick.element);
  }

  private hideOutline(): void {
    if (!this.outlineEl) return;
    this.outlineEl.classList.remove('visible');
  }

  // ---- composer ----

  private openComposer(rect: DOMRect): void {
    this.closeComposer();
    if (!this.root) return;
    const node = document.createElement('div');
    node.className = 'composer';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Leave a note for this element…';
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
    save.addEventListener('click', () => {
      const value = textarea.value.trim();
      if (!value || !this.composing) {
        this.closeComposer();
        this.composing = null;
        return;
      }
      const now = Date.now();
      const annotation: Annotation = {
        id: generateId(),
        selector: this.composing.selector,
        comment: value,
        createdAt: now,
        updatedAt: now,
      };
      saveAnnotation(annotation);
      this.composing = null;
      this.closeComposer();
      this.refreshPins();
      this.renderPanel();
    });

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
    }
  }

  // ---- pins ----

  private refreshPins(): void {
    this.clearPins();
    if (!this.pinLayer) return;
    const annotations = loadAnnotations();
    annotations.forEach((annotation, index) => {
      const result = resolveSelector(annotation.selector);
      const pinNode = document.createElement('button');
      pinNode.type = 'button';
      pinNode.className = 'pin';
      pinNode.textContent = String(index + 1);
      pinNode.title = annotation.comment.slice(0, 200);
      pinNode.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editing = { id: annotation.id };
        this.openPanel();
        this.renderPanel();
        this.scrollEntryIntoView(annotation.id);
      });
      const targetEl = result.element;
      if (targetEl) {
        pinNode.addEventListener('pointerenter', () => {
          this.drawOutline({
            element: targetEl,
            rect: targetEl.getBoundingClientRect(),
          });
        });
        pinNode.addEventListener('pointerleave', () => {
          this.hideOutline();
        });
      }
      const stale = !result.element;
      if (stale) pinNode.classList.add('stale');
      this.pinLayer!.appendChild(pinNode);
      this.pins.push({
        annotation,
        element: result.element,
        pinNode,
        number: index + 1,
        stale,
      });
    });
    this.repositionPins();
  }

  private clearPins(): void {
    for (const pin of this.pins) pin.pinNode.remove();
    this.pins = [];
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
        continue;
      }
      const rect = pin.element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        pin.pinNode.style.display = 'none';
        continue;
      }

      const intersects =
        rect.right > 0 && rect.left < vw && rect.bottom > 0 && rect.top < vh;
      if (!intersects) {
        pin.pinNode.style.display = 'none';
        continue;
      }

      let x = rect.right + halfPin;
      let y = rect.top;

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

      pin.pinNode.style.display = '';
      pin.pinNode.style.left = `${x}px`;
      pin.pinNode.style.top = `${y}px`;
    }
  }

  // ---- panel ----

  private openPanel(): void {
    if (!this.root || this.panelEl) return;
    const panel = document.createElement('div');
    panel.className = 'panel';

    const head = document.createElement('div');
    head.className = 'panel-head';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Annotations';
    head.appendChild(title);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn ghost';
    close.textContent = 'Hide';
    close.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.deactivate();
    });
    head.appendChild(close);

    const body = document.createElement('div');
    body.className = 'panel-body';

    panel.appendChild(head);
    panel.appendChild(body);
    this.root.appendChild(panel);
    this.panelEl = panel;
    this.panelBodyEl = body;
    this.renderPanel();
  }

  private closePanel(): void {
    if (this.panelEl) {
      this.panelEl.remove();
      this.panelEl = null;
      this.panelBodyEl = null;
    }
  }

  private renderPanel(): void {
    if (!this.panelBodyEl) return;
    this.panelBodyEl.replaceChildren();
    const annotations = loadAnnotations();
    if (!annotations.length) {
      const empty = document.createElement('div');
      empty.className = 'panel-empty';
      empty.textContent =
        'No annotations yet. Click any block on the page to leave one.';
      this.panelBodyEl.appendChild(empty);
      return;
    }
    annotations.forEach((annotation, index) => {
      const pin = this.pins[index];
      const stale = pin?.stale ?? false;
      const entry = this.renderEntry(annotation, index + 1, stale);
      this.panelBodyEl!.appendChild(entry);
    });
  }

  private renderEntry(
    annotation: Annotation,
    number: number,
    stale: boolean
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
      textarea.value = annotation.comment;
      textarea.rows = 3;
      Object.assign(textarea.style, {
        width: '100%',
        minHeight: '64px',
        padding: '6px 8px',
        background: '#161618',
        color: '#f5f5f5',
        border: '1px solid #26262a',
        borderRadius: '3px',
        font: 'inherit',
      });

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
      save.addEventListener('click', () => {
        const next = textarea.value.trim();
        if (!next) return;
        saveAnnotation({
          ...annotation,
          comment: next,
          updatedAt: Date.now(),
        });
        this.editing = null;
        this.renderPanel();
      });
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
        const pin = this.pins.find((p) => p.annotation.id === annotation.id);
        if (!pin?.element) return;
        const target = pin.element;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Brief delay so the smooth scroll has settled before the flash
        // overlay locks onto the element's final on-screen position.
        setTimeout(() => this.flashElement(target), 220);
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
        deleteAnnotation(annotation.id);
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

  // ---- toggle button ----

  private renderToggle(): void {
    if (!this.root) return;
    if (this.toggleEl) {
      this.toggleEl.remove();
      this.toggleEl = null;
    }
    if (this.active) return; // panel header has its own Hide button
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
  private flashElement(element: Element): void {
    if (!this.root) return;
    const initial = element.getBoundingClientRect();
    if (initial.width === 0 && initial.height === 0) return;

    const flash = document.createElement('div');
    flash.className = 'flash';
    this.root.appendChild(flash);

    const FLASH_MS = 1100;
    const start = performance.now();
    const tick = (): void => {
      const r = element.getBoundingClientRect();
      flash.style.left = `${r.left}px`;
      flash.style.top = `${r.top}px`;
      flash.style.width = `${r.width}px`;
      flash.style.height = `${r.height}px`;
      if (performance.now() - start < FLASH_MS) {
        requestAnimationFrame(tick);
      } else {
        flash.remove();
      }
    };
    requestAnimationFrame(tick);
  }

  private isInsideOverlay(target: EventTarget | null): boolean {
    if (!this.host) return false;
    if (!(target instanceof Node)) return false;
    return this.host.contains(target) || this.host === target;
  }

  // Robust shadow-DOM-aware overlay check using composedPath, which
  // includes nodes inside the shadow tree even when event.target has been
  // retargeted at the boundary.
  private eventCrossesOverlay(event: Event): boolean {
    if (!this.host) return false;
    const path =
      typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (path.includes(this.host)) return true;
    return this.isInsideOverlay(event.target);
  }
}

function describeElement(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const cls = element.classList.length
    ? `.${Array.from(element.classList).slice(0, 2).join('.')}`
    : '';
  return `${tag}${id}${cls}`;
}

function describeAnchor(bundle: SelectorBundle): string {
  const tag = bundle.tagName;
  if (bundle.annotateId) return `${tag} · #${bundle.annotateId}`;
  if (bundle.headingAnchor) {
    return `${tag} · under "${bundle.headingAnchor.text}"`;
  }
  if (bundle.elementId) return `${tag}#${bundle.elementId}`;
  return `${tag} · ${bundle.preview}`;
}

function describeSelector(bundle: SelectorBundle, stale: boolean): string {
  const lines: string[] = [];
  if (stale) lines.push('STALE — selector did not resolve on this page');
  lines.push(`Selector: ${bundle.cssPath || '(none)'}`);
  if (bundle.annotateId) lines.push(`data-annotate-id: ${bundle.annotateId}`);
  if (bundle.elementId) lines.push(`#${bundle.elementId}`);
  if (bundle.headingAnchor) {
    lines.push(
      `Near heading "${bundle.headingAnchor.text}" (offset +${bundle.headingAnchor.offset})`
    );
  }
  if (bundle.preview) lines.push(`Preview: ${bundle.preview}`);
  return lines.join('\n');
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

function init(): AnnotateApi {
  const overlay = new AnnotateOverlay();
  overlay.mount();

  if (isQueryParamActive()) {
    overlay.activate();
  }

  const api: AnnotateApi = {
    activate: () => overlay.activate(),
    deactivate: () => overlay.deactivate(),
    toggle: () => overlay.toggle(),
    isActive: () => overlay.isActive(),
  };

  // Expose on window so consumers can drive the overlay programmatically
  // (e.g. the toolbar package can wire its own button to this).
  (window as unknown as { DesignDraftsAnnotate?: AnnotateApi }).DesignDraftsAnnotate = api;
  return api;
}

declare const document: Document;

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }
}

export type { AnnotateApi };
