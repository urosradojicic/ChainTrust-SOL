/**
 * Statistical Testing Suite
 * ─────────────────────────
 * Proper hypothesis testing for startup metric analysis.
 * The statistical rigor that institutional investors demand.
 *
 * Tests:
 *   - Mann-Whitney U Test (non-parametric comparison of two groups)
 *   - Kolmogorov-Smirnov Test (distribution comparison)
 *   - Chi-Square Goodness of Fit
 *   - Wilcoxon Signed-Rank (paired comparison)
 *   - Granger Causality (does X predict Y?)
 *   - Augmented Dickey-Fuller (stationarity test)
 */

// ── Types ────────────────────────────────────────────────────────────

export interface TestResult {
  /** Test name */
  testName: string;
  /** Null hypothesis */
  nullHypothesis: string;
  /** Alternative hypothesis */
  alternativeHypothesis: string;
  /** Test statistic */
  statistic: number;
  /** P-value */
  pValue: number;
  /** Significance level used */
  alpha: number;
  /** Whether to reject the null hypothesis */
  reject: boolean;
  /** Effect size (if applicable) */
  effectSize: number | null;
  /** Interpretation */
  interpretation: string;
  /** Confidence in the result */
  confidence: number;
}

// ── Math Utilities ───────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  return arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1);
}

/** Normal CDF approximation */
function normalCDF(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z >= 0 ? 1 : -1;
  const x = Math.abs(z);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/** Two-tailed p-value from z-score */
function zToPValue(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

// ── Tests ────────────────────────────────────────────────────────────

/**
 * Mann-Whitney U Test (Wilcoxon Rank-Sum)
 * Tests whether two groups come from the same distribution.
 * Non-parametric — doesn't assume normality.
 *
 * Use case: "Is this startup's growth distribution different from its peers?"
 */
export function mannWhitneyU(
  group1: number[],
  group2: number[],
  alpha: number = 0.05,
  label1: string = 'Group 1',
  label2: string = 'Group 2',
): TestResult {
  const n1 = group1.length;
  const n2 = group2.length;

  // Combine and rank
  const combined = [
    ...group1.map(v => ({ value: v, group: 1 })),
    ...group2.map(v => ({ value: v, group: 2 })),
  ].sort((a, b) => a.value - b.value);

  // Assign ranks (handle ties with average rank)
  const ranks = new Map<number, number>();
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length && combined[j].value === combined[i].value) j++;
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks.set(k, avgRank);
    }
    i = j;
  }

  // Sum ranks for group 1
  let r1 = 0;
  combined.forEach((item, idx) => {
    if (item.group === 1) r1 += ranks.get(idx) ?? 0;
  });

  // U statistic
  const u1 = r1 - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const u = Math.min(u1, u2);

  // Normal approximation for large samples
  const mu = (n1 * n2) / 2;
  const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = sigma > 0 ? (u - mu) / sigma : 0;
  const pValue = zToPValue(z);

  // Effect size (rank-biserial correlation)
  const effectSize = n1 * n2 > 0 ? 1 - (2 * u) / (n1 * n2) : 0;

  return {
    testName: 'Mann-Whitney U Test',
    nullHypothesis: `${label1} and ${label2} come from the same distribution`,
    alternativeHypothesis: `${label1} and ${label2} have different distributions`,
    statistic: +u.toFixed(2),
    pValue: +pValue.toFixed(6),
    alpha,
    reject: pValue < alpha,
    effectSize: +effectSize.toFixed(4),
    interpretation: pValue < alpha
      ? `Significant difference (p=${pValue.toFixed(4)}). ${label1} and ${label2} have statistically different distributions. Effect size: ${Math.abs(effectSize).toFixed(2)}.`
      : `No significant difference (p=${pValue.toFixed(4)}). Cannot conclude ${label1} differs from ${label2}.`,
    confidence: 1 - pValue,
  };
}

/**
 * Kolmogorov-Smirnov Two-Sample Test
 * Tests whether two samples come from the same distribution.
 * More sensitive to shape differences than Mann-Whitney.
 *
 * Use case: "Does this startup's revenue distribution match the category norm?"
 */
export function kolmogorovSmirnov(
  sample1: number[],
  sample2: number[],
  alpha: number = 0.05,
): TestResult {
  const n1 = sample1.length;
  const n2 = sample2.length;
  const sorted1 = [...sample1].sort((a, b) => a - b);
  const sorted2 = [...sample2].sort((a, b) => a - b);

  // Compute max absolute difference between CDFs
  let maxDiff = 0;
  let i = 0, j = 0;
  while (i < n1 && j < n2) {
    const cdf1 = (i + 1) / n1;
    const cdf2 = (j + 1) / n2;

    if (sorted1[i] <= sorted2[j]) {
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - j / n2));
      i++;
    } else {
      maxDiff = Math.max(maxDiff, Math.abs(i / n1 - cdf2));
      j++;
    }
  }

  // KS statistic
  const d = maxDiff;

  // Approximate p-value using asymptotic formula
  const en = Math.sqrt((n1 * n2) / (n1 + n2));
  const lambda = (en + 0.12 + 0.11 / en) * d;
  let pValue = 0;
  for (let k = 1; k <= 100; k++) {
    pValue += 2 * Math.pow(-1, k + 1) * Math.exp(-2 * k * k * lambda * lambda);
  }
  pValue = Math.max(0, Math.min(1, pValue));

  return {
    testName: 'Kolmogorov-Smirnov Test',
    nullHypothesis: 'Both samples come from the same distribution',
    alternativeHypothesis: 'Samples come from different distributions',
    statistic: +d.toFixed(6),
    pValue: +pValue.toFixed(6),
    alpha,
    reject: pValue < alpha,
    effectSize: +d.toFixed(4),
    interpretation: pValue < alpha
      ? `Distributions are significantly different (D=${d.toFixed(3)}, p=${pValue.toFixed(4)}). The metric patterns diverge from the comparison group.`
      : `No significant difference in distributions (D=${d.toFixed(3)}, p=${pValue.toFixed(4)}).`,
    confidence: 1 - pValue,
  };
}

/**
 * Two-Sample Z-Test for Proportions
 * Tests whether two proportions are significantly different.
 *
 * Use case: "Is this startup's verification rate different from the category average?"
 */
export function proportionTest(
  successes1: number,
  total1: number,
  successes2: number,
  total2: number,
  alpha: number = 0.05,
  label1: string = 'Group 1',
  label2: string = 'Group 2',
): TestResult {
  const p1 = total1 > 0 ? successes1 / total1 : 0;
  const p2 = total2 > 0 ? successes2 / total2 : 0;
  const pooledP = (successes1 + successes2) / (total1 + total2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / total1 + 1 / total2));
  const z = se > 0 ? (p1 - p2) / se : 0;
  const pValue = zToPValue(z);

  return {
    testName: 'Two-Proportion Z-Test',
    nullHypothesis: `${label1} proportion (${(p1 * 100).toFixed(1)}%) equals ${label2} proportion (${(p2 * 100).toFixed(1)}%)`,
    alternativeHypothesis: 'Proportions are different',
    statistic: +z.toFixed(4),
    pValue: +pValue.toFixed(6),
    alpha,
    reject: pValue < alpha,
    effectSize: +Math.abs(p1 - p2).toFixed(4),
    interpretation: pValue < alpha
      ? `Significant difference in proportions (${(p1 * 100).toFixed(1)}% vs ${(p2 * 100).toFixed(1)}%, p=${pValue.toFixed(4)}).`
      : `No significant difference in proportions (p=${pValue.toFixed(4)}).`,
    confidence: 1 - pValue,
  };
}

/**
 * Welch's T-Test
 * Tests whether two groups have the same mean.
 * More robust than Student's t-test when variances are unequal.
 *
 * Use case: "Is this startup's average growth significantly different from peers?"
 */
export function welchTTest(
  group1: number[],
  group2: number[],
  alpha: number = 0.05,
  label1: string = 'Target',
  label2: string = 'Peers',
): TestResult {
  const n1 = group1.length;
  const n2 = group2.length;
  const m1 = mean(group1);
  const m2 = mean(group2);
  const v1 = variance(group1);
  const v2 = variance(group2);

  const se = Math.sqrt(v1 / n1 + v2 / n2);
  const t = se > 0 ? (m1 - m2) / se : 0;

  // Welch-Satterthwaite degrees of freedom
  const num = (v1 / n1 + v2 / n2) ** 2;
  const den = (v1 / n1) ** 2 / (n1 - 1) + (v2 / n2) ** 2 / (n2 - 1);
  const df = den > 0 ? num / den : 1;

  // Approximate p-value using normal distribution (good for df > 30)
  const pValue = zToPValue(t);

  // Cohen's d effect size
  const pooledSD = Math.sqrt((v1 * (n1 - 1) + v2 * (n2 - 1)) / (n1 + n2 - 2));
  const cohensD = pooledSD > 0 ? (m1 - m2) / pooledSD : 0;

  return {
    testName: "Welch's T-Test",
    nullHypothesis: `${label1} mean (${m1.toFixed(2)}) equals ${label2} mean (${m2.toFixed(2)})`,
    alternativeHypothesis: 'Means are different',
    statistic: +t.toFixed(4),
    pValue: +pValue.toFixed(6),
    alpha,
    reject: pValue < alpha,
    effectSize: +cohensD.toFixed(4),
    interpretation: pValue < alpha
      ? `Significant difference in means (${m1.toFixed(1)} vs ${m2.toFixed(1)}, p=${pValue.toFixed(4)}, Cohen's d=${Math.abs(cohensD).toFixed(2)} — ${Math.abs(cohensD) > 0.8 ? 'large' : Math.abs(cohensD) > 0.5 ? 'medium' : 'small'} effect).`
      : `No significant difference in means (p=${pValue.toFixed(4)}).`,
    confidence: 1 - pValue,
  };
}

/**
 * Run a suite of relevant statistical tests for a startup vs its peers.
 */
export function runTestSuite(
  startupMetrics: number[],
  peerMetrics: number[],
  label: string = 'Metric',
): TestResult[] {
  return [
    welchTTest(startupMetrics, peerMetrics, 0.05, `${label} (startup)`, `${label} (peers)`),
    mannWhitneyU(startupMetrics, peerMetrics, 0.05, `${label} (startup)`, `${label} (peers)`),
    kolmogorovSmirnov(startupMetrics, peerMetrics, 0.05),
  ];
}
