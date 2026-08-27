// @vitest-environment jsdom
//
// `<dd-annotations inline>` — a page with chrome of its own saying it will
// host the trigger, without being a toolbar. The markdown-site header does
// this: it already carries a search button, a page menu and a theme toggle,
// and a floating toggle lands on top of them.
//
// The toolbar is the other host, and the two differ in where the panel opens:
// a toolbar is a bar at the foot of the viewport, so its panel opens above it;
// a header is at the top, so its panel opens where a floating one would.
//
// One import per file: auto-mount runs once at module evaluation.
import { beforeAll, describe, expect, it } from 'vitest';

const HOST_ID = 'design-drafts-annotate-root';

function shadow(): ShadowRoot {
  return document.getElementById(HOST_ID)!.shadowRoot!;
}

beforeAll(async () => {
  document.body.innerHTML = `
    <header class="site-header">
      <a class="site-title" href="index.html">A draft</a>
      <div class="header-actions">
        <dd-annotations inline></dd-annotations>
        <button type="button" class="theme-toggle">Theme</button>
      </div>
    </header>`;
  await import('./index.js');
});

describe('a page that hosts the trigger itself', () => {
  it('leaves the element where the page put it', () => {
    // Auto-mount adds one only when the page has not.
    expect(document.querySelectorAll('dd-annotations')).toHaveLength(1);
    expect(
      document.querySelector('dd-annotations')?.parentElement?.className
    ).toBe('header-actions');
  });

  it('renders the inline trigger, not the floating toggle', () => {
    const mounted = document.querySelector('dd-annotations');
    expect(mounted?.shadowRoot?.querySelector('.trigger')).not.toBeNull();
    expect(shadow().querySelector('.toggle')).toBeNull();
  });

  // Without this the page cannot make it sit with its own controls: the
  // button is in a shadow root, so a stylesheet cannot otherwise reach it.
  it('exposes the trigger for the page to style', () => {
    const trigger = document
      .querySelector('dd-annotations')
      ?.shadowRoot?.querySelector('.trigger');
    expect(trigger?.getAttribute('part')).toBe('trigger');
  });

  it('opens the panel where a floating one would, not above a bar', () => {
    (
      document.querySelector('dd-annotations') as unknown as {
        activate(): void;
      }
    ).activate();

    const panel = shadow().querySelector('.panel');
    expect(panel).not.toBeNull();
    // `above-trigger` is the toolbar's anchoring, and there is no bar here.
    expect(panel?.classList.contains('above-trigger')).toBe(false);
  });
});
