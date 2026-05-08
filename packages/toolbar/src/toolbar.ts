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
export class DesignDraftsToolbar extends HTMLElement {
  private handles: ToolbarHandles | null = null;
  private hideObserver: MutationObserver | null = null;

  async connectedCallback(): Promise<void> {
    if (this.handles) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const resolved = await loadManifest();
    if (!resolved) return;

    // Element may have been disconnected while awaiting the fetch.
    if (!this.isConnected) return;

    this.handles = populateToolbar(
      this,
      resolved.manifest,
      resolved.manifestUrl,
      computeInitialVisibility()
    );

    registerToggleShortcut(() => {
      if (!this.handles) return;
      const visible = this.handles.toggleVisible();
      persistHiddenPreference(!visible);
    });

    this.hideObserver = new MutationObserver(() => {
      persistHiddenPreference(this.hasAttribute('hidden'));
    });
    this.hideObserver.observe(this, {
      attributes: true,
      attributeFilter: ['hidden'],
    });
  }

  disconnectedCallback(): void {
    this.hideObserver?.disconnect();
    this.hideObserver = null;
    // Note: we don't tear down the shadow root or null out handles here,
    // because connectedCallback can fire again if the node is moved
    // around the tree. populateToolbar is idempotent.
  }
}

if (typeof customElements !== 'undefined' && !customElements.get(TAG)) {
  customElements.define(TAG, DesignDraftsToolbar);
}

function computeInitialVisibility(): boolean {
  const params = new URLSearchParams(window.location.search);
  const param = params.get('toolbar');
  if (param === '0') return false;
  if (param === '1') {
    clearHiddenPreference();
    return true;
  }
  return !readHiddenPreference();
}

function readHiddenPreference(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

function persistHiddenPreference(hidden: boolean): void {
  try {
    if (hidden) window.sessionStorage.setItem(SESSION_HIDDEN_KEY, '1');
    else window.sessionStorage.removeItem(SESSION_HIDDEN_KEY);
  } catch {
    // sessionStorage can throw in privacy modes; ignore.
  }
}

function clearHiddenPreference(): void {
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
