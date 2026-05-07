/**
 * Revenue Quality Scorer
 * ──────────────────────
 * Not all revenue is created equal. This engine decomposes revenue quality
 * across multiple dimensions to give investors a clear picture of
 * revenue durability, predictability, and growth potential.
 *
 * Dimensions:
 *   1. Recurring vs One-Time — is revenue predictable?
 *   2. Concentration — how dependent on few customers?
 *   3. Growth Quality — organic vs paid acquisition?
 *   4. Retention-Driven — expansion vs new customer revenue?
 *   5. Consistency — how volatile is revenue month-to-month?
 *   6. Margin Quality — revenue vs costs trajectory
 *   7. Verification Level — is this on-chain verified?
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface RevenueQualityDimension {
  name: string;
  score: number; // 0-100
  weight: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  detail: string;
  metric: string;
}

export interface RevenueQualityReport {
  /** Overall quality score (0-100) */
  overallScore: number;
  /** Quality grade */
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
  /** Quality tier */
  tier: 'Institutional' | 'Investment' | 'Speculative' | 'Distressed';
  /** All dimensions */
  dimensions: RevenueQualityDimension[];
  /** Revenue multiple suggestion based on quality */
  suggestedMultiple: { low: number; mid: number; high: number };
  /** Revenue type breakdown (estimated) */
  revenueBreakdown: {
    recurring: number;
    transactional: number;
    oneTime: number;
  };
  /** Key insights */
  insights: string[];
  /** Improvement opportunities */
  improvements: string[];
  /** Computed at */
  computedAt: number;
}

// ── Scoring Functions ────────────────────────────────────────────────

function letterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

function scoreRecurring(startup: DbStartup, metrics: DbMetricsHistory[]): RevenueQualityDimension {
  // Estimate recurring % based on revenue stability
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 3) {
    return { name: 'Revenue Recurrence', score: 50, weight: 3, grade: 'C', detail: 'Insufficient data to assess recurrence', metric: 'N/A' };
  }

  const revenues = sorted.map(m => Number(m.revenue));
  const momChanges = revenues.slice(1).map((r, i) => Math.abs(r - revenues[i]) / Math.max(revenues[i], 1));
  const avgVolatility = momChanges.reduce((s, c) => s + c, 0) / momChanges.length;

  // Low volatility = high recurrence
  const recurringPct = Math.max(0, Math.min(100, 100 - avgVolatility * 200));
  const score = Math.round(recurringPct);

  return {
    name: 'Revenue Recurrence',
    score,
    weight: 3,
    grade: letterGrade(score),
    detail: `Estimated ${recurringPct.toFixed(0)}% recurring (based on ${(avgVolatility * 100).toFixed(1)}% MoM volatility)`,
    metric: `${recurringPct.toFixed(0)}% recurring`,
  };
}

function scoreConcentration(startup: DbStartup): RevenueQualityDimension {
  // Use whale_concentration as proxy for customer concentration
  const concentration = Number(startup.whale_concentration);
  const score = Math.max(0, 100 - concentration * 1.5);

  return {
    name: 'Customer Concentration',
    score: Math.round(score),
    weight: 2,
    grade: letterGrade(score),
    detail: concentration < 15
      ? 'Well-diversified customer base — low single-customer dependency'
      : concentration < 30
      ? 'Moderate concentration — some customer dependency risk'
      : `High concentration (${concentration}%) — significant single-customer risk`,
    metric: `${concentration}% concentration`,
  };
}

function scoreGrowthQuality(startup: DbStartup, metrics: DbMetricsHistory[]): RevenueQualityDimension {
  const growth = Number(startup.growth_rate);
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));

  // High growth with high trust = organic growth
  // High growth with low trust = possibly bought growth
  const qualitySignal = startup.trust_score * 0.6 + (growth > 0 ? 40 : 0);
  const score = Math.min(100, Math.round(qualitySignal));

  const isOrganic = startup.trust_score >= 70 && growth >= 10;

  return {
    name: 'Growth Quality',
    score,
    weight: 2.5,
    grade: letterGrade(score),
    detail: isOrganic
      ? `${growth}% growth appears organic (high trust score ${startup.trust_score})`
      : growth > 0
      ? `${growth}% growth — quality uncertain (trust score ${startup.trust_score})`
      : 'No growth — revenue is flat or declining',
    metric: isOrganic ? 'Organic' : 'Mixed',
  };
}

function scoreRetentionDriven(metrics: DbMetricsHistory[]): RevenueQualityDimension {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 3) {
    return { name: 'Retention Quality', score: 50, weight: 2, grade: 'C', detail: 'Insufficient data', metric: 'N/A' };
  }

  // Compare MAU retention vs revenue growth
  const mauGrowth = sorted.length >= 2
    ? (Number(sorted[sorted.length - 1].mau) - Number(sorted[sorted.length - 2].mau)) / Math.max(Number(sorted[sorted.length - 2].mau), 1)
    : 0;
  const revGrowth = sorted.length >= 2
    ? (Number(sorted[sorted.length - 1].revenue) - Number(sorted[sorted.length - 2].revenue)) / Math.max(Number(sorted[sorted.length - 2].revenue), 1)
    : 0;

  // If revenue grows faster than users, it's expansion revenue (good)
  const expansionSignal = revGrowth > mauGrowth ? 'expansion' : 'new_customer';
  const score = revGrowth > mauGrowth && revGrowth > 0 ? 85 : revGrowth > 0 ? 60 : 30;

  return {
    name: 'Retention Quality',
    score,
    weight: 2,
    grade: letterGrade(score),
    detail: expansionSignal === 'expansion'
      ? 'Revenue growth exceeds user growth — expansion revenue from existing customers'
      : 'Revenue growth tracks user growth — primarily new customer driven',
    metric: expansionSignal === 'expansion' ? 'Expansion' : 'New Customer',
  };
}

function scoreConsistency(metrics: DbMetricsHistory[]): RevenueQualityDimension {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 3) {
    return { name: 'Revenue Consistency', score: 50, weight: 1.5, grade: 'C', detail: 'Insufficient data', metric: 'N/A' };
  }

  const revenues = sorted.map(m => Number(m.revenue));
  const avg = revenues.reduce((s, r) => s + r, 0) / revenues.length;
  const cv = avg > 0 ? (Math.sqrt(revenues.reduce((s, r) => s + (r - avg) ** 2, 0) / revenues.length) / avg) * 100 : 100;

  const score = Math.max(0, Math.min(100, 100 - cv * 2));

  return {
    name: 'Revenue Consistency',
    score: Math.round(score),
    weight: 1.5,
    grade: letterGrade(score),
    detail: cv < 10
      ? `Highly consistent (CV: ${cv.toFixed(1)}%) — predictable revenue stream`
      : cv < 25
      ? `Moderately consistent (CV: ${cv.toFixed(1)}%)`
      : `Volatile revenue (CV: ${cv.toFixed(1)}%) — hard to predict`,
    metric: `${cv.toFixed(1)}% CV`,
  };
}

function scoreMarginQuality(startup: DbStartup, metrics: DbMetricsHistory[]): RevenueQualityDimension {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 2) {
    return { name: 'Margin Quality', score: 50, weight: 2, grade: 'C', detail: 'Insufficient data', metric: 'N/A' };
  }

  const lastRev = Number(sorted[sorted.length - 1].revenue);
  const lastCost = Number(sorted[sorted.length - 1].costs);
  const margin = lastRev > 0 ? ((lastRev - lastCost) / lastRev) * 100 : -100;

  // Margin trend
  let marginTrend = 'stable';
  if (sorted.length >= 3) {
    const margins = sorted.map(m => {
      const rev = Number(m.revenue);
      const cost = Number(m.costs);
      return rev > 0 ? ((rev - cost) / rev) * 100 : -100;
    });
    const recent = margins.slice(-2);
    if (recent[1] > recent[0] + 2) marginTrend = 'improving';
    else if (recent[1] < recent[0] - 2) marginTrend = 'declining';
  }

  const score = margin >= 50 ? 90 : margin >= 30 ? 75 : margin >= 10 ? 55 : margin >= 0 ? 35 : 15;

  return {
    name: 'Margin Quality',
    score,
    weight: 2,
    grade: letterGrade(score),
    detail: `${margin.toFixed(1)}% margin (${marginTrend}) — ${margin >= 30 ? 'healthy' : margin >= 0 ? 'breakeven' : 'burning cash'}`,
    metric: `${margin.toFixed(1)}% (${marginTrend})`,
  };
}

function scoreVerification(startup: DbStartup): RevenueQualityDimension {
  const score = startup.verified ? 95 : 25;
  return {
    name: 'Verification Level',
    score,
    weight: 2,
    grade: letterGrade(score),
    detail: startup.verified
      ? 'Revenue data is on-chain verified via ChainTrust — highest data integrity'
      : 'Revenue is self-reported — no independent verification',
    metric: startup.verified ? 'On-chain verified' : 'Self-reported',
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate complete revenue quality report.
 */
export function analyzeRevenueQuality(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): RevenueQualityReport {
  const dimensions: RevenueQualityDimension[] = [
    scoreRecurring(startup, metrics),
    scoreConcentration(startup),
    scoreGrowthQuality(startup, metrics),
    scoreRetentionDriven(metrics),
    scoreConsistency(metrics),
    scoreMarginQuality(startup, metrics),
    scoreVerification(startup),
  ];

  // Weighted average
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const overallScore = Math.round(
    dimensions.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight
  );

  const grade = overallScore >= 90 ? 'AAA' : overallScore >= 80 ? 'AA' : overallScore >= 70 ? 'A' :
    overallScore >= 60 ? 'BBB' : overallScore >= 50 ? 'BB' : overallScore >= 40 ? 'B' :
    overallScore >= 25 ? 'CCC' : 'D';

  const tier = overallScore >= 80 ? 'Institutional' : overallScore >= 60 ? 'Investment' :
    overallScore >= 40 ? 'Speculative' : 'Distressed';

  // Revenue multiple suggestion
  const baseMultiple = overallScore >= 80 ? 30 : overallScore >= 60 ? 15 : overallScore >= 40 ? 8 : 4;
  const growthMultiplier = Number(startup.growth_rate) >= 30 ? 1.5 : Number(startup.growth_rate) >= 15 ? 1.2 : 1;
  const suggestedMultiple = {
    low: Math.round(baseMultiple * 0.7 * growthMultiplier),
    mid: Math.round(baseMultiple * growthMultiplier),
    high: Math.round(baseMultiple * 1.4 * growthMultiplier),
  };

  // Revenue breakdown (estimated)
  const recurringScore = dimensions.find(d => d.name === 'Revenue Recurrence')?.score ?? 50;
  const revenueBreakdown = {
    recurring: Math.round(recurringScore * 0.8),
    transactional: Math.round((100 - recurringScore) * 0.6),
    oneTime: Math.round((100 - recurringScore) * 0.4),
  };

  // Insights
  const insights: string[] = [];
  const topDimensions = [...dimensions].sort((a, b) => b.score - a.score);
  const bottomDimensions = [...dimensions].sort((a, b) => a.score - b.score);

  if (topDimensions[0].score >= 80) insights.push(`Strongest quality factor: ${topDimensions[0].name} (${topDimensions[0].grade})`);
  if (bottomDimensions[0].score < 40) insights.push(`Weakest quality factor: ${bottomDimensions[0].name} (${bottomDimensions[0].grade}) — ${bottomDimensions[0].detail}`);
  insights.push(`Suggested ARR multiple: ${suggestedMultiple.low}-${suggestedMultiple.high}x based on revenue quality`);
  insights.push(`Revenue quality tier: ${tier} — ${tier === 'Institutional' ? 'suitable for institutional investors' : tier === 'Investment' ? 'suitable for growth investors' : tier === 'Speculative' ? 'higher risk, requires careful DD' : 'significant concerns'}`);

  // Improvements
  const improvements: string[] = [];
  for (const d of bottomDimensions.slice(0, 3)) {
    if (d.score < 60) {
      if (d.name === 'Revenue Recurrence') improvements.push('Shift to subscription/recurring revenue models');
      if (d.name === 'Customer Concentration') improvements.push('Diversify customer base — reduce single-customer dependency');
      if (d.name === 'Verification Level') improvements.push('Complete on-chain verification to improve data credibility');
      if (d.name === 'Revenue Consistency') improvements.push('Reduce revenue volatility through annual contracts or prepayments');
      if (d.name === 'Margin Quality') improvements.push('Improve margins through pricing optimization or cost reduction');
    }
  }

  return {
    overallScore,
    grade,
    tier,
    dimensions,
    suggestedMultiple,
    revenueBreakdown,
    insights,
    improvements,
    computedAt: Date.now(),
  };
}
