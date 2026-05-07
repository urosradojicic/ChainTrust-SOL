/**
 * fetch() with a hard timeout so the UI never stays in `isLoading` forever
 * because of a hung remote endpoint.
 *
 * AbortController fires on timeout; the underlying socket is freed instead of
 * leaking until the OS-level keep-alive expires. The thrown DOMException
 * `AbortError` carries the request URL for clearer debugging.
 *
 * Usage:
 *   const r = await fetchWithTimeout(url, { timeoutMs: 8000 });
 *
 * Default: 10 seconds. Healthy network round-trips (Pyth, Helius, Supabase)
 * are typically <500ms, so 10s is generous without being investor-test-painful.
 */
export const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

export interface FetchWithTimeoutInit extends RequestInit {
  timeoutMs?: number;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: FetchWithTimeoutInit = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal: callerSignal, ...rest } = init;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // If the caller supplied their own signal, abort our controller when it fires
  // so timeout-vs-caller-cancel both work.
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const url = typeof input === 'string' ? input : input.toString();
      throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
