/** One top-level frontmatter pair, for display — not parsed YAML semantics. */
export interface FrontmatterEntry {
  key: string;
  /** Scalar text, or the dedented block of continuation lines under the key. */
  value: string;
}

const OPEN_FENCE = /^---[ \t]*\r?\n/;
const CLOSE_FENCE = /^(?:---|\.\.\.)[ \t]*$/;
// A key sits at column 0 and is not a comment or a list item; `key:` with no
// value is legal.
const KEY_LINE = /^(?![#\s-])([^:]+?):(?:[ \t]+(.*))?[ \t]*$/;

/** Strips one layer of matching quotes off a single-line scalar. */
function unquote(value: string): string {
  const match = value.match(/^"([^"]*)"$|^'([^']*)'$/);
  return match ? (match[1] ?? match[2]) : value;
}

/** Removes the smallest indent shared by every non-blank line of a block. */
function dedent(lines: readonly string[]): string {
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const cut = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(cut).trimEnd()).join('\n').trim();
}

/**
 * Splits a leading YAML frontmatter block (Jekyll/GitHub convention: `---`
 * fences on their own lines, opening on line one) off a markdown document,
 * reading its top-level `key: value` pairs for display. A document with no
 * opening fence — or an opening fence that never closes, which is a thematic
 * break, not frontmatter — comes back untouched with no entries.
 */
export function splitFrontmatter(markdown: string): {
  entries: FrontmatterEntry[];
  body: string;
} {
  const open = markdown.match(OPEN_FENCE);
  if (!open) return { entries: [], body: markdown };
  const lines = markdown.slice(open[0].length).split(/\r?\n/);
  const closeAt = lines.findIndex((line) => CLOSE_FENCE.test(line));
  if (closeAt === -1) return { entries: [], body: markdown };

  const entries: FrontmatterEntry[] = [];
  let continuation: string[] | null = null;
  const flush = (): void => {
    if (continuation?.length) {
      const entry = entries[entries.length - 1];
      const block = dedent(continuation);
      entry.value = entry.value ? `${entry.value}\n${block}` : block;
    }
    continuation = null;
  };
  for (const line of lines.slice(0, closeAt)) {
    const key = line.match(KEY_LINE);
    if (key) {
      flush();
      entries.push({ key: key[1].trim(), value: unquote(key[2] ?? '') });
      continuation = [];
      continue;
    }
    if (/^#/.test(line)) continue;
    continuation?.push(line);
  }
  flush();

  return { entries, body: lines.slice(closeAt + 1).join('\n') };
}
