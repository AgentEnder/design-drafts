# Publishing

## Getting the CLI

The CLI is not on npm yet. Build it from the monorepo and put the binary on your
path:

```sh
pnpm install
pnpm --filter @design-drafts/cli build
# the binary is packages/cli/bin.js
```

## The host repo

Previews are served from GitHub Pages, so they need a repo to live in. `init`
creates one and scaffolds a starter draft in the current directory:

```sh
design-drafts init
```

Both halves work on their own: `design-drafts init host` sets up the repo and is
idempotent, `design-drafts init draft` writes only the draft.

## Pushing

From the draft directory:

```sh
design-drafts                  # push "." (push is the default command)
design-drafts ./path/to/draft  # or point at a directory
```

The CLI copies the directory to a temporary directory, renders any markdown,
embeds the deploy workflow, and force-pushes the result to `drafts/<name>`. The
Deploy Preview workflow publishes it from there.

The push prints the URL, flagged as not live yet: it exists once the workflow
finishes. A pull request is not required for deployment.

## Where the files land

On this host the Pages site is laid out like this:

| Path                       | What                               |
| -------------------------- | ---------------------------------- |
| `/design-drafts/`          | These docs                         |
| `/design-drafts/d/`        | The index listing every live draft |
| `/design-drafts/d/<name>/` | One deployed draft                 |

A host declares that `d/` in the `design-drafts.config.json` at the root of its
default branch:

```json
{ "draftsPath": "d" }
```

The CLI fetches it from the remote when it prints a preview URL and when it
bakes the base path into a draft's search links. Without a declaration, drafts
publish to the site root.

## Building without publishing

To get the site content without git or GitHub:

```sh
design-drafts build --out ../my-draft-site
```

Same rendering, same search index, same generated listing as a push. `--out` is
required and must sit outside the draft, because HTML left inside it would make
the next preview or push read the draft as hand-written HTML.

Search result links assume the site is served from `/`. Pass `--base` to say
otherwise, or `--repo` to derive the path a push to that host would have used.

## Configuration

Each value resolves from a CLI flag first, then a `DESIGN_DRAFTS_*` env var,
then `~/design-drafts.config.json`. Missing required values are prompted for.

| Setting       | Flag             | Notes                                                             |
| ------------- | ---------------- | ----------------------------------------------------------------- |
| Host repo     | `--repo`         | `owner/name`. Saved globally after a successful push.             |
| Site name     | `--site-name`    | Defaults to the manifest's `name`, slugified. The flag overrides. |
| Branch prefix | `--prefix`       | Default `drafts/`. Pass `""` to push without one. Saved globally. |
| Template ref  | `--template-ref` | Ref of the design-drafts repo used to scaffold the host workflow. |

Every push records source metadata in its commit message: the source SHA and
repo, the author, the manifest's `prompt`, and a hash of the manifest. A preview
traces back to what produced it.

### One filename, three jobs

The file `design-drafts.config.json` means something different depending on
where it sits.

| Where                        | What it is                                  |
| ---------------------------- | ------------------------------------------- |
| A draft directory            | The draft's manifest: name, axes, pages     |
| `~`                          | Your CLI defaults: host repo, branch prefix |
| A host repo's default branch | What that host publishes: `draftsPath`      |

The CLI fetches the last one over HTTPS, so publishing to a host needs no clone
of it.
