import type { PageTreeNode } from './page-tree';

export interface PageTreeListProps {
  nodes: readonly PageTreeNode[];
  /**
   * Render every group expanded rather than only the one holding the current
   * page. Used by the generated listing, where no page is current and a tree of
   * closed folders would say nothing about what the draft contains.
   */
  expandAll?: boolean;
}

/**
 * The nested `<ul>` a page tree renders to, shared by the sidebar nav and the
 * generated page listing.
 *
 * Groups are `<details>`, which collapse and expand with no JavaScript at all —
 * so a rendered draft keeps working when opened straight off disk. The summary
 * is deliberately plain text and never a link: it is the toggle, and a link
 * inside it would make the two gestures fight over the same click. A directory
 * that has its own index page lists that page as its first child instead.
 */
export function PageTreeList({ nodes, expandAll }: PageTreeListProps) {
  return (
    <ul>
      {nodes.map((node) =>
        node.kind === 'page' ? (
          <li>
            <a href={node.href} aria-current={node.current ? 'page' : undefined}>
              {node.label}
            </a>
          </li>
        ) : (
          <li class="nav-group">
            <details open={expandAll === true || node.containsCurrent}>
              <summary>{node.label}</summary>
              <PageTreeList nodes={node.children} expandAll={expandAll} />
            </details>
          </li>
        )
      )}
    </ul>
  );
}
