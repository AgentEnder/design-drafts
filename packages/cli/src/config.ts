import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { text } from '@clack/prompts';

export const CONFIG_FILENAME = 'design-drafts.config.json';
export const DEFAULT_PREFIX = 'drafts/';

export const homeConfigPath = join(homedir(), CONFIG_FILENAME);
export const localConfigPath = join(process.cwd(), CONFIG_FILENAME);

// JsonFile() walks up from cwd and only finds the nearest match, which means
// the home-level config is invisible when cwd isn't under $HOME. Register an
// explicit provider so it's always read.
export const homeJsonProvider = {
  resolve: () => (existsSync(homeConfigPath) ? homeConfigPath : undefined),
  load: (filename: string) => JSON.parse(readFileSync(filename, 'utf-8')),
};

function readConfig(configPath: string): Record<string, unknown> {
  return existsSync(configPath)
    ? JSON.parse(readFileSync(configPath, 'utf-8'))
    : {};
}

/** Reads a single key from the home config without prompting. Used by the magic
 * `init` to decide whether the host has already been set up. */
export function readHomeConfigValue(key: string): string | undefined {
  const value = readConfig(homeConfigPath)[key];
  return typeof value === 'string' ? value : undefined;
}

export async function promptAndPersist(
  existing: string | undefined,
  argKey: string,
  configPath: string,
  promptMessage: string,
  // Optional extra check, run in the prompt so an invalid value is re-prompted
  // and never persisted. Returns an error message, or undefined when valid.
  validate?: (value: string) => string | undefined
): Promise<string> {
  if (existing) return existing;

  const value = await text({
    message: promptMessage,
    validate: (v) => {
      if (!v?.trim()) return `${argKey} is required`;
      return validate?.(v);
    },
  });

  if (typeof value !== 'string') {
    process.exit(1);
  }

  writeFileSync(
    configPath,
    JSON.stringify({ ...readConfig(configPath), [argKey]: value }, null, 2) +
      '\n'
  );
  return value;
}

export function persistHomeConfigValue(key: string, value: string): void {
  const previousFile = readConfig(homeConfigPath);
  if (previousFile[key] === value) return;
  writeFileSync(
    homeConfigPath,
    JSON.stringify({ ...previousFile, [key]: value }, null, 2) + '\n'
  );
}

export function resolvePrefix(existing: string | undefined): string {
  // Treat undefined as "no value configured" -> use default and persist it so
  // the home config visibly records the value. Treat an explicit empty string
  // as a deliberate opt-out (no prefix); honor and persist it.
  if (typeof existing === 'string') {
    persistHomeConfigValue('prefix', existing);
    return existing;
  }
  persistHomeConfigValue('prefix', DEFAULT_PREFIX);
  return DEFAULT_PREFIX;
}
