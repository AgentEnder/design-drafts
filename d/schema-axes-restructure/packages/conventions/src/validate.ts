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
  if (!validateManifest(input)) {
    const errors = (validateManifest.errors ?? []).map(formatError);
    return { ok: false, errors };
  }
  const semanticErrors = checkSemantics(input);
  if (semanticErrors.length > 0) {
    return { ok: false, errors: semanticErrors };
  }
  return { ok: true, manifest: input };
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

// JSON Schema can't express "page coordinates must reference declared axes
// and choices" or "page paths are unique" — those are checked here once
// the structural shape is known to be valid.
function checkSemantics(manifest: DraftManifest): string[] {
  const errors: string[] = [];
  const axesByName = new Map(
    (manifest.axes ?? []).map((axis) => [
      axis.name,
      new Set(axis.choices.map((c) => c.name)),
    ])
  );

  const seenPaths = new Map<string, number>();
  const axisNames = Array.from(axesByName.keys());
  manifest.pages.forEach((page, pageIndex) => {
    const prior = seenPaths.get(page.path);
    if (prior !== undefined) {
      errors.push(
        `/pages/${pageIndex}/path: duplicates path of /pages/${prior} ("${page.path}")`
      );
    } else {
      seenPaths.set(page.path, pageIndex);
    }

    for (const [axisName, choiceName] of Object.entries(page.coordinates)) {
      const choices = axesByName.get(axisName);
      if (!choices) {
        errors.push(
          `/pages/${pageIndex}/coordinates/${axisName}: references unknown axis "${axisName}"`
        );
        continue;
      }
      if (!choices.has(choiceName)) {
        errors.push(
          `/pages/${pageIndex}/coordinates/${axisName}: "${choiceName}" is not a choice on axis "${axisName}"`
        );
      }
    }

    for (const axisName of axisNames) {
      if (!(axisName in page.coordinates)) {
        errors.push(
          `/pages/${pageIndex}/coordinates: missing axis "${axisName}" — every page must specify a choice for every declared axis`
        );
      }
    }
  });

  return errors;
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
    case 'minItems': {
      return `${path}: must have at least one entry`;
    }
    case 'pattern': {
      return `${path}: value does not match expected pattern (${(error.params as { pattern?: string }).pattern ?? 'unknown'})`;
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
