# Executor-keyed

> Pre-Nx-18 baseline, from before plugins were widely adopted.

Defaults are a map keyed by `<executor>:<target>`. Vite and jest separate naturally
because they are different executors.

**Shape:** [`nx.executors.json`](../nx.executors.json)

```jsonc
"targetDefaults": {
  "@nx/vitest:test": { ... },
  "@nx/jest:test": { ... }
}
```

## Pros

- No new schema — already exists and is well understood.
- **Most familiar shape** — the status-quo map; matches existing docs, examples, and AI
  training data, so zero muscle-memory or retraining cost.
- **No cost to the simple case** — it _is_ the simple case; users who don't need filtering
  write exactly what they write today.
- Executor is a unique key, so vite-vs-jest disambiguation is free.
- Works for classic executor-based targets in `project.json`.

## Cons

- Breaks for inferred targets that run a command directly — no executor to key on.
- Keys on an implementation detail, not the logical name users invoke (`nx test`).
- Can't express the single-tool case: jest unit/integration/e2e all share `@nx/jest:jest`.
- Polyglot "build" needs one entry per executor; no way to say "all build targets."
- No project filter — the map is global.
