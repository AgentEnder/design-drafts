export const SITE_NAME_PATTERN = /^[a-z0-9][a-z0-9-_]{0,62}$/;

export function slugifySiteName(input: string): string {
  const lowered = input.toLowerCase();
  const replaced = lowered.replace(/[^a-z0-9_-]+/g, '-');
  const trimmed = replaced.replace(/^-+/, '').replace(/-+$/, '');
  // Ensure the first character is alphanumeric (the pattern requires it even
  // though the body allows _ or -).
  const leading = trimmed.replace(/^[-_]+/, '');
  return leading.slice(0, 63);
}

export function validateSiteName(
  name: string
): { ok: true } | { ok: false; reason: string; suggestion?: string } {
  if (!name || !name.trim()) {
    return { ok: false, reason: 'site-name must not be empty' };
  }
  if (name.length > 63) {
    const suggestion = slugifySiteName(name);
    return {
      ok: false,
      reason: 'site-name must be 63 characters or fewer',
      suggestion: suggestion || undefined,
    };
  }
  if (!SITE_NAME_PATTERN.test(name)) {
    const suggestion = slugifySiteName(name);
    return {
      ok: false,
      reason:
        'site-name must start with a lowercase letter or digit and contain only lowercase letters, digits, hyphens, or underscores',
      suggestion: suggestion || undefined,
    };
  }
  return { ok: true };
}
