import { execSync } from 'node:child_process';

/** Runs a command, streaming its output to the user's terminal. Throws on a
 * non-zero exit. */
export function exec(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: 'inherit' });
}

/**
 * Runs a command and returns its trimmed stdout, or undefined if it fails or
 * produces no output. Stderr is suppressed — callers use this to probe state
 * (does this tag exist? is gh authed?) where failure is an expected answer.
 *
 * `timeoutMs` is opt-in rather than a default because these helpers are pointed
 * at two very different kinds of command: instant local ones (`git config`,
 * `git rev-parse`) that would never benefit, and long-but-legitimate remote
 * ones (`gh repo create --push`, `git push`) that a default would break. Only a
 * caller knows which it is. A timed-out command lands in the same
 * failure-is-an-answer bucket as any other non-zero exit.
 */
export function capture(
  command: string,
  cwd: string,
  timeoutMs?: number
): string | undefined {
  try {
    const out = execSync(command, {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: timeoutMs,
    });
    const trimmed = out.toString('utf-8').trim();
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

/** True when the command exits zero. See `capture` on `timeoutMs`. */
export function succeeds(
  command: string,
  cwd: string,
  timeoutMs?: number
): boolean {
  try {
    execSync(command, { cwd, stdio: 'ignore', timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}
