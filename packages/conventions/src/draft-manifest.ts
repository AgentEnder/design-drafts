/**
 * Type definitions for `draft.config.json` — the manifest placed at the root
 * of a design draft directory.
 *
 * The manifest is a routing table: themes, layouts, pages, and variants are
 * each realized as different HTML files, and consumers (toolbar, site,
 * annotate) use the listed paths to navigate between them.
 */

/**
 * Optional metadata describing where a draft was generated from.
 */
export interface DraftSource {
  /** Git commit SHA the draft was generated from. */
  sha?: string;
  /** Repository identifier (e.g. `owner/name` or a URL). */
  repo?: string;
  /** Author or agent that produced the draft. */
  author?: string;
}

/**
 * Entry shared by themes, layouts, and variants. Each entry is a single HTML
 * file under the draft root.
 */
export interface DraftNamedEntry {
  /** Human-readable label. */
  name: string;
  /** Path to the HTML file, relative to the draft root. */
  path: string;
  /** Optional longer description shown in switchers. */
  description?: string;
}

/**
 * A page within the draft (e.g. landing, pricing). Points at an HTML file.
 */
export interface DraftPageEntry {
  /** Human-readable label. */
  name: string;
  /** Path to the HTML file, relative to the draft root. */
  path: string;
}

/**
 * Shape of `draft.config.json`.
 */
export interface DraftManifest {
  /** Optional JSON Schema reference for editor tooling. */
  $schema?: string;
  /** Human-readable label for the draft. */
  name: string;
  /** Longer explanation of what the draft is exploring. */
  description?: string;
  /** Distinct pages (e.g. landing, pricing). */
  pages?: DraftPageEntry[];
  /** Alternative HTML files representing different design variants. */
  variants?: DraftNamedEntry[];
  /** Theme variations, each as a distinct HTML file. */
  themes?: DraftNamedEntry[];
  /** Layout variations, each as a distinct HTML file. */
  layouts?: DraftNamedEntry[];
  /** The brief that generated the draft. Free text or a path reference. */
  prompt?: string;
  /** Snapshot of where the draft came from. */
  source?: DraftSource;
  /** ISO 8601 timestamp marking when the draft was generated. */
  createdAt: string;
}
