# Text-range annotations for `@design-drafts/annotate`

- Date: 2026-08-26
- Status: Accepted, implemented
- Related: ADR 0001 (annotation picker strategy), issues #18 / #34 (export)

## Problem

The overlay can only anchor a comment to a whole element. Most review
feedback on a draft is about *copy* — a specific sentence, a specific
label — and pinning the containing `<p>` loses which words were meant.
"Tighten this" on a four-sentence paragraph is a question, not feedback.

## Decision

A text annotation is an element annotation **plus** a quote selector. The
existing four-layer `SelectorBundle` (`annotateId → elementId → cssPath →
headingAnchor`) keeps its job of finding the *container*; a new optional
`textRange` field finds the *words inside it*. No fifth layer, no second
resolver hierarchy — every existing recovery path applies to text
annotations unchanged.

```ts
interface TextRangeSelector {
  exact: string;   // the selected text
  prefix: string;  // up to 48 chars of container text before it
  suffix: string;  // up to 48 chars after it
  start: number;   // char offset within the container's text
  end: number;
}
```

This is the W3C Web Annotation Data Model's `TextQuoteSelector` +
`TextPositionSelector` pair, for the same reason that spec pairs them:
offsets are exact but break on any edit upstream in the document, quotes
survive edits but are ambiguous when the text repeats.

### Capture

On click, if `window.getSelection()` holds a non-collapsed range that is
inside the page (not inside the overlay's own shadow root), the range wins
and the element pick is skipped. Container = the range's
`commonAncestorContainer`, promoted to an Element.

Offsets are computed against the package's **own** text walk
(`textNodesOf`: a `TreeWalker` over text nodes, skipping `script`,
`style`, `noscript` and the overlay host) rather than `textContent` or
`range.toString()`. Capture and resolution share that one walk, so the
arithmetic agrees by construction and an inline `<script>` added between
iterations does not shift every offset on the page.

### Resolution

1. **Position**: slice `[start, end)` out of the container text. If it
   equals `exact`, done. This is the same-DOM fast path.
2. **Quote with context**: collect every occurrence of `exact`, score each
   by how much of `prefix`/`suffix` matches around it, tie-break toward
   the captured offset. Best occurrence wins.
3. **Fail**: `exact` does not appear. The annotation is stale.

Stale means stale: when the container resolves but the quote does not, the
annotation is treated exactly like an unresolvable element annotation —
pin hidden, entry marked stale in the panel. Degrading to a whole-element
pin was considered and rejected: silently widening a comment about six
words into a comment about a paragraph is worse than admitting the anchor
is gone.

### Rendering

Resolved ranges paint a translucent accent tint behind their text —
one absolutely-positioned rect per `Range.getClientRects()` entry, so a
selection wrapping across lines highlights correctly. The numbered pin
anchors to the **last** client rect, sitting just past the end of the
highlighted words rather than off the container's corner.

`Range.getClientRects` does not exist in jsdom, so the painter guards on
it; selector capture and resolution are the parts under test, and those
are pure DOM-walk logic that jsdom runs fine.

## Export (partial #18)

The panel header gains an **Export** button: it renders every annotation
across every page of the current draft as one markdown document and copies
it to the clipboard, falling back to a `feedback.md` download when the
clipboard API is unavailable (a preview served over plain http on a LAN
address is not a secure context).

This is deliberately a subset of issue #18's schema — no screenshots, no
toolbar axis state, no front-matter reviewer field. It exists so the
review loop closes today: highlight, comment, copy, paste to an agent.
#18 remains open for the full report; #34 remains open for PR-review and
ZIP destinations.

## Bookmarklet

A draft preview gets the overlay from a `<script>` tag it ships itself. A
site you don't control can't be edited, so the reviewer brings the script
with them: a bookmark whose URL is a loader that injects the CDN bundle
and activates it.

The bundle is carried **inline in the bookmark URL**, not fetched from a
CDN. That is a correctness requirement, not a size or offline preference.

A bookmarklet that injects `<script src="https://unpkg.com/…">` is asking
the page's `Content-Security-Policy` for permission to run, and any site
with a real policy refuses. Measured on `github.com`: the injected tag is
rejected with a `script-src-elem` violation and never executes. Browsers
deliberately exempt a bookmarklet's *own* code from CSP, so code carried
in the `javascript:` URL runs where an injected tag cannot. Re-measured on
the same page with the bundle inlined: overlay mounts, fully styled, zero
CSP violations.

Two consequences follow from leaning on that exemption:

- **No `eval`, `new Function`, or `atob`.** Each is a fresh CSP check
  against the page's policy, which would throw away the exemption. So the
  bundle goes in as plain source and the URL is 54 kB, rather than being
  base64-packed into something smaller.
- **No `<style>` element.** Chrome enforces `style-src` on DOM-inserted
  `<style>` tags — verified: `style-src 'none'` blocks one and reports
  `style-src-elem`. The overlay's shadow root therefore adopts a
  constructable `CSSStyleSheet`, which is not inline style and is not
  checked. Without this the bookmarklet would attach an unstyled overlay
  on strict-CSP sites, which is worse than not attaching.

The payload is percent-encoded whole, because URL parsing *strips* tab and
newline characters and the minified bundle still carries ~477 newlines.
Verified that the 54 kB URL round-trips through Chrome's URL parser
byte-for-byte and executes.

`src/bookmarklet.ts` owns the loader and `tools/build-bookmarklet.ts`
renders `dist/bookmarklet.html`, a drag-to-install page, reading the
bundle tsdown just wrote — the two are built together or not at all.

The trade accepted: an installed bookmark is frozen at its version, where
the CDN loader would have picked up patches. Re-dragging from the install
page is the update path.

Generated drafts and the markdown-site shell still load the overlay from
`unpkg.com/@design-drafts/annotate@0` via a `<script>` tag, which is
correct — a draft controls its own page and has no hostile CSP. Neither
they nor the published install page reflect changes here until the package
is published.


## Export: locating the annotation back in source

Dogfooding surfaced two failures in the first export format. Both are worth
recording because the first was pure self-harm.

**The context was captured and then discarded.** A `TextRangeSelector`
stores 48 characters of `prefix` and `suffix` — that is how resolution
disambiguates repeated copy — and every bundle stores `headingAnchor`. The
exporter emitted neither, so an annotation on the word "the" exported as
`- Quote: "the"`, naming no place on the page, while the data to place it
sat in the same object. The export now leads with `Section` (the heading)
and `Context` (the quote delimited by `⟦ ⟧` inside its neighbours). Short
quotes get the same treatment in the panel drawer, which had the identical
problem.

**A rendered-DOM selector is the wrong coordinate for a source edit.**
`p:nth-of-type(2)` describes the output of a pipeline. For a page rendered
from MDX or JSX it points at nothing an agent can edit, while looking
authoritative. The lines are now ordered by how well each survives the trip
back to source — `Section`, `Context`, `Source`, then `Anchor`, which is
labelled `(rendered DOM)`.

Verbatim page text is the bridge, because markdown prose mostly survives
rendering unchanged. It is a *search* key rather than a coordinate: weaker
in principle, portable to any page including ones reached by bookmarklet.

### Anchor zones

The bridge breaks wherever inline markup intervened. A selection spanning
`<strong>` has `**` in the middle of its source, so the rendered quote is
not greppable.

The selection is therefore also decomposed into the runs that no markup
interrupts — split at every point where the enclosing element changes, and
stored as offsets into `exact` so nothing is duplicated. Each run lies
inside a single element and so appears verbatim in the source; the ordered
sequence fingerprints the region better than any single run. Reported only
when there is more than one, which keeps the common case quiet.

The split tests the parent *element*, not the text node: a DOM holding two
adjacent text nodes under one parent has no markup between them, and
splitting there would invent a boundary the source doesn't have.

### Source coordinates, when the page offers one

`readSourceRef` walks to the nearest ancestor carrying
`data-draft-source="file:line:col"` (this package's convention),
`data-v-inspector` (Vue dev builds), or the React inspector's
`data-inspector-relative-path` trio, and the export emits it as `Source`.

Nothing is inferred at runtime — ADR 0001 ruled out scraping framework
internals and that still holds. This reads an attribute the page already
published. It also means the build-time tagger ADR 0001 deferred
(`@design-drafts/source-tag`, never filed as an issue) is now drop-in: emit
the attribute and the export picks it up with no further change here.


## Anchors: CSS and XPath, verified

Each element an annotation touches is named twice, as a CSS selector and as
an XPath, in `ElementAnchor`. An element annotation carries one; a text
annotation carries one per markup zone, index-aligned with `textZones`, so
each run is reported with the element that actually holds it rather than
with their common ancestor.

Both selectors are checked against the live document at capture time —
`querySelectorAll(...).length === 1 && matches[0] === element`, and the
`document.evaluate` equivalent. A selector that silently matches three
paragraphs is worse than none, because it looks precise. When neither
strategy can be narrowed, `unique: false` is stored and the export says so
rather than implying a guarantee it doesn't have.

`bundle.anchors[].css` is a *reporting* selector and is separate from
`bundle.cssPath`, which resolution uses. They want different things:
`cssPath` is trimmed to the shortest unique prefix so it survives markup
being inserted above it between draft iterations, while an anchor is read
by a human or an agent and has to be legible on its own.

That distinction is what an earlier version got wrong. The anchor reused
the shortest-prefix walk for CSS and a full positional path for XPath, and
on a page with one `<strong>` emitted:

```
CSS:   strong
XPath: /html/body/main/p[1]/strong[1]
```

Both matched exactly one element, so both passed verification, and the pair
still read as a bug — `strong` is unique only by accident of that page's
contents, and stops being unique the moment a second one is added. Both now
come from one decision: the nearest ancestor carrying a usable `id` (else
the document root), then the same positional steps down, indexing only
levels that have same-tag siblings. A duplicated `id` — invalid HTML that
exists anyway — fails verification and falls through to the positional
walk.


## Classes, trails, and component names

Anchors answer "which element" precisely. They are poor at answering "what
*is* this", which is what a reader needs to find the thing in a component
tree. Three additions cover that, in descending order of how much they can
be trusted.

**Classes**, per anchor, verbatim and capped at four. Verbatim because they
are searchable both ways — a utility class appears literally in the JSX
that emitted it, and a hashed CSS-module name still carries its module
(`Text-module__Text___XeGJJ`). Capped because utility-first CSS puts dozens
on a node. Taking the first few is not arbitrary: authors write the
meaningful class first and utilities after (`class="card rounded-md p-4"`),
so the head of the list is the part with signal.

**Trail**, once per annotation: tag and classes up the tree, outermost
first. Where an anchor is a selector, this is a description —
`div.card > p.card__desc` says more about where to look than any positional
path.

**Component names**, on React pages, read from the fiber every React app
hangs off its DOM nodes. This is the part ADR 0001 declined, and the ADR
carries a dated note explaining why the smaller bet is acceptable where the
larger one wasn't. The short version: nothing depends on it and every
failure path returns null.

Whether the names can be trusted depends on the build, measured rather than
reasoned about:

| build | walking up from a `<p>` |
| --- | --- |
| React 18 dev | `PricingSection › PricingCard › PricingCopy` |
| react.dev, production | `eu`, `tR`, `d`, `r`, `p`, `z`, `$`, `es` |

The first version of this inferred the build from the names themselves —
three characters and an initial capital, on the grounds that minifiers emit
short lowercase-first identifiers. It worked on both rows above, but it is
second-hand: React knows which build it is and can simply be asked.

It records that on the fiber. `_debug*` fields are created only under
`__DEV__`, and the same two pages confirm it — the dev fiber owns
`_debugSource`, `_debugOwner`, `_debugNeedsRemount` and `_debugHookTypes`;
react.dev's owns none. So a development build's names are taken as written,
including ones the heuristic would have thrown out: a component named `Hd`
survives, where before it was silently dropped.

Two details matter. Presence is the test, not truthiness — `_debugSource`
is legitimately null on a fiber the JSX dev transform didn't annotate, and
`_debugOwner` is null at the root. And *any* `_debug*` field counts rather
than one named field, because the set moves between versions: React 19
dropped `_debugSource` while keeping `_debugOwner`, and keying off the
former would misread a whole major version as production.

`__REACT_DEVTOOLS_GLOBAL_HOOK__` looked like the tidier answer, since its
renderers carry a `bundleType` that states dev or prod outright. It is
installed by the DevTools extension rather than by React, and was absent on
both pages including the real React site, so it can't be relied on.

The name heuristic survives as the fallback for the one case React can't
speak to: a production build that kept function names. If a future React
drops every `_debug*` field, that path reads as production and the
heuristic takes over — the safe way to be wrong, since the failure is
silence rather than fiction.

React 18 dev builds also record `_debugSource` on the fiber, used to fill
`sourceRef` when no attribute supplied one. React 19 removed it. An
attribute the page published always outranks a name inferred from
internals.


## The page is inert while annotating

Two failures reported from real use on github.com, with different causes.

**A link click navigated away.** `onClick` cancelled the event, but only
after several early returns — and one of them was `if (this.composing)
return`, so with a composer open every page click passed straight through.
Click a link and the page went with it, taking the half-written comment.
The cancel now happens before every early return: while the overlay is
active, a click is always a pick and never a navigation. A click landing
while the composer is open is swallowed rather than discarding what has been
typed; Escape and Cancel are the ways out.

Listeners also moved from `document` to `window`. Capture runs window →
document → … → target, so a page registering its own capture-phase handler
on `window` — which Turbo does — would otherwise see a click first.
`mousedown` and `mouseup` are now stopped too, for sites that route on them,
but deliberately *not* cancelled: text selection is `mousedown`'s default
action, and cancelling it would break the feature this whole document is
about.

**Typing "t" opened GitHub's file finder.** Keyboard events are `composed`,
so they leave the shadow root and carry on to the page — retargeted, so a
page hotkey handler sees `event.target` as the overlay's host `<div>`, not a
`<textarea>`. The near-universal "ignore keys typed in a form field" guard
therefore never fires.

They are stopped on the host element, in the bubble phase: the composer has
already received the event by then, and the page never will. The overlay's
own key handling sits on window's capture phase, which runs earlier still,
so Escape keeps working. A page whose hotkeys are bound in the *capture*
phase and registered before the overlay could still see them; beating that
would mean stopping the event before it reaches our own textarea, which
cannot be done from a listener registered later.

## Component names beyond React

The same shape extends past React, and what each framework offers was
measured rather than assumed.

| framework | development | production |
| --- | --- | --- |
| React | fiber `_debug*` → names, `_debugSource` | minified: `eu`, `tR`, `d`, `r`, `p`, `z`, `$`, `es` |
| Vue 3 | `__vueParentComponent` → `name`, `__file` | name often survives (string literal) |
| Angular | `window.ng.getComponent()` | absent — verified on angular.dev |
| Svelte | `__svelte_meta.loc` → file and line | absent — verified on svelte.dev |
| any | — | hyphenated tag names |

Vue is the richest: it hands over the `.vue` path directly through `__file`,
which React never does. `__file` doubles as Vue's development signal, the
same role `_debug*` plays for React and `window.ng` for Angular.

Svelte compiles components away, leaving nothing to walk — but a development
build stamps `__svelte_meta` on the elements it created, with file and line.
That is better than a name, and the name falls out of the filename.

The custom-element fallback is the one that matters in production. angular.dev
exposes no readable component names — `window.ng` is undefined and
`__ngContext__` carries none — yet it renders `adev-root`,
`adev-progress-bar` and `docs-cookie-popup`. Angular components use element
selectors, so the tag name is the component name, and it survives
minification because it lives in a template rather than in a symbol. It
needs no framework internals, works under any framework, and is tried last
so a real marker always wins.
