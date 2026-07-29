import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { capture, succeeds } from './exec';

// A command that would outlast any test run, spawned through the same node
// binary vitest is running under so there is no dependency on shell builtins.
// Paired with a timeout ~100x shorter, the assertions below turn on a margin
// no scheduler hiccup can close — nothing sleeps waiting for a real deadline.
const HANGS = `${JSON.stringify(process.execPath)} -e "setTimeout(() => {}, 600000)"`;
const TIMEOUT_MS = 250;

describe('capture', () => {
  it('returns stdout when the command exits in time', () => {
    expect(
      capture(
        `${JSON.stringify(process.execPath)} -e "console.log('hi')"`,
        tmpdir(),
        TIMEOUT_MS
      )
    ).toBe('hi');
  });

  it('gives up on a hung command instead of blocking the CLI', () => {
    // The push has already landed by the time anything here runs, so a stalled
    // probe must degrade to "no answer", never hold the terminal open.
    expect(capture(HANGS, tmpdir(), TIMEOUT_MS)).toBeUndefined();
  });

  it('waits indefinitely when no timeout is given', () => {
    // The default has to stay unbounded: the same helpers wrap `git push` and
    // `gh repo create`, where a few seconds is a normal duration, not a stall.
    expect(
      capture(
        `${JSON.stringify(process.execPath)} -e "setTimeout(() => console.log('slow'), ${
          TIMEOUT_MS * 2
        })"`,
        tmpdir()
      )
    ).toBe('slow');
  });
});

describe('succeeds', () => {
  it('reports a hung command as failure once the timeout elapses', () => {
    expect(succeeds(HANGS, tmpdir(), TIMEOUT_MS)).toBe(false);
  });

  it('still reports a prompt success as success', () => {
    expect(
      succeeds(`${JSON.stringify(process.execPath)} -e ""`, tmpdir(), TIMEOUT_MS)
    ).toBe(true);
  });
});
