# References Protocol

A draft without references converges on the [anti-pattern catalog](../anti-patterns.md). The model has no opinion of its own, so it falls back to the median landing page in its training set: indigo-violet hero, three-column feature grid, "Empower your team to..." headline. The way out is to give it specific things to look at and specific things to avoid.

`references/` is where that material lives. It is a first-class part of a draft, with the same status as the HTML files and the manifest. Skills are expected to read it; humans are expected to fill it.

## Directory shape

```
my-draft/
  draft.config.json
  index.html
  references/
    brief.md
    links.md
    inspiration/
      airbnb-typography.png
      stripe-pricing-density.webp
      hand-drawn-logo.jpg
```

Three files matter. Anything else in `references/` is allowed but unused by the shipped skills.

### `references/brief.md`

The structured output of the [brief skill (#11)](https://github.com/AgentEnder/design-drafts/issues/11). Treat this as the source of truth for the draft's intent: audience, tone, hard constraints, must-not-look-likes.

The brief skill owns the exact shape of this file. Other skills consume it as-is — read it, do not regenerate it. If you are writing a draft by hand and skipping the brief skill, the minimum viable brief is four sections: who it is for, what it is doing, what it must not look like, and one or two sentences of voice.

The variants skill and `frontend-design` both expect this file to exist. If it is missing, they should ask for it before generating anything.

### `references/inspiration/*.{png,webp,jpg}`

Screenshots, photos, hand sketches. The visual end of "look at this, not that."

Filename is the citation. `airbnb-typography.png` tells the reading skill: this image is being cited for its typography, not its color or layout. Be specific — `inspiration-1.png` is useless. Good filenames look like:

- `linear-empty-state-density.png`
- `print-magazine-grid-1980s.jpg`
- `client-rough-sketch-hero.webp`

If a single screenshot is being cited for two things (palette _and_ density, say), include both in the filename or split it into `links.md` with annotations. The skill reading the directory should be able to tell, from filename alone, what role the image plays.

`png`, `webp`, and `jpg` only. Do not commit PSDs, Figma exports with embedded metadata, or 12 MB screenshots straight off a Retina display — compress them. The draft repo is not a Dropbox.

### `references/links.md`

The annotated URL list. Format:

```markdown
- https://airbnb.com — typography pairing (serif display + grotesk body)
- https://linear.app/changelog — density and rhythm of a long list, NOT the color palette
- https://www.are.na/example/board — overall mood; ignore the specific images
```

One URL per bullet, an em-dash, then a sentence saying _what is being cited_. Negative annotations ("NOT the color palette") are as useful as positive ones — they prevent the skill from over-borrowing.

A `links.md` of twenty unannotated URLs is worse than three annotated ones. The annotation is the signal; the URL is the address.

If a link is the source of a screenshot already in `inspiration/`, you can skip it here or include it with a pointer (`see inspiration/linear-density.png`). Don't duplicate the annotation in two places.

## Who reads what

- **[Brief skill (#11)](https://github.com/AgentEnder/design-drafts/issues/11)** — writes `brief.md`, may suggest entries for `links.md` and `inspiration/` based on the interview.
- **Variants skill** — reads all three files before generating. The brief sets intent; `links.md` and `inspiration/` set visual constraints.
- **`frontend-design`** — reads `inspiration/` and `links.md` for visual grounding, reads `brief.md` for what to avoid.

If you add a skill that produces drafts, it should read this directory. If it does not, it will produce the [anti-patterns](../anti-patterns.md) by default.

## Publishing

`references/` is **not published** with the draft.

The directory is for the author and the skills running locally, not for the people viewing the deployed preview. A reader landing on the gh-pages URL should see the draft itself; the references are scaffolding.

The CLI exclusion that enforces this is deferred to a sibling issue and is not part of this batch — today, `references/` will be pushed if you do not exclude it manually. Once the CLI lands the exclusion, it becomes automatic. Until then, if you care about reference material not appearing in the deployed preview, gitignore it on the branch you push or strip it before running the CLI.

The `prompt` field in `draft.config.json` may point at `references/brief.md` (see the [manifest schema](../../packages/conventions/src/draft-manifest.ts)). That reference is by relative path; it does not require the file to be published, but it does mean a reader trying to follow the link from a deployed manifest will get a 404 until the brief is either inlined or the publishing decision changes. Inline the brief into the manifest's `prompt` field if you want it visible in the deployed draft.

## When to skip references

You can skip `references/` when the draft is a throwaway — a five-minute test of a prompt, a sanity check that the toolchain still works. For anything you would show another person, the absence of references is the reason it will look generic.
