/**
 * Gradient Boosting Predictor
 * ───────────────────────────
 * Client-side machine learning for startup success prediction.
 * Implements a simplified gradient boosting ensemble.
 *
 * Architecture:
 *   - Ensemble of decision stumps (depth-1 trees)
 *   - Sequential fitting: each stump corrects previous residuals
 *   - Learning rate controls contribution of each stump
 *   - Feature importance from split frequency
 *
 * Predicts: probability of reaching various milestones
 * Features: MRR, growth rate, trust score, team size, etc.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

interface DecisionStump {
  featureIndex: number;
  threshold: number;
  leftValue: number;  // Prediction if feature < threshold
  rightValue: number; // Prediction if feature >= threshold
}

export interface GBModel {
  stumps: DecisionStump[];
  learningRate: number;
  baseValue: number; // Initial prediction (mean of targets)
  featureNames: string[];
  featureImportance: { feature: string; importance: number }[];
  trainingSize: number;
  trainingError: number;
}

export interface GBPrediction {
  /** Target being predicted */
  target: string;
  /** Predicted probability (0-1) */
  probability: number;
  /** Confidence label */
  confidence: 'high' | 'medium' | 'low';
  /** Feature contributions (SHAP-like) */
  contributions: { feature: string; contribution: number; value: number; direction: 'positive' | 'negative' }[];
  /** Model used */
  modelInfo: { stumps: number; trainingSize: number; trainingError: number };
}

export interface GBReport {
  /** All predictions */
  predictions: GBPrediction[];
  /** Model health */
  modelHealth: {
    featureImportance: { feature: string; importance: number }[];
    trainingAccuracy: number;
    features: number;
    dataPoints: number;
  };
  /** Computed at */
  computedAt: number;
}

// ── Feature Extraction ───────────────────────────────────────────────

const FEATURE_NAMES = [
  'mrr_normalized', 'growth_rate', 'trust_score', 'sustainability_score',
  'whale_concentration', 'inflation_rate', 'team_size', 'treasury_normalized',
  'users_normalized', 'governance_score', 'verified',
];

function extractFeatures(startup: DbStartup): number[] {
  return [
    Math.log1p(startup.mrr) / 15, // Log-normalized MRR
    Number(startup.growth_rate) / 50, // Normalized growth
    startup.trust_score / 100,
    startup.sustainability_score / 100,
    Number(startup.whale_concentration) / 100,
    Number(startup.inflation_rate) / 20,
    Math.min(startup.team_size / 50, 1),
    Math.log1p(startup.treasury) / 18,
    Math.log1p(startup.users) / 12,
    startup.governance_score / 100,
    startup.verified ? 1 : 0,
  ];
}

// ── Gradient Boosting Implementation ─────────────────────────────────

function findBestSplit(
  features: number[][],
  residuals: number[],
  featureIndex: number,
): { threshold: number; leftValue: number; rightValue: number; error: number } {
  const n = features.length;
  const values = features.map(f => f[featureIndex]);
  const sorted = [...new Set(values)].sort((a, b) => a - b);

  let bestThreshold = sorted[0] ?? 0;
  let bestError = Infinity;
  let bestLeft = 0;
  let bestRight = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const threshold = (sorted[i] + sorted[i + 1]) / 2;

    const leftIndices: number[] = [];
    const rightIndices: number[] = [];
    for (let j = 0; j < n; j++) {
      if (values[j] < threshold) leftIndices.push(j);
      else rightIndices.push(j);
    }

    if (leftIndices.length === 0 || rightIndices.length === 0) continue;

    const leftMean = leftIndices.reduce((s, idx) => s + residuals[idx], 0) / leftIndices.length;
    const rightMean = rightIndices.reduce((s, idx) => s + residuals[idx], 0) / rightIndices.length;

    // MSE
    let error = 0;
    for (const idx of leftIndices) error += (residuals[idx] - leftMean) ** 2;
    for (const idx of rightIndices) error += (residuals[idx] - rightMean) ** 2;

    if (error < bestError) {
      bestError = error;
      bestThreshold = threshold;
      bestLeft = leftMean;
      bestRight = rightMean;
    }
  }

  return { threshold: bestThreshold, leftValue: bestLeft, rightValue: bestRight, error: bestError };
}

function trainGradientBoosting(
  features: number[][],
  targets: number[],
  numStumps: number = 50,
  learningRate: number = 0.1,
): GBModel {
  const n = features.length;
  const numFeatures = features[0]?.length ?? 0;
  const baseValue = targets.reduce((s, t) => s + t, 0) / n;

  let residuals = targets.map(t => t - baseValue);
  const stumps: DecisionStump[] = [];
  const featureSplitCount = new Array(numFeatures).fill(0);

  for (let s = 0; s < numStumps; s++) {
    let bestStump: DecisionStump | null = null;
    let bestError = Infinity;

    for (let f = 0; f < numFeatures; f++) {
      const split = findBestSplit(features, residuals, f);
      if (split.error < bestError) {
        bestError = split.error;
        bestStump = {
          featureIndex: f,
          threshold: split.threshold,
          leftValue: split.leftValue * learningRate,
          rightValue: split.rightValue * learningRate,
        };
      }
    }

    if (!bestStump) break;
    stumps.push(bestStump);
    featureSplitCount[bestStump.featureIndex]++;

    // Update residuals
    residuals = residuals.map((r, i) => {
      const prediction = features[i][bestStump!.featureIndex] < bestStump!.threshold
        ? bestStump!.leftValue
        : bestStump!.rightValue;
      return r - prediction;
    });
  }

  // Feature importance (normalized split frequency)
  const totalSplits = featureSplitCount.reduce((s, c) => s + c, 0);
  const featureImportance = FEATURE_NAMES.map((name, i) => ({
    feature: name,
    importance: totalSplits > 0 ? +(featureSplitCount[i] / totalSplits).toFixed(4) : 0,
  })).sort((a, b) => b.importance - a.importance);

  // Training error
  const predictions = features.map(f => predict(f, stumps, baseValue, learningRate));
  const trainingError = Math.sqrt(
    predictions.reduce((s, p, i) => s + (p - targets[i]) ** 2, 0) / n
  );

  return { stumps, learningRate, baseValue, featureNames: FEATURE_NAMES, featureImportance, trainingSize: n, trainingError: +trainingError.toFixed(6) };
}

function predict(features: number[], stumps: DecisionStump[], baseValue: number, learningRate: number): number {
  let prediction = baseValue;
  for (const stump of stumps) {
    prediction += features[stump.featureIndex] < stump.threshold
      ? stump.leftValue
      : stump.rightValue;
  }
  return prediction;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ── Feature Contributions ────────────────────────────────────────────

function computeContributions(
  features: number[],
  stumps: DecisionStump[],
): { feature: string; contribution: number; value: number; direction: 'positive' | 'negative' }[] {
  const contributions = new Array(FEATURE_NAMES.length).fill(0);

  for (const stump of stumps) {
    const value = features[stump.featureIndex] < stump.threshold
      ? stump.leftValue
      : stump.rightValue;
    contributions[stump.featureIndex] += value;
  }

  return FEATURE_NAMES.map((name, i) => ({
    feature: name.replace(/_normalized$/, '').replace(/_/g, ' '),
    contribution: +contributions[i].toFixed(4),
    value: +features[i].toFixed(4),
    direction: contributions[i] >= 0 ? 'positive' as const : 'negative' as const,
  }))
  .filter(c => Math.abs(c.contribution) > 0.01)
  .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Train a gradient boosting model and make predictions for a startup.
 */
export function runGradientBoosting(
  targetStartup: DbStartup,
  allStartups: DbStartup[],
): GBReport {
  if (allStartups.length < 5) {
    return { predictions: [], modelHealth: { featureImportance: [], trainingAccuracy: 0, features: 0, dataPoints: 0 }, computedAt: Date.now() };
  }

  // Extract features for all startups
  const features = allStartups.map(extractFeatures);

  // Target 1: "Will reach $100K MRR" (proxy: currently above $100K)
  const target100k = allStartups.map(s => s.mrr >= 100000 ? 1 : 0);
  const model100k = trainGradientBoosting(features, target100k, 30, 0.15);

  // Target 2: "Will maintain high growth" (proxy: growth > 15%)
  const targetGrowth = allStartups.map(s => Number(s.growth_rate) >= 15 ? 1 : 0);
  const modelGrowth = trainGradientBoosting(features, targetGrowth, 30, 0.15);

  // Target 3: "Is high quality" (proxy: trust_score > 75 && verified)
  const targetQuality = allStartups.map(s => s.trust_score >= 75 && s.verified ? 1 : 0);
  const modelQuality = trainGradientBoosting(features, targetQuality, 30, 0.15);

  // Make predictions for target startup
  const targetFeatures = extractFeatures(targetStartup);

  const predictions: GBPrediction[] = [
    {
      target: 'Reach $100K MRR',
      probability: +sigmoid(predict(targetFeatures, model100k.stumps, model100k.baseValue, model100k.learningRate)).toFixed(3),
      confidence: model100k.trainingError < 0.3 ? 'high' : model100k.trainingError < 0.5 ? 'medium' : 'low',
      contributions: computeContributions(targetFeatures, model100k.stumps),
      modelInfo: { stumps: model100k.stumps.length, trainingSize: model100k.trainingSize, trainingError: model100k.trainingError },
    },
    {
      target: 'Sustain >15% Growth',
      probability: +sigmoid(predict(targetFeatures, modelGrowth.stumps, modelGrowth.baseValue, modelGrowth.learningRate)).toFixed(3),
      confidence: modelGrowth.trainingError < 0.3 ? 'high' : 'medium',
      contributions: computeContributions(targetFeatures, modelGrowth.stumps),
      modelInfo: { stumps: modelGrowth.stumps.length, trainingSize: modelGrowth.trainingSize, trainingError: modelGrowth.trainingError },
    },
    {
      target: 'Achieve High Quality Status',
      probability: +sigmoid(predict(targetFeatures, modelQuality.stumps, modelQuality.baseValue, modelQuality.learningRate)).toFixed(3),
      confidence: modelQuality.trainingError < 0.3 ? 'high' : 'medium',
      contributions: computeContributions(targetFeatures, modelQuality.stumps),
      modelInfo: { stumps: modelQuality.stumps.length, trainingSize: modelQuality.trainingSize, trainingError: modelQuality.trainingError },
    },
  ];

  // Aggregate feature importance across all models
  const allImportance = new Map<string, number>();
  for (const model of [model100k, modelGrowth, modelQuality]) {
    for (const fi of model.featureImportance) {
      allImportance.set(fi.feature, (allImportance.get(fi.feature) ?? 0) + fi.importance);
    }
  }
  const featureImportance = Array.from(allImportance.entries())
    .map(([feature, importance]) => ({ feature: feature.replace(/_normalized$/, '').replace(/_/g, ' '), importance: +(importance / 3).toFixed(4) }))
    .sort((a, b) => b.importance - a.importance);

  return {
    predictions,
    modelHealth: {
      featureImportance,
      trainingAccuracy: +(1 - (model100k.trainingError + modelGrowth.trainingError + modelQuality.trainingError) / 3).toFixed(4),
      features: FEATURE_NAMES.length,
      dataPoints: allStartups.length,
    },
    computedAt: Date.now(),
  };
}
