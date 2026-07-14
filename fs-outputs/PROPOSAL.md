# Proposal: Task Output as Files

> Draft for cycle planning · 2026-07-14

## Problem

- We turn the TUI off under `isAiAgent()` (`is-tui-enabled.ts:75-84`), and the fallback — `StaticRunManyTerminalOutputLifeCycle` — prints every task's full output, successes and cache hits included (`static-run-many-terminal-output-life-cycle.ts:155-162`: no status filter, no size limit). An agent running `nx affected -t test` reads thousands of lines of passing output before reaching the failure it's looking for.
- The renderer we give humans is already quiet: dynamic collapses successes to a ✔ and gates full output behind `--verbose` (`dynamic-run-many-terminal-output-life-cycle.ts:137-189`). Static — the one agents and CI get — never got that treatment.
- Our own CI is worse than it needs to be. `ci.yml:25` sets `NX_BATCH_MODE: 'true'` → forces `NX_STREAM_OUTPUT` (`run-command.ts:948-958`) → streamed output never reaches `logCommandOutput()`, the only place we emit `::group::` folds (`output.ts:270-296`). We built log grouping and opted ourselves out of it.

Root cause: task output is a stream we print, not an artifact we address.

## Proposal

The store already exists. Nx writes every task's terminal output to `<cacheDir>/terminalOutputs/<hash>` — cacheable or not (`task-orchestrator.ts:1040` computes the path before checking `task.cache`; `cache: false` only skips the DB row). The path builder is already napi-exported (`cache.rs:302-310`). We just never tell anyone it's there.

- **`--output-style=summary`**, auto-selected under `isAiAgent()`, overridable. Prints task counts, and one line per failed task: id, exit code, absolute path to its log. Nothing for successes. The agent greps the file it wants — full fidelity, no truncation, ~6 lines of context instead of ~8,000.
- **Precedent exists:** `show/command-object.ts:72` already defaults to `--json` under an agent; `ai/ai-output.ts` already emits NDJSON. Agent-detected reshaping isn't a new pattern here.
- **CI: successes collapse to a ✔, failures print inline.** A CI reader can't click a path on an ephemeral runner. Route batch/streamed output back through the group-aware printer — that alone fixes the nx repo. Cloud task URL on the summary line if it's cheap to get; the OSS path can't depend on it.

Out of scope: continuous tasks (below), run-scoped log dirs, whole-run JSON.

## What it looks like

```
Ran target test for 12 projects (9 cached)

  ✔  11 succeeded
  ✖  1 failed

  nx run api:test  (exit 1)
  → /Users/craigory/repos/nx/.nx/cache/terminalOutputs/8f3a…c21

Re-run with --output-style=static to inline them.
```

## Alternatives considered

- **Make static failures-only, like dynamic already is.** ~A day, kills most of the noise. But a failing Jest suite is still 3k lines inline and nothing is addressable afterward. Not a dead end — it's step 1 below, and it ships standalone if the rest gets cut.
- **Truncate to last N lines.** Eats the top of the stack trace, and the agent can't recover what was dropped.
- **Point everything at Nx Cloud.** Doesn't help unconnected, offline, or OSS — which is where agents mostly run. Cloud should be additive.

## Acknowledged complexities

- **Files are raw PTY bytes**, escapes and all (`pseudo_terminal.rs:132-134`; nothing calls `stripVTControlCharacters`). Strip on write and cache replay loses color for humans. I'd write a stripped sibling only under the summary style — no cost on the human path, no fidelity loss.
- **Batch tasks never write the file.** Output comes back over IPC and only lands via `cache.put`, so a `cache: false` batch task leaves no log. `NX_BATCH_MODE` is what our CI runs — this is the main path, not an edge case.
- **Orphaned outputs leak.** `remove_old_cache_records` only deletes hashes with a DB row (`cache.rs:406-427`); `cache: false` tasks never get one. Making these files load-bearing means owning their GC.
- **Continuous tasks don't fit, and I don't think they can.** The design rests on a task ending. Streaming to disk as it runs means owning live-log problems — when is "enough" written, who cleans up, agents polling to see if the dev server came up. [Daemonized execution](../daemonized-tasks/PROPOSAL.md) solves that properly with per-run sockets and snapshot-then-stream attach. Files fit finished output; attach fits live output.
- **Should failures print nothing inline?** Path-only maximizes the win but costs a tool-call round trip, and a lazy agent will report "tests failed" and stop. I lean toward a bounded tail (~20 lines) inline with the full log in the file — still ~99% smaller, preserves the single-shot case. Don't feel strongly.

## What it takes

1. Failures-only static life cycle + un-bypass `::group::` for streamed/batch output. Fixes nx CI on its own; ships independently.
2. Close persistence gaps: batch tasks write output, orphans get GC'd, stripped sibling under the summary style.
3. `--output-style=summary`, auto-on under `isAiAgent()`.
4. Teach agents it exists — `get-agent-rules.ts`, `nx-run-tasks` skill.

**⛔ Gate: bytes of stdout for `nx affected -t test` on this repo, before/after step 1.** If that doesn't move an order of magnitude, I've read the problem wrong and 2–4 don't deserve the cycle.

## Costs / risks

- **Agents that ignore the file.** Then we've made failures *harder* to see — strictly worse than noisy. Mitigations: the bounded tail, plus an explicit line in the agent rules.
- **`isAiAgent()` is a heuristic that will rot.** It sniffs `CLAUDECODE`, `CURSOR_TRACE_ID`, `CODEX_THREAD_ID`, etc. (`ai.rs:5-97`). A new agent goes undetected and gets full output again. Already load-bearing for the TUI decision, so no new failure mode — but a higher cost to being wrong.
- **A new output style is permanent surface.** Six exist already (`shared-options.ts:327-336`). This is the cost I'm least comfortable with, and why step 1 is shaped to not need it.
- **Making an internal path public.** `terminalOutputs/<hash>` becomes a contract people script against.

## Partial acceptance

Step 1 stands alone and is worth doing regardless — it's a day of work and it fixes our CI logs. If the appetite stops there, we've still won.
