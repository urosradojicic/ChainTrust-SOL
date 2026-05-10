/**
 * Ensemble Voting
 * ───────────────
 * Weighted blend of multiple model predictions with calibration. Designed
 * for when we have several disagreeing scorers — gradient boosting,
 * isolation forest, Bayesian predictor, rule-based — and want a single
 * calibrated score with a confidence estimate.
 *
 * This is not "stacking" (no meta-model trained on out-of-fold predictions)
 * — it's a weighted mean with variance-based confidence, which is what
 * matters for institutional explainability.
 */

export interface ModelPrediction {
  name: string;
  /** Predicted value in the same units as the target (e.g. 0-100 trust score). */
  prediction: number;
  /** Weight — higher = more trusted. Will be normalized. */
  weight?: number;
  /** Optional per-model confidence in [0,1]. */
  confidence?: number;
}

export interface EnsembleResult {
  prediction: number;
  /** Std-dev across models. Lower = higher agreement. */
  dispersion: number;
  /** Combined confidence in [0,1]. */
  confidence: number;
  /** Per-model contribution (weight × prediction). */
  contributions: Array<{ name: string; prediction: number; weight: number; delta: number }>;
  /** Whether models agreed directionally (all above or below the mean). */
  unanimous: boolean;
}

/** Produce a weighted ensemble prediction. */
export function ensemble(predictions: ModelPrediction[]): EnsembleResult {
  if (predictions.length === 0) {
    return {
      prediction: 0,
      dispersion: 0,
      confidence: 0,
      contributions: [],
      unanimous: true,
    };
  }

  // Normalize weights, defaulting to 1 each.
  const rawWeights = predictions.map((p) => Math.max(0, p.weight ?? 1));
  const weightSum = rawWeights.reduce((s, w) => s + w, 0) || 1;
  const weights = rawWeights.map((w) => w / weightSum);

  // Weighted mean
  const prediction = predictions.reduce(
    (sum, p, i) => sum + p.prediction * weights[i],
    0,
  );

  // Weighted std-dev
  const variance = predictions.reduce(
    (sum, p, i) => sum + weights[i] * (p.prediction - prediction) ** 2,
    0,
  );
  const dispersion = Math.sqrt(variance);

  // Confidence: product of per-model confidence (default 0.8) dampened by dispersion.
  // Large dispersion should drag confidence down sharply.
  const avgConf =
    predictions.reduce((s, p) => s + (p.confidence ?? 0.8), 0) / predictions.length;
  const range = Math.max(...predictions.map((p) => p.prediction)) - Math.min(...predictions.map((p) => p.prediction));
  // Use a scale-aware dispersion penalty (dispersion relative to prediction magnitude + 1)
  const dispersionPenalty = Math.min(0.6, dispersion / (Math.abs(prediction) + 1 + range * 0.01));
  const confidence = Math.max(0, Math.min(1, avgConf * (1 - dispersionPenalty)));

  // Direction agreement: all models on the same side of the mean?
  const above = predictions.filter((p) => p.prediction > prediction).length;
  const below = predictions.filter((p) => p.prediction < prediction).length;
  const unanimous = above === 0 || below === 0;

  const contributions = predictions.map((p, i) => ({
    name: p.name,
    prediction: Number(p.prediction.toFixed(4)),
    weight: Number(weights[i].toFixed(4)),
    delta: Number((p.prediction - prediction).toFixed(4)),
  }));

  return {
    prediction: Number(prediction.toFixed(4)),
    dispersion: Number(dispersion.toFixed(4)),
    confidence: Number(confidence.toFixed(4)),
    contributions,
    unanimous,
  };
}
