# ADR 0001: Annotation Picker Strategy for `@design-drafts/annotate`

- Status: Accepted
- Date: 2026-05-07
- Deciders: @AgentEnder
- Related issues: #17 (annotate package), #19 (this spike)

## Context

`@design-drafts/annotate` is a planned package that lets reviewers click on
parts of a deployed draft to attach comments, then exports those comments as
markdown for an AI agent to act on. The annotate runtime is injected into
arbitrary previews served from the design-drafts gh-pages deployment.

Drafts are framework-agnostic. A single deployment may host plain HTML,
Vue, Svelte, or React previews side-by-side. The annotate package therefore
runs in a context where it cannot assume any particular framework runtime is
present, and certainly cannot assume a *specific* framework. Any picker that
only works in React would only work for a subset of drafts and would be a
non-starter for the rest.

This ADR records the decision about how the picker — the "what did the user
click on?" layer — is built. The companion question of how comments are
stored and surfaced is out of scope here; this ADR only covers element
selection and stable identification.

Two existing libraries in the same neighbourhood were evaluated:
[`react-scan`][react-scan] and [`react-grab`][react-grab] (and its core
package, [`grab`][grab-pkg]). A from-scratch DOM picker built on
`document.elementsFromPoint` plus heuristics was evaluated as the third
option.

## Options considered

### Option A — Wrap or fork `react-scan`

`react-scan` is an MIT-licensed React performance dev tool by Aiden Bai. It
auto-detects unnecessary re-renders and surfaces them via an overlay
toolbar. It has no documented public element-picker API; its overlay is
focused on "this component re-rendered" rather than "the user pointed at
this thing." Its public exports (`scan`, `useScan`, `setOptions`,
`getOptions`, `onRender`) are tuned to that use case, and the project is
marketed as React-only.

- **License:** MIT (suitable).
- **Framework coupling:** React-only — relies on React render
  instrumentation. No story for vanilla HTML, Vue, or Svelte drafts.
- **API stability:** Public API is performance-oriented. We would be
  building on internal/undocumented surfaces to repurpose it as a click
  picker.
- **Bundle size:** Not verified in this spike (bundlephobia fetch was
  blocked); known to be non-trivial because it ships a toolbar and overlay
  renderer.
- **Fit:** Poor. Wrong shape (perf overlay, not annotation picker) and
  wrong scope (React-only).

### Option B — Wrap or fork `react-grab` / `grab`

`react-grab` is the closest existing tool to what we want. It is also by
Aiden Bai, MIT-licensed, and ships as two npm packages: `grab` (core,
0.1.33 at time of writing) and `react-grab` (React layer, 0.1.33). The UX
matches our intuition: hover any element, press a shortcut, and copy
context (filename, component name, HTML) to the clipboard for a coding
agent. There is also a documented plugin API (`registerPlugin` /
`unregisterPlugin` with an `onElementSelect` lifecycle hook).

The technical reality is less framework-agnostic than the marketing
suggests. The React-aware metadata (component name, source file) is
produced by [`bippy`][bippy], a runtime-only library by the same author
that traverses the React fiber tree by impersonating React DevTools.
`bippy`'s own README warns "this project uses react internals, which can
change at any time. it is not recommended to depend on internals unless you
really, *really* have to." The `react-grab` package lists
`react >= 17.0.0` as an optional peer dependency, so on a non-React draft
the picker degrades to a DOM-only mode without component-name or
source-file enrichment — i.e. roughly what we'd build ourselves anyway.

Versions are pre-1.0 (0.1.x), the public surface is small, and
documentation does not commit to API stability. Nothing about the project
suggests it is being driven by a framework-agnostic preview-tooling use
case; the React path is clearly the priority.

- **License:** MIT (suitable).
- **Framework coupling:** Effective coupling is high. The valuable
  metadata layer is React-only via `bippy` and React internals. On a Vue,
  Svelte, or plain-HTML draft we get only the DOM-level subset.
- **API stability:** Pre-1.0 (0.1.33). Internals-based on React. No
  semver promises.
- **Extensibility:** Plugin API exists, but a Svelte or Vue-aware
  enrichment plugin would be ours to write — and would not have a fiber
  tree to lean on.
- **Bundle size:** Not verified in this spike. Reads as moderate;
  ships a CLI, MCP integration, plugin system, and overlay UI we don't
  need.
- **Fit:** Mixed. Right *idea*, wrong *centre of gravity*. Adopting it
  means inheriting a React-internals dependency for value we cannot
  realise on most of our drafts.

### Option C — From-scratch framework-agnostic DOM picker

Build the picker directly on the DOM. Hover and click are tracked with
`mousemove` / `click` listeners on the document; the candidate element
list at the cursor comes from `document.elementsFromPoint(x, y)` (Baseline
since January 2020, supported in all modern browsers). A small set of
heuristics walks that list to choose the *meaningful block* rather than
the literal topmost node — for example:

- prefer the nearest ancestor that is a `section`, `article`, `aside`,
  `nav`, `header`, `footer`, `main`, `figure`, `form`, `button`, `a`,
  `img`, `video`, or has `role` / `aria-label`;
- prefer the nearest ancestor whose subtree contains exactly one heading
  (`h1`–`h6`) — that's almost always the "card" or "section" the
  reviewer means;
- skip wrappers that are pure layout (`div` with no semantics, no role,
  no `data-*`), unless nothing better is available;
- always allow Shift+hover to escape one level outward, and Alt+hover
  to drill in, so the reviewer has manual override.

Element identity is captured as a *bundle* of selectors so we have
fallbacks when one breaks:

1. an explicit annotation id if the author opted in
   (`data-draft-id="hero"`);
2. a structural CSS path with `nth-of-type` (brittle but precise);
3. the nearest heading text or `aria-label` (resilient to refactors);
4. a hash of the `outerHTML` after stripping volatile attributes
   (good for detecting "this element moved but is still recognisably
   the same thing").

Resolution at read time tries (1) → (2) → (3) → (4) in order and reports
which one matched, so the reviewer/agent can see when an annotation has
become stale.

- **License:** Ours, no third-party constraints.
- **Framework coupling:** None — operates purely on the rendered DOM.
  Works identically on plain HTML, Vue, Svelte, and React drafts.
- **API stability:** We own it; we can keep the public surface small
  (`mount({ onPick })`, `unmount()`, `serialize(target)`,
  `resolve(serialized)`).
- **Bundle size:** Small. No runtime dependencies; the heuristics and
  selector logic are a few hundred lines.
- **Risk:** We have to design the heuristics ourselves, and we have to
  earn the "right element on hover" UX through iteration. There is no
  React fiber tree to fall back on for component names — but on
  non-React drafts neither is there in any other option.

## Decision

**Adopt Option C: build a framework-agnostic DOM picker from scratch.**

The deciding factor is that drafts are framework-agnostic by definition.
Any solution whose value proposition is concentrated in a React-internals
shortcut (Option B) only helps on a fraction of drafts, and on the
remainder collapses to a DOM-only fallback we'd be writing anyway.
Option A is the wrong shape entirely. Option C lets the picker behave
consistently across every kind of draft and keeps us out of the "React
internals changed in 19.x" maintenance trap.

We explicitly accept that we are *not* getting component-name /
source-file enrichment for free. For now the markdown export will use
heading text, `aria-label`, and structural context as the human-readable
"what was clicked." A future enhancement may add an opt-in build-time
plugin (Vite / webpack / Rollup) that injects `data-draft-source` on
JSX/Vue/Svelte elements, giving us source-file context without resorting
to runtime fiber-tree scraping. That plugin is out of scope for the
initial annotate package.

## Consequences

### Positive

- One picker implementation works on every draft type the platform
  supports today and is likely to support tomorrow.
- No dependency on React-internal APIs that can break across React
  minor releases.
- Small bundle, no transitive license risk, fully under our control.
- The selector-bundle approach degrades gracefully: an annotation made
  against an early draft can still resolve against a redesigned draft
  via heading-text or `data-draft-id` even after the CSS path breaks.

### Negative / costs we accept

- We own the heuristics. Picking the "right" block on hover is a UX
  problem that will need iteration and probably real-user feedback.
- No free component-name or source-file metadata; the markdown export
  reads as "Section 'Pricing' → Button 'Get started'" rather than
  "PricingSection.tsx:42 → CTAButton". This is acceptable for the
  v0 use case (review feedback, not patch generation).
- We are not benefiting from `react-grab`'s plugin community, such as
  it is.

### Follow-up work

- **Issue #17 (annotate package) scope adjustment:** The annotate
  package now explicitly owns the picker. Its initial milestone should
  carve out three internal modules: (1) hover/click overlay and
  semantic-block heuristics, (2) selector-bundle serialiser/resolver,
  (3) markdown exporter. None of these depend on a third-party picker.
- **New follow-up issue (to be filed):** Build-time plugin
  (`@design-drafts/source-tag`) that decorates JSX / Vue / Svelte
  elements with `data-draft-source="file:line:col"` so the picker can
  optionally enrich annotations with source locations. This is the
  framework-agnostic answer to what `bippy` does for React only, and is
  cleanly separable from the annotate package itself.

## Notes on uncertainty

This spike was time-boxed and relied on public READMEs and package
manifests; it did not run benchmarks or audit the libraries' source. In
particular:

- Exact bundle sizes for `react-scan` and `grab` were not measured —
  bundlephobia and npm-side fetches were not available in this session.
  The decision does not hinge on bundle size, but if Option B were ever
  reconsidered this should be measured properly.
- `react-grab`'s plugin lifecycle (`onElementSelect`) is documented but
  was not exercised; the description above is from its README. Anything
  built on it should verify the plugin API behaviour in practice.
- `react-grab` and `grab` are both at 0.1.33; their public API may
  change without notice. This reinforces, rather than undermines, the
  decision to not build on them.

[react-scan]: https://github.com/aidenybai/react-scan
[react-grab]: https://github.com/aidenybai/react-grab
[grab-pkg]: https://www.npmjs.com/package/grab
[bippy]: https://github.com/aidenybai/bippy
