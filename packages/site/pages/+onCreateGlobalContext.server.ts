import { readdirSync, existsSync } from 'node:fs';
import type { GlobalContextServer } from 'vike/types';

export interface BranchEntry {
  name: string;
  path: string;
}

export async function onCreateGlobalContext(
  context: Partial<GlobalContextServer>
): Promise<void> {
  const pagesDir = process.env.PAGES_DIR;

  let branches: BranchEntry[] = [];

  if (pagesDir && existsSync(pagesDir)) {
    const entries = readdirSync(pagesDir, { withFileTypes: true });
    branches = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: `/${entry.name}/`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
