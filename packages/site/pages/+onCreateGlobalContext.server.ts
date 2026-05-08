import { readdirSync, existsSync } from 'node:fs';
import type { GlobalContextServer } from 'vike/types';

export interface BranchEntry {
  name: string;
  path: string;
}

// The deploy-preview workflow stages each prefixed branch (e.g. `drafts/foo`)
// at `<staging>/foo/` — i.e. it strips the configured branch prefix before
// writing to gh-pages. As a result the listing logic here is intentionally
// prefix-agnostic: it surfaces every top-level directory under PAGES_DIR.
// That choice also keeps any pre-existing (un-prefixed) preview directories
// on the deployed gh-pages branch visible during the soft transition.
export async function onCreateGlobalContext(
  context: Partial<GlobalContextServer>
): Promise<void> {
  const pagesDir = process.env.PAGES_DIR;
  console.log(`[design-drafts] scanning PAGES_DIR=${JSON.stringify(pagesDir)}`);

  let branches: BranchEntry[] = [];

  if (!pagesDir) {
    console.log('[design-drafts] PAGES_DIR not set; branches list will be empty');
  } else if (!existsSync(pagesDir)) {
    console.log(`[design-drafts] PAGES_DIR does not exist: ${pagesDir}`);
  } else {
    const entries = readdirSync(pagesDir, { withFileTypes: true });
    console.log(
      `[design-drafts] found ${entries.length} entries in ${pagesDir}:`,
      entries.map((e) => `${e.isDirectory() ? 'd' : 'f'} ${e.name}`)
    );
    branches = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: `/${entry.name}/`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    console.log(
      `[design-drafts] resolved ${branches.length} branch(es):`,
      branches.map((b) => b.name)
    );
  }

  (context as Record<string, unknown>).branches = branches;
}

declare global {
  namespace Vike {
    interface GlobalContextServer {
      branches: BranchEntry[];
    }
    interface GlobalContextClient {
      branches: BranchEntry[];
    }
  }
}
