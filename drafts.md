# Drafts

A draft is a directory. It holds the HTML you want reviewed and a
`design-drafts.config.json` manifest describing it.

```
my-draft/
  design-drafts.config.json
  pages/
    light-centered.html
    dark-split.html
  references/
```

Nothing is generated at deploy time. The files you push are the files that get
served.

## Axes and pages

A draft covers a slice of design space. Name the dimensions a reviewer should be
able to compare (axes), list the values each one takes (choices), then declare
the combinations you actually built (pages). Every page pins each axis to one
choice and points at one file.

```jsonc
{
  "name": "Marketing homepage",
  "axes": [
    { "name": "theme", "choices": [{ "name": "light" }, { "name": "dark" }] },
    { "name": "layout", "choices": [{ "name": "centered" }, { "name": "split" }] },
  ],
  "pages": [
    {
      "coordinates": { "theme": "light", "layout": "centered" },
      "path": "pages/light-centered.html",
    },
    { "coordinates": { "theme": "dark", "layout": "split" }, "path": "pages/dark-split.html" },
  ],
}
```

Coverage is sparse. Two axes of two choices describe four
combinations, and you build only the ones worth comparing. The toolbar greys out
a choice with no page behind it.

Switching a choice navigates to another file. The toolbar routes, it does not
swap CSS. Each page stands alone, so it can come from anywhere: a hand-written
file, an agent, an export from a design tool.

The manifest's `name` is the draft's identity. It becomes the branch name, the
published directory, and the key annotations are stored under, so a page keeps
its comments from local preview through to deploy.

## Markdown-only folders

A folder with no HTML in it is rendered instead of copied. Each `.md` file
becomes a themed page with GitHub-flavored rendering, highlighted code, heading
anchors, a per-page table of contents, and Pagefind search. `README.md` becomes
`index.html`. Links between markdown files are rewritten to the rendered pages,
and the sources ship next to the output.

The sidebar mirrors your folders, one collapsible group per directory.

Adding a single hand-written `.html` file makes the folder a classic draft
again, and the markdown is left alone.

## References

A draft's intent lives in `references/`: a brief, links, screenshots. It is
optional, and it is what an agent reads before touching the design. See
[`docs/conventions/references-protocol.md`](https://github.com/AgentEnder/design-drafts/blob/main/docs/conventions/references-protocol.md)
in the repo.
