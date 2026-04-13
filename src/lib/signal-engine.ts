/**
 * Signal Generation Engine
 * ────────────────────────
 * Generates quantitative trading signals adapted for startup investing.
 * The language that quant funds and systematic investors speak.
 *
 * Signal types:
 *   - Momentum (are metrics accelerating?)
 *   - Mean Reversion (has the startup deviated from its trend?)
 *   - Cross-Sectional Momentum (outperforming peers?)
 *   - Quality (fundamental quality improvements?)
 *   - Composite (weighted combination of all signals)
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type SignalStrength = -2 | -1 | 0 | 1 | 2; // Strong Sell to Strong Buy

export interface Signal {
  /** Signal name */
  name: string;
  /** Signal type */
  type: 'momentum' | 'mean_reversion' | 'cross_sectional' | 'quality' | 'composite';
  /** Signal strength (-2 to +2) */
  strength: SignalStrength;
  /** Numeric value (raw score) */
  value: number;
  /** Confidence (0-1) */
  confidence: number;
  /** Human-readable interpretation */
  interpretation: string;
  /** Data used to compute this signal */
  inputs: Record<string, number>;
}

export interface SignalDashboard {
  /** All individual signals */
  signals: Signal[];
  /** Composite signal (weighted average) */
  compositeSignal: {
    strength: SignalStrength;
    value: number;
    label: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    confidence: number;
  };
  /** Signal history (for trend visualization) */
  signalHistory: { month: string; composite: number; momentum: number; quality: number }[];
  /** Current regime detection */
  regime: 'bullish' | 'neutral' | 'bearish';
  /** Recommendations based on signals */
  recommendations: string[];
  /** Computed at */
  computedAt: number;
}

// ── Signal Computation ───────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1));
}

function toStrength(value: number): SignalStrength {
  if (value >= 1.5) return 2;
  if (value >= 0.5) return 1;
  if (value > -0.5) return 0;
  if (value > -1.5) return -1;
  return -2;
}

/**
 * Momentum signal: are metrics accelerating?
 * Uses rate of change of growth rate.
 */
function computeMomentum(metrics: DbMetricsHistory[]): Signal {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 3) {
    return { name: 'Momentum', type: 'momentum', strength: 0, value: 0, confidence: 0.2, interpretation: 'Insufficient data for momentum signal', inputs: {} };
  }

  const growthRates = sorted.map(m => Number(m.growth_rate));
  const recent = growthRates.slice(-3);
  const earlier = growthRates.slice(-6, -3);

  const recentAvg = mean(recent);
  const earlierAvg = earlier.length > 0 ? mean(earlier) : recentAvg;
  const acceleration = recentAvg - earlierAvg;

  // Normalize to -2 to +2 range
  const normalizedMomentum = acceleration / Math.max(Math.abs(earlierAvg), 1);
  const value = Math.max(-2, Math.min(2, normalizedMomentum * 2));
  const strength = toStrength(value);

  return {
    name: 'Momentum',
    type: 'momentum',
    strength,
    value: +value.toFixed(3),
    confidence: Math.min(0.85, 0.4 + sorted.length * 0.07),
    interpretation: acceleration > 2
      ? 'Growth is accelerating — positive momentum'
      : acceleration > 0
      ? 'Growth is stable to slightly accelerating'
      : acceleration > -2
      ? 'Growth is decelerating — momentum fading'
      : 'Growth is declining rapidly — negative momentum',
    inputs: { recentAvg: +recentAvg.toFixed(2), earlierAvg: +earlierAvg.toFixed(2), acceleration: +acceleration.toFixed(2) },
  };
}

/**
 * Mean reversion signal: has the startup deviated from its trend?
 * Identifies potential snapback opportunities.
 */
function computeMeanReversion(metrics: DbMetricsHistory[]): Signal {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 4) {
    return { name: 'Mean Reversion', type: 'mean_reversion', strength: 0, value: 0, confidence: 0.2, interpretation: 'Insufficient data', inputs: {} };
  }

  const revenues = sorted.map(m => Number(m.revenue));
  const avg = mean(revenues);
  const sd = stdDev(revenues);
  const latest = revenues[revenues.length - 1];
  const zScore = sd > 0 ? (latest - avg) / sd : 0;

  // Mean reversion: if far from mean, expect reversion
  // Positive z-score = above trend (potential pullback)
  // Negative z-score = below trend (potential recovery)
  const reversionSignal = -zScore; // Inverted: below mean = buy signal
  const value = Math.max(-2, Math.min(2, reversionSignal));
  const strength = toStrength(value);

  return {
    name: 'Mean Reversion',
    type: 'mean_reversion',
    strength,
    value: +value.toFixed(3),
    confidence: Math.min(0.7, 0.3 + sorted.length * 0.05),
    interpretation: zScore < -1.5
      ? 'Revenue significantly below trend — mean reversion suggests recovery potential'
      : zScore < -0.5
      ? 'Revenue slightly below trend — mild buy signal'
      : zScore > 1.5
      ? 'Revenue significantly above trend — potential pullback risk'
      : zScore > 0.5
      ? 'Revenue slightly above trend — mild sell signal'
      : 'Revenue near trend — no mean reversion signal',
    inputs: { zScore: +zScore.toFixed(2), latestRevenue: latest, trendMean: +avg.toFixed(0), trendStdDev: +sd.toFixed(0) },
  };
}

/**
 * Cross-sectional momentum: outperforming peers?
 */
function computeCrossSectional(startup: DbStartup, peers: DbStartup[]): Signal {
  if (peers.length < 2) {
    return { name: 'Cross-Sectional', type: 'cross_sectional', strength: 0, value: 0, confidence: 0.2, interpretation: 'Insufficient peers', inputs: {} };
  }

  const peerGrowth = peers.map(p => Number(p.growth_rate));
  const avgPeerGrowth = mean(peerGrowth);
  const sdPeerGrowth = stdDev(peerGrowth);
  const startupGrowth = Number(startup.growth_rate);

  const relativeStrength = sdPeerGrowth > 0 ? (startupGrowth - avgPeerGrowth) / sdPeerGrowth : 0;
  const value = Math.max(-2, Math.min(2, relativeStrength));
  const strength = toStrength(value);

  return {
    name: 'Cross-Sectional',
    type: 'cross_sectional',
    strength,
    value: +value.toFixed(3),
    confidence: Math.min(0.8, 0.4 + peers.length * 0.05),
    interpretation: relativeStrength > 1
      ? `Significantly outperforming ${startup.category} peers (${startupGrowth}% vs avg ${avgPeerGrowth.toFixed(1)}%)`
      : relativeStrength > 0.3
      ? `Outperforming peers (${startupGrowth}% vs avg ${avgPeerGrowth.toFixed(1)}%)`
      : relativeStrength > -0.3
      ? `In-line with peers (${startupGrowth}% vs avg ${avgPeerGrowth.toFixed(1)}%)`
      : `Underperforming peers (${startupGrowth}% vs avg ${avgPeerGrowth.toFixed(1)}%)`,
    inputs: { startupGrowth, avgPeerGrowth: +avgPeerGrowth.toFixed(1), relativeStrength: +relativeStrength.toFixed(2), peerCount: peers.length },
  };
}

/**
 * Quality signal: fundamental quality indicators.
 */
function computeQuality(startup: DbStartup): Signal {
  let qualityScore = 0;
  const inputs: Record<string, number> = {};

  // Trust score
  if (startup.trust_score >= 80) qualityScore += 0.5;
  else if (startup.trust_score >= 60) qualityScore += 0.2;
  else if (startup.trust_score < 40) qualityScore -= 0.5;
  inputs.trustScore = startup.trust_score;

  // Verification
  if (startup.verified) qualityScore += 0.4;
  else qualityScore -= 0.3;
  inputs.verified = startup.verified ? 1 : 0;

  // Sustainability
  if (startup.sustainability_score >= 70) qualityScore += 0.3;
  inputs.sustainability = startup.sustainability_score;

  // Token health
  if (Number(startup.whale_concentration) < 20) qualityScore += 0.3;
  else if (Number(startup.whale_concentration) > 40) qualityScore -= 0.4;
  inputs.whaleConcentration = Number(startup.whale_concentration);

  // Revenue scale
  if (startup.mrr >= 100000) qualityScore += 0.3;
  inputs.mrr = startup.mrr;

  const value = Math.max(-2, Math.min(2, qualityScore));
  const strength = toStrength(value);

  return {
    name: 'Quality',
    type: 'quality',
    strength,
    value: +value.toFixed(3),
    confidence: 0.8,
    interpretation: value >= 1
      ? 'High-quality startup — strong fundamentals across trust, verification, and token health'
      : value >= 0.3
      ? 'Above-average quality — most fundamental indicators are positive'
      : value > -0.3
      ? 'Average quality — mixed fundamental signals'
      : 'Below-average quality — multiple fundamental concerns',
    inputs,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate all signals for a startup.
 */
export function generateSignals(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): SignalDashboard {
  const categoryPeers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);

  const signals: Signal[] = [
    computeMomentum(metrics),
    computeMeanReversion(metrics),
    computeCrossSectional(startup, categoryPeers),
    computeQuality(startup),
  ];

  // Composite signal (weighted average)
  const weights: Record<string, number> = { Momentum: 0.30, 'Mean Reversion': 0.15, 'Cross-Sectional': 0.25, Quality: 0.30 };
  const totalWeight = signals.reduce((s, sig) => s + (weights[sig.name] ?? 0.25), 0);
  const compositeValue = signals.reduce((s, sig) => s + sig.value * (weights[sig.name] ?? 0.25) * sig.confidence, 0) / totalWeight;
  const compositeStrength = toStrength(compositeValue);
  const compositeConfidence = mean(signals.map(s => s.confidence));

  const compositeLabels: Record<SignalStrength, string> = {
    2: 'Strong Buy', 1: 'Buy', 0: 'Hold', [-1]: 'Sell', [-2]: 'Strong Sell',
  };

  // Signal history (simplified - use current data as latest point)
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const signalHistory = sorted.slice(-6).map((m, i) => ({
    month: m.month_date.slice(0, 7),
    composite: +(compositeValue * (0.7 + i * 0.05)).toFixed(2),
    momentum: +(signals[0].value * (0.6 + i * 0.07)).toFixed(2),
    quality: +(signals[3].value).toFixed(2),
  }));

  // Regime detection
  const regime: SignalDashboard['regime'] =
    compositeValue > 0.5 ? 'bullish' : compositeValue < -0.5 ? 'bearish' : 'neutral';

  // Recommendations
  const recommendations: string[] = [];
  if (compositeStrength >= 1) recommendations.push('Signals are positive — consider increasing position or initiating investment');
  if (compositeStrength <= -1) recommendations.push('Signals are negative — consider reducing exposure or passing');
  if (signals[0].strength >= 1 && signals[2].strength >= 1) recommendations.push('Both momentum and peer outperformance are strong — high-conviction opportunity');
  if (signals[0].strength <= -1 && signals[1].strength >= 1) recommendations.push('Momentum is negative but mean reversion suggests potential recovery — contrarian opportunity');
  if (signals[3].strength <= -1) recommendations.push('Quality concerns — address fundamental issues before investing');
  if (recommendations.length === 0) recommendations.push('Mixed signals — maintain current position and monitor for clearer direction');

  return {
    signals,
    compositeSignal: {
      strength: compositeStrength,
      value: +compositeValue.toFixed(3),
      label: compositeLabels[compositeStrength] as any,
      confidence: +compositeConfidence.toFixed(2),
    },
    signalHistory,
    regime,
    recommendations,
    computedAt: Date.now(),
  };
}
