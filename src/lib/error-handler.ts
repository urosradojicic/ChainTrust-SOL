/**
 * Central error handler for data-layer failures.
 * Logs in DEV; in production, pipe to Sentry / DataDog / etc.
 * Replaces silent `catch { return FALLBACK; }` patterns with visibility.
 */

type LogContext = string;

interface ErrorDetails {
  code?: string;
  message: string;
  context: LogContext;
  hint?: string;
}

const MAX_ERRORS_BUFFERED = 50;
const errorBuffer: ErrorDetails[] = [];

/** Capture a data error — always call this instead of silent catch. */
export function logDataError(err: unknown, context: LogContext): void {
  const details = extractErrorDetails(err, context);

  // Ring buffer for dev-tools inspection
  errorBuffer.push(details);
  if (errorBuffer.length > MAX_ERRORS_BUFFERED) errorBuffer.shift();

  if (import.meta.env.DEV) {
     
    console.warn(`[data:${context}]`, details.message, err);
  }
  // In production: window.__SENTRY?.captureException(err) hook here if wired.
}

/** Returns recent data errors — useful for a dev-only diagnostics panel. */
export function getRecentDataErrors(): ReadonlyArray<ErrorDetails> {
  return errorBuffer.slice();
}

/** Clear error buffer (for testing). */
export function clearDataErrorBuffer(): void {
  errorBuffer.length = 0;
}

function extractErrorDetails(err: unknown, context: LogContext): ErrorDetails {
  if (err instanceof Error) {
    return {
      message: err.message,
      context,
      code: (err as Error & { code?: string }).code,
      hint: (err as Error & { hint?: string }).hint,
    };
  }
  if (typeof err === 'object' && err !== null) {
    const e = err as { message?: string; code?: string; hint?: string };
    return {
      message: e.message ?? String(err),
      context,
      code: e.code,
      hint: e.hint,
    };
  }
  return { message: String(err), context };
}
