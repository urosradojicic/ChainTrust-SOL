/**
 * Isolation Forest — Anomaly Detection Algorithm
 * ─────────────────────────────────────────────────
 * Proper ML anomaly detection. Not heuristics — actual algorithm.
 *
 * How it works:
 *   1. Build random binary trees by selecting random features and split points
 *   2. Anomalies are isolated in fewer splits (shorter path length)
 *   3. Normal points require more splits to isolate
 *   4. Anomaly score = f(average path length across all trees)
 *
 * This is the same algorithm used by AWS SageMaker, Azure ML,
 * and scikit-learn for production anomaly detection.
 *
 * Adapted for startup metrics: detects startups whose metric combinations
 * are statistically unusual compared to the rest of the ecosystem.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

interface IsolationTree {
  /** Split feature index */
  featureIndex: number | null;
  /** Split value */
  splitValue: number | null;
  /** Left subtree (values < splitValue) */
  left: IsolationTree | null;
  /** Right subtree (values >= splitValue) */
  right: IsolationTree | null;
  /** Number of samples that reached this node (for leaf nodes) */
  size: number;
  /** Whether this is a leaf */
  isLeaf: boolean;
}

export interface AnomalyResult {
  /** Startup ID */
  startupId: string;
  /** Startup name */
  name: string;
  /** Anomaly score (0-1, higher = more anomalous) */
  anomalyScore: number;
  /** Whether classified as anomaly (score > threshold) */
  isAnomaly: boolean;
  /** Average path length across all trees */
  avgPathLength: number;
  /** Expected path length for dataset size */
  expectedPathLength: number;
  /** Which features contributed most to anomaly score */
  contributingFeatures: { feature: string; value: number; zScore: number }[];
  /** Interpretation */
  interpretation: string;
}

export interface IsolationForestResult {
  /** All results sorted by anomaly score */
  results: AnomalyResult[];
  /** Number of detected anomalies */
  anomalyCount: number;
  /** Anomaly threshold used */
  threshold: number;
  /** Forest parameters */
  params: { trees: number; sampleSize: number; features: string[] };
  /** Model accuracy estimate */
  modelHealth: { avgTreeDepth: number; featureImportance: { feature: string; importance: number }[] };
  /** Computed at */
  computedAt: number;
}

// ── Feature Extraction ───────────────────────────────────────────────

const FEATURE_NAMES = [
  'mrr', 'growth_rate', 'trust_score', 'sustainability_score',
  'whale_concentration', 'inflation_rate', 'team_size', 'treasury',
  'users', 'energy_score', 'governance_score',
];

function extractFeatures(startup: DbStartup): number[] {
  return [
    startup.mrr,
    Number(startup.growth_rate),
    startup.trust_score,
    startup.sustainability_score,
    Number(startup.whale_concentration),
    Number(startup.inflation_rate),
    startup.team_size,
    startup.treasury,
    startup.users,
    startup.energy_score,
    startup.governance_score,
  ];
}

// ── Isolation Tree Construction ──────────────────────────────────────

function harmonicNumber(n: number): number {
  return Math.log(n) + 0.5772156649; // Euler-Mascheroni constant
}

/**
 * Expected path length for a BST with n samples.
 * c(n) = 2 * H(n-1) - 2(n-1)/n
 */
function expectedPathLength(n: number): number {
  if (n <= 1) return 0;
  if (n === 2) return 1;
  return 2 * harmonicNumber(n - 1) - (2 * (n - 1)) / n;
}

/**
 * Build a single isolation tree.
 */
function buildTree(
  data: number[][],
  currentDepth: number,
  maxDepth: number,
): IsolationTree {
  const n = data.length;

  // Leaf conditions
  if (currentDepth >= maxDepth || n <= 1) {
    return { featureIndex: null, splitValue: null, left: null, right: null, size: n, isLeaf: true };
  }

  // Random feature selection
  const numFeatures = data[0]?.length ?? 0;
  if (numFeatures === 0) {
    return { featureIndex: null, splitValue: null, left: null, right: null, size: n, isLeaf: true };
  }

  const featureIndex = Math.floor(Math.random() * numFeatures);

  // Get min/max for this feature
  const values = data.map(row => row[featureIndex]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return { featureIndex: null, splitValue: null, left: null, right: null, size: n, isLeaf: true };
  }

  // Random split point between min and max
  const splitValue = min + Math.random() * (max - min);

  // Partition data
  const leftData = data.filter(row => row[featureIndex] < splitValue);
  const rightData = data.filter(row => row[featureIndex] >= splitValue);

  return {
    featureIndex,
    splitValue,
    left: buildTree(leftData, currentDepth + 1, maxDepth),
    right: buildTree(rightData, currentDepth + 1, maxDepth),
    size: n,
    isLeaf: false,
  };
}

/**
 * Compute path length for a single data point in a tree.
 */
function pathLength(point: number[], tree: IsolationTree, currentDepth: number = 0): number {
  if (tree.isLeaf) {
    // Add expected path length for remaining data at this leaf
    return currentDepth + expectedPathLength(tree.size);
  }

  if (tree.featureIndex === null || tree.splitValue === null) {
    return currentDepth;
  }

  if (point[tree.featureIndex] < tree.splitValue) {
    return pathLength(point, tree.left!, currentDepth + 1);
  } else {
    return pathLength(point, tree.right!, currentDepth + 1);
  }
}

// ── Forest Construction & Scoring ────────────────────────────────────

/**
 * Build an isolation forest.
 */
function buildForest(
  data: number[][],
  numTrees: number = 100,
  sampleSize: number = 256,
): IsolationTree[] {
  const maxDepth = Math.ceil(Math.log2(Math.max(sampleSize, 2)));
  const trees: IsolationTree[] = [];

  for (let t = 0; t < numTrees; t++) {
    // Subsample
    const sample: number[][] = [];
    const actualSampleSize = Math.min(sampleSize, data.length);
    const indices = new Set<number>();
    while (indices.size < actualSampleSize) {
      indices.add(Math.floor(Math.random() * data.length));
    }
    for (const idx of indices) {
      sample.push(data[idx]);
    }

    trees.push(buildTree(sample, 0, maxDepth));
  }

  return trees;
}

/**
 * Score a data point using the forest.
 * Anomaly score s(x, n) = 2^(-E(h(x)) / c(n))
 * where E(h(x)) = average path length, c(n) = expected path length
 */
function anomalyScore(point: number[], forest: IsolationTree[], dataSize: number): number {
  const avgPath = forest.reduce((sum, tree) => sum + pathLength(point, tree), 0) / forest.length;
  const c = expectedPathLength(dataSize);

  if (c === 0) return 0.5; // Edge case
  return Math.pow(2, -avgPath / c);
}

// ── Feature Contribution ─────────────────────────────────────────────

function computeFeatureContributions(
  point: number[],
  allData: number[][],
): { feature: string; value: number; zScore: number }[] {
  return FEATURE_NAMES.map((name, i) => {
    const values = allData.map(row => row[i]);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    const zScore = std > 0 ? (point[i] - mean) / std : 0;

    return { feature: name, value: point[i], zScore: +zScore.toFixed(3) };
  })
  .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run Isolation Forest anomaly detection on all startups.
 *
 * @param startups   - All startups to analyze
 * @param numTrees   - Number of trees (default 100)
 * @param threshold  - Anomaly score threshold (default 0.6)
 * @returns          - Complete anomaly detection results
 */
export function detectAnomalies(
  startups: DbStartup[],
  numTrees: number = 100,
  threshold: number = 0.6,
): IsolationForestResult {
  if (startups.length < 3) {
    return {
      results: [],
      anomalyCount: 0,
      threshold,
      params: { trees: numTrees, sampleSize: 0, features: FEATURE_NAMES },
      modelHealth: { avgTreeDepth: 0, featureImportance: [] },
      computedAt: Date.now(),
    };
  }

  // Extract feature matrix
  const data = startups.map(extractFeatures);

  // Normalize features (z-score normalization)
  const numFeatures = FEATURE_NAMES.length;
  const means: number[] = [];
  const stds: number[] = [];
  for (let f = 0; f < numFeatures; f++) {
    const values = data.map(row => row[f]);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length) || 1;
    means.push(mean);
    stds.push(std);
  }

  const normalizedData = data.map(row =>
    row.map((val, f) => (val - means[f]) / stds[f])
  );

  // Build forest
  const sampleSize = Math.min(256, startups.length);
  const forest = buildForest(normalizedData, numTrees, sampleSize);

  // Score all startups
  const expPathLen = expectedPathLength(startups.length);
  const results: AnomalyResult[] = startups.map((startup, i) => {
    const score = anomalyScore(normalizedData[i], forest, startups.length);
    const avgPath = forest.reduce((sum, tree) => sum + pathLength(normalizedData[i], tree), 0) / forest.length;
    const contributions = computeFeatureContributions(data[i], data);
    const topAnomalous = contributions.filter(c => Math.abs(c.zScore) > 1.5);

    let interpretation: string;
    if (score > 0.7) {
      interpretation = `Highly anomalous (score: ${(score * 100).toFixed(0)}%). ${topAnomalous.length > 0 ? `Unusual values in: ${topAnomalous.slice(0, 3).map(c => `${c.feature} (z=${c.zScore})`).join(', ')}` : 'Multiple metric combinations are unusual.'}`;
    } else if (score > threshold) {
      interpretation = `Moderately anomalous (score: ${(score * 100).toFixed(0)}%). Some metric combinations are unusual compared to peers.`;
    } else {
      interpretation = `Normal (score: ${(score * 100).toFixed(0)}%). Metrics are consistent with the ecosystem.`;
    }

    return {
      startupId: startup.id,
      name: startup.name,
      anomalyScore: +score.toFixed(4),
      isAnomaly: score > threshold,
      avgPathLength: +avgPath.toFixed(2),
      expectedPathLength: +expPathLen.toFixed(2),
      contributingFeatures: contributions.slice(0, 5),
      interpretation,
    };
  }).sort((a, b) => b.anomalyScore - a.anomalyScore);

  // Feature importance (based on how often each feature appears in top contributors)
  const featureImportanceMap = new Map<string, number>();
  for (const result of results.filter(r => r.isAnomaly)) {
    for (const contrib of result.contributingFeatures.slice(0, 3)) {
      featureImportanceMap.set(contrib.feature, (featureImportanceMap.get(contrib.feature) ?? 0) + 1);
    }
  }
  const anomalyCount = results.filter(r => r.isAnomaly).length;
  const featureImportance = Array.from(featureImportanceMap.entries())
    .map(([feature, count]) => ({
      feature,
      importance: anomalyCount > 0 ? +(count / anomalyCount).toFixed(3) : 0,
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    results,
    anomalyCount,
    threshold,
    params: { trees: numTrees, sampleSize, features: FEATURE_NAMES },
    modelHealth: {
      avgTreeDepth: Math.ceil(Math.log2(sampleSize)),
      featureImportance,
    },
    computedAt: Date.now(),
  };
}
