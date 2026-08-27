import { readHomeConfigValue, CONFIG_FILENAME } from './config';

// The third place a `design-drafts.config.json` lives.
//
// The filename already means different things by location: in a draft it is
// the manifest, in $HOME it is the CLI's defaults. On the default branch of a
// host repo it is what that host says about itself — starting with where it
// publishes drafts, which nothing else can answer. A host is free to keep the
// root of its Pages site for something else (this project's host keeps it for
// the docs site) and publish drafts under a sub-path. Guess wrong and the URL
// `push` prints 404s, and every search result link baked into a markdown draft
// resolves one directory too high.
//
// It is read over the network from the same place `push` already reads the
// deploy workflow, which is what makes it the one copy a contributor pushing
// from a clone and the CLI can both agree on.

const DEFAULT_BRANCH = 'main';

// One small GET decorating a push that is about to do real work. Anything
// slower than this is a stall, and the fallback is right for most hosts.
const LOOKUP_TIMEOUT_MS = 5_000;

export interface RemoteConfig {
  /**
   * Path between the Pages site root and a draft's own directory, with no
   * leading or trailing slash. Empty — the default, and what every host that
   * declares nothing gets — means drafts sit directly at the site root.
   */
  draftsPath: string;
}

const DEFAULT_CONFIG: RemoteConfig = { draftsPath: '' };

export function remoteConfigUrl(repo: string): string {
  return `https://raw.githubusercontent.com/${repo}/${DEFAULT_BRANCH}/${CONFIG_FILENAME}`;
}

/**
 * Reads what the CLI needs from a host's config, ignoring everything else.
 *
 * Ignoring the rest is load-bearing rather than lazy: the file shares its name
 * with the draft manifest, so a host repo whose root happens to be a draft
 * serves a manifest at this URL. That is a host declaring nothing, not an
 * error. A `draftsPath` of the wrong type is the real error, and it throws —
 * the whole point of the file is that the layout cannot be inferred, so a
 * value we can't read is not a thing to shrug at.
 */
export function parseRemoteConfig(raw: string): RemoteConfig {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${CONFIG_FILENAME} must contain a JSON object`);
  }

  const value = (parsed as { draftsPath?: unknown }).draftsPath;
  if (value === undefined) return DEFAULT_CONFIG;
  if (typeof value !== 'string') {
    throw new Error(`${CONFIG_FILENAME}: draftsPath must be a string`);
  }

  // Hand-written, so accept "/d/", "d/" and "d" alike and store one form.
  const draftsPath = value.replace(/^\/+/, '').replace(/\/+$/, '');
  if (draftsPath.split('/').includes('..')) {
    throw new Error(
      `${CONFIG_FILENAME}: draftsPath must stay inside the site (got ${JSON.stringify(value)})`
    );
  }
  return { draftsPath };
}

/**
 * Asks the host repo's default branch what it says about itself.
 *
 * Missing is the ordinary answer — most hosts publish drafts to the site root
 * and have no config at all — so a 404 is silent. A file that is there and
 * doesn't parse is the loud case: someone stated something and the CLI is
 * about to ignore it. Either way this decorates work that has already been
 * decided, so it degrades to the default rather than failing the command.
 */
export async function fetchRemoteConfig(repo: string): Promise<RemoteConfig> {
  const url = remoteConfigUrl(repo);
  let raw: string;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (response.status === 404) return DEFAULT_CONFIG;
    if (!response.ok) {
      console.warn(
        `Warning: could not read ${CONFIG_FILENAME} from ${repo} (HTTP ${response.status}); assuming drafts publish to the site root.`
      );
      return DEFAULT_CONFIG;
    }
    raw = await response.text();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(
      `Warning: could not read ${CONFIG_FILENAME} from ${repo} (${reason}); assuming drafts publish to the site root.`
    );
    return DEFAULT_CONFIG;
  }

  try {
    return parseRemoteConfig(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: ignoring ${repo}'s ${CONFIG_FILENAME} — ${reason}.`);
    return DEFAULT_CONFIG;
  }
}

/**
 * Where `repo` publishes drafts, from the places the CLI checks in order: the
 * host's own config on its default branch, then the home config.
 *
 * The host wins because this is a fact about the host rather than a
 * preference, and only the host can state it. The home config is the escape
 * hatch for a host whose default branch you can't edit; set there, it applies
 * to every host that declares nothing, which is why it is the lower one.
 */
export async function resolveDraftsPath(repo: string): Promise<string> {
  const { draftsPath } = await fetchRemoteConfig(repo);
  if (draftsPath) return draftsPath;
  return readHomeConfigValue('draftsPath') ?? '';
}
