/**
 * Tokenomics Simulator
 * ────────────────────
 * Simulates token supply/demand dynamics, emission schedules,
 * buy pressure, and long-term token health.
 *
 * Answers:
 *   - "What happens to token price if inflation stays at X%?"
 *   - "When will circulating supply reach Y?"
 *   - "How much buy pressure does protocol revenue create?"
 *   - "Is the emission schedule sustainable?"
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface TokenSupplyProjection {
  month: number;
  label: string;
  circulatingSupply: number;
  totalSupply: number;
  newEmissions: number;
  burned: number;
  netNew: number;
  inflationRate: number;
  /** Estimated token value (relative, not USD) */
  relativeValue: number;
}

export interface TokenHealthMetrics {
  /** Current inflation rate */
  inflationRate: number;
  /** Effective inflation (after burns) */
  effectiveInflation: number;
  /** Estimated buy pressure from protocol revenue (tokens/month) */
  buyPressure: number;
  /** Estimated sell pressure from emissions (tokens/month) */
  sellPressure: number;
  /** Buy/sell pressure ratio */
  pressureRatio: number;
  /** Token velocity (turnover rate) */
  velocity: number;
  /** Concentration risk (whale %) */
  concentrationRisk: number;
  /** Health grade */
  healthGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Overall health score */
  healthScore: number;
}

export interface TokenomicsReport {
  /** Health metrics */
  health: TokenHealthMetrics;
  /** 24-month supply projection */
  supplyProjection: TokenSupplyProjection[];
  /** Key insights */
  insights: string[];
  /** Sustainability assessment */
  sustainability: 'sustainable' | 'marginal' | 'unsustainable';
  /** Recommendations */
  recommendations: string[];
  /** Computed at */
  computedAt: number;
}

// ── Simulation ───────────────────────────────────────────────────────

function simulateTokenSupply(
  initialSupply: number,
  annualInflation: number,
  burnRate: number, // % of emissions burned
  protocolRevenue: number, // Monthly protocol revenue in token terms
  months: number = 24,
): TokenSupplyProjection[] {
  const projections: TokenSupplyProjection[] = [];
  let supply = initialSupply;
  let total = initialSupply * 1.2; // Total > circulating

  for (let m = 0; m <= months; m++) {
    const monthlyInflation = annualInflation / 100 / 12;
    const newEmissions = supply * monthlyInflation;
    const burned = newEmissions * (burnRate / 100) + protocolRevenue * 0.02; // 2% of revenue burns
    const netNew = newEmissions - burned;

    supply += netNew;
    total += newEmissions;

    const effectiveMonthlyInflation = supply > 0 ? (netNew / supply) * 100 : 0;
    const relativeValue = initialSupply / supply; // Simple supply-based value model

    projections.push({
      month: m,
      label: m === 0 ? 'Now' : `M+${m}`,
      circulatingSupply: Math.round(supply),
      totalSupply: Math.round(total),
      newEmissions: Math.round(newEmissions),
      burned: Math.round(burned),
      netNew: Math.round(netNew),
      inflationRate: +effectiveMonthlyInflation.toFixed(3),
      relativeValue: +relativeValue.toFixed(4),
    });
  }

  return projections;
}

function computeHealthMetrics(startup: DbStartup): TokenHealthMetrics {
  const inflation = Number(startup.inflation_rate);
  const whale = Number(startup.whale_concentration);

  // Estimate burn from governance fees (2% of proposal fees)
  const estimatedBurn = inflation * 0.15; // 15% of emissions burned (estimate)
  const effectiveInflation = Math.max(0, inflation - estimatedBurn);

  // Buy/sell pressure (simplified)
  const sellPressure = inflation; // Emissions create sell pressure
  const buyPressure = startup.mrr > 0 ? Math.min(inflation, startup.mrr / 100000 * 2) : 0; // Revenue creates buy pressure
  const pressureRatio = sellPressure > 0 ? buyPressure / sellPressure : 1;

  // Velocity (higher = less holding)
  const velocity = whale > 30 ? 0.3 : whale > 15 ? 0.5 : 0.8; // Low whale = higher velocity (more trading)

  // Health score
  let healthScore = 50;
  if (effectiveInflation <= 3) healthScore += 20;
  else if (effectiveInflation <= 6) healthScore += 10;
  else healthScore -= 10;

  if (pressureRatio >= 0.8) healthScore += 15;
  else if (pressureRatio >= 0.4) healthScore += 5;
  else healthScore -= 10;

  if (whale < 20) healthScore += 15;
  else if (whale < 35) healthScore += 5;
  else healthScore -= 15;

  healthScore = Math.max(0, Math.min(100, healthScore));

  const healthGrade: TokenHealthMetrics['healthGrade'] =
    healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : healthScore >= 20 ? 'D' : 'F';

  return {
    inflationRate: inflation,
    effectiveInflation: +effectiveInflation.toFixed(2),
    buyPressure: +buyPressure.toFixed(2),
    sellPressure: +sellPressure.toFixed(2),
    pressureRatio: +pressureRatio.toFixed(3),
    velocity: +velocity.toFixed(2),
    concentrationRisk: whale,
    healthGrade,
    healthScore,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run tokenomics simulation and health analysis.
 */
export function simulateTokenomics(startup: DbStartup): TokenomicsReport {
  const inflation = Number(startup.inflation_rate);
  const health = computeHealthMetrics(startup);

  // Simulate 24-month supply projection
  const initialSupply = 10000000; // 10M tokens (standard)
  const burnRate = 15; // 15% of emissions burned
  const protocolRevenue = startup.mrr / 10; // Simplified token-denominated revenue

  const supplyProjection = simulateTokenSupply(
    initialSupply, inflation, burnRate, protocolRevenue, 24,
  );

  // Insights
  const insights: string[] = [];
  const finalSupply = supplyProjection[supplyProjection.length - 1];

  if (health.effectiveInflation <= 3) {
    insights.push(`Effective inflation of ${health.effectiveInflation}% (after burns) is conservative — holder-friendly tokenomics.`);
  } else if (health.effectiveInflation > 8) {
    insights.push(`WARNING: ${health.effectiveInflation}% effective inflation will dilute holders significantly over time.`);
  }

  if (health.pressureRatio >= 0.8) {
    insights.push('Buy pressure from protocol revenue nearly matches sell pressure from emissions — positive signal.');
  } else if (health.pressureRatio < 0.3) {
    insights.push('Sell pressure significantly exceeds buy pressure — token value likely to decline without external demand.');
  }

  const supplyGrowth = ((finalSupply.circulatingSupply - initialSupply) / initialSupply) * 100;
  insights.push(`Projected supply growth over 24 months: ${supplyGrowth.toFixed(1)}% (${initialSupply.toLocaleString()} → ${finalSupply.circulatingSupply.toLocaleString()} tokens).`);
  insights.push(`Relative token value in 24 months: ${(finalSupply.relativeValue * 100).toFixed(1)}% of current (from supply dilution alone).`);

  // Sustainability
  const sustainability: TokenomicsReport['sustainability'] =
    health.healthScore >= 60 && health.pressureRatio >= 0.5 ? 'sustainable' :
    health.healthScore >= 35 ? 'marginal' :
    'unsustainable';

  // Recommendations
  const recommendations: string[] = [];
  if (inflation > 6) recommendations.push('Reduce emission rate or implement stronger burn mechanisms');
  if (health.pressureRatio < 0.5) recommendations.push('Increase protocol revenue or create token utility to boost buy pressure');
  if (health.concentrationRisk > 35) recommendations.push('Distribute tokens more broadly — high concentration creates governance and price risk');
  if (health.effectiveInflation > health.inflationRate * 0.8) recommendations.push('Increase burn rate — current burns are insufficient to offset emissions');
  if (recommendations.length === 0) recommendations.push('Tokenomics appear healthy — maintain current emission and burn parameters.');

  return { health, supplyProjection, insights, sustainability, recommendations, computedAt: Date.now() };
}
