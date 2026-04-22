/**
 * Change-Point Detection (PELT — Pruned Exact Linear Time)
 * ────────────────────────────────────────────────────────
 * Detects structural breaks in a 1-D numeric series. Useful for calling
 * out "growth stalled here" / "pivot inflection" on revenue, MAU, and
 * runway charts.
 *
 * This is a simplified-but-correct PELT with a mean-change cost function
 * (Gaussian with unit variance). The penalty parameter `beta` controls
 * sensitivity: higher beta = fewer detected change points. We default to
 * the classical BIC-style penalty `3 * log(n)` which works well on noisy
 * monthly startup metrics.
 *
 * Reference: Killick, Fearnhead, Eckley (2012) "Optimal detection of
 * changepoints with a linear computational cost."
 */

export interface ChangePoint {
  index: number;
  /** Signed magnitude of the mean shift (after - before). */
  magnitude: number;
  /** Direction for quick styling. */
  direction: 'up' | 'down';
}

export interface PeltResult {
  changePoints: ChangePoint[];
  segmentMeans: number[];
  segments: Array<{ start: number; end: number; mean: number }>;
}

/** Detect change points using PELT with a mean-change Gaussian cost. */
export function detectChangePoints(series: number[], beta?: number): PeltResult {
  const n = series.length;
  if (n < 4) {
    return {
      changePoints: [],
      segmentMeans: n > 0 ? [mean(series)] : [],
      segments: n > 0 ? [{ start: 0, end: n, mean: mean(series) }] : [],
    };
  }

  const penalty = beta ?? 3 * Math.log(n);

  // Precompute prefix sums for O(1) segment-mean cost.
  const cumSum = new Array<number>(n + 1).fill(0);
  const cumSumSq = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    cumSum[i + 1] = cumSum[i] + series[i];
    cumSumSq[i + 1] = cumSumSq[i] + series[i] * series[i];
  }

  // Cost of segment [s, e) — sum of squared deviations from the segment mean.
  const cost = (s: number, e: number): number => {
    const len = e - s;
    if (len <= 0) return 0;
    const sum = cumSum[e] - cumSum[s];
    const sumSq = cumSumSq[e] - cumSumSq[s];
    return sumSq - (sum * sum) / len;
  };

  // DP — F[t] is the optimal segmentation cost over series[0..t)
  const F = new Array<number>(n + 1).fill(Infinity);
  const backlink = new Array<number>(n + 1).fill(0);
  F[0] = -penalty;

  // Candidate set R — the pruning set that makes PELT linear-time in practice
  let R: number[] = [0];

  for (let t = 1; t <= n; t++) {
    let best = Infinity;
    let bestPrev = 0;
    for (const tau of R) {
      const candidate = F[tau] + cost(tau, t) + penalty;
      if (candidate < best) {
        best = candidate;
        bestPrev = tau;
      }
    }
    F[t] = best;
    backlink[t] = bestPrev;

    // Pruning: keep only tau where F[tau] + cost(tau, t) <= F[t]
    R = R.filter((tau) => F[tau] + cost(tau, t) <= F[t]);
    R.push(t);
  }

  // Reconstruct change points by walking backlinks
  const raw: number[] = [];
  let cursor = n;
  while (cursor > 0) {
    const prev = backlink[cursor];
    if (prev > 0) raw.push(prev);
    cursor = prev;
  }
  raw.reverse();

  // Build segments and their means
  const boundaries = [0, ...raw, n];
  const segments: Array<{ start: number; end: number; mean: number }> = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const s = boundaries[i];
    const e = boundaries[i + 1];
    segments.push({ start: s, end: e, mean: segmentMean(series, s, e) });
  }

  const changePoints: ChangePoint[] = raw.map((idx, i) => {
    const before = segments[i];
    const after = segments[i + 1];
    const magnitude = after.mean - before.mean;
    return {
      index: idx,
      magnitude: Number(magnitude.toFixed(4)),
      direction: magnitude >= 0 ? 'up' : 'down',
    };
  });

  return {
    changePoints,
    segmentMeans: segments.map((s) => s.mean),
    segments,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────
function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}
function segmentMean(xs: number[], s: number, e: number): number {
  if (e <= s) return 0;
  let sum = 0;
  for (let i = s; i < e; i++) sum += xs[i];
  return sum / (e - s);
}
