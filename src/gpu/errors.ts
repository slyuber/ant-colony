export interface FatalReporter {
  /** Show a problem to the person. Only the first one is shown. `plain` = the message is already written for people. */
  report(err: unknown, plain?: boolean): void;
  readonly failed: boolean;
}

export function createFatalReporter(show: (message: string) => void): FatalReporter {
  let failed = false;
  return {
    report(err: unknown, plain = false): void {
      if (failed) return;
      failed = true;
      const detail = err instanceof Error && err.message ? err.message
        : typeof err === 'string' && err ? err : 'unknown error';
      show(plain ? detail : `The graphics card reported a problem: ${detail}. Reload the page.`);
    },
    get failed(): boolean { return failed; },
  };
}

export function describeAdapter(
  info: { vendor?: string; architecture?: string; device?: string; description?: string } | undefined,
): string {
  if (!info) return 'unknown adapter';
  const parts = [info.vendor, info.architecture, info.device, info.description].filter(Boolean);
  return parts.length ? parts.join(' | ') : 'unknown adapter';
}
