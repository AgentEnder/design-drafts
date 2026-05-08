import { registerToggleShortcut } from './keybindings.js';
import { loadManifest } from './manifest.js';
import { populateToolbar, type ToolbarHandles } from './ui.js';

const TAG = 'dd-toolbar';

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
 * Initial visibility:
 *   - `?toolbar=0` in the URL → hidden on load.
 *   - Otherwise → visible. Tucked state is per-page-view, not persisted
 *     across refreshes; reload always starts with the bar revealed.
 */
// Auto-tuck state machine.
//
// The X button (and Cmd/Ctrl+.) hides the bar — period. Auto-reveal is
// gated by an `armed` flag that only flips on once the cursor has
// visited the top half of the viewport since the last tuck. After
// arming, returning the cursor to the bottom 25% of the viewport
// brings the bar back. The bar then stays revealed until the user
// hides it again — no auto-tuck on cursor movement.
//
// This removes the previous "edge of viewport" trigger entirely, which
// was incidentally fighting the OS chrome (macOS Dock, Windows
// taskbar peek) for the same pixel row.
type TuckState = 'tucked' | 'revealed';

const ARM_TOP_RATIO = 0.5; // cursor must visit `y < vh * 0.5` to arm
const REVEAL_BOTTOM_RATIO = 0.75; // when armed, `y >= vh * 0.75` reveals

export class DesignDraftsToolbar extends HTMLElement {
  private handles: ToolbarHandles | null = null;
  private tuckObserver: MutationObserver | null = null;
  private state: TuckState = 'revealed';
  private armed = false;

  async connectedCallback(): Promise<void> {
    if (this.handles) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Attach the pointer listener BEFORE awaiting the manifest fetch so
    // arming-via-top-half cursor movements made during the loading window
    // aren't lost. The listener early-returns until handles are ready.
    document.addEventListener('pointermove', this.onPointerMove, true);

    const resolved = await loadManifest();
    if (!resolved) {
      document.removeEventListener('pointermove', this.onPointerMove, true);
      return;
    }

    // Element may have been disconnected while awaiting the fetch.
    if (!this.isConnected) {
      document.removeEventListener('pointermove', this.onPointerMove, true);
      return;
    }

    const initialTucked = computeInitialTuckState();
    this.handles = populateToolbar(
      this,
      resolved.manifest,
      resolved.manifestUrl,
      initialTucked
    );
    this.state = initialTucked ? 'tucked' : 'revealed';

    registerToggleShortcut(() => {
      if (!this.handles) return;
      const tucked = this.handles.toggleTucked();
      this.state = tucked ? 'tucked' : 'revealed';
      this.armed = false;
    });

    this.tuckObserver = new MutationObserver(() => {
      const tucked = this.hasAttribute('data-tucked');
      this.state = tucked ? 'tucked' : 'revealed';
      // Re-arming requires a fresh trip through the top half of the
      // viewport — every tuck (X click, shortcut, programmatic) starts
      // from disarmed.
      if (tucked) this.armed = false;
    });
    this.tuckObserver.observe(this, {
      attributes: true,
      attributeFilter: ['data-tucked'],
    });
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
    // `armed` tracks unconditionally so cursor movements during the
    // manifest-load window aren't lost — once handles are ready and the
    // state is tucked, a prior top-half visit still counts.
    const vh = window.innerHeight;
    if (event.clientY < vh * ARM_TOP_RATIO) {
      this.armed = true;
      return;
    }
    if (!this.handles) return;
    if (this.state !== 'tucked') return;
    if (this.armed && event.clientY >= vh * REVEAL_BOTTOM_RATIO) {
      this.handles.setTucked(false);
      // state is updated via the MutationObserver on data-tucked.
    }
  };
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
  customElements.define(TAG, DesignDraftsToolbar);
}

function computeInitialTuckState(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('toolbar') === '0';
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
