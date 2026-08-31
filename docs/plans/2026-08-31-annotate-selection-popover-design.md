# Selection popover, suggestion kinds, and visible-rect painting

- Date: 2026-08-31
- Status: Proposed
- Related: `docs/plans/2026-08-26-text-range-annotations-design.md` (text-range
  anchoring, which this builds on), ADR 0001 (annotation picker strategy)

## Problem

A text selection has exactly one hardwired meaning today: "annotate this on
the next click" (`index.ts`, the range branch of `onClick`). Two costs fell
out of that in real review sessions:

1. **You can't select just to copy.** Selecting a sentence to paste it into
   the note you're about to write — or into a note already open — gets
   consumed as annotation intent. Native selection works (mousedown is never
   default-prevented, deliberately), but the click that ends a copy gesture
   re-annotates.
2. **There's nowhere to hang richer intents.** "Strike this clause" or
   "replace this label with X" are the most common copyedit statements, and
   the only way to say them is a prose comment describing the edit.

Separately, the overlay's painted selection copy shows **phantom lines over
invisible text**. Repro: craigory-dev's blog `Cite` component keeps its
citation popover permanently in the DOM, hidden with `opacity: 0;
visibility: hidden`. Hidden that way (unlike `display: none`), the text keeps
full layout — so `Range.getClientRects()` returns real, sized rects for it.
The browser's native selection painting skips invisible text; `rectsOf` →
`syncHighlight` paints every rect it is handed.

## Decision

### 1. Selection becomes inert; a popover carries intent

The click-converts-selection branch is deleted, not kept alongside. Selecting
text does nothing by itself: `⌘C`, the context menu, and re-selecting all
behave natively, which fixes the copy problem outright.

On `mouseup` with a non-collapsed page selection that yields a valid
`textRange` (same `buildSelector` gate as today), a compact pill appears near
the selection's end rect, in the shadow root, positioned with
`positionFloating`:

```
Comment · Delete · Replace · Insert · Reword
```

- Clicking an action snapshots the Range immediately (the composer's textarea
  focus collapses the live selection — same reason as today) and opens the
  composer pre-tagged with that kind.
- Clicking anywhere else dismisses the popover and saves nothing. **The
  dismissing click is spent on the dismissal** — it does NOT fall through to
  an element pick. (Amended after live testing: falling through meant every
  "click away and retry" spawned an unwanted element composer.) `Escape`
  dismisses too. Element annotation needs a click with no popover on screen.
- The pill appears **immediately on mouseup**, not debounced. (Also amended
  after live testing: a 180ms lag invited a habit-click on the selection —
  which collapses it — before the pill existed, landing as an element pick.)
  The debounce survives only on the `selectionchange` path.
- `⌘C` does **not** dismiss it: copy-then-Replace-then-paste-and-edit is the
  expected flow.
- Keyboard/double-click selections arrive via a debounced `selectionchange`
  listener, so they get the popover too.

Element annotation is untouched: click with no selection = element comment,
exactly as today. The suggestion kinds are text-range-only.

### 2. Annotation kinds

`Annotation` gains a `kind` field; the existing `comment` field holds each
kind's payload — no second field. The storage loader normalizes records
missing the field to `'comment'`, so reviews already in `localStorage` keep
rendering.

| Kind    | Body means                              | Composer?                |
| ------- | --------------------------------------- | ------------------------ |
| comment | the note                                | yes (required, as today) |
| delete  | optional why-note                       | **no — saves instantly** |
| replace | the exact replacement text              | yes (required)           |
| insert  | text to insert *after* the selection    | yes (required)           |
| reword  | guidance ("tighter", "less formal")     | yes (required)           |

Delete saving instantly is the point of having it: "strike this" is a
complete statement, and opening a composer would make it slower than a plain
comment. A note can be added later via the panel's Edit.

### 3. Rendering

The per-line tint rects already painted for a text annotation carry the kind:

- **comment** — current tint, unchanged.
- **delete** — reddish tint plus a horizontal strike bar through the vertical
  center of each line rect: real-looking strikethrough without touching page
  DOM.
- **replace** — amber tint.
- **reword** — violet tint.
- **insert** — no tint over the words (they aren't wrong); a small caret
  wedge just past the selection's final rect.

Pins and panel entries carry a per-kind glyph, so page and drawer read the
same language: `✂ ⟦over-engineered⟧`, `⇄ ⟦Sign up⟧ → "Get started"`.

### 4. Export

Each kind renders as an explicit instruction an agent can apply, on top of
the existing anchor/context machinery:

```md
### 2. ✂ Delete · p · …this is ⟦honestly a bit over-engineered⟧ for…

### 3. ⇄ Replace · button · ⟦Sign up⟧

Replace with: "Get started"
```

Insert exports as `Insert after ⟦…⟧: "…"`; reword as `Reword ⟦…⟧: guidance`.
Staleness rules are unchanged: a quote that can't be re-found goes stale
rather than silently widening — a struck clause that moved is not a struck
paragraph.

### 5. Visible-text-rects painting

`rectsOf(Range)` stops calling `range.getClientRects()` raw. Instead it
walks the text nodes the range touches (reusing `textNodesOf`, so painting
and offset arithmetic share one walk), skips any node whose parent element
fails

```ts
element.checkVisibility({ visibilityProperty: true, opacityProperty: true })
```

and collects per-node sub-range rects, dropping zero-area ones. Where
`checkVisibility` doesn't exist (jsdom; old engines) the filter passes
everything — the overlay degrades to today's behavior rather than painting
nothing.

One mechanism, three fixes:

- No more phantom lines over `visibility: hidden` / `opacity: 0` content
  (the Cite popover case). `display: none` content never had rects.
- No more Chrome double-painting: Chrome's `getClientRects()` on a Range
  returns whole element boxes *in addition to* text rects; taking text-node
  rects only sidesteps that.
- Saved tints, the live pending highlight, and pin placement all flow
  through `rectsOf`, so all three are corrected at once.

**Anchor math is deliberately untouched.** Capture and resolution still walk
hidden text (`textNodesOf` keeps its current skip list), because offsets
must be stable regardless of what happens to be visible when the page is
re-opened. Visibility is a paint-time concern only.

One honest consequence, marked rather than hidden: a selection swept across
a Cite marker captures the invisible citation body inside `exact`. The
export's zone runs already name the element holding each run; a run whose
element is invisible at capture time gains a `(hidden at capture)` tag so an
agent doesn't hunt for prose the reader never saw.

## Out of scope, noted

Saved tints reposition only on scroll/resize. A page that hides a section
*after* annotation (accordion collapse, tab switch) leaves stale tint lines
until the next viewport event. The visible-rects walk fixes what gets
painted at recompute time; *when* to recompute (a `MutationObserver`
scheduling the same rAF pass) is a separate, smaller change and not part of
this design.

## Testing

- Popover: appears on mouse and keyboard selections, dismisses on
  outside-click/Escape without saving, survives `⌘C`, and the outside click
  still element-picks. (jsdom, same harness as `keyboard.test.ts` /
  `page-isolation.test.ts`.)
- Kinds: storage normalization of legacy records; per-kind export snapshots;
  delete's instant save path.
- Rects: a fixture with `visibility: hidden` and `opacity: 0` spans inside a
  selected paragraph paints no rects for them; zero-area rects are dropped;
  absence of `checkVisibility` passes everything through.
