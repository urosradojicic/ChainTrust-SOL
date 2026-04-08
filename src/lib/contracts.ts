import { PublicKey } from '@solana/web3.js';

/**
 * Program ID — loaded from VITE_SOLANA_PROGRAM_ID env var.
 * Falls back to devnet program address during development.
 * After deploying: cd blockchain && anchor deploy
 */
const PROGRAM_ID_STR = import.meta.env.VITE_SOLANA_PROGRAM_ID || 'CMTRgstry1111111111111111111111111111111111';
export const PROGRAM_ID = new PublicKey(PROGRAM_ID_STR);

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
export const PRO_THRESHOLD = 5_000 * CMT_DECIMALS;
export const WHALE_THRESHOLD = 50_000 * CMT_DECIMALS;
export const LOCK_PERIOD_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function computeTier(stakedBaseUnits: number): 'Free' | 'Basic' | 'Pro' | 'Whale' {
  if (stakedBaseUnits >= WHALE_THRESHOLD) return 'Whale';
  if (stakedBaseUnits >= PRO_THRESHOLD) return 'Pro';
  if (stakedBaseUnits > 0) return 'Basic';
  return 'Free';
}
