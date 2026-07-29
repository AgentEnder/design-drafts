import { describe, expect, it } from 'vitest';

import {
  pagesBasePath,
  pagesPreviewUrl,
  previewLocationMessage,
} from './github';

describe('pagesBasePath', () => {
  it('maps a project repo to /<repo>/<preview-dir>/', () => {
    expect(pagesBasePath('acme/design-previews', 'drafts/homepage-v2')).toBe(
      '/design-previews/homepage-v2/'
    );
  });

  it('keeps a non-standard branch prefix in the preview directory', () => {
    // The deploy workflow only strips the canonical `drafts/` prefix; any
    // other prefix stays part of the deployed directory name.
    expect(pagesBasePath('acme/previews', 'custom/homepage')).toBe(
      '/previews/custom/homepage/'
    );
  });

  it('omits the repo segment for a user/organization pages repo', () => {
    expect(pagesBasePath('acme/acme.github.io', 'drafts/homepage')).toBe(
      '/homepage/'
    );
  });

  it('matches the user pages repo case-insensitively', () => {
    expect(pagesBasePath('Acme/ACME.github.io', 'drafts/x')).toBe('/x/');
  });
});

describe('pagesPreviewUrl', () => {
  it('puts the default github.io origin in front of the base path', () => {
    expect(pagesPreviewUrl('acme/design-previews', 'drafts/homepage-v2')).toBe(
      'https://acme.github.io/design-previews/homepage-v2/'
    );
  });

  it('drops the repo segment for a user/organization pages repo', () => {
    expect(pagesPreviewUrl('acme/acme.github.io', 'drafts/homepage')).toBe(
      'https://acme.github.io/homepage/'
    );
  });

  it('lower-cases the owner, whose github.io host is canonically lowercase', () => {
    expect(pagesPreviewUrl('AgentEnder/design-drafts', 'drafts/homepage')).toBe(
      'https://agentender.github.io/design-drafts/homepage/'
    );
  });

  it('keeps a non-canonical --prefix in the path', () => {
    // Only `drafts/` is stripped by the deploy workflow, so `--prefix custom/`
    // deploys to a nested directory and the URL has to say so.
    expect(pagesPreviewUrl('acme/previews', 'custom/homepage')).toBe(
      'https://acme.github.io/previews/custom/homepage/'
    );
  });

  it('handles an empty --prefix (branch name is the site name)', () => {
    expect(pagesPreviewUrl('acme/previews', 'homepage')).toBe(
      'https://acme.github.io/previews/homepage/'
    );
  });

  it('hangs the draft off the site root GitHub reported', () => {
    expect(
      pagesPreviewUrl(
        'acme/previews',
        'drafts/homepage',
        'https://acme.github.io/previews/'
      )
    ).toBe('https://acme.github.io/previews/homepage/');
  });

  it('serves a custom domain from its root, without the repo segment', () => {
    // A CNAME moves the site to the domain root, so the `/previews/` segment
    // `pagesBasePath` would add is simply wrong there.
    expect(
      pagesPreviewUrl(
        'acme/previews',
        'drafts/homepage',
        'https://previews.acme.com/'
      )
    ).toBe('https://previews.acme.com/homepage/');
  });

  it('tolerates a site root without a trailing slash', () => {
    expect(
      pagesPreviewUrl('acme/previews', 'drafts/homepage', 'https://previews.acme.com')
    ).toBe('https://previews.acme.com/homepage/');
  });
});

describe('previewLocationMessage', () => {
  it('says the URL is not reachable until the deploy builds, in one line', () => {
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'ok', siteUrl: 'https://acme.github.io/previews/' },
    });
    // The routine case is the payload plus an inline qualifier — nothing else.
    expect(message).toBe(
      'Preview (once built): https://acme.github.io/previews/homepage/'
    );
  });

  it('flags an unconfirmed site root without growing the output', () => {
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'unknown' },
    });
    expect(message).toBe(
      'Preview (once built, unverified): https://acme.github.io/previews/homepage/'
    );
    // The confirmed and unconfirmed forms have to stay distinguishable: the
    // confirmed qualifier must not appear verbatim in the unconfirmed one.
    expect(message).not.toContain('Preview (once built):');
  });

  it('qualifies an unconfirmed URL in a word instead of listing causes', () => {
    // `unknown` is reached by a missing gh, an unauthenticated gh, a repo the
    // token cannot read, or an unreachable GitHub. Enumerating that in the
    // default output is a troubleshooting matrix; `gh auth status` tells the
    // one user who cares.
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'unknown' },
    });
    expect(message).toContain('unverified');
    for (const cause of [
      'not installed',
      'not signed in',
      'no access to the repo',
      'unreachable',
      'custom domain',
    ]) {
      expect(message).not.toContain(cause);
    }
  });

  it('says Pages is off rather than promising a URL that never resolves', () => {
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'not-enabled' },
    });
    expect(message).toContain('GitHub Pages is not enabled on acme/previews');
    // An actionable error, so it carries the remediation command — but the URL
    // it does promise is gated on enabling Pages, not merely on the build.
    expect(message).toContain(
      'gh workflow run deploy-preview.yml -f branch=drafts/homepage --repo acme/previews'
    );
    expect(message).toContain(
      'Preview (once enabled and built): https://acme.github.io/previews/homepage/'
    );
    expect(message).not.toContain('Preview (once built)');
  });

  it('keeps every line short enough that the terminal never has to wrap it', () => {
    // Hard-wrapped prose is the tell that output was written as a document.
    // Every prose line has to be a whole sentence that fits a classic 80-col
    // terminal, so nothing is ever split across lines by hand. URLs and
    // commands are exempt: they are single tokens by nature.
    for (const site of [
      { status: 'ok', siteUrl: 'https://acme.github.io/previews/' },
      { status: 'unknown' },
      { status: 'not-enabled' },
    ] as const) {
      const lines = previewLocationMessage({
        repo: 'acme/previews',
        branchName: 'custom/homepage',
        site,
      }).split('\n');
      for (const line of lines) {
        if (line.includes('http') || line.trim().startsWith('gh ')) continue;
        expect(line.length).toBeLessThanOrEqual(80);
      }
    }
  });

  it('tells a non-drafts branch to dispatch the deploy itself', () => {
    // The workflow's push trigger is scoped to `drafts/**`, so a custom prefix
    // pushes fine and then silently never deploys.
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'custom/homepage',
      site: { status: 'ok', siteUrl: 'https://acme.github.io/previews/' },
    });
    expect(message).toContain(
      'gh workflow run deploy-preview.yml -f branch=custom/homepage --repo acme/previews'
    );
  });
});
