import { render } from 'preact-render-to-string';

import { PageTreeList } from './nav-tree';
import { buildPageTree } from './page-tree';
import { Shell } from './shell';

export interface ListingEntry {
  /** Root-relative POSIX output path, e.g. `guides/setup.html`. */
  path: string;
  /** What to call it: a markdown page's title, or the file name when the
   * draft is hand-written html and there is no title to read. */
  label: string;
}

export interface ListingPageOptions {
  /** The draft's name, for the header brand link and the document title. */
  siteTitle: string;
  /** Where the brand link points — this page, wherever it is being served. */
  indexHref: string;
  /**
   * Prepended to every entry's `path` to form its href. `/` gives the
   * root-absolute links the preview server needs (it answers the same listing
   * for any index-less directory); `''` gives the relative ones a deployed
   * draft needs under its `/<site>/` base path.
   */
  hrefPrefix: string;
  entries: readonly ListingEntry[];
  draftId?: string;
}

function Listing(opts: ListingPageOptions) {
  const nodes = buildPageTree(
    opts.entries.map((entry) => ({
      path: entry.path,
      href: `${opts.hrefPrefix}${entry.path}`,
      label: entry.label,
    }))
  );
  return (
    <Shell
      title={opts.siteTitle}
      siteTitle={opts.siteTitle}
      indexHref={opts.indexHref}
      draftId={opts.draftId}
    >
      <div class="page">
        <main class="listing">
          <h1>Draft pages</h1>
          {nodes.length ? (
            <>
              <p class="listing-note">
                No <code>index.html</code> here — this draft's pages, as they
                are laid out on disk:
              </p>
              <nav class="listing-tree page-tree" aria-label="Pages">
                {/* Nothing is "current" on a listing, so every folder opens —
                    a wall of collapsed groups would hide the whole point. */}
                <PageTreeList nodes={nodes} expandAll />
              </nav>
            </>
          ) : (
            <p class="listing-empty">No pages found in this draft yet.</p>
          )}
        </main>
      </div>
    </Shell>
  );
}

/**
 * Renders the fallback index shown for a draft directory with no `index.html`
 * of its own: the same themed chrome every rendered page wears, wrapped around
 * a directory tree of everything the draft publishes.
 *
 * The preview server synthesises this per request; `push` bakes it onto disk,
 * because gh-pages serves static files only and an index-less directory 404s
 * there.
 */
export function renderListingPage(opts: ListingPageOptions): string {
  return `<!doctype html>\n${render(<Listing {...opts} />)}\n`;
}
