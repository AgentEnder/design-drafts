import { describe, expect, it } from 'vitest';

import {
  inlineTsconfig,
  parseCatalog,
  resolveSitePackageJson,
  resolveTemplateRef,
  rewriteViteBase,
} from './rewrites';

describe('parseCatalog', () => {
  it('reads a flat catalog block, ignoring quotes and the packages list', () => {
    const yaml = [
      'packages:',
      '  - packages/*',
      '',
      'catalog:',
      "  '@nx/js': 22.6.3",
      '  react: ^19.2.3',
      '  vike: ^0.4.256',
    ].join('\n');

    expect(parseCatalog(yaml)).toEqual({
      '@nx/js': '22.6.3',
      react: '^19.2.3',
      vike: '^0.4.256',
    });
  });

  it('stops at the next top-level key', () => {
    const yaml = [
      'catalog:',
      '  react: ^19.2.3',
      'onlyBuiltDependencies:',
      '  - esbuild',
    ].join('\n');

    expect(parseCatalog(yaml)).toEqual({ react: '^19.2.3' });
  });

  it('returns an empty map when there is no catalog', () => {
    expect(parseCatalog('packages:\n  - packages/*\n')).toEqual({});
  });
});

describe('resolveSitePackageJson', () => {
  const catalog = {
    react: '^19.2.3',
    'react-dom': '^19.2.3',
    vike: '^0.4.256',
    typescript: '5.9.3',
  };

  it('replaces catalog: specifiers with concrete versions', () => {
    const raw = JSON.stringify({
      name: '@design-drafts/site',
      dependencies: { react: 'catalog:', vike: 'catalog:' },
      devDependencies: { typescript: 'catalog:' },
    });

    const result = JSON.parse(resolveSitePackageJson(raw, catalog));
    expect(result.dependencies).toEqual({ react: '^19.2.3', vike: '^0.4.256' });
    expect(result.devDependencies).toEqual({ typescript: '5.9.3' });
  });

  it('leaves already-concrete specifiers untouched', () => {
    const raw = JSON.stringify({ dependencies: { left: '^1.0.0' } });
    const result = JSON.parse(resolveSitePackageJson(raw, catalog));
    expect(result.dependencies).toEqual({ left: '^1.0.0' });
  });

  it('drops the nx project config', () => {
    const raw = JSON.stringify({
      name: 'site',
      nx: { name: 'site', targets: {} },
    });
    const result = JSON.parse(resolveSitePackageJson(raw, catalog));
    expect(result.nx).toBeUndefined();
  });

  it('throws when a catalog specifier has no matching entry', () => {
    const raw = JSON.stringify({ dependencies: { unknown: 'catalog:' } });
    expect(() => resolveSitePackageJson(raw, catalog)).toThrow(/unknown/);
  });
});

describe('rewriteViteBase', () => {
  it('rewrites base to the repo segment of org/repo', () => {
    const src = "export default defineConfig({\n  base: '/design-drafts/',\n});";
    expect(rewriteViteBase(src, 'my-org/drafts')).toContain("base: '/drafts/'");
  });

  it('accepts a bare repo name', () => {
    const src = "{ base: '/design-drafts/' }";
    expect(rewriteViteBase(src, 'drafts')).toContain("base: '/drafts/'");
  });

  it('handles double-quoted base', () => {
    const src = '{ base: "/old/" }';
    expect(rewriteViteBase(src, 'org/new')).toContain("base: '/new/'");
  });

  it('throws when there is no base to rewrite', () => {
    expect(() => rewriteViteBase('{ plugins: [] }', 'org/repo')).toThrow(
      /base:/
    );
  });
});

describe('inlineTsconfig', () => {
  it('folds base compilerOptions in and drops extends', () => {
    const base = JSON.stringify({
      compilerOptions: { strict: true, module: 'NodeNext', target: 'ES2022' },
    });
    const site = JSON.stringify({
      extends: '../../tsconfig.base.json',
      compilerOptions: { jsx: 'react-jsx', target: 'ES2020' },
      include: ['pages/**/*.tsx'],
    });

    const result = JSON.parse(inlineTsconfig(site, base));
    expect(result.extends).toBeUndefined();
    expect(result.compilerOptions).toEqual({
      strict: true,
      module: 'NodeNext',
      // site options win on conflict
      target: 'ES2020',
      jsx: 'react-jsx',
    });
    expect(result.include).toEqual(['pages/**/*.tsx']);
  });
});

describe('resolveTemplateRef', () => {
  const base = {
    cliVersion: '1.2.3',
    defaultBranch: 'main',
    tagExists: () => true,
  };

  it('prefers an explicit override', () => {
    expect(resolveTemplateRef({ ...base, override: 'feature-x' })).toBe(
      'feature-x'
    );
  });

  it('uses the version tag when it exists', () => {
    expect(resolveTemplateRef(base)).toBe('v1.2.3');
  });

  it('falls back to the default branch when the tag is absent', () => {
    expect(resolveTemplateRef({ ...base, tagExists: () => false })).toBe('main');
  });
});
