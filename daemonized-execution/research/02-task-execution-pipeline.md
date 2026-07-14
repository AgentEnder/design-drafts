# Research: Current Task Execution Pipeline

> Findings from codebase exploration (packages/nx/src/tasks-runner, native pseudo_terminal/tui), 2026-07-14.
> Context for the "task execution in the daemon" proposal ([PROPOSAL.md](../PROPOSAL.md)).

## Invocation → spawn chain (all in the invoking CLI process)

`run-many.ts` / `run-one.ts` / `affected` → `runCommand()` (`tasks-runner/run-command.ts:466`) → task graph creation (`create-task-graph.ts`), sync-generator prompt (TTY-gated), lifecycle selection (`getTerminalOutputLifeCycle`, `run-command.ts:109`) → `invokeTasksRunner` (hasher creation, eager hashing, lifecycle composition) → `defaultTasksRunner` → **`TaskOrchestrator`** (`task-orchestrator.ts:83`).

Orchestrator owns: `DbCache`, `ForkedProcessTaskRunner`, `TasksSchedule`, `RunningTasksService` + `TaskInvocationTracker` (native/DB), in-memory maps of running/completed tasks, coordinator + continuous-task loops. Execution mechanisms: inline `run-commands`, noop, forked process, batch worker, PTY.

**CLI-process state lost if it dies:** graphs, hasher, cache connection, all orchestrator maps, every child handle and PTY, lifecycles (incl. native TUI), patched stdout/stderr/console.

## PTY layer — the attach problem

- `PseudoTerminal` (TS, `pseudo-terminal.ts`) wraps Rust `portable_pty` master/slave (`native/pseudo_terminal/pseudo_terminal.rs`). Reader thread pushes master output to a crossbeam channel; TUI mode feeds a shared `vt100_ctt::Parser`.
- **The attach primitive is `get_parser_and_writer()` → `Arc<RwLock<Parser>>` + writer Arc — shared memory, single process only.** The native TUI (`AppLifeCycle`, `native/tui/lifecycle.rs`) renders by reading the same Arc the reader thread writes. Zero-copy.
- A PTY master cannot be shared across OS processes by path; only fd-passing (SCM_RIGHTS) could move it, and PTY masters are **single-consumer** (each byte delivered to exactly one reader), so fd-sharing cannot support multi-attach fan-out. Windows has no SCM_RIGHTS (would need DuplicateHandle/ConPTY — separate mechanism).
- Conclusion: whoever owns the PTY must be the single reader and the fan-out point. Cross-process attach = snapshot-then-stream protocol over dedicated sockets (tmux architecture).

## Continuous-task "reuse" today is presence-only

- `running_tasks` SQLite table; owner records pid/cmd/cwd (`task-orchestrator.ts:1386`), removes on completion/SIGINT; `Drop` best-effort.
- Second invocation finding a live row gets **`SharedRunningTask`** (`running-tasks/shared-running-task.ts`): polls the DB every 100ms until the row disappears, prints "Waiting for <taskId> in another nx process". **No output, no interaction; `getResults()` throws.** TUI shows status `Shared`.
- When the owner CLI dies, its dev servers die with it (tree-kill on exit). No adoption, no handoff.

## Lifecycles & Nx Cloud integration

- `LifeCycle` hook interface (`life-cycle.ts`); composite of: TUI or dynamic/static renderers, `StoreRunInformationLifeCycle`, `PerformanceLifeCycle`, `TaskTelemetryLifeCycle`, task-history writer, `TaskResultsLifeCycle`.
- Runner selection (`getRunner`, `run-command.ts:1201`): `default-tasks-runner` or `'nx-cloud'` → `nx-cloud-tasks-runner-shell.ts`, which downloads/updates the **light client bundle** outside the repo, then calls `nxCloudClient.nxCloudTasksRunner(...)`; falls back to default runner on failure.
- Remote cache integration: `RemoteCache`/`RemoteCacheV2` interfaces consumed by `DbCache` (`cache.ts`); eager pre-hash at `run-command.ts:1004` feeds Cloud DTE planning.
- **Implication:** the cloud light client is loaded and executes in the CLI process today. Executor model must decide where the light client lives (daemon loads it?) — affects auth, bundle updates, encryption keys, DTE.

## Invocation-context assumptions (all read from CLI process env)

- `process.env`: per-task .env layering (`task-env.ts`), `NX_INVOCATION_ROOT_PID`, `FORCE_COLOR`, `NX_STREAM_OUTPUT`.
- `process.cwd()`: child cwd for PTY forks, run-commands relative cwd, recorded in `running_tasks`.
- TTY: `PseudoTerminal.isSupported` requires `process.stdout.isTTY`; TUI capability from stderr TTY + size; PTY sized from `crossterm terminal::size()`.
- Signals: orchestrator owns SIGINT/SIGTERM/SIGHUP → tree-kill all children (`task-orchestrator.ts:1857`); forked children are detached and only killed explicitly.

**Executor-model consequence:** a run request must ship the full invocation context (env snapshot, cwd, args, TTY/size metadata) to the daemon, and signal semantics must be redefined as client attach/detach protocol events.
