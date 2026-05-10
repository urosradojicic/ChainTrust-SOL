import { clusterApiUrl, Connection, Transaction, VersionedTransaction } from '@solana/web3.js';

type SolanaCluster = 'devnet' | 'mainnet-beta';

export const SOLANA_NETWORK: SolanaCluster =
  (import.meta.env.VITE_SOLANA_CLUSTER as SolanaCluster) || 'devnet';

export const SOLANA_RPC_URL = clusterApiUrl(SOLANA_NETWORK);
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com';

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// ── Cluster identity verification ─────────────────────────────────
// Each Solana cluster has a deterministic genesis hash. We compare what the
// connected RPC reports against this table on wallet connect — if a user has
// Phantom on mainnet but the deploy is configured for devnet (or vice versa),
// signing would otherwise route real funds through a test flow.
const GENESIS_HASHES: Record<SolanaCluster, string> = {
  'devnet':       'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
  'mainnet-beta': '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
};

let cachedClusterCheck: Promise<void> | null = null;

/**
 * Verify the connected cluster matches the configured cluster. Throws a
 * descriptive Error on mismatch. Result is cached for the connection lifetime
 * so repeat callers don't pay extra RPC round-trips.
 */
export function verifyCluster(conn: Connection = connection): Promise<void> {
  if (cachedClusterCheck) return cachedClusterCheck;
  cachedClusterCheck = conn.getGenesisHash().then((actual) => {
    const expected = GENESIS_HASHES[SOLANA_NETWORK];
    if (actual !== expected) {
      cachedClusterCheck = null; // allow retry after env fix
      throw new Error(
        `Cluster mismatch: configured for ${SOLANA_NETWORK} (genesis ${expected.slice(0,8)}…) ` +
        `but RPC returned genesis ${actual.slice(0,8)}…. Refusing to sign — switch your wallet ` +
        `or set VITE_SOLANA_CLUSTER correctly.`,
      );
    }
  });
  return cachedClusterCheck;
}

/**
 * Simulate a transaction before broadcasting. Throws on simulation failure
 * with a readable message that surfaces the program log when available.
 * Callers should `await` this immediately before `sendTransaction(...)`.
 */
export async function simulateOrThrow(
  conn: Connection,
  tx: Transaction | VersionedTransaction,
): Promise<void> {
  const sim = tx instanceof VersionedTransaction
    ? await conn.simulateTransaction(tx)
    : await conn.simulateTransaction(tx as Transaction);
  if (sim.value.err) {
    const lastLog = sim.value.logs?.slice(-1)[0] ?? '';
    throw new Error(
      `Transaction would fail: ${JSON.stringify(sim.value.err)}` +
      (lastLog ? ` — ${lastLog}` : ''),
    );
  }
}

/** Build an explorer link for a transaction signature */
export function explorerTxUrl(signature: string): string {
  const safe = encodeURIComponent(signature);
  return `${SOLANA_EXPLORER_URL}/tx/${safe}?cluster=${SOLANA_NETWORK}`;
}

/** Build an explorer link for an account/address */
export function explorerAddressUrl(address: string): string {
  const safe = encodeURIComponent(address);
  return `${SOLANA_EXPLORER_URL}/address/${safe}?cluster=${SOLANA_NETWORK}`;
}

/**
 * Check if a transaction signature is a demo/simulated one.
 * Demo signatures are prefixed with "DEMO_" — they will not exist on Explorer.
 */
export function isDemoSignature(sig: string): boolean {
  return sig.startsWith('DEMO_');
}

/**
 * Generate a clearly-labeled demo tx signature.
 * Prefixed with DEMO_ so it's impossible to confuse with a real transaction.
 */
export function genFallbackTxSig(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const random = Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `DEMO_${random}`;
}
