/**
 * Startup Survival Predictor
 * ──────────────────────────
 * Estimates probabilities for key startup outcomes using historical
 * metrics patterns and heuristic scoring models.
 *
 * Predictions:
 *   - Probability of raising next round (12 months)
 *   - Probability of 10x return
 *   - Probability of survival (still operating in 12/24 months)
 *   - Expected time to next funding round
 *   - Risk-adjusted return score
 *
 * Based on industry benchmarks and pattern matching.
 * Zero API calls. Pure heuristics.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface PredictionBadge {
  /** Badge label */
  label: string;
  /** Probability (0-1) */
  probability: number;
  /** Confidence in this prediction (0-1) */
  confidence: number;
  /** Color coding */
  color: 'green' | 'blue' | 'amber' | 'red' | 'purple';
  /** Short explanation */
  reason: string;
}

export interface SurvivalPrediction {
  /** Probability of raising next funding round within 12 months */
  nextRoundProbability: PredictionBadge;
  /** Probability of achieving 10x return for investors */
  tenXProbability: PredictionBadge;
  /** Probability of still operating in 12 months */
  survival12m: PredictionBadge;
  /** Probability of still operating in 24 months */
  survival24m: PredictionBadge;
  /** Overall investability score (0-100) */
  investabilityScore: number;
  /** Stage classification */
  stage: 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B+' | 'Growth';
  /** Key factors driving the prediction */
  keyFactors: { factor: string; impact: 'positive' | 'negative' | 'neutral'; weight: number }[];
  /** Computed at */
  computedAt: number;
}

// ── Stage Classification ─────────────────────────────────────────────

function classifyStage(startup: DbStartup): SurvivalPrediction['stage'] {
  const mrr = startup.mrr;
  const team = startup.team_size;
  if (mrr >= 500000 && team >= 50) return 'Growth';
  if (mrr >= 100000 && team >= 20) return 'Series B+';
  if (mrr >= 30000 && team >= 8) return 'Series A';
  if (mrr >= 5000) return 'Seed';
  return 'Pre-Seed';
}

// ── Factor Scoring ───────────────────────────────────────────────────

interface FactorScore {
  name: string;
  score: number;      // -1 to +1
  weight: number;     // importance multiplier
  impact: 'positive' | 'negative' | 'neutral';
}

function scoreFactors(startup: DbStartup, metrics: DbMetricsHistory[]): FactorScore[] {
  const factors: FactorScore[] = [];
  const growth = Number(startup.growth_rate);
  const mrr = startup.mrr;
  const whale = Number(startup.whale_concentration);
  const team = startup.team_size;

  // Growth rate factor (most predictive)
  const growthScore = growth >= 30 ? 1 : growth >= 20 ? 0.7 : growth >= 10 ? 0.4 :
    growth >= 5 ? 0.1 : growth > 0 ? -0.2 : -0.8;
  factors.push({
    name: 'Growth momentum',
    score: growthScore,
    weight: 3,
    impact: growthScore > 0.2 ? 'positive' : growthScore < -0.2 ? 'negative' : 'neutral',
  });

  // Revenue scale factor
  const revenueScore = mrr >= 200000 ? 0.9 : mrr >= 100000 ? 0.6 : mrr >= 50000 ? 0.3 :
    mrr >= 20000 ? 0 : mrr > 0 ? -0.3 : -0.8;
  factors.push({
    name: 'Revenue scale',
    score: revenueScore,
    weight: 2.5,
    impact: revenueScore > 0.2 ? 'positive' : revenueScore < -0.2 ? 'negative' : 'neutral',
  });

  // Growth trend factor (accelerating vs decelerating)
  if (metrics.length >= 3) {
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const recentGrowth = sorted.slice(-3).map(m => Number(m.growth_rate));
    const trendDirection = recentGrowth[2] - recentGrowth[0];
    const trendScore = trendDirection > 3 ? 0.8 : trendDirection > 0 ? 0.3 :
      trendDirection > -3 ? -0.2 : -0.7;
    factors.push({
      name: 'Growth trajectory',
      score: trendScore,
      weight: 2,
      impact: trendScore > 0.2 ? 'positive' : trendScore < -0.2 ? 'negative' : 'neutral',
    });
  }

  // Runway factor
  if (metrics.length >= 2) {
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const lastRev = Number(sorted[sorted.length - 1].revenue);
    const lastCost = Number(sorted[sorted.length - 1].costs);
    const burn = Math.max(lastCost - lastRev, 0);
    const runway = burn > 0 ? startup.treasury / burn : 999;
    const runwayScore = runway >= 999 ? 1 : runway >= 24 ? 0.8 : runway >= 18 ? 0.5 :
      runway >= 12 ? 0.1 : runway >= 6 ? -0.4 : -0.9;
    factors.push({
      name: 'Runway strength',
      score: runwayScore,
      weight: 2,
      impact: runwayScore > 0.2 ? 'positive' : runwayScore < -0.2 ? 'negative' : 'neutral',
    });
  }

  // Verification factor
  factors.push({
    name: 'On-chain verification',
    score: startup.verified ? 0.6 : -0.4,
    weight: 1.5,
    impact: startup.verified ? 'positive' : 'negative',
  });

  // Trust score factor
  const trustScore = startup.trust_score >= 80 ? 0.7 : startup.trust_score >= 60 ? 0.3 :
    startup.trust_score >= 40 ? -0.1 : -0.6;
  factors.push({
    name: 'Trust score',
    score: trustScore,
    weight: 1.5,
    impact: trustScore > 0.2 ? 'positive' : trustScore < -0.2 ? 'negative' : 'neutral',
  });

  // Token health factor
  const tokenScore = whale < 15 ? 0.6 : whale < 30 ? 0.2 : whale < 50 ? -0.3 : -0.8;
  factors.push({
    name: 'Token distribution',
    score: tokenScore,
    weight: 1,
    impact: tokenScore > 0.2 ? 'positive' : tokenScore < -0.2 ? 'negative' : 'neutral',
  });

  // Team size factor
  const teamScore = team >= 15 ? 0.5 : team >= 8 ? 0.3 : team >= 3 ? 0 : -0.4;
  factors.push({
    name: 'Team maturity',
    score: teamScore,
    weight: 1,
    impact: teamScore > 0.2 ? 'positive' : teamScore < -0.2 ? 'negative' : 'neutral',
  });

  // Sustainability factor
  const susScore = startup.sustainability_score >= 70 ? 0.4 : startup.sustainability_score >= 40 ? 0.1 : -0.2;
  factors.push({
    name: 'ESG profile',
    score: susScore,
    weight: 0.5,
    impact: susScore > 0.2 ? 'positive' : susScore < -0.2 ? 'negative' : 'neutral',
  });

  // Reporting consistency
  const reportingScore = metrics.length >= 6 ? 0.5 : metrics.length >= 4 ? 0.2 :
    metrics.length >= 2 ? 0 : -0.3;
  factors.push({
    name: 'Reporting history',
    score: reportingScore,
    weight: 0.8,
    impact: reportingScore > 0.2 ? 'positive' : reportingScore < -0.2 ? 'negative' : 'neutral',
  });

  return factors;
}

// ── Probability Calculation ──────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function factorsToBaseProb(factors: FactorScore[]): number {
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0);
  const normalized = weightedSum / totalWeight; // -1 to +1
  return sigmoid(normalized * 3); // Map to 0-1 via sigmoid with scaling
}

function badgeColor(prob: number): PredictionBadge['color'] {
  if (prob >= 0.7) return 'green';
  if (prob >= 0.5) return 'blue';
  if (prob >= 0.3) return 'amber';
  return 'red';
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate survival and success predictions for a startup.
 */
export function predictSurvival(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): SurvivalPrediction {
  const stage = classifyStage(startup);
  const factors = scoreFactors(startup, metrics);
  const baseProb = factorsToBaseProb(factors);
  const confidence = Math.min(0.95, 0.4 + metrics.length * 0.08);

  // Next round probability (adjusted by stage)
  const stageMultiplier: Record<string, number> = {
    'Pre-Seed': 0.8, 'Seed': 1.0, 'Series A': 1.1, 'Series B+': 0.9, 'Growth': 0.7,
  };
  const nextRoundProb = Math.min(0.95, baseProb * (stageMultiplier[stage] ?? 1));
  const growth = Number(startup.growth_rate);

  const nextRoundProbability: PredictionBadge = {
    label: 'Next Round (12mo)',
    probability: nextRoundProb,
    confidence,
    color: badgeColor(nextRoundProb),
    reason: growth >= 20
      ? `Strong ${growth}% growth makes this startup attractive to investors`
      : growth >= 10
      ? `Moderate ${growth}% growth — fundable with strong metrics`
      : `${growth}% growth is below typical Series A threshold of 15%+`,
  };

  // 10x return probability (much harder)
  const tenXProb = Math.min(0.85, Math.pow(baseProb, 1.5) * 0.8);
  const tenXProbability: PredictionBadge = {
    label: '10x Return',
    probability: tenXProb,
    confidence: confidence * 0.7, // Lower confidence for long-term predictions
    color: badgeColor(tenXProb),
    reason: tenXProb >= 0.5
      ? 'Strong growth, healthy metrics, and solid fundamentals support 10x potential'
      : tenXProb >= 0.3
      ? 'Moderate potential — needs sustained execution to achieve 10x'
      : 'Below average 10x potential based on current metrics trajectory',
  };

  // 12-month survival
  const survival12mProb = Math.min(0.98, baseProb * 1.2);
  const survival12m: PredictionBadge = {
    label: 'Survival (12mo)',
    probability: survival12mProb,
    confidence,
    color: badgeColor(survival12mProb),
    reason: survival12mProb >= 0.8
      ? 'Healthy runway and revenue trajectory support continued operations'
      : survival12mProb >= 0.5
      ? 'Moderate survival probability — runway or growth concerns exist'
      : 'High risk of shutdown — critical runway or revenue issues',
  };

  // 24-month survival (harder)
  const survival24mProb = Math.min(0.95, baseProb * 1.05);
  const survival24m: PredictionBadge = {
    label: 'Survival (24mo)',
    probability: survival24mProb,
    confidence: confidence * 0.8,
    color: badgeColor(survival24mProb),
    reason: survival24mProb >= 0.7
      ? 'Strong fundamentals suggest durability over 2 years'
      : 'Extended survival depends on securing additional funding or reaching profitability',
  };

  // Investability score (0-100)
  const investabilityScore = Math.round(baseProb * 100);

  // Key factors (top 5 by absolute weighted impact)
  const keyFactors = factors
    .map(f => ({ factor: f.name, impact: f.impact, weight: Math.abs(f.score * f.weight) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  return {
    nextRoundProbability,
    tenXProbability,
    survival12m,
    survival24m,
    investabilityScore,
    stage,
    keyFactors,
    computedAt: Date.now(),
  };
}
