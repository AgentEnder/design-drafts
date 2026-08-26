// The bookmarklet loader — the annotate overlay on somebody else's website.
//
// A draft preview gets the overlay from a <script> tag it ships itself. A
// site you don't control can't be edited, so the reviewer brings the script
// with them: a bookmark whose URL is `javascript:` followed by this loader
// with the whole bundle inlined into it.
//
// Inlining rather than fetching from a CDN is the point, not an optimisation.
// A bookmarklet that injects `<script src="https://unpkg.com/...">` is asking
// the page's Content-Security-Policy for permission, and any site with a real
// policy says no — measured on github.com, which rejects it with a
// `script-src-elem` violation. The bookmarklet's OWN code is exempt from CSP
// (browsers carve out user-initiated scripts on purpose), so code that runs
// as part of the `javascript:` URL runs where an injected tag would not.
//
// That exemption is why this file must not reach for `eval`, `new Function`,
// or a `<script>` element to unpack a compressed payload: each of those is a
// fresh CSP check against the page's policy, which throws away the exemption
// we just paid 38 KB to get. The bundle goes in as plain source.
//
// Constraints on the loader itself:
//
//   * Clicking twice must not inject twice. The second click finds the API
//     already on `window` and toggles instead.
//   * It is inlined into a URL, so it is ES5 with no dependencies: no arrow
//     functions, no optional chaining, no template literals.

/** The loader, with `__BUNDLE__` standing in for the bundle source. */
const LOADER = `
(function () {
  // Already injected: this is the reviewer's second click.
  var existing = window.DesignDraftsAnnotate;
  if (existing) { existing.toggle(); return; }

  try {
    __BUNDLE__
  } catch (error) {
    alert('design-drafts: the annotator failed to start.\\n\\n' + error);
    return;
  }

  var api = window.DesignDraftsAnnotate;
  if (api) { api.activate(); return; }
  alert('design-drafts: the annotator ran but did not register itself.');
})();
void 0;
`;

/**
 * Wrap `bundleSource` into a `javascript:` URL ready to be a bookmark.
 *
 * The payload is percent-encoded whole. That is not paranoia: URL parsing
 * *strips* tab and newline characters, and the minified bundle still carries
 * several hundred newlines, so anything less would silently splice statements
 * together. Non-ASCII characters in the bundle's UI strings need it too.
 */
export function bookmarkletUrl(bundleSource: string): string {
  const code = LOADER.split('__BUNDLE__').join(bundleSource).trim();
  return 'javascript:' + encodeURIComponent(code);
}
