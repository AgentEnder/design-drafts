# Demos

Two scaffolded workspaces that put the [candidate designs](../docs/index.md) under stress.
Both contain the same pair of projects — a vitest-tested `checkout` and a jest-tested
`billing` — so the only variable is whether nx plugins are present.

| Demo                                           | nx plugins? | `test` target comes from | What it reveals                                         |
| ---------------------------------------------- | ----------- | ------------------------ | ------------------------------------------------------- |
| [`with-nx-plugins`](with-nx-plugins/README.md) | yes         | plugin inference         | All four designs work; the difference is ergonomic.     |
| [`bare-pnpm`](bare-pnpm/README.md)             | no          | `package.json` scripts   | Plugin-based designs break or fall back to manual tags. |

The pair is the point: a design that looks fine in `with-nx-plugins` may have no footing in
`bare-pnpm`. See each demo's README for the design-by-design breakdown.

> These are illustrative scaffolds — dependencies are listed but not installed. Run
> `pnpm install` inside a demo before `pnpm -r test` (or `pnpm nx run-many -t test`).
