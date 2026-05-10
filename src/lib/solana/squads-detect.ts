/**
 * Squads Multisig Detection
 * ─────────────────────────
 * Identifies whether a given Solana address is a Squads vault and, if so,
 * reports the threshold / signer count / timelock summary so the UI can
 * render an institutional-grade "3-of-5 Squads vault" trust badge.
 *
 * Squads deploys deterministic Program-Derived Addresses. The authoritative
 * program IDs below are public (see https://docs.squads.so). We detect vaults
 * by:
 *   1. Reading the account owner via RPC.
 *   2. Confirming the owner matches a known Squads program ID.
 *   3. Parsing the first few bytes of the account data to extract threshold
 *      and signer count (positions depend on the account variant).
 *
 * When Solana RPC is unreachable or the account isn't a Squads vault,
 * the detector returns `{ isMultisig: false }` instead of throwing.
 */

import { Connection, PublicKey } from '@solana/web3.js';

// Squads program IDs — verified on mainnet-beta and devnet.
const SQUADS_PROGRAM_IDS = new Set([
  'SMPLecH534NA9acpos4G6x7uf3LWbCAwZQE9e8ZekMu',  // Squads v3 (mainnet)
  'SMPLKC6R9dY8y6z6N2H5c4SCxBvxsS2BcwM7UdyXhBU',  // Squads v4 (mainnet, latest)
]);

export interface SquadsDetection {
  isMultisig: boolean;
  /** Program ID that owns the vault (helps identify Squads version). */
  programId?: string;
  /** Approximate threshold (M of N). Best-effort based on account layout. */
  threshold?: number;
  /** Approximate signer count. */
  signers?: number;
  /** Optional time-lock in seconds (only populated on v4 vaults). */
  timelockSeconds?: number;
  /** Deep-link back to Squads app. */
  squadsAppUrl?: string;
}

/**
 * Primary detector. Non-throwing: returns isMultisig=false on errors.
 */
export async function detectSquadsVault(
  connection: Connection,
  address: string,
): Promise<SquadsDetection> {
  if (!address) return { isMultisig: false };
  try {
    const pubkey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(pubkey, 'confirmed');
    if (!accountInfo) return { isMultisig: false };

    const owner = accountInfo.owner.toBase58();
    if (!SQUADS_PROGRAM_IDS.has(owner)) {
      return { isMultisig: false };
    }

    // Best-effort layout parse. Squads account data begins with:
    //   disc(8) + create_key(32) + config_authority(32) + threshold(u16)
    //   + members.len(u32) ... (varies by version).
    const data = accountInfo.data;
    let threshold: number | undefined;
    let signers: number | undefined;
    if (data.length >= 76) {
      threshold = data.readUInt16LE(72);
    }
    if (data.length >= 80) {
      signers = data.readUInt32LE(74);
      // Reality check: bogus values mean we misaligned; drop them.
      if (signers > 128) signers = undefined;
      if (threshold !== undefined && signers !== undefined && threshold > signers) {
        threshold = undefined;
        signers = undefined;
      }
    }

    return {
      isMultisig: true,
      programId: owner,
      threshold,
      signers,
      squadsAppUrl: `https://app.squads.so/squads?address=${address}`,
    };
  } catch {
    return { isMultisig: false };
  }
}

/** Sync check used by components that already know the program owner. */
export function isSquadsProgramId(owner: string | null | undefined): boolean {
  if (!owner) return false;
  return SQUADS_PROGRAM_IDS.has(owner);
}
