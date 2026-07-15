import hljs from 'highlight.js/lib/common';
import { Marked, type Tokens } from 'marked';
import { markedHighlight } from 'marked-highlight';

export interface HeadingEntry {
  depth: number;
  id: string;
  /** Plain-text label with inline markdown formatting characters stripped. */
  label: string;
}

/** GitHub-style heading slug: lowercase, punctuation stripped, spaces dashed. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\- ]+/gu, '')
    .replace(/ +/g, '-');
}

/**
 * Rewrites a relative link to a markdown file so it points at the html page
 * that file renders to (`guide.md` → `guide.html`, any `README.md` → its
 * directory's `index.html`). Absolute urls, anchors, and non-markdown targets
 * pass through untouched; a `#fragment` or `?query` suffix is preserved.
 */
function rewriteMarkdownHref(href: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') || href.startsWith('#')) {
    return href;
  }
  const match = href.match(/^(.*\.md)([#?].*)?$/i);
  if (!match) return href;
  const [, path, suffix = ''] = match;
  const rewritten = /(^|\/)readme\.md$/i.test(path)
    ? path.replace(/readme\.md$/i, 'index.html')
    : path.replace(/\.md$/i, '.html');
  return rewritten + suffix;
}

function createMarked(headings: HeadingEntry[]): Marked {
  const slugCounts = new Map<string, number>();
  const marked = new Marked(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value;
        }
        // Returning the input unchanged tells marked-highlight the code was
        // not highlighted, so marked escapes it — never emit raw fenced code.
        return code;
      },
    })
  );
  marked.use({
    walkTokens(token) {
      if (token.type === 'link') {
        const link = token as Tokens.Link;
        link.href = rewriteMarkdownHref(link.href);
      }
    },
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const base = slugify(text) || 'section';
        const seen = slugCounts.get(base) ?? 0;
        slugCounts.set(base, seen + 1);
        const id = seen === 0 ? base : `${base}-${seen}`;
        headings.push({ depth, id, label: text.replace(/[`*_~]/g, '') });
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
    },
  });
  return marked;
}

interface SectionNode {
  /** Raw markdown of the section heading; null for the document preamble. */
  headingRaw: string | null;
  /** Raw markdown chunks of the section's own content (before any child). */
  contentRaws: string[];
  children: SectionNode[];
  depth: number;
}

/**
 * Groups a document's top-level tokens into a section tree: each heading owns
 * everything up to the next heading of the same or higher level, so an h3
 * section nests inside its h2. Splitting on *lexer* tokens (not rendered html)
 * means headings nested inside blockquotes or lists are never mistaken for
 * section boundaries.
 */
function buildSectionTree(markdown: string, marked: Marked): {
  tree: SectionNode;
  defsSuffix: string;
} {
  const tokens = marked.lexer(markdown);
  const root: SectionNode = { headingRaw: null, contentRaws: [], children: [], depth: 0 };
  const stack: SectionNode[] = [root];
  // Link reference definitions ([ref]: url) are document-global, but sections
  // are re-parsed independently — carry every definition into every chunk so
  // references keep resolving across section boundaries.
  const defRaws: string[] = [];

  for (const token of tokens) {
    if (token.type === 'def') {
      defRaws.push(token.raw);
      continue;
    }
    if (token.type === 'heading') {
      const heading = token as Tokens.Heading;
      while (stack.length > 1 && stack[stack.length - 1].depth >= heading.depth) {
        stack.pop();
      }
      const section: SectionNode = {
        headingRaw: heading.raw,
        contentRaws: [],
        children: [],
        depth: heading.depth,
      };
      stack[stack.length - 1].children.push(section);
      stack.push(section);
      continue;
    }
    stack[stack.length - 1].contentRaws.push(token.raw);
  }

  return {
    tree: root,
    defsSuffix: defRaws.length ? `\n\n${defRaws.join('\n')}` : '',
  };
}

export function renderDocument(markdown: string): {
  html: string;
  headings: HeadingEntry[];
} {
  const headings: HeadingEntry[] = [];
  const marked = createMarked(headings);
  const { tree, defsSuffix } = buildSectionTree(markdown, marked);

  const parseChunk = (raw: string): string => {
    if (!raw.trim()) return '';
    return marked.parse(raw + defsSuffix, { async: false });
  };

  // Depth-first in document order — heading first, then content, then child
  // sections — so heading ids and the captured heading list come out exactly
  // as a single whole-document parse would produce (slug dedup included).
  const renderSection = (node: SectionNode): string => {
    const headingHtml =
      node.headingRaw === null ? '' : parseChunk(node.headingRaw).trimEnd();
    const content = parseChunk(node.contentRaws.join(''));
    const children = node.children.map(renderSection).join('');
    if (node.headingRaw === null) {
      return content + children;
    }
    return `<details class="md-section" open>
<summary>${headingHtml}</summary>
<div class="md-section-body">
${content}${children}</div>
</details>
`;
  };

  return { html: renderSection(tree), headings };
}

/** Renders GitHub-flavored markdown to an html fragment: tables, task lists,
 * strikethrough, highlighted code fences, heading anchors, collapsible
 * sections, and relative `.md` links rewritten to their rendered `.html`
 * twins. */
export function renderMarkdownDocument(markdown: string): string {
  return renderDocument(markdown).html;
}
