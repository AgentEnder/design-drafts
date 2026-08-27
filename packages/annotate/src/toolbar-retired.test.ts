// @vitest-environment jsdom
//
// What happens when the toolbar the overlay joined gives up.
//
// A toolbar with no manifest to switch between takes itself off the page and
// re-homes what was slotted into it (see the toolbar package). The overlay
// arrives integrated, wearing the inline trigger meant for a bar that now does
// not exist, and has to go back to floating its own.
//
// One import per file: auto-mount runs once at module evaluation.
import { beforeAll, describe, expect, it } from 'vitest';

const HOST_ID = 'design-drafts-annotate-root';

function mounted(): HTMLElement {
  return document.querySelector('dd-annotations')!;
}

function floatingToggle(): Element | null | undefined {
  return document.getElementById(HOST_ID)?.shadowRoot?.querySelector('.toggle');
}

beforeAll(async () => {
  document.body.innerHTML = '<dd-toolbar></dd-toolbar>';
  await import('./index.js');
});

describe('the toolbar it joined retiring', () => {
  it('starts out integrated, wearing the toolbar trigger', () => {
    expect(mounted().shadowRoot?.querySelector('.trigger')).not.toBeNull();
    expect(floatingToggle()).toBeNull();
  });

  it('floats its own toggle once it is standing on the body', () => {
    const toolbar = document.querySelector('dd-toolbar')!;
    // What `retire()` does: re-home, then leave.
    document.body.insertBefore(mounted(), toolbar);
    toolbar.remove();

    expect(floatingToggle()).not.toBeNull();
  });

  // The trigger lives in this element's own shadow root, which survives the
  // move. Left there it renders in the page's flow beside the floating one.
  it('takes the toolbar trigger off with it', () => {
    expect(mounted().shadowRoot?.querySelector('.trigger')).toBeNull();
  });
});
