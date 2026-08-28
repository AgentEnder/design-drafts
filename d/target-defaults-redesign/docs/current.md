# Renamed targets (current workaround)

> How this is worked around today with zero new features.

Each plugin emits a uniquely named target (`test-vite`, `test-jest`) via plugin options,
then `targetDefaults` keys by those unique names so they never collide.

**Shape:** [`nx.current.json`](../nx.current.json)

```jsonc
"targetDefaults": {
  "test-vite": { ... },
  "test-jest": { ... }
},
"plugins": [
  { "plugin": "@nx/jest/plugin", "options": { "targetName": "test-jest" } },
  { "plugin": "@nx/vite/plugin", "options": { "targetName": "test-vite" } }
]
```

## Merge order

Nothing new to define. Because every tool/target combination has a **unique key**
(`test-vite`, `test-jest`), there is no within-key collision to resolve — merging follows
the existing, unchanged `targetDefaults` rules: the named default is the base, overridden by
the inferred target config, then by explicit project config. The only specificity rule in
play is the existing one — an executor key (`@nx/jest:jest`) beats a bare name key. "No new
merge semantics" is part of the appeal.

Layer order, low → high: **`targetDefaults` (by name/executor) → inferred target → project
config**.

## Pros

- Works **today** with no new features.
- **No schema change** — same familiar map; existing tooling and AI training data already
  understand it, and the simple case is untouched.
- Clean 1:1 mapping — each tool/logical combo has a unique key, so the map merges
  predictably across layers.

## Cons

- Sacrifices the logical name: no `test` target, so `nx test` / `nx run-many -t test`
  no longer do the obvious thing. The schema is familiar, but the **renamed targets break
  muscle memory** and the AI assumption that the test target is called `test`.
- Configuration is duplicated and coupled — name lives in both the plugin registration
  and the `targetDefaults` key, kept in sync by hand.
- Pushes implementation detail (the tool) into the name users type daily.
- No project filter — keys are global.
