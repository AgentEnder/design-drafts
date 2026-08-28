# design-drafts

design-drafts publishes a directory of HTML files as a shareable preview, and gives
reviewers a toolbar to switch between the design choices you drafted.

A draft is a plain directory: some HTML files and a `design-drafts.config.json`
manifest. One command pushes it. A GitHub Action deploys it to its own URL on
GitHub Pages. There is no build step and no template expansion, so what sits on
disk is what gets served.

The published preview carries two scripts. The toolbar flips between themes,
layouts, or any other dimension you named. The annotate overlay lets a reviewer
pin comments to elements on the page and export them as markdown.

## The path from nothing to a URL

```sh
design-drafts init        # scaffold the host repo and a starter draft
# ...write your pages...
design-drafts             # push the current directory as a preview
```

The push prints the URL the deploy will serve. Drafts on this host land under
`/design-drafts/d/<draft-name>/`, and `/design-drafts/d/` lists them all.

## Where to go next

- [Drafts](drafts.md). What a draft is made of: the manifest, axes and pages,
  and markdown-only folders.
- [Publishing](publishing.md). What `push` does, where the files land, and how
  to build a draft without publishing it.
- [Reviewing](reviewing.md). The toolbar, the annotation overlay, and getting
  feedback back out.

The source lives at
[AgentEnder/design-drafts](https://github.com/AgentEnder/design-drafts).
