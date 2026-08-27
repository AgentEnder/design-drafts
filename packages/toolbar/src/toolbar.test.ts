// @vitest-environment jsdom
//
// What the element does when there is no manifest to switch between.
//
// It used to return early and stay in the DOM: an unpopulated custom element,
// which is `display: inline` in normal flow at the end of <body>. Nothing to
// see on its own, but the annotate overlay mounts its trigger inside any
// <dd-toolbar> it finds, so the trigger inherited that position and rendered
// as a line of text at the bottom of the page instead of floating.
//
// One import for the file: auto-mount runs at module evaluation.
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(async () => {
  // No manifest anywhere above the page: every discovery fetch misses.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }))
  );
  document.body.innerHTML =
    '<dd-toolbar><span id="plugin">a slotted trigger</span></dd-toolbar>';
  await import('./toolbar.js');
});

describe('a toolbar with no manifest to read', () => {
  it('takes itself off the page', async () => {
    await vi.waitFor(() => {
      expect(document.querySelector('dd-toolbar')).toBeNull();
    });
  });

  // Whatever was slotted into it is not the toolbar's to delete. Annotate in
  // particular re-reads its surroundings when it is moved, and standing on the
  // body is what tells it to float its own toggle.
  it('re-homes what was slotted into it rather than taking it along', async () => {
    await vi.waitFor(() => {
      expect(document.getElementById('plugin')?.parentElement).toBe(document.body);
    });
  });
});
