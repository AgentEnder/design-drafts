# Plan: Daemon-Hosted Task Execution

> Companion to [PROPOSAL.md](./PROPOSAL.md) (the cycle-planning pitch) — this is the detailed design, execution order, risks, and open investigations.
> Decision provenance: [research/03-decisions-log.md](./research/03-decisions-log.md). Codebase grounding: [research/01](./research/01-daemon-architecture.md), [research/02](./research/02-task-execution-pipeline.md).

## Architecture

### Engine extraction (dual-host)

The task execution pipeline (task graph creation, hashing, orchestration, caching, lifecycles — today `run-command.ts` → `TaskOrchestrator`) is extracted into a host-agnostic library behind a narrow host interface (spawn, persist, report, env access). Two hosts:

- **Daemon host** — used whenever the daemon is enabled. Note: enabled-ness, not TTY-ness, is the selector; AI agents are non-TTY clients and are the primary sharing use case. TTY-ness selects only the renderer.
- **In-process host** — CI, docker, `NX_DAEMON=false`, WASM. Lives forever; CI keeps it honestly maintained. Zero execution logic may fork on host — the delta is transport only.

### Run submission

A run request carries the full invocation context, replacing today's ambient reads of CLI process state: normalized args, env snapshot (per-task `.env` layering resolves daemon-side against the snapshot), cwd, TTY metadata (interactive? initial size), and cloud runner options. The daemon maintains a pool of task executions; a run is a client-side selection over that pool.

### Matching / dedup (task-level)

| Task kind | Matching key | Same task ID in flight, key mismatch |
|---|---|---|
| Cacheable | task hash (declared inputs + env + normalized args) | **Supersede**: kill stale execution, start fresh; all clients attach to the new one |
| Non-cacheable, default inputs | task ID + normalized args (file/env state ignored) | n/a — key cannot drift |
| Non-cacheable, explicit inputs | same as cacheable | same as cacheable |

- Supersede-on-stale **is** the rerun feature; no separate mechanism.
- Args canonicalization is a hard spec item (flag ordering, alias resolution, default elision). A false *positive* silently attaches a client to the wrong run — worse than a duplicate; bias the canonicalizer toward false negatives.
- Replaces `SharedRunningTask` (poll-the-DB, no output) and the client-written `running_tasks` table flow.

### IO transport (tmux model)

- Bulk IO never touches the daemon's sentinel-framed JSON control socket (binary-unsafe, head-of-line blocking). Dedicated per-run raw sockets — precedent: existing forked-process/plugin-worker sockets.
- The daemon is the single PTY reader and holds the canonical vt100 parser per task (it already does this per-task for the TUI today, just in the wrong process). Attach = snapshot (current screen + scrollback) then delta stream; each client feeds a local parser.
- fd-passing was evaluated and rejected: PTY masters are single-consumer (breaks multi-attach), SCM_RIGHTS is POSIX-only, and unix-socket latency (µs) was never the bottleneck.
- Optional tee of raw output to an append-only file per execution: crash forensics + cheap replay for agents.
- Resize arbitration: first *interactive* attacher owns PTY size; non-interactive clients consume the stream as-is.
- Stdin: any attached interactive client may write (tmux semantics); agents generally won't.

### Ownership, signals, death

- **Refcounted attachment.** Ctrl+C = disconnect. Last disconnect forwards the termination signal to the process tree. Uniform for discrete and continuous tasks (`cleanUpUnneededContinuousTasks` becomes a degenerate case). Orphaned runs cannot exist. Solo-user UX is identical to today's; persistence-past-terminal is opt-in (monitor client or future `--detach` holding a reference).
- **Daemon self-termination** (nx version change, lockfile change): kill in-flight tasks with explicit messaging ("run terminated: workspace dependencies changed"), then restart. Accepted regression: today `pnpm add` doesn't kill an in-flight run. 3h inactivity timeout is moot (running tasks are activity).
- **Daemon crash:** tasks die with the daemon. Linux `PR_SET_PDEATHSIG`; Windows job objects; **macOS needs a watchdog** (parent-pid poll or kqueue `EVFILT_PROC`).
- **Error-model inversion (prerequisite):** the daemon currently `process.exit(1)`s on any unexpected handler error, and poisons itself on watcher errors, by design. Executor-mode daemon must isolate and recover; a graph-computation error cannot take down running dev servers.

### Nx Cloud runner in the daemon

- Bundle resolution/verification/update happens daemon-side; the daemon reports errors to clients and can retry.
- Auth: daemon env is hydrated at launch and rehydrated on message receipt; first-starter's env drives an execution (consistent with env being in the cacheable matching key). A second attacher with different cloud env rides the first client's credentials — acceptable same-user/same-workspace.
- **DTE is a requirement, not a non-issue:** the daemon can be explicitly enabled in CI (`NX_DAEMON=true`); DTE must work under the daemon host.
- Light-client audit (ocean-side) is a named open investigation — see below.

## Execution order (one project, staged internally)

**Stage 0 — engine extraction + daemon error-model inversion.** No behavior change. Justified standalone as paying down CLI-process entanglement (research/02 documents the state currently trapped in the invoking process).

**Stage 1 — daemon host, single client. ⛔ GO/NO-GO GATE.** Behind a flag: CLI submits, daemon executes, output streams over dedicated sockets, TUI renders from the stream. Feature parity for one client; no sharing. Deliberately front-loads the two scariest risks (cross-process TUI quality; Rust TUI rework). **Gate criteria: input-echo latency and render fidelity indistinguishable from today's zero-copy path in dogfooding on this repo.** Fail → stop, keep Stage 0, retreat to broker model (documented fallback in research/03 D1).

**Stage 2 — attach + dedup.** Matching table, refcounted signals, supersede-on-stale, `SharedRunningTask` retired. Headline agent use case lands here.

**Stage 3 — monitor + cloud surfaces.** Monitor client (subscribe to whole pool); branch CIPEs and self-healing fixes when connected; instrumented connect prompts (UTM + background `nx connect`), copy limited to locally-derivable claims.

**Parallel track (due before Stage 1 exits):** ocean light-client audit.

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| TUI-over-socket interactive quality | High | Stage 1 gate; snapshot+delta protocol; tmux as existence proof |
| Dual-host maintenance tax (forever) | High | Engine library with transport-only host delta; CI exercises in-process host daily; dual-host test matrix from Stage 0 |
| Daemon reliability as run-holder | High | Error-model inversion in Stage 0; tasks-die-with-daemon keeps failure semantics simple |
| Light client unsafe in long-lived/concurrent process | Medium | Ocean audit before Stage 1 exit; per-version bundle loading |
| Args canonicalization false-positives | Medium | Bias to false negatives; canonicalizer spec'd + tested standalone |
| macOS child reaping | Medium | Watchdog design (kqueue `EVFILT_PROC`); spike early in Stage 1 |
| Windows (ConPTY + named pipes + no PDEATHSIG) | Medium | Windows PTY already gated (`NX_WINDOWS_PTY_SUPPORT`); keep daemon-execution gated similarly on Windows until parity |
| Behavior-change backlash (lockfile kills runs) | Low | Explicit kill messaging; changelog/docs callout |

Security note: attach implies any same-user process can inject stdin into running tasks via the daemon socket. This matches the existing trust boundary — the daemon already accepts `PROCESS_IN_BACKGROUND` (require-and-run arbitrary modules) from any same-user client.

## Open investigations

1. **Ocean light-client audit:** module-level singletons? env-keyed global state? safety under multiple concurrent runs in one process? lifecycle assumptions (process-exit flushes, `runInBackground` handoffs) under a long-lived host? (Investigable via Polygraph when the project is approved.)
2. **Args canonicalization spec:** normalization rules across executors; interaction with positional args and `--` passthrough.
3. **Snapshot+stream protocol details:** scrollback depth in snapshots; backpressure policy for slow attached clients (drop-oldest vs disconnect).
4. **Graph/hasher consistency:** executions hashed against the daemon's live graph while files change mid-run — pin file-map generation per run submission?
5. **Worktrees:** daemons are per-worktree; `running_tasks` is worktree-local today — confirm sharing scope stays worktree-local.
6. **Monitor UX:** TUI-first vs Nx Console-first; both are just clients of the same attach protocol (as is nx-mcp).

## Measurement

- **Stage 1 gate:** input-echo latency delta vs today (target: indistinguishable; instrumented, not vibes), render-fidelity diff harness on recorded PTY streams.
- **Adoption funnel (Stage 3):** connect-prompt impressions → UTM-attributed clicks → background-connect completions → connected workspaces. Falsifiable revenue claim, reviewed after a quarter of data.
- **Sharing utilization:** attach events per workspace-week; superseded-run counts (proxy for duplicate work eliminated).
