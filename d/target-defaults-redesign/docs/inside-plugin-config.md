# Inside plugin config

> Defaults for inferred targets live in the plugin registration; `targetDefaults` is
> untouched.

Each plugin entry carries the defaults for the targets it creates, so no separate
matching is needed — it is scoped to the plugin instance. The existing `targetDefaults`
field does not change at all; it keeps handling everything else.

**Shape:** [`nx.inside-plugin-config.json`](../nx.inside-plugin-config.json)

```jsonc
"plugins": [
  { "plugin": "@nx/jest/plugin", "targets": { "test": { "projects": ["tag:test-runner:jest"], ... } } },
  { "plugin": "@nx/vite/plugin", "test": { "projects": ["tag:test-runner:vite"], ... } }
]
```

> The mock is intentionally inconsistent (jest nests under `targets`, vite inlines
> `test`) — the shape isn't settled, which is itself a signal.

## Merge order

Unlike the array (explicit order) or the keyed map (name-vs-executor specificity), a plugin
block carries **nothing structurally implicit** about where its defaults land in the merge
chain — the semantics have to be chosen. Two models:

1. **Apply on the target config as it comes from the plugin (the instinctive read).** Treat
   the plugin-scoped defaults as part of what the plugin emits, baked into the inferred
   target. But that makes a _default_ override the plugin's own computed values and sit
   above the unscoped `targetDefaults` — it inverts the "defaults are the weakest layer"
   principle and is liable to surprise.
2. **Apply after the unscoped `targetDefaults`, still inside the defaults tier
   (recommended).** Plugin-scoped defaults are _more specific_ than unscoped ones (they
   name a plugin), so they override unscoped defaults — but they stay below the inferred
   target config and project config. This mirrors how `@nx/jest:test` was always more
   specific than the bare `test` key, and keeps a "default" weaker than what the plugin
   actually computes.

Recommended layer order, low → high: **unscoped `targetDefaults` → plugin-scoped defaults →
inferred target → project config**.

That this has to be _spelled out_ — rather than falling out of the structure — is itself a
mark against the design: the merge rule is a decision, not a consequence.

## Pros

- Co-locates defaults with the plugin that produces the targets — single, obvious owner,
  no disambiguation step.
- Multiple registrations of the same plugin each carry their own defaults cleanly.
- Two-tools-one-name falls out because each plugin block is already separate.
- **Fully additive** — `targetDefaults` is unchanged, so existing configs, tooling, and AI
  training data keep working untouched; this only adds defaults for inferred targets.

## Cons

- **Biggest limitation: no filtering for non-inferred targets.** Plugin/project filtering
  only applies to targets a plugin infers. Executor-based or hand-written `project.json`
  targets aren't owned by a plugin, so they fall back to the unchanged `targetDefaults` —
  which still can't filter by plugin or project.
- Defaults live in two places — `targetDefaults` (manual + cross-cutting) and per-plugin
  config (inferred) — so there's no single place to read all of a target's defaults.
- Cross-cutting defaults (e.g. "every `build` depends on `^build`") can't be expressed via
  the plugin config; they still go in `targetDefaults`.
- Project filter fits awkwardly: `targets.test` is a single object, so only one
  `projects` filter per (plugin, target); a second project group forces `test` back into
  an array.
- New mental model — target config nested in a `plugins` entry isn't represented in
  existing docs or AI training data, so expect some retraining despite the familiar
  `plugins` array.
- Unsettled schema suggests ergonomics aren't nailed down.

## Target Definition

- Custom plugin?
