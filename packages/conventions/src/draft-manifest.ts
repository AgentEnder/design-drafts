import { Type, type Static } from '@sinclair/typebox';

const RelativeHtmlPath = Type.String({
  pattern: '^(?!\\/)(?!.*\\.\\.(\\/|$)).+$',
  minLength: 1,
  description:
    'Path to an HTML file, relative to the draft root. Must not be empty or absolute and must not escape the draft root.',
});

const AxisIdentifier = Type.String({
  pattern: '^[a-z][a-z0-9_-]*$',
  minLength: 1,
  description:
    'Lowercase identifier used as a key in page coordinates and a query param in the toolbar URL.',
});

const AxisChoiceSchema = Type.Object(
  {
    name: Type.String({
      pattern: '^[a-z0-9][a-z0-9_-]*$',
      minLength: 1,
      description:
        'Identifier for this choice on its axis. Used in page coordinates and as the toolbar URL value.',
    }),
    label: Type.Optional(
      Type.String({
        minLength: 1,
        description:
          'Short, human-friendly name shown in the toolbar (e.g. "Cinematic"). Keep it to a couple of words. Falls back to a humanised form of `name` when omitted.',
      })
    ),
    description: Type.Optional(
      Type.String({
        description:
          'Optional longer explanation shown as a tooltip / secondary line in the toolbar. Prose, not a label — the toolbar never renders it as the primary text.',
      })
    ),
  },
  { additionalProperties: false }
);

const AxisSchema = Type.Object(
  {
    name: AxisIdentifier,
    label: Type.Optional(
      Type.String({
        minLength: 1,
        description:
          'Short, human-friendly name for this axis shown in the toolbar (e.g. "Theme"). Falls back to a humanised form of `name` when omitted.',
      })
    ),
    description: Type.Optional(
      Type.String({
        description:
          'Optional longer explanation of what this axis represents, shown as a tooltip in the toolbar. Prose, not a label.',
      })
    ),
    choices: Type.Array(AxisChoiceSchema, {
      minItems: 1,
      description: 'The set of values this axis can take.',
    }),
  },
  {
    additionalProperties: false,
    description:
      'A single design dimension (e.g. theme, layout, density). Pages combine choices across axes; switching an axis in the toolbar navigates to the page that holds the corresponding combination.',
  }
);

const PageSchema = Type.Object(
  {
    coordinates: Type.Record(AxisIdentifier, Type.String({ minLength: 1 }), {
      description:
        'Choice name per axis, identifying which point in the proposal this file represents. Keys must match an axis name; values must match a choice name within that axis.',
    }),
    path: RelativeHtmlPath,
    description: Type.Optional(
      Type.String({
        description: 'Optional note about what this specific combination demonstrates.',
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
    axes: Type.Optional(
      Type.Array(AxisSchema, {
        description:
          'Design dimensions explored by this draft. Optional — a draft with no axes is a single-page proposal.',
      })
    ),
    pages: Type.Array(PageSchema, {
      minItems: 1,
      description:
        'Concrete files in the draft. Each page records the axis coordinates it represents and the relative path to its HTML. Sparse coverage is allowed; toolbar disables choices with no matching neighbour from the current coordinate.',
    }),
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
      'Machine-readable description of a design draft. Lives at the root of a draft directory as design-drafts.config.json. A draft is a proposal made up of one or more axes; each page is a specific combination of axis choices realised as an HTML file.',
    additionalProperties: false,
  }
);

export type DraftManifest = Static<typeof DraftManifestSchema>;
export type DraftAxis = Static<typeof AxisSchema>;
export type DraftAxisChoice = Static<typeof AxisChoiceSchema>;
export type DraftPage = Static<typeof PageSchema>;
export type DraftSource = Static<typeof DraftSourceSchema>;
