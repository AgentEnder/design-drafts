export type {
  DraftManifest,
  DraftNamedEntry,
  DraftPageEntry,
  DraftSource,
} from './draft-manifest.js';

export {
  parseDraftManifest,
  validateDraftManifest,
  type ValidationResult,
} from './validate.js';

export { default as draftManifestSchema } from './draft-manifest.schema.json' with { type: 'json' };
