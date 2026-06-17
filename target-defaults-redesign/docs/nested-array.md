# Nested array under a name key

> Hybrid: a map keyed by logical name, whose values are arrays of filtered entries.

`targetDefaults` stays a map keyed by logical name. Each value is **either** a plain
config object (today's shape, when no filtering is needed) **or** an array of entries,
each with a dedicated `filter` (`plugin`, `projects`) plus its config. The array is only
required once you have a filter for that target.

**Shape:** [`nx.nested-array.json`](../nx.nested-array.json)

```jsonc
"targetDefaults": {
  // no filter needed → today's plain object, unchanged
  "build": { "cache": true },
  // filtering needed → ordered array, applied top-to-bottom, last match wins
  "test": [
    // no `filter` = catch-all: a baseline for every test target
    { "cache": true, "inputs": ["default", "^default", "**/*.spec.ts"] },
    // filtered entries layer tool-specific config on top of the baseline
    { "filter": { "plugin": "@nx/vite", "projects": ["tag:test-runner:vite"] }, "inputs": ["{projectRoot}/vite.config.ts"] },
    { "filter": { "plugin": "@nx/jest", "projects": ["tag:test-runner:jest"] }, "inputs": ["{projectRoot}/jest.config.ts"] },
    // a later catch-all overrides cache for everything above it
    { "cache": false }
  ]
}
```

## Merge order

Within a target's array, entries apply **in document order, last match winning** — the same
rule as [array + query key](array-with-query-key.md). The `filter` adds catch-all behavior:

- An entry with **no `filter`** is a catch-all — it applies to every variant of that target.
  Use these for the broad baseline.
- An entry **with a `filter`** applies only where its `plugin`/`projects` match.
- Order breaks ties: a later entry (filtered or not) overrides an earlier one, so the
  trailing `{ "cache": false }` above turns caching off for everything set before it.

Because the outer container is still a **map keyed by target name**, cross-layer merging
keeps the map's clean key-based behavior: preset → `nx.json` → project layers merge by the
`test` key, and the arrays under it concatenate least-specific-first, after which the same
last-wins rule resolves the combined list. It gets the map's layer merge _and_ the array's
explicit ordering — the cleanest merge story of the candidates.

Layer order, low → high: **nested-array defaults (per key; concatenated, in listed order) →
inferred target → project config**.

## Pros

- Keeps the logical name as the top-level key — preserves the `nx test` convention and the
  map's clean key-based merge across layers.
- Multiple tool-specific variants under one name, no renaming.
- `filter` is a dedicated namespace (no config-key collision) and extensible; `projects`
  lives there beside `plugin`.
- Different logical targets each get their own key; within a key, filter by tool and/or
  project group.
- **Outer shape stays familiar** — `targetDefaults` is still an object keyed by target
  name, so existing muscle memory and AI training data carry over; only filtered targets
  take the new array form.
- **Additive by design** — the value is `object | array`, so unfiltered defaults are
  byte-identical to today's `{ "build": { … } }`. Existing configs keep working with no
  migration; you opt into the array only where you filter.

## Cons

- Two-level structure (map → array) is the most complex of the candidates to author and
  read.
- The `object | array` polymorphism means readers and tooling must handle two value shapes
  per key, and a target converts from object to array when its first filter is added.
- Catch-all-by-position is implicit: whether an entry is a baseline or an override depends
  on where it sits in the array, which is easy to get wrong in a long list.
