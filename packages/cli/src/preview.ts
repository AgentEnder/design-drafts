import { spawn } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

import { resolveDraftDir } from './draft-dir';
import { CliError } from './errors';

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
  '.md': 'text/markdown; charset=utf-8',
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

/** Builds the static file server for a draft directory without binding it to a
 * port, so it can be exercised directly in tests. */
export function createPreviewServer(draftDir: string): Server {
  return createServer((req, res) => {
    const safePath = resolveServedFile(draftDir, req.url ?? '/');
    if (safePath === null) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    try {
      let filePath = safePath;
      if (statSync(filePath).isDirectory()) {
        // Directory requests serve index.html; statSync throws below if absent.
        filePath = join(filePath, 'index.html');
        statSync(filePath);
      }
      const body = readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentTypeFor(filePath),
        'Content-Length': body.length,
      });
      res.end(body);
    } catch {
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
  const server = createPreviewServer(draftDir);
  const port = await listen(server, opts.port);
  const url = `http://localhost:${port}/`;

  console.log(`\nServing draft at ${url}`);
  console.log('Press Ctrl+C to stop.');

  if (opts.open !== false) {
    openBrowser(url);
  }
}
