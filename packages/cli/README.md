# @design-drafts/cli

Push static site previews as branches to a **design-drafts** repo, and have
them deployed to GitHub Pages automatically.

A *host* repo collects many *draft* previews. You scaffold a host once, then
push any built static directory as a draft branch; a GitHub Actions workflow
publishes each branch under its own path on GitHub Pages and an index site
links them all together.

## Install

```sh
# one-off
npx @design-drafts/cli --help

# or install globally for the `design-drafts` binary
npm i -g @design-drafts/cli
```

## Commands

### `design-drafts push [path]`

Push a built static directory (default `.`) as a draft preview branch. This is
the default command, so `design-drafts ./dist` works too.

```sh
design-drafts push ./dist --repo my-org/design-previews --site-name homepage-v2
```

- `--repo <org/repo>` — the host repo to push to (remembered after the first run).
- `--site-name <name>` — branch/preview name (prompted if omitted).
- `--prefix <prefix>` — branch prefix for previews (default `drafts/`; pass `""` to push without one).

### `design-drafts init host`

Scaffold a new GitHub repo configured to host draft previews (deploy workflow,
index site, Pages setup).

```sh
design-drafts init host --repo my-org/design-previews
```

- `--private` — create the GitHub repo as private.
- `--yes` — skip the confirmation prompt before GitHub setup.

### `design-drafts init draft [directory]`

Scaffold a new draft directory locally.

```sh
design-drafts init draft ./my-draft
```

## Configuration

Shared options (`--repo`, `--site-name`, `--template-ref`) can be supplied via
flags, the `DESIGN_DRAFTS_*` environment variables, or a JSON config file. The
`--repo` value is persisted to a per-user config after the first successful
push, so subsequent runs don't need it.

## License

MIT
