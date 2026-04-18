/**
 * Input sanitization and validation utilities.
 * All user input must pass through these before storage or display.
 */

/** Escape HTML entities to prevent XSS */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Strip all HTML tags from a string */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/** Sanitize a text input: trim, strip HTML, limit length */
export function sanitizeText(str: string, maxLength: number = 500): string {
  return stripHtml(str).trim().slice(0, maxLength);
}

/** Validate and sanitize a URL — block javascript: and data: protocols */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/** Validate a numeric input is within safe range */
export function sanitizeNumber(val: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/** Validate an email address format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Safely parse JSON from localStorage (never throws) */
export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Validate a Solana public key format (base58, 32-44 chars) */
export function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

/** Rate limiter: returns true if action is allowed */
const rateLimitMap = new Map<string, number[]>();
export function rateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(key) ?? [];
  const recent = attempts.filter(t => now - t < windowMs);
  if (recent.length >= maxAttempts) return false;
  recent.push(now);
  rateLimitMap.set(key, recent);
  // Prevent unbounded growth: prune stale keys periodically
  if (rateLimitMap.size > 100) {
    for (const [k, v] of rateLimitMap) {
      const live = v.filter(t => now - t < windowMs);
      if (live.length === 0) rateLimitMap.delete(k);
      else rateLimitMap.set(k, live);
    }
  }
  return true;
}
