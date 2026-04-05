import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIERS } from '@/lib/mock-data';
import { useStake, useUnstake, useInvestorAccount } from '@/hooks/use-blockchain';
import { useWallet } from '@/contexts/WalletContext';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { formatCMT } from '@/lib/format';
import { explorerTxUrl } from '@/lib/solana-config';
import { toast } from '@/hooks/use-toast';
import {
  Loader2, ExternalLink, Gift, AlertTriangle, Coins, TrendingUp, Users, Shield,
} from 'lucide-react';

const TOKEN_DISTRIBUTION = [
  { label: 'Staking Rewards', pct: 35, color: 'bg-purple-500' },
  { label: 'Treasury', pct: 25, color: 'bg-blue-500' },
  { label: 'Community', pct: 20, color: 'bg-emerald-500' },
  { label: 'Team (vested)', pct: 15, color: 'bg-amber-500' },
  { label: 'Liquidity', pct: 5, color: 'bg-pink-500' },
];

function StakeModal({ mode, onClose }: { mode: 'stake' | 'unstake'; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const { stake, isPending: stakePending } = useStake();
  const { unstake, isPending: unstakePending } = useUnstake();
  const { stakedAmount, balance } = useWallet();
  const pending = stakePending || unstakePending;

  const available = mode === 'stake' ? balance : stakedAmount;
  const currentStake = stakedAmount;

  const newTier = () => {
    const val = Number(amount) || 0;
    const total = mode === 'stake' ? currentStake + val : currentStake - val;
    if (total >= 50000) return 'Whale';
    if (total >= 5000) return 'Pro';
    if (total > 0) return 'Basic';
    return 'Free';
  };

  const handleSubmit = async () => {
    const val = Number(amount);
    if (!val || val <= 0) return;
    try {
      const sig = mode === 'stake' ? await stake(val) : await unstake(val);
      setTxHash(sig);
      toast({ title: `${mode === 'stake' ? 'Staked' : 'Unstaked'} successfully`, description: `Tx: ${sig.slice(0, 12)}...` });
    } catch (e: any) {
      toast({ title: 'Transaction failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mx-4 w-full max-w-md rounded-2xl border bg-card p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">{mode === 'stake' ? 'Stake Tokens' : 'Unstake Tokens'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {txHash ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="font-bold text-foreground">{mode === 'stake' ? 'Staked' : 'Unstaked'} Successfully</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground break-all">{txHash}</p>
            <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-3 text-sm mb-4">
              <span className="text-muted-foreground">{mode === 'stake' ? 'Available' : 'Currently Staked'}</span>
              <div className="font-bold font-mono">{available > 0 ? formatCMT(available) : '0 CMT'}</div>
            </div>

            <div className="relative mb-4">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border bg-card px-4 py-3 pr-20 font-mono text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <button
                onClick={() => setAmount(String(available > 0 ? available : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary"
              >
                MAX
              </button>
            </div>

            {amount && Number(amount) > 0 && (
              <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">New Tier: </span>
                <span className="font-bold text-primary">{newTier()}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!amount || Number(amount) <= 0 || pending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? 'Confirming on Solana...' : mode === 'stake' ? 'Stake CMT' : 'Unstake CMT'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function Staking() {
  const [modal, setModal] = useState<'stake' | 'unstake' | null>(null);
  const { tier, stakedAmount, connected } = useWallet();
  const { connected: walletConnected } = useSolanaWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { data: investorData } = useInvestorAccount();

  const userTierIdx = TIERS.findIndex(t => t.name === tier);
  const pendingRewards = investorData?.pendingRewards ?? 0;
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (pendingRewards <= 0) return;
    setClaiming(true);
    try {
      // In production this calls the on-chain claim instruction
      await new Promise(r => setTimeout(r, 1500));
      toast({ title: 'Rewards claimed!', description: `${formatCMT(pendingRewards)} added to your wallet` });
    } catch (e: any) {
      toast({ title: 'Claim failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setClaiming(false);
    }
  };

  const stats = [
    { label: 'Total Staked', value: '2.45M CMT', icon: Coins, demo: true },
    { label: 'Total Stakers', value: '1,823', icon: Users, demo: true },
    { label: 'Current APY', value: '12.5%', icon: TrendingUp, accent: true, demo: true },
    { label: 'Your Stake', value: stakedAmount > 0 ? formatCMT(stakedAmount) : '0 CMT', icon: Shield, sub: `Tier: ${tier}` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Staking</h1>
      <p className="mt-1 text-muted-foreground">Stake CMT tokens to unlock premium analytics and earn rewards</p>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border bg-card p-5"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4" />
              {s.label}
            </div>
            <div className={`mt-1 text-2xl font-bold font-mono ${s.accent ? 'text-accent' : ''}`}>{s.value}</div>
            {s.sub && <div className="mt-0.5 text-xs text-blue-500 font-medium">{s.sub}</div>}
            {(s as any).demo && <div className="mt-0.5 text-[9px] text-muted-foreground/60 italic">Simulated</div>}
          </motion.div>
        ))}
      </div>

      {/* Wallet required */}
      {!walletConnected && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Connect your Solana wallet to stake</p>
            <p className="text-xs text-muted-foreground">Phantom, Solflare, or Coinbase supported</p>
          </div>
          <button onClick={() => openWalletModal(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
            Connect Wallet
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => setModal('stake')} className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90">
          Stake CMT
        </button>
        <button onClick={() => setModal('unstake')} className="rounded-xl border px-6 py-3 font-semibold transition hover:border-destructive hover:text-destructive">
          Unstake CMT
        </button>

        {/* Claim Rewards */}
        <div className="ml-auto flex items-center gap-3 rounded-xl border bg-card px-5 py-3">
          <Gift className="h-5 w-5 text-accent" />
          <div>
            <span className="text-xs text-muted-foreground">Pending Rewards</span>
            <p className="font-bold font-mono text-accent">{pendingRewards > 0 ? formatCMT(pendingRewards) : '0 CMT'}</p>
          </div>
          <div className="relative group">
            <button
              disabled={pendingRewards <= 0 || claiming}
              onClick={handleClaim}
              className="rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/20 disabled:opacity-40 flex items-center gap-1.5"
            >
              {claiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {claiming ? 'Claiming...' : 'Claim'}
            </button>
            {pendingRewards <= 0 && !claiming && (
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-[10px] text-background opacity-0 transition group-hover:opacity-100">
                No pending rewards to claim
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="relative overflow-hidden rounded-2xl border bg-card"
            style={{ borderTopColor: t.color, borderTopWidth: '3px' }}
          >
            {i > userTierIdx && userTierIdx >= 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-[2px]">
                <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: t.color }}>{t.name}</span>
                {i === userTierIdx && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Current</span>
                )}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{t.minStake > 0 ? `${t.minStake.toLocaleString()} CMT` : 'Free'}</div>
              <ul className="mt-4 space-y-2">
                {t.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 flex-shrink-0" style={{ color: t.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Token Distribution */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">CMT Token Distribution</h3>
          <span className="text-sm font-mono text-muted-foreground">Total Supply: 100,000,000 CMT</span>
        </div>
        <div className="space-y-3">
          {TOKEN_DISTRIBUTION.map((d, i) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-32 text-sm text-muted-foreground">{d.label}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${d.color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${d.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
              <span className="w-10 text-right text-sm font-mono font-medium">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && <StakeModal mode={modal} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
