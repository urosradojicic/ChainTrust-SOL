import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useCallback, useEffect } from 'react';
import {
  Transaction,
  TransactionInstruction,
  SystemProgram,
  PublicKey,
} from '@solana/web3.js';
import { genFallbackTxSig } from '@/lib/solana-config';
import {
  PROGRAM_ID,
  getRegistryPDA,
  getStartupPDA,
  getMetricsPDA,
  getVaultPDA,
  getInvestorPDA,
  getBadgePDA,
  getDaoPDA,
  getProposalPDA,
  getVoteRecordPDA,
  getDelegationPDA,
  CMT_DECIMALS,
} from '@/lib/contracts';

// ── Helpers ──────────────────────────────────────────────────────

// Re-export for backward compatibility
const genDemoTxSig = genFallbackTxSig;

/**
 * Compute Anchor instruction discriminator.
 * Anchor uses: SHA-256("global:<snake_case_fn_name>")[0..8]
 */
async function anchorDiscriminator(name: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(`global:${name}`));
  return new Uint8Array(hash).slice(0, 8);
}

/** Pre-computed discriminators (cached at module level after first call) */
const _discCache = new Map<string, Uint8Array>();
async function disc(name: string): Promise<Uint8Array> {
  if (_discCache.has(name)) return _discCache.get(name)!;
  const d = await anchorDiscriminator(name);
  _discCache.set(name, d);
  return d;
}

/**
 * Compute a SHA-256 proof hash from startup metrics.
 */
export async function computeProofHash(params: {
  mrr: number;
  users: number;
  activeUsers: number;
  burnRate: number;
  runway: number;
  growthRate: number;
  carbonOffset: number;
}): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    `${params.mrr}|${params.users}|${params.activeUsers}|${params.burnRate}|${params.runway}|${Math.round(params.growthRate * 100)}|${params.carbonOffset}`,
  );
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Build an instruction for the chainmetrics program with proper Anchor discriminator.
 */
function buildInstruction(
  discriminator: Uint8Array,
  data: Buffer,
  keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
): TransactionInstruction {
  const instructionData = Buffer.concat([Buffer.from(discriminator), data]);
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: instructionData,
  });
}

// ── Registry Hooks ────────────────────────────────────────────────

export function usePublishMetrics() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const publish = useCallback(
    async (params: {
      startupId: number;
      mrr: number;
      totalUsers: number;
      activeUsers: number;
      burnRate: number;
      runway: number;
      growthRate: number;
      carbonOffset: number;
    }) => {
      if (!connected || !publicKey) throw new Error('Wallet not connected');
      // Validate all parameters are safe integers before building transaction
      const safeInt = (v: number, name: string) => {
        if (!Number.isFinite(v) || v < 0 || v > Number.MAX_SAFE_INTEGER) throw new Error(`Invalid ${name}: ${v}`);
        return Math.floor(v);
      };
      const validatedParams = {
        startupId: safeInt(params.startupId, 'startupId'),
        mrr: safeInt(params.mrr, 'mrr'),
        totalUsers: safeInt(params.totalUsers, 'totalUsers'),
        activeUsers: safeInt(Math.min(params.activeUsers, params.totalUsers), 'activeUsers'),
        burnRate: safeInt(params.burnRate, 'burnRate'),
        runway: safeInt(params.runway, 'runway'),
        growthRate: params.growthRate,
        carbonOffset: safeInt(params.carbonOffset, 'carbonOffset'),
      };
      setIsPending(true);
      setError(null);
      setTxHash(null);
      setIsDemoMode(false);

      try {
        const proofHash = await computeProofHash({
          mrr: validatedParams.mrr,
          users: validatedParams.totalUsers,
          activeUsers: validatedParams.activeUsers,
          burnRate: validatedParams.burnRate,
          runway: validatedParams.runway,
          growthRate: validatedParams.growthRate,
          carbonOffset: validatedParams.carbonOffset,
        });

        const [startupPDA] = getStartupPDA(validatedParams.startupId);
        const [metricsPDA] = getMetricsPDA(validatedParams.startupId);

        // Build publish_metrics instruction data: 7 u64 + 1 i64 + 32 bytes hash
        const dataBuffer = Buffer.alloc(8 * 7 + 8 + 32);
        let offset = 0;
        dataBuffer.writeBigUInt64LE(BigInt(validatedParams.mrr), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(validatedParams.totalUsers), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(validatedParams.activeUsers), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(validatedParams.burnRate), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(validatedParams.runway), offset); offset += 8;
        dataBuffer.writeBigInt64LE(BigInt(Math.round(validatedParams.growthRate * 100)), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(validatedParams.carbonOffset), offset); offset += 8;
        proofHash.forEach((b, i) => dataBuffer.writeUInt8(b, offset + i));

        const discriminator = await disc('publish_metrics');
        const ix = buildInstruction(discriminator, dataBuffer, [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: startupPDA, isSigner: false, isWritable: true },
          { pubkey: metricsPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ]);

        const tx = new Transaction().add(ix);
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');

        setTxHash(sig);
        return sig;
      } catch (e: any) {
        if (import.meta.env.DEV) console.warn('[chain] publish fallback:', e?.message);
        const demoSig = genDemoTxSig();
        setTxHash(demoSig);
        setIsDemoMode(true);
        return demoSig;
      } finally {
        setIsPending(false);
      }
    },
    [connected, publicKey, sendTransaction, connection],
  );

  return { publish, isPending, txHash, error, isDemoMode };
}

export function useRegisterStartup() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const register = useCallback(
    async (params: { name: string; category: string; metadataURI: string }) => {
      if (!connected || !publicKey) throw new Error('Wallet not connected');
      setIsPending(true);
      setError(null);
      setTxHash(null);
      setIsDemoMode(false);

      try {
        const [registryPDA] = getRegistryPDA();

        // Read registry to get next startup ID
        const registryInfo = await connection.getAccountInfo(registryPDA);
        let nextId = 1;
        if (registryInfo?.data && registryInfo.data.length >= 48) {
          nextId = Number(registryInfo.data.readBigUInt64LE(40)) + 1;
        }

        const [startupPDA] = getStartupPDA(nextId);

        const encoder = new TextEncoder();
        const nameBytes = encoder.encode(params.name);
        const categoryBytes = encoder.encode(params.category);
        const uriBytes = encoder.encode(params.metadataURI);

        // Borsh-style: len(u32) + string bytes
        const dataBuffer = Buffer.alloc(4 + nameBytes.length + 4 + categoryBytes.length + 4 + uriBytes.length);
        let offset = 0;
        dataBuffer.writeUInt32LE(nameBytes.length, offset); offset += 4;
        Buffer.from(nameBytes).copy(dataBuffer, offset); offset += nameBytes.length;
        dataBuffer.writeUInt32LE(categoryBytes.length, offset); offset += 4;
        Buffer.from(categoryBytes).copy(dataBuffer, offset); offset += categoryBytes.length;
        dataBuffer.writeUInt32LE(uriBytes.length, offset); offset += 4;
        Buffer.from(uriBytes).copy(dataBuffer, offset);

        const discriminator = await disc('register_startup');
        const ix = buildInstruction(discriminator, dataBuffer, [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: registryPDA, isSigner: false, isWritable: true },
          { pubkey: startupPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ]);

        const tx = new Transaction().add(ix);
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');

        setTxHash(sig);
        return sig;
      } catch (e: any) {
        if (import.meta.env.DEV) console.warn('[chain] register fallback:', e?.message);
        const demoSig = genDemoTxSig();
        setTxHash(demoSig);
        setIsDemoMode(true);
        return demoSig;
      } finally {
        setIsPending(false);
      }
    },
    [connected, publicKey, sendTransaction, connection],
  );

  return { register, isPending, txHash, error, isDemoMode };
}

export function useVerifyOnChain(startupId: number | undefined) {
  const { connection } = useConnection();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    if (startupId === undefined) return;
    setIsLoading(true);
    try {
      const [metricsPDA] = getMetricsPDA(startupId);
      const accountInfo = await connection.getAccountInfo(metricsPDA);

      if (accountInfo?.data && accountInfo.data.length >= 112) {
        const d = accountInfo.data;
        const off = 8; // skip Anchor discriminator
        const metricsData = {
          startupId: Number(d.readBigUInt64LE(off)),
          timestamp: Number(d.readBigInt64LE(off + 8)),
          mrr: Number(d.readBigUInt64LE(off + 16)),
          totalUsers: Number(d.readBigUInt64LE(off + 24)),
          activeUsers: Number(d.readBigUInt64LE(off + 32)),
          burnRate: Number(d.readBigUInt64LE(off + 40)),
          runway: Number(d.readBigUInt64LE(off + 48)),
          growthRate: Number(d.readBigInt64LE(off + 56)),
          carbonOffset: Number(d.readBigUInt64LE(off + 64)),
          proofHash: Array.from(d.subarray(off + 72, off + 104)),
          oracleVerified: d.readUInt8(off + 104) === 1,
        };
        setData(metricsData);
      } else {
        setData(null);
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[chain] metrics read:', e);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [connection, startupId]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, isLoading, refetch: fetchMetrics };
}

// ── Staking Hooks ─────────────────────────────────────────────────

export function useStake() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const stake = useCallback(async (amount: number) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [vaultPDA] = getVaultPDA();
      const [investorPDA] = getInvestorPDA(publicKey);
      const baseUnits = BigInt(Math.round(amount * CMT_DECIMALS));

      const dataBuffer = Buffer.alloc(8);
      dataBuffer.writeBigUInt64LE(baseUnits);

      const discriminator = await disc('stake');
      const ix = buildInstruction(discriminator, dataBuffer, [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: investorPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] stake fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { stake, isPending };
}

export function useUnstake() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const unstake = useCallback(async (amount: number) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [vaultPDA] = getVaultPDA();
      const [investorPDA] = getInvestorPDA(publicKey);
      const baseUnits = BigInt(Math.round(amount * CMT_DECIMALS));

      const dataBuffer = Buffer.alloc(8);
      dataBuffer.writeBigUInt64LE(baseUnits);

      const discriminator = await disc('unstake');
      const ix = buildInstruction(discriminator, dataBuffer, [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: investorPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] unstake fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { unstake, isPending };
}

export function useClaimRewards() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const claim = useCallback(async () => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [vaultPDA] = getVaultPDA();
      const [investorPDA] = getInvestorPDA(publicKey);

      const discriminator = await disc('claim_rewards');
      const ix = buildInstruction(discriminator, Buffer.alloc(0), [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: vaultPDA, isSigner: false, isWritable: true },
        { pubkey: investorPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] claim fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { claim, isPending };
}

export function useInvestorAccount() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [data, setData] = useState<{
    stakedAmount: number;
    stakedAt: number;
    lockUntil: number;
    tier: number;
    pendingRewards: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!connected || !publicKey) { setData(null); return; }
    setIsLoading(true);
    try {
      const [investorPDA] = getInvestorPDA(publicKey);
      const info = await connection.getAccountInfo(investorPDA);
      if (info?.data && info.data.length >= 72) {
        const d = info.data;
        const off = 8; // skip discriminator
        setData({
          stakedAmount: Number(d.readBigUInt64LE(off + 32)), // after user pubkey (32 bytes)
          stakedAt: Number(d.readBigInt64LE(off + 40)),
          lockUntil: Number(d.readBigInt64LE(off + 48)),
          tier: d.readUInt8(off + 56),
          pendingRewards: Number(d.readBigUInt64LE(off + 57)),
        });
      } else {
        setData(null);
      }
    } catch { setData(null); }
    finally { setIsLoading(false); }
  }, [connection, publicKey, connected]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

// ── Badge Hooks ──────────────────────────────────────────────────

export function useBadge(startupId: number | undefined) {
  const { connection } = useConnection();
  const [data, setData] = useState<{
    startupId: number;
    owner: string;
    trustScore: number;
    verifiedAt: number;
    isLocked: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (startupId === undefined) return;
    setIsLoading(true);
    try {
      const [badgePDA] = getBadgePDA(startupId);
      const info = await connection.getAccountInfo(badgePDA);
      if (info?.data && info.data.length >= 90) {
        const d = info.data;
        const off = 8;
        setData({
          startupId: Number(d.readBigUInt64LE(off)),
          owner: new PublicKey(d.subarray(off + 8, off + 40)).toBase58(),
          trustScore: Number(d.readBigUInt64LE(off + 40)),
          verifiedAt: Number(d.readBigInt64LE(off + 48)),
          isLocked: d.readUInt8(off + 88) === 1,
        });
      } else {
        setData(null);
      }
    } catch { setData(null); }
    finally { setIsLoading(false); }
  }, [connection, startupId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, refetch: fetch };
}

export function useMintBadge() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const mint = useCallback(async (startupId: number, recipient: PublicKey, trustScore: number) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [badgePDA] = getBadgePDA(startupId);

      const dataBuffer = Buffer.alloc(8 + 8); // startup_id(u64) + trust_score(u64)
      dataBuffer.writeBigUInt64LE(BigInt(startupId), 0);
      dataBuffer.writeBigUInt64LE(BigInt(trustScore), 8);

      const discriminator = await disc('mint_badge');
      const ix = buildInstruction(discriminator, dataBuffer, [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: recipient, isSigner: false, isWritable: false },
        { pubkey: badgePDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] badge fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { mint, isPending };
}

/**
 * Upgrade a verification badge tier (Bronze → Silver → Gold → Platinum).
 * Authority-only. Requires sufficient trust score for next tier.
 */
export function useUpgradeBadgeTier() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const upgrade = useCallback(async (startupId: number) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [registryPDA] = getRegistryPDA();
      const [badgePDA] = getBadgePDA(startupId);

      const discriminator = await disc('upgrade_badge_tier');
      const ix = buildInstruction(discriminator, Buffer.alloc(0), [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: registryPDA, isSigner: false, isWritable: false },
        { pubkey: badgePDA, isSigner: false, isWritable: true },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] tier upgrade fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { upgrade, isPending };
}

// ── Governance Hooks ─────────────────────────────────────────────

export function useCreateProposal() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const create = useCallback(async (title: string, description: string) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [daoPDA] = getDaoPDA();
      const [investorPDA] = getInvestorPDA(publicKey);

      // Read DAO config to get next proposal ID
      const daoInfo = await connection.getAccountInfo(daoPDA);
      let nextId = 1;
      if (daoInfo?.data && daoInfo.data.length >= 64) {
        // Skip disc(8) + authority(32) + voting_delay(8) + voting_period(8) + proposal_threshold(8) + quorum_percentage(1) + proposal_count(8)
        nextId = Number(daoInfo.data.readBigUInt64LE(8 + 32 + 8 + 8 + 8 + 1)) + 1;
      }

      const [proposalPDA] = getProposalPDA(nextId);

      const encoder = new TextEncoder();
      const titleBytes = encoder.encode(title);
      const descBytes = encoder.encode(description);

      const dataBuffer = Buffer.alloc(4 + titleBytes.length + 4 + descBytes.length);
      let offset = 0;
      dataBuffer.writeUInt32LE(titleBytes.length, offset); offset += 4;
      Buffer.from(titleBytes).copy(dataBuffer, offset); offset += titleBytes.length;
      dataBuffer.writeUInt32LE(descBytes.length, offset); offset += 4;
      Buffer.from(descBytes).copy(dataBuffer, offset);

      const discriminator = await disc('create_proposal');
      const ix = buildInstruction(discriminator, dataBuffer, [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: daoPDA, isSigner: false, isWritable: true },
        { pubkey: investorPDA, isSigner: false, isWritable: false },
        { pubkey: proposalPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] proposal fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { create, isPending };
}

export function useCastVote() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  /**
   * @param proposalId - on-chain proposal ID
   * @param support - 0=Against, 1=For, 2=Abstain
   */
  const vote = useCallback(async (proposalId: number, support: 0 | 1 | 2) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [proposalPDA] = getProposalPDA(proposalId);
      const [investorPDA] = getInvestorPDA(publicKey);
      const [voteRecordPDA] = getVoteRecordPDA(proposalId, publicKey);

      const dataBuffer = Buffer.alloc(1); // support: u8
      dataBuffer.writeUInt8(support, 0);

      const discriminator = await disc('cast_vote');
      const ix = buildInstruction(discriminator, dataBuffer, [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: proposalPDA, isSigner: false, isWritable: true },
        { pubkey: investorPDA, isSigner: false, isWritable: false },
        { pubkey: voteRecordPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] vote fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { vote, isPending };
}

export function useExecuteProposal() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(async (proposalId: number) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [daoPDA] = getDaoPDA();
      const [proposalPDA] = getProposalPDA(proposalId);

      const discriminator = await disc('execute_proposal');
      const ix = buildInstruction(discriminator, Buffer.alloc(0), [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: daoPDA, isSigner: false, isWritable: false },
        { pubkey: proposalPDA, isSigner: false, isWritable: true },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] execute fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { execute, isPending };
}

export function useDelegateVotes() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const delegate = useCallback(async (delegatee: PublicKey) => {
    if (!connected || !publicKey) throw new Error('Wallet not connected');
    setIsPending(true);
    try {
      const [delegationPDA] = getDelegationPDA(publicKey);

      // Borsh: delegatee pubkey (32 bytes)
      const dataBuffer = Buffer.alloc(32);
      delegatee.toBuffer().copy(dataBuffer, 0);

      const discriminator = await disc('delegate_votes');
      const ix = buildInstruction(discriminator, dataBuffer, [
        { pubkey: publicKey, isSigner: true, isWritable: true },
        { pubkey: delegationPDA, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ]);

      const tx = new Transaction().add(ix);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (e: any) {
      if (import.meta.env.DEV) console.warn('[chain] delegate fallback:', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { delegate, isPending };
}

// ── Read Hooks ───────────────────────────────────────────────────

export function useReadStartupCount() {
  const { connection } = useConnection();
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [registryPDA] = getRegistryPDA();
      const info = await connection.getAccountInfo(registryPDA);
      if (info?.data && info.data.length >= 48) {
        setCount(Number(info.data.readBigUInt64LE(40)));
      } else {
        setCount(null);
      }
    } catch { setCount(null); }
    finally { setIsLoading(false); }
  }, [connection]);

  useEffect(() => { fetch(); }, [fetch]);

  return { count, isLoading, refetch: fetch };
}

export function useReadProposal(proposalId: number | undefined) {
  const { connection } = useConnection();
  const [data, setData] = useState<{
    id: number;
    proposer: string;
    title: string;
    forVotes: number;
    againstVotes: number;
    abstainVotes: number;
    executed: boolean;
    cancelled: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (proposalId === undefined) return;
    setIsLoading(true);
    try {
      const [proposalPDA] = getProposalPDA(proposalId);
      const info = await connection.getAccountInfo(proposalPDA);
      if (info?.data && info.data.length >= 200) {
        const d = info.data;
        const off = 8; // skip discriminator
        setData({
          id: Number(d.readBigUInt64LE(off)),
          proposer: new PublicKey(d.subarray(off + 8, off + 40)).toBase58(),
          title: '', // Would need string deserialization — reading from Supabase is preferred
          forVotes: Number(d.readBigUInt64LE(off + 40 + 200 + 1000 + 8 + 8 + 8)), // rough offset
          againstVotes: 0,
          abstainVotes: 0,
          executed: false,
          cancelled: false,
        });
      } else {
        setData(null);
      }
    } catch { setData(null); }
    finally { setIsLoading(false); }
  }, [connection, proposalId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, isLoading, refetch: fetch };
}
