/**
 * Quantitative Risk Analytics
 * ────────────────────────────
 * Wall Street-grade risk metrics adapted for startup investing.
 * The language that Goldman, Citadel, and Bridgewater speak.
 *
 * Metrics:
 *   - Value at Risk (VaR) — worst expected loss at confidence level
 *   - Conditional VaR (CVaR/Expected Shortfall) — average loss in worst cases
 *   - Sharpe Ratio — risk-adjusted return
 *   - Sortino Ratio — downside-risk-adjusted return
 *   - Calmar Ratio — return vs max drawdown
 *   - Maximum Drawdown — worst peak-to-trough decline
 *   - Beta — sensitivity to market/ecosystem movements
 *   - Alpha — excess return above benchmark
 *   - Information Ratio — consistency of alpha
 *   - Factor Decomposition — what drives returns (Fama-French style)
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface RiskMetrics {
  /** Value at Risk (95% confidence, 1-month horizon) */
  var95: number;
  /** Value at Risk (99% confidence) */
  var99: number;
  /** Conditional VaR / Expected Shortfall (95%) */
  cvar95: number;
  /** Sharpe Ratio (excess return / total volatility) */
  sharpeRatio: number;
  /** Sortino Ratio (excess return / downside volatility) */
  sortinoRatio: number;
  /** Calmar Ratio (annualized return / max drawdown) */
  calmarRatio: number;
  /** Maximum Drawdown (%) */
  maxDrawdown: number;
  /** Maximum Drawdown Duration (months) */
  maxDrawdownDuration: number;
  /** Annualized Volatility (%) */
  annualizedVolatility: number;
  /** Downside Volatility (%) — only negative returns */
  downsideVolatility: number;
  /** Beta — sensitivity to ecosystem benchmark */
  beta: number;
  /** Alpha — excess return above benchmark (annualized %) */
  alpha: number;
  /** Information Ratio — alpha / tracking error */
  informationRatio: number;
  /** Skewness — tail risk asymmetry */
  skewness: number;
  /** Kurtosis — tail fatness (excess kurtosis) */
  kurtosis: number;
  /** Risk grade */
  riskGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
}

export interface FactorExposure {
  /** Factor name */
  factor: string;
  /** Exposure (loading) — how much this factor explains returns */
  exposure: number;
  /** Factor description */
  description: string;
  /** Whether this exposure is desirable */
  desirable: boolean;
}

export interface QuantRiskReport {
  /** Core risk metrics */
  metrics: RiskMetrics;
  /** Factor decomposition */
  factors: FactorExposure[];
  /** Return distribution (for histogram) */
  returnDistribution: { bucket: string; count: number; pct: number }[];
  /** Drawdown history */
  drawdownHistory: { month: string; drawdown: number }[];
  /** Rolling metrics (3-month window) */
  rollingMetrics: { month: string; sharpe: number; volatility: number; return_: number }[];
  /** Risk-return positioning vs peers */
  peerComparison: { name: string; return_: number; risk: number; sharpe: number }[];
  /** Risk interpretation for non-quants */
  interpretation: string[];
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

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function skewness(arr: number[]): number {
  const n = arr.length;
  if (n < 3) return 0;
  const avg = mean(arr);
  const sd = stdDev(arr);
  if (sd === 0) return 0;
  const m3 = arr.reduce((s, v) => s + Math.pow((v - avg) / sd, 3), 0) / n;
  return m3 * (n * (n - 1)) / ((n - 1) * (n - 2) || 1); // Sample skewness adjustment
}

function kurtosis(arr: number[]): number {
  const n = arr.length;
  if (n < 4) return 0;
  const avg = mean(arr);
  const sd = stdDev(arr);
  if (sd === 0) return 0;
  const m4 = arr.reduce((s, v) => s + Math.pow((v - avg) / sd, 4), 0) / n;
  return m4 - 3; // Excess kurtosis (normal = 0)
}

// ── Core Calculations ────────────────────────────────────────────────

function computeReturns(metrics: DbMetricsHistory[]): number[] {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const returns: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = Number(sorted[i - 1].revenue);
    const curr = Number(sorted[i].revenue);
    if (prev > 0) returns.push((curr - prev) / prev * 100);
  }
  return returns;
}

function computeVaR(returns: number[], confidenceLevel: number): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidenceLevel / 100) * sorted.length);
  return sorted[Math.max(0, idx)] ?? 0;
}

function computeCVaR(returns: number[], confidenceLevel: number): number {
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidenceLevel / 100) * sorted.length);
  const tailReturns = sorted.slice(0, Math.max(1, cutoff));
  return mean(tailReturns);
}

function computeMaxDrawdown(returns: number[]): { maxDrawdown: number; duration: number; history: { month: number; drawdown: number }[] } {
  let peak = 100;
  let value = 100;
  let maxDD = 0;
  let maxDDDuration = 0;
  let currentDDStart = 0;
  const history: { month: number; drawdown: number }[] = [];

  for (let i = 0; i < returns.length; i++) {
    value *= (1 + returns[i] / 100);
    if (value > peak) {
      peak = value;
      currentDDStart = i;
    }
    const dd = ((peak - value) / peak) * 100;
    history.push({ month: i + 1, drawdown: -dd });
    if (dd > maxDD) {
      maxDD = dd;
      maxDDDuration = i - currentDDStart;
    }
  }

  return { maxDrawdown: maxDD, duration: maxDDDuration, history };
}

function computeBetaAlpha(
  startupReturns: number[],
  benchmarkReturns: number[],
): { beta: number; alpha: number; informationRatio: number } {
  const n = Math.min(startupReturns.length, benchmarkReturns.length);
  if (n < 3) return { beta: 1, alpha: 0, informationRatio: 0 };

  const sr = startupReturns.slice(0, n);
  const br = benchmarkReturns.slice(0, n);
  const srMean = mean(sr);
  const brMean = mean(br);

  let covariance = 0;
  let benchVariance = 0;
  for (let i = 0; i < n; i++) {
    covariance += (sr[i] - srMean) * (br[i] - brMean);
    benchVariance += (br[i] - brMean) ** 2;
  }
  covariance /= n - 1;
  benchVariance /= n - 1;

  const beta = benchVariance > 0 ? covariance / benchVariance : 1;
  const alpha = (srMean - beta * brMean) * 12; // Annualized

  // Tracking error
  const activeReturns = sr.map((r, i) => r - br[i]);
  const trackingError = stdDev(activeReturns);
  const informationRatio = trackingError > 0 ? (mean(activeReturns) * 12) / (trackingError * Math.sqrt(12)) : 0;

  return { beta: +beta.toFixed(3), alpha: +alpha.toFixed(2), informationRatio: +informationRatio.toFixed(3) };
}

function computeFactors(startup: DbStartup, metrics: DbMetricsHistory[]): FactorExposure[] {
  const growth = Number(startup.growth_rate);
  const returns = computeReturns(metrics);
  const vol = stdDev(returns);

  return [
    {
      factor: 'Growth',
      exposure: growth > 20 ? 0.85 : growth > 10 ? 0.55 : growth > 0 ? 0.25 : -0.3,
      description: 'Sensitivity to revenue growth momentum',
      desirable: true,
    },
    {
      factor: 'Quality',
      exposure: startup.trust_score > 70 ? 0.75 : startup.trust_score > 50 ? 0.4 : 0.1,
      description: 'Exposure to high-quality, verified startups',
      desirable: true,
    },
    {
      factor: 'Size',
      exposure: startup.mrr > 200000 ? 0.7 : startup.mrr > 50000 ? 0.4 : 0.15,
      description: 'Exposure to revenue scale (larger = more stable)',
      desirable: true,
    },
    {
      factor: 'Volatility',
      exposure: vol > 20 ? 0.8 : vol > 10 ? 0.5 : 0.2,
      description: 'Exposure to metric volatility (higher = riskier)',
      desirable: false,
    },
    {
      factor: 'Verification',
      exposure: startup.verified ? 0.9 : 0.1,
      description: 'On-chain verification premium',
      desirable: true,
    },
    {
      factor: 'ESG',
      exposure: startup.sustainability_score > 70 ? 0.7 : startup.sustainability_score > 40 ? 0.35 : 0.1,
      description: 'Environmental, Social, Governance alignment',
      desirable: true,
    },
    {
      factor: 'Concentration Risk',
      exposure: Number(startup.whale_concentration) > 40 ? 0.8 : Number(startup.whale_concentration) > 20 ? 0.4 : 0.1,
      description: 'Token holder concentration exposure',
      desirable: false,
    },
  ];
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate comprehensive quantitative risk analysis.
 */
export function analyzeQuantRisk(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
  allMetrics: Map<string, DbMetricsHistory[]>,
): QuantRiskReport {
  const returns = computeReturns(metrics);
  const riskFreeRate = 0.4; // Monthly risk-free rate (approx 5% annual)

  // Core metrics
  const avgReturn = mean(returns);
  const vol = stdDev(returns);
  const downsideReturns = returns.filter(r => r < 0);
  const downsideVol = stdDev(downsideReturns.length > 0 ? downsideReturns : [0]);
  const annualizedVol = vol * Math.sqrt(12);
  const annualizedReturn = avgReturn * 12;

  const sharpeRatio = vol > 0 ? (avgReturn - riskFreeRate) / vol : 0;
  const sortinoRatio = downsideVol > 0 ? (avgReturn - riskFreeRate) / downsideVol : 0;

  const dd = computeMaxDrawdown(returns);
  const calmarRatio = dd.maxDrawdown > 0 ? annualizedReturn / dd.maxDrawdown : 0;

  const var95 = computeVaR(returns, 95);
  const var99 = computeVaR(returns, 99);
  const cvar95 = computeCVaR(returns, 95);

  // Beta/Alpha vs ecosystem benchmark
  const benchmarkReturns = allStartups.map(s => {
    const m = allMetrics.get(s.id) ?? [];
    const r = computeReturns(m);
    return mean(r);
  });
  const avgBenchmark = mean(benchmarkReturns);
  const benchReturns = returns.map(() => avgBenchmark); // Simplified benchmark
  const { beta, alpha, informationRatio } = computeBetaAlpha(returns, benchReturns);

  const sk = skewness(returns);
  const kurt = kurtosis(returns);

  // Risk grade
  const riskScore = Math.max(0, 100 - annualizedVol * 1.5 - dd.maxDrawdown * 0.5 + sharpeRatio * 20);
  const riskGrade: RiskMetrics['riskGrade'] =
    riskScore >= 85 ? 'AAA' : riskScore >= 75 ? 'AA' : riskScore >= 65 ? 'A' :
    riskScore >= 55 ? 'BBB' : riskScore >= 45 ? 'BB' : riskScore >= 35 ? 'B' :
    riskScore >= 20 ? 'CCC' : 'D';

  const riskMetrics: RiskMetrics = {
    var95: +var95.toFixed(2),
    var99: +var99.toFixed(2),
    cvar95: +cvar95.toFixed(2),
    sharpeRatio: +sharpeRatio.toFixed(3),
    sortinoRatio: +sortinoRatio.toFixed(3),
    calmarRatio: +calmarRatio.toFixed(3),
    maxDrawdown: +dd.maxDrawdown.toFixed(2),
    maxDrawdownDuration: dd.duration,
    annualizedVolatility: +annualizedVol.toFixed(2),
    downsideVolatility: +(downsideVol * Math.sqrt(12)).toFixed(2),
    beta,
    alpha,
    informationRatio,
    skewness: +sk.toFixed(3),
    kurtosis: +kurt.toFixed(3),
    riskGrade,
  };

  // Factor decomposition
  const factors = computeFactors(startup, metrics);

  // Return distribution (histogram)
  const bucketSize = 5;
  const buckets = new Map<string, number>();
  for (const r of returns) {
    const bucket = Math.floor(r / bucketSize) * bucketSize;
    const label = `${bucket}% to ${bucket + bucketSize}%`;
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }
  const returnDistribution = Array.from(buckets.entries())
    .map(([bucket, count]) => ({ bucket, count, pct: +(count / returns.length * 100).toFixed(1) }))
    .sort((a, b) => parseFloat(a.bucket) - parseFloat(b.bucket));

  // Drawdown history
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const drawdownHistory = dd.history.map((h, i) => ({
    month: sorted[i + 1]?.month_date?.slice(0, 7) ?? `M${h.month}`,
    drawdown: +h.drawdown.toFixed(2),
  }));

  // Rolling metrics (3-month window)
  const rollingMetrics: { month: string; sharpe: number; volatility: number; return_: number }[] = [];
  for (let i = 2; i < returns.length; i++) {
    const window = returns.slice(i - 2, i + 1);
    const wMean = mean(window);
    const wVol = stdDev(window);
    rollingMetrics.push({
      month: sorted[i + 1]?.month_date?.slice(0, 7) ?? `M${i + 1}`,
      sharpe: wVol > 0 ? +((wMean - riskFreeRate) / wVol).toFixed(2) : 0,
      volatility: +wVol.toFixed(2),
      return_: +wMean.toFixed(2),
    });
  }

  // Peer comparison
  const peerComparison = allStartups.slice(0, 8).map(s => {
    const pReturns = computeReturns(allMetrics.get(s.id) ?? []);
    const pAvg = mean(pReturns);
    const pVol = stdDev(pReturns);
    return {
      name: s.name,
      return_: +(pAvg * 12).toFixed(1),
      risk: +(pVol * Math.sqrt(12)).toFixed(1),
      sharpe: pVol > 0 ? +((pAvg - riskFreeRate) / pVol).toFixed(2) : 0,
    };
  });

  // Interpretation for non-quants
  const interpretation: string[] = [];
  interpretation.push(`**VaR (95%):** In the worst 5% of months, revenue could decline by ${Math.abs(var95).toFixed(1)}% or more.`);
  interpretation.push(`**Sharpe Ratio:** ${sharpeRatio > 1 ? 'Excellent' : sharpeRatio > 0.5 ? 'Good' : sharpeRatio > 0 ? 'Acceptable' : 'Poor'} risk-adjusted performance (${sharpeRatio.toFixed(2)}). Above 1.0 is institutional-grade.`);
  interpretation.push(`**Max Drawdown:** The worst peak-to-trough revenue decline was ${dd.maxDrawdown.toFixed(1)}%, lasting ${dd.duration} month(s).`);
  interpretation.push(`**Beta:** ${beta > 1.2 ? 'High sensitivity' : beta > 0.8 ? 'Average sensitivity' : 'Low sensitivity'} to ecosystem movements (β=${beta.toFixed(2)}).`);
  interpretation.push(`**Alpha:** ${alpha > 0 ? 'Outperforming' : 'Underperforming'} the ecosystem benchmark by ${Math.abs(alpha).toFixed(1)}% annually.`);
  if (sk < -0.5) interpretation.push('**Negative Skew:** Left-tail risk — occasional large revenue drops are more likely than large gains.');
  if (kurt > 1) interpretation.push('**Fat Tails:** Revenue changes are more extreme than a normal distribution would predict — prepare for surprises.');

  return {
    metrics: riskMetrics,
    factors,
    returnDistribution,
    drawdownHistory,
    rollingMetrics,
    peerComparison,
    interpretation,
    computedAt: Date.now(),
  };
}
