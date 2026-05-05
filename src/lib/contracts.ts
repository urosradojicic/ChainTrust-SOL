import { PublicKey } from '@solana/web3.js';

/**
 * Program ID — loaded from VITE_SOLANA_PROGRAM_ID env var.
 *
 * In dev/test we fall back to a clearly-fake placeholder; hooks detect this
 * and switch to demo mode. In production (`import.meta.env.PROD`), missing
 * the env var is a deploy bug — fail loudly at module load instead of letting
 * users sign and pay fees for transactions that target a non-existent program.
 */
const PROGRAM_ID_FALLBACK = 'CMTRgstry1111111111111111111111111111111111';
const PROGRAM_ID_STR = import.meta.env.VITE_SOLANA_PROGRAM_ID || PROGRAM_ID_FALLBACK;

if (import.meta.env.PROD && !import.meta.env.VITE_SOLANA_PROGRAM_ID) {
  throw new Error(
    'VITE_SOLANA_PROGRAM_ID is required for production builds. ' +
    'Refusing to start with the placeholder program ID.',
  );
}

export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);
export const IS_PLACEHOLDER_PROGRAM_ID = PROGRAM_ID_STR === PROGRAM_ID_FALLBACK;

// ── PDA Seed Helpers ──────────────────────────────────────────────

export function getRegistryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('registry')], PROGRAM_ID);
}

export function getStartupPDA(startupId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(startupId));
  return PublicKey.findProgramAddressSync([Buffer.from('startup'), buf], PROGRAM_ID);
}

export function getMetricsPDA(startupId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(startupId));
  return PublicKey.findProgramAddressSync([Buffer.from('metrics'), buf], PROGRAM_ID);
}

export function getVaultPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('vault')], PROGRAM_ID);
}

export function getInvestorPDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('investor'), wallet.toBuffer()],
    PROGRAM_ID,
  );
}

export function getBadgePDA(startupId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(startupId));
  return PublicKey.findProgramAddressSync([Buffer.from('badge'), buf], PROGRAM_ID);
}

export function getDaoPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('dao')], PROGRAM_ID);
}

export function getProposalPDA(proposalId: number): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(proposalId));
  return PublicKey.findProgramAddressSync([Buffer.from('proposal'), buf], PROGRAM_ID);
}

export function getVoteRecordPDA(proposalId: number, voter: PublicKey): [PublicKey, number] {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(proposalId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), buf, voter.toBuffer()],
    PROGRAM_ID,
  );
}

export function getTokenConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('token_config')], PROGRAM_ID);
}

export function getDelegationPDA(delegator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('delegation'), delegator.toBuffer()],
    PROGRAM_ID,
  );
}

// ── Constants (must match Rust program) ───────────────────────────

export const CMT_DECIMALS = 1_000_000; // 6 decimals
export const CMT_DECIMALS_BIGINT = 1_000_000n;
export const PRO_THRESHOLD = 5_000 * CMT_DECIMALS;
export const WHALE_THRESHOLD = 50_000 * CMT_DECIMALS;
export const LOCK_PERIOD_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function computeTier(stakedBaseUnits: number): 'Free' | 'Basic' | 'Pro' | 'Whale' {
  if (stakedBaseUnits >= WHALE_THRESHOLD) return 'Whale';
  if (stakedBaseUnits >= PRO_THRESHOLD) return 'Pro';
  if (stakedBaseUnits > 0) return 'Basic';
  return 'Free';
}

/**
 * Convert a user-typed CMT amount to BigInt base units (6 decimals) without
 * going through floating-point. Accepts either a string ("12.345678") or a
 * number (re-stringified at the boundary so callers can keep their existing
 * Number-based UI inputs while we still avoid float multiplication on the
 * critical path).
 *
 * Throws on invalid input (negative, non-numeric, >6 fractional digits).
 */
export function cmtToBaseUnits(amount: string | number): bigint {
  const str = typeof amount === 'number' ? amount.toString() : amount.trim();
  if (!str) throw new Error('Amount is required.');
  if (!/^\d+(?:\.\d{1,6})?$/.test(str)) {
    throw new Error(
      'Invalid amount: must be a non-negative number with up to 6 decimal places.',
    );
  }
  const [whole, frac = ''] = str.split('.');
  const fracPadded = frac.padEnd(6, '0').slice(0, 6);
  return BigInt(whole) * CMT_DECIMALS_BIGINT + BigInt(fracPadded);
}
