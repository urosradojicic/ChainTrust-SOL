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
