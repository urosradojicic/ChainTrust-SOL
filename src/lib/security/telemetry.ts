/**
 * Production telemetry shim.
 * ──────────────────────────
 * Optional Sentry-compatible reporter. When `VITE_SENTRY_DSN` is set we
 * dynamically import `@sentry/react` and forward errors. When unset we
 * return no-ops so neither the bundle nor the browser pays any cost.
 *
 * Why dynamic import: it lets us land the wiring NOW without committing
 * to the @sentry/react dependency in package.json until the team is
 * ready to install it. The string `@sentry/react` is masked from Vite's
 * static analysis so the build doesn't fail when the package is absent.
 *
 * Behavior:
 *   - reportError(err, ctx?) — captureException; structured context attached
 *   - reportMessage(msg, level?) — captureMessage at chosen severity
 *   - setUserContext({ id }) — attach a user fingerprint to subsequent events
 *
 * The `init()` call is idempotent and safe to call from anywhere.
 */

interface SentryShim {
  captureException: (err: unknown, hint?: { extra?: Record<string, unknown> }) => void;
  captureMessage: (msg: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug') => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
}

let sentry: SentryShim | null = null;
let initStarted = false;

const noop: SentryShim = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
};

async function loadSentry(): Promise<SentryShim> {
  if (sentry) return sentry;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    sentry = noop;
    return noop;
  }
  try {
    // The expression is computed so Vite doesn't try to resolve the module
    // at build time. When @sentry/react is installed and VITE_SENTRY_DSN is
    // set, dynamic import succeeds; otherwise we fall back to noop.
    const moduleName = '@sentry/react';
    const mod = (await import(/* @vite-ignore */ moduleName)) as {
      init: (opts: Record<string, unknown>) => void;
      captureException: SentryShim['captureException'];
      captureMessage: SentryShim['captureMessage'];
      setUser: SentryShim['setUser'];
    };
    mod.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      // Don't include URLs from analytics or external embeds.
      tunnel: undefined,
    });
    sentry = {
      captureException: mod.captureException,
      captureMessage: mod.captureMessage,
      setUser: mod.setUser,
    };
    return sentry;
  } catch {
    // Sentry package not installed or failed to init — silently fall back.
    sentry = noop;
    return noop;
  }
}

/** Idempotent. Call once during app boot when env DSN may be present. */
export function initTelemetry(): void {
  if (initStarted) return;
  initStarted = true;
  void loadSentry();
}

export function reportError(err: unknown, context?: Record<string, unknown>): void {
  void loadSentry().then((s) => {
    s.captureException(err, context ? { extra: context } : undefined);
  });
}

export function reportMessage(
  msg: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
): void {
  void loadSentry().then((s) => s.captureMessage(msg, level));
}

export function setUserContext(user: { id?: string; email?: string } | null): void {
  void loadSentry().then((s) => s.setUser(user));
}

export function isTelemetryConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN);
}
