import { describe, expect, it } from 'vitest';

import { pagesBasePath } from './github';

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
