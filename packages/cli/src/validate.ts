// Validators for values that get interpolated into shell commands (repo names,
// branch prefixes, git refs). Beyond catching typos, the strict patterns are a
// security boundary: every command runs through execSync with the shell on, so
// a value containing spaces, `;`, `$()`, or backticks would either break the
// command or inject another. Reject anything outside the allowed character set
// before it reaches the shell.

export type ValidationResult = { ok: true } | { ok: false; reason: string };

// owner/name — GitHub's allowed characters for each segment.
const REPO_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
// Branch prefix: ref-name characters plus `/`; may be empty (no prefix).
const PREFIX_PATTERN = /^[A-Za-z0-9._/-]*$/;
// A git ref (branch, tag, or sha): ref-name characters plus `/`.
const REF_PATTERN = /^[A-Za-z0-9._/-]+$/;

export function validateRepo(repo: string): ValidationResult {
  if (!repo.trim()) {
    return { ok: false, reason: 'repo must not be empty' };
  }
  if (!REPO_PATTERN.test(repo)) {
    return {
      ok: false,
      reason:
        'repo must be in "owner/name" form using only letters, digits, ".", "_", or "-"',
    };
  }
  return { ok: true };
}

export function validatePrefix(prefix: string): ValidationResult {
  if (!PREFIX_PATTERN.test(prefix)) {
    return {
      ok: false,
      reason:
        'prefix may contain only letters, digits, "/", ".", "_", or "-"',
    };
  }
  return { ok: true };
}

export function validateTemplateRef(ref: string): ValidationResult {
  if (!REF_PATTERN.test(ref)) {
    return {
      ok: false,
      reason:
        'template-ref may contain only letters, digits, "/", ".", "_", or "-"',
    };
  }
  return { ok: true };
}
