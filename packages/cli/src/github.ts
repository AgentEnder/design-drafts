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
