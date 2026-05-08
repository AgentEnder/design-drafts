# 2. PR creation flow for `design-drafts` CLI

Date: 2026-05-07

Status: Accepted

## Context

The `design-drafts` CLI (`packages/cli`) pushes a local directory's contents
as a named branch to a shared GitHub repository. A GitHub Actions workflow
(`.github/workflows/deploy-preview.yml`) is triggered by branch creation /
update / deletion (and `pull_request` events) and deploys the branch
contents into a per-branch subdirectory on `gh-pages`. Once the push
succeeds, the preview is publicly browsable at the deployed URL — without
any pull request being open.

The original setup plan (`.ai/plans/2026-04-16-initial-setup.md`, step 2)
included an additional final step: run `gh pr create --web` after the
push so the user lands in the GitHub PR-creation UI. The implementation
shipped without that step; today the CLI pushes the branch and exits.

This ADR resolves what the CLI should do about pull requests now that the
deployment side of the workflow no longer requires a PR.

The decision must also account for an upcoming workflow described in
related work: an `annotate` flow that produces a `feedback.md` per
reviewer / per page. Reviewers will want a single, durable place to
attach that markdown so all feedback for a given preview lives in one
discussion thread. A pull request is the most natural anchor for that:
it has a description, a comment thread, file-level review threads, and
notification/subscription mechanics for free.

### Forces

- **Auto-deploy decouples preview from PR.** Pushing a branch is
  sufficient to publish a preview. A PR is no longer load-bearing for
  deployment.
- **Reviewers benefit from a PR anchor.** The annotate → `feedback.md`
  workflow benefits from a single GitHub thread where reviewers can drop
  the markdown, hold async discussion, and reach a resolution.
- **Not every push wants review.** Authors iterate on a draft many times
  before they want eyes on it. Opening a PR on every push would generate
  noise (notifications, draft churn, stale review threads) and would
  imply a maturity the draft doesn't have yet.
- **No PR at all is friction when review *is* wanted.** The author has
  to switch contexts, find the branch on github.com, and click through
  the compare UI. `gh pr create --web` was specifically nice because it
  pre-fills the branch and drops the user in the right page.
- **Reversibility.** Any choice we make can be undone in a follow-up;
  the cost of getting this wrong is low. We should not over-engineer.

## Options considered

### Option A — Always open a PR

After every successful push, run `gh pr create --web` (or the
non-interactive equivalent) so a PR is opened against `main`.

- **Pros:** Reviewers always have a thread to attach `feedback.md` to.
  No flag to remember.
- **Cons:** Noisy. Most pushes are iterative draft work that the author
  is not asking for review on yet. Generates spurious
  notifications, runs `pull_request`-triggered workflows
  redundantly with the `create`/`push`-triggered ones, and leaves
  half-finished PRs lying around. Penalises the common case to serve
  the occasional one.

### Option B — Never open a PR (status quo)

Keep current behaviour: push the branch and exit. The author opens a PR
manually if they want one.

- **Pros:** Simple, quiet, matches the auto-deploy reality where a PR
  isn't needed for the preview to exist.
- **Cons:** When review *is* wanted (the annotate / `feedback.md`
  workflow being the motivating case), the author has to leave the
  terminal, navigate GitHub, and create the PR by hand. We lose the
  ergonomic win that `gh pr create --web` originally offered.

### Option C — Opt-in `--pr` flag

Default behaviour stays "just push" (Option B). When the author passes
`--pr`, the CLI additionally invokes `gh pr create --web` after a
successful push so the GitHub PR-creation page opens in the browser
pre-filled with the pushed branch.

- **Pros:** Optimises for the common case (silent draft push) and
  supports the review case (annotate / `feedback.md`) with a single,
  discoverable flag. `--web` keeps the user in control of title,
  description, draft vs ready, and reviewers — we don't need to
  invent metadata in the CLI. Easy to extend later (e.g. `--pr=draft`,
  `--pr-title=...`) without a breaking change.
- **Cons:** Two ways to do the thing. Authors who want a PR every time
  have to remember the flag (mitigated by the fact that they can alias
  it or add it to a script).

### Option D — Config-driven default

Add a `pr` field to the project or user config (`design-drafts.config.json`
or `~/.design-drafts.config.json`) that controls whether a PR is opened.

- **Pros:** Authors who always want PRs only set this once.
- **Cons:** Premature. We have no evidence yet that the default is
  wrong for anyone, and Option C's `--pr` flag is the simpler primitive
  to build on. A future ADR can add config support if usage warrants it,
  without breaking Option C.

## Decision

Adopt **Option C: opt-in `--pr` flag**.

- Default behaviour remains: push the branch, let the workflow
  auto-deploy, exit. No PR is created.
- When `--pr` is passed, after the push succeeds the CLI runs
  `gh pr create --web` so the user lands in GitHub's PR-creation UI
  with the just-pushed branch pre-selected as the head against `main`.
- The CLI does not attempt to set a PR title, body, draft state, or
  reviewers itself. The `--web` form keeps the author in charge of
  those decisions.
- If `gh` is not installed or not authenticated, `--pr` should fail
  with a clear, actionable error rather than silently swallowing the
  failure — the author asked for a PR; the push already succeeded;
  they need to know the PR step didn't happen.

This issue is decision-only. The flag itself is a separate
implementation issue.

## Consequences

### Positive

- The default (silent push) matches the new auto-deploy reality and
  stays out of the author's way during iterative drafting.
- The annotate → `feedback.md` workflow has a documented, ergonomic
  on-ramp (`design-drafts --pr`) for creating the discussion thread
  reviewers will attach feedback to.
- We don't over-commit to a behaviour: `--pr` is the smallest additive
  surface that unblocks the review workflow, and the door stays open
  for `--pr=draft`, config defaults, or richer integration later
  without breaking changes.
- The `--web` approach means we do not need to build or maintain a
  PR-metadata story (title templates, body generation, reviewer
  selection) in this codebase right now.

### Negative / risks

- Authors who *always* want a PR have to remember `--pr` or wrap the
  CLI in a script / shell alias. If this becomes a recurring complaint,
  a follow-up ADR can add a config-level default (Option D).
- `gh pr create --web` requires `gh` on the author's `PATH` and an
  authenticated session. The implementation issue must surface a clear
  error when that precondition fails.
- A small inconsistency: the preview deploy is triggered by the push
  itself, not by the PR. Authors may briefly assume the PR is what
  caused the deploy. Documentation should make clear that the PR is
  for *review*, not for *deployment*.

### Follow-ups

- Open an implementation issue to add the `--pr` flag to
  `packages/cli/src/index.ts` and to document the `gh` precondition.
- Revisit if usage data shows most authors pass `--pr` every time —
  that would be the signal to promote it to a config-driven default
  (Option D).
