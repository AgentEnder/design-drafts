// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { initSearch, originatesFromEditable } from './search';

/**
 * Dispatches a `/` keydown from `target` and evaluates the guard from a window
 * listener mid-dispatch, the way initSearch sees it — `composedPath()` empties
 * once dispatch ends, so calling the guard afterwards would test nothing.
 */
function guardVerdictFor(target: EventTarget): boolean {
  let verdict: boolean | undefined;
  window.addEventListener(
    'keydown',
    (event) => (verdict = originatesFromEditable(event)),
    { once: true }
  );
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: '/',
      bubbles: true,
      composed: true,
      cancelable: true,
    })
  );
  if (verdict === undefined) throw new Error('keydown never reached window');
  return verdict;
}

describe('originatesFromEditable', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is false for a keystroke on the page itself', () => {
    expect(guardVerdictFor(document.body)).toBe(false);
  });

  it('is true inside light-dom form fields', () => {
    for (const tag of ['input', 'textarea', 'select'] as const) {
      const field = document.createElement(tag);
      document.body.append(field);
      expect(guardVerdictFor(field), tag).toBe(true);
    }
  });

  it('is true inside a contenteditable region', () => {
    const region = document.createElement('div');
    region.setAttribute('contenteditable', 'true');
    document.body.append(region);
    expect(guardVerdictFor(region)).toBe(true);
  });

  it('sees through shadow-dom retargeting to a textarea inside a component', () => {
    // The annotate overlay's composer lives in a shadow root; by the time a
    // window listener sees its keystrokes, event.target is the host element,
    // which the naive target check reads as "not typing".
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const textarea = document.createElement('textarea');
    shadow.append(textarea);
    document.body.append(host);
    expect(guardVerdictFor(textarea)).toBe(true);
  });
});

describe('the search hotkey', () => {
  it('opens on / from the page but never from inside an editable', () => {
    vi.stubGlobal('fetch', () => new Promise(() => {})); // probe never settles
    document.body.innerHTML = `
      <button class="search-trigger"><kbd>⌘ K</kbd></button>
      <dialog class="search-dialog"
        data-ui-script="pagefind/pagefind-ui.js"
        data-ui-styles="pagefind/pagefind-ui.css">
        <div id="dd-search"></div>
      </dialog>`;
    const dialog = document.querySelector<HTMLDialogElement>('.search-dialog')!;
    // jsdom has no showModal; opening still reflects into the open attribute.
    dialog.showModal = () => dialog.setAttribute('open', '');
    initSearch();

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const textarea = document.createElement('textarea');
    shadow.append(textarea);
    document.body.append(host);
    const inEditable = new KeyboardEvent('keydown', {
      key: '/',
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    textarea.dispatchEvent(inEditable);
    expect(dialog.open).toBe(false);
    expect(inEditable.defaultPrevented).toBe(false); // the / must reach the field

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true })
    );
    expect(dialog.open).toBe(true);
    vi.unstubAllGlobals();
  });
});
