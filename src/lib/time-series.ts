/**
 * Time-Series Decomposition Engine
 * ─────────────────────────────────
 * Separates metric time-series into trend, seasonality, and noise.
 * What quant funds use to separate signal from noise.
 *
 * Methods:
 *   - Moving average decomposition (trend extraction)
 *   - Seasonal decomposition (periodic patterns)
 *   - Noise isolation (random component)
 *   - Trend strength (R² of linear fit)
 *   - Changepoint detection (structural breaks)
 *   - Signal-to-noise ratio
 */

import type { DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface DecomposedSeries {
  /** Original values */
  original: number[];
  /** Trend component (long-term direction) */
  trend: number[];
  /** Seasonal component (periodic patterns) */
  seasonal: number[];
  /** Residual/noise component */
  residual: number[];
  /** Month labels */
  labels: string[];
}

export interface TrendAnalysis {
  /** Linear slope (per month) */
  slope: number;
  /** Intercept */
  intercept: number;
  /** R² (goodness of fit, 0-1) */
  rSquared: number;
  /** Trend direction */
  direction: 'strong_up' | 'up' | 'flat' | 'down' | 'strong_down';
  /** Trend strength (0-1) */
  strength: number;
  /** Projected value at +6 months */
  projection6m: number;
  /** Projected value at +12 months */
  projection12m: number;
}

export interface Changepoint {
  /** Month index where change occurred */
  index: number;
  /** Month label */
  label: string;
  /** Type of change */
  type: 'acceleration' | 'deceleration' | 'reversal' | 'level_shift';
  /** Magnitude of change */
  magnitude: number;
  /** Confidence (0-1) */
  confidence: number;
  /** Description */
  description: string;
}

export interface SignalQuality {
  /** Signal-to-noise ratio (higher = cleaner data) */
  snr: number;
  /** SNR quality assessment */
  quality: 'excellent' | 'good' | 'moderate' | 'noisy' | 'very_noisy';
  /** Autocorrelation (lag-1) — how predictable is the next value? */
  autocorrelation: number;
  /** Stationarity assessment */
  stationarity: 'stationary' | 'trend_stationary' | 'non_stationary';
  /** Predictability score (0-100) */
  predictability: number;
}

export interface TimeSeriesReport {
  /** Metric analyzed */
  metric: string;
  /** Decomposed series */
  decomposition: DecomposedSeries;
  /** Trend analysis */
  trend: TrendAnalysis;
  /** Detected changepoints */
  changepoints: Changepoint[];
  /** Signal quality */
  signalQuality: SignalQuality;
  /** Forecast (next 6 months with confidence intervals) */
  forecast: { month: number; label: string; predicted: number; lower: number; upper: number }[];
  /** Key insights */
  insights: string[];
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

/**
 * Simple moving average with specified window.
 */
function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, i + Math.ceil(window / 2));
    const slice = data.slice(start, end);
    result.push(mean(slice));
  }
  return result;
}

/**
 * Linear regression: y = slope * x + intercept
 */
function linearRegression(y: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, rSquared: 0 };

  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(x);
  const yMean = mean(y);

  let ssXY = 0, ssXX = 0, ssYY = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (x[i] - xMean) * (y[i] - yMean);
    ssXX += (x[i] - xMean) ** 2;
    ssYY += (y[i] - yMean) ** 2;
  }

  const slope = ssXX > 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;
  const rSquared = ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;

  return { slope, intercept, rSquared };
}

/**
 * Autocorrelation at lag 1.
 */
function autocorrelation(data: number[]): number {
  if (data.length < 3) return 0;
  const avg = mean(data);
  let num = 0, den = 0;
  for (let i = 1; i < data.length; i++) {
    num += (data[i] - avg) * (data[i - 1] - avg);
    den += (data[i] - avg) ** 2;
  }
  return den > 0 ? num / den : 0;
}

// ── Decomposition ────────────────────────────────────────────────────

function decompose(values: number[], labels: string[], window: number = 3): DecomposedSeries {
  // Trend: moving average
  const trend = movingAverage(values, window);

  // Detrended: original - trend
  const detrended = values.map((v, i) => v - trend[i]);

  // Seasonal: average of detrended values at same position (simplified)
  // For monthly data, look for patterns
  const seasonal = detrended.map(() => 0); // Simplified: no clear seasonal pattern in startup data

  // Residual: original - trend - seasonal
  const residual = values.map((v, i) => v - trend[i] - seasonal[i]);

  return { original: values, trend, seasonal, residual, labels };
}

// ── Changepoint Detection ────────────────────────────────────────────

function detectChangepoints(values: number[], labels: string[]): Changepoint[] {
  const changepoints: Changepoint[] = [];
  if (values.length < 4) return changepoints;

  for (let i = 2; i < values.length - 1; i++) {
    const before = values.slice(Math.max(0, i - 2), i);
    const after = values.slice(i, Math.min(values.length, i + 2));
    const beforeMean = mean(before);
    const afterMean = mean(after);
    const beforeSlope = before.length >= 2 ? before[before.length - 1] - before[0] : 0;
    const afterSlope = after.length >= 2 ? after[after.length - 1] - after[0] : 0;

    const levelChange = Math.abs(afterMean - beforeMean) / Math.max(Math.abs(beforeMean), 1);
    const slopeChange = afterSlope - beforeSlope;

    if (levelChange > 0.3) {
      let type: Changepoint['type'] = 'level_shift';
      if (beforeSlope > 0 && afterSlope > beforeSlope * 1.5) type = 'acceleration';
      else if (beforeSlope > 0 && afterSlope < beforeSlope * 0.5) type = 'deceleration';
      else if ((beforeSlope > 0 && afterSlope < 0) || (beforeSlope < 0 && afterSlope > 0)) type = 'reversal';

      changepoints.push({
        index: i,
        label: labels[i] ?? `Month ${i}`,
        type,
        magnitude: +levelChange.toFixed(3),
        confidence: Math.min(0.95, levelChange * 2),
        description: `${type === 'reversal' ? 'Trend reversal' : type === 'acceleration' ? 'Growth acceleration' : type === 'deceleration' ? 'Growth slowdown' : 'Level shift'} at ${labels[i]} — ${(levelChange * 100).toFixed(0)}% change in level`,
      });
    }
  }

  return changepoints.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
}

// ── Signal Quality ───────────────────────────────────────────────────

function assessSignalQuality(decomposition: DecomposedSeries, trend: TrendAnalysis): SignalQuality {
  const signalPower = stdDev(decomposition.trend) ** 2;
  const noisePower = stdDev(decomposition.residual) ** 2;
  const snr = noisePower > 0 ? 10 * Math.log10(signalPower / noisePower) : 30; // dB

  const quality: SignalQuality['quality'] =
    snr > 20 ? 'excellent' : snr > 10 ? 'good' : snr > 5 ? 'moderate' : snr > 0 ? 'noisy' : 'very_noisy';

  const ac = autocorrelation(decomposition.original);

  const stationarity: SignalQuality['stationarity'] =
    trend.rSquared > 0.7 ? 'non_stationary' :
    trend.rSquared > 0.3 ? 'trend_stationary' :
    'stationary';

  const predictability = Math.min(100, Math.round(
    trend.rSquared * 40 + Math.abs(ac) * 30 + (snr > 0 ? Math.min(30, snr) : 0)
  ));

  return {
    snr: +snr.toFixed(2),
    quality,
    autocorrelation: +ac.toFixed(3),
    stationarity,
    predictability,
  };
}

// ── Forecasting ──────────────────────────────────────────────────────

function forecast(values: number[], trend: TrendAnalysis, residualStd: number, months: number = 6): { month: number; label: string; predicted: number; lower: number; upper: number }[] {
  const n = values.length;
  const forecasts: { month: number; label: string; predicted: number; lower: number; upper: number }[] = [];

  for (let m = 1; m <= months; m++) {
    const predicted = trend.slope * (n + m) + trend.intercept;
    const uncertainty = residualStd * Math.sqrt(m) * 1.96; // 95% CI

    forecasts.push({
      month: m,
      label: `+${m}mo`,
      predicted: Math.max(0, +predicted.toFixed(0)),
      lower: Math.max(0, +(predicted - uncertainty).toFixed(0)),
      upper: +(predicted + uncertainty).toFixed(0),
    });
  }

  return forecasts;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run complete time-series analysis on a metric.
 */
export function analyzeTimeSeries(
  metrics: DbMetricsHistory[],
  metricKey: 'revenue' | 'costs' | 'mau' | 'growth_rate' | 'transactions' = 'revenue',
): TimeSeriesReport {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const values = sorted.map(m => Number(m[metricKey]));
  const labels = sorted.map(m => m.month_date.slice(0, 7));

  const metricNames: Record<string, string> = {
    revenue: 'Revenue', costs: 'Costs', mau: 'Monthly Active Users',
    growth_rate: 'Growth Rate', transactions: 'Transactions',
  };

  // Decompose
  const decomposition = decompose(values, labels);

  // Trend analysis
  const lr = linearRegression(values);
  const direction: TrendAnalysis['direction'] =
    lr.slope > values[0] * 0.1 ? 'strong_up' :
    lr.slope > 0 ? 'up' :
    lr.slope > -values[0] * 0.05 ? 'flat' :
    lr.slope > -values[0] * 0.1 ? 'down' :
    'strong_down';

  const trendAnalysis: TrendAnalysis = {
    slope: +lr.slope.toFixed(2),
    intercept: +lr.intercept.toFixed(2),
    rSquared: +lr.rSquared.toFixed(4),
    direction,
    strength: +lr.rSquared.toFixed(3),
    projection6m: Math.max(0, Math.round(lr.slope * (values.length + 6) + lr.intercept)),
    projection12m: Math.max(0, Math.round(lr.slope * (values.length + 12) + lr.intercept)),
  };

  // Changepoints
  const changepoints = detectChangepoints(values, labels);

  // Signal quality
  const signalQuality = assessSignalQuality(decomposition, trendAnalysis);

  // Forecast
  const residualStd = stdDev(decomposition.residual);
  const forecastData = forecast(values, trendAnalysis, residualStd, 6);

  // Insights
  const insights: string[] = [];
  insights.push(`**Trend:** ${metricNames[metricKey]} shows a ${direction.replace(/_/g, ' ')} trend (R²=${lr.rSquared.toFixed(2)}, slope=${lr.slope.toFixed(0)}/month).`);
  insights.push(`**Signal Quality:** ${signalQuality.quality} (SNR: ${signalQuality.snr.toFixed(1)}dB). ${signalQuality.quality === 'excellent' || signalQuality.quality === 'good' ? 'Data is clean and predictable.' : 'Data has significant noise — predictions less reliable.'}`);
  insights.push(`**Predictability:** ${signalQuality.predictability}/100. ${signalQuality.predictability > 70 ? 'Metrics follow a clear pattern.' : 'Metrics are hard to predict — exercise caution with projections.'}`);
  if (changepoints.length > 0) {
    insights.push(`**Changepoints:** ${changepoints.length} structural break(s) detected. Most significant: ${changepoints[0].description}`);
  }
  insights.push(`**6-month forecast:** ${metricNames[metricKey]} projected at ${forecastData[5]?.predicted.toLocaleString()} (95% CI: ${forecastData[5]?.lower.toLocaleString()}–${forecastData[5]?.upper.toLocaleString()}).`);

  return {
    metric: metricNames[metricKey],
    decomposition,
    trend: trendAnalysis,
    changepoints,
    signalQuality,
    forecast: forecastData,
    insights,
    computedAt: Date.now(),
  };
}
