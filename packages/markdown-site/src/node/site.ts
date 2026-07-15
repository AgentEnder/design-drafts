import { readFileSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';

import { collectMarkdownPages, isMarkdownDraft, type MarkdownPage } from './draft-scan';
import { renderDocument } from './renderer';
import { renderPage } from './page';

export interface RenderMarkdownSiteOptions {
  /** Used for the header when the draft has no index page title of its own. */
  siteName?: string;
  /**
   * The draft these pages belong to, declared in every page's `<head>` so the
   * annotate overlay can keep one draft's annotations out of another's panel.
   * It is the site-name slug (see `resolveDraftId`); omit it for a draft that
   * has no manifest name to derive one from.
   */
  draftId?: string;
  /**
   * Wires a Pagefind search box into every page. `basePath` is the absolute
   * path the deployed draft is served under (e.g. `/previews/my-docs/`), so
   * search result links resolve on gh-pages. The caller is responsible for
   * building the `pagefind/` bundle after the pages are written.
   */
  search?: { basePath: string };
  /**
   * Root-relative markdown source chosen to render as `index.html` when the
   * draft has no README.md/index.md of its own (see
   * `CollectMarkdownPagesOptions`).
   */
  indexSource?: string;
}

function renderSitePage(
  dir: string,
  page: MarkdownPage,
  pages: readonly MarkdownPage[],
  options: RenderMarkdownSiteOptions,
  /** When rendering one of `page.aliasPaths` rather than its `outputPath`. */
  aliasPath?: string
): string {
  const indexPage = pages.find((p) => p.outputPath === 'index.html');
  const siteTitle = indexPage?.title ?? options.siteName ?? 'Draft preview';
  const markdown = readFileSync(join(dir, page.sourcePath), 'utf-8');
  // An alias sits in the same directory as the page it copies, so every
  // relative link in the rendered page resolves identically from either path.
  const renderedPath = aliasPath ?? page.outputPath;
  const fromDir = posix.dirname(renderedPath);
  const toRoot = posix.relative(fromDir, '.');
  const nav =
    pages.length > 1
      ? pages.map((other) => ({
          href: posix.relative(fromDir, other.outputPath),
          label: other.title,
          current: other === page,
        }))
      : null;
  const { html: bodyHtml, headings } = renderDocument(markdown);
  // The h1 is the page title; h4+ is too deep to navigate by. A single entry
  // isn't a table of contents, so the toc only appears from two sections up.
  const sections = headings.filter((h) => h.depth === 2 || h.depth === 3);
  return renderPage({
    title: page.title,
    siteTitle,
    indexHref: posix.relative(fromDir, 'index.html') || 'index.html',
    bodyHtml,
    markdownSource: markdown,
    // The .md source ships next to its rendered page, so a relative href works
    // in preview and under any deploy base path alike.
    rawHref: posix.relative(fromDir, page.sourcePath),
    nav,
    draftId: options.draftId,
    canonicalHref: aliasPath
      ? posix.relative(fromDir, page.outputPath)
      : undefined,
    toc: sections.length >= 2 ? sections : null,
    search: options.search
      ? {
          rootPrefix: toRoot ? `${toRoot}/` : '',
          basePath: options.search.basePath,
        }
      : null,
  });
}

/**
 * Renders every markdown file in a markdown-only draft directory into a
 * standalone html page next to its source: GitHub-flavored rendering, light and
 * dark themes with a persisted toggle, highlighted code, and (for multi-page
 * drafts) a nav listing every page. README.md becomes index.html so the draft
 * root resolves on gh-pages. Returns false — writing nothing — when the
 * directory is not a markdown draft.
 */
export function renderMarkdownSite(
  dir: string,
  options: RenderMarkdownSiteOptions = {}
): boolean {
  if (!isMarkdownDraft(dir)) return false;

  const pages = collectMarkdownPages(dir, { indexSource: options.indexSource });
  for (const page of pages) {
    writeFileSync(join(dir, page.outputPath), renderSitePage(dir, page, pages, options));
    // A doc that renders as an index is also written under its own name, so
    // relative links pointing at it (`[see](notes.md)` → `notes.html`) resolve.
    for (const aliasPath of page.aliasPaths) {
      writeFileSync(
        join(dir, aliasPath),
        renderSitePage(dir, page, pages, options, aliasPath)
      );
    }
  }
  return true;
}

/**
 * Renders the single markdown page whose output is `outputPath` (a draft-root-
 * relative POSIX path like `guides/setup.html`), without writing anything —
 * the preview server uses this to serve markdown drafts on the fly, byte-for-
 * byte identical to what a push would bake. Returns null when the directory is
 * not a markdown draft or no page renders to that path.
 */
export function renderMarkdownPageAt(
  dir: string,
  outputPath: string,
  options: RenderMarkdownSiteOptions = {}
): string | null {
  if (!isMarkdownDraft(dir)) return null;
  const pages = collectMarkdownPages(dir, { indexSource: options.indexSource });
  const page = pages.find((p) => p.outputPath === outputPath);
  if (page) return renderSitePage(dir, page, pages, options);
  // Alias paths (an index page under its own name) render on the fly too, so
  // preview resolves the same links a pushed draft does.
  const aliased = pages.find((p) => p.aliasPaths.includes(outputPath));
  if (!aliased) return null;
  return renderSitePage(dir, aliased, pages, options, outputPath);
}
