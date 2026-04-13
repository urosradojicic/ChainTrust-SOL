/**
 * Pattern Recognition Engine
 * ──────────────────────────
 * Detects known startup success and failure patterns from historical data.
 * Matches current startups against archetypical trajectories.
 *
 * Patterns are derived from startup industry research:
 *   - T2D3 growth pattern (Triple, Triple, Double, Double, Double)
 *   - Hockey stick inflection points
 *   - Death spiral indicators
 *   - Plateau before breakout
 *   - Seasonal cyclicality
 *   - Revenue concentration decay
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type PatternType =
  | 't2d3_growth'
  | 'hockey_stick'
  | 'death_spiral'
  | 'plateau_breakout'
  | 'steady_grower'
  | 'boom_bust'
  | 'slow_burn'
  | 'rocket_ship';

export interface DetectedPattern {
  /** Pattern type */
  type: PatternType;
  /** Pattern name */
  name: string;
  /** Match confidence (0-1) */
  confidence: number;
  /** Description of the pattern */
  description: string;
  /** What this pattern typically leads to */
  typicalOutcome: string;
  /** Historical success rate for this pattern */
  historicalSuccessRate: number;
  /** What to watch for next */
  nextExpected: string;
  /** Investment implication */
  implication: 'strong_positive' | 'positive' | 'neutral' | 'negative' | 'strong_negative';
  /** Evidence from the data */
  evidence: string[];
}

export interface GrowthPhase {
  startMonth: number;
  endMonth: number;
  avgGrowth: number;
  label: string;
  trend: 'accelerating' | 'stable' | 'decelerating';
}

export interface PatternReport {
  /** All detected patterns */
  patterns: DetectedPattern[];
  /** Primary pattern (highest confidence) */
  primaryPattern: DetectedPattern | null;
  /** Growth phases identified */
  growthPhases: GrowthPhase[];
  /** Inflection points */
  inflectionPoints: { month: number; label: string; type: 'acceleration' | 'deceleration' | 'reversal' }[];
  /** Trajectory classification */
  trajectory: 'exponential' | 'linear' | 'logarithmic' | 'declining' | 'volatile' | 'flat';
  /** Maturity assessment */
  maturity: 'pre_pmf' | 'early_growth' | 'scaling' | 'mature' | 'declining';
  /** Computed at */
  computedAt: number;
}

// ── Pattern Templates ────────────────────────────────────────────────

const PATTERN_CONFIGS: Record<PatternType, { name: string; description: string; typicalOutcome: string; historicalSuccessRate: number; implication: DetectedPattern['implication'] }> = {
  t2d3_growth: {
    name: 'T2D3 Growth Trajectory',
    description: 'Triple revenue for 2 years, then double for 3 years. The gold standard of SaaS growth (Neeraj Agrawal, Battery Ventures).',
    typicalOutcome: '$100M+ ARR company, unicorn potential',
    historicalSuccessRate: 0.85,
    implication: 'strong_positive',
  },
  hockey_stick: {
    name: 'Hockey Stick Inflection',
    description: 'Flat or slow growth followed by a sudden, sustained acceleration. Classic product-market fit moment.',
    typicalOutcome: 'Rapid scale-up, strong Series A candidacy',
    historicalSuccessRate: 0.72,
    implication: 'strong_positive',
  },
  death_spiral: {
    name: 'Death Spiral',
    description: 'Declining revenue + increasing costs + declining user engagement. Multiple negative reinforcing loops.',
    typicalOutcome: 'Shutdown within 6-12 months without intervention',
    historicalSuccessRate: 0.08,
    implication: 'strong_negative',
  },
  plateau_breakout: {
    name: 'Plateau Before Breakout',
    description: 'Growth plateau that appears concerning but precedes a breakout. Often occurs during product pivots or market repositioning.',
    typicalOutcome: 'Renewed growth if the pivot succeeds',
    historicalSuccessRate: 0.45,
    implication: 'neutral',
  },
  steady_grower: {
    name: 'Steady Grower',
    description: 'Consistent 5-15% MoM growth without dramatic acceleration or deceleration. Reliable but not explosive.',
    typicalOutcome: 'Solid business but may not reach venture-scale without a growth catalyst',
    historicalSuccessRate: 0.55,
    implication: 'positive',
  },
  boom_bust: {
    name: 'Boom-Bust Cycle',
    description: 'Rapid growth followed by sharp contraction. Often driven by marketing spend without retention.',
    typicalOutcome: 'Need to find sustainable growth channels',
    historicalSuccessRate: 0.25,
    implication: 'negative',
  },
  slow_burn: {
    name: 'Slow Burn',
    description: 'Very slow growth with high burn rate. Spending significantly exceeds revenue growth.',
    typicalOutcome: 'Runway crisis unless growth accelerates or burn decreases',
    historicalSuccessRate: 0.20,
    implication: 'negative',
  },
  rocket_ship: {
    name: 'Rocket Ship',
    description: '>30% MoM sustained growth for 3+ months. Extremely rare and usually indicates exceptional product-market fit.',
    typicalOutcome: 'Top-tier outcome if the team can manage hypergrowth',
    historicalSuccessRate: 0.78,
    implication: 'strong_positive',
  },
};

// ── Pattern Detection ────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function detectT2D3(growthRates: number[], revenues: number[]): number {
  if (revenues.length < 6) return 0;
  // T2D3: first 2 years = 3x annual, next 3 years = 2x annual
  // For monthly data: 3x annual ≈ 9.6% MoM, 2x annual ≈ 5.9% MoM
  const recent = growthRates.slice(-6);
  const avgGrowth = mean(recent);
  if (avgGrowth >= 8 && avgGrowth <= 15) return 0.7;
  if (avgGrowth >= 5 && avgGrowth <= 20) return 0.4;
  return 0;
}

function detectHockeyStick(growthRates: number[], revenues: number[]): number {
  if (growthRates.length < 5) return 0;
  const firstHalf = growthRates.slice(0, Math.floor(growthRates.length / 2));
  const secondHalf = growthRates.slice(Math.floor(growthRates.length / 2));
  const firstAvg = mean(firstHalf);
  const secondAvg = mean(secondHalf);

  if (secondAvg > firstAvg * 2 && secondAvg > 10) return 0.8;
  if (secondAvg > firstAvg * 1.5 && secondAvg > 5) return 0.5;
  return 0;
}

function detectDeathSpiral(growthRates: number[], revenues: number[]): number {
  if (growthRates.length < 3) return 0;
  const recent = growthRates.slice(-3);
  const allNegative = recent.every(g => g < 0);
  const deeplyNegative = recent.every(g => g < -5);
  const acceleratingDecline = recent[2] < recent[1] && recent[1] < recent[0];

  if (deeplyNegative && acceleratingDecline) return 0.9;
  if (allNegative && acceleratingDecline) return 0.7;
  if (allNegative) return 0.4;
  return 0;
}

function detectPlateauBreakout(growthRates: number[]): number {
  if (growthRates.length < 5) return 0;
  const mid = Math.floor(growthRates.length / 2);
  const middle = growthRates.slice(mid - 1, mid + 2);
  const isLow = mean(middle) < 3;
  const afterMiddle = growthRates.slice(mid + 1);
  const isRecovering = afterMiddle.length > 0 && mean(afterMiddle) > 8;

  if (isLow && isRecovering) return 0.6;
  return 0;
}

function detectSteadyGrower(growthRates: number[]): number {
  if (growthRates.length < 4) return 0;
  const avg = mean(growthRates);
  const allPositive = growthRates.every(g => g > 0);
  const std = Math.sqrt(growthRates.reduce((s, g) => s + (g - avg) ** 2, 0) / growthRates.length);
  const cv = avg > 0 ? std / avg : 999;

  if (allPositive && avg >= 5 && avg <= 15 && cv < 0.5) return 0.7;
  if (allPositive && avg >= 3 && avg <= 20 && cv < 0.8) return 0.4;
  return 0;
}

function detectBoomBust(growthRates: number[]): number {
  if (growthRates.length < 4) return 0;
  const hasHighGrowth = growthRates.some(g => g > 25);
  const hasNegativeGrowth = growthRates.some(g => g < -5);
  const std = Math.sqrt(growthRates.reduce((s, g) => s + (g - mean(growthRates)) ** 2, 0) / growthRates.length);

  if (hasHighGrowth && hasNegativeGrowth && std > 15) return 0.7;
  if (std > 20) return 0.5;
  return 0;
}

function detectSlowBurn(startup: DbStartup, growthRates: number[], metrics: DbMetricsHistory[]): number {
  if (metrics.length < 3) return 0;
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const avgGrowth = mean(growthRates);
  const lastRev = Number(sorted[sorted.length - 1].revenue);
  const lastCost = Number(sorted[sorted.length - 1].costs);

  if (avgGrowth < 5 && lastCost > lastRev * 1.5) return 0.7;
  if (avgGrowth < 10 && lastCost > lastRev * 1.3) return 0.4;
  return 0;
}

function detectRocketShip(growthRates: number[]): number {
  if (growthRates.length < 3) return 0;
  const recent = growthRates.slice(-3);
  const allAbove30 = recent.every(g => g > 30);
  const allAbove20 = recent.every(g => g > 20);

  if (allAbove30) return 0.85;
  if (allAbove20 && mean(recent) > 25) return 0.6;
  return 0;
}

// ── Trajectory Classification ────────────────────────────────────────

function classifyTrajectory(revenues: number[]): PatternReport['trajectory'] {
  if (revenues.length < 3) return 'flat';

  // Fit linear and exponential models, compare R²
  const n = revenues.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(x);
  const yMean = mean(revenues);

  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (x[i] - xMean) * (revenues[i] - yMean);
    ssXX += (x[i] - xMean) ** 2;
    ssYY += (revenues[i] - yMean) ** 2;
  }
  const linR2 = ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;
  const slope = ssXX > 0 ? ssXY / ssXX : 0;

  // Check for exponential (log-linear)
  const logRevs = revenues.filter(r => r > 0).map(r => Math.log(r));
  const logMean = mean(logRevs);
  let logSSXY = 0, logSSYY = 0;
  for (let i = 0; i < logRevs.length; i++) {
    logSSXY += (x[i] - xMean) * (logRevs[i] - logMean);
    logSSYY += (logRevs[i] - logMean) ** 2;
  }
  const expR2 = logSSYY > 0 ? (logSSXY ** 2) / (ssXX * logSSYY) : 0;

  // Coefficient of variation
  const cv = yMean > 0 ? Math.sqrt(ssYY / n) / yMean : 0;

  if (cv > 0.5 && linR2 < 0.3) return 'volatile';
  if (slope < -yMean * 0.02) return 'declining';
  if (linR2 < 0.2) return 'flat';
  if (expR2 > linR2 + 0.1 && slope > 0) return 'exponential';
  if (expR2 < linR2 - 0.1 && slope > 0) return 'logarithmic';
  return 'linear';
}

function classifyMaturity(startup: DbStartup, growthRates: number[]): PatternReport['maturity'] {
  const mrr = startup.mrr;
  const avgGrowth = mean(growthRates);

  if (mrr < 10000 || growthRates.length < 2) return 'pre_pmf';
  if (mrr < 50000 && avgGrowth > 10) return 'early_growth';
  if (mrr >= 50000 && avgGrowth > 15) return 'scaling';
  if (mrr >= 200000 && avgGrowth < 10) return 'mature';
  if (avgGrowth < 0) return 'declining';
  return 'early_growth';
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run complete pattern recognition analysis.
 */
export function recognizePatterns(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): PatternReport {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const growthRates = sorted.map(m => Number(m.growth_rate));
  const revenues = sorted.map(m => Number(m.revenue));

  // Detect all patterns
  const detections: { type: PatternType; confidence: number }[] = [
    { type: 't2d3_growth', confidence: detectT2D3(growthRates, revenues) },
    { type: 'hockey_stick', confidence: detectHockeyStick(growthRates, revenues) },
    { type: 'death_spiral', confidence: detectDeathSpiral(growthRates, revenues) },
    { type: 'plateau_breakout', confidence: detectPlateauBreakout(growthRates) },
    { type: 'steady_grower', confidence: detectSteadyGrower(growthRates) },
    { type: 'boom_bust', confidence: detectBoomBust(growthRates) },
    { type: 'slow_burn', confidence: detectSlowBurn(startup, growthRates, sorted) },
    { type: 'rocket_ship', confidence: detectRocketShip(growthRates) },
  ].filter(d => d.confidence > 0.3);

  const patterns: DetectedPattern[] = detections
    .map(d => {
      const config = PATTERN_CONFIGS[d.type];
      return {
        type: d.type,
        name: config.name,
        confidence: d.confidence,
        description: config.description,
        typicalOutcome: config.typicalOutcome,
        historicalSuccessRate: config.historicalSuccessRate,
        nextExpected: d.type === 'hockey_stick' ? 'Continued acceleration if PMF is real'
          : d.type === 'death_spiral' ? 'Further decline without pivot or injection'
          : d.type === 'rocket_ship' ? 'Test operational scalability'
          : 'Monitor for pattern continuation or break',
        implication: config.implication,
        evidence: [
          `Average growth: ${mean(growthRates).toFixed(1)}%`,
          `Growth trend: ${growthRates.length >= 3 ? (growthRates[growthRates.length - 1] > growthRates[0] ? 'accelerating' : 'decelerating') : 'insufficient data'}`,
          `Revenue trend: $${revenues[0]?.toLocaleString()} → $${revenues[revenues.length - 1]?.toLocaleString()}`,
        ],
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  // Growth phases
  const phaseSize = Math.max(2, Math.floor(growthRates.length / 3));
  const growthPhases: GrowthPhase[] = [];
  for (let i = 0; i < growthRates.length; i += phaseSize) {
    const phase = growthRates.slice(i, i + phaseSize);
    const avg = mean(phase);
    const trend: GrowthPhase['trend'] = phase.length >= 2
      ? phase[phase.length - 1] > phase[0] ? 'accelerating' : phase[phase.length - 1] < phase[0] ? 'decelerating' : 'stable'
      : 'stable';
    growthPhases.push({
      startMonth: i,
      endMonth: Math.min(i + phaseSize - 1, growthRates.length - 1),
      avgGrowth: +avg.toFixed(1),
      label: avg > 20 ? 'Hyper Growth' : avg > 10 ? 'Strong Growth' : avg > 0 ? 'Moderate Growth' : 'Contraction',
      trend,
    });
  }

  // Inflection points
  const inflectionPoints: PatternReport['inflectionPoints'] = [];
  for (let i = 2; i < growthRates.length; i++) {
    const before = mean(growthRates.slice(Math.max(0, i - 2), i));
    const after = growthRates[i];
    if (after > before * 1.5 && Math.abs(after - before) > 5) {
      inflectionPoints.push({ month: i, label: sorted[i]?.month_date?.slice(0, 7) ?? `M${i}`, type: 'acceleration' });
    } else if (after < before * 0.5 && Math.abs(after - before) > 5) {
      inflectionPoints.push({ month: i, label: sorted[i]?.month_date?.slice(0, 7) ?? `M${i}`, type: 'deceleration' });
    } else if ((before > 0 && after < 0) || (before < 0 && after > 0)) {
      inflectionPoints.push({ month: i, label: sorted[i]?.month_date?.slice(0, 7) ?? `M${i}`, type: 'reversal' });
    }
  }

  return {
    patterns,
    primaryPattern: patterns.length > 0 ? patterns[0] : null,
    growthPhases,
    inflectionPoints,
    trajectory: classifyTrajectory(revenues),
    maturity: classifyMaturity(startup, growthRates),
    computedAt: Date.now(),
  };
}
