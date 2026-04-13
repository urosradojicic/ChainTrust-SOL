/**
 * Portfolio Optimizer — Modern Portfolio Theory for Startups
 * ──────────────────────────────────────────────────────────
 * Applies Markowitz mean-variance optimization to startup investments.
 * Generates efficient frontiers, optimal allocations, and risk-return profiles.
 *
 * Key adaptations for startup investing:
 *   - Uses MoM growth rate as proxy for returns (not stock price returns)
 *   - Computes covariance between startups' growth rates
 *   - Risk = growth rate volatility (standard deviation)
 *   - Categories serve as "sectors" for diversification
 *   - Trust score and verification status act as quality filters
 *
 * Outputs:
 *   - Efficient frontier (risk-return curve)
 *   - Optimal portfolio allocation for target return or risk level
 *   - Sharpe ratio analogues
 *   - Diversification metrics
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface PortfolioAsset {
  id: string;
  name: string;
  category: string;
  /** Expected monthly return (growth rate %) */
  expectedReturn: number;
  /** Risk (std dev of growth rate %) */
  risk: number;
  /** Trust-adjusted quality score (0-1) */
  quality: number;
  /** Whether on-chain verified */
  verified: boolean;
  /** Current MRR */
  mrr: number;
}

export interface PortfolioAllocation {
  /** Asset allocations (sum to 1) */
  weights: Map<string, number>;
  /** Portfolio expected return */
  expectedReturn: number;
  /** Portfolio risk (std dev) */
  risk: number;
  /** Sharpe-like ratio (return / risk) */
  sharpeRatio: number;
  /** Number of assets included */
  assetCount: number;
  /** Category diversification score (0-1, higher = more diverse) */
  diversificationScore: number;
  /** Verification coverage (% of portfolio in verified startups) */
  verifiedCoverage: number;
}

export interface EfficientFrontierPoint {
  risk: number;
  return_: number;
  sharpeRatio: number;
  weights: Map<string, number>;
}

export interface PortfolioAnalysis {
  /** All eligible assets */
  assets: PortfolioAsset[];
  /** Efficient frontier curve */
  efficientFrontier: EfficientFrontierPoint[];
  /** Minimum variance portfolio */
  minimumVariance: PortfolioAllocation;
  /** Maximum Sharpe ratio portfolio */
  maxSharpe: PortfolioAllocation;
  /** Aggressive growth portfolio */
  aggressiveGrowth: PortfolioAllocation;
  /** Conservative portfolio (min risk with quality filter) */
  conservative: PortfolioAllocation;
  /** Correlation matrix between assets */
  correlationMatrix: { asset1: string; asset2: string; correlation: number }[];
  /** Computed at */
  computedAt: number;
}

// ── Math Utilities ───────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1));
}

function correlation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xm = mean(x.slice(0, n));
  const ym = mean(y.slice(0, n));
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const xd = x[i] - xm;
    const yd = y[i] - ym;
    num += xd * yd;
    dx += xd * xd;
    dy += yd * yd;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

/** Herfindahl-Hirschman Index for concentration (lower = more diverse) */
function hhi(weights: number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

// ── Asset Construction ───────────────────────────────────────────────

function buildAssets(
  startups: DbStartup[],
  allMetrics: Map<string, DbMetricsHistory[]>,
): PortfolioAsset[] {
  return startups
    .filter(s => s.mrr > 0) // Only revenue-generating startups
    .map(s => {
      const metrics = allMetrics.get(s.id) || [];
      const growthRates = metrics.map(m => Number(m.growth_rate));
      const expectedReturn = growthRates.length > 0 ? mean(growthRates) : Number(s.growth_rate);
      const risk = growthRates.length >= 3 ? stdDev(growthRates) : Math.abs(expectedReturn) * 0.4;

      const quality = (
        (s.verified ? 0.3 : 0) +
        Math.min(0.3, s.trust_score / 333) +
        Math.min(0.2, (100 - Number(s.whale_concentration)) / 500) +
        Math.min(0.2, s.sustainability_score / 500)
      );

      return {
        id: s.id,
        name: s.name,
        category: s.category,
        expectedReturn,
        risk: Math.max(risk, 0.1), // Floor to avoid division by zero
        quality,
        verified: s.verified,
        mrr: s.mrr,
      };
    })
    .filter(a => a.expectedReturn > -50); // Filter extreme outliers
}

// ── Portfolio Construction ───────────────────────────────────────────

function computePortfolioStats(
  assets: PortfolioAsset[],
  weights: Map<string, number>,
  correlations: Map<string, number>,
): PortfolioAllocation {
  let expectedReturn = 0;
  let variance = 0;

  const assetList = assets.filter(a => (weights.get(a.id) ?? 0) > 0.01);
  const assetCount = assetList.length;

  // Expected return: weighted average
  for (const asset of assetList) {
    const w = weights.get(asset.id) ?? 0;
    expectedReturn += w * asset.expectedReturn;
  }

  // Variance: sum of w_i * w_j * cov_ij
  for (const a of assetList) {
    for (const b of assetList) {
      const wa = weights.get(a.id) ?? 0;
      const wb = weights.get(b.id) ?? 0;
      const corrKey = [a.id, b.id].sort().join(':');
      const corr = a.id === b.id ? 1 : (correlations.get(corrKey) ?? 0);
      variance += wa * wb * a.risk * b.risk * corr;
    }
  }

  const risk = Math.sqrt(Math.max(variance, 0));
  const sharpeRatio = risk > 0 ? expectedReturn / risk : 0;

  // Category diversification
  const categoryWeights = new Map<string, number>();
  for (const asset of assetList) {
    const w = weights.get(asset.id) ?? 0;
    categoryWeights.set(asset.category, (categoryWeights.get(asset.category) ?? 0) + w);
  }
  const catWeightArray = Array.from(categoryWeights.values());
  const diversificationScore = catWeightArray.length > 1 ? 1 - hhi(catWeightArray) : 0;

  // Verified coverage
  let verifiedWeight = 0;
  for (const asset of assetList) {
    if (asset.verified) verifiedWeight += weights.get(asset.id) ?? 0;
  }

  return {
    weights,
    expectedReturn,
    risk,
    sharpeRatio,
    assetCount,
    diversificationScore,
    verifiedCoverage: verifiedWeight,
  };
}

/**
 * Generate equal-weight portfolio.
 */
function equalWeight(assets: PortfolioAsset[]): Map<string, number> {
  const w = new Map<string, number>();
  const weight = 1 / assets.length;
  for (const a of assets) w.set(a.id, weight);
  return w;
}

/**
 * Generate quality-weighted portfolio (higher quality = higher weight).
 */
function qualityWeighted(assets: PortfolioAsset[]): Map<string, number> {
  const totalQuality = assets.reduce((s, a) => s + a.quality, 0);
  const w = new Map<string, number>();
  for (const a of assets) w.set(a.id, totalQuality > 0 ? a.quality / totalQuality : 1 / assets.length);
  return w;
}

/**
 * Generate return-weighted portfolio (higher expected return = higher weight).
 */
function returnWeighted(assets: PortfolioAsset[]): Map<string, number> {
  const filtered = assets.filter(a => a.expectedReturn > 0);
  if (filtered.length === 0) return equalWeight(assets);
  const totalReturn = filtered.reduce((s, a) => s + a.expectedReturn, 0);
  const w = new Map<string, number>();
  for (const a of assets) {
    if (a.expectedReturn > 0) {
      w.set(a.id, a.expectedReturn / totalReturn);
    } else {
      w.set(a.id, 0);
    }
  }
  return w;
}

/**
 * Generate inverse-volatility weighted portfolio (lower risk = higher weight).
 */
function riskParityWeighted(assets: PortfolioAsset[]): Map<string, number> {
  const totalInvRisk = assets.reduce((s, a) => s + 1 / a.risk, 0);
  const w = new Map<string, number>();
  for (const a of assets) w.set(a.id, (1 / a.risk) / totalInvRisk);
  return w;
}

// ── Efficient Frontier ───────────────────────────────────────────────

function generateEfficientFrontier(
  assets: PortfolioAsset[],
  correlations: Map<string, number>,
  points: number = 20,
): EfficientFrontierPoint[] {
  const frontier: EfficientFrontierPoint[] = [];

  // Generate portfolios at different risk/return levels by blending strategies
  const strategies = [
    riskParityWeighted(assets),
    qualityWeighted(assets),
    equalWeight(assets),
    returnWeighted(assets),
  ];

  // Interpolate between strategies to trace the frontier
  for (let i = 0; i <= points; i++) {
    const t = i / points; // 0 = conservative, 1 = aggressive
    const weights = new Map<string, number>();

    for (const asset of assets) {
      // Blend from risk-parity (t=0) to return-weighted (t=1)
      const conservative = strategies[0].get(asset.id) ?? 0;
      const quality = strategies[1].get(asset.id) ?? 0;
      const equal = strategies[2].get(asset.id) ?? 0;
      const aggressive = strategies[3].get(asset.id) ?? 0;

      // Custom blend curve
      let w: number;
      if (t < 0.33) {
        const lt = t / 0.33;
        w = conservative * (1 - lt) + quality * lt;
      } else if (t < 0.66) {
        const lt = (t - 0.33) / 0.33;
        w = quality * (1 - lt) + equal * lt;
      } else {
        const lt = (t - 0.66) / 0.34;
        w = equal * (1 - lt) + aggressive * lt;
      }

      weights.set(asset.id, Math.max(0, w));
    }

    // Normalize weights to sum to 1
    const totalW = Array.from(weights.values()).reduce((s, w) => s + w, 0);
    if (totalW > 0) {
      for (const [k, v] of weights) weights.set(k, v / totalW);
    }

    const stats = computePortfolioStats(assets, weights, correlations);
    frontier.push({
      risk: stats.risk,
      return_: stats.expectedReturn,
      sharpeRatio: stats.sharpeRatio,
      weights,
    });
  }

  return frontier.sort((a, b) => a.risk - b.risk);
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run full portfolio optimization analysis.
 *
 * @param startups   - All available startups
 * @param allMetrics - Map of startup ID → metrics history
 * @returns          - Complete portfolio analysis
 */
export function optimizePortfolio(
  startups: DbStartup[],
  allMetrics: Map<string, DbMetricsHistory[]>,
): PortfolioAnalysis {
  const assets = buildAssets(startups, allMetrics);

  if (assets.length === 0) {
    const emptyAllocation: PortfolioAllocation = {
      weights: new Map(), expectedReturn: 0, risk: 0, sharpeRatio: 0,
      assetCount: 0, diversificationScore: 0, verifiedCoverage: 0,
    };
    return {
      assets: [],
      efficientFrontier: [],
      minimumVariance: emptyAllocation,
      maxSharpe: emptyAllocation,
      aggressiveGrowth: emptyAllocation,
      conservative: emptyAllocation,
      correlationMatrix: [],
      computedAt: Date.now(),
    };
  }

  // Compute correlation matrix
  const correlations = new Map<string, number>();
  const correlationMatrix: { asset1: string; asset2: string; correlation: number }[] = [];

  for (let i = 0; i < assets.length; i++) {
    for (let j = i + 1; j < assets.length; j++) {
      const a = assets[i];
      const b = assets[j];
      const am = allMetrics.get(a.id) || [];
      const bm = allMetrics.get(b.id) || [];
      const aGrowth = am.map(m => Number(m.growth_rate));
      const bGrowth = bm.map(m => Number(m.growth_rate));
      const corr = correlation(aGrowth, bGrowth);
      const key = [a.id, b.id].sort().join(':');
      correlations.set(key, corr);
      correlationMatrix.push({ asset1: a.name, asset2: b.name, correlation: +corr.toFixed(3) });
    }
  }

  // Generate portfolios
  const minVarWeights = riskParityWeighted(assets);
  const minimumVariance = computePortfolioStats(assets, minVarWeights, correlations);

  const qualWeights = qualityWeighted(assets);
  const conservative = computePortfolioStats(assets, qualWeights, correlations);

  const eqWeights = equalWeight(assets);
  const maxSharpe = computePortfolioStats(assets, eqWeights, correlations);

  const retWeights = returnWeighted(assets);
  const aggressiveGrowth = computePortfolioStats(assets, retWeights, correlations);

  // Efficient frontier
  const efficientFrontier = generateEfficientFrontier(assets, correlations, 25);

  return {
    assets,
    efficientFrontier,
    minimumVariance,
    maxSharpe,
    aggressiveGrowth,
    conservative,
    correlationMatrix,
    computedAt: Date.now(),
  };
}
