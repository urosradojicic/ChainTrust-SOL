/**
 * Advanced Benchmarking Engine
 * ────────────────────────────
 * Institutional-grade peer comparison with percentile rankings
 * across all metrics, stage-adjusted, and category-specific.
 *
 * Features:
 *   - Absolute and relative percentile ranking
 *   - Stage-adjusted benchmarks (pre-seed through growth)
 *   - Category-specific peer groups
 *   - Time-series benchmark tracking
 *   - Composite benchmark scores
 *   - Strengths/weaknesses relative to peers
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface BenchmarkMetric {
  /** Metric key */
  key: string;
  /** Display name */
  label: string;
  /** Current value */
  value: number;
  /** Formatted value */
  formattedValue: string;
  /** Percentile rank among all startups (0-100) */
  globalPercentile: number;
  /** Percentile rank within same category */
  categoryPercentile: number;
  /** Percentile rank within same stage */
  stagePercentile: number;
  /** Category average */
  categoryAvg: number;
  /** Category median */
  categoryMedian: number;
  /** Global average */
  globalAvg: number;
  /** Best in class (top startup) */
  bestInClass: { name: string; value: number };
  /** Quartile (Q1, Q2, Q3, Q4) */
  quartile: 1 | 2 | 3 | 4;
  /** Whether higher is better */
  higherIsBetter: boolean;
  /** Strength/weakness classification */
  classification: 'top_performer' | 'above_average' | 'average' | 'below_average' | 'lagging';
}

export interface BenchmarkReport {
  /** Startup being benchmarked */
  startup: DbStartup;
  /** All metric benchmarks */
  metrics: BenchmarkMetric[];
  /** Composite benchmark score (0-100) */
  compositeScore: number;
  /** Global rank (1 = best) */
  globalRank: number;
  /** Category rank */
  categoryRank: number;
  /** Total startups in comparison set */
  totalStartups: number;
  /** Category peer count */
  categoryPeerCount: number;
  /** Top strengths (metrics where startup excels) */
  strengths: BenchmarkMetric[];
  /** Key weaknesses (metrics where startup lags) */
  weaknesses: BenchmarkMetric[];
  /** Computed at */
  computedAt: number;
}

// ── Metric Definitions ───────────────────────────────────────────────

interface MetricDef {
  key: string;
  label: string;
  extract: (s: DbStartup) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
  weight: number;
}

const METRIC_DEFINITIONS: MetricDef[] = [
  { key: 'mrr', label: 'MRR', extract: s => s.mrr, format: v => `$${(v / 1000).toFixed(0)}K`, higherIsBetter: true, weight: 3 },
  { key: 'growth_rate', label: 'Growth Rate', extract: s => Number(s.growth_rate), format: v => `${v.toFixed(1)}%`, higherIsBetter: true, weight: 3 },
  { key: 'trust_score', label: 'Trust Score', extract: s => s.trust_score, format: v => `${v}/100`, higherIsBetter: true, weight: 2.5 },
  { key: 'users', label: 'Total Users', extract: s => s.users, format: v => v.toLocaleString(), higherIsBetter: true, weight: 2 },
  { key: 'sustainability', label: 'Sustainability', extract: s => s.sustainability_score, format: v => `${v}/100`, higherIsBetter: true, weight: 1.5 },
  { key: 'treasury', label: 'Treasury', extract: s => s.treasury, format: v => `$${(v / 1000000).toFixed(1)}M`, higherIsBetter: true, weight: 2 },
  { key: 'team_size', label: 'Team Size', extract: s => s.team_size, format: v => `${v}`, higherIsBetter: true, weight: 1 },
  { key: 'whale_concentration', label: 'Whale Concentration', extract: s => Number(s.whale_concentration), format: v => `${v}%`, higherIsBetter: false, weight: 1.5 },
  { key: 'inflation_rate', label: 'Inflation Rate', extract: s => Number(s.inflation_rate), format: v => `${v}%`, higherIsBetter: false, weight: 1 },
  { key: 'energy_score', label: 'Energy Efficiency', extract: s => s.energy_score, format: v => `${v}/100`, higherIsBetter: true, weight: 1 },
  { key: 'governance_score', label: 'Governance', extract: s => s.governance_score, format: v => `${v}/100`, higherIsBetter: true, weight: 1 },
  { key: 'rev_per_employee', label: 'Revenue/Employee', extract: s => s.team_size > 0 ? (s.mrr * 12) / s.team_size : 0, format: v => `$${(v / 1000).toFixed(0)}K`, higherIsBetter: true, weight: 1.5 },
];

// ── Percentile Calculation ───────────────────────────────────────────

function percentileRank(value: number, allValues: number[], higherIsBetter: boolean): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const rank = sorted.filter(v => (higherIsBetter ? v < value : v > value)).length;
  return Math.round((rank / Math.max(sorted.length - 1, 1)) * 100);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function classify(percentile: number): BenchmarkMetric['classification'] {
  if (percentile >= 80) return 'top_performer';
  if (percentile >= 60) return 'above_average';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'lagging';
}

function quartile(percentile: number): 1 | 2 | 3 | 4 {
  if (percentile >= 75) return 1;
  if (percentile >= 50) return 2;
  if (percentile >= 25) return 3;
  return 4;
}

// ── Stage Classification ─────────────────────────────────────────────

function classifyStage(startup: DbStartup): string {
  if (startup.mrr >= 500000) return 'Growth';
  if (startup.mrr >= 100000) return 'Series A';
  if (startup.mrr >= 30000) return 'Seed';
  return 'Pre-Seed';
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate a comprehensive benchmark report for a startup.
 */
export function generateBenchmarkReport(
  startup: DbStartup,
  allStartups: DbStartup[],
): BenchmarkReport {
  const categoryPeers = allStartups.filter(s => s.category === startup.category);
  const stage = classifyStage(startup);
  const stagePeers = allStartups.filter(s => classifyStage(s) === stage);

  const metrics: BenchmarkMetric[] = METRIC_DEFINITIONS.map(def => {
    const value = def.extract(startup);
    const allValues = allStartups.map(s => def.extract(s));
    const catValues = categoryPeers.map(s => def.extract(s));
    const stageValues = stagePeers.map(s => def.extract(s));

    const globalPct = percentileRank(value, allValues, def.higherIsBetter);
    const categoryPct = catValues.length > 1 ? percentileRank(value, catValues, def.higherIsBetter) : globalPct;
    const stagePct = stageValues.length > 1 ? percentileRank(value, stageValues, def.higherIsBetter) : globalPct;

    const bestIdx = def.higherIsBetter
      ? allValues.indexOf(Math.max(...allValues))
      : allValues.indexOf(Math.min(...allValues));

    return {
      key: def.key,
      label: def.label,
      value,
      formattedValue: def.format(value),
      globalPercentile: globalPct,
      categoryPercentile: categoryPct,
      stagePercentile: stagePct,
      categoryAvg: catValues.length > 0 ? catValues.reduce((s, v) => s + v, 0) / catValues.length : 0,
      categoryMedian: catValues.length > 0 ? median(catValues) : 0,
      globalAvg: allValues.reduce((s, v) => s + v, 0) / allValues.length,
      bestInClass: {
        name: bestIdx >= 0 ? allStartups[bestIdx].name : 'N/A',
        value: bestIdx >= 0 ? allValues[bestIdx] : 0,
      },
      quartile: quartile(globalPct),
      higherIsBetter: def.higherIsBetter,
      classification: classify(globalPct),
    };
  });

  // Composite score (weighted average of percentiles)
  const totalWeight = METRIC_DEFINITIONS.reduce((s, d) => s + d.weight, 0);
  const compositeScore = Math.round(
    metrics.reduce((s, m, i) => s + m.globalPercentile * METRIC_DEFINITIONS[i].weight, 0) / totalWeight
  );

  // Rankings
  const allComposites = allStartups.map(s => {
    const vals = METRIC_DEFINITIONS.map(d => {
      const val = d.extract(s);
      const all = allStartups.map(s2 => d.extract(s2));
      return percentileRank(val, all, d.higherIsBetter);
    });
    return vals.reduce((sum, v, i) => sum + v * METRIC_DEFINITIONS[i].weight, 0) / totalWeight;
  });
  const globalRank = allComposites.filter(c => c > compositeScore).length + 1;

  const catComposites = categoryPeers.map(s => {
    const vals = METRIC_DEFINITIONS.map(d => {
      const val = d.extract(s);
      const all = categoryPeers.map(s2 => d.extract(s2));
      return percentileRank(val, all, d.higherIsBetter);
    });
    return vals.reduce((sum, v, i) => sum + v * METRIC_DEFINITIONS[i].weight, 0) / totalWeight;
  });
  const ownCatScore = metrics.reduce((s, m, i) => s + m.categoryPercentile * METRIC_DEFINITIONS[i].weight, 0) / totalWeight;
  const categoryRank = catComposites.filter(c => c > ownCatScore).length + 1;

  // Strengths and weaknesses (top 3 each)
  const sortedByPercentile = [...metrics].sort((a, b) => b.globalPercentile - a.globalPercentile);
  const strengths = sortedByPercentile.filter(m => m.globalPercentile >= 60).slice(0, 3);
  const weaknesses = sortedByPercentile.filter(m => m.globalPercentile < 40).reverse().slice(0, 3);

  return {
    startup,
    metrics,
    compositeScore,
    globalRank,
    categoryRank,
    totalStartups: allStartups.length,
    categoryPeerCount: categoryPeers.length,
    strengths,
    weaknesses,
    computedAt: Date.now(),
  };
}
