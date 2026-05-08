// Persistence for annotations.
//
// SECURITY NOTE: localStorage is shared with any script running on the page.
// A malicious draft could read or tamper with annotations. This is acceptable
// for a review tool that runs only on trusted draft previews; do not use the
// annotate package to capture sensitive feedback. See README for details.

import type { SelectorBundle } from './selectors.js';

export interface Annotation {
  id: string;
  selector: SelectorBundle;
  comment: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_PREFIX = 'dd:annotate:';

function storageKey(): string {
  return STORAGE_PREFIX + currentPageUrl();
}

export function currentPageUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('annotate');
  url.searchParams.delete('toolbar');
  url.searchParams.delete('reveal');
  url.hash = '';
  return url.toString();
}

function safeRead(): Annotation[] {
  try {
    const raw = window.localStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAnnotation);
  } catch {
    return [];
  }
}

function safeWrite(annotations: Annotation[]): void {
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(annotations));
  } catch {
    // localStorage may be disabled, full, or denied — fail silently. The
    // user will at least have annotations for the rest of the session.
  }
}

function isAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.comment === 'string' &&
    typeof v.createdAt === 'number' &&
    typeof v.updatedAt === 'number' &&
    typeof v.selector === 'object' &&
    v.selector !== null
  );
}

export function loadAnnotations(): Annotation[] {
  return safeRead();
}

// Enumerate every annotation set in localStorage for this origin, keyed by
// the page URL. Used by the panel to surface annotations made on sibling
// draft pages so reviewers can see the whole session at once.
export function loadAnnotationsByUrl(): Map<string, Annotation[]> {
  const out = new Map<string, Annotation[]>();
  try {
    const origin = window.location.origin;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const url = key.slice(STORAGE_PREFIX.length);
      try {
        const parsed = new URL(url);
        if (parsed.origin !== origin) continue;
      } catch {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const valid = list.filter(isAnnotation);
          if (valid.length) out.set(url, valid);
        }
      } catch {
        // Skip malformed entries.
      }
    }
  } catch {
    // localStorage may be inaccessible.
  }
  return out;
}

export function saveAnnotation(annotation: Annotation): void {
  const all = safeRead();
  const existing = all.findIndex((a) => a.id === annotation.id);
  if (existing >= 0) {
    all[existing] = annotation;
  } else {
    all.push(annotation);
  }
  safeWrite(all);
}

export function deleteAnnotation(id: string): void {
  const all = safeRead().filter((a) => a.id !== id);
  safeWrite(all);
}

export function generateId(): string {
  // No crypto.randomUUID dependency assumed; this is fine for a local key.
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  );
}
