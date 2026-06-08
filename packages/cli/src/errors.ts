/**
 * An expected, user-facing failure. The top-level handler prints its message
 * verbatim (no stack trace) and exits non-zero. Use it for situations the user
 * can act on — a push that was rejected, a template that couldn't be fetched —
 * as opposed to programmer errors, which should surface as ordinary Errors.
 */
export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

/** Prints a failure as a single clean message and exits non-zero. A CliError's
 * message is shown verbatim; anything else is an unexpected bug, labelled as
 * such (with the stack only under DESIGN_DRAFTS_DEBUG). */
export function reportError(error: unknown): never {
  if (error instanceof CliError) {
    console.error(`\n${error.message}`);
  } else if (process.env.DESIGN_DRAFTS_DEBUG) {
    console.error(error);
  } else {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `\nUnexpected error: ${message}\n` +
        `Re-run with DESIGN_DRAFTS_DEBUG=1 for details.`
    );
  }
  process.exit(1);
}

/**
 * Runs a command handler, converting any thrown failure into a clean message +
 * non-zero exit. We catch and exit here rather than letting the error escape,
 * because cli-forge's own runCommand catch prints the raw error (with stack)
 * and the help text — exiting first keeps the output clean.
 */
export async function runHandler(
  fn: () => unknown | Promise<unknown>
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    reportError(error);
  }
}
