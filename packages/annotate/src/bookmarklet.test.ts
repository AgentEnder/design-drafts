import { describe, expect, it } from 'vitest';

import { bookmarkletUrl } from './bookmarklet.js';

/** Stands in for the built bundle: registers the API the way the real one
 * does, on a line of its own so the newline handling is exercised. */
const BUNDLE = [
  '(function () {',
  '  window.DesignDraftsAnnotate = { activate: function () { window.__on = true },',
  '    toggle: function () { window.__toggled = (window.__toggled || 0) + 1 } };',
  '})();',
].join('\n');

/** Decode a bookmarklet URL the way a browser does before running it. */
function decode(url: string): string {
  return decodeURIComponent(url.slice('javascript:'.length));
}

describe('bookmarkletUrl', () => {
  it('is a single-line javascript: URL', () => {
    const url = bookmarkletUrl(BUNDLE);

    expect(url.startsWith('javascript:')).toBe(true);
    expect(url).not.toContain('\n');
  });

  it('carries the bundle itself rather than a reference to one', () => {
    const url = bookmarkletUrl(BUNDLE);

    expect(decode(url)).toContain('window.DesignDraftsAnnotate =');
    expect(url).not.toContain('unpkg');
    expect(decode(url)).not.toContain('createElement');
  });

  it('never reaches for eval, which would forfeit the CSP exemption', () => {
    const code = decode(bookmarkletUrl(BUNDLE));
    const loader = code.split(BUNDLE).join('');

    expect(loader).not.toMatch(/\beval\b/);
    expect(loader).not.toMatch(/new Function/);
    expect(loader).not.toMatch(/atob/);
  });

  it('preserves newlines in the bundle through the encoding', () => {
    // URL parsing strips raw newlines; percent-encoded ones survive.
    expect(bookmarkletUrl(BUNDLE)).toContain('%0A');
    expect(decode(bookmarkletUrl(BUNDLE)).split('\n').length).toBeGreaterThan(4);
  });

  it('survives a bundle containing characters that would break a URL', () => {
    const awkward = 'window.DesignDraftsAnnotate = { s: "100% #1 \\u201cquoted\\u201d" };';

    expect(decode(bookmarkletUrl(awkward))).toContain(awkward);
  });

  it('parses as valid script', () => {
    expect(() => new Function(decode(bookmarkletUrl(BUNDLE)))).not.toThrow();
  });

  it('runs the bundle and activates on a first click', () => {
    const win: Record<string, unknown> = {};
    new Function('window', 'alert', decode(bookmarkletUrl(BUNDLE)))(
      win,
      () => undefined
    );

    expect(win.__on).toBe(true);
    expect(win.__toggled).toBeUndefined();
  });

  it('toggles instead of re-running the bundle on a second click', () => {
    const win: Record<string, unknown> = {};
    const run = () =>
      new Function('window', 'alert', decode(bookmarkletUrl(BUNDLE)))(
        win,
        () => undefined
      );

    run();
    run();

    expect(win.__toggled).toBe(1);
  });

  it('reports a bundle that throws instead of failing silently', () => {
    const messages: string[] = [];
    new Function(
      'window',
      'alert',
      decode(bookmarkletUrl('throw new Error("boom");'))
    )({}, (m: string) => messages.push(m));

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('boom');
  });

  it('reports a bundle that runs but registers nothing', () => {
    const messages: string[] = [];
    new Function('window', 'alert', decode(bookmarkletUrl('var x = 1;')))(
      {},
      (m: string) => messages.push(m)
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('did not register');
  });
});
