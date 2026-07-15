import { join } from 'node:path';

/**
 * Builds the Pagefind search bundle for an already-rendered site into
 * `<dir>/pagefind/`, where the pages' search wiring expects it. Best-effort:
 * search is progressive enhancement, so any failure (missing platform binary,
 * indexing error) warns and returns false instead of failing the push. The
 * import is deferred so commands that never index don't load the binary.
 */
export async function buildSearchIndex(dir: string): Promise<boolean> {
  try {
    const pagefind = await import('pagefind');
    const { index, errors } = await pagefind.createIndex({});
    if (!index) {
      console.warn(`Warning: could not create search index: ${errors.join('; ')}`);
      return false;
    }
    const added = await index.addDirectory({ path: dir });
    if (added.errors.length > 0) {
      console.warn(`Warning: search indexing failed: ${added.errors.join('; ')}`);
      await pagefind.close();
      return false;
    }
    const written = await index.writeFiles({
      outputPath: join(dir, 'pagefind'),
    });
    await pagefind.close();
    if (written.errors.length > 0) {
      console.warn(`Warning: could not write search bundle: ${written.errors.join('; ')}`);
      return false;
    }
    return true;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: search indexing unavailable (${reason}).`);
    return false;
  }
}
