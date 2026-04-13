/**
 * Streaming Rewards Display
 * ─────────────────────────
 * Real-time per-second staking reward counter.
 * Rewards tick up using requestAnimationFrame — viscerally futuristic.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Clock, ArrowUpRight, Coins } from 'lucide-react';
import {
  createStreamingState,
  tickRewards,
  formatCMT,
  formatDuration,
  TIER_CONFIG,
  nextTierInfo,
  type StreamingRewardsState,
} from '@/lib/streaming-rewards';

// ── Ticking Counter Component ────────────────────────────────────────

function TickingCounter({ value, decimals = 6 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    prevValue.current = displayValue;
    setDisplayValue(value);
  }, [value]);

  // Format with fixed decimals, highlight the ticking digits
  const formatted = displayValue.toFixed(decimals);
  const parts = formatted.split('.');
  const integer = parts[0];
  const decimal = parts[1] ?? '';

  return (
    <span className="font-mono tabular-nums">
      <span className="text-foreground">{integer}</span>
      <span className="text-foreground">.</span>
      <span className="text-foreground">{decimal.slice(0, 2)}</span>
      <span className="text-primary/80">{decimal.slice(2, 4)}</span>
      <motion.span
        key={decimal.slice(4)}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className="text-primary"
      >
        {decimal.slice(4)}
      </motion.span>
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface StreamingRewardsDisplayProps {
  stakedAmount: number;
  stakingStartTime?: number;
}

export default function StreamingRewardsDisplay({
  stakedAmount,
  stakingStartTime,
}: StreamingRewardsDisplayProps) {
  const startTime = stakingStartTime ?? Date.now() - 30 * 24 * 3600 * 1000; // Default: 30 days ago
  const [state, setState] = useState<StreamingRewardsState>(() =>
    createStreamingState(stakedAmount, startTime),
  );
  const rafRef = useRef<number>(0);

  // Animation loop — tick rewards every frame
  const tick = useCallback(() => {
    setState(prev => tickRewards(prev));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  // Recalculate when staked amount changes
  useEffect(() => {
    setState(createStreamingState(stakedAmount, startTime));
  }, [stakedAmount, startTime]);

  const tierConfig = TIER_CONFIG[state.tier];
  const nextTier = useMemo(() => nextTierInfo(stakedAmount), [stakedAmount]);

  if (stakedAmount <= 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <Coins className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Stake CMT to Start Earning</p>
        <p className="text-xs text-muted-foreground mt-1">
          Stake any amount of CMT tokens to begin earning per-second streaming rewards.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header with live counter */}
      <div className="bg-gradient-to-r from-primary/10 via-amber-500/5 to-emerald-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2" style={{ borderColor: tierConfig.color + '50' }}>
              <Zap className="h-7 w-7" style={{ color: tierConfig.color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Streaming Rewards</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-bold" style={{ color: tierConfig.color }}>{state.tier}</span> tier &bull; {state.weightedApy.toFixed(1)}% APY &bull; Live
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-0.5">Total Earned</div>
            <div className="text-2xl font-bold">
              <TickingCounter value={state.totalEarned} />
            </div>
            <div className="text-[10px] text-muted-foreground">CMT</div>
          </div>
        </div>

        {/* Rate per second indicator */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-card/80 p-2.5">
          <div className="flex items-center gap-1 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-muted-foreground">Rate:</span>
            <span className="font-mono font-bold text-emerald-500">
              +{state.totalRatePerSecond.toFixed(8)}
            </span>
            <span className="text-muted-foreground">CMT/sec</span>
          </div>
          <span className="text-[10px] text-muted-foreground mx-2">|</span>
          <div className="flex items-center gap-1 text-[10px]">
            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-muted-foreground">Staking for:</span>
            <span className="font-mono font-medium text-foreground">{formatDuration(state.stakingDuration)}</span>
          </div>
        </div>
      </div>

      {/* Reward streams */}
      <div className="p-4 space-y-2">
        {state.streams.map((stream, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${stream.active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              <div>
                <span className="text-xs font-medium text-foreground">{stream.name}</span>
                <span className="text-[10px] text-muted-foreground ml-2">{stream.apy}% APY</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-foreground">{formatCMT(stream.earned)}</span>
              <span className="text-[10px] text-muted-foreground block">+{stream.ratePerSecond.toFixed(8)}/s</span>
            </div>
          </div>
        ))}
      </div>

      {/* Projections */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] font-medium text-muted-foreground mb-2">Projections (at current rate)</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Daily', value: state.projections.daily },
            { label: 'Weekly', value: state.projections.weekly },
            { label: 'Monthly', value: state.projections.monthly },
            { label: 'Yearly', value: state.projections.yearly },
          ].map(proj => (
            <div key={proj.label} className="text-center rounded-lg bg-muted/20 p-2">
              <span className="text-xs font-bold font-mono text-foreground">{formatCMT(proj.value)}</span>
              <p className="text-[10px] text-muted-foreground">{proj.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Next tier info */}
      {nextTier && (
        <div className="border-t border-border px-4 py-3 bg-muted/10">
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              Stake <span className="font-mono font-bold text-foreground">{nextTier.amountNeeded.toLocaleString()} more CMT</span> to reach
              <span className="font-bold" style={{ color: TIER_CONFIG[nextTier.nextTier].color }}> {nextTier.nextTier}</span>
              <span className="text-muted-foreground"> (+{nextTier.apyGain}% APY)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
