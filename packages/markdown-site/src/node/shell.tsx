import { DRAFT_ID_META_NAME } from '@design-drafts/conventions/draft-id';
import type { ComponentChildren } from 'preact';

// Built client chrome, inlined into every page so rendered drafts stay
// self-contained. theme-restore is raw source (not part of the bundle): it
// must run in <head>, before first paint, to avoid a theme flash.
import clientCss from '../../dist/client/page.css?raw';
import clientJs from '../../dist/client/page.js?raw';
import themeRestoreJs from '../client/theme-restore.js?raw';

export interface ShellOptions {
  /** The `<title>`. */
  title: string;
  /** The draft's name, shown as the brand link in the header. */
  siteTitle: string;
  /** Where the brand link points. */
  indexHref: string;
  /**
   * The draft these pages belong to, declared so the annotate overlay can keep
   * one draft's annotations out of another's panel. Undefined for a draft with
   * no manifest name to derive one from.
   */
  draftId?: string;
  /** Set on a duplicate copy of a page: the href of the canonical original. */
  canonicalHref?: string;
  /** Header controls placed before the theme toggle. */
  actions?: ComponentChildren;
  children?: ComponentChildren;
}

/**
 * The chrome every rendered page shares: themed `<head>`, the site header with
 * its brand link and theme toggle, and the inlined client bundle plus the
 * design-drafts overlays. What sits between the header and the scripts is the
 * caller's — a markdown document, or a generated listing of the draft's pages.
 */
export function Shell(opts: ShellOptions) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {opts.draftId ? (
          <meta name={DRAFT_ID_META_NAME} content={opts.draftId} />
        ) : null}
        {opts.canonicalHref ? (
          <link rel="canonical" href={opts.canonicalHref} />
        ) : null}
        <title>{opts.title}</title>
        <script dangerouslySetInnerHTML={{ __html: themeRestoreJs }} />
        <style dangerouslySetInnerHTML={{ __html: clientCss }} />
      </head>
      <body>
        <header class="site-header">
          <a class="site-title" href={opts.indexHref}>
            {opts.siteTitle}
          </a>
          <div class="header-actions">
            {opts.actions}
            <button
              type="button"
              class="theme-toggle"
              aria-label="Toggle color theme"
            >
              ◐ Theme
            </button>
          </div>
        </header>
        {opts.children}
        <script dangerouslySetInnerHTML={{ __html: clientJs }} />

        {/* design-drafts overlays: inert until they have something to do. */}
        <script
          src="https://unpkg.com/@design-drafts/toolbar@0/dist/toolbar.js"
          defer
        />
        <script
          src="https://unpkg.com/@design-drafts/annotate@0/dist/annotate.js"
          defer
        />
      </body>
    </html>
  );
}
