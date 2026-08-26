// @vitest-environment jsdom
//
// The annotations panel: the list, its per-entry actions, and the bulk Clear.
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

function annotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'a1',
    comment: 'tighten this',
    createdAt: 1,
    updatedAt: 1,
    selector: { tagName: 'p' },
    ...overrides,
  } as Annotation;
}

/** Annotations left at `url` by an earlier visit. */
function seed(url: string, annotations: Annotation[]): void {
  window.localStorage.setItem('dd:annotate:' + url, JSON.stringify(annotations));
}

function entries(): HTMLElement[] {
  return Array.from(shadow().querySelectorAll<HTMLElement>('.entry'));
}

/** The button labelled `label` inside `scope`. */
function button(scope: ParentNode, label: string): HTMLButtonElement {
  const found = Array.from(scope.querySelectorAll<HTMLButtonElement>('button')).find(
    (b) => b.textContent?.trim() === label
  );
  if (!found) {
    const all = Array.from(scope.querySelectorAll('button')).map((b) => b.textContent);
    throw new Error(`no "${label}" button among ${JSON.stringify(all)}`);
  }
  return found;
}

/** Tabs are labelled for the reader ("This page"), so address them by the
 * page url they carry instead. */
function tab(url: string): HTMLButtonElement {
  const found = Array.from(
    shadow().querySelectorAll<HTMLButtonElement>('.panel-tab')
  ).find((t) => t.title === url);
  if (!found) throw new Error(`no tab for ${url}`);
  return found;
}

const ORIGIN = 'http://localhost:3000/';
const HERE = `${ORIGIN}index.html`;
const SIBLING = `${ORIGIN}pricing.html`;

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/index.html');
  // Appended, never assigned to body.innerHTML: the auto-mounted
  // <dd-annotations> element lives on the body too, and replacing its children
  // disconnects the overlay.
  document.getElementById('fixture')?.remove();
  const fixture = document.createElement('div');
  fixture.id = 'fixture';
  fixture.innerHTML = '<p id="target">copy</p>';
  document.body.appendChild(fixture);
});

afterEach(() => {
  api().deactivate();
});

describe('deleting one annotation', () => {
  it('removes it from the page being viewed', () => {
    seed(HERE, [annotation({ id: 'a1' }), annotation({ id: 'a2' })]);
    api().activate();

    button(entries()[0]!, 'Delete').click();

    expect(loadAnnotationsByUrl(ORIGIN, undefined).get(HERE)).toHaveLength(1);
    expect(entries()).toHaveLength(1);
  });

  // The panel is tabbed across every page of the draft, so the entry being
  // deleted is not necessarily on the page doing the deleting.
  it('removes it from a sibling page whose tab is open', () => {
    seed(HERE, [annotation({ id: 'here' })]);
    seed(SIBLING, [annotation({ id: 'there' })]);
    api().activate();
    tab(SIBLING).click();

    button(entries()[0]!, 'Delete').click();

    expect(loadAnnotationsByUrl(ORIGIN, undefined).get(SIBLING)).toBeUndefined();
  });

  it('leaves the page it is not looking at alone', () => {
    seed(HERE, [annotation({ id: 'here' })]);
    seed(SIBLING, [annotation({ id: 'there' })]);
    api().activate();
    tab(SIBLING).click();

    button(entries()[0]!, 'Delete').click();

    expect(loadAnnotationsByUrl(ORIGIN, undefined).get(HERE)).toHaveLength(1);
  });
});

// Edit shares Delete's storage path, so it shares Delete's blind spot — and
// fails worse: a write aimed at the wrong page does not no-op, it copies the
// annotation onto the page you happen to be standing on.
describe('editing one annotation', () => {
  it('rewrites it on a sibling page whose tab is open', () => {
    seed(HERE, [annotation({ id: 'here' })]);
    seed(SIBLING, [annotation({ id: 'there', comment: 'old wording' })]);
    api().activate();
    tab(SIBLING).click();

    button(entries()[0]!, 'Edit').click();
    const field = entries()[0]!.querySelector('textarea')!;
    field.value = 'new wording';
    button(entries()[0]!, 'Save').click();

    const byUrl = loadAnnotationsByUrl(ORIGIN, undefined);
    expect(byUrl.get(SIBLING)?.map((a) => a.comment)).toEqual(['new wording']);
    expect(byUrl.get(HERE)).toHaveLength(1);
  });
});
