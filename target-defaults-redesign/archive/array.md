# Array with flat discriminators

> `targetDefaults` becomes an array; match fields sit flat next to the config.

Each entry carries `target`, `plugin`, and `projects` as flat sibling fields alongside
the applied config (`cache`, `inputs`, …).

**Shape:** [`nx.array.json`](../nx.array.json)

```jsonc
"targetDefaults": [
  { "target": "test", "plugin": "@nx/vite", "projects": ["tag:test-runner:vite"], "cache": "true", ... },
  { "target": "test", "plugin": "@nx/jest", "projects": ["tag:test-runner:jest"], "cache": "true", ... }
]
```

## Pros

- Keeps the logical name `test` while distinguishing tools.
- Explicit order — precedence/merge order is readable off the file.
- Same target name can appear multiple times.
- `projects` filter is just another sibling field; no structural change.

## Cons

- Array loses the map's uniqueness guarantee and easy key-based override across layers
  (append? replace? match-and-merge by what?).
- `target`/`plugin`/`projects` share a flat namespace with config keys — collision risk,
  and ambiguous which fields match vs. apply.
- Single-tool case only works if the logical targets already have distinct names;
  `plugin` alone can't split one inferred target into three.
- **Major shape break** — `targetDefaults` flips from object to array, invalidating every
  existing example, JSON schema, and AI training datum that assumes a name-keyed map.
- **Taxes the simple case** — even "cache on build" needs an array entry with an explicit
  `target`; the common case pays for the rare one (unless `targetDefaults` also keeps
  accepting the legacy object form as a union).
