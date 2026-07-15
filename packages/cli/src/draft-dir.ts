import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { isMarkdownDraft } from '@design-drafts/markdown-site';

/**
 * Resolves the draft directory a command should act on: the explicit path when
 * given, otherwise the current working directory. A draft is a directory with
 * a `design-drafts.config.json` — or a markdown-only directory, which is a
 * draft before it ever has a manifest (the first push writes one). Throws
 * otherwise, so callers fail with an actionable message instead of silently
 * operating on a non-draft directory.
 */
export function resolveDraftDir(explicit: string | undefined): string {
  const candidate = resolve(explicit ?? process.cwd());
  // Order matters: a missing directory must fall through to the clean error
  // below, not throw from isMarkdownDraft's directory walk.
  const isDraft =
    existsSync(join(candidate, 'design-drafts.config.json')) ||
    (existsSync(candidate) && isMarkdownDraft(candidate));
  if (!isDraft) {
    throw new Error(
      `No design-drafts.config.json (and no markdown pages) at ${candidate}. Run from inside a draft directory or pass --draft <dir>.`
    );
  }
  return candidate;
}
