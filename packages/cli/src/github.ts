import { capture, succeeds } from './exec';

// The prefix the deploy workflow strips when it maps a draft branch to a
// published directory. This is NOT the CLI's configurable `--prefix`: a branch
// pushed under any other prefix keeps that prefix in the deployed path — and
// never auto-triggers the deploy, whose push trigger is scoped to `drafts/**`.
//
// Three copies of this string have to agree, because they live in three places
// that can't import each other: this one (what the deploy DOES with a branch),
// `DEFAULT_PREFIX` in config.ts (what the CLI names a branch by default), and
// `DRAFT_BRANCH_PREFIX` / the `branches:` filter in
// .github/workflows/deploy-preview.yml (what the deploy runs FOR). Change one,
// change all three.
const DEPLOYED_BRANCH_PREFIX = 'drafts/';

// A Pages metadata lookup is one small GET; anything slower than this is a
// stall, not a slow response.
const PAGES_LOOKUP_TIMEOUT_MS = 5_000;

/** The directory the deploy workflow publishes a draft branch under. */
function previewDir(branchName: string): string {
  return branchName.startsWith(DEPLOYED_BRANCH_PREFIX)
    ? branchName.slice(DEPLOYED_BRANCH_PREFIX.length)
    : branchName;
}

/**
 * Picks a remote URL for a GitHub repo using auth that actually works.
 *
 * `gh config get git_protocol` reflects the transport the user authenticated
 * with — if they set up gh over HTTPS, gh installs a git credential helper and
 * HTTPS pushes succeed while SSH would fail (no key), and vice versa. We honor
 * that signal and fall back to SSH (git's traditional default) when gh isn't
 * present to ask.
 */
export function githubRemoteUrl(repo: string, cwd: string): string {
  const protocol = capture('gh config get git_protocol', cwd);
  if (protocol === 'https') {
    return `https://github.com/${repo}.git`;
  }
  return `git@github.com:${repo}.git`;
}

/**
 * Infers the GitHub Pages path a draft branch will be served under, so
 * anything that needs the deployed site's base url (e.g. search result links)
 * can be baked in at push time.
 *
 * A project repo `owner/name` serves from `/name/`, while a user/organization
 * pages repo (`owner/owner.github.io`) serves from `/`. The deploy workflow
 * maps branch `drafts/<site>` to directory `<site>` (only the canonical
 * `drafts/` prefix is stripped — any other prefix stays in the path).
 * Custom Pages domains can't be inferred from the repo and are ignored — for a
 * user pages repo the path-only form works under one anyway, and callers that
 * need the real site root ask GitHub for it via `lookupPagesSite`.
 */
export function pagesBasePath(repo: string, branchName: string): string {
  const [owner, name] = repo.split('/');
  const dir = previewDir(branchName);
  const isUserPagesRepo =
    name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  return isUserPagesRepo ? `/${dir}/` : `/${name}/${dir}/`;
}

/** Where GitHub says this repo's Pages site lives, when it will tell us. */
export type PagesSite =
  | { status: 'ok'; siteUrl: string }
  | { status: 'not-enabled' }
  | { status: 'unknown' };

/**
 * Asks GitHub for the repo's Pages site root.
 *
 * `html_url` is the one answer that survives a custom domain: a project repo
 * normally reports `https://<owner>.github.io/<name>/`, but with a CNAME
 * configured GitHub serves the site from the domain root instead and reports
 * that — the `/<name>/` segment disappears. So we ask rather than assume.
 *
 * One `gh api` call is cheap next to the force-push it follows, and it also
 * separates "Pages is off, nothing will ever appear" from "we couldn't ask".
 * Only that failure path pays for the second call.
 *
 * Everything here is decoration on a push that has already succeeded, so it is
 * bounded: `gh` has no overall request timeout of its own, and a hung DNS
 * lookup or stalled TLS handshake must never leave the terminal blocked on a
 * message. Anything slower than the budget degrades to `unknown`.
 */
export function lookupPagesSite(repo: string, cwd: string): PagesSite {
  const siteUrl = capture(
    `gh api repos/${repo}/pages --jq .html_url`,
    cwd,
    PAGES_LOOKUP_TIMEOUT_MS
  );
  if (siteUrl) {
    return { status: 'ok', siteUrl };
  }
  // Reading the repo but not its Pages metadata means Pages is off. The one
  // false positive is a token scoped to `repo` but not to Pages, which reads as
  // `not-enabled`; a default `gh auth login` grants both, so we accept it.
  return succeeds(`gh api repos/${repo} --silent`, cwd, PAGES_LOOKUP_TIMEOUT_MS)
    ? { status: 'not-enabled' }
    : { status: 'unknown' };
}

/**
 * Composes the absolute URL a pushed draft will be served from.
 *
 * `siteUrl` is the site root as GitHub reported it (`lookupPagesSite`); the
 * draft's directory sits directly beneath it, whatever domain or path that
 * root turns out to be. Without it we fall back to the default
 * `<owner>.github.io` origin plus `pagesBasePath` — correct unless a custom
 * domain is configured, which callers must say out loud.
 */
export function pagesPreviewUrl(
  repo: string,
  branchName: string,
  siteUrl?: string
): string {
  if (siteUrl) {
    return `${siteUrl.replace(/\/+$/, '')}/${previewDir(branchName)}/`;
  }
  const owner = repo.split('/')[0].toLowerCase();
  return `https://${owner}.github.io${pagesBasePath(repo, branchName)}`;
}

/**
 * The block `push` prints once the branch has landed.
 *
 * The second line is the point of it: the push only triggers the deploy, and
 * the page does not exist until that workflow finishes building. Buried in a
 * parenthetical, the first click 404s and reads as a bug in the push.
 */
export function previewLocationMessage(opts: {
  repo: string;
  branchName: string;
  site: PagesSite;
}): string {
  const { repo, branchName, site } = opts;
  const dispatch = `gh workflow run deploy-preview.yml -f branch=${branchName} --repo ${repo}`;
  const url = pagesPreviewUrl(
    repo,
    branchName,
    site.status === 'ok' ? site.siteUrl : undefined
  );

  if (site.status === 'not-enabled') {
    // No Pages means no CNAME either, so the default github.io form is the one
    // to promise once the site is actually turned on.
    return [
      `GitHub Pages is not enabled on ${repo} — the deploy has nowhere to publish.`,
      `Enable it (Settings -> Pages -> Source: GitHub Actions), then run the deploy:`,
      `  ${dispatch}`,
      `Once it builds, the preview will be at:`,
      `  ${url}`,
    ].join('\n');
  }

  // An unconfirmed site root has to be flagged in the HEADER. Reusing the
  // confirmed one and hedging further down puts the doubt on the line a reader
  // skips, which is the same as not saying it.
  const lines =
    site.status === 'ok'
      ? ['Preview will be at:', `  ${url}`]
      : [
          'Preview will probably be at:',
          `  ${url}`,
          "  Unconfirmed — `gh` could not report this repo's Pages URL (not installed, not",
          '  signed in, no access to the repo, or GitHub unreachable), and a custom domain',
          '  would change the site root.',
        ];
  lines.push(
    '  Not live yet — the deploy workflow still has to build it (usually a minute',
    '  or two; longer on the first deploy or a busy runner).'
  );
  if (!branchName.startsWith(DEPLOYED_BRANCH_PREFIX)) {
    lines.push(
      `  The deploy only auto-runs for "${DEPLOYED_BRANCH_PREFIX}" branches, so start this one:`,
      `    ${dispatch}`
    );
  }
  return lines.join('\n');
}
