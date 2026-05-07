/**
 * Streaming Rewards Engine
 * ────────────────────────
 * Per-second staking reward calculation and visualization.
 * Simulates continuous reward accrual instead of batch claiming.
 *
 * Users see their rewards tick up in real-time — money flowing per-second.
 * This is the "2050 UX" for staking: viscerally futuristic.
 *
 * Architecture:
 *   - Rewards accrue continuously based on staked amount and tier APY
 *   - Display updates at 60fps using requestAnimationFrame
 *   - Supports multiple reward streams (staking, LP, governance)
 *   - Calculates compound interest for long-term projections
 */

// ── Types ────────────────────────────────────────────────────────────

export type RewardTier = 'Free' | 'Basic' | 'Pro' | 'Whale';

export interface RewardStream {
  /** Stream name */
  name: string;
  /** Source of rewards */
  source: 'staking' | 'lp' | 'governance' | 'referral';
  /** Annual percentage yield */
  apy: number;
  /** Staked/committed amount (CMT) */
  principal: number;
  /** Rewards earned so far */
  earned: number;
  /** Reward rate per second (CMT) */
  ratePerSecond: number;
  /** When this stream started */
  startedAt: number;
  /** Whether actively accruing */
  active: boolean;
}

export interface StreamingRewardsState {
  /** All reward streams */
  streams: RewardStream[];
  /** Total staked across all streams */
  totalStaked: number;
  /** Total rewards earned (all time) */
  totalEarned: number;
  /** Combined reward rate per second */
  totalRatePerSecond: number;
  /** Combined APY (weighted average) */
  weightedApy: number;
  /** Current tier */
  tier: RewardTier;
  /** Projections */
  projections: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  /** Time since first stake */
  stakingDuration: number;
  /** Compound interest effect over 1 year */
  compoundEffect: number;
}

// ── Tier Configuration ───────────────────────────────────────────────

export const TIER_CONFIG: Record<RewardTier, {
  minStake: number;
  apy: number;
  color: string;
  label: string;
  perks: string[];
}> = {
  Free: {
    minStake: 0, apy: 0, color: '#6B7280', label: 'Free',
    perks: ['View-only access'],
  },
  Basic: {
    minStake: 1, apy: 2, color: '#3B82F6', label: 'Basic',
    perks: ['2% APY', 'Publish metrics', 'Vote on proposals'],
  },
  Pro: {
    minStake: 5000, apy: 5, color: '#8B5CF6', label: 'Pro',
    perks: ['5% APY', 'Unlimited metrics', '2x governance weight', 'Pro screener access'],
  },
  Whale: {
    minStake: 50000, apy: 12, color: '#F59E0B', label: 'Whale',
    perks: ['12% APY', '5x governance weight', 'Full data access', 'Priority support', 'Exclusive deal flow'],
  },
};

// ── Reward Calculation ───────────────────────────────────────────────

/**
 * Calculate reward rate per second for a given principal and APY.
 */
export function calculateRatePerSecond(principal: number, apy: number): number {
  if (principal <= 0 || apy <= 0) return 0;
  const yearlyReward = principal * (apy / 100);
  return yearlyReward / (365.25 * 24 * 3600);
}

/**
 * Calculate rewards earned since a given start time.
 */
export function calculateEarned(principal: number, apy: number, startTime: number, now: number = Date.now()): number {
  const elapsedSeconds = (now - startTime) / 1000;
  const rate = calculateRatePerSecond(principal, apy);
  return rate * elapsedSeconds;
}

/**
 * Calculate compound interest for projections.
 * Uses continuous compounding: A = P * e^(r*t)
 */
export function compoundProjection(principal: number, apy: number, years: number): number {
  return principal * Math.exp((apy / 100) * years);
}

/**
 * Determine tier based on staked amount.
 */
export function determineTier(stakedAmount: number): RewardTier {
  if (stakedAmount >= 50000) return 'Whale';
  if (stakedAmount >= 5000) return 'Pro';
  if (stakedAmount > 0) return 'Basic';
  return 'Free';
}

/**
 * Calculate how much more needs to be staked to reach the next tier.
 */
export function nextTierInfo(currentStake: number): { nextTier: RewardTier; amountNeeded: number; apyGain: number } | null {
  const currentTier = determineTier(currentStake);
  const tiers: RewardTier[] = ['Free', 'Basic', 'Pro', 'Whale'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex >= tiers.length - 1) return null;

  const nextTier = tiers[currentIndex + 1];
  const nextConfig = TIER_CONFIG[nextTier];
  const currentConfig = TIER_CONFIG[currentTier];

  return {
    nextTier,
    amountNeeded: Math.max(0, nextConfig.minStake - currentStake),
    apyGain: nextConfig.apy - currentConfig.apy,
  };
}

// ── Streaming State ──────────────────────────────────────────────────

/**
 * Create the initial streaming rewards state from staking data.
 */
export function createStreamingState(
  stakedAmount: number,
  stakingStartTime: number,
): StreamingRewardsState {
  const tier = determineTier(stakedAmount);
  const config = TIER_CONFIG[tier];
  const apy = config.apy;
  const ratePerSecond = calculateRatePerSecond(stakedAmount, apy);

  const streams: RewardStream[] = [];

  // Primary staking stream
  if (stakedAmount > 0) {
    const earned = calculateEarned(stakedAmount, apy, stakingStartTime);
    streams.push({
      name: 'CMT Staking',
      source: 'staking',
      apy,
      principal: stakedAmount,
      earned,
      ratePerSecond,
      startedAt: stakingStartTime,
      active: true,
    });

    // Governance participation bonus (small)
    if (tier === 'Pro' || tier === 'Whale') {
      const govApy = 0.5;
      const govRate = calculateRatePerSecond(stakedAmount, govApy);
      streams.push({
        name: 'Governance Bonus',
        source: 'governance',
        apy: govApy,
        principal: stakedAmount,
        earned: calculateEarned(stakedAmount, govApy, stakingStartTime),
        ratePerSecond: govRate,
        startedAt: stakingStartTime,
        active: true,
      });
    }
  }

  const totalRatePerSecond = streams.reduce((s, st) => s + st.ratePerSecond, 0);
  const totalEarned = streams.reduce((s, st) => s + st.earned, 0);
  const weightedApy = stakedAmount > 0
    ? streams.reduce((s, st) => s + st.apy * st.principal, 0) / stakedAmount
    : 0;

  const now = Date.now();
  const stakingDuration = now - stakingStartTime;
  const yearlyProjection = totalRatePerSecond * 365.25 * 24 * 3600;
  const compoundEffect = stakedAmount > 0
    ? (compoundProjection(stakedAmount, weightedApy, 1) - stakedAmount) / stakedAmount * 100
    : 0;

  return {
    streams,
    totalStaked: stakedAmount,
    totalEarned,
    totalRatePerSecond,
    weightedApy,
    tier,
    projections: {
      daily: totalRatePerSecond * 86400,
      weekly: totalRatePerSecond * 604800,
      monthly: totalRatePerSecond * 2592000,
      yearly: yearlyProjection,
    },
    stakingDuration,
    compoundEffect,
  };
}

/**
 * Update the state with current timestamp (call from requestAnimationFrame).
 */
export function tickRewards(state: StreamingRewardsState): StreamingRewardsState {
  const now = Date.now();
  const updatedStreams = state.streams.map(stream => {
    if (!stream.active) return stream;
    return {
      ...stream,
      earned: calculateEarned(stream.principal, stream.apy, stream.startedAt, now),
    };
  });

  return {
    ...state,
    streams: updatedStreams,
    totalEarned: updatedStreams.reduce((s, st) => s + st.earned, 0),
    stakingDuration: now - (state.streams[0]?.startedAt ?? now),
  };
}

/**
 * Format CMT amount with appropriate precision.
 */
export function formatCMT(amount: number, decimals: number = 6): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M CMT`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(2)}K CMT`;
  if (amount >= 1) return `${amount.toFixed(decimals > 4 ? 4 : decimals)} CMT`;
  if (amount >= 0.0001) return `${amount.toFixed(6)} CMT`;
  return `${amount.toExponential(2)} CMT`;
}

/**
 * Format duration in human-readable form.
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
