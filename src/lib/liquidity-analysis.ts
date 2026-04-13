/**
 * Liquidity Analysis Engine
 * ─────────────────────────
 * Analyzes token liquidity depth, slippage modeling, and exit feasibility.
 * Critical for investors: can you actually sell your position without crashing the price?
 *
 * Metrics:
 *   - Liquidity depth at various price levels
 *   - Estimated slippage for different trade sizes
 *   - Time to exit (how long to sell a position)
 *   - Liquidity score (how liquid is this token?)
 *   - Concentration risk (if few LPs, liquidity is fragile)
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface LiquidityLevel {
  /** Price impact percentage */
  priceImpact: number;
  /** Trade size that causes this impact (USD) */
  tradeSize: number;
  /** Available liquidity at this level */
  availableLiquidity: number;
}

export interface SlippageEstimate {
  tradeSize: number;
  estimatedSlippage: number;
  effectivePrice: number;
  costOfSlippage: number;
  feasibility: 'easy' | 'moderate' | 'difficult' | 'impractical';
}

export interface LiquidityReport {
  /** Overall liquidity score (0-100) */
  liquidityScore: number;
  /** Liquidity grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Estimated total liquidity (USD) */
  totalLiquidity: number;
  /** Liquidity depth at various levels */
  depthLevels: LiquidityLevel[];
  /** Slippage estimates for common trade sizes */
  slippageTable: SlippageEstimate[];
  /** Time to exit estimates */
  exitEstimates: { positionSize: number; daysToExit: number; avgSlippage: number }[];
  /** Liquidity concentration (how many LPs provide liquidity) */
  concentration: { top3Pct: number; isFragile: boolean };
  /** Liquidity trend */
  trend: 'deepening' | 'stable' | 'thinning';
  /** Key insights */
  insights: string[];
  /** Recommendations */
  recommendations: string[];
  /** Computed at */
  computedAt: number;
}

// ── Liquidity Modeling ───────────────────────────────────────────────

function estimateLiquidity(startup: DbStartup): number {
  // Estimate based on MRR, users, and market dynamics
  const baseMultiplier = startup.verified ? 5 : 2;
  const userFactor = Math.log10(Math.max(startup.users, 10));
  const mrrFactor = startup.mrr / 10000;
  return Math.round(startup.mrr * baseMultiplier * userFactor + mrrFactor * 50000);
}

function modelSlippage(tradeSize: number, totalLiquidity: number): number {
  // Constant product AMM slippage model: slippage ≈ tradeSize / (2 * liquidity)
  if (totalLiquidity <= 0) return 100;
  const impact = (tradeSize / (2 * totalLiquidity)) * 100;
  return Math.min(99, impact);
}

function estimateExitTime(positionSize: number, dailyVolume: number): number {
  // Can sell ~10% of daily volume without excessive impact
  const safeDaily = dailyVolume * 0.1;
  return safeDaily > 0 ? Math.ceil(positionSize / safeDaily) : 999;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate liquidity analysis report.
 */
export function analyzeLiquidity(startup: DbStartup): LiquidityReport {
  const totalLiquidity = estimateLiquidity(startup);
  const dailyVolume = totalLiquidity * 0.05; // ~5% daily turnover estimate
  const whale = Number(startup.whale_concentration);

  // Depth levels
  const depthLevels: LiquidityLevel[] = [0.5, 1, 2, 5, 10].map(impact => ({
    priceImpact: impact,
    tradeSize: Math.round(totalLiquidity * impact / 50),
    availableLiquidity: Math.round(totalLiquidity * (impact / 10)),
  }));

  // Slippage table
  const tradeSizes = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  const slippageTable: SlippageEstimate[] = tradeSizes.map(size => {
    const slippage = modelSlippage(size, totalLiquidity);
    return {
      tradeSize: size,
      estimatedSlippage: +slippage.toFixed(2),
      effectivePrice: +(1 - slippage / 100).toFixed(4),
      costOfSlippage: Math.round(size * slippage / 100),
      feasibility: slippage < 1 ? 'easy' : slippage < 3 ? 'moderate' : slippage < 10 ? 'difficult' : 'impractical',
    };
  });

  // Exit estimates
  const exitEstimates = [10000, 50000, 100000, 500000, 1000000].map(size => ({
    positionSize: size,
    daysToExit: estimateExitTime(size, dailyVolume),
    avgSlippage: +modelSlippage(size / Math.max(estimateExitTime(size, dailyVolume), 1), totalLiquidity).toFixed(2),
  }));

  // Concentration
  const top3Pct = Math.min(100, whale * 1.5);
  const isFragile = top3Pct > 60;

  // Score
  let score = 50;
  if (totalLiquidity > 5000000) score += 25;
  else if (totalLiquidity > 1000000) score += 15;
  else if (totalLiquidity > 100000) score += 5;
  else score -= 15;

  if (!isFragile) score += 10;
  if (slippageTable[2]?.estimatedSlippage < 1) score += 10; // $10K with <1% slippage
  if (startup.verified) score += 5;
  score = Math.max(0, Math.min(100, score));

  const grade: LiquidityReport['grade'] = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  // Insights
  const insights: string[] = [];
  insights.push(`Estimated total liquidity: $${(totalLiquidity / 1000000).toFixed(1)}M`);
  insights.push(`A $10K trade would cause ~${slippageTable[2]?.estimatedSlippage ?? 'N/A'}% slippage`);
  if (isFragile) insights.push('WARNING: Liquidity is concentrated — a single LP withdrawal could cause a crisis');
  insights.push(`Time to exit a $100K position: ~${exitEstimates[2]?.daysToExit ?? 'N/A'} days`);

  const recommendations: string[] = [];
  if (score < 40) recommendations.push('Liquidity is thin — enter positions slowly and plan exits carefully');
  if (isFragile) recommendations.push('Diversify liquidity sources — single-LP dependency is dangerous');
  if (totalLiquidity < 500000) recommendations.push('Consider the liquidity risk premium — illiquid positions should trade at a discount');
  if (recommendations.length === 0) recommendations.push('Liquidity is adequate for most position sizes');

  return {
    liquidityScore: score, grade, totalLiquidity, depthLevels, slippageTable, exitEstimates,
    concentration: { top3Pct: +top3Pct.toFixed(0), isFragile },
    trend: startup.users > 10000 ? 'deepening' : 'stable',
    insights, recommendations, computedAt: Date.now(),
  };
}
