import { clusterApiUrl, Connection } from '@solana/web3.js';

type SolanaCluster = 'devnet' | 'mainnet-beta';

export const SOLANA_NETWORK: SolanaCluster =
  (import.meta.env.VITE_SOLANA_CLUSTER as SolanaCluster) || 'devnet';

export const SOLANA_RPC_URL = clusterApiUrl(SOLANA_NETWORK);
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com';

export const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

/** Build an explorer link for a transaction signature */
export function explorerTxUrl(signature: string): string {
  return `${SOLANA_EXPLORER_URL}/tx/${signature}?cluster=${SOLANA_NETWORK}`;
}

/** Build an explorer link for an account/address */
export function explorerAddressUrl(address: string): string {
  return `${SOLANA_EXPLORER_URL}/address/${address}?cluster=${SOLANA_NETWORK}`;
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
