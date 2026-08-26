import { render } from 'preact-render-to-string';

import { PageTreeList } from './nav-tree';
import type { PageTreeNode } from './page-tree';
import { Shell } from './shell';

import type { HeadingEntry } from './renderer';

export interface PageSearch {
  /** Relative path from this page's directory back to the draft root. */
  rootPrefix: string;
  /** Absolute path the deployed draft is served under, for result links. */
  basePath: string;
}

export interface PageOptions {
  title: string;
  siteTitle: string;
  indexHref: string;
  bodyHtml: string;
  /** The page's source markdown, embedded so the copy button needs no fetch. */
  markdownSource: string;
  /** Relative href of the page's `.md` source, which ships alongside the
   * rendered html (both in a push and in preview) — the "view raw" link. */
  rawHref: string;
  /** Every page in the draft, grouped by directory (see `buildPageTree`), or
   * null for a single-page draft that has nothing to navigate between. */
  nav: readonly PageTreeNode[] | null;
  toc: readonly HeadingEntry[] | null;
  search: PageSearch | null;
  draftId: string | undefined;
  /**
   * Set on an alias copy of an index page (see `MarkdownPage.aliasPaths`):
   * the href of the canonical page it duplicates. Such a copy is kept out of
   * the search index — Pagefind indexes only pages carrying
   * `data-pagefind-body` once any page has it — so one document never returns
   * two results.
   */
  canonicalHref?: string;
}

function Nav({ nodes }: { nodes: readonly PageTreeNode[] }) {
  return (
    <nav class="pages-nav page-tree" aria-label="Pages">
      <PageTreeList nodes={nodes} />
    </nav>
  );
}

function Toc({ entries }: { entries: readonly HeadingEntry[] }) {
  return (
    <aside class="toc">
      <nav aria-label="On this page">
        <h2 class="toc-title">On this page</h2>
        <ul>
          {entries.map((entry) => (
            <li class={`toc-depth-${entry.depth}`}>
              <a href={`#${entry.id}`}>{entry.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

/* Split button: copy is the default action; the caret reveals the secondary
   one. The checkmark is inline svg — it draws itself in on a successful copy,
   no icon font or request involved. */
function PageActions(opts: PageOptions) {
  return (
    <>
      {opts.search ? (
        <button type="button" class="search-trigger">
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
      ) : null}
      <div class="md-actions">
        <button
          type="button"
          class="copy-markdown"
          aria-label="Copy this page's markdown source"
        >
          <svg
            class="copy-check"
            viewBox="0 0 16 16"
            width="14"
            height="14"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M2.5 8.5l3.5 3.5 7.5-8"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="copy-markdown-label">Copy markdown</span>
        </button>
        <button
          type="button"
          class="md-actions-toggle"
          aria-label="More page actions"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <svg
            viewBox="0 0 10 6"
            width="10"
            height="6"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M1 1l4 4 4-4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div class="md-actions-menu" hidden>
          <a
            class="view-raw"
            href={opts.rawHref}
            aria-label="View this page's raw markdown source"
          >
            View raw
          </a>
        </div>
      </div>
    </>
  );
}

function Page(opts: PageOptions) {
  const pageClass = [
    'page',
    opts.nav ? 'with-nav' : '',
    opts.toc ? 'with-toc' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Shell
      title={opts.title}
      siteTitle={opts.siteTitle}
      indexHref={opts.indexHref}
      draftId={opts.draftId}
      canonicalHref={opts.canonicalHref}
      actions={<PageActions {...opts} />}
    >
      <div class={pageClass}>
        {opts.nav ? <Nav nodes={opts.nav} /> : null}
        <main
          class="markdown-body"
          data-pagefind-body={
            opts.search && !opts.canonicalHref ? true : undefined
          }
          dangerouslySetInnerHTML={{ __html: opts.bodyHtml }}
        />
        {opts.toc ? <Toc entries={opts.toc} /> : null}
      </div>
      {opts.search ? (
        // The search client reads its page-specific config from these data
        // attributes, keeping the bundled script identical on every page.
        <dialog
          class="search-dialog"
          aria-label="Search this draft"
          data-ui-script={`${opts.search.rootPrefix}pagefind/pagefind-ui.js`}
          data-ui-styles={`${opts.search.rootPrefix}pagefind/pagefind-ui.css`}
          data-base-url={opts.search.basePath}
        >
          <div id="dd-search"></div>
        </dialog>
      ) : null}
      {/* Enlarges a clicked content image. Inert until the client wires it,
          and empty until then — the src is set from the image clicked. */}
      <dialog class="lightbox" aria-label="Enlarged image">
        <img class="lightbox-image" alt="" />
        <p class="lightbox-caption" hidden></p>
      </dialog>
      {/* The page's markdown source, for the copy button. JSON with every
          `<` escaped, so no content — not even a literal `</script>` — can
          terminate the element early. */}
      <script
        type="application/json"
        id="dd-markdown-source"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(opts.markdownSource).replace(/</g, '\\u003C'),
        }}
      />
    </Shell>
  );
}

export function renderPage(opts: PageOptions): string {
  return `<!doctype html>\n${render(<Page {...opts} />)}\n`;
}
