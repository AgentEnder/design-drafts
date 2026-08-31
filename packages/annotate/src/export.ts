// Markdown export for a review session.
//
// The output's job is to be pasted into an agent, so it leads with what the
// agent needs to act: which page, which words, what the reviewer wants
// changed. It is deliberately a subset of the full report format sketched in
// issue #18 — no screenshots, no toolbar axis state — because those need a
// capture pipeline and this needs to close the loop today.

import {
  describeAnchor,
  type ElementAnchor,
  type SelectorBundle,
} from './selectors.js';
import type { Annotation, AnnotationKind } from './storage.js';
import { quoteInContext, textZones } from './text-range.js';

/** One glyph and one word per kind, shared by the export, the pins and the
 * panel so page and drawer read the same language. */
export const KIND_GLYPH: Record<AnnotationKind, string> = {
  comment: '💬',
  delete: '✂',
  replace: '⇄',
  insert: '+',
  reword: '✎',
};

export const KIND_LABEL: Record<AnnotationKind, string> = {
  comment: 'Comment',
  delete: 'Delete',
  replace: 'Replace',
  insert: 'Insert',
  reword: 'Reword',
};

export interface ExportPage {
  url: string;
  annotations: Annotation[];
}

export interface ExportMeta {
  draftId?: string;
  exportedAt: string;
}

export function annotationsToMarkdown(
  pages: ExportPage[],
  meta: ExportMeta
): string {
  const withContent = pages.filter((page) => page.annotations.length > 0);
  const total = withContent.reduce((n, page) => n + page.annotations.length, 0);

  const lines: string[] = ['# Draft feedback', ''];
  if (meta.draftId) lines.push(`- Draft: \`${meta.draftId}\``);
  lines.push(`- Exported: ${meta.exportedAt}`);
  lines.push(`- Annotations: ${total}`);
  lines.push('');

  if (!withContent.length) {
    lines.push('_No annotations recorded._');
    return lines.join('\n') + '\n';
  }

  for (const page of withContent) {
    lines.push(`## ${page.url}`, '');
    // Numbering restarts per page so it lines up with the pins the reviewer
    // is looking at, which are also numbered per page.
    page.annotations.forEach((annotation, index) => {
      // A comment keeps the bare heading annotations always had; a suggested
      // edit leads with what to do, so a skimming agent sees the verb first.
      const kindTag =
        annotation.kind === 'comment'
          ? ''
          : `${KIND_GLYPH[annotation.kind]} ${KIND_LABEL[annotation.kind]} · `;
      lines.push(
        `### ${index + 1}. ${kindTag}${describeAnchor(annotation.selector)}`,
        ''
      );
      lines.push(...anchorLines(annotation.selector));
      lines.push('');
      lines.push(...instructionLines(annotation));
      lines.push('');
    });
  }

  return lines.join('\n');
}

// The body of an entry: what the reviewer wants done. Each edit kind renders
// as an explicit instruction against "the marked text" — the ⟦ ⟧ run in the
// Context line above it — so an agent acts on the instruction rather than
// inferring one from prose.
function instructionLines(annotation: Annotation): string[] {
  const note = annotation.comment.trim();
  switch (annotation.kind) {
    case 'delete':
      return note
        ? ['Delete the marked text.', '', note]
        : ['Delete the marked text.'];
    case 'replace':
      return [`Replace the marked text with: “${note}”`];
    case 'insert':
      return [`Insert after the marked text: “${note}”`];
    case 'reword':
      return [`Reword the marked text: ${note}`];
    case 'comment':
      return [note];
  }
}

// What the reader needs to find this spot again — ordered by how well each
// line survives the trip from rendered page back to source.
//
// `Section` and `Context` are verbatim page text, so they still match a
// markdown or MDX file that rendered this page. `Anchor` is a rendered-DOM
// coordinate: precise for re-resolving in the browser, close to useless for
// locating a line in a component that generated it. Text leads; the selectors
// come last.
function anchorLines(bundle: SelectorBundle): string[] {
  const lines: string[] = [];

  if (bundle.headingAnchor) {
    lines.push(`- Section: “${bundle.headingAnchor.text}”`);
  }
  if (bundle.textRange) {
    // The quote delimited by ⟦ ⟧ inside its neighbouring text. Without this a
    // one-word quote names no particular place on the page.
    lines.push(`- Context: ${quoteInContext(bundle.textRange)}`);
  } else if (bundle.preview) {
    lines.push(`- Text: ${bundle.preview}`);
  }
  if (bundle.component) {
    lines.push(`- Component: ${bundle.component}`);
  }
  if (bundle.sourceRef) {
    lines.push(`- Source: \`${bundle.sourceRef}\``);
  }
  if (bundle.trail) {
    lines.push(`- Trail: \`${bundle.trail}\``);
  }

  lines.push(...anchorSection(bundle));
  return lines;
}

function anchorSection(bundle: SelectorBundle): string[] {
  const anchors = bundle.anchors ?? [];

  // Annotations stored before anchors existed carry only the container path.
  if (!anchors.length) {
    return bundle.cssPath
      ? [`- Anchor: \`${bundle.cssPath}\` (rendered DOM)`]
      : [];
  }

  // One element: the annotated element itself, or a text selection that never
  // left it. Both make the same promise — this names that element and no other.
  if (anchors.length === 1) {
    const anchor = anchors[0]!;
    return [
      `- Anchor (rendered DOM${uniqueNote(anchor)}${hiddenNote(anchor)}):`,
      ...selectorLines(anchor, '  '),
    ];
  }

  // Several: the selection crossed markup, so each run is named with the
  // element that actually holds it rather than with their common ancestor.
  const zones = bundle.textRange ? textZones(bundle.textRange) : [];
  const lines = [
    '- Anchors (rendered DOM). The selection crosses inline markup, so the whole',
    '  quote may not appear verbatim in source — these runs will, in this order:',
  ];
  let n = 0;
  anchors.forEach((anchor, i) => {
    // An empty zone is the whitespace between two elements; it is kept in the
    // zone list to stay index-aligned with anchors, but it is not a run worth
    // reporting.
    const text = zones[i];
    if (!text) return;
    n++;
    lines.push(`  ${n}. \`${text}\`${uniqueNote(anchor)}${hiddenNote(anchor)}`);
    lines.push(...selectorLines(anchor, '     '));
  });
  return lines;
}

function selectorLines(anchor: ElementAnchor, indent: string): string[] {
  const lines = [
    `${indent}- CSS: \`${anchor.css}\``,
    `${indent}- XPath: \`${anchor.xpath}\``,
  ];
  if (anchor.classes?.length) {
    lines.push(`${indent}- Classes: ${anchor.classes.join(' ')}`);
  }
  return lines;
}

/** Both selectors are checked against the live document when an annotation is
 * made, so silence means "matches exactly one element". Only the failure is
 * worth spending a reader's attention on. */
function uniqueNote(anchor: ElementAnchor): string {
  return anchor.unique ? '' : ' — WARNING: matches more than one element';
}

/** A selection swept across a parked popover captures text the reader never
 * saw. The quote has to keep it — the offsets count it — but an agent should
 * know not to hunt the visible page for it. */
function hiddenNote(anchor: ElementAnchor): string {
  return anchor.hidden ? ' (hidden at capture)' : '';
}

/** Filename for the download fallback, derived from the draft. */
export function exportFilename(draftId: string | undefined): string {
  return draftId ? `${draftId}-feedback.md` : 'feedback.md';
}
