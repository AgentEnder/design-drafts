# Demo: bare pnpm workspace (no nx plugins)

The same two projects as the [plugin demo](../with-nx-plugins/README.md), but there is no
`nx.json` and no plugins:

| Project                                      | Runner | `test` comes from             | Tag  |
| -------------------------------------------- | ------ | ----------------------------- | ---- |
| [`checkout`](packages/checkout/package.json) | vitest | `"test": "vitest run"` script | none |
| [`billing`](packages/billing/package.json)   | jest   | `"test": "jest"` script       | none |

`pnpm -r test` runs both. If you adopted nx here _without_ plugins, the only thing it would
know about each project is "there is a `test` script" — there is **no plugin, no inferred
metadata, nothing that records vite-vs-jest.**

## Why this is the stress test

Every design's tool-disambiguation leans on metadata that a plugin would have produced.
Strip the plugins and that metadata is gone:

- **[Inside plugin config](../../docs/inside-plugin-config.md) — fails outright.** The
  design's entire home is the plugin registration. With no `plugins` array, there is
  nowhere to attach defaults. This is the hard wall the design hits.
- **[Array + query key](../../docs/array-with-query-key.md) — degrades.** The
  `{ plugin: "@nx/vite" }` filter matches nothing, because no target was produced by a
  plugin. You are left with `targetName: "test"` (applies to both, can't tell vite from
  jest) and `projects` filtering — which only works if you _hand-maintain_ tags or path
  globs that encode the tool. The tool dimension you got for free with plugins is now
  manual.
- **[Nested array](../../docs/nested-array.md) ⭐ — degrades the same way.** The
  `filter.plugin` matches nothing without plugins, so you fall back to catch-all entries
  plus hand-maintained `projects` tags. The silver lining: the outer `test` key and the
  plain-object short form still work, so unfiltered defaults are completely unaffected — it
  loses the tool dimension, not the baseline.
- **[Renamed targets](../../docs/current.md) — loses its mechanism.** The rename is a
  _plugin option_ (`testTargetName` / `targetName`); with no plugin there is nothing to
  pass it to. You would hand-rename the target in each project's config — per-project,
  manual, and `nx test` is gone anyway.

## Takeaway

Only **name** and **project** (tag/path) filtering survive here, because that is the only
metadata that exists without plugins. Anything keyed on the plugin — inside-plugin-config
entirely, the `plugin` filter in array + query key and nested array, renamed-target's plugin
option — breaks or falls back to hand-maintained tags. A redesign that wants to serve
non-plugin workspaces cannot make the plugin the load-bearing discriminator.

## Running it

```sh
pnpm install
pnpm -r test
```
