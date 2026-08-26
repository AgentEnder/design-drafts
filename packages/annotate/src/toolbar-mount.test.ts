// @vitest-environment jsdom
//
// Where the overlay puts itself when the bundle lands on a page — the question
// the bookmarklet asks, since it injects that same bundle onto whatever page
// the reviewer is standing on.
//
// One import per file, deliberately: auto-mount runs once at module evaluation,
// so the DOM has to be arranged before the import and cannot be rearranged
// afterwards. The no-toolbar case lives in page-isolation.test.ts.
import { describe, expect, it } from 'vitest';

describe('a page that already carries a design-drafts toolbar', () => {
  it('joins the toolbar instead of floating its own toggle', async () => {
    document.body.innerHTML = '<dd-toolbar></dd-toolbar>';

    await import('./index.js');

    const mounted = document.querySelector('dd-annotations');
    expect(mounted?.parentElement?.tagName.toLowerCase()).toBe('dd-toolbar');
  });

  it('renders an inline trigger for the toolbar slot, not a floating one', () => {
    const mounted = document.querySelector('dd-annotations');
    // The trigger lives in the element's own shadow root, which is what
    // surfaces through <dd-toolbar>'s plugin <slot>.
    expect(mounted?.shadowRoot?.querySelector('.trigger')).not.toBeNull();
    // And the floating standalone toggle is absent.
    const host = document.getElementById('design-drafts-annotate-root');
    expect(host?.shadowRoot?.querySelector('.toggle')).toBeNull();
  });

  // Detection is tag matching, so it does not wait on the toolbar package
  // being loaded and the element being upgraded — an un-upgraded <dd-toolbar>
  // in the markup is enough.
  it('does not require the toolbar element to be defined', () => {
    expect(customElements.get('dd-toolbar')).toBeUndefined();
  });
});
