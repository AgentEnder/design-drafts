import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import { DEPLOY_WORKFLOW, DRAFT_INDEX_HTML, HOST_MARKER } from './templates';

describe('DEPLOY_WORKFLOW', () => {
  // The workflow is a hand-written template string with escaped `${{ }}`
  // expressions — easy to break silently. Parse it as real YAML and assert the
  // deploy-pages contract so a bad edit fails here, not on a public user's repo.
  const doc = parse(DEPLOY_WORKFLOW) as {
    jobs: Record<string, { permissions?: Record<string, string>; needs?: string; steps: unknown[] }>;
  };

  it('is valid YAML with build and deploy jobs', () => {
    expect(Object.keys(doc.jobs).sort()).toEqual(['build', 'deploy']);
  });

  it('carries the host marker for idempotency detection', () => {
    expect(DEPLOY_WORKFLOW).toContain(HOST_MARKER);
  });

  it('gives deploy the permissions actions/deploy-pages requires', () => {
    expect(doc.jobs.deploy.needs).toBe('build');
    expect(doc.jobs.deploy.permissions).toMatchObject({
      pages: 'write',
      'id-token': 'write',
    });
  });

  it('lets the build job write to gh-pages (the preview store)', () => {
    expect(doc.jobs.build.permissions).toMatchObject({ contents: 'write' });
  });

  it('uploads then deploys the Pages artifact', () => {
    expect(DEPLOY_WORKFLOW).toContain('actions/upload-pages-artifact');
    expect(DEPLOY_WORKFLOW).toContain('actions/deploy-pages@v4');
  });
});

describe('DRAFT_INDEX_HTML', () => {
  it('is a complete HTML document', () => {
    expect(DRAFT_INDEX_HTML).toContain('<!doctype html>');
    expect(DRAFT_INDEX_HTML.trimEnd()).toMatch(/<\/html>$/);
  });

  // The scaffold ships the design-drafts overlays so a fresh draft has the
  // axis switcher and review overlay without any wiring. Pin the major (@0)
  // to match the package READMEs' recommended CDN reference.
  it('loads the toolbar overlay from the CDN, pinned to a major', () => {
    expect(DRAFT_INDEX_HTML).toContain(
      'https://unpkg.com/@design-drafts/toolbar@0/dist/toolbar.js'
    );
  });

  it('loads the annotate overlay from the CDN, pinned to a major', () => {
    expect(DRAFT_INDEX_HTML).toContain(
      'https://unpkg.com/@design-drafts/annotate@0/dist/annotate.js'
    );
  });

  it('defers both overlay scripts so they never block the draft render', () => {
    const deferred =
      DRAFT_INDEX_HTML.match(/<script[^>]*\bdefer\b[^>]*><\/script>/g) ?? [];
    expect(deferred).toHaveLength(2);
  });
});
