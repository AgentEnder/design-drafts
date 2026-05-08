import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DraftManifestSchema } from '../src/draft-manifest.js';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'schemas', 'draft-manifest.schema.json');

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(DraftManifestSchema, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
