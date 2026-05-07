/**
 * SHAP-like feature attribution via Shapley sampling
 * ───────────────────────────────────────────────────
 * Approximates per-feature contributions for any black-box scoring function
 * with numeric inputs. Uses permutation sampling (Strumbelj-Kononenko 2014)
 * — sample random feature orderings, compute marginal contributions, average.
 *
 * Not as exact as Tree SHAP, but works generically against any scoring
 * function and runs in pure JS. Expensive: O(samples × features) scoring
 * calls. We cap at 20 samples for UI-speed.
 *
 * Usage: pass the scoring function + feature names + current feature values
 * + a reasonable "baseline" (category medians work well). Returns signed
 * contributions that sum approximately to (score - baselineScore).
 */

export interface FeatureAttribution {
  feature: string;
  value: number;
  contribution: number;    // signed — positive pushes score up, negative pulls down
  pctOfTotal: number;       // |contribution| / total |contribution|, 0..1
}

export interface ShapResult {
  score: number;
  baselineScore: number;
  total: number;            // score - baselineScore
  attributions: FeatureAttribution[];
}

export interface ShapConfig {
  samples?: number;          // number of random permutations (default 20)
  seed?: number;             // deterministic shuffling for reproducibility
}

/** Deterministic PRNG — small mulberry32. */
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle in-place. */
function shuffle<T>(arr: T[], random: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * Compute approximate Shapley contributions.
 *
 * @param scoreFn     Function mapping a feature vector to a scalar score.
 * @param values      Current feature values.
 * @param baseline    Reference values (what the player contributes *from*).
 * @param featureNames Labels, same length as values.
 */
export function explainWithShap(
  scoreFn: (x: number[]) => number,
  values: number[],
  baseline: number[],
  featureNames: string[],
  config: ShapConfig = {},
): ShapResult {
  const samples = Math.max(4, Math.min(config.samples ?? 20, 200));
  const n = values.length;
  if (n === 0) {
    return { score: 0, baselineScore: 0, total: 0, attributions: [] };
  }
  if (baseline.length !== n || featureNames.length !== n) {
    throw new Error('shap: values, baseline, featureNames must be same length');
  }

  const rng = prng(config.seed ?? 1);
  const contribSums = new Array<number>(n).fill(0);

  for (let s = 0; s < samples; s++) {
    const order = Array.from({ length: n }, (_, i) => i);
    shuffle(order, rng);

    // Walk through the permutation, swapping features from baseline -> actual
    // one at a time. Each feature's marginal contribution = score_with − score_without.
    const current = baseline.slice();
    let prevScore = scoreFn(current);
    for (const idx of order) {
      current[idx] = values[idx];
      const nextScore = scoreFn(current);
      contribSums[idx] += nextScore - prevScore;
      prevScore = nextScore;
    }
  }

  const contributions = contribSums.map((s) => s / samples);
  const score = scoreFn(values);
  const baselineScore = scoreFn(baseline);
  const total = score - baselineScore;

  const totalAbs = contributions.reduce((s, c) => s + Math.abs(c), 0) || 1;
  const attributions: FeatureAttribution[] = contributions
    .map((c, i) => ({
      feature: featureNames[i],
      value: values[i],
      contribution: Number(c.toFixed(4)),
      pctOfTotal: Number((Math.abs(c) / totalAbs).toFixed(4)),
    }))
    // Sort most-influential first regardless of sign for readable waterfalls
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    score: Number(score.toFixed(4)),
    baselineScore: Number(baselineScore.toFixed(4)),
    total: Number(total.toFixed(4)),
    attributions,
  };
}
