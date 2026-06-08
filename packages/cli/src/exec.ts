import { execSync } from 'node:child_process';

/** Runs a command, streaming its output to the user's terminal. Throws on a
 * non-zero exit. */
export function exec(command: string, cwd: string): void {
  execSync(command, { cwd, stdio: 'inherit' });
}

/** Runs a command and returns its trimmed stdout, or undefined if it fails or
 * produces no output. Stderr is suppressed — callers use this to probe state
 * (does this tag exist? is gh authed?) where failure is an expected answer. */
export function capture(command: string, cwd: string): string | undefined {
  try {
    const out = execSync(command, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    const trimmed = out.toString('utf-8').trim();
    return trimmed || undefined;
  } catch {
    return undefined;
  }
}

/** True when the command exits zero. */
export function succeeds(command: string, cwd: string): boolean {
  try {
    execSync(command, { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
