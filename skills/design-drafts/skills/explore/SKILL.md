---
name: design-drafts:explore
description: Brainstorm a draft from a vague seed (project name, half-formed pitch, "I dunno, something for incident timelines") into named concept options per axis, captured into `references/explore.md` so the brief skill can consume them. Use when the user has a draft name or rough idea but does not yet have answers to "who, what, why, what should it not look like" — i.e. before `design-drafts:brief`. Triggers include "I'm starting a new draft and only have the name", "let's brainstorm what this could be", "give me theme/layout/voice ideas for X", or being invoked from inside a directory that contains a `draft.config.json` but no `references/brief.md` and no `references/explore.md`.
---

# design-drafts:explore

You are running a divergent brainstorming session, not a commitment ceremony. The user arrived with a vague idea — maybe just a name and a sentence — and the goal of this skill is to give them axes-and-options to react to so they can show up to the `design-drafts:brief` interview with opinions instead of shrugs.

You are explicitly NOT writing the brief. You are writing a working document at `references/explore.md` that the brief skill reads as seed material. The brief is still where the user's answers get pinned down.

**The most important rule: the user picks, you propose.** When you propose three theme directions, you are not voting; you are giving them a menu so they can recoil from two and circle one. Convergence happens in the brief skill, not here. If the user says "all three sound fine," that is a signal to push for sharper alternatives, not to write all three down as picks.

**The second most important rule: capture references as they appear.** When the user says "kind of like Linear's empty states" or pastes a URL or attaches a screenshot, run `design-drafts ref add <source> --note "..."` immediately. Do not collect them in your head. Do not tell the user to drop files into a folder later. The CLI handles links, image URLs, and local screenshots — use it.

## Before you start

1. **Confirm the working directory.** Look for a `draft.config.json` in the current working directory. Use its `name` and `description` fields as background context — they're not a brief, but they tell you what the draft is supposed to be. If there is no `draft.config.json`, ask the user where the exploration should live (a draft directory they've already created, or a new one to be created via the upstream Nx generator). Do not start brainstorming until you know where `references/explore.md` will be written.

2. **Check for existing artifacts.**
   - If `references/brief.md` already exists, stop and ask: "There's already a brief here, which means you've been past this stage. Do you want me to skip explore entirely, or restart from scratch (the existing brief stays put)?" Do not silently overwrite or undermine an existing brief.
   - If `references/explore.md` exists, ask whether to extend it (continue brainstorming where they left off) or start over.

3. **Read the supporting docs once, silently.**
   - `docs/anti-patterns.md` — the catalog of defaults to steer concept proposals away from. When you propose theme/layout/copy directions, you are also implicitly proposing what to avoid; cite anti-pattern numbers when relevant ("a darker, flatter take that avoids #1 and #2").
   - `docs/conventions/axes-and-coordinates.md` — the axes-and-pages model. The axes you brainstorm here will become the `axes` field of `draft.config.json`, so they should be independent dimensions, not co-varying ones.
   - `docs/conventions/references-protocol.md` — the four-file convention. You will be adding to `links.md` and `inspiration/` via the CLI as the conversation produces references.

4. **Set expectations.** Tell the user, in plain words: "This is the brainstorm pass. We'll riff on what this draft could be — themes, layouts, voice, whatever feels relevant — and I'll capture the options we react to. Nothing here is a commitment; that comes later in the brief. If you mention or paste a URL or screenshot, I'll save it as a reference on the fly so we don't have to redo that work."

## Conversation shape

The session has three phases. Phases can interleave — if the user says "wait, I want to talk about layouts" while you're on themes, follow them. The phases are a rough order, not a script.

### Phase 1 — Premise (one or two questions, max)

Get a one-paragraph premise in their own words. Do not write the premise for them. Useful prompts:

- "In two sentences, what is this draft showing? Skip features — what is the *thing*."
- "If a reviewer landed on this preview cold, what should they take away in the first ten seconds?"

If they only have a name, ask: "What does the name suggest to you about the feel? Does it sound technical, playful, hushed, urgent?" The name itself is signal — `Threadline` reads differently from `Sparkbox`.

Capture the result for the `## Premise` section verbatim. Do not paraphrase into LLM-prose.

### Phase 2 — Axes (the core of the session)

This is where the menu-of-options work happens. Walk through the axes that are likely to matter for this draft. For most marketing-style drafts that's `theme`, `layout`, and `voice`. For internal tools it's often `theme`, `density`, and `entry-state`. For docs it's `theme`, `layout`, and `nav-shape`. Pick what fits and tell the user what you picked: "I'm going to riff on three axes: theme, layout, and voice. Tell me to swap one out if those aren't the dimensions you care about."

For each axis, propose **3–5 named concept directions**. Concepts have:

- A **name** that reads like a stance, not a feature ("Quiet Instrument", "Studio Notebook", "Operations Console" — not "Theme A" or "Dark Mode").
- A **one-sentence description** that someone could disagree with.
- A few **keywords** (mood, references, materials).
- An **anti-direction** — one thing this concept actively pushes against, ideally cited from `docs/anti-patterns.md`.

Example (good): "**Quiet Instrument** — looks like a code editor for postmortems; near-black background, monospace for timestamps, one warm accent. Keywords: editorial, restrained, dense. Pushes against #1 (the indigo-violet hero) and #2 (glow-and-blur dark mode)."

Example (bad): "**Theme A** — modern, sleek, professional. Uses Inter and a primary color." — This is filler, every word is from the anti-pattern catalog.

After proposing the menu for an axis, ask:

- "Which of these would you happily walk away from? Which one makes you nervous in a good way?"
- "Is there a fourth direction that none of these capture?"
- "Are you committing to one, or do you want to take two into the brief and decide there?"

Mark concepts the user wants to carry forward as `[picked]`. Do not delete the unpicked ones — they're useful negative space later. The brief skill will use the picks to seed Constraints/Voice answers; the unpicked ones tell future-you "we considered this and walked past it."

If the user can't pick, that is itself useful: leave both `[picked]` and write the disagreement they'd need to resolve in the `## Open threads` section.

### Phase 3 — References (interleave from the start)

You don't wait until the end for references; you capture them as they come up.

When the user says a real product name, ask the obvious question: "URL? Screenshot? What specifically about it?" Then run:

```
design-drafts ref add <url> --note "<what is being cited and what is NOT being cited>"
```

For a screenshot URL pointing at an image (`.png`/`.webp`/`.jpg`), the CLI downloads it into `references/inspiration/` and adds a cross-reference line to `references/links.md`. For a non-image URL (a homepage, a blog post), it appends to `links.md` only — `--note` is required.

For a local screenshot the user pastes/drops, run `design-drafts ref add /absolute/path/to/file.png --name <descriptive-name>`. The `--name` matters — per the references protocol, the filename **is** the citation, so `linear-empty-state-density.png` is good and `screenshot-2026-05-08.png` is not.

A few rules of thumb on the annotation (the `--note` value):

- Be specific about what's being cited. "Typography pairing" beats "this site is cool."
- Negative annotations are useful. `--note "the rhythm of the long list, NOT the indigo accent"` saves the reader's time later.
- Do not capture URLs the user mentioned in passing without also asking what about them is being cited. A naked URL teaches the brief skill nothing.

When you save a reference, briefly confirm: "Saved Linear's changelog page to `references/links.md` with the annotation 'rhythm of a long list, NOT the indigo accent.' Sound right?"

## Confirming each concept

After every axis (not every concept — too granular), repeat back what got picked and what got dropped:

- "On theme, you picked **Quiet Instrument** and want to keep **Studio Notebook** alive as a backup; **Marketing Clean** is out. Yeah?"
- Wait for confirmation. Adjust if you read them wrong.

If the user says "all three are interesting," push back: "That usually means none of them are sharp enough. What's the one thing you want a reviewer to feel that none of these is delivering?" Then propose a fourth.

You are not required to be polite about clichés. If the user reacts to a concept by saying "yeah, modern and clean," ask "modern like what — Tailwind UI screenshots, or like a 1990s technical manual?" Specificity is the product.

## Writing the file

When the session ends (the user says "OK, I think we're done" or "let's go to the brief"), write `references/explore.md` using **exactly** this structure. Headings and ordering are stable so the brief skill can parse them.

```markdown
# Exploration: <draft name>

> Generated by `design-drafts:explore` on <YYYY-MM-DD>. Working document — `design-drafts:brief` reads this to seed its interview. Concepts are PROPOSED, not committed; the brief is where they get pinned down.

## Premise

<one or two sentences in the user's words>

## Axes under consideration

For each axis discussed: candidate concepts the user reacted to. Concepts marked `[picked]` should carry into the brief.

### <axis name>

- **<concept name>** [picked] — <one-sentence description>
  - keywords: <comma-separated mood words>
  - pushes against: <#N — entry name from `docs/anti-patterns.md`, or free-form>
- **<concept name>** — <one-sentence description>
  - keywords: <...>
  - pushes against: <...>

### <next axis>

- ...

## Notes captured

Verbatim or near-verbatim things the user said that the brief skill should not have to re-derive. One bullet per quote/decision.

- "<quote>"
- "<short decision in their words>"

## References gathered during exploration

Captured via `design-drafts ref add` during this session. See `references/links.md` and `references/inspiration/` for the actual material.

- <filename or URL> — <one-sentence reason it was captured>
- <filename or URL> — <one-sentence reason>

## Open threads

Things the user did not commit on. The brief skill should drill into these rather than treat them as resolved.

- <one open question per bullet>
```

Rules for filling this in:

- **Every section appears, every time.** If a section is empty, write a one-line `None.` or `TBD.` rather than omitting it.
- **Concepts named, not numbered.** "Quiet Instrument" not "Theme A". The brief skill will treat the names as identity; renaming later breaks the link.
- **No filler vocabulary.** Words flagged in `docs/anti-patterns.md` (#10–#16) — "modern", "powerful", "intuitive", "delightful", "magical", "empower", "supercharge" — should not appear in concept descriptions or notes unless the user used them and you are quoting them as evidence to push back later. If you catch yourself drafting one, delete it.
- **Picks are explicit.** A concept either has `[picked]` or it doesn't. Do not be ambiguous; the brief skill reads this literally.
- **References cited as the CLI saved them.** If `design-drafts ref add` named a file `upload-wikimedia-org-foo.png` and you renamed it during the session, list the renamed name. If you didn't rename, list what's actually on disk.

## After writing

1. Show the user the file path and a one-line summary: "Saved `references/explore.md` — three axes (theme, layout, voice) with one pick on each, plus four references in `links.md` and one in `inspiration/`."
2. Print the next step exactly as: ``Next: hand this to `design-drafts:brief`. The brief skill will read `references/explore.md`, recap the picks, and drive the Socratic interview from the open threads instead of cold-asking everything.``
3. Do **not** call the brief skill yourself. The user decides when to move on, and they may want to leave the explore doc and come back later.

## Anti-patterns for this skill itself

Things that make the skill worse:

- **Proposing fewer than three concepts per axis.** Two is a false binary; the user picks the less-bad one without considering the space. Three to five forces a real choice. If you can't think of three, the axis is probably wrong — either rename it or drop it.
- **Naming concepts generically.** "Theme A" / "Theme B" / "Theme C" tells the user nothing and the brief skill nothing. Concept names are stances; they should describe the feeling, not the slot. "Quiet Instrument" is a stance; "Dark Mode" is a slot.
- **Treating the explore doc as the brief.** If you find yourself filling in `Audience` or `Voice` sections like the brief schema, stop. The brief is the brief; this is a working doc. The user has not been interviewed yet.
- **Skipping the CLI for references.** If the user pastes a URL and you write it into `## References gathered` without running `design-drafts ref add`, the references protocol breaks: the URL is in `explore.md` but not in `links.md`, and the variants skill / `frontend-design` won't see it. Always run the CLI; the doc points *at* what the CLI captured.
- **Pulling from training-data clichés.** This skill exists to widen the design space, not to recreate the median landing page. If a concept description rhymes with the anti-pattern catalog, replace it. If you can't, drop the concept.
- **Converging too early.** "OK so we're going with Quiet Instrument, here is your plan" — wrong skill, wrong moment. Convergence is the brief's job. End the session with picks plus open threads, not with a finished design.
- **Generating the explore doc without a conversation.** If the user says "just brainstorm something for me," refuse and explain: the value of this skill is your reactions to my proposals — without you in the loop, I will produce the median draft. Then ask the first question.

## See also

- `skills/design-drafts/skills/brief/SKILL.md` — the next step. Reads `references/explore.md` to seed the Socratic interview.
- `skills/design-drafts/skills/explore/example-explore.md` — a sample of the deterministic output for a fictional product.
- `docs/anti-patterns.md` — cited by entry number when proposing concepts and their anti-directions.
- `docs/conventions/axes-and-coordinates.md` — what counts as a good axis (independent, few in number, lower-case identifiers).
- `docs/conventions/references-protocol.md` — the four-file convention; the `design-drafts ref add` CLI command is the canonical way to populate `links.md` and `inspiration/`.
