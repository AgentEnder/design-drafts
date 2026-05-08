import { registerToggleShortcut } from './keybindings.js';
import { loadManifest } from './manifest.js';
import { populateToolbar, type ToolbarHandles } from './ui.js';

const TAG = 'dd-toolbar';
const SESSION_HIDDEN_KEY = 'design-drafts.toolbar.hidden';

/**
 * `<dd-toolbar>` — the toolbar as a custom element.
 *
 * In normal usage the bundle script is included via a `<script>` tag and
 * the auto-mount helper at the bottom of this file appends a single
 * `<dd-toolbar>` to `<body>` if none is already present. Authors who want
 * declarative composition with plugin elements can put one in the page
 * themselves:
 *
 *     <dd-toolbar>
 *       <dd-annotations></dd-annotations>
 *     </dd-toolbar>
 *
 * Plugin children render inline as part of the bar via a `<slot>` between
 * the axis switchers and the hide button.
 *
 * Visibility precedence:
 *   1. `?toolbar=0` query param → hidden on load.
 *   2. `?toolbar=1` → visible, clearing any session-hide.
 *   3. sessionStorage flag set by the bar's hide button → hidden.
 *   4. Otherwise → visible.
 */
// Auto-tuck state machine. The toolbar peeks back into view when the
// mouse hits the bottom edge of the viewport, then commits to staying
// once the user actually enters the bar. Once committed, leaving the bar
// re-tucks. The `armed` flag prevents the X-click → instant-re-reveal
// race when dismiss happens while the cursor is still in the edge zone.
type TuckState = 'tucked' | 'revealed-uncommitted' | 'revealed-committed';

const EDGE_REVEAL_PX = 6;

export class DesignDraftsToolbar extends HTMLElement {
  private handles: ToolbarHandles | null = null;
  private tuckObserver: MutationObserver | null = null;
  private state: TuckState = 'revealed-uncommitted';
  private armed = true;

  async connectedCallback(): Promise<void> {
    if (this.handles) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const resolved = await loadManifest();
    if (!resolved) return;

    // Element may have been disconnected while awaiting the fetch.
    if (!this.isConnected) return;

    const initialTucked = computeInitialTuckState();
    this.handles = populateToolbar(
      this,
      resolved.manifest,
      resolved.manifestUrl,
      initialTucked
    );
    this.state = initialTucked ? 'tucked' : 'revealed-uncommitted';

    registerToggleShortcut(() => {
      if (!this.handles) return;
      const tucked = this.handles.toggleTucked();
      persistTuckedPreference(tucked);
      this.state = tucked ? 'tucked' : 'revealed-uncommitted';
      // After explicit toggle, disarm so the cursor's current position
      // (likely still inside or near the bar) doesn't immediately flip
      // the state machine back.
      this.armed = false;
    });

    this.tuckObserver = new MutationObserver(() => {
      const tucked = this.hasAttribute('data-tucked');
      persistTuckedPreference(tucked);
      // The hide button writes the attribute directly — keep our state
      // model in sync and disarm to prevent the immediate re-reveal.
      if (tucked) {
        this.state = 'tucked';
        this.armed = false;
      } else if (this.state === 'tucked') {
        this.state = 'revealed-uncommitted';
      }
    });
    this.tuckObserver.observe(this, {
      attributes: true,
      attributeFilter: ['data-tucked'],
    });

    document.addEventListener('pointermove', this.onPointerMove, true);
  }

  disconnectedCallback(): void {
    this.tuckObserver?.disconnect();
    this.tuckObserver = null;
    document.removeEventListener('pointermove', this.onPointerMove, true);
    // Note: we don't tear down the shadow root or null out handles here,
    // because connectedCallback can fire again if the node is moved
    // around the tree. populateToolbar is idempotent.
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.handles) return;
    const inEdge = event.clientY >= window.innerHeight - EDGE_REVEAL_PX;
    if (!inEdge) this.armed = true;

    const barRect = this.getBarRect();
    const inBar =
      !!barRect &&
      event.clientX >= barRect.left &&
      event.clientX <= barRect.right &&
      event.clientY >= barRect.top &&
      event.clientY <= barRect.bottom;

    if (this.state === 'tucked') {
      if (inEdge && this.armed) {
        this.handles.setTucked(false);
        this.state = 'revealed-uncommitted';
      }
    } else if (this.state === 'revealed-uncommitted') {
      if (inBar) this.state = 'revealed-committed';
    } else if (this.state === 'revealed-committed') {
      if (!inBar) {
        this.handles.setTucked(true);
        this.state = 'tucked';
        this.armed = false;
      }
    }
  };

  private getBarRect(): DOMRect | null {
    const bar =
      this.shadowRoot?.querySelector<HTMLElement>('.bar') ?? null;
    if (!bar) return null;
    if (this.hasAttribute('data-tucked')) {
      // Tucked bar is translated below the viewport. For hit testing we
      // want the rect the bar would occupy when visible, so synthesize
      // it from the host's content box.
      const hostRect = this.getBoundingClientRect();
      return new DOMRect(
        hostRect.left,
        hostRect.top,
        hostRect.width,
        hostRect.height
      );
    }
    return bar.getBoundingClientRect();
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
  customElements.define(TAG, DesignDraftsToolbar);
}

function computeInitialTuckState(): boolean {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('toolbar');
  if (param === '0') return true; // start tucked
  if (param === '1') {
    clearTuckedPreference();
    return false;
  }
  return readTuckedPreference();
}

function readTuckedPreference(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

function persistTuckedPreference(tucked: boolean): void {
  try {
    if (tucked) window.sessionStorage.setItem(SESSION_HIDDEN_KEY, '1');
    else window.sessionStorage.removeItem(SESSION_HIDDEN_KEY);
  } catch {
    // sessionStorage can throw in privacy modes; ignore.
  }
}

function clearTuckedPreference(): void {
  try {
    window.sessionStorage.removeItem(SESSION_HIDDEN_KEY);
  } catch {
    // ignore
  }
}

// Auto-mount: if no <dd-toolbar> is in the DOM at script-load time, append
// one to <body> so existing `<script src=".../toolbar.js">` deployments
// keep working without changes.
function autoMount(): void {
  if (typeof document === 'undefined') return;
  if (document.querySelector(TAG)) return;
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true });
    return;
  }
  const auto = document.createElement(TAG);
  auto.setAttribute('data-auto', '');
  document.body.appendChild(auto);
}

autoMount();
