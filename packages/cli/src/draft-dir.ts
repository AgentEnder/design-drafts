import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Resolves the draft directory a command should act on: the explicit path when
 * given, otherwise the current working directory. Throws when the resolved
 * directory has no `design-drafts.config.json`, so callers fail with an
 * actionable message instead of silently operating on a non-draft directory.
 */
export function resolveDraftDir(explicit: string | undefined): string {
  const candidate = resolve(explicit ?? process.cwd());
  if (!existsSync(join(candidate, 'design-drafts.config.json'))) {
    throw new Error(
      `No design-drafts.config.json at ${candidate}. Run from inside a draft directory or pass --draft <dir>.`
    );
  }
  return candidate;
}
