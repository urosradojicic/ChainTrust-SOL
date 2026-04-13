/**
 * Bayesian Inference Engine
 * ─────────────────────────
 * Updates beliefs about startup quality as new data arrives.
 * Proper Bayesian updating — not ad-hoc rule adjustment.
 *
 * Prior: initial belief based on category averages and sector benchmarks
 * Likelihood: how likely is the observed data given the hypothesis
 * Posterior: updated belief after observing new data
 *
 * P(θ|data) ∝ P(data|θ) × P(θ)
 *
 * Applications:
 *   - "Is this startup's growth sustainable?" (with updating as new months arrive)
 *   - "What's the true MRR growth rate?" (noisy observations)
 *   - "Will they hit $100K MRR?" (predictive probability)
 *   - "Is the growth real or noise?" (signal detection)
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface BayesianBelief {
  /** What we're estimating */
  parameter: string;
  /** Prior distribution parameters */
  prior: { mean: number; variance: number; confidence: number };
  /** Likelihood parameters (from observed data) */
  likelihood: { observedMean: number; observedVariance: number; sampleSize: number };
  /** Posterior distribution parameters */
  posterior: { mean: number; variance: number; confidence: number };
  /** Credible interval (95%) */
  credibleInterval: { lower: number; upper: number };
  /** How much the data changed our belief */
  beliefShift: number;
  /** Interpretation */
  interpretation: string;
}

export interface PredictiveProbability {
  /** What we're predicting */
  event: string;
  /** Target value */
  target: number;
  /** Prior probability */
  priorProbability: number;
  /** Posterior probability (after seeing data) */
  posteriorProbability: number;
  /** Probability change */
  probabilityShift: number;
  /** Confidence in this prediction */
  confidence: number;
  /** Explanation */
  explanation: string;
}

export interface BayesianReport {
  /** All updated beliefs */
  beliefs: BayesianBelief[];
  /** Predictive probabilities for key events */
  predictions: PredictiveProbability[];
  /** Overall Bayesian confidence in startup quality */
  overallConfidence: number;
  /** Signal vs noise assessment */
  signalAssessment: {
    signalStrength: number; // 0-1
    noiseLevel: number; // 0-1
    dataQuality: 'excellent' | 'good' | 'moderate' | 'poor';
    recommendation: string;
  };
  /** Computed at */
  computedAt: number;
}

// ── Bayesian Math ────────────────────────────────────────────────────

/**
 * Normal-Normal conjugate update.
 * Prior: N(μ₀, σ₀²)
 * Likelihood: N(x̄, σ²/n)
 * Posterior: N(μ₁, σ₁²)
 *
 * μ₁ = (μ₀/σ₀² + n×x̄/σ²) / (1/σ₀² + n/σ²)
 * σ₁² = 1 / (1/σ₀² + n/σ²)
 */
function normalNormalUpdate(
  priorMean: number,
  priorVariance: number,
  observedMean: number,
  observedVariance: number,
  sampleSize: number,
): { posteriorMean: number; posteriorVariance: number } {
  if (priorVariance <= 0 || observedVariance <= 0 || sampleSize <= 0) {
    return { posteriorMean: observedMean, posteriorVariance: observedVariance };
  }

  const priorPrecision = 1 / priorVariance;
  const likelihoodPrecision = sampleSize / observedVariance;
  const posteriorPrecision = priorPrecision + likelihoodPrecision;

  const posteriorMean = (priorMean * priorPrecision + observedMean * likelihoodPrecision) / posteriorPrecision;
  const posteriorVariance = 1 / posteriorPrecision;

  return { posteriorMean, posteriorVariance };
}

/**
 * Compute probability that a normally distributed variable exceeds a threshold.
 * P(X > target) = 1 - Φ((target - μ) / σ)
 */
function probExceedsTarget(mean: number, variance: number, target: number): number {
  const sd = Math.sqrt(variance);
  if (sd === 0) return mean >= target ? 1 : 0;
  const z = (target - mean) / sd;
  // Approximation of normal CDF using error function
  return 0.5 * (1 - erf(z / Math.sqrt(2)));
}

/** Error function approximation (Abramowitz & Stegun) */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 1;
  const avg = mean(arr);
  return arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1);
}

// ── Belief Construction ──────────────────────────────────────────────

function buildGrowthBelief(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  categoryPeers: DbStartup[],
): BayesianBelief {
  // Prior: category average growth rate
  const peerGrowth = categoryPeers.map(p => Number(p.growth_rate));
  const priorMean = peerGrowth.length > 0 ? mean(peerGrowth) : 15;
  const priorVariance = peerGrowth.length > 0 ? Math.max(variance(peerGrowth), 1) : 100;

  // Likelihood: observed growth rates
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const observedGrowth = sorted.map(m => Number(m.growth_rate));
  const observedMean = observedGrowth.length > 0 ? mean(observedGrowth) : Number(startup.growth_rate);
  const observedVariance = observedGrowth.length >= 2 ? variance(observedGrowth) : priorVariance;

  // Posterior
  const { posteriorMean, posteriorVariance } = normalNormalUpdate(
    priorMean, priorVariance, observedMean, observedVariance, observedGrowth.length,
  );

  const priorSD = Math.sqrt(priorVariance);
  const posteriorSD = Math.sqrt(posteriorVariance);
  const beliefShift = Math.abs(posteriorMean - priorMean);

  return {
    parameter: 'Monthly Growth Rate (%)',
    prior: { mean: +priorMean.toFixed(2), variance: +priorVariance.toFixed(2), confidence: 0.3 },
    likelihood: { observedMean: +observedMean.toFixed(2), observedVariance: +observedVariance.toFixed(2), sampleSize: observedGrowth.length },
    posterior: { mean: +posteriorMean.toFixed(2), variance: +posteriorVariance.toFixed(2), confidence: Math.min(0.95, 0.3 + observedGrowth.length * 0.1) },
    credibleInterval: {
      lower: +(posteriorMean - 1.96 * posteriorSD).toFixed(2),
      upper: +(posteriorMean + 1.96 * posteriorSD).toFixed(2),
    },
    beliefShift: +beliefShift.toFixed(2),
    interpretation: beliefShift > priorSD
      ? `Data significantly shifted our belief. True growth is likely ${posteriorMean.toFixed(1)}% (vs prior ${priorMean.toFixed(1)}%).`
      : `Data confirms prior expectation. Growth estimate: ${posteriorMean.toFixed(1)}% (${posteriorSD.toFixed(1)}% uncertainty).`,
  };
}

function buildRevenueBelief(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  categoryPeers: DbStartup[],
): BayesianBelief {
  const peerMrr = categoryPeers.map(p => p.mrr);
  const priorMean = peerMrr.length > 0 ? mean(peerMrr) : 100000;
  const priorVariance = peerMrr.length > 0 ? Math.max(variance(peerMrr), 10000) : 1e10;

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const observedRevenues = sorted.map(m => Number(m.revenue));
  const observedMean = observedRevenues.length > 0 ? mean(observedRevenues) : startup.mrr;
  const observedVariance = observedRevenues.length >= 2 ? variance(observedRevenues) : priorVariance;

  const { posteriorMean, posteriorVariance } = normalNormalUpdate(
    priorMean, priorVariance, observedMean, observedVariance, observedRevenues.length,
  );

  const posteriorSD = Math.sqrt(posteriorVariance);
  const beliefShift = Math.abs(posteriorMean - priorMean);

  return {
    parameter: 'True Monthly Revenue ($)',
    prior: { mean: +priorMean.toFixed(0), variance: +priorVariance.toFixed(0), confidence: 0.25 },
    likelihood: { observedMean: +observedMean.toFixed(0), observedVariance: +observedVariance.toFixed(0), sampleSize: observedRevenues.length },
    posterior: { mean: +posteriorMean.toFixed(0), variance: +posteriorVariance.toFixed(0), confidence: Math.min(0.95, 0.25 + observedRevenues.length * 0.1) },
    credibleInterval: {
      lower: Math.max(0, +(posteriorMean - 1.96 * posteriorSD).toFixed(0)),
      upper: +(posteriorMean + 1.96 * posteriorSD).toFixed(0),
    },
    beliefShift: +beliefShift.toFixed(0),
    interpretation: `Bayesian estimate of true revenue: $${posteriorMean.toLocaleString()} (95% CI: $${Math.max(0, posteriorMean - 1.96 * posteriorSD).toLocaleString()} – $${(posteriorMean + 1.96 * posteriorSD).toLocaleString()}).`,
  };
}

// ── Predictive Probabilities ─────────────────────────────────────────

function buildPredictions(
  startup: DbStartup,
  beliefs: BayesianBelief[],
): PredictiveProbability[] {
  const growthBelief = beliefs.find(b => b.parameter.includes('Growth'));
  const revenueBelief = beliefs.find(b => b.parameter.includes('Revenue'));

  const predictions: PredictiveProbability[] = [];

  // Will growth exceed 15%?
  if (growthBelief) {
    const prior = probExceedsTarget(growthBelief.prior.mean, growthBelief.prior.variance, 15);
    const posterior = probExceedsTarget(growthBelief.posterior.mean, growthBelief.posterior.variance, 15);
    predictions.push({
      event: 'Growth rate exceeds 15% MoM',
      target: 15,
      priorProbability: +prior.toFixed(3),
      posteriorProbability: +posterior.toFixed(3),
      probabilityShift: +(posterior - prior).toFixed(3),
      confidence: growthBelief.posterior.confidence,
      explanation: posterior > 0.7
        ? `${(posterior * 100).toFixed(0)}% probability — data strongly supports sustained high growth`
        : posterior > 0.4
        ? `${(posterior * 100).toFixed(0)}% probability — moderate likelihood based on observed data`
        : `${(posterior * 100).toFixed(0)}% probability — data suggests growth is below this threshold`,
    });
  }

  // Will revenue exceed $100K?
  if (revenueBelief) {
    const prior = probExceedsTarget(revenueBelief.prior.mean, revenueBelief.prior.variance, 100000);
    const posterior = probExceedsTarget(revenueBelief.posterior.mean, revenueBelief.posterior.variance, 100000);
    predictions.push({
      event: 'Revenue exceeds $100K MRR',
      target: 100000,
      priorProbability: +prior.toFixed(3),
      posteriorProbability: +posterior.toFixed(3),
      probabilityShift: +(posterior - prior).toFixed(3),
      confidence: revenueBelief.posterior.confidence,
      explanation: `Based on ${revenueBelief.likelihood.sampleSize} observations, ${(posterior * 100).toFixed(0)}% probability that true MRR exceeds $100K.`,
    });
  }

  // Is the growth real (not noise)?
  if (growthBelief) {
    const realGrowthProb = probExceedsTarget(growthBelief.posterior.mean, growthBelief.posterior.variance, 0);
    predictions.push({
      event: 'Growth is genuinely positive (not noise)',
      target: 0,
      priorProbability: 0.5,
      posteriorProbability: +realGrowthProb.toFixed(3),
      probabilityShift: +(realGrowthProb - 0.5).toFixed(3),
      confidence: growthBelief.posterior.confidence,
      explanation: realGrowthProb > 0.95
        ? 'Very high confidence that growth is real — not statistical noise'
        : realGrowthProb > 0.7
        ? 'Likely real growth, but some uncertainty remains'
        : 'Cannot confidently distinguish growth from noise — more data needed',
    });
  }

  return predictions;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run complete Bayesian inference analysis.
 */
export function runBayesianInference(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): BayesianReport {
  const categoryPeers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);

  const beliefs: BayesianBelief[] = [
    buildGrowthBelief(startup, metrics, categoryPeers),
    buildRevenueBelief(startup, metrics, categoryPeers),
  ];

  const predictions = buildPredictions(startup, beliefs);

  // Overall confidence (average of posterior confidences)
  const overallConfidence = beliefs.length > 0
    ? beliefs.reduce((s, b) => s + b.posterior.confidence, 0) / beliefs.length
    : 0.5;

  // Signal vs noise assessment
  const growthBelief = beliefs[0];
  const signalStrength = growthBelief
    ? Math.min(1, Math.abs(growthBelief.posterior.mean) / Math.sqrt(growthBelief.posterior.variance))
    : 0.5;
  const noiseLevel = 1 - signalStrength;
  const dataQuality: 'excellent' | 'good' | 'moderate' | 'poor' =
    signalStrength > 0.8 ? 'excellent' : signalStrength > 0.5 ? 'good' : signalStrength > 0.3 ? 'moderate' : 'poor';

  return {
    beliefs,
    predictions,
    overallConfidence: +overallConfidence.toFixed(3),
    signalAssessment: {
      signalStrength: +signalStrength.toFixed(3),
      noiseLevel: +noiseLevel.toFixed(3),
      dataQuality,
      recommendation: dataQuality === 'excellent' || dataQuality === 'good'
        ? 'Data quality supports investment decisions. Bayesian estimates are reliable.'
        : 'Data is noisy — wait for more observations before making decisions based on these metrics.',
    },
    computedAt: Date.now(),
  };
}
