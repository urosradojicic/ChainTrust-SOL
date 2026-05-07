/**
 * Market Timing Engine
 * ────────────────────
 * Analyzes cross-startup data to detect market regimes
 * and suggest optimal investment timing.
 *
 * Signals:
 *   - Aggregate growth trends across all startups
 *   - Category momentum (which sectors are accelerating)
 *   - Funding environment (are startups raising easily?)
 *   - Risk appetite (verified startups vs unverified ratio)
 *   - Ecosystem health (new registrations, verification rate)
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type MarketRegime = 'bull' | 'growth' | 'neutral' | 'cautious' | 'bear';
export type TimingSignal = 'strong_buy' | 'buy' | 'hold' | 'reduce' | 'sell';

export interface MarketIndicator {
  name: string;
  value: number;
  trend: 'up' | 'flat' | 'down';
  signal: 'bullish' | 'neutral' | 'bearish';
  detail: string;
  weight: number;
}

export interface CategoryMomentum {
  category: string;
  startupCount: number;
  avgGrowth: number;
  avgTrustScore: number;
  totalMrr: number;
  momentum: 'accelerating' | 'stable' | 'decelerating';
  signal: 'hot' | 'warm' | 'neutral' | 'cooling';
}

export interface MarketTimingReport {
  /** Current market regime */
  regime: MarketRegime;
  /** Investment timing signal */
  timingSignal: TimingSignal;
  /** Confidence in the assessment (0-1) */
  confidence: number;
  /** Market health score (0-100) */
  healthScore: number;
  /** All indicators */
  indicators: MarketIndicator[];
  /** Category momentum */
  categoryMomentum: CategoryMomentum[];
  /** Strategic recommendations */
  recommendations: string[];
  /** Sectors to watch */
  hotSectors: string[];
  /** Sectors to avoid */
  coldSectors: string[];
  /** Computed at */
  computedAt: number;
}

// ── Indicator Computation ────────────────────────────────────────────

function computeAggregateGrowth(startups: DbStartup[]): MarketIndicator {
  const growthRates = startups.map(s => Number(s.growth_rate));
  const avg = growthRates.reduce((s, g) => s + g, 0) / growthRates.length;
  const positive = growthRates.filter(g => g > 0).length;
  const positivePct = (positive / growthRates.length) * 100;

  return {
    name: 'Aggregate Growth',
    value: +avg.toFixed(1),
    trend: avg > 15 ? 'up' : avg > 5 ? 'flat' : 'down',
    signal: avg > 15 ? 'bullish' : avg > 5 ? 'neutral' : 'bearish',
    detail: `Average growth: ${avg.toFixed(1)}% MoM, ${positivePct.toFixed(0)}% of startups growing`,
    weight: 3,
  };
}

function computeVerificationRate(startups: DbStartup[]): MarketIndicator {
  const verified = startups.filter(s => s.verified).length;
  const rate = (verified / startups.length) * 100;

  return {
    name: 'Verification Rate',
    value: +rate.toFixed(0),
    trend: rate > 60 ? 'up' : rate > 40 ? 'flat' : 'down',
    signal: rate > 60 ? 'bullish' : rate > 30 ? 'neutral' : 'bearish',
    detail: `${verified}/${startups.length} startups (${rate.toFixed(0)}%) are on-chain verified`,
    weight: 2,
  };
}

function computeTrustEnvironment(startups: DbStartup[]): MarketIndicator {
  const avgTrust = startups.reduce((s, st) => s + st.trust_score, 0) / startups.length;
  const highTrust = startups.filter(s => s.trust_score >= 70).length;
  const highTrustPct = (highTrust / startups.length) * 100;

  return {
    name: 'Trust Environment',
    value: +avgTrust.toFixed(0),
    trend: avgTrust > 70 ? 'up' : avgTrust > 50 ? 'flat' : 'down',
    signal: avgTrust > 70 ? 'bullish' : avgTrust > 50 ? 'neutral' : 'bearish',
    detail: `Average trust score: ${avgTrust.toFixed(0)}/100, ${highTrustPct.toFixed(0)}% above 70`,
    weight: 2,
  };
}

function computeRevenueHealth(startups: DbStartup[]): MarketIndicator {
  const totalMrr = startups.reduce((s, st) => s + st.mrr, 0);
  const avgMrr = totalMrr / startups.length;
  const profitable = startups.filter(s => s.mrr > 50000).length;

  return {
    name: 'Revenue Health',
    value: Math.round(avgMrr / 1000),
    trend: avgMrr > 100000 ? 'up' : avgMrr > 50000 ? 'flat' : 'down',
    signal: avgMrr > 80000 ? 'bullish' : avgMrr > 40000 ? 'neutral' : 'bearish',
    detail: `Avg MRR: $${(avgMrr / 1000).toFixed(0)}K, ${profitable} startups above $50K MRR`,
    weight: 2.5,
  };
}

function computeSustainabilityTrend(startups: DbStartup[]): MarketIndicator {
  const avgSus = startups.reduce((s, st) => s + st.sustainability_score, 0) / startups.length;

  return {
    name: 'ESG Trend',
    value: +avgSus.toFixed(0),
    trend: avgSus > 70 ? 'up' : avgSus > 50 ? 'flat' : 'down',
    signal: avgSus > 65 ? 'bullish' : avgSus > 45 ? 'neutral' : 'bearish',
    detail: `Average sustainability: ${avgSus.toFixed(0)}/100`,
    weight: 1,
  };
}

function computeTokenHealth(startups: DbStartup[]): MarketIndicator {
  const avgWhale = startups.reduce((s, st) => s + Number(st.whale_concentration), 0) / startups.length;
  const avgInflation = startups.reduce((s, st) => s + Number(st.inflation_rate), 0) / startups.length;
  const healthScore = Math.max(0, 100 - avgWhale - avgInflation * 3);

  return {
    name: 'Token Ecosystem Health',
    value: +healthScore.toFixed(0),
    trend: healthScore > 60 ? 'up' : healthScore > 40 ? 'flat' : 'down',
    signal: healthScore > 60 ? 'bullish' : healthScore > 35 ? 'neutral' : 'bearish',
    detail: `Avg whale: ${avgWhale.toFixed(0)}%, avg inflation: ${avgInflation.toFixed(1)}%`,
    weight: 1.5,
  };
}

function computeEcosystemDiversity(startups: DbStartup[]): MarketIndicator {
  const categories = new Set(startups.map(s => s.category));
  const diversityScore = Math.min(100, categories.size * 15);

  return {
    name: 'Ecosystem Diversity',
    value: categories.size,
    trend: categories.size >= 6 ? 'up' : categories.size >= 4 ? 'flat' : 'down',
    signal: categories.size >= 5 ? 'bullish' : categories.size >= 3 ? 'neutral' : 'bearish',
    detail: `${categories.size} active categories: ${Array.from(categories).join(', ')}`,
    weight: 1,
  };
}

// ── Category Momentum ────────────────────────────────────────────────

function computeCategoryMomentum(startups: DbStartup[]): CategoryMomentum[] {
  const categories = new Map<string, DbStartup[]>();
  for (const s of startups) {
    const list = categories.get(s.category) ?? [];
    list.push(s);
    categories.set(s.category, list);
  }

  return Array.from(categories.entries()).map(([category, catStartups]) => {
    const avgGrowth = catStartups.reduce((s, st) => s + Number(st.growth_rate), 0) / catStartups.length;
    const avgTrustScore = catStartups.reduce((s, st) => s + st.trust_score, 0) / catStartups.length;
    const totalMrr = catStartups.reduce((s, st) => s + st.mrr, 0);

    const momentum: CategoryMomentum['momentum'] = avgGrowth > 20 ? 'accelerating' : avgGrowth > 5 ? 'stable' : 'decelerating';
    const signal: CategoryMomentum['signal'] = avgGrowth > 25 ? 'hot' : avgGrowth > 15 ? 'warm' : avgGrowth > 5 ? 'neutral' : 'cooling';

    return { category, startupCount: catStartups.length, avgGrowth: +avgGrowth.toFixed(1), avgTrustScore: +avgTrustScore.toFixed(0), totalMrr, momentum, signal };
  }).sort((a, b) => b.avgGrowth - a.avgGrowth);
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate market timing analysis from platform-wide data.
 */
export function analyzeMarketTiming(startups: DbStartup[]): MarketTimingReport {
  if (startups.length === 0) {
    return {
      regime: 'neutral', timingSignal: 'hold', confidence: 0, healthScore: 50,
      indicators: [], categoryMomentum: [], recommendations: ['Insufficient data'],
      hotSectors: [], coldSectors: [], computedAt: Date.now(),
    };
  }

  const indicators: MarketIndicator[] = [
    computeAggregateGrowth(startups),
    computeRevenueHealth(startups),
    computeVerificationRate(startups),
    computeTrustEnvironment(startups),
    computeTokenHealth(startups),
    computeSustainabilityTrend(startups),
    computeEcosystemDiversity(startups),
  ];

  // Compute weighted health score
  const totalWeight = indicators.reduce((s, i) => s + i.weight, 0);
  const bullishWeight = indicators.filter(i => i.signal === 'bullish').reduce((s, i) => s + i.weight, 0);
  const bearishWeight = indicators.filter(i => i.signal === 'bearish').reduce((s, i) => s + i.weight, 0);
  const healthScore = Math.round((bullishWeight / totalWeight) * 100);

  // Determine regime
  const regime: MarketRegime =
    healthScore >= 80 ? 'bull' :
    healthScore >= 60 ? 'growth' :
    healthScore >= 40 ? 'neutral' :
    healthScore >= 20 ? 'cautious' :
    'bear';

  // Timing signal
  const timingSignal: TimingSignal =
    healthScore >= 75 ? 'strong_buy' :
    healthScore >= 55 ? 'buy' :
    healthScore >= 35 ? 'hold' :
    healthScore >= 15 ? 'reduce' :
    'sell';

  const confidence = Math.min(0.95, 0.3 + startups.length * 0.08);

  // Category momentum
  const categoryMomentum = computeCategoryMomentum(startups);
  const hotSectors = categoryMomentum.filter(c => c.signal === 'hot' || c.signal === 'warm').map(c => c.category);
  const coldSectors = categoryMomentum.filter(c => c.signal === 'cooling').map(c => c.category);

  // Recommendations
  const recommendations: string[] = [];
  if (regime === 'bull' || regime === 'growth') {
    recommendations.push('Market conditions are favorable — deploy capital actively');
    recommendations.push('Focus on high-growth startups in hot sectors');
    if (hotSectors.length > 0) recommendations.push(`Hot sectors: ${hotSectors.join(', ')}`);
  } else if (regime === 'neutral') {
    recommendations.push('Mixed signals — be selective and focus on quality');
    recommendations.push('Prioritize verified startups with strong unit economics');
  } else {
    recommendations.push('Market headwinds detected — focus on capital preservation');
    recommendations.push('Prefer startups with long runway and proven revenue');
    recommendations.push('Increase DD depth — scrutinize every investment');
  }

  return {
    regime, timingSignal, confidence, healthScore,
    indicators, categoryMomentum, recommendations,
    hotSectors, coldSectors, computedAt: Date.now(),
  };
}
