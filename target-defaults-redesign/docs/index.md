# Target Defaults Redesign

## The Problem

`targetDefaults` lets you set shared configuration (cache, inputs, outputs, options,
dependsOn) once instead of repeating it in every `project.json`. Historically it is a
**map** keyed by something unique — an executor (`"@nx/vitest:test"`) or a bare target
name (`"test"`). Both keys break down in the plugin (Crystal) era:

- **Name keys collide.** Two plugins each infer a `test` target (vite _and_ jest); one
  `"test"` key can't carry different defaults for each.
- **Executor keys stop matching.** Inferred targets often run a command directly, so
  there is no `@nx/vite:test` key — and even when there is, the executor is an
  implementation detail, not the logical name users type (`nx test`).
- **No project scoping.** A keyed map applies repo-wide; defaults can't vary by project.

Every design answers the same two questions:

1. **What is the lookup key?** A map keyed by name (uniqueness + easy layer merging) or
   an array (explicit order, duplicates allowed)?
2. **Where does the disambiguator live?** In the key, in flat sibling fields, in a
   dedicated match/filter object, or inside the plugin registration?

### The project filter

Several designs add a `projects` filter to scope a default to a subset of the workspace.
It is a string array using the same conventions as the `--projects` flag on Nx commands:

- **name patterns** — `"*-vite"`, `"my-app"`
- **tags** — `"tag:test-runner:vite"`
- **path globs** — `"./packages/*"`

## Use Cases

- **Polyglot** — multiple technologies for one logical unit of work (dotnet build vs
  vite). Always has plugins, needed for graph deps.
- **JS, multiple tools for one logical target** — vitest + jest for test, webpack + vite
  for build.
- **Single tool, different logical targets** — jest for unit, integration, and e2e.

## Evaluation Axes

- **Keeps the logical name?** Can users still run `nx test` vs. a renamed `nx test-jest`?
- **Disambiguates by tool?** Two tools, one logical name — each gets its own defaults.
- **Disambiguates one tool across logical targets?** unit/integration/e2e from jest.
- **Works for non-plugin targets?** Executor-based or hand-written `project.json` targets.
- **Filter by project?** Scope a default to a subset of projects, not just repo-wide.
- **Familiarity / muscle memory.** How far from today's `{ name: {...} }` map? Affects
  existing docs/examples, JSON schemas, and AI/LLM training data.
- **Cost to the simple case.** Do users who don't need tool/project filtering keep writing
  what they write today, or pay new boilerplate? (Mitigated when the change is _additive_ —
  the old shape stays valid as a union.)
- **Layer merge story.** How predictably do preset → `nx.json` → project layers combine?

## Approaches

Four designs are under active consideration — **nested array** is the current front-runner
(others explored along the way are kept in [`archive/`](../archive/)):

| Approach                                        | Mock                                                              | Notes                        |
| ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| [Renamed targets](current.md)                   | [`nx.current.json`](../nx.current.json)                           | Today's workaround           |
| [Array + query key](array-with-query-key.md)    | [`nx.array-with-query-key.json`](../nx.array-with-query-key.json) | Match in `target` object     |
| [Nested array](nested-array.md) ⭐              | [`nx.nested-array.json`](../nx.nested-array.json)                 | Map of name → filtered array |
| [Inside plugin config](inside-plugin-config.md) | [`nx.inside-plugin-config.json`](../nx.inside-plugin-config.json) | Defaults on the plugin       |

## Summary

Array + query key accepts a `target: string` short form for the unfiltered case, so the
matrix reflects each design's _simplest_ viable form, not only the fully-filtered one.

| Approach             | Logical name | By tool | One tool, many targets | By project | Non-plugin targets | Familiarity   | Simple case   | Layer merge    |
| -------------------- | ------------ | ------- | ---------------------- | ---------- | ------------------ | ------------- | ------------- | -------------- |
| Renamed targets      | ❌ (renamed) | ✅      | ✅                     | ❌         | ✅                 | ⚠️ name break | ✅            | ✅ map         |
| Array + query key    | ✅           | ✅      | ⚠️ via name            | ✅         | ✅                 | ❌ array      | ❌ array wrap | ✅ ordered     |
| Nested array ⭐      | ✅           | ✅      | ✅                     | ✅         | ✅                 | ✅ additive   | ✅            | ✅ map+order   |
| Inside plugin config | ✅           | ✅      | ✅                     | ⚠️ one/key | ❌ inferred only   | ⚠️ new home   | ✅            | ⚠️ must define |

The four stake out different bets:

- **Renamed targets** keeps today's shape, tooling, and AI muscle memory — but spends the
  logical name (`nx test` becomes `nx test-jest`) and can't filter by project.
- **Array + query key** is the most expressive — it filters by tool _and_ project through
  one clean match object — but flips `targetDefaults` to a top-level array: the least
  familiar shape, and not additive (the legacy object map stops being valid).
- **Nested array** ⭐ keeps the outer map keyed by target name (so it's additive and the
  simple case is unchanged) while allowing an ordered array of filtered entries under any
  key that needs one. It buys the array's filtering without giving up the map's familiarity
  — at the cost of a two-level shape and position-dependent catch-all semantics.
- **Inside plugin config** is fully additive — it leaves `targetDefaults` untouched and
  adds defaults to the plugin registration — but only reaches plugin-_inferred_ targets, so
  anything hand-written or executor-based is left out.

On **merge order** specifically: renamed targets, array + query key, and nested array all
resolve cleanly — unique keys for the first; an in-order "last wins" rule (extended across
layers by concatenation) for the array; and for nested array, both at once (the outer map
merges by key, the inner array by order). Inside plugin config is the outlier — it has no
structural ordering: where plugin-scoped defaults sit relative to the unscoped
`targetDefaults` and the inferred target config must be _decided_ rather than derived (the
recommendation is to apply them after the unscoped defaults but below inference). Each
design's doc spells out its layer order.

No design wins every axis; the choice is which failure you can live with. The demos below
make those failures concrete.

## Demos

Two scaffolded workspaces under [`demos/`](../demos/) put the designs under stress — each
has one vite-tested and one jest-tested project:

- **[With nx plugins](../demos/with-nx-plugins/README.md)** — plugins infer a `test` target
  for both projects, so the inputs/outputs differ by tool under one logical name. All four
  designs can express _something_ here; the differences are ergonomic.
- **[Bare pnpm](../demos/bare-pnpm/README.md)** — no nx plugins. Targets are plain
  `package.json` scripts, so there is no plugin metadata to match on. **Inside plugin
  config** has nowhere to live, **array + query key** loses its `plugin` discriminator
  (only `targetName`/`projects` survive), and **renamed targets** loses the plugin option it
  relies on to do the renaming.
