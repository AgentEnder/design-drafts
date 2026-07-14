# Decisions Log — Daemon Task Execution Proposal

> Running record of design decisions from the grilling session, 2026-07-14.
> Each entry: the question, the decision, and the rationale/consequences we accepted.

## D1. Architecture: executor, not broker

**Question:** Is the requirement "runs are shared/observable" (satisfiable by a broker/registry where runs stay in the CLI) or "runs execute in the daemon"?
**Decision:** Evaluate the **executor** model — daemon owns task graph creation, orchestration, and child processes; CLI is an attach/render client.
**Key supporting fact:** true attach is impossible in the broker model — the PTY attach primitive is an in-process `Arc<RwLock<Parser>>`; PTY masters are single-consumer, so the owning process must be the fan-out server. If runs stay in the CLI, every CLI must become that server — most of the executor's plumbing with none of its benefits.
**Fallback position if executor costs disqualify it:** broker/registry model extending today's `running_tasks` mechanism.

## D2. Dual-path: in-process execution survives forever

**Decision:** Extract the execution engine into a shared component (library) with two hosts: the daemon and the CLI process. In-process hosting lives forever because CI runs with the daemon disabled.
**Policy:** daemon-execution whenever the daemon is enabled — including non-TTY local clients (AI agents are non-TTY and are the primary use case). In-process only where the daemon is disabled (CI, docker, `NX_DAEMON=false`, WASM). Sandboxed environments are deliberately excluded from this list: the sandbox check disables the daemon today, but there is active work to enable the daemon in sandboxes, so this proposal must not treat sandboxing as a daemon-disabled environment.
**Constraint accepted:** zero execution logic may fork on host; the delta is transport only. The CI path keeps the in-process host honestly maintained.

## D3. IO transport: dedicated raw sockets, daemon-side canonical parser

**Question:** Can attached CLIs open the run's stdio fds directly instead of streaming over sockets?
**Decision:** No fd-passing. Daemon stays the single PTY reader and fan-out point; per-run/per-task dedicated raw sockets carry output/stdin (NOT the sentinel-framed JSON control socket); attach = state snapshot (screen + scrollback from daemon's canonical vt100 parser) + delta stream; each client feeds a local parser. The tmux architecture.
**Why fd-passing loses:** PTY masters are single-consumer (fd-sharing breaks multi-attach); SCM_RIGHTS is POSIX-only (Windows needs DuplicateHandle/ConPTY — second mechanism); unix-socket latency (µs) was never the bottleneck. The real hazards were framing (binary VT100 vs sentinel-delimited JSON) and head-of-line blocking, both solved by dedicated sockets.
**Open item:** resize arbitration. Leaning: first interactive attacher owns PTY size; non-interactive clients consume the stream as-is.

## D4. Ownership & death semantics

- **(a) Signals/refcounting:** every attach is refcounted; Ctrl+C = disconnect. On **last** disconnect, the termination signal is forwarded to the running process. Uniform rule for discrete and continuous tasks (today's `cleanUpUnneededContinuousTasks` becomes a degenerate case). Consequence: no orphaned runs can exist; runs do NOT outlive the last attached client, so default UX matches today's (close terminal → run dies) unless a monitor/`--detach` client holds a reference.
- **(b) Daemon self-termination triggers:** nx-version change and lockfile change kill in-flight tasks and restart the daemon — the tasks were running against outdated packages anyway. Needs hardening + explicit kill messaging ("run terminated: workspace dependencies changed"). **Accepted behavior regression:** today `pnpm add` doesn't kill an in-flight run; under this model it does. 3h inactivity timeout is moot (running tasks are activity).
- **(c) Daemon crash:** tasks die with the daemon. Engineering note: SIGKILL'd daemon can't clean up — Linux `PR_SET_PDEATHSIG`, Windows job objects, **macOS has neither** (needs child watchdog: parent-pid poll or kqueue `EVFILT_PROC`).
- **Error-model prerequisite:** daemon currently exits on any unexpected handler error by design. Must invert to isolate/recover/never-exit before holding runs.

## D5. Dedup/matching semantics (task-level)

Matching happens per task execution, not per command. A "run" is a client-side selection over the daemon's pool of task executions; incoming runs attach to matching executions and spawn the rest.

| Task kind | Matching key | Same task ID in flight, key mismatch |
|---|---|---|
| Cacheable | task hash (declared inputs + env + normalized args) | **Supersede**: kill stale execution, start fresh; all clients attach to the new one |
| Non-cacheable, default inputs | task ID + normalized args (file/env state ignored) | n/a — key cannot drift |
| Non-cacheable, explicit inputs | same as cacheable | same as cacheable |

- Args are already inside the cacheable hash (`task.overrides`) but matching needs **canonicalization** (flag ordering, alias resolution, default elision). False positive = client silently watches the wrong run — worse than a duplicate. Spec item.
- Supersede-on-stale is the "task rerunning baked in" feature emerging naturally from dedup.
- No orphan policy needed (see D4a — orphans can't exist).

## D6. Revenue framing (funnel: pre-adoption → adoption → enablement → conversion)

**Decision:** engine work = OSS/pre-adoption value; **the monitor is the revenue vehicle** and is therefore core scope, not fast-follow. Primary mechanism is adoption-stage: monitor as a persistent ambient surface — local runs free; branch CIPEs + self-healing fixes when connected; contextual connect prompts.
**Corrections absorbed:**
- "Async cloud cache uploads" is NOT new value — the light client already uses `PROCESS_IN_BACKGROUND` for uploads when the daemon is up.
- Cross-workspace/teammate claims in prompts are infeasible pre-connect (no workspace correlation; hashes not in analytics).
- "You cache-missed this same hash N times" is incoherent — an identical hash would have hit locally. Honest local claim: aggregate time spent on cache-missed runs (*potential* remote-cache savings).
**Instrumentation:** `nx connect` supports UTM attribution; background-connect-on-click has been discussed → funnel is measurable (impression → click → connected workspace). Revenue claim is falsifiable, not narrative.
**Gating stance:** additive only (cloud adds panes); never paywall local functionality.

## D7. Nx Cloud runner hosting

- Bundle resolution/verify/update happens **daemon-side**; daemon reports errors/retries (user overrode my client-side-verify recommendation).
- Auth via daemon env hydration (hydrated at launch, rehydrated on message receipt). First-starter's env drives an execution.
- **DTE is a requirement:** daemon can be explicitly enabled in CI (`NX_DAEMON=true`), so the daemon-hosted cloud runner must support DTE.
- Ocean light-client audit **deferred** to a named open investigation (proposal-stage doc; Polygraph investigation when approved). Questions: module-level singletons, env-keyed state, concurrent-run safety, long-lived-process lifecycle assumptions.

## D8. Framing, order, verdict

- Presented as **one project** with an internal execution order (not separately-pitched phases): Stage 0 engine extraction + daemon error-model inversion (no-regret) → Stage 1 daemon host single-client **with go/no-go gate** on TUI-over-socket interactive quality → Stage 2 attach/dedup → Stage 3 monitor + cloud surfaces. Parallel: ocean audit before Stage 1 exit.
- **Verdict: proceed, with the Stage 1 kill-switch.** Deciding fact: the broker alternative cannot deliver attach (PTY state is process-private; masters are single-consumer). Fallback if gate fails: keep Stage 0, retreat to broker model.
- Deliverables: PROPOSAL.md (surface-level: problem, pros/cons, revenue) + PLAN.md (detailed design/stages/risks) + research/*.md.
