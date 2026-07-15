// The draft identity every generated page declares, and how readers get it back.
//
// Annotations are stored per page URL, and a URL is a weaker identity than it
// looks: two drafts previewed in turn at `http://localhost:4000/` are the same
// URL, so annotations written against the first would surface on the second. A
// page therefore says which draft it belongs to, and readers filter on that.
//
// The id is the draft's site-name slug (the branch and gh-pages directory
// name), so it is derived — nothing new to keep in sync in the manifest.

export const DRAFT_ID_META_NAME = 'draftId';

/** The declaration a generated page carries in its `<head>`. */
export function draftIdMetaTag(draftId: string): string {
  const escaped = draftId
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<meta name="${DRAFT_ID_META_NAME}" content="${escaped}" />`;
}

/**
 * The draft a page belongs to, or undefined when it declares none — a
 * hand-written draft, or a page generated before this convention existed.
 * Undefined is a real identity, not an error: such pages are scoped by URL
 * alone, exactly as they were before.
 */
export function readDraftId(doc: Document): string | undefined {
  const meta = doc.querySelector(`meta[name="${DRAFT_ID_META_NAME}"]`);
  const declared = meta?.getAttribute('content')?.trim();
  return declared ? declared : undefined;
}
