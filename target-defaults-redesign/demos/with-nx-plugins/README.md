# Demo: nx workspace with plugins

Two projects, two test runners, one logical target name:

| Project                                      | Runner | Inferred by       | Tag                |
| -------------------------------------------- | ------ | ----------------- | ------------------ |
| [`checkout`](packages/checkout/package.json) | vitest | `@nx/vite/plugin` | `test-runner:vite` |
| [`billing`](packages/billing/package.json)   | jest   | `@nx/jest/plugin` | `test-runner:jest` |

Both plugins are registered in [`nx.json`](nx.json) with their target name set to `test`,
so each project gets an inferred **`test`** target. `nx run-many -t test` runs both.

## The problem this surfaces

The two `test` targets need _different_ defaults — vite tests want vite-flavored
inputs/outputs (config globs, coverage dirs), jest tests want jest-flavored ones. But they
share the one logical name `test`, so a name-keyed `targetDefaults.test` can only hold one
set. This is the **JS, multiple tools for one logical target** use case.

## How each design copes here (all four work)

- **[Renamed targets](../../docs/current.md)** — set `testTargetName: "test-vite"` /
  `targetName: "test-jest"` in `nx.json`, then key `targetDefaults` by those names. Works,
  but `nx test` no longer runs anything — you type `nx test-vite` / `nx test-jest`.
- **[Array + query key](../../docs/array-with-query-key.md)** — keep `test`; add one entry
  filtered by `{ plugin: "@nx/vite" }` and one by `{ plugin: "@nx/jest" }` (or by the
  `test-runner:*` tags). Both targets stay `test`; the discriminator is the plugin/tag.
- **[Nested array](../../docs/nested-array.md)** ⭐ — keep `test`; under the `test` key list
  a catch-all baseline plus entries filtered by `{ plugin: "@nx/vite" }` / `{ plugin:
"@nx/jest" }`, applied in order. Like array + query key, but the outer map stays keyed by
  name, so the shape is still familiar.
- **[Inside plugin config](../../docs/inside-plugin-config.md)** — put the vite-flavored
  defaults inside the `@nx/vite/plugin` block and the jest-flavored ones inside
  `@nx/jest/plugin`. Each plugin owns its targets, so there is no collision to resolve.

**Takeaway:** when plugins are present, all four designs can express the distinction. The
choice comes down to ergonomics, familiarity, and the simple-case cost — not capability.
Contrast with the [bare pnpm demo](../bare-pnpm/README.md), where plugin-based designs break.

## Running it

```sh
pnpm install
pnpm nx run-many -t test
```
