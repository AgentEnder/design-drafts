# Anti-Pattern Catalog

A field guide to the visual, copy, and structural defaults that mark a marketing page as AI-generated. If a draft hits more than two of these, it isn't a design — it's a checklist.

This catalog exists because a generic "make me a landing page" prompt converges, across models, on the same dozen tropes. Steering away from them is most of the work.

## Visual

### 1. The indigo-to-violet hero gradient

Same `from-indigo-500 via-purple-500 to-pink-500` Tailwind incantation, applied as a full-bleed background or as a `bg-clip-text` headline. You have seen it on every Stripe-clone, every "AI for X" landing page on Product Hunt in 2024, and roughly half the seed-stage Vercel deployments.

Why it reads as default: it is the literal first example in Tailwind's gradient docs and the path of least resistance for any model trained on web screenshots from 2022 onward.

Instead: pick one accent color with intent. If you want depth, use a flat color with a single low-contrast secondary tone, or a real photograph/illustration. A monochrome hero with one well-placed accent is more memorable than any gradient.

### 2. Glassmorphism plus neon glow on dark mode

Translucent cards with `backdrop-blur`, 1px white-at-10%-opacity borders, layered over a near-black background with a fuzzy radial gradient "glow" behind the hero. The Linear-imitator look. Vercel's own marketing site has aged out of this; everything copying 2022-Vercel has not.

Why it reads as default: it is what you get when you ask for "modern" or "sleek" without further direction. The blur-and-glow stack is a cheap way to fake depth.

Instead: commit to either flat or dimensional, and pick a real lighting direction. If you want a dark theme, study how print designers handle dark backgrounds — high-contrast typography, generous negative space, no glow.

### 3. Three-column icon-headline-blurb feature grid

`<icon><h3>Lightning Fast</h3><p>Two sentences of generic benefit copy.</p>` repeated three times, sometimes four. Lucide or Heroicons outline icons in a rounded square tile.

Why it reads as default: this is the literal HTML/JSX shape every model emits when asked for a "features section." It is easy to template and impossible to differentiate.

Instead: show the feature working. Embed a real screenshot, a live widget, a code sample, a before/after. If you must list, vary the rhythm — one feature gets a wide treatment, others get smaller cards. Asymmetry is information.

### 4. Lucide outline icons in rounded-square tiles

Specifically: a 48px rounded square with a soft tinted background (`bg-indigo-50` in light mode, `bg-indigo-500/10` in dark) holding a 24px stroke icon. Stripe popularized it; AI generators ship it as the default "this slot needs an icon" answer.

Why it reads as default: it is Tailwind UI's house style and dominates training data.

Instead: skip decorative icons. If an icon is doing real navigational or semantic work, make it custom or use a single tightly-curated set with personality (Phosphor's duotone, Iconoir, hand-drawn). Tinted-tile icons are visual filler.

### 5. Inter (or Geist) for everything

The entire page in Inter 400/500/600, or Geist if the model is feeling adventurous. Headline at `text-5xl font-bold tracking-tight`, body at `text-base text-gray-600`.

Why it reads as default: Inter is the safe choice and ships with Tailwind examples; Geist is Vercel's default. Both signal "I did not think about typography."

Instead: pair a display face with a body face. Use a serif for headlines if the brand permits — it instantly differentiates. At minimum, set real type scale and line-height; do not accept the default `leading-7`.

### 6. Centered hero with eyebrow pill, huge headline, two CTAs

`<div class="text-center">` containing a small rounded-full pill ("New: We launched X →"), an `text-6xl` headline, a max-w-2xl subhead, and two buttons side by side: a solid primary and a ghost secondary. The pill links to a changelog or blog post no one will read.

Why it reads as default: it is the exact shape of the Tailwind UI "Hero" component, the shadcn landing template, and every Next.js starter blog.

Instead: asymmetric heroes. Headline left, product visual right. Or full-bleed product, copy overlaid. Or no hero — start with the actual thing the product does.

### 7. Identical pill CTAs everywhere

Every button is `rounded-full px-6 py-3`. Primary and secondary differ only in fill. The primary CTA in the hero, the CTA in the features section, and the CTA in the footer are visually indistinguishable.

Why it reads as default: it is one component used three times, with no thought to hierarchy.

Instead: differentiate primary and secondary actions by shape and weight, not just color. Reserve the strongest button for the single most important action on the page. If a section has a weaker CTA (like "read the docs"), make it a text link with an arrow, not a pill.

### 8. Logo cloud labeled "Trusted by" with five greyed-out wordmarks

A row of five customer logos, desaturated to gray, often with the heading "Trusted by teams at" or "Powering the world's best companies." Sometimes the logos are made up; sometimes they are real but used without permission.

Why it reads as default: it is the social-proof slot in every landing page template.

Instead: if you have real logos with permission, use them at full color and credit specific teams or use cases. If you do not, use a real testimonial with a name and title and face. If you have neither, omit the section. An empty trust slot is worse than no slot.

### 9. Product screenshot in a fake browser chrome with traffic-light dots

The screenshot is wrapped in a Safari-ish chrome with the red/yellow/green dots, a fake URL bar, and a soft drop shadow. Often tilted 6 degrees with a blurred reflection underneath.

Why it reads as default: it is the Apple keynote idiom, mass-produced through tools like Cleanshot and Tailwind UI.

Instead: show the actual UI without chrome, or build a real interactive demo. If you need framing, design framing that belongs to the product (a custom container, an annotated callout) rather than borrowing macOS.

## Copy

### 10. "Empower your team to..."

Also: "Unlock your team's potential," "Supercharge your workflow," "Built for the way modern teams work."

Why it reads as default: these are the LinkedIn-keynote phrases of B2B SaaS, and they appear in every model's training set as "what a marketing headline sounds like."

Instead: say what the product does in a concrete sentence. "Convert PDFs to spreadsheets in one click" beats "Empower your team with intelligent document workflows." Specificity always wins.

### 11. "Built for modern teams"

Variants: "Designed for the modern web," "Made for builders," "Crafted for developers who care." Every product is "built for" or "designed for" some flattering audience description.

Why it reads as default: it is the template-shaped way to imply quality without committing to a claim. It says nothing.

Instead: name the actual user. "For backend engineers debugging production incidents." "For solo designers running their own studio." A narrower audience description signals confidence.

### 12. "The Notion for X" / "Stripe for Y" / "Linear for Z"

Positioning a product as "the [famous product] for [your niche]." Sometimes the comparison is apt; usually it is borrowed prestige.

Why it reads as default: it is the laziest possible positioning frame and dominates Y Combinator launch posts.

Instead: describe what makes the product different from the thing being compared to. If you must use the frame, qualify it: "Notion's flexibility, but with real database constraints." Use the comparison to set up a contrast, not to inherit credibility.

### 13. Three-word benefit headlines on every section

"Fast. Reliable. Yours." "Simple. Powerful. Free." "Build. Ship. Scale." A triplet of one-word benefits, usually with periods, sometimes with line breaks.

Why it reads as default: Apple did it for iPhone, and every model has been imitating Apple's marketing voice since 2010.

Instead: write a real headline that contains a verb and an object. Triplets are a substitute for thinking about what the section actually communicates.

The same rhetorical symmetry shows up in body copy and is just as much a tell: nested rule-of-three stacks ("One person. Three gimmicks. Never double-booked."), and negative parallelism ("Nothing to outgrow, nothing to migrate to," "Not a spreadsheet, not a database, but both"). It reads as cleverness-for-its-own-sake — the cadence of an ad, not a person explaining a thing. When you catch a sentence whose structure is more memorable than its content, rewrite it plainly.

### 14. "It just works" / "It feels magical" / "Delightfully simple"

Adjectives that describe the user's emotional reaction rather than the product's behavior. "Magical," "delightful," "buttery smooth," "frictionless."

Why it reads as default: it is the Apple/Stripe vocabulary, and it is impossible to falsify.

Instead: describe the behavior. "Saves automatically every keystroke." "Renders 50,000 rows without dropping frames." "Diffs are byte-identical across runs." Behavioral claims are checkable; vibes are not.

### 15. The placeholder testimonial

"[Product] has completely transformed how our team works. We can't imagine going back." — Sarah Chen, Head of Product at TechCorp. Usually accompanied by a stock photo or a generated avatar.

Why it reads as default: testimonials are a structural slot, and when there is no real quote to fill it, models invent a generically positive one.

Instead: only ship testimonials you have permission to publish, with real names, real titles, and ideally a link to the person's profile. If you do not have a testimonial, replace the slot with a case study link, a usage stat, or nothing.

A subtler version: borrowing the *shape* of a testimonial (a pulled quote with a `<cite>` attribution) for content that isn't one — a product claim dressed up as if someone said it, often with the attribution just restating the section heading above it. The redundancy ("Why it exists" as a heading, then a quote attributed to "the reason we built X") is the tell. If it isn't a real quote from a real person, don't give it quote-and-attribution chrome; write it as plain prose.

### 16. "We're on a mission to..." in the footer or about section

"We believe the future of [industry] is [adjective]." "Our mission is to democratize [thing]."

Why it reads as default: it is the YC-application sentence, repurposed as marketing copy.

Instead: drop the mission statement entirely, or replace it with a specific belief that has teeth. "We think most analytics tools are too expensive for small teams, so we built one that costs $9." A real opinion is more credible than a noble mission.

## Structural

### 17. The hero-features-testimonial-CTA-footer skeleton

In order: hero with two CTAs, three-column feature grid, a "How it works" three-step section, a logo cloud, one or two testimonials, a pricing teaser or repeat CTA, footer with link columns.

Why it reads as default: this is the literal section order of the shadcn landing template, the Tailwind UI marketing template, and every "modern SaaS landing page" tutorial. It is what a model produces when asked for "a landing page" with no other constraints.

Instead: design the page around what the visitor needs to know in the order they need to know it. For a developer tool, that might be: code sample, install command, one paragraph of why, link to docs. For a consumer product, it might be: one screenshot, one sentence, one CTA. Sections exist because the page needs them, not because the template has slots.

### 18. The "How it works" 1-2-3 step section

Three numbered circles or rounded squares with a verb headline ("Connect," "Configure," "Deploy") and a sentence of explanation each. Sometimes with arrows between them.

Why it reads as default: it is the consultancy-deck way to explain a product, and it usually compresses real complexity into a misleading sequence.

Instead: if the product genuinely has three steps, show the actual UI for each step (a real screenshot or video, not an icon). If it does not, omit the section. Most products do not have three discrete steps.

### 19. FAQ section with five generic questions

"Is it secure?" "Can I cancel anytime?" "Do you offer a free trial?" "Is there a discount for annual billing?" "How does support work?" Answered with two-sentence reassurances.

Why it reads as default: FAQ is a template slot, and these are the questions that fill it when no one has talked to actual users.

Instead: only include FAQs that come from real customer conversations, and answer them with specifics (link to the security policy, name the trial length, state the annual discount as a percentage). If you do not have real questions, the FAQ section is filler — cut it.

### 20. Pricing tiers named Starter / Pro / Enterprise

Three columns, middle one highlighted with a "Most Popular" badge, the right column says "Custom" with a "Contact us" button. Feature lists are bullet points starting with checkmarks.

Why it reads as default: it is the universal SaaS pricing shape, and every model emits it verbatim.

Instead: if your product has two real plans, show two. If it has one, show one. Name plans after what they enable ("Solo," "Team of 10," "Unlimited seats") rather than vague seniority labels. The "Most Popular" badge is meaningless unless you actually have data — and if you do, say which plan and why.

### 21. Footer with four columns of link soup

Product / Company / Resources / Legal, each with five to eight links, half of which point to pages that do not exist or are stubs.

Why it reads as default: it is the structural shape of every B2B footer and gets generated by default whether or not the product has the underlying pages.

Instead: only link to pages that exist and are worth visiting. A footer with three real links beats one with thirty stubs. If you only have a privacy policy and a Twitter, that is a fine footer.

## Additional tells

These were added after the original catalog, so they carry continuation numbers (22+) rather than slotting into the sections above — citations to #1–#21 stay stable. The category is tagged inline.

### 22. (Visual) The colored rule or leading dash before an uppercase eyebrow

A short tinted bar, em-dash, or `::before` rule sitting to the left of a small uppercase label ("— WHY IT EXISTS", "▎ THE PRODUCT"). The eyebrow itself is `text-xs uppercase tracking-widest`, and the little accent rule in front of it is the giveaway. It's the non-pill cousin of #6's eyebrow pill, and it's one of the single most overused generative-design flourishes — it reads as "made by the median tool" before a reviewer has read a word.

Why it reads as default: it's the path-of-least-resistance way to make a section label "feel designed" without making a real typographic decision, and it's all over template marketing pages.

Instead: if a section needs a label, set it with type alone — weight, size, color, spacing. If the section is clear without a kicker, drop the kicker. Decorative rules in front of eyebrows are visual throat-clearing. (Same family to avoid on sight: pill-shaped eyebrows (#6), three-up icon rows (#3/#4), gradient-text headlines (#1).)

### 23. (Copy) Em dashes as dramatic pauses

Marketing prose studded with em dashes used for rhetorical effect — a beat before the payoff, an aside the sentence didn't need, a faux-conversational swerve. It is the most recognizable LLM fingerprint in body copy, and a reviewer who knows the tell will strip every one.

Why it reads as default: models reach for the em dash as a cadence tool; it's the punctuation equivalent of clearing your throat dramatically.

Instead: prefer a period or a full stop and a new sentence. The discipline is surgical, not absolute — kill em dashes in *visible marketing prose*, but leave the legitimate ones alone: UI mock data, `aria-label`s, code comments, and genuine mid-sentence punctuation where no other mark works. The tell is the *dramatic-pause* dash in prose a visitor reads, not every dash on the page.

### 24. (Copy) Leading with the clever mechanism instead of the job-to-be-done

The headline shows off an interesting internal feature or data model ("One person, three personas, never double-booked") instead of the benefit the visitor actually came for. It's the engineer's instinct — the mechanism is genuinely neat — but the page sells the gimmick rather than the job.

Why it reads as default: the clever thing is the most salient thing to whoever built it, so it floats to the headline. But a visitor doesn't have the context to find it clever yet.

Instead: lead with the felt benefit ("The whole locker room, organized"); let the clever mechanism be the *proof* underneath, demoted to a supporting bullet or a screenshot. The mechanism earns its place as evidence, not as the marquee.

---

## Notes on application

This catalog is meant to be cited by name in design reviews. "That's a #1 and a #6" is faster than re-arguing the principle each time.

When generating drafts, the goal is not to invert every default — some defaults are defaults because they work. The goal is to make each choice deliberately, and to notice when the model is reaching for a trope because it is the path of least resistance rather than the right answer for the brief.

A draft that hits zero of these and is still bad is a more interesting failure than a draft that hits twelve and looks polished.
