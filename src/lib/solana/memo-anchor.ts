import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { SOLANA_NETWORK, verifyCluster, simulateOrThrow } from './solana-config';

// SPL Memo Program enforces a hard payload limit; staying under leaves room
// for transaction-envelope overhead.
const MEMO_MAX_BYTES = 566;

// C0 (\x00..\x1F, \x7F) + C1 (\x80..\x9F) control-char class. Built via the
// RegExp constructor so the source contains escape sequences rather than
// literal bytes (which break grep / commit-message tooling).
const CONTROL_CHAR_RE = new RegExp('[\\x00-\\x1f\\x7f-\\x9f]', 'g');

function sanitizeMemoText(s: string, maxChars: number): string {
  // Strip control chars first so the truncate-by-chars step doesn't preserve
  // hidden bytes, then trim leading/trailing whitespace.
  return s.replace(CONTROL_CHAR_RE, '').slice(0, maxChars).trim();
}

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
 * Throws if a malicious or malformed name pushes us over the byte budget.
 */
export function formatMemoPayload(params: LiveAnchorParams, proofHashHex: string): string {
  const payload = JSON.stringify({
    p: 'ChainTrust',
    v: 1,
    kind: 'metrics',
    sid: params.startupId,
    name: sanitizeMemoText(params.startupName, 60),
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
  // UTF-8 byte length, not .length (which counts UTF-16 code units and
  // under-counts emoji / Cyrillic / CJK).
  const bytes = new TextEncoder().encode(payload).length;
  if (bytes > MEMO_MAX_BYTES) {
    throw new Error(
      `Memo payload is ${bytes} bytes (max ${MEMO_MAX_BYTES}). ` +
      `Shorten the startup name or reduce metric magnitudes.`,
    );
  }
  return payload;
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
 * Verifies the wallet's RPC matches the configured cluster and simulates the
 * transaction before requesting a signature so investors aren't charged fees
 * for txs that would have failed on-chain.
 *
 * Returns the confirmed transaction signature and the proof-hash hex.
 */
export async function sendProofHashMemo(
  connection: Connection,
  payer: PublicKey,
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  params: LiveAnchorParams,
): Promise<{ signature: string; proofHashHex: string; memoPayload: string }> {
  await verifyCluster(connection);

  const hash = await computeMemoProofHash(params);
  const proofHashHex = bytesToHex(hash);
  const memoPayload = formatMemoPayload(params, proofHashHex);

  const tx = new Transaction().add(buildMemoInstruction(memoPayload, payer));
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;

  await simulateOrThrow(connection, tx);

  const signature = await sendTransaction(tx, connection);
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return { signature, proofHashHex, memoPayload };
}
