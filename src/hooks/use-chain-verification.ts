/**
 * On-chain verification hooks.
 * Reads live Solana blockchain data to verify startup claims.
 * Zero cost — all operations are RPC reads.
 */
import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// ── Types ────────────────────────────────────────────────────────

export interface TreasuryVerification {
  solBalance: number;
  lamports: number;
  tokenAccounts: { mint: string; symbol: string; balance: number; decimals: number }[];
  totalUsdEstimate: number;
  verifiedAt: number;
}

export interface TokenDistribution {
  totalHolders: number;
  top10Holders: { owner: string; balance: number; pct: number }[];
  top10ConcentrationPct: number;
  giniCoefficient: number;
}

export interface ActivityVerification {
  totalTransactions: number;
  last30DaysTx: number;
  last7DaysTx: number;
  isActive: boolean;
  avgTxPerDay: number;
  oldestTx: string | null;
  newestTx: string | null;
}

export interface MintVerification {
  supply: number;
  decimals: number;
  mintAuthority: string | null;
  canMintMore: boolean;
  freezeAuthority: string | null;
  canFreezeAccounts: boolean;
}

export interface VerificationScore {
  treasury: { verified: boolean; detail: string };
  distribution: { verified: boolean; detail: string };
  activity: { verified: boolean; detail: string };
  mintSecurity: { verified: boolean; detail: string };
  overall: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  verifiedAt: number;
}

// ── Treasury Verification ────────────────────────────────────────

export function useVerifyTreasury() {
  const { connection } = useConnection();
  const [data, setData] = useState<TreasuryVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const pubkey = new PublicKey(walletAddress);

      // Get SOL balance
      const lamports = await connection.getBalance(pubkey);
      const solBalance = lamports / LAMPORTS_PER_SOL;

      // Get all SPL token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const tokens = tokenAccounts.value
        .map(acc => {
          const parsed = acc.account.data.parsed.info;
          return {
            mint: parsed.mint as string,
            symbol: parsed.mint.slice(0, 4) + '...',
            balance: parsed.tokenAmount.uiAmount as number,
            decimals: parsed.tokenAmount.decimals as number,
          };
        })
        .filter(t => t.balance > 0)
        .sort((a, b) => b.balance - a.balance);

      // Estimate USD (SOL price approximation — in production use Pyth)
      const solPrice = 140; // Approximate; replace with Pyth feed for real-time
      const totalUsdEstimate = solBalance * solPrice;

      const result: TreasuryVerification = {
        solBalance,
        lamports,
        tokenAccounts: tokens,
        totalUsdEstimate,
        verifiedAt: Date.now(),
      };

      setData(result);
      return result;
    } catch (e: any) {
      setError(e?.message || 'Failed to verify treasury');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { verify, data, isLoading, error };
}

// ── Token Distribution ───────────────────────────────────────────

export function useVerifyTokenDistribution() {
  const { connection } = useConnection();
  const [data, setData] = useState<TokenDistribution | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verify = useCallback(async (mintAddress: string) => {
    setIsLoading(true);
    try {
      const mint = new PublicKey(mintAddress);

      const accounts = await connection.getParsedProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: mint.toBase58() } },
        ],
      });

      const holders = accounts
        .map(acc => {
          const parsed = (acc.account.data as any).parsed.info;
          return {
            owner: parsed.owner as string,
            balance: (parsed.tokenAmount.uiAmount as number) || 0,
          };
        })
        .filter(h => h.balance > 0)
        .sort((a, b) => b.balance - a.balance);

      const totalSupply = holders.reduce((s, h) => s + h.balance, 0);
      const top10 = holders.slice(0, 10).map(h => ({
        ...h,
        pct: totalSupply > 0 ? (h.balance / totalSupply) * 100 : 0,
      }));
      const top10Pct = top10.reduce((s, h) => s + h.pct, 0);

      // Gini coefficient
      const sorted = holders.map(h => h.balance).sort((a, b) => a - b);
      const n = sorted.length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      let gini = 0;
      if (sum > 0 && n > 1) {
        let num = 0;
        sorted.forEach((val, i) => { num += (2 * (i + 1) - n - 1) * val; });
        gini = num / (n * sum);
      }

      const result: TokenDistribution = {
        totalHolders: holders.length,
        top10Holders: top10,
        top10ConcentrationPct: top10Pct,
        giniCoefficient: Math.round(gini * 100) / 100,
      };

      setData(result);
      return result;
    } catch {
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { verify, data, isLoading };
}

// ── Transaction Activity ─────────────────────────────────────────

export function useVerifyActivity() {
  const { connection } = useConnection();
  const [data, setData] = useState<ActivityVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verify = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      const pubkey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 1000 });

      const now = Date.now() / 1000;
      const last30 = signatures.filter(s => (s.blockTime ?? 0) >= now - 30 * 86400);
      const last7 = signatures.filter(s => (s.blockTime ?? 0) >= now - 7 * 86400);

      const result: ActivityVerification = {
        totalTransactions: signatures.length,
        last30DaysTx: last30.length,
        last7DaysTx: last7.length,
        isActive: last30.length > 0,
        avgTxPerDay: last30.length / 30,
        oldestTx: signatures.length > 0 && signatures[signatures.length - 1].blockTime
          ? new Date(signatures[signatures.length - 1].blockTime! * 1000).toISOString()
          : null,
        newestTx: signatures.length > 0 && signatures[0].blockTime
          ? new Date(signatures[0].blockTime! * 1000).toISOString()
          : null,
      };

      setData(result);
      return result;
    } catch {
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { verify, data, isLoading };
}

// ── Mint Authority Verification ──────────────────────────────────

export function useVerifyMint() {
  const { connection } = useConnection();
  const [data, setData] = useState<MintVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verify = useCallback(async (mintAddress: string) => {
    setIsLoading(true);
    try {
      const mint = new PublicKey(mintAddress);
      const info = await connection.getParsedAccountInfo(mint);

      if (!info.value || !('parsed' in info.value.data)) {
        setData(null);
        return null;
      }

      const parsed = info.value.data.parsed.info;
      const result: MintVerification = {
        supply: parsed.supply / Math.pow(10, parsed.decimals),
        decimals: parsed.decimals,
        mintAuthority: parsed.mintAuthority ?? null,
        canMintMore: parsed.mintAuthority !== null,
        freezeAuthority: parsed.freezeAuthority ?? null,
        canFreezeAccounts: parsed.freezeAuthority !== null,
      };

      setData(result);
      return result;
    } catch {
      setData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { verify, data, isLoading };
}

// ── Combined Verification Score ──────────────────────────────────

export function computeVerificationScore(
  treasury: TreasuryVerification | null,
  distribution: TokenDistribution | null,
  activity: ActivityVerification | null,
  mint: MintVerification | null,
  claimedTreasuryUsd: number,
): VerificationScore {
  let score = 0;
  const now = Date.now();

  // Treasury check (30 points)
  const treasuryOk = treasury !== null && treasury.totalUsdEstimate >= claimedTreasuryUsd * 0.9;
  if (treasuryOk) score += 30;

  // Distribution check (25 points)
  const distOk = distribution !== null && distribution.top10ConcentrationPct < 80;
  if (distOk) score += 25;

  // Activity check (25 points)
  const activityOk = activity !== null && activity.last30DaysTx > 0;
  if (activityOk) score += 25;

  // Mint security check (20 points)
  const mintOk = mint !== null && !mint.canMintMore;
  if (mintOk) score += 20;

  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';

  return {
    treasury: {
      verified: treasuryOk,
      detail: treasury
        ? `${treasury.solBalance.toFixed(2)} SOL (~$${treasury.totalUsdEstimate.toLocaleString()})`
        : 'Not verified',
    },
    distribution: {
      verified: distOk,
      detail: distribution
        ? `${distribution.totalHolders} holders, top 10 hold ${distribution.top10ConcentrationPct.toFixed(1)}%`
        : 'Not verified',
    },
    activity: {
      verified: activityOk,
      detail: activity
        ? `${activity.last30DaysTx} txs in 30d (${activity.avgTxPerDay.toFixed(1)}/day)`
        : 'Not verified',
    },
    mintSecurity: {
      verified: mintOk,
      detail: mint
        ? mint.canMintMore ? 'Mint authority active — supply not capped' : 'Mint authority revoked — supply fixed'
        : 'Not verified',
    },
    overall: score,
    grade,
    verifiedAt: now,
  };
}
