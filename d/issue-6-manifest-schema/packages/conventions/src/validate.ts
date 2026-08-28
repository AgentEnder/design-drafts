import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';
import * as addFormatsModule from 'ajv-formats';

// ajv-formats ships as CommonJS with both `module.exports = fn` and
// `exports.default = fn`. Under NodeNext + esModuleInterop the namespace
// import is the safest spelling, so we reach into `.default`.
const addFormats = (
  addFormatsModule as unknown as {
    default: (ajv: unknown) => unknown;
  }
).default;

import { DraftManifestSchema, type DraftManifest } from './draft-manifest.js';

export type ValidationResult =
  | { ok: true; manifest: DraftManifest }
  | { ok: false; errors: string[] };

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const validateManifest = ajv.compile<DraftManifest>(DraftManifestSchema);

/**
 * Validate an unknown value against the draft manifest schema.
 *
 * Returns a discriminated union: on failure, `errors` is an array of friendly,
 * human-readable strings (each prefixed with the JSON Pointer path of the
 * offending field).
 */
export function validateDraftManifest(input: unknown): ValidationResult {
  if (validateManifest(input)) {
    return { ok: true, manifest: input };
  }
  const errors = (validateManifest.errors ?? []).map(formatError);
  return { ok: false, errors };
}

/**
 * Parse and validate a JSON string in one step. Returns the same
 * `ValidationResult` shape as {@link validateDraftManifest}; JSON parse errors
 * are surfaced as a single friendly error message.
 */
export function parseDraftManifest(json: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, errors: [`Invalid JSON: ${message}`] };
  }
  return validateDraftManifest(parsed);
}

function formatError(error: ErrorObject): string {
  const path = error.instancePath || '(root)';
  switch (error.keyword) {
    case 'required': {
      const missing = (error.params as { missingProperty: string })
        .missingProperty;
      return `${path}: missing required property "${missing}"`;
    }
    case 'additionalProperties': {
      const extra = (error.params as { additionalProperty: string })
        .additionalProperty;
      return `${path}: unknown property "${extra}"`;
    }
    case 'type': {
      const expected = (error.params as { type: string }).type;
      return `${path}: expected ${expected}`;
    }
    case 'minLength': {
      return `${path}: must not be empty`;
    }
    case 'pattern': {
      return `${path}: path must be relative to the draft root and must not start with "/" or contain ".." segments`;
    }
    case 'format': {
      const format = (error.params as { format: string }).format;
      if (error.data === undefined) {
        return `${path}: must be a valid ${format}`;
      }
      return `${path}: must be a valid ${format} (got ${JSON.stringify(error.data)})`;
    }
    default: {
      return `${path}: ${error.message ?? 'invalid value'}`;
    }
  }
}
