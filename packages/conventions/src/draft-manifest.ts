import { Type, type Static } from '@sinclair/typebox';

const RelativeHtmlPath = Type.String({
  pattern: '^(?!\\/)(?!.*\\.\\.(\\/|$)).+$',
  minLength: 1,
  description:
    'Path to an HTML file, relative to the draft root. Must not be empty or absolute and must not escape the draft root.',
});

const PageEntrySchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      description: 'Human-readable label for the page.',
    }),
    path: RelativeHtmlPath,
  },
  { additionalProperties: false }
);

const NamedEntrySchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      description: 'Human-readable label for the entry.',
    }),
    path: RelativeHtmlPath,
    description: Type.Optional(
      Type.String({
        description: 'Optional longer description shown in switchers.',
      })
    ),
  },
  { additionalProperties: false }
);

const DraftSourceSchema = Type.Object(
  {
    sha: Type.Optional(
      Type.String({
        minLength: 1,
        description: 'Git commit SHA the draft was generated from.',
      })
    ),
    repo: Type.Optional(
      Type.String({
        minLength: 1,
        description: 'Repository identifier (e.g. owner/name or URL).',
      })
    ),
    author: Type.Optional(
      Type.String({
        minLength: 1,
        description: 'Author or agent that produced the draft.',
      })
    ),
  },
  {
    additionalProperties: false,
    description: 'Snapshot of where the draft came from.',
  }
);

export const DraftManifestSchema = Type.Object(
  {
    $schema: Type.Optional(
      Type.String({
        description: 'Optional JSON Schema reference for editor tooling.',
      })
    ),
    name: Type.String({
      minLength: 1,
      description: 'Human-readable label for the draft.',
    }),
    description: Type.Optional(
      Type.String({
        description: 'Longer explanation of what the draft is exploring.',
      })
    ),
    pages: Type.Optional(
      Type.Array(PageEntrySchema, {
        description:
          'Distinct pages (e.g. landing, pricing) that exist in this draft. Each path points at an HTML file relative to the draft root.',
      })
    ),
    variants: Type.Optional(
      Type.Array(NamedEntrySchema, {
        description:
          'Alternative HTML files representing different variants of the design.',
      })
    ),
    themes: Type.Optional(
      Type.Array(NamedEntrySchema, {
        description: 'Theme variations, each as a distinct HTML file.',
      })
    ),
    layouts: Type.Optional(
      Type.Array(NamedEntrySchema, {
        description: 'Layout variations, each as a distinct HTML file.',
      })
    ),
    prompt: Type.Optional(
      Type.String({
        description:
          "The brief that generated the draft. Free text, or a path reference like 'references/brief.md'.",
      })
    ),
    source: Type.Optional(DraftSourceSchema),
    createdAt: Type.String({
      format: 'date-time',
      description: 'ISO 8601 timestamp marking when the draft was generated.',
    }),
  },
  {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://design-drafts.dev/schemas/draft-manifest.schema.json',
    title: 'DraftManifest',
    description:
      'Machine-readable description of a design draft. Lives at the root of a draft directory as draft.config.json. Themes, layouts, pages, and variants are all distinct HTML files; the manifest is a routing table consumed by the toolbar, the index site, and the annotate package.',
    additionalProperties: false,
  }
);

export type DraftManifest = Static<typeof DraftManifestSchema>;
export type DraftPageEntry = Static<typeof PageEntrySchema>;
export type DraftNamedEntry = Static<typeof NamedEntrySchema>;
export type DraftSource = Static<typeof DraftSourceSchema>;
