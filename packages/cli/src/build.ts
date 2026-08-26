import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

import {
  buildSearchIndex,
  collectMarkdownPages,
  isMarkdownDraft,
  renderMarkdownSite,
} from '@design-drafts/markdown-site';

import { CONFIG_FILENAME, DEFAULT_PREFIX } from './config';
import { CliError } from './errors';
import { pagesBasePath } from './github';
import { resolveMarkdownIndex } from './markdown-index';
import { collectHtmlPages, ensureDraftIndex } from './preview';
import {
  persistSiteNameToManifest,
  readManifestName,
  resolveSiteName,
} from './site-config';
import { validateSiteName } from './site-name';
import { validateRepo } from './validate';

export interface RenderStagedDraftOptions {
  /** The draft's slug — its branch, its deploy directory, and the draft id
   * every page declares so annotations survive the trip to gh-pages. */
  siteName: string;
  /** The draft's human-readable name, shown as the header on any page that has
   * no title of its own. Falls back to the slug. */
  displayName?: string;
  /** Root-relative markdown source designated as the draft's index. */
  indexSource?: string;
  /** Absolute path the built site will be served under, so search result links
   * resolve there (`/` when it is served from a root). */
  basePath: string;
}

/**
 * Turns a staged copy of a draft into the site a deploy would serve: markdown
 * rendered into browsable pages, a Pagefind index built beside them, and a
 * generated listing baked in for a draft that ships no index of its own.
 *
 * It works on a copy rather than the draft itself because rendering writes html
 * next to the sources, which is exactly what makes a directory stop looking
 * like a markdown draft. `push` stages into a tmpdir it then commits; `build`
 * stages into a tmpdir it then copies to `--out`.
 */
export async function renderStagedDraft(
  stageDir: string,
  options: RenderStagedDraftOptions
): Promise<void> {
  const { siteName, indexSource, basePath } = options;
  const site = {
    siteName: options.displayName ?? siteName,
    draftId: siteName,
    indexSource,
  };
  // Captured before rendering (which makes the dir no longer markdown-only):
  // the alias copies of index pages, so the baked listing below — used when
  // the draft has no index of its own — never lists a document twice.
  const aliasPaths = isMarkdownDraft(stageDir)
    ? collectMarkdownPages(stageDir, { indexSource }).flatMap(
        (page) => page.aliasPaths
      )
    : [];

  // A draft that is just markdown (no html at all) gets rendered into a
  // browsable site: one themed, GFM-rendered html page per .md file, with
  // README.md becoming index.html. Classic html drafts are left untouched.
  if (renderMarkdownSite(stageDir, { ...site, search: { basePath } })) {
    console.log('Rendered markdown pages into a browsable site.');
    if (await buildSearchIndex(stageDir)) {
      console.log(`Search enabled (results resolve under ${basePath}).`);
    } else {
      // Strip the search wiring so pages never reference a missing bundle.
      renderMarkdownSite(stageDir, site);
    }
  }

  ensureDraftIndex(stageDir, {
    exclude: aliasPaths,
    siteName: site.siteName,
    draftId: siteName,
  });
}

/**
 * Refuses an `--out` that overlaps the draft.
 *
 * Writing the build inside the draft leaves html sitting next to the markdown
 * sources, and a directory with any html in it is a hand-written html draft by
 * definition (`isMarkdownDraft`) — so the *next* preview or push would stop
 * rendering the markdown and ship the previous build instead. The reverse
 * overlap is worse: `--out` is emptied before it is written, and an out dir
 * containing the draft would take the sources with it.
 */
function assertSeparateDirs(sourcePath: string, outDir: string): void {
  const contains = (parent: string, child: string): boolean => {
    const rel = relative(parent, child);
    return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
  };
  if (contains(sourcePath, outDir)) {
    throw new CliError(
      `--out ${outDir} is inside the draft at ${sourcePath}.\n` +
        `A build left there would make the next preview or push read this draft ` +
        `as hand-written html and ship the old build instead.\n` +
        `Pick a directory outside the draft.`
    );
  }
  if (contains(outDir, sourcePath)) {
    throw new CliError(
      `--out ${outDir} contains the draft at ${sourcePath}, and the build ` +
        `replaces everything in --out.\nPick a directory that does not hold the draft.`
    );
  }
}

/** Leading and trailing slashes, so a hand-written `--base previews/x` lands
 * where a deploy path would. */
function normalizeBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`;
}

interface ResolvedBasePath {
  basePath: string;
  /** How we arrived at it, for the line the build prints. */
  reason: string;
}

/**
 * Where the built site will be served from, which is the one thing a build
 * cannot infer from the draft: it decides the search result links.
 *
 * An explicit `--base` wins. Failing that, a configured `--repo` reproduces
 * exactly what a push would bake, so `build` and `push` agree by default for
 * anyone who has pushed before. With neither, the site is assumed to be served
 * from a root.
 */
function resolveBasePath(
  base: string | undefined,
  repo: string | undefined,
  branchName: string
): ResolvedBasePath {
  if (base !== undefined) {
    return { basePath: normalizeBasePath(base), reason: '--base' };
  }
  if (repo && validateRepo(repo).ok) {
    return {
      basePath: pagesBasePath(repo, branchName),
      reason: `the GitHub Pages path for ${repo} (pass --base to override)`,
    };
  }
  return {
    basePath: '/',
    reason: 'the server root (pass --base or --repo for a deploy sub-path)',
  };
}

export interface BuildOptions {
  /** Draft directory to build (default `.`). */
  path?: string;
  /** Directory to write the built site into. Required — there is no default
   * that is safe to guess, because the obvious ones sit inside the draft. */
  out?: string;
  base?: string;
  siteName?: string;
  repo?: string;
  prefix?: string;
  /** Replace the contents of a non-empty `--out`. */
  force?: boolean;
}

/**
 * Produces exactly the site content `push` would put on a draft branch, in a
 * directory of your choosing — no git, no remote, no GitHub.
 *
 * The one thing it does not reproduce is the deploy workflow `push` embeds in
 * the branch: that is how the branch gets deployed, not part of the site, and
 * the deploy strips it back out before publishing.
 */
export async function build(options: BuildOptions): Promise<void> {
  const sourcePath = resolve(options.path ?? '.');
  if (!existsSync(sourcePath)) {
    throw new CliError(`Path does not exist: ${sourcePath}`);
  }
  if (!options.out) {
    throw new CliError(
      'design-drafts build requires --out <dir>: the directory to write the built site into.'
    );
  }
  const outDir = resolve(options.out);
  assertSeparateDirs(sourcePath, outDir);
  if (existsSync(outDir) && readdirSync(outDir).length > 0 && !options.force) {
    throw new CliError(
      `${outDir} is not empty.\n` +
        `Re-run with --force to replace its contents, or point --out somewhere empty.`
    );
  }

  const manifestPath = join(sourcePath, CONFIG_FILENAME);
  const { siteName, fromPrompt } = await resolveSiteName(
    options.siteName,
    manifestPath
  );
  const validation = validateSiteName(siteName);
  if (!validation.ok) {
    throw new CliError(
      `Invalid site-name "${siteName}": ${validation.reason}` +
        (validation.suggestion ? `\nTry: ${validation.suggestion}` : '')
    );
  }
  // Same reasoning as push: a name we had to ask for is the draft's own, so it
  // belongs in the draft's manifest rather than being asked for again.
  if (fromPrompt) {
    persistSiteNameToManifest(manifestPath, siteName, new Date().toISOString());
    console.log(`Saved site-name "${siteName}" to ${CONFIG_FILENAME}`);
  }

  const branchName = `${options.prefix ?? DEFAULT_PREFIX}${siteName}`;
  const { basePath, reason } = resolveBasePath(
    options.base,
    options.repo,
    branchName
  );

  // Which markdown doc becomes index.html — may prompt, so it runs against the
  // source dir (where the answer is persisted) before anything is copied.
  const indexSource = await resolveMarkdownIndex(sourcePath, manifestPath);

  const stageDir = mkdtempSync(join(tmpdir(), 'design-drafts-build-'));
  try {
    // Same exclusion as push: a markdown-only folder is often a git repo root,
    // and its history has no business in the built site.
    cpSync(sourcePath, stageDir, {
      recursive: true,
      filter: (src) => !src.split(sep).includes('.git'),
    });
    await renderStagedDraft(stageDir, {
      siteName,
      displayName: readManifestName(manifestPath),
      indexSource,
      basePath,
    });

    // Replace rather than merge: a stale page from a previous build that no
    // longer has a source would otherwise sit there looking current.
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    cpSync(stageDir, outDir, { recursive: true });
  } finally {
    rmSync(stageDir, { recursive: true, force: true });
  }

  const pageCount = collectHtmlPages(outDir).length;
  console.log(
    `\nBuilt ${pageCount} page${pageCount === 1 ? '' : 's'} into ${outDir}`
  );
  console.log(`Links resolve under ${basePath} — ${reason}.`);
}
