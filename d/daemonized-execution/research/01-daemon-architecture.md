# Research: Current Daemon Architecture

> Findings from codebase exploration (packages/nx/src/daemon), 2026-07-14.
> Context for the "task execution in the daemon" proposal ([PROPOSAL.md](../PROPOSAL.md)).

## Transport & framing

- Unix domain socket (POSIX) / named pipe `\\.\pipe\nx\` (Windows). Socket dir per-workspace under OS tmp dir (`socket-utils.ts`, `tmp-dir.ts`), overridable via `NX_SOCKET_DIR`. Hard 95-char socket path limit (`socket-utils.ts:41`).
- **Sentinel-delimited framing**, not length-prefixed: messages end with `NX_MSG_END\x04` (`consume-messages-from-socket.ts:5`). Binary-unsafe for bulk PTY output; a raw VT100 stream could contain the sentinel.
- Serialization: JSON by default, optional V8 serializer (`NX_USE_V8_SERIALIZER`), auto-detected per message.
- Project graph transfers as one pre-serialized string; daemon keeps the graph **pre-stringified** in memory and splices it into response envelopes by string concat (`socket-utils.ts:62-71`). Client re-parses the full graph on every request (`client.ts:1267`).
- Dedicated secondary sockets already exist as a pattern: forked-process sockets (`getForkedProcessOsSocketPath`) and plugin-worker sockets.

## Message types handled today (server.ts dispatch, lines 272-483)

Graph/state: `REQUEST_PROJECT_GRAPH`, `GET_NX_WORKSPACE_FILES`, `GET_CONTEXT_FILE_DATA`, `GET_FILES_IN_DIRECTORY`, `GLOB`/`MULTI_GLOB`, `HASH_GLOB`/`HASH_MULTI_GLOB`, `UPDATE_WORKSPACE_CONTEXT`.
Task-adjacent (but **no execution**): `HASH_TASKS` (warm in-daemon `InProcessTaskHasher`), `RECORD_TASK_RUNS` / `GET_FLAKY_TASKS` / `GET_ESTIMATED_TASK_TIMINGS` (task-history DB), `PRE_TASKS_EXECUTION` / `POST_TASKS_EXECUTION` (plugin hooks), `RECORD_OUTPUTS_HASH_BATCH` / `OUTPUTS_HASHES_MATCH_BATCH`.
Infra: `PING`, `PROCESS_IN_BACKGROUND` (requires arbitrary module and runs it in-daemon — note: existing arbitrary-code surface), `REQUEST_SHUTDOWN` / `FORCE_SHUTDOWN`, `REGISTER_FILE_WATCHER`, `REGISTER_PROJECT_GRAPH_LISTENER`, sync-generator handlers, Nx Console / AI-agents config handlers.

**The daemon runs zero task processes today.** Grep for `TaskOrchestrator|RunningTasksService` in `daemon/` returns nothing.

## Lifecycle

- Lazily spawned by the client as a detached, unref'd process (`client.ts:1343`); writes `server-process.json` (pid, socket, nxVersion).
- Shutdown triggers, all of which become **catastrophic mid-run** under an executor model:
  - nx version mismatch → shuts down (20ms poll, `server.ts:696-726`).
  - Lockfile hash change → self-restart (`handleServerProcessTerminationWithRestart`).
  - 3h inactivity timeout (`SERVER_INACTIVITY_TIMEOUT_MS`), skipped while watcher/listener sockets registered.
  - **Any unexpected handler error → `process.exit(1)`** (`shutdown-utils.ts:188-213`). Crash-and-be-reborn is the *designed* reliability strategy.
  - Watcher error → poisoned state, every request errors and exits.
- Disabled when (`client.ts:217-262`): version mismatch; `(isCI() || isDocker() || isSandbox()) && NX_DAEMON !== 'true'`; `disabled` marker file; no nx.json; `NX_DAEMON=false`; WASM. (Note: the `isSandbox()` condition is on its way out — active work is enabling the daemon in sandboxed environments, so the proposal treats only CI/docker as daemon-disabled.)
- One daemon per workspace; **git worktrees get their own daemon** but share the main DB (except `running_tasks`, which is worktree-local via `getLocalDbConnection`, `db-connection.ts:53-64`).

## State

- In-memory: cached serialized graph + source maps, file map, warm task hasher, native file/output watchers, sync-generator cache, plugin workers, listener sockets.
- On-disk SQLite (rusqlite, `native/db/`): `task_history`, `task_details`, `task_invocations`, `running_tasks` (task_id PK, pid, command, cwd).
- `running_tasks` is written **directly by the client-side orchestrator**, not the daemon (`task-orchestrator.ts:98`); liveness = pid alive + cmdline/cwd match via sysinfo; `Drop` impl best-effort cleans rows.

## Failure handling / fallback

- Client reconnects and resends in-flight messages on socket close; 60s availability wait; 20-min per-message timeout.
- Everywhere the daemon is disabled/unavailable, graph construction and hashing fall back to in-process. This fallback is load-bearing (all of CI).

## Implications for the proposal

1. The daemon's error model (exit on any unexpected error) must be inverted (isolate/recover/never-exit) before it can hold live child processes. This is a rewrite of its reliability posture, not an add-on.
2. Bulk task IO cannot ride the existing sentinel-framed JSON socket. Dedicated per-run raw sockets required (precedent exists: forked-process sockets).
3. Version-mismatch/lockfile/inactivity shutdown triggers need redefinition (decision: they kill in-flight tasks too — see decisions log).
4. `running_tasks` (worktree-local, client-written) is the mechanism the executor model subsumes.
