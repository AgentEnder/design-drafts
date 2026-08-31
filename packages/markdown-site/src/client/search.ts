// Spotlight search. The pagefind bundle is loaded lazily: a HEAD probe
// distinguishes "still building" (503, from the preview server while pagefind
// runs in the background) from "ready" and "missing". Until it resolves, a
// disabled placeholder input stands in for the search box so the reader sees
// progress, not a dead spot.
//
// The page-specific values (bundle paths relative to this page, the deployed
// base url for result links) come from data attributes on the dialog element.

declare const PagefindUI: new (options: {
  element: string;
  baseUrl: string | undefined;
  showSubResults: boolean;
}) => unknown;

/**
 * Whether a key event came from something the reader is typing into. Checked
 * against `composedPath()` rather than `event.target`: events crossing a
 * shadow boundary (the annotate composer, any component a draft embeds) are
 * retargeted to the host element by the time a window listener sees them, so
 * the real field is only visible on the path.
 */
export function originatesFromEditable(event: KeyboardEvent): boolean {
  const target = event.composedPath()[0] ?? event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  ) {
    return true;
  }
  return (
    target.isContentEditable ||
    target.closest('[contenteditable]:not([contenteditable="false"])') !== null
  );
}

export function initSearch(): void {
  const dialog = document.querySelector<HTMLDialogElement>('.search-dialog');
  const trigger = document.querySelector<HTMLButtonElement>('.search-trigger');
  const container = document.getElementById('dd-search');
  if (!dialog || !trigger || !container) return;
  const { uiScript, uiStyles, baseUrl } = dialog.dataset;
  if (!uiScript || !uiStyles) return;
  if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) {
    const kbd = trigger.querySelector('kbd');
    if (kbd) kbd.textContent = 'Ctrl K';
  }
  const placeholder = document.createElement('input');
  placeholder.type = 'search';
  placeholder.className = 'search-placeholder';
  placeholder.disabled = true;
  placeholder.placeholder = 'Loading search…';
  container.append(placeholder);
  const focusInput = (): void => {
    const input = container.querySelector<HTMLInputElement>(
      'input:not([disabled])'
    );
    if (input) input.focus();
  };
  const openSearch = (): void => {
    if (!dialog.open) dialog.showModal();
    focusInput();
  };
  trigger.addEventListener('click', openSearch);
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      openSearch();
      return;
    }
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !dialog.open) {
      if (!originatesFromEditable(event)) {
        event.preventDefault();
        openSearch();
      }
    }
  });
  dialog.addEventListener('click', (event) => {
    // A click on the backdrop lands on the dialog element itself.
    if (event.target === dialog) {
      dialog.close();
      return;
    }
    // Following a result should dismiss the spotlight.
    if (event.target instanceof Element && event.target.closest('a')) {
      dialog.close();
    }
  });
  const fail = (): void => {
    trigger.remove();
    dialog.remove();
  };
  let attempts = 0;
  const mount = (): void => {
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = uiStyles;
    document.head.append(styles);
    const script = document.createElement('script');
    script.src = uiScript;
    script.onload = () => {
      container.textContent = '';
      new PagefindUI({
        element: '#dd-search',
        baseUrl,
        showSubResults: true,
      });
      if (dialog.open) focusInput();
    };
    script.onerror = fail;
    document.head.append(script);
  };
  const probe = async (): Promise<void> => {
    attempts += 1;
    let status = 0;
    try {
      status = (await fetch(uiScript, { method: 'HEAD' })).status;
    } catch {
      /* network error — handled by the status checks below */
    }
    if (status === 200) {
      mount();
      return;
    }
    if (status === 503 && attempts < 60) {
      // The preview server is still building the index.
      placeholder.placeholder = 'Building search index…';
      setTimeout(probe, 1500);
      return;
    }
    if ((status === 0 || status >= 500) && attempts < 3) {
      setTimeout(probe, 2000);
      return;
    }
    fail();
  };
  void probe();
}
