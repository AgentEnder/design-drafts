import { describe, expect, it } from 'vitest';

import {
  buildPageTree,
  type PageTreeEntry,
  type PageTreeGroup,
  type PageTreeNode,
} from './page-tree';

function entry(path: string, overrides: Partial<PageTreeEntry> = {}): PageTreeEntry {
  return { path, href: path, label: path, ...overrides };
}

/** Flattens the tree to `Group > Child` lines, so a test reads as the shape it
 * is asserting rather than a wall of nested object literals. */
function outline(nodes: readonly PageTreeNode[], prefix = ''): string[] {
  return nodes.flatMap((node) =>
    node.kind === 'page'
      ? [`${prefix}${node.label}`]
      : outline(node.children, `${prefix}${node.label} > `)
  );
}

function group(nodes: readonly PageTreeNode[], label: string): PageTreeGroup {
  const found = nodes.find(
    (node): node is PageTreeGroup => node.kind === 'group' && node.label === label
  );
  if (!found) throw new Error(`no group "${label}" in ${outline(nodes).join(', ')}`);
  return found;
}

describe('buildPageTree', () => {
  it('groups pages by the directories they live in', () => {
    const tree = buildPageTree([
      entry('index.html', { label: 'Home' }),
      entry('guides/setup.html', { label: 'Setup' }),
      entry('guides/deploying.html', { label: 'Deploying' }),
      entry('reference/cli.html', { label: 'CLI flags' }),
    ]);

    expect(outline(tree)).toEqual([
      'Home',
      'Guides > Setup',
      'Guides > Deploying',
      'Reference > CLI flags',
    ]);
  });

  it('nests groups as deeply as the directories go', () => {
    const tree = buildPageTree([
      entry('reference/advanced/tuning.html', { label: 'Tuning' }),
    ]);
    expect(outline(tree)).toEqual(['Reference > Advanced > Tuning']);
  });

  it('lists pages before folders at every level', () => {
    // Folders are tall; a page pushed below an expanded one is a page nobody
    // scrolls to. The input deliberately arrives folder-first.
    const tree = buildPageTree([
      entry('guides/setup.html', { label: 'Setup' }),
      entry('about.html', { label: 'About' }),
    ]);
    expect(outline(tree)).toEqual(['About', 'Guides > Setup']);
  });

  it("leads a folder with its own index page, whatever it sorts as", () => {
    // `deploying.html` sorts before `index.html`, but the folder's index is
    // what the folder is about.
    const tree = buildPageTree([
      entry('guides/deploying.html', { label: 'Deploying' }),
      entry('guides/index.html', { label: 'Guides overview' }),
    ]);
    expect(outline(tree)).toEqual([
      'Guides > Guides overview',
      'Guides > Deploying',
    ]);
  });

  it('humanizes a slugged directory name', () => {
    const tree = buildPageTree([
      entry('getting_started/first-run.html', { label: 'First run' }),
    ]);
    expect(group(tree, 'Getting started')).toBeDefined();
  });

  it('marks every group holding the current page, at any depth', () => {
    const tree = buildPageTree([
      entry('guides/setup.html', { label: 'Setup' }),
      entry('reference/advanced/tuning.html', {
        label: 'Tuning',
        current: true,
      }),
    ]);

    expect(group(tree, 'Guides').containsCurrent).toBe(false);
    const reference = group(tree, 'Reference');
    expect(reference.containsCurrent).toBe(true);
    expect(group(reference.children, 'Advanced').containsCurrent).toBe(true);
  });

  it('keeps hrefs verbatim — they are relative to the rendering page, not the tree', () => {
    const tree = buildPageTree([
      entry('reference/cli.html', { href: '../reference/cli.html', label: 'CLI' }),
    ]);
    const [leaf] = group(tree, 'Reference').children;
    expect(leaf).toMatchObject({ kind: 'page', href: '../reference/cli.html' });
  });

  it('is empty for no pages', () => {
    expect(buildPageTree([])).toEqual([]);
  });
});
