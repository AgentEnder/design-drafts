import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeScaffold } from './host';
import { HOST_MARKER } from './templates';

// Builds a minimal stand-in for a sparse checkout of the canonical repo so the
// scaffold writer can be exercised offline (no network, no git, no gh).
function makeCheckout(): string {
  const checkout = mkdtempSync(join(tmpdir(), 'dd-checkout-'));
  const siteDir = join(checkout, 'packages', 'site');
  mkdirSync(join(siteDir, 'pages'), { recursive: true });

  writeFileSync(
    join(checkout, 'pnpm-workspace.yaml'),
    ['catalog:', '  react: ^19.2.3', '  vike: ^0.4.256'].join('\n') + '\n'
  );
  writeFileSync(
    join(checkout, 'tsconfig.base.json'),
    JSON.stringify({ compilerOptions: { strict: true, target: 'ES2022' } })
  );
  // Cone-mode sparse checkout also materialises the root package.json, which
  // writeScaffold reads to carry `packageManager` into the standalone host.
  writeFileSync(
    join(checkout, 'package.json'),
    JSON.stringify({ name: 'root', packageManager: 'pnpm@10.33.0' })
  );
  writeFileSync(
    join(siteDir, 'package.json'),
    JSON.stringify({
      name: '@design-drafts/site',
      dependencies: { react: 'catalog:' },
      devDependencies: { vike: 'catalog:' },
      nx: { name: 'site' },
    })
  );
  writeFileSync(
    join(siteDir, 'vite.config.ts'),
    "export default { base: '/design-drafts/' };\n"
  );
  writeFileSync(
    join(siteDir, 'tsconfig.json'),
    JSON.stringify({
      extends: '../../tsconfig.base.json',
      compilerOptions: { jsx: 'react-jsx' },
    })
  );
  writeFileSync(join(siteDir, 'pages', '+Page.tsx'), 'export default () => null;\n');
  return checkout;
}

describe('writeScaffold', () => {
  let checkout: string;
  let target: string;

  beforeEach(() => {
    checkout = makeCheckout();
    target = mkdtempSync(join(tmpdir(), 'dd-host-'));
  });

  afterEach(() => {
    rmSync(checkout, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
  });

  it('promotes the site to the host root with catalog versions resolved', () => {
    writeScaffold(checkout, target, 'my-org/my-drafts');

    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf-8'));
    expect(pkg.dependencies).toEqual({ react: '^19.2.3' });
    expect(pkg.devDependencies).toEqual({ vike: '^0.4.256' });
    expect(pkg.nx).toBeUndefined();
    // packageManager carried over so pnpm/action-setup works on first deploy.
    expect(pkg.packageManager).toBe('pnpm@10.33.0');
  });

  it('rewrites the vite base to the host repo name', () => {
    writeScaffold(checkout, target, 'my-org/my-drafts');
    expect(readFileSync(join(target, 'vite.config.ts'), 'utf-8')).toContain(
      "base: '/my-drafts/'"
    );
  });

  it('inlines the base tsconfig and drops extends', () => {
    writeScaffold(checkout, target, 'org/repo');
    const ts = JSON.parse(readFileSync(join(target, 'tsconfig.json'), 'utf-8'));
    expect(ts.extends).toBeUndefined();
    expect(ts.compilerOptions).toMatchObject({
      strict: true,
      target: 'ES2022',
      jsx: 'react-jsx',
    });
  });

  it('copies the pages tree verbatim', () => {
    writeScaffold(checkout, target, 'org/repo');
    expect(existsSync(join(target, 'pages', '+Page.tsx'))).toBe(true);
  });

  it('writes the marked deploy workflow plus .nojekyll and .gitignore', () => {
    writeScaffold(checkout, target, 'org/repo');
    const workflow = readFileSync(
      join(target, '.github/workflows/deploy-preview.yml'),
      'utf-8'
    );
    expect(workflow).toContain(HOST_MARKER);
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(existsSync(join(target, '.nojekyll'))).toBe(true);
    expect(readFileSync(join(target, '.gitignore'), 'utf-8')).toContain(
      'node_modules'
    );
  });
});
