import { registerToggleShortcut } from './keybindings.js';
import { loadManifest } from './manifest.js';
import { mountToolbar } from './ui.js';

const SESSION_HIDDEN_KEY = 'design-drafts.toolbar.hidden';

/**
 * Bootstrap the toolbar. Idempotent and silent when there is no manifest at
 * `/draft.config.json`.
 *
 * Visibility precedence:
 *   1. `?toolbar=0` query param → hidden on load (URL is the source of truth
 *      when the page author chose to set it).
 *   2. `?toolbar=1` → visible, explicitly clearing any session-hide.
 *   3. sessionStorage flag set by the toolbar's own hide button → hidden.
 *   4. Otherwise → visible.
 */
async function bootstrap(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const resolved = await loadManifest();
  if (!resolved) return;

  const initiallyVisible = computeInitialVisibility();

  // Defer to next tick if <body> isn't there yet (script ran in <head>).
  if (!document.body) {
    await new Promise<void>((resolve) => {
      const onReady = (): void => {
        document.removeEventListener('DOMContentLoaded', onReady);
        resolve();
      };
      document.addEventListener('DOMContentLoaded', onReady);
    });
  }

  const handles = mountToolbar(
    resolved.manifest,
    resolved.manifestUrl,
    initiallyVisible
  );

  registerToggleShortcut(() => {
    const visible = handles.toggleVisible();
    persistHiddenPreference(!visible);
  });

  // Persist hidden state when the user clicks the bar's own hide button.
  const observer = new MutationObserver(() => {
    persistHiddenPreference(handles.host.hasAttribute('hidden'));
  });
  observer.observe(handles.host, {
    attributes: true,
    attributeFilter: ['hidden'],
  });
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

void bootstrap();
