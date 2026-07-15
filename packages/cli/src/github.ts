import { capture } from './exec';

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
 * Custom Pages domains can't be inferred from the repo and are ignored; the
 * path-only form works for them too when they serve from the domain root.
 */
export function pagesBasePath(repo: string, branchName: string): string {
  const [owner, name] = repo.split('/');
  const previewDir = branchName.startsWith('drafts/')
    ? branchName.slice('drafts/'.length)
    : branchName;
  const isUserPagesRepo =
    name.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  return isUserPagesRepo ? `/${previewDir}/` : `/${name}/${previewDir}/`;
}
