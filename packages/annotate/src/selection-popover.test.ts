// @vitest-environment jsdom
//
// The selection popover: selection alone is inert — copying works, nothing is
// annotated — and the pill of actions is the only path from a selection to a
// text annotation. Click-away dismisses without opening anything.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

/** Fixture markup, appended rather than assigned to `body.innerHTML`: the
 * auto-mounted <dd-annotations> lives on the body too. */
function page(markup: string): HTMLElement {
  const container = document.createElement('div');
  container.id = 'fixture';
  container.innerHTML = markup;
  document.body.appendChild(container);
  return container;
}

/** Click the way a browser does, standing in for the layout jsdom doesn't do:
 * the picker reads `elementsFromPoint`, and the clicked element's ancestor
 * chain is what a real one returns (ADR 0001). */
function click(target: Element): void {
  const chain: Element[] = [];
  for (let el: Element | null = target; el; el = el.parentElement) {
    chain.push(el);
  }
  (document as unknown as { elementsFromPoint: () => Element[] })
    .elementsFromPoint = () => chain;
  target.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );
}

/** Select `needle` inside the fixture, the way a reviewer's drag would leave
 * the document selection, and let the overlay hear about it. */
function select(root: Element, needle: string): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const at = n.data.indexOf(needle);
    if (at === -1) continue;
    const range = document.createRange();
    range.setStart(n, at);
    range.setEnd(n, at + needle.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    vi.advanceTimersByTime(200);
    return;
  }
  throw new Error(`fixture does not contain ${JSON.stringify(needle)}`);
}

function popover(): HTMLElement | null {
  return shadow().querySelector('.selection-popover');
}

function action(label: string): HTMLButtonElement {
  const found = Array.from(
    popover()?.querySelectorAll<HTMLButtonElement>('button') ?? []
  ).find((b) => b.textContent?.includes(label));
  if (!found) throw new Error(`no "${label}" action in the popover`);
  return found;
}

const ORIGIN = 'http://localhost:3000/';
const HERE = `${ORIGIN}index.html`;

function saved(): Annotation[] {
  return (loadAnnotationsByUrl(ORIGIN, undefined).get(HERE) ?? []) as Annotation[];
}

beforeEach(() => {
  vi.useFakeTimers();
  document.getElementById('fixture')?.remove();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/index.html');
  (document as unknown as { elementsFromPoint: () => Element[] })
    .elementsFromPoint = () => [];
});

afterEach(() => {
  api().deactivate();
  window.getSelection()?.removeAllRanges();
  vi.useRealTimers();
});

describe('a live selection', () => {
  it('summons the popover with one action per kind', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();

    select(fixture, 'under a minute');

    expect(popover()).not.toBeNull();
    const labels = Array.from(popover()!.querySelectorAll('button')).map(
      (b) => b.textContent
    );
    expect(labels).toEqual([
      '💬 Comment',
      '✂ Delete',
      '⇄ Replace',
      '+ Insert',
      '✎ Reword',
    ]);
  });

  it('opens no composer by itself — selection is inert', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();

    select(fixture, 'under a minute');

    expect(shadow().querySelector('.composer')).toBeNull();
    expect(saved()).toHaveLength(0);
  });

  it('keeps the popover in place when the click ending the drag arrives', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();
    select(fixture, 'under a minute');

    // The click that ends a selection drag arrives with the selection alive.
    click(fixture.querySelector('p')!);

    expect(popover()).not.toBeNull();
    expect(shadow().querySelector('.composer')).toBeNull();
  });
});

describe('dismissal', () => {
  it('collapsing the selection hides the popover and saves nothing', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();
    select(fixture, 'under a minute');

    window.getSelection()!.removeAllRanges();
    document.dispatchEvent(new Event('selectionchange'));
    vi.advanceTimersByTime(200);

    expect(popover()).toBeNull();
    expect(saved()).toHaveLength(0);
  });

  it('a click that dismisses the popover does not element-pick', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();
    select(fixture, 'under a minute');

    // A real click-away collapses the selection on its own mousedown first.
    window.getSelection()!.removeAllRanges();
    click(fixture.querySelector('p')!);

    expect(popover()).toBeNull();
    expect(shadow().querySelector('.composer')).toBeNull();
  });

  it('Escape hides the popover', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();
    select(fixture, 'under a minute');

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(popover()).toBeNull();
  });
});

describe('the actions', () => {
  it('Delete saves immediately, with no composer and an empty note', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();
    select(fixture, 'under a minute');

    action('Delete').click();

    expect(shadow().querySelector('.composer')).toBeNull();
    expect(popover()).toBeNull();
    expect(
      saved().map((a) => ({
        kind: a.kind,
        comment: a.comment,
        exact: a.selector.textRange?.exact,
      }))
    ).toEqual([{ kind: 'delete', comment: '', exact: 'under a minute' }]);
  });

  it('Replace opens the composer asking for the replacement, and stores it', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();
    select(fixture, 'under a minute');

    action('Replace').click();

    const textarea =
      shadow().querySelector<HTMLTextAreaElement>('.composer textarea');
    expect(textarea?.placeholder).toBe('Replacement text…');

    textarea!.value = 'in about a minute';
    shadow()
      .querySelector<HTMLButtonElement>('.composer .btn.primary')!
      .click();

    expect(saved().map((a) => [a.kind, a.comment])).toEqual([
      ['replace', 'in about a minute'],
    ]);
  });

  it('a plain element click still writes a comment', () => {
    const fixture = page('<p>Ships in under a minute, every time.</p>');
    api().activate();

    click(fixture.querySelector('p')!);
    const textarea =
      shadow().querySelector<HTMLTextAreaElement>('.composer textarea');
    textarea!.value = 'tighten this';
    shadow()
      .querySelector<HTMLButtonElement>('.composer .btn.primary')!
      .click();

    expect(saved().map((a) => a.kind)).toEqual(['comment']);
  });
});
