# @design-drafts/annotate

Framework-agnostic annotation overlay for static draft previews. Reviewers
hover a semantic block or highlight a run of text, click to leave a
comment, and the overlay anchors the comment to a stable selector so it
survives minor DOM changes between draft iterations.

## Usage

Drop the bundle into the host page via a CDN reference — no build step, no
file to copy:

```html
<!-- Pin a major version (recommended); unpkg serves the published bundle. -->
<script src="https://unpkg.com/@design-drafts/annotate@0/dist/annotate.js" defer></script>

<!-- jsDelivr works too: -->
<script src="https://cdn.jsdelivr.net/npm/@design-drafts/annotate@0/dist/annotate.js" defer></script>
```

Or self-host by copying the built bundle next to your pages:

```html
<script src="/path/to/annotate.js" defer></script>
```

The script is inert by default. To activate the overlay:

- append `?annotate=1` to the URL, or
- click the **Annotate** toggle in the top-right corner, or
- call `window.DesignDraftsAnnotate.activate()` from another script.

When active, hovering an element outlines the nearest semantic block
(heading, section, button, image, paragraph, …). Clicking pins a comment.
Comments live in the right-side drawer and can be edited or deleted.

### The page is inert while annotating

Clicks are picks, never navigations — a link is a reasonable thing to want
to comment on, and letting it navigate takes the page away along with any
half-written comment. Mouse events are also kept from the page's own
handlers, for sites that route on `mousedown`. They are not *cancelled*
there, because selecting text is `mousedown`'s default action and cancelling
it would break the thing you came to do.

Keystrokes typed into a comment stay in the comment. They wouldn't by
default: keyboard events cross the shadow boundary, and get retargeted on
the way, so a page hotkey handler sees `event.target` as the overlay's host
`<div>` rather than a `<textarea>`. The usual "ignore keys typed in a form
field" guard never fires, and on GitHub a comment containing "t" opens the
file finder mid-sentence. The overlay stops those events at its host, after
the composer has had them and before the page can.

### Commenting on text, not just blocks

Highlight any run of text before you click and the comment anchors to
those exact words instead of their container. There's no mode to switch:
a live selection is a more specific statement of intent than the element
under the cursor, so it wins. Press `Escape` to back out.

Saved text annotations tint the words they cover — one tint per line the
quote wraps across — and their pin sits just past the last word rather
than off the paragraph's corner.

## Export

The panel header's **Export** button renders every annotation on every
page of the draft as one markdown document and copies it to the
clipboard, ready to paste to an agent. Where the clipboard API isn't
available — a preview served over plain http on a LAN address isn't a
secure context — it downloads `feedback.md` instead.

```md
# Draft feedback

- Draft: `turnbuckle-marketing`
- Exported: 2026-08-26T16:39:40.588Z
- Annotations: 1

## https://example.com/

### 1. li · Drag ⟦the⟧ button up onto the bar.

- Section: “If the bookmarks bar is hidden”
- Context: Drag ⟦the⟧ button up onto the bar.
- Anchor: `li:nth-of-type(2)` (rendered DOM)

This wording is ambiguous.
```

The lines are ordered by how well each survives the trip from rendered
page back to source. `Section` and `Context` are verbatim page text, so
they still match the markdown or MDX that produced the page — an agent can
search for them. `Anchor` is a rendered-DOM coordinate: right for
re-resolving in the browser, close to useless for finding a line in the
component that generated it, which is why it comes last and says so.

The quote is delimited with `⟦ ⟧` inside its neighbouring words rather than
shown alone. A one-word selection — “the”, “Free”, “Save” — names no
particular place on a page by itself, and the context needed to place it
was already captured for resolution.

### Anchors

Every annotation names the elements it touches with a CSS selector and an
XPath, and both are checked against the live document when the annotation
is made — a selector that quietly matches three paragraphs tells a reader
less than no selector, because it looks precise.

```md
- Anchor (rendered DOM):
  - CSS: `html > body > main > ul > li:nth-of-type(2)`
  - XPath: `/html/body/main/ul/li[2]`
```

An element annotation names exactly that element. A text selection that
stays inside one element makes the same promise. If neither selector can be
narrowed to a single element, the export says so instead of pretending.

The two are deliberately symmetric — same scope, same steps — because they
were once chosen independently and it went wrong: on a page with a single
`<strong>`, the CSS walk emitted the bare selector `strong`. It matched
exactly one element and passed verification, while being unique only by
accident of that page's contents. Both now start from the nearest usable
`id` (or the document root, if there isn't one) and walk down together,
indexing only the levels that actually have same-tag siblings.

### Selections that cross inline markup

Rendered text and source text diverge wherever inline markup intervened. A
sentence rendered as

> Ships in under a minute, every time. See the docs for more.

came from MDX that reads

```md
Ships in **under a minute**, every time. See [the docs](/docs) for more.
```

Searching the repo for the rendered sentence finds nothing — the asterisks
and the link syntax sit in the middle of it. So when a selection crosses
markup, the export also lists the runs that *didn't*:

```md
- Zones: the selection crosses inline markup, so the whole quote may
  not appear verbatim in source. These runs will, in this order:
  1. `Ships in`
  2. `under a minute`
  3. `, every time. See`
  4. `the docs`
  5. `for more.`
```

Each run lies inside a single element, so whatever produced the page
contains it verbatim, and the sequence pins the region far better than any
one run would. Each run is also reported with the element that actually
holds it, rather than with their common ancestor:

```md
  2. `under a minute`
     - CSS: `#lede > strong`
     - XPath: `//*[@id="lede"]/strong`
```

Selections that sit in one text node — the common case — report a single
anchor and no runs at all.

### Classes and component names

Each anchor also carries that element's own classes, and every annotation
carries a trail of tags and classes up the tree:

```md
- Trail: `main.site > section.pricing > div.card.rounded-md.p-4 > p.card__desc`
  - Classes: card__desc text-sm leading-6
```

Classes are kept verbatim and capped at four per element. Verbatim because
they are searchable in both directions: a utility class appears literally
in the JSX that emitted it, and a hashed CSS-module name such as
`Text-module__Text___XeGJJ` still names the module it came from. Capped
because utility-first CSS puts dozens on a node — and taking the *first*
few is not arbitrary, since authors write the meaningful class first and
utilities after it (`class="card rounded-md p-4"`).

The export also names the components above the annotation, reading whatever
marker the page already exposes:

```md
- Component: App › PricingCard › PricingCopy (vue)
- Source: `src/components/PricingCopy.vue`
```

| framework | development | production |
| --- | --- | --- |
| React | fiber `_debug*` → names, `_debugSource` | minified to `eu`, `tR`, `d` |
| Vue 3 | `__vueParentComponent` → name and `__file` | name often survives |
| Angular | `window.ng.getComponent()` | absent |
| Svelte | `__svelte_meta.loc` → file and line | absent |
| any | — | hyphenated tag names |

No plugin is required for any of these. The recurring rule is that when a
framework says it is a development build — React's `_debug*` fields, Vue's
`__file`, Angular's `window.ng` — its names are taken as written. Otherwise
a name must be at least three characters and start with a capital, which
rejects minified output while still admitting a production build that kept
its names. `Component: eu` would read as fact; silence doesn't.

That last table row is the one that matters most in production, and it
needs no framework internals at all. angular.dev ships no readable names —
`window.ng` is undefined there and `__ngContext__` carries none — but it
renders `adev-progress-bar` and `docs-cookie-popup`. Angular components use
element selectors, so the tag name *is* the component name, and it survives
minification because it lives in a template rather than in a symbol. The
same holds for any custom element, under any framework.

Vue and Svelte hand over a source path outright, which fills in `Source`
when no attribute provided one. None of this is required for an annotation
to work: if a framework moves its internals, annotations lose one optional
line.

### Source locations

If an element carries a source location, the export includes it:

```md
- Source: `src/pages/about.mdx:42:7`
```

Three attributes are read, on the element or its nearest tagged ancestor:

| Attribute | Where it comes from |
| --- | --- |
| `data-draft-source="file:line:col"` | this package's convention — stamp it from your own build, or write it by hand |
| `data-v-inspector` | `vite-plugin-vue-inspector`, present in Vue dev builds |
| `data-inspector-relative-path` + `-line` + `-column` | the React inspector plugins, present in React dev builds |

Nothing is inferred at runtime: ADR 0001 ruled out scraping framework
internals for this, and that still holds. The overlay reads an attribute
the page already chose to publish, or reports no source at all.

## Bookmarklet: annotate a site you don't control

The overlay normally arrives via a `<script>` tag the draft ships. To use
it on a page you can't edit, install the bookmarklet — open

<https://unpkg.com/@design-drafts/annotate@0/dist/bookmarklet.html>

and drag the button to your bookmarks bar. Clicking it on any page loads
the overlay onto that page; clicking it again switches the overlay off.

The bookmark **carries the whole overlay inline** — it fetches nothing
when clicked. That isn't a size optimisation, it's the only version that
works. A bookmarklet that injects `<script src="https://unpkg.com/…">` is
asking the page's `Content-Security-Policy` for permission, and any site
with a real policy refuses: on `github.com` it dies with a
`script-src-elem` violation. A browser exempts the bookmark's *own* code
from CSP, so code carried in the URL runs where an injected tag can't.

The same rule is why the loader never reaches for `eval`, `new Function`
or `atob` to unpack a smaller payload — each of those gets its own CSP
check and throws away the exemption. It's also why the overlay styles its
shadow root with a constructable stylesheet instead of a `<style>`
element: Chrome enforces `style-src` on DOM-inserted `<style>` tags, so
the alternative is an overlay that attaches with no styles at all.

The cost is that the bookmark is frozen at the version you installed.
Re-drag it from the install page to update.

Still off limits: `chrome://` pages and the Chrome Web Store, which don't
run bookmarklets at all. And notes live in that site's `localStorage`, so
they're per-origin and invisible from anywhere else — clearing site data
clears them.

## Persistence

Annotations are stored in `localStorage` under
`dd:annotate:<page-url>` (the URL is normalized to drop the `annotate` and
`toolbar` query params and any hash so the same page renders the same
annotations across toggle states).

### Which draft an annotation belongs to

A page URL is a weaker identity than it looks. On GitHub Pages each draft
gets its own `/<site-name>/` path, but a preview server hands *every* draft
the same `http://localhost:4321/` — so annotations written while reviewing one
draft would surface on the next one you preview.

Pages generated by the design-drafts CLI therefore declare which draft they
are:

```html
<meta name="draftId" content="my-draft" />
```

The id is the draft's site-name (the slug of `name` in
`design-drafts.config.json`, which is also its branch and deploy directory).
Every annotation records the draft it was written against, and the overlay
shows only the ones matching the page doing the reading — both its pins and
the sibling-page panel.

A hand-written draft that declares no `draftId` keeps working: its annotations
are scoped by URL alone, as before. Add the tag to opt into the stronger
scoping.

### Security note

`localStorage` is shared with **every** script that runs on the same
origin, including any script the draft itself ships. A malicious or buggy
draft could read or modify annotations. Don't use this overlay to capture
sensitive feedback. The intended use is informal review of trusted draft
previews.

## Selector strategy

Annotations are anchored to a `SelectorBundle` with four layered fallbacks:

1. `data-annotate-id` on the element (author opt-in).
2. The element's `id`, if it doesn't look framework-generated.
3. Nearest heading text plus an offset within the page.
4. Structural CSS path with `nth-of-type`.

At resolve time the bundle is tried 1 → 4; the panel marks an annotation
as **stale** if every strategy fails (typically because the page was
restructured).

A text annotation adds a second question on top of that one: which
characters inside the resolved element. It pairs the quoted text with its
surrounding context and its character offsets — the W3C Web Annotation
Data Model's `TextQuoteSelector` plus `TextPositionSelector`, for the
reason that spec pairs them. Offsets are exact but break on any edit
earlier in the document; quotes survive edits but are ambiguous when the
copy repeats. Resolution tries the offsets first, then scores every
occurrence of the quote by how much of its captured context still
surrounds it.

When the element resolves but the quote doesn't, the annotation is
**stale** — not quietly widened to cover the whole element. A note about
six words is not a note about the paragraph they were in.

## Coexistence with other overlays

The overlay mounts a Shadow DOM host at `z-index: 2147483100` (one notch
above the toolbar package's reserved band). It uses `pointer-events: none`
on the host and only opts specific UI surfaces (panel, pins, composer)
into pointer events, so it doesn't intercept regular page clicks unless
the picker is actively listening.

## Build

```sh
pnpm exec nx build annotate
```

Outputs a single IIFE bundle to `dist/annotate.js`.
