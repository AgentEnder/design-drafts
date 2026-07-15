import { spawn } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

import { resolveDraftDir } from './draft-dir';
import { CliError } from './errors';
import {
  buildSearchIndex,
  collectMarkdownPages,
  isMarkdownDraft,
  renderMarkdownPageAt,
  renderMarkdownSite,
  type RenderMarkdownSiteOptions,
} from '@design-drafts/markdown-site';
import { resolveMarkdownIndex } from './markdown-index';
import { resolveDraftId } from './site-config';

const DEFAULT_PORT = 4321;
// When scanning for a free port (no explicit --port), give up after this many
// consecutive busy ports rather than looping forever.
const PORT_SCAN_ATTEMPTS = 20;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  // Plain text, not text/markdown: every page's "view raw" link points at its
  // .md source, and browsers download text/markdown rather than display it.
  '.md': 'text/plain; charset=utf-8',
};

/** Maps a file path to a Content-Type by extension, defaulting to a generic
 * binary type for anything unrecognised. */
export function contentTypeFor(filePath: string): string {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Resolves a request URL to an absolute path inside `draftDir`, or `null` when
 * the request is malformed or tries to escape the draft root.
 *
 * The query string and hash are stripped, percent-escapes are decoded (so an
 * encoded `..` can't sneak past), and the result is confirmed to live under
 * `draftDir` via a `relative()` check. The returned path may be a file or a
 * directory — the caller decides how to serve it.
 */
export function resolveServedFile(
  draftDir: string,
  urlPath: string
): string | null {
  const withoutQuery = urlPath.split('?')[0].split('#')[0];

  let decoded: string;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    // Malformed percent-encoding — reject rather than guess.
    return null;
  }

  // Anchor at the draft root: prefixing with '.' turns the leading slash into a
  // relative segment so resolve() joins against draftDir instead of the FS root.
  const candidate = resolve(draftDir, '.' + (decoded.startsWith('/') ? decoded : `/${decoded}`));

  const rel = relative(draftDir, candidate);
  // An empty rel means the request resolved to the draft root itself (allowed).
  if (rel && (rel.startsWith('..') || isAbsolute(rel))) {
    return null;
  }
  return candidate;
}

/**
 * Recursively collects every `.html` file beneath `dir`, returned as
 * root-relative POSIX paths (e.g. `pages/sub/p.html`) sorted for stable output.
 * Used to build the generated index when a directory has no index.html.
 */
export function collectHtmlPages(dir: string): string[] {
  const pages: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
        pages.push(relative(dir, abs).split(sep).join('/'));
      }
    }
  };
  walk(dir);
  return pages.sort();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface DirectoryIndexOptions {
  /**
   * When `true` (the default), page links are root-absolute (`/page.html`) so
   * they resolve no matter which subdirectory URL was requested — correct for
   * the preview server, which serves this same listing for any index-less dir.
   *
   * When `false`, links are relative (`page.html`) so they resolve under a
   * deploy base path — correct for the index baked into a pushed draft, which
   * gh-pages serves from a `/<site>/` subdirectory.
   */
  rootAbsoluteLinks?: boolean;
  /** Designated markdown index (see `resolveMarkdownIndex`), so a markdown
   * draft's listing shows the same output paths its pages render to. */
  indexSource?: string;
  /** Root-relative paths to leave out of the listing — the alias copies a
   * markdown index writes (see `MarkdownPage.aliasPaths`), so one document
   * isn't listed twice. */
  exclude?: readonly string[];
}

/**
 * Renders a fallback index page that links to every `.html` page in the draft,
 * shown when the requested directory has no index.html of its own.
 */
export function renderDirectoryIndex(
  draftDir: string,
  options: DirectoryIndexOptions = {}
): string {
  const { rootAbsoluteLinks = true, indexSource, exclude = [] } = options;
  let pages = collectHtmlPages(draftDir);
  if (pages.length === 0 && isMarkdownDraft(draftDir)) {
    // A markdown draft has no .html on disk yet, but every .md renders to a
    // page — list those output paths so the fallback index isn't empty.
    pages = collectMarkdownPages(draftDir, { indexSource }).map(
      (page) => page.outputPath
    );
  }
  pages = pages.filter((page) => !exclude.includes(page));
  const items = pages.length
    ? pages
        .map((page) => {
          const href = rootAbsoluteLinks ? `/${page}` : page;
          return `        <li><a href="${href}">${escapeHtml(page)}</a></li>`;
        })
        .join('\n')
    : '        <li class="empty">No pages found in this draft yet.</li>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Draft pages</title>
    <style>
      body { font: 16px/1.5 system-ui, sans-serif; margin: 3rem auto; max-width: 40rem; padding: 0 1rem; }
      h1 { font-size: 1.25rem; }
      ul { list-style: none; padding: 0; }
      li { margin: 0.25rem 0; }
      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .empty { color: #6b7280; }
    </style>
  </head>
  <body>
    <h1>Draft pages</h1>
    <p>No <code>index.html</code> here — listing the pages in this draft:</p>
    <ul>
${items}
    </ul>
  </body>
</html>
`;
}

/**
 * Bakes a generated page-listing index onto disk at `dir/index.html` when the
 * directory has none of its own. The preview server synthesises this listing
 * per request, but gh-pages serves static files only — a draft directory with
 * no `index.html` 404s there — so `push` calls this to persist the listing into
 * the branch content. Links are relative so they resolve under the `/<site>/`
 * base path the draft is deployed to. No-op when an index already exists.
 */
export function ensureDraftIndex(
  dir: string,
  options: { exclude?: readonly string[] } = {}
): void {
  const indexPath = join(dir, 'index.html');
  if (existsSync(indexPath)) {
    return;
  }
  writeFileSync(
    indexPath,
    renderDirectoryIndex(dir, {
      rootAbsoluteLinks: false,
      exclude: options.exclude,
    })
  );
}

/** State of the background search-index build, polled per request. */
export type PreviewSearch =
  | { phase: 'building' }
  | { phase: 'ready'; bundleDir: string }
  | { phase: 'failed' };

export interface PreviewServerOptions {
  /**
   * Reports the current state of the search bundle (see
   * `prepareMarkdownSearch`); called on every `/pagefind/*` request so the
   * index can finish building after the server is already up. When set,
   * rendered markdown pages get the search UI wired to the server root;
   * `/pagefind/*` answers 503 while building (the page's loader shows a
   * progress placeholder and retries), the staged files once ready, and 404
   * after a failure. Omit to disable search entirely.
   */
  search?: () => PreviewSearch;
  /**
   * Root-relative markdown source designated as the draft's index (see
   * `resolveMarkdownIndex`) — served at `/` and `/index.html`, exactly as a
   * push would bake it. Omit when a README/index.md exists or the generated
   * listing was chosen.
   */
  indexSource?: string;
}

/**
 * Copies a markdown draft into a staging tmpdir, renders it, and builds its
 * Pagefind bundle there, so the preview server can offer working search
 * without writing anything into the draft. Returns the staging directory, or
 * undefined when the draft isn't markdown or indexing fails (search is
 * progressive enhancement — the preview still works without it). The index is
 * a snapshot from server start; markdown edited mid-session renders fresh but
 * isn't re-indexed until the next `design-drafts preview`.
 */
export async function prepareMarkdownSearch(
  draftDir: string,
  indexSource?: string
): Promise<string | undefined> {
  if (!isMarkdownDraft(draftDir)) return undefined;
  const staging = mkdtempSync(join(tmpdir(), 'design-drafts-search-'));
  try {
    cpSync(draftDir, staging, {
      recursive: true,
      filter: (src) => {
        const segments = src.split(sep);
        return !segments.includes('.git') && !segments.includes('node_modules');
      },
    });
    if (
      renderMarkdownSite(staging, { search: { basePath: '/' }, indexSource }) &&
      (await buildSearchIndex(staging))
    ) {
      return staging;
    }
  } catch {
    // Fall through to cleanup — preview works fine without search.
  }
  rmSync(staging, { recursive: true, force: true });
  return undefined;
}

/** Builds the static file server for a draft directory without binding it to a
 * port, so it can be exercised directly in tests. */
export function createPreviewServer(
  draftDir: string,
  options: PreviewServerOptions = {}
): Server {
  const sendHtml = (res: ServerResponse, html: string): void => {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(html),
    });
    res.end(html);
  };
  // Maps an absolute path under the draft root to the root-relative POSIX form
  // that markdown page output paths use (`''` for the root itself).
  const relPosix = (abs: string): string =>
    relative(draftDir, abs).split(sep).join('/');
  const { search } = options;
  // On-the-fly markdown pages must match what the search bundle was built
  // from, so they get the same search wiring whenever search is configured.
  // They also declare the same draft id a push would bake, which is what keeps
  // one draft's annotations out of the next draft served from this same
  // localhost URL.
  const renderOptions: RenderMarkdownSiteOptions = {
    draftId: resolveDraftId(join(draftDir, 'design-drafts.config.json')),
    indexSource: options.indexSource,
    ...(search ? { search: { basePath: '/' } } : {}),
  };

  return createServer((req, res) => {
    const safePath = resolveServedFile(draftDir, req.url ?? '/');
    if (safePath === null) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    // The pagefind bundle lives in the staging dir, not the draft — serve it
    // from there. safePath is already traversal-checked, so the same relative
    // path is safe to resolve against the bundle root.
    const rel = relPosix(safePath);
    if (search && (rel === 'pagefind' || rel.startsWith('pagefind/'))) {
      const state = search();
      if (state.phase === 'building') {
        res.writeHead(503, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Retry-After': '2',
        });
        res.end('Search index is still building');
        return;
      }
      if (state.phase === 'ready') {
        try {
          const body = readFileSync(join(state.bundleDir, rel));
          res.writeHead(200, {
            'Content-Type': contentTypeFor(rel),
            'Content-Length': body.length,
          });
          res.end(body);
          return;
        } catch {
          // Missing file inside a ready bundle — fall through to 404.
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    try {
      let filePath = safePath;
      if (statSync(filePath).isDirectory()) {
        const indexPath = join(filePath, 'index.html');
        if (!existsSync(indexPath)) {
          // In a markdown draft the directory's README.md/index.md renders to
          // this index — serve that, exactly as a push would bake it.
          const dirRel = relPosix(filePath);
          const rendered = renderMarkdownPageAt(
            draftDir,
            dirRel ? `${dirRel}/index.html` : 'index.html',
            renderOptions
          );
          if (rendered !== null) {
            sendHtml(res, rendered);
            return;
          }
          // Otherwise serve a generated listing of the draft's pages.
          sendHtml(res, renderDirectoryIndex(draftDir));
          return;
        }
        filePath = indexPath;
      }
      const body = readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentTypeFor(filePath),
        'Content-Length': body.length,
      });
      res.end(body);
    } catch {
      // A missing .html may be the rendered twin of a markdown source that
      // only exists at push time — render it on the fly for preview parity.
      if (/\.html$/i.test(rel)) {
        const rendered = renderMarkdownPageAt(draftDir, rel, renderOptions);
        if (rendered !== null) {
          sendHtml(res, rendered);
          return;
        }
        // Every push bakes a root index.html (ensureDraftIndex), and rendered
        // pages link to it (the brand link) — so preview answers it with the
        // same generated listing rather than a 404.
        if (rel === 'index.html') {
          sendHtml(res, renderDirectoryIndex(draftDir));
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

/**
 * Binds the server to a port. With an explicit `requestedPort` we try only that
 * port and surface a clear error if it's taken; without one we scan upward from
 * the default until a free port is found.
 */
function listen(server: Server, requestedPort: number | undefined): Promise<number> {
  const startPort = requestedPort ?? DEFAULT_PORT;
  const maxAttempts = requestedPort === undefined ? PORT_SCAN_ATTEMPTS : 1;

  const tryPort = (port: number, attempt: number): Promise<number> =>
    new Promise((resolvePort, rejectPort) => {
      const onError = (error: NodeJS.ErrnoException) => {
        server.removeListener('listening', onListening);
        if (error.code === 'EADDRINUSE' && attempt + 1 < maxAttempts) {
          resolvePort(tryPort(port + 1, attempt + 1));
          return;
        }
        if (error.code === 'EADDRINUSE') {
          rejectPort(
            new CliError(
              `Port ${port} is already in use. Pass --port <n> to pick another.`
            )
          );
          return;
        }
        rejectPort(error);
      };
      const onListening = () => {
        server.removeListener('error', onError);
        resolvePort(port);
      };
      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port, 'localhost');
    });

  return tryPort(startPort, 0);
}

/** Opens the given URL in the user's default browser. Best-effort: a missing
 * opener or a spawn failure is swallowed so it never breaks the server. */
function openBrowser(url: string): void {
  const { platform } = process;
  const [command, args] =
    platform === 'darwin'
      ? ['open', [url]]
      : platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]];
  try {
    const child = spawn(command, args as string[], {
      stdio: 'ignore',
      detached: true,
    });
    child.on('error', () => {
      /* opener not available — non-fatal */
    });
    child.unref();
  } catch {
    /* spawn threw synchronously — non-fatal */
  }
}

export interface PreviewOptions {
  draft?: string;
  port?: number;
  open?: boolean;
}

/** Serves a work-in-progress draft directory over HTTP for local viewing. */
export async function preview(opts: PreviewOptions): Promise<void> {
  const draftDir = resolveDraftDir(opts.draft);
  // May prompt (README-less markdown draft, nothing persisted) — before the
  // server comes up, while the terminal is clearly ours.
  const indexSource = await resolveMarkdownIndex(
    draftDir,
    join(draftDir, 'design-drafts.config.json')
  );

  // Index in the background so the preview is up instantly; the page's search
  // placeholder polls and swaps in the live UI when the bundle lands.
  let searchState: PreviewSearch | undefined;
  if (isMarkdownDraft(draftDir)) {
    searchState = { phase: 'building' };
    void prepareMarkdownSearch(draftDir, indexSource).then((bundleDir) => {
      if (bundleDir) {
        // Silent on purpose: the search box's own placeholder communicates
        // readiness, and this resolves after the server banner has printed.
        searchState = { phase: 'ready', bundleDir };
        process.on('exit', () => {
          rmSync(bundleDir, { recursive: true, force: true });
        });
      } else {
        searchState = { phase: 'failed' };
      }
    });
  }

  const server = createPreviewServer(draftDir, {
    search: searchState ? () => searchState as PreviewSearch : undefined,
    indexSource,
  });
  const port = await listen(server, opts.port);
  const url = `http://localhost:${port}/`;

  console.log(`\nServing draft at ${url}`);
  console.log('Press Ctrl+C to stop.');

  if (opts.open !== false) {
    openBrowser(url);
  }
}
