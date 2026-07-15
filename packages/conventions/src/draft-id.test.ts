// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { DRAFT_ID_META_NAME, draftIdMetaTag, readDraftId } from './draft-id.js';

/** Parses a head fragment the way a browser would, so the emit side and the
 * read side are exercised against a real HTML parser rather than a stub. */
function parseHead(head: string): Document {
  return new DOMParser().parseFromString(
    `<!doctype html><html><head>${head}</head><body></body></html>`,
    'text/html'
  );
}

describe('draftIdMetaTag / readDraftId', () => {
  it('round-trips an id through a parsed document', () => {
    const doc = parseHead(draftIdMetaTag('toolbar-redesign'));
    expect(readDraftId(doc)).toBe('toolbar-redesign');
  });

  it('reads nothing from a page that declares no draft', () => {
    expect(readDraftId(parseHead('<title>Hand-written draft</title>'))).toBeUndefined();
  });

  it('reads nothing from a page whose declaration is empty', () => {
    const doc = parseHead(`<meta name="${DRAFT_ID_META_NAME}" content="  " />`);
    expect(readDraftId(doc)).toBeUndefined();
  });

  // Ids are site-name slugs today, so the quote can't occur — but the emitter
  // must not be the thing standing between a future id and an attribute break.
  it('escapes an id that would otherwise close the attribute', () => {
    const doc = parseHead(draftIdMetaTag('a" onload="alert(1)'));
    expect(readDraftId(doc)).toBe('a" onload="alert(1)');
    expect(doc.querySelector('meta')?.hasAttribute('onload')).toBe(false);
  });
});
