import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, CheckCircle, XCircle, Loader2, ExternalLink, Wallet,
  BarChart3, Users, Lock, RefreshCw, AlertTriangle,
} from 'lucide-react';
import {
  useVerifyTreasury,
  useVerifyActivity,
  useVerifyTokenDistribution,
  useVerifyMint,
  computeVerificationScore,
  type VerificationScore,
} from '@/hooks/use-chain-verification';
import { SOLANA_NETWORK } from '@/lib/solana-config';

interface Props {
  walletAddress?: string;
  tokenMint?: string;
  claimedTreasuryUsd?: number;
  startupName: string;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  B: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  C: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  D: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  F: 'text-red-400 bg-red-500/10 border-red-500/20',
};

function explorerUrl(type: 'address' | 'tx', value: string): string {
  const base = 'https://explorer.solana.com';
  return `${base}/${type}/${value}?cluster=${SOLANA_NETWORK}`;
}

export default function OnChainVerification({ walletAddress, tokenMint, claimedTreasuryUsd = 0, startupName }: Props) {
  const { verify: verifyTreasury, data: treasury, isLoading: treasuryLoading } = useVerifyTreasury();
  const { verify: verifyActivity, data: activity, isLoading: activityLoading } = useVerifyActivity();
  const { verify: verifyDist, data: distribution, isLoading: distLoading } = useVerifyTokenDistribution();
  const { verify: verifyMintAuth, data: mint, isLoading: mintLoading } = useVerifyMint();
  const [score, setScore] = useState<VerificationScore | null>(null);
  const [verifying, setVerifying] = useState(false);

  const isLoading = treasuryLoading || activityLoading || distLoading || mintLoading || verifying;

  const runFullVerification = async () => {
    if (!walletAddress) return;
    setVerifying(true);

    const [t, a, d, m] = await Promise.all([
      verifyTreasury(walletAddress),
      verifyActivity(walletAddress),
      tokenMint ? verifyDist(tokenMint) : Promise.resolve(null),
      tokenMint ? verifyMintAuth(tokenMint) : Promise.resolve(null),
    ]);

    const result = computeVerificationScore(t, d, a, m, claimedTreasuryUsd);
    setScore(result);
    setVerifying(false);
  };

  if (!walletAddress) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No Solana wallet address registered for this startup.</p>
        <p className="text-xs text-muted-foreground mt-1">Startups must register a wallet address to enable on-chain verification.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">On-Chain Verification</h3>
            <p className="text-xs text-muted-foreground">Live blockchain data from Solana {SOLANA_NETWORK}</p>
          </div>
        </div>
        <button
          onClick={runFullVerification}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isLoading ? 'Verifying...' : score ? 'Re-verify' : 'Verify Now'}
        </button>
      </div>

      {/* Wallet info */}
      <div className="rounded-lg bg-muted/30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">{walletAddress}</span>
        </div>
        <a href={explorerUrl('address', walletAddress)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
          Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Score card */}
      {score && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold">Verification Score</h4>
              <p className="text-xs text-muted-foreground">Based on live Solana blockchain data</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-display font-bold tabular-nums">{score.overall}</span>
              <span className={`rounded-lg border px-3 py-1.5 text-lg font-bold ${GRADE_COLORS[score.grade]}`}>
                {score.grade}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full bg-muted overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score.overall}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full rounded-full ${score.overall >= 70 ? 'bg-emerald-500' : score.overall >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            />
          </div>

          {/* Check items */}
          <div className="space-y-3">
            {[
              { label: 'Treasury Balance', icon: Wallet, ...score.treasury, weight: '30 pts' },
              { label: 'Token Distribution', icon: Users, ...score.distribution, weight: '25 pts' },
              { label: 'Transaction Activity', icon: BarChart3, ...score.activity, weight: '25 pts' },
              { label: 'Mint Authority', icon: Lock, ...score.mintSecurity, weight: '20 pts' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                {item.verified ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{item.weight}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground text-right">
            Verified at {new Date(score.verifiedAt).toLocaleString()} from Solana {SOLANA_NETWORK}
          </p>
        </motion.div>
      )}

      {/* Treasury details */}
      {treasury && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" /> Treasury Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">SOL Balance</div>
              <div className="text-lg font-bold font-mono">{treasury.solBalance.toFixed(4)}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">Est. USD Value</div>
              <div className="text-lg font-bold font-mono">${treasury.totalUsdEstimate.toLocaleString()}</div>
            </div>
          </div>
          {treasury.tokenAccounts.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">SPL Token Holdings</h5>
              <div className="space-y-1">
                {treasury.tokenAccounts.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                    <span className="font-mono text-muted-foreground">{t.mint.slice(0, 8)}...{t.mint.slice(-4)}</span>
                    <span className="font-mono font-medium">{t.balance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Activity details */}
      {activity && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Transaction Activity
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-lg font-bold font-mono">{activity.last7DaysTx}</div>
              <div className="text-[10px] text-muted-foreground">Last 7 days</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-lg font-bold font-mono">{activity.last30DaysTx}</div>
              <div className="text-[10px] text-muted-foreground">Last 30 days</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-lg font-bold font-mono">{activity.totalTransactions}</div>
              <div className="text-[10px] text-muted-foreground">All time</div>
            </div>
          </div>
          {!activity.isActive && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/5 border border-amber-500/20 p-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs text-amber-400">No transactions in the last 30 days.</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Distribution details */}
      {distribution && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Token Holder Distribution
          </h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-lg font-bold font-mono">{distribution.totalHolders}</div>
              <div className="text-[10px] text-muted-foreground">Total holders</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className={`text-lg font-bold font-mono ${distribution.top10ConcentrationPct > 80 ? 'text-red-400' : distribution.top10ConcentrationPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {distribution.top10ConcentrationPct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-muted-foreground">Top 10 concentration</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-center">
              <div className="text-lg font-bold font-mono">{distribution.giniCoefficient}</div>
              <div className="text-[10px] text-muted-foreground">Gini coefficient</div>
            </div>
          </div>
          {distribution.top10Holders.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-muted-foreground mb-2">Top Holders</h5>
              {distribution.top10Holders.slice(0, 5).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono w-4">{i + 1}.</span>
                    <a href={explorerUrl('address', h.owner)} target="_blank" rel="noopener noreferrer" className="font-mono text-primary hover:underline">
                      {h.owner.slice(0, 6)}...{h.owner.slice(-4)}
                    </a>
                  </div>
                  <span className="font-mono font-medium">{h.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
