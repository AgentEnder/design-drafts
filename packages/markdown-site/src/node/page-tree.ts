/**
 * Turns the flat list of pages a draft renders to into the directory tree the
 * author actually wrote, so navs and listings mirror the folder layout instead
 * of dumping every `guides/setup.html` at one level.
 */

/** A page to place in the tree. */
export interface PageTreeEntry {
  /** Root-relative POSIX output path — what decides where it lands. */
  path: string;
  /** Href to link it by, relative to wherever the tree is being rendered. */
  href: string;
  label: string;
  /** The page the tree is rendered on, if it is in the tree at all. */
  current?: boolean;
}

export interface PageTreeLeaf {
  kind: 'page';
  href: string;
  label: string;
  current: boolean;
}

export interface PageTreeGroup {
  kind: 'group';
  label: string;
  /** True when `current` is anywhere beneath, so the group renders expanded. */
  containsCurrent: boolean;
  children: PageTreeNode[];
}

export type PageTreeNode = PageTreeLeaf | PageTreeGroup;

/** `getting-started` -> `Getting started`. Directories are named for the URL,
 * so their raw form is a slug; a nav reads better with it spelled out. */
function humanize(segment: string): string {
  const spaced = segment.replace(/[-_]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isCurrent(node: PageTreeNode): boolean {
  return node.kind === 'page' ? node.current : node.containsCurrent;
}

function buildLevel(
  entries: readonly PageTreeEntry[],
  depth: number
): PageTreeNode[] {
  // A directory's own index page leads its level: it is the thing the folder is
  // *about*, and alphabetical order would otherwise bury it under its siblings.
  let indexLeaf: PageTreeLeaf | undefined;
  const leaves: PageTreeLeaf[] = [];
  // Insertion-ordered, so directories appear in the order their first page did.
  const groups = new Map<string, PageTreeEntry[]>();

  for (const entry of entries) {
    const segments = entry.path.split('/');
    const segment = segments[depth];
    if (segments.length === depth + 1) {
      const leaf: PageTreeLeaf = {
        kind: 'page',
        href: entry.href,
        label: entry.label,
        current: entry.current === true,
      };
      if (segment.toLowerCase() === 'index.html') {
        indexLeaf = leaf;
      } else {
        leaves.push(leaf);
      }
      continue;
    }
    const bucket = groups.get(segment);
    if (bucket) {
      bucket.push(entry);
    } else {
      groups.set(segment, [entry]);
    }
  }

  const groupNodes = [...groups].map(([segment, bucket]): PageTreeGroup => {
    const children = buildLevel(bucket, depth + 1);
    return {
      kind: 'group',
      label: humanize(segment),
      containsCurrent: children.some(isCurrent),
      children,
    };
  });

  // Pages before folders: the shallow entries are the ones a reader scans for,
  // and pushing them below an expanded folder would hide them.
  return [...(indexLeaf ? [indexLeaf] : []), ...leaves, ...groupNodes];
}

/**
 * Groups `entries` by the directories in their `path`, preserving the order
 * they arrive in within each level. Each directory becomes a group labelled
 * after itself; the page that renders as that directory's `index.html` leads
 * the group rather than sorting in among its siblings.
 */
export function buildPageTree(
  entries: readonly PageTreeEntry[]
): PageTreeNode[] {
  return buildLevel(entries, 0);
}
