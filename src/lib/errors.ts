/**
 * Error narrowing helpers.
 * ────────────────────────
 * Caught values in TS are typed `unknown` from TS 4.4+. These helpers
 * pull common shapes off them safely so we can replace the `catch (e: any)`
 * pattern across the codebase with `catch (e: unknown)` + `getErrorMessage(e)`.
 *
 * They never throw, never assume a specific class, and prefer the most
 * informative field available (Solana RPC errors put detail on `shortMessage`,
 * Supabase puts detail on `message`, plain Errors use `message`).
 */

interface ErrorLike {
  message?: unknown;
  shortMessage?: unknown;
  cause?: unknown;
  code?: unknown;
  status?: unknown;
}

/** Returns the best human-readable string we can extract. Falls back to "Unknown error". */
export function getErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  if (err == null) return fallback;
  if (typeof err === 'string') return err;
  if (err instanceof Error) {
    // Solana web3.js + viem-style errors often expose `shortMessage`
    const e = err as ErrorLike;
    if (typeof e.shortMessage === 'string' && e.shortMessage.length > 0) return e.shortMessage;
    return err.message || fallback;
  }
  if (typeof err === 'object') {
    const e = err as ErrorLike;
    if (typeof e.shortMessage === 'string') return e.shortMessage;
    if (typeof e.message === 'string') return e.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

/** Pull a numeric or string `code` if present (Postgres errors, Solana errors). */
export function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null) return undefined;
  const code = (err as ErrorLike).code;
  if (typeof code === 'string' || typeof code === 'number') return String(code);
  return undefined;
}

/** True if the error looks like a network failure rather than user/business logic. */
export function isNetworkError(err: unknown): boolean {
  const msg = getErrorMessage(err, '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('cors') ||
    msg.includes('econnrefused')
  );
}
