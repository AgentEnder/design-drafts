# Array with a query key

> Same array, but match criteria are grouped into a structured `target` object.

Match criteria (`targetName`, `plugin`, `projects`) live inside a `target` object,
separated from the config applied as siblings. `target` also accepts a bare **string** for
the common name-only case, so the query object is only needed when you actually filter.

**Shape:** [`nx.array-with-query-key.json`](../nx.array-with-query-key.json)

```jsonc
"targetDefaults": [
  // name-only short form
  { "target": "build", "cache": "true", ... },
  // full query form, only when filtering
  { "target": { "targetName": "test", "plugin": "@nx/vite", "projects": ["tag:test-runner:vite"] }, "cache": "true", ... },
  { "target": { "targetName": "test", "plugin": "@nx/jest", "projects": ["tag:test-runner:jest"] }, "cache": "true", ... }
]
```

## Merge order

`targetDefaults` is an **ordered array**. For a target, every entry whose `target` matches
— by name, and (when present) `plugin`/`projects` — is applied **in document order, last
entry winning**. Precedence is what you read top-to-bottom: broad defaults first, specific
overrides last.

```jsonc
{ "target": "test", "cache": true },                                           // 1. baseline for every test target
{ "target": { "targetName": "test", "plugin": "@nx/vite" }, "inputs": ["..."] }, // 2. refine vite tests on top
{ "target": { "targetName": "test", "plugin": "@nx/jest" }, "cache": false }     // 3. jest tests opt out of caching
```

The same rule scales across config layers: concatenate the arrays least-specific first
(preset → `nx.json` → project), then apply the combined list in order. "Last wins" resolves
both within-file ordering _and_ cross-layer override with one mechanism — no key-based
deep-merge rules to reason about. The array as a whole still sits in the **defaults tier**,
under the inferred target config and explicit project configuration.

Layer order, low → high: **array defaults (concatenated, in listed order) → inferred target
→ project config**.

## Pros

- Clean separation of "what do I match" (inside `target`) from "what do I apply"
  (siblings) — no namespace collision with config keys.
- **Deterministic merge** — one "in order, last wins" rule covers both within-file
  precedence and cross-layer concatenation, with no ambiguity about how two layers combine.
- Match object is extensible: `projects` slots in beside `targetName`/`plugin`, and
  future criteria (executor, projectType) add the same way. Cleanest home for the filter.
- Keeps logical names.
- `target: string` short form keeps simple entries terse — the query object is
  pay-for-what-you-use, appearing only when you filter.

## Cons

- More verbose and nested; introduces a "query object" concept to learn.
- `target.targetName` reads awkwardly (the word "target" appears at two levels).
- **Still a top-level array** — `targetDefaults` is an array even for the short form, so
  the shape is unfamiliar to existing tooling and AI training data regardless of whether
  you filter. Not additive: the legacy object map isn't valid here.
- Simple-case tax is the array wrapper itself — `[{ "target": "build", … }]` vs today's
  `{ "build": { … } }` — lighter than the full query object, but still a break from the map.
