/**
 * Monte Carlo Simulation Engine — Digital Twin
 * ─────────────────────────────────────────────
 * Simulates thousands of possible futures for a startup based on
 * historical metrics and configurable assumptions.
 *
 * Outputs probability distributions for:
 *   - Revenue trajectory (fan chart)
 *   - Runway / cash-out date
 *   - Probability of profitability by month N
 *   - Probability of hitting revenue milestones
 *   - Break-even timeline distribution
 *
 * Runs entirely client-side. Zero API calls.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface SimulationParams {
  /** Number of Monte Carlo iterations */
  iterations: number;
  /** Months to simulate into the future */
  horizonMonths: number;
  /** Override base growth rate (MoM %). Null = derive from history. */
  growthRateOverride: number | null;
  /** Override growth volatility (std dev). Null = derive from history. */
  growthVolatilityOverride: number | null;
  /** Override monthly burn (costs - revenue). Null = derive from history. */
  burnOverride: number | null;
  /** Additional funding injection at month N */
  fundingEvent: { month: number; amount: number } | null;
  /** Revenue milestone to check probability for */
  revenueMilestone: number;
}

export interface SimulationResult {
  /** Per-month percentile bands for revenue */
  revenueBands: MonthBand[];
  /** Per-month percentile bands for cash balance */
  cashBands: MonthBand[];
  /** Probability of being profitable by each month (0-1) */
  profitabilityByMonth: number[];
  /** Probability of hitting the revenue milestone (0-1) */
  milestoneProbability: number;
  /** Month by which the milestone is most likely hit (median) */
  milestoneMedianMonth: number | null;
  /** Probability of running out of cash within the horizon (0-1) */
  cashOutProbability: number;
  /** Distribution of cash-out month (null if never) */
  cashOutDistribution: { month: number; probability: number }[];
  /** Break-even month distribution */
  breakEvenDistribution: { month: number; probability: number }[];
  /** Median runway in months */
  medianRunway: number;
  /** Summary statistics */
  summary: SimulationSummary;
  /** Parameters used */
  params: SimulationParams;
  /** Timestamp */
  computedAt: number;
}

export interface MonthBand {
  month: number;
  label: string;
  p5: number;    // 5th percentile (worst case)
  p25: number;   // 25th percentile
  p50: number;   // median
  p75: number;   // 75th percentile
  p95: number;   // 95th percentile (best case)
  mean: number;
}

export interface SimulationSummary {
  /** Median revenue at end of horizon */
  medianFinalRevenue: number;
  /** Median cash at end of horizon */
  medianFinalCash: number;
  /** Probability of 2x revenue growth */
  prob2xRevenue: number;
  /** Probability of 5x revenue growth */
  prob5xRevenue: number;
  /** Probability of positive cash at horizon end */
  probSolvent: number;
  /** Expected monthly growth rate used */
  baseGrowthRate: number;
  /** Growth volatility (std dev) used */
  growthVolatility: number;
  /** Base monthly burn used */
  baseBurn: number;
}

// ── Random Utilities ─────────────────────────────────────────────────

/** Box-Muller transform for normal distribution */
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stdDev * z;
}

/** Calculate percentile from sorted array */
function percentile(sorted: number[], p: number): number {
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

// ── Parameter Estimation ─────────────────────────────────────────────

interface EstimatedParams {
  currentRevenue: number;
  currentCosts: number;
  currentCash: number;
  monthlyGrowthRate: number; // as decimal (0.15 = 15%)
  growthVolatility: number;  // std dev of monthly growth
  costGrowthRate: number;    // monthly cost growth as decimal
  costVolatility: number;
}

function estimateParams(startup: DbStartup, metrics: DbMetricsHistory[]): EstimatedParams {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));

  // Current values
  const currentRevenue = sorted.length > 0 ? Number(sorted[sorted.length - 1].revenue) : startup.mrr;
  const currentCosts = sorted.length > 0 ? Number(sorted[sorted.length - 1].costs) : startup.mrr * 0.7;
  const currentCash = startup.treasury;

  // Growth rate estimation
  let growthRates: number[] = [];
  if (sorted.length >= 2) {
    for (let i = 1; i < sorted.length; i++) {
      const prev = Number(sorted[i - 1].revenue);
      const curr = Number(sorted[i].revenue);
      if (prev > 0) growthRates.push((curr - prev) / prev);
    }
  }

  const monthlyGrowthRate = growthRates.length > 0
    ? growthRates.reduce((s, g) => s + g, 0) / growthRates.length
    : Number(startup.growth_rate) / 100;

  const growthVolatility = growthRates.length >= 3
    ? Math.sqrt(growthRates.reduce((s, g) => s + Math.pow(g - monthlyGrowthRate, 2), 0) / (growthRates.length - 1))
    : Math.abs(monthlyGrowthRate) * 0.3; // default 30% of mean

  // Cost growth estimation
  let costGrowthRates: number[] = [];
  if (sorted.length >= 2) {
    for (let i = 1; i < sorted.length; i++) {
      const prev = Number(sorted[i - 1].costs);
      const curr = Number(sorted[i].costs);
      if (prev > 0) costGrowthRates.push((curr - prev) / prev);
    }
  }

  const costGrowthRate = costGrowthRates.length > 0
    ? costGrowthRates.reduce((s, g) => s + g, 0) / costGrowthRates.length
    : monthlyGrowthRate * 0.6; // costs grow slower than revenue by default

  const costVolatility = costGrowthRates.length >= 3
    ? Math.sqrt(costGrowthRates.reduce((s, g) => s + Math.pow(g - costGrowthRate, 2), 0) / (costGrowthRates.length - 1))
    : Math.abs(costGrowthRate) * 0.2;

  return {
    currentRevenue,
    currentCosts,
    currentCash,
    monthlyGrowthRate,
    growthVolatility,
    costGrowthRate,
    costVolatility,
  };
}

// ── Core Simulation ──────────────────────────────────────────────────

function runSingleSimulation(
  params: EstimatedParams,
  simParams: SimulationParams,
): { revenues: number[]; cash: number[]; costs: number[] } {
  const revenues: number[] = [params.currentRevenue];
  const costs: number[] = [params.currentCosts];
  const cash: number[] = [params.currentCash];

  const growthRate = simParams.growthRateOverride !== null
    ? simParams.growthRateOverride / 100
    : params.monthlyGrowthRate;

  const growthVol = simParams.growthVolatilityOverride !== null
    ? simParams.growthVolatilityOverride / 100
    : params.growthVolatility;

  for (let m = 1; m <= simParams.horizonMonths; m++) {
    // Revenue grows with stochastic noise
    const revGrowth = normalRandom(growthRate, growthVol);
    const newRevenue = Math.max(0, revenues[m - 1] * (1 + revGrowth));
    revenues.push(newRevenue);

    // Costs grow with lower volatility
    const costGrowth = normalRandom(params.costGrowthRate, params.costVolatility);
    const newCosts = Math.max(0, costs[m - 1] * (1 + costGrowth));
    costs.push(newCosts);

    // Cash = previous cash + (revenue - costs) + any funding event
    let cashFlow = newRevenue - newCosts;
    if (simParams.fundingEvent && simParams.fundingEvent.month === m) {
      cashFlow += simParams.fundingEvent.amount;
    }
    const newCash = cash[m - 1] + cashFlow;
    cash.push(newCash);
  }

  return { revenues, cash, costs };
}

// ── Main Entry Point ─────────────────────────────────────────────────

export const DEFAULT_PARAMS: SimulationParams = {
  iterations: 5000,
  horizonMonths: 24,
  growthRateOverride: null,
  growthVolatilityOverride: null,
  burnOverride: null,
  fundingEvent: null,
  revenueMilestone: 1000000, // $1M MRR
};

/**
 * Run a full Monte Carlo simulation for a startup.
 *
 * @param startup  - Startup data
 * @param metrics  - Historical metrics
 * @param params   - Simulation parameters (use DEFAULT_PARAMS as starting point)
 * @returns        - Full simulation results with probability distributions
 */
export function runSimulation(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  params: SimulationParams = DEFAULT_PARAMS,
): SimulationResult {
  const estimated = estimateParams(startup, metrics);
  const { iterations, horizonMonths } = params;

  // Storage for all simulation paths
  const allRevenues: number[][] = [];
  const allCosts: number[][] = [];
  const allCash: number[][] = [];

  // Run simulations
  for (let i = 0; i < iterations; i++) {
    const result = runSingleSimulation(estimated, params);
    allRevenues.push(result.revenues);
    allCosts.push(result.costs);
    allCash.push(result.cash);
  }

  // Compute per-month percentile bands
  const revenueBands: MonthBand[] = [];
  const cashBands: MonthBand[] = [];
  const profitabilityByMonth: number[] = [];

  for (let m = 0; m <= horizonMonths; m++) {
    // Revenue bands
    const revValues = allRevenues.map(r => r[m]).sort((a, b) => a - b);
    revenueBands.push({
      month: m,
      label: m === 0 ? 'Now' : `M+${m}`,
      p5: percentile(revValues, 5),
      p25: percentile(revValues, 25),
      p50: percentile(revValues, 50),
      p75: percentile(revValues, 75),
      p95: percentile(revValues, 95),
      mean: revValues.reduce((s, v) => s + v, 0) / revValues.length,
    });

    // Cash bands
    const cashValues = allCash.map(c => c[m]).sort((a, b) => a - b);
    cashBands.push({
      month: m,
      label: m === 0 ? 'Now' : `M+${m}`,
      p5: percentile(cashValues, 5),
      p25: percentile(cashValues, 25),
      p50: percentile(cashValues, 50),
      p75: percentile(cashValues, 75),
      p95: percentile(cashValues, 95),
      mean: cashValues.reduce((s, v) => s + v, 0) / cashValues.length,
    });

    // Profitability = revenue exceeds costs (true operating profitability)
    const profitableCount = allRevenues.filter((r, idx) =>
      m < r.length && m < allCosts[idx].length && r[m] > allCosts[idx][m]
    ).length;
    profitabilityByMonth.push(profitableCount / iterations);
  }

  // Milestone probability
  const milestoneHits = allRevenues.filter(r =>
    r.some(rev => rev >= params.revenueMilestone)
  ).length;
  const milestoneProbability = milestoneHits / iterations;

  // Median month to milestone
  const milestoneMonths = allRevenues
    .map(r => r.findIndex(rev => rev >= params.revenueMilestone))
    .filter(m => m >= 0)
    .sort((a, b) => a - b);
  const milestoneMedianMonth = milestoneMonths.length > 0
    ? milestoneMonths[Math.floor(milestoneMonths.length / 2)]
    : null;

  // Cash-out probability and distribution
  const cashOutMonths = allCash
    .map(c => c.findIndex((val, i) => i > 0 && val <= 0))
    .filter(m => m >= 0);
  const cashOutProbability = cashOutMonths.length / iterations;

  const cashOutDistribution: { month: number; probability: number }[] = [];
  for (let m = 1; m <= horizonMonths; m++) {
    const count = cashOutMonths.filter(cm => cm === m).length;
    if (count > 0) {
      cashOutDistribution.push({ month: m, probability: count / iterations });
    }
  }

  // Break-even distribution (first month where revenue >= costs)
  const breakEvenMonths = allRevenues
    .map((r, i) => {
      const costs = allCash[i]; // Use cash trajectory to infer
      return r.findIndex((rev, m) => m > 0 && rev >= estimated.currentCosts * Math.pow(1 + estimated.costGrowthRate, m));
    })
    .filter(m => m >= 0);

  const breakEvenDistribution: { month: number; probability: number }[] = [];
  for (let m = 1; m <= horizonMonths; m++) {
    const count = breakEvenMonths.filter(bm => bm === m).length;
    if (count > 0) {
      breakEvenDistribution.push({ month: m, probability: count / iterations });
    }
  }

  // Median runway
  const sortedCashOut = [...cashOutMonths].sort((a, b) => a - b);
  const medianRunway = cashOutMonths.length > 0
    ? sortedCashOut[Math.floor(sortedCashOut.length / 2)]
    : horizonMonths; // If no cash-out, runway exceeds horizon

  // Summary
  const finalRevenues = allRevenues.map(r => r[horizonMonths]).sort((a, b) => a - b);
  const finalCash = allCash.map(c => c[horizonMonths]).sort((a, b) => a - b);

  const summary: SimulationSummary = {
    medianFinalRevenue: percentile(finalRevenues, 50),
    medianFinalCash: percentile(finalCash, 50),
    prob2xRevenue: finalRevenues.filter(r => r >= estimated.currentRevenue * 2).length / iterations,
    prob5xRevenue: finalRevenues.filter(r => r >= estimated.currentRevenue * 5).length / iterations,
    probSolvent: finalCash.filter(c => c > 0).length / iterations,
    baseGrowthRate: params.growthRateOverride ?? estimated.monthlyGrowthRate * 100,
    growthVolatility: params.growthVolatilityOverride ?? estimated.growthVolatility * 100,
    baseBurn: estimated.currentCosts - estimated.currentRevenue,
  };

  return {
    revenueBands,
    cashBands,
    profitabilityByMonth,
    milestoneProbability,
    milestoneMedianMonth,
    cashOutProbability,
    cashOutDistribution,
    breakEvenDistribution,
    medianRunway,
    summary,
    params,
    computedAt: Date.now(),
  };
}
