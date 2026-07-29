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
  it('states the URL is not reachable until the deploy builds', () => {
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'ok', siteUrl: 'https://acme.github.io/previews/' },
    });
    expect(message).toContain('Preview will be at:');
    expect(message).toContain('https://acme.github.io/previews/homepage/');
    expect(message).toContain('Not live yet');
    // The caveat gets its own line rather than trailing the URL.
    expect(message.split('\n')[1].trim()).toBe(
      'https://acme.github.io/previews/homepage/'
    );
  });

  it('flags an unconfirmed site root in the header, not just at the end', () => {
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'unknown' },
    });
    expect(message).toContain('https://acme.github.io/previews/homepage/');
    expect(message).toContain('custom domain');
    // The doubt has to be readable before the URL, so the confirmed header
    // must not be reused here.
    expect(message.split('\n')[0]).toBe('Preview will probably be at:');
    expect(message).not.toContain('Preview will be at:');
    // Still says it is not live yet — that caveat is independent of this one.
    expect(message).toContain('Not live yet');
  });

  it('names the whole set of reasons the Pages URL went unconfirmed', () => {
    // `unknown` is reached by a missing gh, an unauthenticated gh, a repo the
    // token cannot read, or an unreachable GitHub — not connectivity alone.
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'unknown' },
    });
    // Collapsed so the assertion tracks the wording, not where it wraps.
    const flat = message.replace(/\s+/g, ' ');
    for (const cause of [
      'not installed',
      'not signed in',
      'no access to the repo',
      'unreachable',
    ]) {
      expect(flat).toContain(cause);
    }
  });

  it('says Pages is off rather than promising a URL that never resolves', () => {
    const message = previewLocationMessage({
      repo: 'acme/previews',
      branchName: 'drafts/homepage',
      site: { status: 'not-enabled' },
    });
    expect(message).toContain('GitHub Pages is not enabled on acme/previews');
    expect(message).not.toContain('Preview will be at:');
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
