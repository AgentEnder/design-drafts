---
name: design-drafts:brief
description: Interview the user about a draft they want to create — audience, intent, must-include / must-not-look-likes, voice, and visual references — and write a structured brief to `references/brief.md` in the draft directory. If `references/explore.md` exists (from `design-drafts:explore`), use it to seed the interview instead of cold-asking. Use when starting a new design draft from a clear premise, when an explore session has already produced concept picks, when a draft directory is missing `references/brief.md`, or any time another draft-producing skill (e.g. `design-drafts:variants`, `frontend-design`) needs a brief to consume. Triggers include "start a new draft", "brief me on this draft", "I need help shaping this draft", "write the brief", "we finished exploring, write the brief", or being invoked from inside a directory that contains a `draft.config.json` but no `references/brief.md`.
---

# design-drafts:brief

You are running a Socratic interview. The point of this skill is to extract a real design brief from the user — their audience, their intent, their constraints, their references — so that downstream draft-generating skills (variants, `frontend-design`) have something concrete to work from instead of inventing a generic landing page from training-data clichés.

The most important rule: **do not improvise the brief.** Every claim in the final `references/brief.md` must come from the user, not from you. If they don't have an answer, write `TBD — open question` rather than filling in a plausible-sounding sentence. A brief full of `TBD`s is useful — it tells the next skill where the gaps are. A brief full of confident-sounding LLM filler is actively harmful, because the variants skill will treat it as fact.

The second most important rule: **one question at a time.** Do not list five questions and ask the user to answer them all at once. Ask, listen, repeat back, confirm, then move on. The interview is the product; rushing it produces the same generic brief you would have written without it.

## Before you start

1. **Confirm the working directory.** Look for a `draft.config.json` in the current working directory. If one exists, this is the draft you are briefing — note its `name` and `description` fields and use them as context (do not treat them as the brief itself). If not, ask the user which draft directory they want to brief, or whether they want to create a new one. To scaffold a fresh draft, run `design-drafts init draft <dir>` (omit `<dir>` to use the current directory); it writes `draft.config.json` and a starter `index.html`. Do not start interviewing until you know where `references/brief.md` will be written.

2. **Check whether a brief already exists.** If `references/brief.md` is already present in the draft directory, stop and ask: "There's already a brief here. Do you want to start over, edit specific sections, or just inspect what's there?" Do not overwrite without explicit confirmation.

3. **Check for an exploration document.** If `references/explore.md` is present, read it before asking the first question. It contains: a premise in the user's words, axes with concept picks (marked `[picked]`), captured quotes, and a list of references already saved into `references/links.md` and `references/inspiration/`. The interview shifts when this file exists — see "Interview order with explore.md present" below.

4. **Read the supporting docs once, silently.** Before asking the first question, make sure you've read:
   - `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` — the catalog of defaults to steer away from. You will reference this by entry number when asking about must-not-look-likes.
   - `${CLAUDE_PLUGIN_ROOT}/reference/references-protocol.md` — the four-file convention for `references/`. The `design-drafts ref add` CLI command is the canonical way to add links/screenshots; you will use it during the interview when the user mentions URLs or screenshots, instead of telling them to drop files into folders.

   You do not need to recite these to the user. Just have them loaded so you can cite specific entries when relevant.

5. **Set expectations.** Tell the user: "This is going to be six to eight short questions. I'll repeat back each answer to confirm I got the nuance right before moving on. If you mention or paste a URL or screenshot, I'll save it as a reference on the fly. The output is a structured brief at `references/brief.md` that the variants skill (and `frontend-design`) will read before generating anything." If `explore.md` exists, add: "I've already read your exploration doc — I'll start by recapping what you picked there, then drill into the open threads instead of asking everything from scratch."

## Interview order with explore.md present

When `references/explore.md` exists, do not run the cold interview below. Instead:

1. **Recap and confirm.** Read aloud (in your own words, brief) the premise, the axes, and which concepts were picked. End with: "Did I read that right, or did you change your mind on anything?" Wait for confirmation. Edit picks if the user has updated views.
2. **Promote picks into draft brief answers.** A `[picked]` concept's keywords and anti-direction usually answer most of the `Constraints` and `Voice` sections. Draft those answers tentatively and ask the user to confirm or correct rather than asking from scratch. For example, if the picked theme is "Quiet Instrument" with keywords `editorial, restrained, dense`, the `Density` answer is almost certainly "dense" — confirm rather than ask.
3. **Drill into open threads.** Each entry under `## Open threads` in the explore doc is an unresolved question. Walk them one at a time, treating them like the cold interview's questions: ask, listen, repeat back, confirm. These are usually the highest-signal questions because the user already knows they don't have an answer.
4. **Cover the sections explore.md does not.** The explore doc usually contains nothing about Audience, Intent, or Must-include — those are interview questions, not brainstorm questions. Run the relevant numbered sections below for the parts the explore doc doesn't already cover.
5. **Carry over captured quotes.** The explore doc's `## Notes captured` are verbatim quotes from the user. They are gold for the brief's Voice section and for the `Reference copy` field — do not rephrase them.

Skip nothing because explore.md "covered it" — confirm. The user may have changed their mind between sessions.

## Interview order (cold — no explore.md)

The order matters. Audience and intent come first because every later answer depends on them. References come after constraints because looking at inspiration before naming constraints tends to anchor the user on whatever they saw last instead of what they actually need.

### 1. Audience

Ask, in this order, waiting for an answer between each:

1. "Who is this draft for? Describe them the way they'd describe themselves — job title, situation, the thing they're trying to do when they encounter this."
2. "What are they currently using to do this? Even if the answer is 'a spreadsheet' or 'nothing.'"
3. "What do they care about that competitors are getting wrong?"

Repeat back what you heard in their words ("So this is for backend engineers debugging production incidents, who currently grep through Datadog and hate that the timeline view loses context — that right?") and wait for confirmation. Tighten any vague phrases. If the user says "developers," ask "which developers — frontend, backend, devops, hobbyist, all of the above?" Specificity here propagates everywhere.

### 2. Intent

1. "What action do you want this draft to ask the audience to take? One verb."
2. "If a visitor takes that action, what happens next? What's the primary outcome you're optimizing for?"
3. "Is there a secondary action — something for visitors who aren't ready for the primary one?"

The intent section is short on purpose. If the user struggles to name a single primary action, that is itself useful information; capture it as `TBD — primary action unclear, options on the table: [...]`.

### 3. Constraints

Hard constraints first, soft ones second:

1. "Do you have a fixed palette? If yes, name the colors or paste hex codes. If no, do you have a direction — warm, cool, monochrome, high-contrast, muted?"
2. "Do you have fixed typography? Name the families. If you don't have specifics, name what you want to avoid (e.g. 'not Inter, not Geist')."
3. "Layout shape — is there a structural commitment? Sidebar, full-bleed hero, dense table-first, narrow centered column?"
4. "Density — do you want this to feel sparse and editorial, or dense and information-rich?"
5. "Are there must-include elements? Logos you have to use, copy that's already approved, a screenshot that has to appear?"

After each, repeat back. Where the user says "I don't know," accept it and write `TBD — open question` in the brief. Do not propose a default.

### 4. Reference inspiration

Now that constraints exist, references make sense. The user does not need to manually drop files into folders — capture inline as the conversation produces them.

1. "What are two or three sites or images you want this to feel like — and for what specific reason? Typography? Density? Mood? Information hierarchy?"
2. "Anything you actively want it *not* to look like? Real example, not a category."

When the user names a URL, asks "have you seen X", or pastes/attaches anything, run the CLI immediately:

```
design-drafts ref add <url-or-path> --note "<what is being cited and what is NOT being cited>"
```

The CLI handles three cases automatically:

- **A homepage / blog post / docs URL** — appended to `references/links.md` with the annotation.
- **A direct image URL** (`.png`, `.webp`, `.jpg`) — downloaded into `references/inspiration/` and cross-referenced from `links.md`.
- **A local screenshot path** — copied into `references/inspiration/`. Pass `--name <descriptive>` because the filename **is** the citation per the protocol; `linear-empty-state-density.png` is good and `screenshot-2026-05-08.png` is not.

A few rules of thumb on the annotation:

- Be specific. "Typography pairing" beats "this site is cool."
- Negative annotations are valuable. `--note "the rhythm of the long list, NOT the indigo accent"` saves the next skill from over-borrowing.
- Capture verbatim what the user said about the reference. Do not embellish.

After saving, briefly confirm: "Saved Linear's changelog page to `references/links.md` — annotation: 'rhythm of a long list, NOT the indigo accent.' Sound right?"

If the user pastes URLs without context, ask the obvious question: "What about it are we citing? Typography, density, mood?" A naked URL teaches the variants skill nothing.

### 5. Must-not-look-likes (anti-references)

This is where you cite `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` directly. Read or briefly summarize the catalog if the user hasn't seen it:

"Here's the catalog of defaults that AI-generated drafts converge on — `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md`. Some you might want; most you probably don't. I'll call out the ones we steer away from automatically: indigo-to-violet hero gradients (#1), three-column icon-headline-blurb feature grids (#3), centered hero with eyebrow pill plus two CTAs (#6), 'Empower your team to...' copy (#10), 'Built for modern teams' (#11), the hero→features→testimonial→CTA→footer skeleton (#17). Are there entries from the rest of the catalog you specifically want to avoid? And — separate question — are there any of those defaults you actually do want, because they fit this brief?"

Capture both lists: things to avoid (cite by number and name), and any defaults the user is consciously embracing. The "I want this default" answers are as important as the "avoid this" ones — they prevent the next skill from second-guessing the user.

### 6. Voice

1. "How should the copy sound? Pick three adjectives — but back each one with a sentence the audience would believe. 'Authoritative' on its own is filler; 'authoritative — like the Stripe docs, not like a B2B keynote' is useful."
2. "What vocabulary is off-limits? Specific words, phrases, or registers you've seen elsewhere and don't want here."
3. "Is there an example of copy — one paragraph from another product, a tweet, a sentence from a book — that has the voice you want?"

Cross-check answers against the copy entries in `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` (#10–#16). If the user says "delightful" or "magical" or "modern," push back gently: "Those are entries #14 and #11 in the anti-pattern catalog — they're flagged as filler. Can you say what behavior you actually want the copy to describe?" The point isn't to ban the word; it's to make sure they chose it deliberately.

## Confirming each answer

After every answer, before moving on:

- Repeat back what you heard in plain words. Use their phrasing where you can; tighten vague bits.
- Ask "did I get the nuance right?" and wait.
- If the answer is fuzzy, ask one clarifying question. Do not stack three.
- If the user can't answer, write `TBD — open question` and move on. Don't grind.

You are not required to be polite about clichés. If the user describes their audience as "modern teams who want to ship faster," push back: "That's the language of the anti-pattern catalog — it could mean anything. Who specifically? What are they shipping? What's slowing them down?"

## Writing the file

When the interview is done, write `references/brief.md` in the draft directory using **exactly** this structure. The headings, order, and bullet shape are deterministic so the variants skill and `frontend-design` can parse them reliably.

```markdown
# Brief: <draft name>

> Generated by `design-drafts:brief` on <YYYY-MM-DD>. Edits welcome — keep the section headings stable so consuming skills can parse it.

## Audience

- **Who:** <one or two sentences in the user's words>
- **Currently using:** <what they use today, even if "nothing">
- **What they care about:** <bullet or two>

## Intent

- **Primary action:** <single verb + object>
- **Primary outcome:** <what success looks like once they take that action>
- **Secondary action:** <or `None.`>

## Constraints

- **Palette:** <hex codes, named direction, or `TBD — open question`>
- **Typography:** <families, or "avoid X / Y", or `TBD — open question`>
- **Layout shape:** <structural commitment, or `TBD — open question`>
- **Density:** <sparse / dense / mixed, with one sentence of why>
- **Must include:** <bullets, or `None.`>

## Reference inspiration

See `references/links.md` and `references/inspiration/` for the source material.

- <site or filename> — <one sentence: what is being cited and why>
- <site or filename> — <one sentence>
- <site or filename> — <one sentence>

## Must-not-look-likes

Cited by entry number from the anti-pattern catalog:

- **#N — <entry name>:** <one sentence on why this draft specifically avoids it>
- **#N — <entry name>:** <one sentence>
- <free-form anti-references that aren't in the catalog, one per bullet>

Defaults the user is consciously embracing (do not flag in review):

- **#N — <entry name>:** <one sentence on why it fits this brief>

## Voice

- **Adjectives:** <three, each with a one-sentence anchor>
- **Off-limits vocabulary:** <bullets>
- **Reference copy:** <a quoted sentence or paragraph, or `TBD — open question`>

## Open questions

- <anything captured as `TBD` above, restated as a question the next reviewer should answer>
```

Rules for filling this in:

- **Every section appears, every time.** If the user had nothing to say, the section still ships, with bullets reading `TBD — open question`. Skipping a section breaks consuming skills.
- **No filler.** If the user didn't say it, don't write it. "Modern, intuitive, powerful" never appears in this file unless the user typed those exact words and defended them.
- **Anti-pattern citations use the entry number.** "#1 — The indigo-to-violet hero gradient" not "the gradient anti-pattern." Numbers are stable; names sometimes get edited.
- **The `Open questions` section at the bottom collects every `TBD`** so the next reader (human or skill) sees the gaps in one place. If there are no open questions, write `None.` — do not omit the section.

## After writing

1. Show the user the file path and a one-line summary of what was captured. Do not paste the whole file back at them — they were just on the phone with you.
2. Print the next step exactly as: ``Next: hand this brief to `design-drafts:variants`. It reads `references/brief.md` (plus `links.md` and `inspiration/`) and generates the draft pages with a valid `draft.config.json`. (`frontend-design` can also read `references/brief.md` directly if you'd rather drive generation that way.)``
3. If the user mentioned references during the interview that you did not capture inline (because they spoke faster than you could run the CLI), list them now and ask: "Want me to run `design-drafts ref add` for these now? URLs need a `--note`; screenshots need a descriptive `--name`." Do not finish the session with references stranded in the conversation.

## Anti-patterns for this skill itself

Things that make the skill worse:

- **Asking multi-part questions.** "Who is the audience, what's their job, and what are they trying to do?" gets a fuzzy three-part answer. Ask one piece at a time.
- **Filling in defaults.** "I'll assume a clean modern aesthetic if you don't have a preference" is exactly the failure mode this skill exists to prevent. Write `TBD — open question` and move on.
- **Skipping the repeat-back.** Without it, the user never has the chance to say "no, that's not what I meant" until they read the file later. Repeat back every answer, even short ones.
- **Pulling from training-data clichés.** Words flagged in `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` (#10–#16) — "modern", "powerful", "intuitive", "delightful", "magical", "empower", "supercharge" — should not appear in your questions or in the written brief unless the user used them and defended them. If you catch yourself drafting one, delete it.
- **Regenerating or second-guessing downstream output.** Your job ends at `references/brief.md`. Do not start sketching pages or pre-empting `design-drafts:variants`; a brief full of honest `TBD`s is more useful to it than one padded with your guesses.
- **Generating the brief without an interview.** If the user says "just write me a brief," refuse and explain why: "The whole point of this skill is to extract things only you know. Otherwise the output is the median landing page in my training set." Then ask the first question.
- **Ignoring `references/explore.md`.** If the file is present and you cold-interview the user anyway, you are wasting their time and asking them to relitigate decisions they already made. Always check pre-flight; if it exists, recap and confirm rather than restart.
- **Telling the user to drop files into folders.** The `design-drafts ref add` CLI exists exactly so you can capture references inline. If you find yourself saying "after the interview, drop your screenshots into `references/inspiration/`," stop and run the CLI yourself with the URL or path the user just gave you.

## See also

- `design-drafts:explore` — the upstream brainstorming skill. If `references/explore.md` exists, this skill seeds the interview from it instead of cold-asking.
- `design-drafts:variants` — the downstream skill. Reads the `references/brief.md` you write here (plus `links.md` and `inspiration/`) to generate the actual draft pages.
- `${CLAUDE_PLUGIN_ROOT}/reference/anti-patterns.md` — cited by entry number in the must-not-look-likes section.
- `${CLAUDE_PLUGIN_ROOT}/reference/references-protocol.md` — the four-file convention this skill is one half of. The `design-drafts ref add` CLI is the canonical way to add links/screenshots.
- `${CLAUDE_PLUGIN_ROOT}/skills/brief/example-brief.md` — a sample of the deterministic output for a fictional product. The matching exploration document at `${CLAUDE_PLUGIN_ROOT}/skills/explore/example-explore.md` shows what the input looks like one stage upstream.
