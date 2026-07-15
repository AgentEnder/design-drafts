import { readdirSync, readFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

/** A markdown source file and the html page it renders to, both as
 * draft-root-relative POSIX paths. */
export interface MarkdownPage {
  sourcePath: string;
  outputPath: string;
  /** First heading in the document, falling back to the filename stem. */
  title: string;
  /**
   * Extra paths the page is also written to. A doc that renders as its
   * directory's `index.html` (a README, or one designated via `indexSource`)
   * gets an alias at the name it would otherwise have had — `notes.md` renders
   * to `index.html` AND `notes.html` — because a relative `[see](notes.md)`
   * elsewhere in the draft rewrites to `notes.html`, which must resolve.
   * Empty for an ordinary page (and for `index.md`, already at its own name).
   */
  aliasPaths: string[];
}

// Directories that never contain draft pages: dependency trees and the
// references/ convention directory (reviewer-facing briefs and links — see
// docs/conventions/references-protocol.md). Dot-directories (.git, .github,
// .hidden caches) are skipped separately by name prefix.
const SKIPPED_DIRS = new Set(['node_modules', 'references']);

function walkFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || SKIPPED_DIRS.has(entry.name)) continue;
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        files.push(relative(dir, abs).split(sep).join('/'));
      }
    }
  };
  walk(dir);
  return files;
}

function isMarkdown(path: string): boolean {
  return /\.md$/i.test(path);
}

function isHtml(path: string): boolean {
  return /\.html?$/i.test(path);
}

/**
 * A directory is a markdown draft when it holds at least one `.md` file and no
 * `.html` pages (ignoring node_modules and dot-directories). Any hand-written
 * html means the author is building a classic draft, and its markdown files
 * (briefs, notes, references) must not be turned into pages behind their back.
 */
export function isMarkdownDraft(dir: string): boolean {
  const files = walkFiles(dir);
  return files.some(isMarkdown) && !files.some(isHtml);
}

function firstHeading(markdown: string): string | undefined {
  const match = markdown.match(/^#{1,6}\s+(.+?)\s*#*\s*$/m);
  return match?.[1];
}

export interface CollectMarkdownPagesOptions {
  /**
   * Root-relative markdown source explicitly chosen to render as the draft's
   * `index.html`, overriding the README convention (README.md then falls back
   * to README.html). Ignored when it matches no page.
   */
  indexSource?: string;
}

/** GitHub's README convention: a directory's README.md is its index page —
 * unless the author wrote an explicit index.md, or the caller designated a
 * different doc as the draft index. */
function outputPathFor(
  sourcePath: string,
  sources: readonly string[],
  indexSource: string | undefined
): string {
  if (indexSource !== undefined) {
    if (sourcePath === indexSource) return 'index.html';
    // A designated index displaces the root README convention only; nested
    // READMEs keep being their directory's index.
    if (/^readme\.md$/i.test(sourcePath)) return sourcePath.replace(/\.md$/i, '.html');
  }
  const dirname = posix.dirname(sourcePath);
  const basename = posix.basename(sourcePath);
  if (/^readme\.md$/i.test(basename)) {
    const siblingIndex = posix.join(dirname, 'index.md');
    if (!sources.some((s) => s.toLowerCase() === siblingIndex.toLowerCase())) {
      return posix.join(dirname, 'index.html');
    }
  }
  return sourcePath.replace(/\.md$/i, '.html');
}

/**
 * Collects every markdown page beneath `dir` with its output path and title,
 * index page first and then alphabetical, so callers get a stable page order
 * for navs and listings.
 */
export function collectMarkdownPages(
  dir: string,
  options: CollectMarkdownPagesOptions = {}
): MarkdownPage[] {
  const sources = walkFiles(dir).filter(isMarkdown);
  // An indexSource naming a missing file (stale manifest entry) falls back to
  // the conventions rather than leaving the draft indexless.
  const indexSource = sources.includes(options.indexSource ?? '')
    ? options.indexSource
    : undefined;
  const pages = sources.map((sourcePath): MarkdownPage => {
    const markdown = readFileSync(join(dir, sourcePath), 'utf-8');
    const outputPath = outputPathFor(sourcePath, sources, indexSource);
    // The path this doc would render to if it weren't an index. When they
    // differ, both are written so links either way resolve.
    const naturalPath = sourcePath.replace(/\.md$/i, '.html');
    return {
      sourcePath,
      outputPath,
      aliasPaths: naturalPath === outputPath ? [] : [naturalPath],
      title:
        firstHeading(markdown) ?? posix.basename(sourcePath).replace(/\.md$/i, ''),
    };
  });
  return pages.sort((a, b) => {
    if (a.outputPath === 'index.html') return -1;
    if (b.outputPath === 'index.html') return 1;
    return a.outputPath.localeCompare(b.outputPath);
  });
}
