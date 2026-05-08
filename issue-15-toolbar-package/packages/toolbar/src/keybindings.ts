/**
 * Register the Cmd/Ctrl + . shortcut. Returns a teardown function.
 *
 * The shortcut targets the platform-conventional modifier (Cmd on Mac, Ctrl
 * elsewhere). We don't intercept when the user is mid-text-input so the
 * shortcut never steals keystrokes from authoring contexts the draft might
 * include.
 */
export function registerToggleShortcut(toggle: () => void): () => void {
  const handler = (event: KeyboardEvent): void => {
    if (event.key !== '.') return;
    const isMac =
      typeof navigator !== 'undefined' &&
      /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || '');
    const modifier = isMac ? event.metaKey : event.ctrlKey;
    if (!modifier) return;
    if (event.shiftKey || event.altKey) return;
    if (isEditableTarget(event.target)) return;
    event.preventDefault();
    toggle();
  };

  window.addEventListener('keydown', handler, { capture: true });
  return () => window.removeEventListener('keydown', handler, { capture: true });
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
