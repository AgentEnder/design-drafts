// @vitest-environment jsdom
//
// While the overlay is active the page underneath is inert. Both behaviours
// here were reported from real use on github.com: a link click navigated away
// mid-annotation, and typing a comment containing "t" fired the site's file
// finder.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import './index.js';

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

/** Click the way a browser does: a real bubbling, cancelable MouseEvent.
 *
 * jsdom performs no layout and has no `elementsFromPoint`, which the picker
 * relies on (ADR 0001). Standing in the ancestor chain of the clicked element
 * is faithful to what a browser returns there — innermost first — and is the
 * only part of layout these tests need. */
function click(target: Element): MouseEvent {
  const chain: Element[] = [];
  for (let el: Element | null = target; el; el = el.parentElement) chain.push(el);
  (document as unknown as { elementsFromPoint: () => Element[] })
    .elementsFromPoint = () => chain;

  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

/** Put fixture markup on the page.
 *
 * Scoped to a container rather than assigned to `document.body.innerHTML`,
 * because the auto-mounted <dd-annotations> element lives on the body too and
 * replacing its children disconnects the overlay. */
function page(markup: string): HTMLElement {
  const container = document.createElement('div');
  container.id = 'fixture';
  container.innerHTML = markup;
  document.body.appendChild(container);
  return container;
}

beforeEach(() => {
  document.getElementById('fixture')?.remove();
  window.localStorage.clear();
  (document as unknown as { elementsFromPoint: () => Element[] })
    .elementsFromPoint = () => [];
});

afterEach(() => {
  api().deactivate();
});

describe('page clicks while annotating', () => {
  it('does not let a link navigate', () => {
    const fixture = page('<p>See <a href="/docs">the docs</a>.</p>');
    api().activate();

    const event = click(fixture.querySelector('a')!);

    // A cancelled click is a link that does not navigate.
    expect(event.defaultPrevented).toBe(true);
  });

  it('annotates the link instead', () => {
    const fixture = page('<p>See <a href="/docs">the docs</a>.</p>');
    api().activate();

    click(fixture.querySelector('a')!);

    expect(shadow().querySelector('.composer')).not.toBeNull();
  });

  it('keeps a page click handler from firing at all', () => {
    const fixture = page('<p>See <a href="/docs">the docs</a>.</p>');
    const seen: string[] = [];
    document.addEventListener('click', () => seen.push('page'));
    api().activate();

    click(fixture.querySelector('a')!);

    expect(seen).toEqual([]);
  });

  it('still swallows a click once the composer is open', () => {
    // The reported failure: with a composer open the handler used to return
    // early, so the next click reached the page and navigated away, taking
    // the half-written comment with it.
    const fixture = page('<p id="a">first</p><p>second <a href="/x">link</a></p>');
    api().activate();
    click(fixture.querySelector('#a')!);
    expect(shadow().querySelector('.composer')).not.toBeNull();

    const event = click(fixture.querySelector('a')!);

    expect(event.defaultPrevented).toBe(true);
    // And the in-progress comment survives.
    expect(shadow().querySelector('.composer')).not.toBeNull();
  });

  it('stops mousedown reaching the page, for sites that route on it', () => {
    const fixture = page('<p>copy</p>');
    const seen: string[] = [];
    document.addEventListener('mousedown', () => seen.push('page'));
    api().activate();

    fixture
      .querySelector('p')!
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));

    expect(seen).toEqual([]);
  });

  it('does not cancel mousedown, which would break text selection', () => {
    const fixture = page('<p>copy</p>');
    api().activate();

    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    fixture.querySelector('p')!.dispatchEvent(event);

    // Selecting text is the browser's default action for mousedown; cancel it
    // and the reviewer can no longer highlight anything to annotate.
    expect(event.defaultPrevented).toBe(false);
  });

  it('leaves the page alone once deactivated', () => {
    const fixture = page('<p>See <a href="/docs">the docs</a>.</p>');
    const seen: string[] = [];
    document.addEventListener('click', () => seen.push('page'));
    api().activate();
    api().deactivate();

    const event = click(fixture.querySelector('a')!);

    expect(event.defaultPrevented).toBe(false);
    expect(seen).toEqual(['page']);
  });
});

describe('typing into the composer', () => {
  function openComposer(): HTMLTextAreaElement {
    const fixture = page('<p>Some copy to annotate.</p>');
    api().activate();
    click(fixture.querySelector('p')!);
    const textarea = shadow().querySelector('textarea');
    if (!textarea) throw new Error('composer did not open');
    return textarea as HTMLTextAreaElement;
  }

  it('does not reach a page hotkey handler', () => {
    // @github/hotkey and friends listen on document and bail when the event
    // target is a form field. Shadow retargeting makes the target look like
    // the overlay's host <div>, so that guard never fires — hence "t" in a
    // comment opening GitHub's file finder.
    const seen: string[] = [];
    document.addEventListener('keydown', (e) => seen.push(e.key));
    const textarea = openComposer();

    for (const key of ['t', 'e', 's', 't']) {
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, composed: true })
      );
    }

    expect(seen).toEqual([]);
  });

  it('does not reach a page input handler either', () => {
    const seen: string[] = [];
    document.addEventListener('input', () => seen.push('page'));
    const textarea = openComposer();

    textarea.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));

    expect(seen).toEqual([]);
  });

  it('still lets Escape close the composer', () => {
    // Overlay key handling is on window's capture phase, which runs before
    // the host-level stopper on the way down.
    openComposer();
    expect(shadow().querySelector('.composer')).not.toBeNull();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(shadow().querySelector('.composer')).toBeNull();
  });

  it('lets page keystrokes through when the overlay is off', () => {
    const seen: string[] = [];
    document.addEventListener('keydown', (e) => seen.push(e.key));
    page('<p>copy</p>');

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 't', bubbles: true })
    );

    expect(seen).toEqual(['t']);
  });
});
