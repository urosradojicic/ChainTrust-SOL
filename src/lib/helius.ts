/**
 * Helius Wrapper
 * ──────────────
 * Thin shim over Helius's Enhanced APIs. Falls back to the public Solana
 * JSON-RPC when VITE_HELIUS_API_KEY is not configured, so demo mode still
 * works. Avoids sending any keys to the client beyond what's already
 * public in env.
 *
 * Endpoints used:
 *   - `/v0/addresses/:addr/transactions` — parsed transaction history
 *     (human-readable action labels)
 *   - `/v0/addresses/:addr/balances`     — SPL + SOL holdings summary
 *
 * Docs: https://docs.helius.dev/
 */

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY as string | undefined;
const HELIUS_BASE = 'https://api.helius.xyz';

export interface EnhancedTransaction {
  signature: string;
  type: string;          // "SWAP", "TRANSFER", "NFT_MINT", "STAKE_DEPOSIT", ...
  source: string;        // Protocol source: "JUPITER", "ORCA", "MARINADE", ...
  description: string;   // Human-readable summary
  fee: number;
  feePayer: string;
  timestamp: number;
  slot: number;
}

export interface HeliusBalances {
  nativeBalance: number;
  tokens: Array<{
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
  }>;
}

/** True if Helius features are available. If false, callers should fall back. */
export function isHeliusConfigured(): boolean {
  return Boolean(HELIUS_API_KEY && HELIUS_API_KEY.length >= 16);
}

/**
 * Fetch up to `limit` recent enhanced transactions for an address.
 * Returns [] on any error; logs in DEV.
 */
export async function getEnhancedTransactions(
  address: string,
  limit = 25,
): Promise<EnhancedTransaction[]> {
  if (!isHeliusConfigured() || !address) return [];
  try {
    const url = `${HELIUS_BASE}/v0/addresses/${address}/transactions?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (import.meta.env.DEV) console.warn('[helius] tx fetch failed', res.status);
      return [];
    }
    const data = (await res.json()) as EnhancedTransaction[];
    if (!Array.isArray(data)) return [];
    return data.slice(0, limit);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[helius] tx fetch error', err);
    return [];
  }
}

/**
 * Fetch SOL + SPL balances for an address.
 */
export async function getBalances(address: string): Promise<HeliusBalances | null> {
  if (!isHeliusConfigured() || !address) return null;
  try {
    const url = `${HELIUS_BASE}/v0/addresses/${address}/balances?api-key=${HELIUS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as HeliusBalances;
  } catch {
    return null;
  }
}

/**
 * Return the set of counterparty addresses touched in the last N transactions.
 * Used to cross-reference against the smart-wallets registry.
 */
export async function getRecentCounterparties(
  address: string,
  limit = 25,
): Promise<string[]> {
  const txs = await getEnhancedTransactions(address, limit);
  const counterparties = new Set<string>();
  for (const tx of txs) {
    if (tx.feePayer && tx.feePayer !== address) counterparties.add(tx.feePayer);
    // Helius also returns `nativeTransfers` and `tokenTransfers` in the
    // raw payload. To stay light-weight and backwards-compatible we only
    // look at feePayer here; the NativeTransfers shape varies across
    // Helius API versions and would need a schema guard before use.
  }
  return Array.from(counterparties);
}
