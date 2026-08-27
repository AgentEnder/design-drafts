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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { build } from './build';

let draft: string;
let out: string;

beforeEach(() => {
  draft = mkdtempSync(join(tmpdir(), 'dd-build-draft-'));
  out = join(mkdtempSync(join(tmpdir(), 'dd-build-out-')), 'site');
  // The command narrates what it built; the assertions are on the files.
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  rmSync(draft, { recursive: true, force: true });
  rmSync(join(out, '..'), { recursive: true, force: true });
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function write(relPath: string, content: string): void {
  const abs = join(draft, relPath);
  mkdirSync(join(abs, '..'), { recursive: true });
  writeFileSync(abs, content);
}

/** A manifest with a name, so nothing in the run reaches for a prompt. */
function manifest(name = 'Build test draft'): void {
  write('design-drafts.config.json', JSON.stringify({ name }));
}

/** Stands in for the design-drafts.config.json on the host repo's default
 * branch, which `--repo` reads to learn where that host publishes drafts.
 * `null` is a host that declares nothing, which is the common case and a 404. */
function hostDeclares(config: { draftsPath: string } | null): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      config
        ? { ok: true, status: 200, text: async () => JSON.stringify(config) }
        : { ok: false, status: 404, text: async () => '' }
    )
  );
}

describe('build', () => {
  it('renders a markdown draft into browsable html', async () => {
    manifest();
    write('README.md', '# Home\n\nSee [setup](guides/setup.md).\n');
    write('guides/setup.md', '# Setup\n');

    await build({ path: draft, out, base: '/' });

    expect(existsSync(join(out, 'index.html'))).toBe(true);
    expect(existsSync(join(out, 'guides/setup.html'))).toBe(true);
    // The markdown ships beside its rendered page, as it does in a push.
    expect(existsSync(join(out, 'guides/setup.md'))).toBe(true);
    // Links between sources are rewritten to the pages they render to.
    expect(readFileSync(join(out, 'index.html'), 'utf-8')).toContain(
      'href="guides/setup.html"'
    );
  });

  it('bakes a generated index for a draft that has none of its own', async () => {
    manifest();
    write('about.html', '<!doctype html><title>About</title>');

    await build({ path: draft, out, base: '/' });

    const index = readFileSync(join(out, 'index.html'), 'utf-8');
    // Relative, so the listing resolves under a deploy sub-path too.
    expect(index).toContain('href="about.html"');
    expect(index).not.toContain('href="/about.html"');
  });

  it('leaves the draft directory untouched', async () => {
    // The whole reason build stages into a tmpdir: rendering html next to the
    // sources is what makes a markdown draft stop looking like one.
    manifest();
    write('README.md', '# Home\n');

    await build({ path: draft, out, base: '/' });

    expect(existsSync(join(draft, 'index.html'))).toBe(false);
  });

  it('ships no git or deploy plumbing — that is push\'s half', async () => {
    manifest();
    write('about.html', '<!doctype html>');

    await build({ path: draft, out, base: '/' });

    expect(existsSync(join(out, '.git'))).toBe(false);
    expect(existsSync(join(out, '.github'))).toBe(false);
  });

  it('wires search links to --base', async () => {
    manifest();
    write('README.md', '# Home\n');
    write('notes.md', '# Notes\n');

    await build({ path: draft, out, base: 'previews/my-draft' });

    // Leading and trailing slashes are supplied, so a hand-written value lands
    // where a deploy path would.
    expect(readFileSync(join(out, 'index.html'), 'utf-8')).toContain(
      'data-base-url="/previews/my-draft/"'
    );
  });

  it('derives the base path from --repo, matching what a push would bake', async () => {
    manifest('My draft');
    write('README.md', '# Home\n');
    write('notes.md', '# Notes\n');
    hostDeclares(null);

    await build({ path: draft, out, repo: 'my-org/previews' });

    expect(readFileSync(join(out, 'index.html'), 'utf-8')).toContain(
      'data-base-url="/previews/my-draft/"'
    );
  });

  // A host that keeps its site root for something else publishes drafts under
  // a sub-path; search links have to resolve there, not one directory up.
  it('honors the drafts sub-path the host repo declares', async () => {
    manifest('My draft');
    write('README.md', '# Home\n');
    write('notes.md', '# Notes\n');
    hostDeclares({ draftsPath: 'd' });

    await build({ path: draft, out, repo: 'my-org/previews' });

    expect(readFileSync(join(out, 'index.html'), 'utf-8')).toContain(
      'data-base-url="/previews/d/my-draft/"'
    );
  });

  it('requires --out', async () => {
    manifest();
    write('about.html', '');
    await expect(build({ path: draft })).rejects.toThrow(/--out/);
  });

  it('refuses an --out inside the draft', async () => {
    // A build left there makes the next preview or push read this markdown
    // draft as hand-written html and ship the stale build instead.
    manifest();
    write('README.md', '# Home\n');
    await expect(
      build({ path: draft, out: join(draft, 'dist'), base: '/' })
    ).rejects.toThrow(/inside the draft/);
  });

  it('refuses an --out that contains the draft', async () => {
    // --out is emptied before it is written; this one would take the sources.
    manifest();
    write('README.md', '# Home\n');
    await expect(
      build({ path: draft, out: join(draft, '..'), base: '/' })
    ).rejects.toThrow(/contains the draft/);
  });

  it('refuses a non-empty --out without --force', async () => {
    manifest();
    write('about.html', '');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'something-of-mine.txt'), 'keep me');

    await expect(build({ path: draft, out, base: '/' })).rejects.toThrow(
      /not empty/
    );
    expect(existsSync(join(out, 'something-of-mine.txt'))).toBe(true);
  });

  it('replaces a non-empty --out with --force, leaving nothing stale behind', async () => {
    manifest();
    write('about.html', '<!doctype html>');
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'from-a-previous-build.html'), '');

    await build({ path: draft, out, base: '/', force: true });

    expect(existsSync(join(out, 'from-a-previous-build.html'))).toBe(false);
    expect(existsSync(join(out, 'about.html'))).toBe(true);
  });

  it('rejects a path that does not exist', async () => {
    await expect(
      build({ path: join(draft, 'nope'), out, base: '/' })
    ).rejects.toThrow(/does not exist/);
  });
});
