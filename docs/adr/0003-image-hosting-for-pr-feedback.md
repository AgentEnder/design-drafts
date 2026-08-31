# 3. Image hosting strategy for PR-review feedback submissions

Date: 2026-05-08

Status: Accepted

## Context

The annotate package (ADR 0001) lets reviewers attach comments to parts of
a deployed draft. Issue #34 covers the *export* side of that flow: turning
a reviewer's local annotation set into a real PR review on the draft's
pull request. ADR 0002 already settled how the PR itself comes into
existence (`design-drafts --pr`); this ADR is about a narrower question
that falls out of #34: where do the *screenshot bytes* live?

Annotations are most useful when the reviewer can show, not just tell.
A "this padding is wrong" comment is dramatically more actionable when it
lands in the PR thread with the actual cropped screenshot of the
offending region next to it. The reviewer captures those screenshots
client-side as part of the annotate UX; the export step's job is to get
them into PR review comments where the draft author (and the AI agent
acting on the feedback) can see them.

The constraint that forces this ADR: **GitHub's REST API has no
"post a comment with attachments" endpoint.** The web UI accepts
drag-and-drop image uploads on issue and review comments, but that path
goes through an undocumented `github.com/upload` endpoint that requires a
session cookie and is not exposed to API clients. From an API client's
point of view, a comment body is just markdown — if you want an image to
appear inline, the markdown has to reference a URL that already exists
somewhere addressable. The bytes have to live somewhere before the
comment can render them.

So the question is: somewhere *where*?

## Options considered

Six options were on the table:

| Option | Where bytes go | Pro | Con |
|---|---|---|---|
| **A. Base64 data URLs** inline in the comment body | Nowhere — bytes are the comment | Zero infra; one round-trip | Per-comment body cap (65,535 chars) limits to ~one moderate screenshot per comment; GitHub's data-URL rendering is undocumented and could quietly stop |
| **B. Commit to `gh-pages` under the draft** | The draft's deploy directory | Uses existing infra; durable URLs | Concurrent commits race with the auto-deploy workflow; broader PAT scope |
| **C. Commit to a sibling `feedback` branch** | A non-deployed branch on the draft repo | Doesn't trigger the deploy workflow; clean separation; `git log feedback/-- <draft>/` doubles as audit trail | One more branch to manage; URL form less obvious |
| **D. Gist** | Reviewer-owned gist | Simple; doesn't touch the draft repo | `gist` scope on the PAT; weird ownership story for project-bound feedback |
| **E. Server proxy** | A backend we control | Best isolation; smallest PAT scope | Ends "static-only" promise |
| **F. GitHub Releases** | Release asset on the draft repo | Stable URLs; public | Heavyweight (creates a release per session); awkward UX |

A few notes on the trade-offs that drove the decision:

- **A** is appealingly minimal until you discover the comment-body cap.
  At ~65k characters per comment body, a single base64-encoded PNG of
  any meaningful resolution will eat most or all of the budget. It works
  fine for tiny crops, fails immediately for full-viewport captures.
  Separately, GitHub does not document data-URL image support in
  comment markdown; it currently renders, but we'd be relying on a
  behaviour they could turn off without notice.
- **B** keeps everything on infrastructure we already operate, but the
  deploy workflow watches `gh-pages` and would re-deploy on every
  feedback push. That's a race against ourselves and a needless rebuild.
- **C** is the same idea as B with the deploy interaction removed. The
  bytes still live in the draft repo (so ownership is clear and audit
  trail is real), but they live on a branch the deploy workflow doesn't
  watch. Raw URLs are durable enough for the lifetime of a review.
- **D** trades infrastructure simplicity for ownership weirdness:
  reviewer-owned gists outlive the project and are awkward to clean up
  if a reviewer leaves. It also requires a `gist` scope on the PAT,
  which is one more thing to ask reviewers for.
- **E** is the cleanest from a security standpoint — a backend we
  control could accept image bytes with a narrow auth surface — but
  design-drafts is currently a static-only system (CLI + GitHub
  Actions + gh-pages). Standing up a server moves us off that promise
  for a single feature.
- **F** technically works but mismatches the granularity of the
  problem. Releases are project-level milestones; one release per
  feedback session is heavyweight, noisy, and confusing in the UI.

## Decision

Adopt a two-tier strategy:

- **Primary path: Option C — commit feedback bytes to a sibling
  `feedback` branch on the draft repository via the Git Data API.**
  Each export session writes its screenshots as blobs on a `feedback`
  branch, and the PR review comments link to those blobs by their raw
  URL.
- **Fallback path: Option A — inline base64 data URLs in the comment
  body.** Used automatically when the reviewer's PAT lacks
  `contents:write`, or when the screenshots are small enough to fit
  comfortably under the comment body cap.

### Auto-detection trigger

The export step (issue #34) probes the PAT's permissions before deciding
which path to take:

1. If the token has `contents:write` on the draft repo → Option C.
2. Else, if every screenshot in the session base64-encodes to under a
   conservative fraction of the comment body cap (e.g. ~20kB encoded
   per image, leaving room for the actual comment text and the rest of
   the body) → Option A.
3. Else, fail with an actionable error explaining which permission is
   missing and what to do about it.

The reviewer should not need to think about which path got used. The
fallback exists so a reader-only PAT still produces *some* review,
not zero review.

### Concurrent-commit handling (the 422 retry loop)

The `feedback` branch is a single shared ref; multiple reviewers may be
exporting feedback against the same PR concurrently. Two reviewers'
exports racing each other will manifest as a 422 response from
`PATCH /repos/{owner}/{repo}/git/refs/heads/feedback` (the ref's tip
moved between the build and the update). The export client must:

1. Catch the 422 on the ref-update step.
2. Re-fetch the current `feedback` ref's SHA.
3. Replay the tree-build against the new base: re-create the tree with
   the same blobs (already uploaded — blob SHAs are stable and cheap to
   reuse), point the new commit at the refreshed parent, and try
   `PATCH` again.
4. Cap retries at a small number (e.g. 5) with a short jittered backoff
   so a sustained collision storm fails loudly rather than spinning.

The blob upload step (`POST /repos/{owner}/{repo}/git/blobs`) is
idempotent in practice — a blob with identical contents has a
deterministic SHA, and re-uploading the same bytes is cheap and safe.
That's what makes the replay strategy tractable: only the tree and
commit objects need to be rebuilt on retry, not the bytes.

### Branch bootstrap (POST refs vs PATCH refs split)

A `feedback` branch may not exist yet on a freshly created draft repo.
The Git Data API splits "create a ref" and "update a ref" into two
endpoints:

- `POST /repos/{owner}/{repo}/git/refs` — creates a new ref. Fails
  with 422 if the ref already exists.
- `PATCH /repos/{owner}/{repo}/git/refs/heads/feedback` — updates an
  existing ref. Fails with 422 if the ref does not exist (or if the
  expected SHA doesn't match the current tip).

The export step must handle both cases. The implementation pattern is:
try `PATCH` first (the steady-state case); on 422-due-to-missing-ref,
fall back to `POST`; on 422-due-to-stale-SHA, run the retry loop above.
Disambiguating the two 422 cases requires inspecting the response body
or the GET-the-ref probe, not the status code alone.

### Branch lifecycle

No automated cleanup is planned. The `feedback` branch grows
monotonically; each export session adds a commit. This is acceptable
for now:

- Git is content-addressed, so identical screenshots across sessions
  deduplicate at the blob level.
- The draft repo is itself ephemeral relative to the project's
  lifetime; the cost of the branch is bounded by the project.
- A `git log feedback -- <draft>/` doubles as an audit trail of
  who-said-what-when across reviews.

If the branch ever grows large enough to be a real cost (slow clones,
quota pressure, GitHub API limits when listing tree entries), we can
add a pruning step in a follow-up — squash, prune by age, or move
older sessions to release assets. Until then, no cleanup.

## Consequences

### Positive

- **Static-only promise preserved.** No backend stood up; everything
  flows through the GitHub API surface we already use.
- **Clear ownership.** Feedback bytes live in the draft repo, on a
  branch named for what they are. No reviewer-owned gists, no
  project-spanning state outside the project.
- **Deploy workflow untouched.** `gh-pages` is what the deploy
  workflow watches; `feedback` is not. Pushes to `feedback` don't
  trigger a redeploy.
- **Fallback that actually works.** A reader-only reviewer still gets
  a usable review (small screenshots inline as base64) instead of an
  outright failure.
- **Audit trail for free.** `git log feedback` is a real history of
  feedback exports across the life of the project.

### Negative / costs we accept

- **One more branch to know about.** Authors looking at the repo for
  the first time will see `feedback` and have to learn what it's for.
  Documentation in the export-flow issue (#34) and the package README
  must explain it.
- **Two paths to maintain.** The export client has to implement both
  C and A and the auto-detection between them. The fallback path
  exists specifically because we want to degrade gracefully, but it
  *is* a second code path.
- **Implicit reliance on raw.githubusercontent.com URL stability.**
  GitHub's raw blob URLs have been stable for years, but this is the
  same kind of "undocumented but works" surface as data-URL
  rendering. If raw URLs ever require auth or get rate-limited
  aggressively for image embeds in comments, we'd need to revisit.
- **Concurrent-export edge case is real.** The 422 retry loop is
  required, not optional. Skipping it produces silent feedback loss
  the first time two reviewers export at once.
- **Branch grows unboundedly.** Acknowledged above; tracked as a
  follow-up only if it actually starts to hurt.

### Follow-ups

- The export-flow implementation (issue #34) owns building both
  paths (C and A), the auto-detection trigger, the 422 retry loop,
  and the bootstrap split.
- The build-time PR lookup (issue #35) is adjacent: it's how the
  export step finds *which* PR to comment on in the first place.
  This ADR assumes that lookup exists; it does not specify it.
- Revisit branch lifecycle only if `feedback` causes concrete pain
  (slow clones, API limits, quota). Don't pre-optimise.

## Sibling reading

[cli-forge#96][cli-forge-96] — same spirit as this ADR. That issue
captures a set of silent gotchas that future-us would otherwise rediscover
the painful way. The 422-on-stale-ref retry loop and the
POST-vs-PATCH ref split are exactly that kind of "obvious in
retrospect" trap, and writing them down here is the cheapest insurance
we have against relearning them.

## Reading recommendations

- Issue #34 — the export-flow implementation that consumes this
  decision.
- Issue #35 — build-time PR lookup; how the export step finds the
  right PR to attach comments to.
- ADR 0001 — annotation picker; how the screenshots get captured in
  the first place.
- ADR 0002 — PR creation flow; how the PR these comments live on
  comes into existence.

[cli-forge-96]: https://github.com/AgentEnder/cli-forge/issues/96
