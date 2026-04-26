/**
 * Recent on-chain anchors history (local-only).
 * ──────────────────────────────────────────────
 * Keeps the last few proof anchors the user has posted from the Live Testnet
 * Demo. Persists in localStorage so the history survives reloads. Capped to
 * the most recent 8 entries so storage stays trivial.
 *
 * No PII — only signatures, hashes, and the chosen startup name.
 */

const STORAGE_KEY = 'chaintrust_recent_anchors';
const MAX_ENTRIES = 8;

export interface RecentAnchor {
  signature: string;
  proofHashHex: string;
  startupName: string;
  cluster: string;
  timestamp: number;
}

export function readRecentAnchors(): RecentAnchor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentAnchor =>
        typeof e?.signature === 'string' &&
        typeof e?.proofHashHex === 'string' &&
        typeof e?.startupName === 'string' &&
        typeof e?.cluster === 'string' &&
        typeof e?.timestamp === 'number',
    );
  } catch {
    return [];
  }
}

export function pushRecentAnchor(entry: RecentAnchor): void {
  try {
    const list = readRecentAnchors();
    // Dedupe by signature
    const filtered = list.filter((e) => e.signature !== entry.signature);
    filtered.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ENTRIES)));
  } catch {
    /* private browsing / quota exhaustion — best-effort, swallow */
  }
}

export function clearRecentAnchors(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
