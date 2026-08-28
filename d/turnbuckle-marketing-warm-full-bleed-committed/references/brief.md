# Brief: Turnbuckle marketing site (admin-v2 product)

> Rewritten 2026-06-09 after the first draft round was rejected. The first round optimized
> wrestling-poster *aesthetics* (theme/structure/voice) and forgot the landing page's actual
> job: **show the product and prove it helps.** This brief puts product + payoff at the center
> and explores it across multiple axes.

## Who it's for

Independent wrestling promoters and small booking teams — served at both ends of one spectrum:
the **new/small promoter** (first shows out of a VFW hall, running on a spreadsheet + group
chat + memory) who must not feel intimidated, and the **ambitious promoter** who wants to grow
toward sold-out arenas with a tool that scales.

## What it's doing

A marketing / landing page for the **Turnbuckle** admin-v2 product (turnbucklehq.com), a
wrestling-promotion management app. It must **look like a product people would buy** and give
concrete **reason to believe it helps** — not a poster, not pure vibes. Primary conversion:
waitlist (pre-launch). Secondary: "Sign in".

## The core job (what the first round missed)

1. **Show the actual product.** Stylized-but-believable illustrations of real admin-v2 screens,
   embedded throughout — the product sells itself by being visible. (Per references: Notion/Height
   show their UI everywhere.)
2. **Prove it helps.** Lead with the payoff: **"look like the big leagues"** — the
   professionalism and control the tool gives a small promotion, and how it grows with you.
   Pair every claim with the screen that backs it.

## Reason-to-buy spine — "Look like the big leagues"

Frame: you don't need to *be* WWE to *run* like them. Turnbuckle gives a backyard promotion the
same command over its operation that the big leagues have — and it scales as you grow. Each value
section pairs a benefit with a real screen:

- **Book the card** → the **Event Schedule**: drag-to-reorder segments, match rows with type,
  an event **completion bar** that tells you what's still missing before doors open.
- **Keep the roster straight** → the **Roster** grid: ring personas with status pills
  (Active/Alumni/Guest), "aka [real person]", one person → many gimmicks, never double-booked.
- **Track every title** → the **Championship lineage**: a current-holder stats hero (title age,
  reigns, defenses, longest reign) + a lineage log with kind badges (Inaugural / Win / Defense /
  Vacancy).
- **Run the night** → the **Command Center** (day-of): timing strip (Staff arrival / Doors /
  First bell / Target end), a check-in rail, a match queue with live elapsed timers.

Authentic UI labels to use: "What do you want to do?", "Quick access", "Suggested next steps",
"Event Schedule", "Match card", "Ring personas", "Command Center", "First bell".

## Voice

- **Body — Promoter-to-Promoter:** warm peer advice, concrete nouns. "You've got a venue and
  eight wrestlers. We'll handle the paperwork so you can book."
- **Headlines — Ring Announcer:** big declarative moments, used sparingly, not whole-page caps.

## Visual references

- **Notion / Height** — approachable warmth; abundant clean product imagery shown in framed
  cards; human tone. NOT generic startup gradients.
- **Framer / Cron / Family** — bold big-type confidence, tasteful motion, opinionated
  distinctiveness; the page itself looks "big league." NOT dark-for-dark's-sake.

## Brand palette (fixed product identity)

Crimson `#C8102E` (heat — never destructive actions), charcoal `#2B2D42` (structure), spotlight
gold `#F2A900` (warmth). Display type **Anton** (condensed poster) for headline moments; **Inter**
for body/UI. Product UI illustrations use neutral surfaces + the app's real semantic status colors
(green active/win, amber warning, red vacancy/danger, blue/indigo accents) so they read as a real
app — crimson stays the marketing chrome around them.

## The venue climb (escalation) — the spine the user kept asking for

The page should give a "bigger feel" as you scroll — the literal "nothing → huge" growth.
Implemented as **the climb**: full-viewport venue stages escalate **bingo hall → armory →
arena → stadium**, and each tier hosts the capability a promotion needs *at that size*:

- **The Bingo Hall** (40 seats) → *Book the card* — just get the show on.
- **The Armory** (400) → *Keep the roster straight* — you're growing.
- **The Arena** (4,000) → *Track every title* — you have history now.
- **The Stadium** (18,000, sold out) → *Run the night* — full production.

The **ring stays the same size** while the house grows around it = "same tool, bigger stage."
Venue art is pure CSS (no stock photos). The climb degrades to a clean static page with
`prefers-reduced-motion` or JS off; snap is gentle (proximity), never a scroll-jack prison.

## Venue imagery — real images, integrated AS CONTENT BACKGROUNDS

Real generated images (`shared/assets/venue-{bingo,armory,arena,stadium}.png`), produced via
`codex exec` as one consistent painterly poster series (ring constant, house grows: bingo →
armory → arena → stadium).

Earlier rounds let the venues live as their own *separate* element (a gallery filmstrip, or
vertical chapter bands) — rejected for being sparse/disconnected. Now the images are **content
backgrounds**: each product-feature section sits *on* its venue image, and the escalation plays
out behind the content as you scroll. Booking→bingo hall, roster→armory, titles→arena,
show-night→stadium.

## Axes to build (2 axes, fully crossed = 4 pages — narrowed & concrete)

Narrowed from the prior 12. Dropped the bold/Framer theme and the layout axis (now one
responsive layout). Theme via `[data-theme]`, backdrop via `[data-backdrop]`; the 4 pages share
one body template and differ only by attributes.

- **theme** — `warm` (Notion-approachable) · `print` (editorial newsprint). (Bold/Framer dropped.)
- **backdrop** — how the venue image backs each feature section:
  - `full-bleed` — cinematic: image is the full-bleed section background under a dark scrim;
    copy + product card sit on top in light text.
  - `bleeding-band` — editorial: image faint and masked to fade into the page canvas top/bottom;
    content on a tinted veil in dark text. Image present, never fighting the copy.

**Layout (fixed, not an axis):** copy beside the product card on desktop; stacks on mobile
(`.feat` grid → single column under 56rem). Alternating sides via `.flip`.

**Scroll feel:** gentle reveals only (fade/rise on entry), no scroll-snap. Degrades with
`prefers-reduced-motion` and JS off.

Default page: `warm · full-bleed`.

## Must NOT look like

- The "this is an AI tool" template: flat near-black + monospace + single cool accent + vague
  abstract copy.
- A wrestling *event* poster with no product in sight (the first-round mistake).
- Indigo→violet hero gradient (#1), glassmorphism/neon dark mode (#2), the three-column feature
  grid (#3), centered-hero-with-eyebrow-pill (#6), hero→features→testimonial skeleton played
  straight (#17), "Built for modern teams"/"Empower your team to…"/"delightful" (#10, #11, #14).

## Open / TBD

- Exact CTA (waitlist vs sign-up vs demo) — drafted as **waitlist** (pre-launch); confirm.
- Whether stylized illustrations get replaced by real screenshots before the production build.
