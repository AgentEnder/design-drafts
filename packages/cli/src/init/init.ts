import { readHomeConfigValue } from '../config';
import { initDraft } from './draft';
import { initHost } from './host';

export interface InitOptions {
  path: string;
  repo?: string;
  siteName?: string;
  templateRef?: string;
  cliVersion: string;
}

/**
 * The "from nothing to ready-to-publish" path. Scaffolds a host the first time
 * (detected by the absence of a configured `repo`), then scaffolds a draft in
 * the target directory. Stops short of auto-pushing a placeholder — it prints
 * the single command to publish instead.
 */
export async function init(opts: InitOptions): Promise<void> {
  const hostConfigured = Boolean(opts.repo ?? readHomeConfigValue('repo'));

  if (!hostConfigured) {
    console.log('No host configured yet — setting one up first.\n');
    // Scaffold the host in a throwaway tmpdir (the default): it only needs to
    // live on GitHub, not next to the draft we create in the target directory.
    await initHost({
      repo: opts.repo,
      templateRef: opts.templateRef,
      cliVersion: opts.cliVersion,
    });
    console.log('');
  }

  await initDraft({ path: opts.path, siteName: opts.siteName });

  console.log('\nWhen the draft looks right, run `design-drafts` to publish.');
}
