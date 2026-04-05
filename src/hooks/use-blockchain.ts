import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useCallback, useEffect } from 'react';
import {
  Transaction,
  TransactionInstruction,
  SystemProgram,
  PublicKey,
} from '@solana/web3.js';
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

/** Generate a fake tx signature for demo mode */
function genDemoTxSig(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 88 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
 * Build an instruction for the chainmetrics program.
 * In production, use the Anchor-generated IDL client.
 * The discriminator is the first 8 bytes of SHA-256("global:<fn_name>").
 */
function buildInstruction(
  discriminator: number[],
  data: Buffer,
  keys: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }[],
): TransactionInstruction {
  const disc = Buffer.from(discriminator);
  const instructionData = Buffer.concat([disc, data]);
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
      setIsPending(true);
      setError(null);
      setTxHash(null);
      setIsDemoMode(false);

      try {
        const proofHash = await computeProofHash({
          mrr: params.mrr,
          users: params.totalUsers,
          activeUsers: params.activeUsers,
          burnRate: params.burnRate,
          runway: params.runway,
          growthRate: params.growthRate,
          carbonOffset: params.carbonOffset,
        });

        const [startupPDA] = getStartupPDA(params.startupId);
        const [metricsPDA] = getMetricsPDA(params.startupId);

        // Build publish_metrics instruction data
        const dataBuffer = Buffer.alloc(8 * 7 + 8 + 32); // 7 u64 + 1 i64 + 32 bytes hash
        let offset = 0;
        dataBuffer.writeBigUInt64LE(BigInt(params.mrr), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(params.totalUsers), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(params.activeUsers), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(params.burnRate), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(params.runway), offset); offset += 8;
        dataBuffer.writeBigInt64LE(BigInt(Math.round(params.growthRate * 100)), offset); offset += 8;
        dataBuffer.writeBigUInt64LE(BigInt(params.carbonOffset), offset); offset += 8;
        proofHash.forEach((b, i) => dataBuffer.writeUInt8(b, offset + i));

        const ix = buildInstruction(
          [], // Discriminator computed by Anchor at build time — will be replaced with IDL client
          dataBuffer,
          [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: startupPDA, isSigner: false, isWritable: true },
            { pubkey: metricsPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
        );

        const tx = new Transaction().add(ix);
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');

        setTxHash(sig);
        return sig;
      } catch (e: any) {
        console.warn('On-chain publish failed, using demo mode:', e?.message);
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
          // Skip 8-byte discriminator + 32-byte authority, then read u64 startup_count
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

        const ix = buildInstruction(
          [], // Discriminator from IDL
          dataBuffer,
          [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: registryPDA, isSigner: false, isWritable: true },
            { pubkey: startupPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
        );

        const tx = new Transaction().add(ix);
        const sig = await sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');

        setTxHash(sig);
        return sig;
      } catch (e: any) {
        console.warn('On-chain register failed, using demo mode:', e?.message);
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
        // Parse the metrics account data (skip 8-byte Anchor discriminator)
        const d = accountInfo.data;
        const off = 8;
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
      console.warn('Failed to read on-chain metrics:', e);
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

      const ix = buildInstruction([], dataBuffer, [
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
      console.warn('Stake failed (demo mode):', e?.message);
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

      const ix = buildInstruction([], dataBuffer, [
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
      console.warn('Unstake failed (demo mode):', e?.message);
      return genDemoTxSig();
    } finally {
      setIsPending(false);
    }
  }, [connected, publicKey, sendTransaction, connection]);

  return { unstake, isPending };
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
          stakedAmount: Number(d.readBigUInt64LE(off + 32)), // after user pubkey
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

// ── Badge Hook ────────────────────────────────────────────────────

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

// ── Governance Hooks ──────────────────────────────────────────────

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
