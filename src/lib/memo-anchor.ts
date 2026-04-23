import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { SOLANA_NETWORK } from './solana-config';

/**
 * SPL Memo Program v2 — canonical, deployed on every Solana cluster.
 * Lets any wallet anchor arbitrary UTF-8 data on-chain with a real, signed,
 * confirmable transaction. Used here so we can demonstrate a *real* devnet
 * proof anchoring flow without requiring our full Anchor program to be deployed.
 *
 * Program address:
 *   https://explorer.solana.com/address/MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
 */
export const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

/** Build a Memo-program instruction with the given UTF-8 payload. */
export function buildMemoInstruction(payload: string, signer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: signer, isSigner: true, isWritable: false }],
    data: Buffer.from(payload, 'utf8'),
  });
}

/** Convert a byte array to a lowercase hex string. */
export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute the canonical ChainTrust proof-hash — the same SHA-256 that the
 * Anchor program would store on-chain for a MetricsAccount. Keeping this in
 * sync with `computeProofHash` in use-blockchain.ts means a memo posted here
 * is byte-for-byte re-verifiable once the real program is deployed.
 */
export async function computeMemoProofHash(params: {
  mrr: number;
  totalUsers: number;
  activeUsers: number;
  burnRate: number;
  runway: number;
  growthRate: number;
  carbonOffset: number;
}): Promise<Uint8Array> {
  const payload = [
    Math.floor(params.mrr),
    Math.floor(params.totalUsers),
    Math.floor(params.activeUsers),
    Math.floor(params.burnRate),
    Math.floor(params.runway),
    Math.round(params.growthRate * 100),
    Math.floor(params.carbonOffset),
  ].join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return new Uint8Array(buf);
}

export interface LiveAnchorParams {
  startupName: string;
  startupId: number;
  mrr: number;
  totalUsers: number;
  activeUsers: number;
  burnRate: number;
  runway: number;
  growthRate: number;
  carbonOffset: number;
}

/**
 * Format the memo payload as a compact, self-describing JSON string.
 * Kept under 566 bytes so it fits in a single Memo-program instruction.
 */
export function formatMemoPayload(params: LiveAnchorParams, proofHashHex: string): string {
  return JSON.stringify({
    p: 'ChainTrust',
    v: 1,
    kind: 'metrics',
    sid: params.startupId,
    name: params.startupName.slice(0, 60),
    mrr: Math.floor(params.mrr),
    u: Math.floor(params.totalUsers),
    au: Math.floor(params.activeUsers),
    bn: Math.floor(params.burnRate),
    rw: Math.floor(params.runway),
    gr: Math.round(params.growthRate * 100),
    co: Math.floor(params.carbonOffset),
    h: proofHashHex,
    t: Math.floor(Date.now() / 1000),
  });
}

/**
 * Request a devnet airdrop. Only works on devnet/testnet — mainnet will throw.
 * Returns the airdrop signature. Amount in SOL, max 2 per request (cluster cap).
 */
export async function requestDevnetAirdrop(
  connection: Connection,
  recipient: PublicKey,
  amountSol = 1,
): Promise<string> {
  if (SOLANA_NETWORK === 'mainnet-beta') {
    throw new Error('Airdrops are not available on mainnet. Switch to devnet.');
  }
  const lamports = Math.min(amountSol, 2) * LAMPORTS_PER_SOL;
  const sig = await connection.requestAirdrop(recipient, lamports);
  await connection.confirmTransaction(sig, 'confirmed');
  return sig;
}

/**
 * Build, sign (via wallet adapter), and send a Memo-program transaction
 * that anchors a startup's proof hash on the current Solana cluster.
 *
 * Uses the caller-supplied `sendTransaction` from `@solana/wallet-adapter-react`
 * so the transaction is signed inside the user's wallet (Phantom/Solflare/etc).
 *
 * Returns the confirmed transaction signature and the proof-hash hex.
 */
export async function sendProofHashMemo(
  connection: Connection,
  payer: PublicKey,
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  params: LiveAnchorParams,
): Promise<{ signature: string; proofHashHex: string; memoPayload: string }> {
  const hash = await computeMemoProofHash(params);
  const proofHashHex = bytesToHex(hash);
  const memoPayload = formatMemoPayload(params, proofHashHex);

  const tx = new Transaction().add(buildMemoInstruction(memoPayload, payer));
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature, proofHashHex, memoPayload };
}
