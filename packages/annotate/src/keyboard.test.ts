// @vitest-environment jsdom
//
// Committing a note from the keyboard. Reviewing is a typing job — the hand
// is already on the keys, and reaching for Save to commit every one-line
// note is the slowest part of a pass.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import './index.js';
import { loadAnnotationsByUrl, type Annotation } from './storage.js';

const HOST_ID = 'design-drafts-annotate-root';

interface Api {
  activate(): void;
  deactivate(): void;
  isActive(): boolean;
}

function api(): Api {
  return (window as unknown as { DesignDraftsAnnotate: Api })
    .DesignDraftsAnnotate;
}

function shadow(): ShadowRoot {
  return document.getElementById(HOST_ID)!.shadowRoot!;
}

/** Click the way a browser does, standing in for the layout jsdom doesn't do:
 * the picker reads `elementsFromPoint`, and the clicked element's ancestor
 * chain is what a real one returns (ADR 0001). */
function click(target: Element): void {
  const chain: Element[] = [];
  for (let el: Element | null = target; el; el = el.parentElement) chain.push(el);
  (document as unknown as { elementsFromPoint: () => Element[] })
    .elementsFromPoint = () => chain;
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

/** Fixture markup, appended rather than assigned to `body.innerHTML`: the
 * auto-mounted <dd-annotations> lives on the body too. */
function page(markup: string): HTMLElement {
  const container = document.createElement('div');
  container.id = 'fixture';
  container.innerHTML = markup;
  document.body.appendChild(container);
  return container;
}

/** Keystrokes are `composed`, the way real ones crossing the shadow boundary
 * are — that's the path the overlay's host-level stopper sits on. */
function press(
  field: Element,
  key: string,
  modifiers: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } = {}
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...modifiers,
  });
  field.dispatchEvent(event);
  return event;
}

function openComposer(): HTMLTextAreaElement {
  const fixture = page('<p>Some copy to annotate.</p>');
  api().activate();
  click(fixture.querySelector('p')!);
  const textarea = shadow().querySelector<HTMLTextAreaElement>('.composer textarea');
  if (!textarea) throw new Error('composer did not open');
  return textarea;
}

const ORIGIN = 'http://localhost:3000/';
const HERE = `${ORIGIN}index.html`;

function saved(): Annotation[] {
  return (loadAnnotationsByUrl(ORIGIN, undefined).get(HERE) ?? []) as Annotation[];
}

beforeEach(() => {
  document.getElementById('fixture')?.remove();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/index.html');
  (document as unknown as { elementsFromPoint: () => Element[] })
    .elementsFromPoint = () => [];
});

afterEach(() => {
  api().deactivate();
});

describe('saving a new note from the composer', () => {
  it('commits it on Cmd+Enter', () => {
    const textarea = openComposer();
    textarea.value = 'tighten this';

    press(textarea, 'Enter', { metaKey: true });

    expect(saved().map((a) => a.comment)).toEqual(['tighten this']);
    expect(shadow().querySelector('.composer')).toBeNull();
  });

  // Same shortcut, the key the reviewer actually has off the Mac.
  it('commits it on Ctrl+Enter too', () => {
    const textarea = openComposer();
    textarea.value = 'tighten this';

    press(textarea, 'Enter', { ctrlKey: true });

    expect(saved().map((a) => a.comment)).toEqual(['tighten this']);
  });

  // A note is a paragraph or two; Enter has to stay Enter.
  it('leaves a bare Enter to the textarea', () => {
    const textarea = openComposer();
    textarea.value = 'first line';

    const event = press(textarea, 'Enter');

    expect(event.defaultPrevented).toBe(false);
    expect(saved()).toHaveLength(0);
    expect(shadow().querySelector('.composer')).not.toBeNull();
  });

  it('stores nothing when there is nothing typed', () => {
    const textarea = openComposer();

    press(textarea, 'Enter', { metaKey: true });

    expect(saved()).toHaveLength(0);
  });

  // The host swallows keystrokes so a page hotkey never sees them; the
  // shortcut must not be the one that leaks.
  it('does not reach the page', () => {
    const seen: string[] = [];
    document.addEventListener('keydown', (e) => seen.push(e.key));
    const textarea = openComposer();
    textarea.value = 'tighten this';

    press(textarea, 'Enter', { metaKey: true });

    expect(seen).toEqual([]);
  });
});

describe('saving an edit from the panel', () => {
  function seedOne(): void {
    window.localStorage.setItem(
      'dd:annotate:' + HERE,
      JSON.stringify([
        {
          id: 'a1',
          comment: 'old wording',
          createdAt: 1,
          updatedAt: 1,
          selector: { tagName: 'p' },
        },
      ])
    );
  }

  function button(scope: ParentNode, label: string): HTMLButtonElement {
    const found = Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === label
    );
    if (!found) throw new Error(`no "${label}" button`);
    return found;
  }

  it('commits it on Cmd+Enter', () => {
    page('<p>copy</p>');
    seedOne();
    api().activate();
    const entry = shadow().querySelector<HTMLElement>('.entry')!;
    button(entry, 'Edit').click();
    const field = shadow().querySelector<HTMLTextAreaElement>('.entry textarea')!;
    field.value = 'new wording';

    press(field, 'Enter', { metaKey: true });

    expect(saved().map((a) => a.comment)).toEqual(['new wording']);
    // Committed means out of the editor: the entry reads back as prose.
    expect(shadow().querySelector('.entry textarea')).toBeNull();
  });
});
