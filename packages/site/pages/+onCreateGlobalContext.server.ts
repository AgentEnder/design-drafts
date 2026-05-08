import { readdirSync, existsSync } from 'node:fs';
import type { GlobalContextServer } from 'vike/types';

export interface BranchEntry {
  name: string;
  path: string;
  pullRequestUrl?: string;
  pullRequestNumber?: number;
}

// Environment-variable contract consumed by this build step:
//   PAGES_DIR              — directory whose top-level subdirectories become
//                            preview entries on the index.
//   DESIGN_DRAFTS_PREFIX   — branch prefix used when querying GitHub for the
//                            corresponding PR (default: "drafts/").
//   DESIGN_DRAFTS_REPO     — "owner/repo" used for the GitHub API lookup. In
//                            CI this is set from `${{ github.repository }}`;
//                            unset locally means PR lookups are skipped.
//   GITHUB_TOKEN           — token used to authenticate the lookup. Missing
//                            locally is fine — we just skip and log.

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
    const baseEntries: BranchEntry[] = entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => ({
        name: entry.name,
        path: `/${entry.name}/`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    branches = await enrichWithPullRequests(baseEntries);

    console.log(
      `[design-drafts] resolved ${branches.length} branch(es):`,
      branches.map((b) =>
        b.pullRequestNumber ? `${b.name} (PR #${b.pullRequestNumber})` : b.name
      )
    );
  }

  (context as Record<string, unknown>).branches = branches;
}

interface PullRequestLookupConfig {
  owner: string;
  repo: string;
  prefix: string;
  token: string;
}

function resolvePullRequestLookupConfig(): PullRequestLookupConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const repoSlug = process.env.DESIGN_DRAFTS_REPO || process.env.GITHUB_REPOSITORY;
  const prefix = process.env.DESIGN_DRAFTS_PREFIX ?? 'drafts/';

  if (!token) {
    console.log(
      '[design-drafts] GITHUB_TOKEN not set; skipping PR lookups'
    );
    return null;
  }

  if (!repoSlug) {
    console.log(
      '[design-drafts] DESIGN_DRAFTS_REPO/GITHUB_REPOSITORY not set; skipping PR lookups'
    );
    return null;
  }

  const [owner, repo] = repoSlug.split('/');
  if (!owner || !repo) {
    console.log(
      `[design-drafts] DESIGN_DRAFTS_REPO is malformed (${repoSlug}); skipping PR lookups`
    );
    return null;
  }

  return { owner, repo, prefix, token };
}

async function enrichWithPullRequests(
  entries: BranchEntry[]
): Promise<BranchEntry[]> {
  const config = resolvePullRequestLookupConfig();
  if (!config) {
    return entries;
  }

  return Promise.all(
    entries.map(async (entry) => {
      const pr = await lookupPullRequest(entry.name, config);
      if (!pr) return entry;
      return {
        ...entry,
        pullRequestUrl: pr.htmlUrl,
        pullRequestNumber: pr.number,
      };
    })
  );
}

interface PullRequestSummary {
  htmlUrl: string;
  number: number;
}

async function lookupPullRequest(
  draftName: string,
  config: PullRequestLookupConfig
): Promise<PullRequestSummary | null> {
  const branch = `${config.prefix}${draftName}`;
  const head = `${config.owner}:${branch}`;
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/pulls?head=${encodeURIComponent(
    head
  )}&state=all&per_page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'design-drafts-site',
      },
    });

    if (!response.ok) {
      console.warn(
        `[design-drafts] PR lookup for ${branch} failed: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = (await response.json()) as
      | Array<{ html_url?: string; number?: number }>
      | undefined;

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const [first] = data;
    if (!first?.html_url || typeof first.number !== 'number') {
      return null;
    }

    return { htmlUrl: first.html_url, number: first.number };
  } catch (error) {
    console.warn(
      `[design-drafts] PR lookup for ${branch} threw:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
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
