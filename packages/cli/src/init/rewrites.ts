// Pure transforms applied to the canonical `packages/site` source as it is
// promoted into a standalone host repo. Each is deliberately string/JSON level
// and side-effect free so it can be unit-tested without touching the network or
// the filesystem.

export interface CatalogMap {
  [packageName: string]: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  // The host is a single project, not an nx workspace, so the site's `nx`
  // project config is dropped during promotion.
  nx?: unknown;
  [key: string]: unknown;
}

const CATALOG_PREFIX = 'catalog:';

function resolveDepBlock(
  block: Record<string, string> | undefined,
  catalog: CatalogMap
): Record<string, string> | undefined {
  if (!block) return block;
  const resolved: Record<string, string> = {};
  for (const [name, spec] of Object.entries(block)) {
    if (!spec.startsWith(CATALOG_PREFIX)) {
      resolved[name] = spec;
      continue;
    }
    // `catalog:` (default) and `catalog:<name>` both resolve against the named
    // catalog entry. We only support the default catalog, which is all the
    // canonical workspace uses.
    const version = catalog[name];
    if (!version) {
      throw new Error(
        `Cannot resolve "${name}": "${spec}" but no catalog entry exists for it`
      );
    }
    resolved[name] = version;
  }
  return resolved;
}

/**
 * Rewrites a site package.json for life in a standalone host repo: every
 * `catalog:` dependency specifier is replaced with the concrete version from
 * the canonical workspace catalog, and the nx project config is removed.
 */
export function resolveSitePackageJson(
  raw: string,
  catalog: CatalogMap
): string {
  const pkg = JSON.parse(raw) as PackageJson;

  const next: PackageJson = { ...pkg };
  next.dependencies = resolveDepBlock(pkg.dependencies, catalog);
  next.devDependencies = resolveDepBlock(pkg.devDependencies, catalog);
  delete next.nx;

  // Drop empty dep blocks so we don't emit `"dependencies": {}`.
  if (next.dependencies && Object.keys(next.dependencies).length === 0) {
    delete next.dependencies;
  }
  if (next.devDependencies && Object.keys(next.devDependencies).length === 0) {
    delete next.devDependencies;
  }

  return JSON.stringify(next, null, 2) + '\n';
}

/**
 * Parses the `catalog:` block out of a canonical pnpm-workspace.yaml. We keep
 * the parser intentionally small (flat `key: value` pairs under `catalog:`)
 * rather than pulling in a YAML dependency — the catalog is always a flat map
 * of package name to version string.
 */
export function parseCatalog(workspaceYaml: string): CatalogMap {
  const lines = workspaceYaml.split('\n');
  const catalog: CatalogMap = {};
  let inCatalog = false;
  let catalogIndent = 0;

  for (const line of lines) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    if (!inCatalog) {
      if (line.trim() === 'catalog:') {
        inCatalog = true;
        catalogIndent = indent;
      }
      continue;
    }

    // A line at or below the `catalog:` indent ends the block.
    if (indent <= catalogIndent) break;

    const match = line.trim().match(/^['"]?([^'":]+)['"]?\s*:\s*(.+)$/);
    if (match) {
      const name = match[1].trim();
      const version = match[2].trim().replace(/^['"]|['"]$/g, '');
      catalog[name] = version;
    }
  }

  return catalog;
}

/**
 * Rewrites the Vite `base` so asset URLs resolve under the host repo's Pages
 * subpath (https://<owner>.github.io/<repo>/). Accepts `org/repo` or a bare
 * repo name and uses just the repo segment.
 */
export function rewriteViteBase(source: string, repo: string): string {
  const repoName = repo.includes('/') ? repo.split('/').pop()! : repo;
  const base = `/${repoName}/`;
  // Match `base: '...'` or `base: "..."` (single occurrence in the config).
  const replaced = source.replace(
    /base:\s*(['"])(?:[^'"]*)\1/,
    `base: '${base}'`
  );
  if (replaced === source) {
    throw new Error('Could not find a `base:` option in vite.config to rewrite');
  }
  return replaced;
}

interface Tsconfig {
  extends?: string;
  compilerOptions?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Folds the canonical base tsconfig's compilerOptions into the site tsconfig and
 * drops `extends`, so the host needs no `tsconfig.base.json` at its root. The
 * site's own compilerOptions win on conflict.
 */
export function inlineTsconfig(siteRaw: string, baseRaw: string): string {
  const site = JSON.parse(siteRaw) as Tsconfig;
  const base = JSON.parse(baseRaw) as Tsconfig;

  const merged: Tsconfig = { ...site };
  delete merged.extends;
  merged.compilerOptions = {
    ...(base.compilerOptions ?? {}),
    ...(site.compilerOptions ?? {}),
  };

  return JSON.stringify(merged, null, 2) + '\n';
}

/**
 * Picks the template ref to check the site out from. An explicit override wins;
 * otherwise prefer the release tag matching the CLI version when it exists,
 * falling back to the default branch.
 */
export function resolveTemplateRef(opts: {
  override?: string;
  cliVersion: string;
  tagExists: (tag: string) => boolean;
  defaultBranch: string;
}): string {
  if (opts.override) return opts.override;
  const tag = `v${opts.cliVersion}`;
  if (opts.tagExists(tag)) return tag;
  return opts.defaultBranch;
}
