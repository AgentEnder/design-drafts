import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const IMAGE_EXTENSIONS = new Set(['.png', '.webp', '.jpg', '.jpeg']);
const REFERENCES_DIRNAME = 'references';
const INSPIRATION_DIRNAME = 'inspiration';
const LINKS_FILENAME = 'links.md';
const LINKS_HEADER =
  '# Links\n\n' +
  'Annotated reference URLs. See `docs/conventions/references-protocol.md` — ' +
  'one URL per bullet, an em-dash, then a sentence saying what is being cited.\n\n';

export interface RefAddOptions {
  source: string;
  note?: string;
  name?: string;
  draft?: string;
}

export async function refAdd(options: RefAddOptions): Promise<void> {
  const draftDir = resolveDraftDir(options.draft);
  ensureReferencesScaffold(draftDir);

  if (isUrl(options.source)) {
    if (looksLikeImageUrl(options.source)) {
      await downloadInspiration({
        url: options.source,
        draftDir,
        name: options.name,
        note: options.note,
      });
      return;
    }
    if (!options.note?.trim()) {
      throw new Error(
        "URL references require --note explaining what is being cited " +
          "(e.g. 'typography pairing, NOT the color')."
      );
    }
    appendLink({ url: options.source, draftDir, note: options.note });
    return;
  }

  copyLocalInspiration({
    filePath: options.source,
    draftDir,
    name: options.name,
  });
}

function isUrl(source: string): boolean {
  try {
    const parsed = new URL(source);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function looksLikeImageUrl(url: string): boolean {
  const pathname = new URL(url).pathname.toLowerCase();
  return IMAGE_EXTENSIONS.has(extname(pathname));
}

function resolveDraftDir(explicit: string | undefined): string {
  const candidate = resolve(explicit ?? process.cwd());
  if (!existsSync(join(candidate, 'draft.config.json'))) {
    throw new Error(
      `No draft.config.json at ${candidate}. Run from inside a draft directory or pass --draft <dir>.`
    );
  }
  return candidate;
}

function ensureReferencesScaffold(draftDir: string): void {
  const refs = join(draftDir, REFERENCES_DIRNAME);
  if (!existsSync(refs)) mkdirSync(refs, { recursive: true });
  const linksPath = join(refs, LINKS_FILENAME);
  if (!existsSync(linksPath)) writeFileSync(linksPath, LINKS_HEADER);
}

function appendLink({
  url,
  draftDir,
  note,
}: {
  url: string;
  draftDir: string;
  note: string;
}): void {
  const linksPath = join(draftDir, REFERENCES_DIRNAME, LINKS_FILENAME);
  const existing = existsSync(linksPath)
    ? readFileSync(linksPath, 'utf-8')
    : LINKS_HEADER;
  const trimmedNote = note.trim();
  const line = `- ${url} — ${trimmedNote}\n`;
  const next = existing.endsWith('\n') ? existing + line : existing + '\n' + line;
  writeFileSync(linksPath, next);
  process.stdout.write(
    `Added link to ${join(REFERENCES_DIRNAME, LINKS_FILENAME)}: ${url}\n`
  );
}

async function downloadInspiration({
  url,
  draftDir,
  name,
  note,
}: {
  url: string;
  draftDir: string;
  name: string | undefined;
  note: string | undefined;
}): Promise<void> {
  const inspirationDir = join(
    draftDir,
    REFERENCES_DIRNAME,
    INSPIRATION_DIRNAME
  );
  if (!existsSync(inspirationDir)) mkdirSync(inspirationDir, { recursive: true });

  const ext = (extname(new URL(url).pathname).toLowerCase() || '.png') as
    | '.png'
    | '.webp'
    | '.jpg'
    | '.jpeg';
  const baseName = name ?? deriveImageName(url);
  const finalName = uniqueFilename(
    inspirationDir,
    ensureExtension(baseName, ext)
  );
  const finalPath = join(inspirationDir, finalName);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }
  writeFileSync(finalPath, new Uint8Array(await response.arrayBuffer()));

  const relPath = join(REFERENCES_DIRNAME, INSPIRATION_DIRNAME, finalName);
  process.stdout.write(`Downloaded to ${relPath}\n`);
  if (!name) {
    process.stdout.write(
      `  Heads up: filename was derived from the URL. Per the references protocol,\n` +
        `  the filename IS the citation — rename to describe what's being cited\n` +
        `  (e.g. linear-empty-state-density${ext}).\n`
    );
  }
  if (note?.trim()) {
    appendLink({
      url,
      draftDir,
      note: `${note.trim()} (see ${INSPIRATION_DIRNAME}/${finalName})`,
    });
  }
}

function copyLocalInspiration({
  filePath,
  draftDir,
  name,
}: {
  filePath: string;
  draftDir: string;
  name: string | undefined;
}): void {
  const absPath = resolve(filePath);
  if (!existsSync(absPath)) {
    throw new Error(`File does not exist: ${absPath}`);
  }
  if (!statSync(absPath).isFile()) {
    throw new Error(`Not a regular file: ${absPath}`);
  }
  const ext = extname(absPath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    throw new Error(
      `Inspiration files must be one of ${[...IMAGE_EXTENSIONS].join(', ')} ` +
        `per the references protocol. Got: ${ext || '(no extension)'}`
    );
  }

  const inspirationDir = join(
    draftDir,
    REFERENCES_DIRNAME,
    INSPIRATION_DIRNAME
  );
  if (!existsSync(inspirationDir)) mkdirSync(inspirationDir, { recursive: true });

  const baseName = name ?? basename(absPath);
  const finalName = uniqueFilename(
    inspirationDir,
    ensureExtension(baseName, ext)
  );
  copyFileSync(absPath, join(inspirationDir, finalName));

  const relPath = join(REFERENCES_DIRNAME, INSPIRATION_DIRNAME, finalName);
  process.stdout.write(`Copied to ${relPath}\n`);
  if (!name) {
    process.stdout.write(
      `  Heads up: kept the original filename. Per the references protocol,\n` +
        `  the filename IS the citation — rename to describe what's being cited.\n`
    );
  }
}

function deriveImageName(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? '';
    const stem = lastSegment.replace(/\.[a-z0-9]+$/i, '');
    const host = parsed.hostname.replace(/^www\./, '').replace(/\./g, '-');
    return slugify(stem ? `${host}-${stem}` : host);
  } catch {
    return 'reference';
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureExtension(name: string, ext: string): string {
  return extname(name).toLowerCase() === ext.toLowerCase() ? name : `${name}${ext}`;
}

function uniqueFilename(dir: string, candidate: string): string {
  if (!existsSync(join(dir, candidate))) return candidate;
  const ext = extname(candidate);
  const stem = candidate.slice(0, candidate.length - ext.length);
  for (let i = 2; i < 1000; i++) {
    const next = `${stem}-${i}${ext}`;
    if (!existsSync(join(dir, next))) return next;
  }
  throw new Error(`Could not find a unique filename for ${candidate} in ${dir}`);
}
