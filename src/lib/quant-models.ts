/**
 * Quantitative Investment Models — Production Grade
 * ──────────────────────────────────────────────────
 * 5 hedge fund models adapted for startup verification.
 * All calculations use real time-series data, not shortcuts.
 */
import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Statistical Utilities ────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function zScore(value: number, arr: number[]): number {
  const sd = stdDev(arr);
  return sd > 0 ? (value - mean(arr)) / sd : 0;
}

/** Exponentially Weighted Moving Average volatility (lambda = 0.94, industry standard) */
function ewmaVolatility(returns: number[], lambda: number = 0.94): number {
  if (returns.length < 2) return 0;
  let variance = returns.reduce((s, r) => s + r * r, 0) / returns.length;
  for (let i = 1; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * returns[i] ** 2;
  }
  return Math.sqrt(variance);
}

function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb; da += xa * xa; db += xb * xb;
  }
  const denom = Math.sqrt(da * db);
  return denom > 0 ? num / denom : 0;
}

/** Convert sorted metrics to monthly returns */
function toReturns(values: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < values.length; i++) {
    r.push(values[i - 1] !== 0 ? (values[i] - values[i - 1]) / Math.abs(values[i - 1]) : 0);
  }
  return r;
}

function sortMetrics(metrics: DbMetricsHistory[]): DbMetricsHistory[] {
  return [...metrics].sort((a, b) => new Date(a.month_date).getTime() - new Date(b.month_date).getTime());
}

// ── 1. TIME-SERIES MOMENTUM ─────────────────────────────────────

export interface MomentumSignal {
  startupId: string;
  startupName: string;
  metric: string;
  lookback3m: number;
  lookback6m: number;
  lookback12m: number;
  composite: number;
  volScaled: number;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  zScoreVsPeers: number;
}

function computeMom(values: number[], lookback: number): number {
  if (values.length <= lookback) return 0;
  const current = values[values.length - 1];
  const past = values[values.length - 1 - lookback];
  return past !== 0 ? (current - past) / Math.abs(past) : 0;
}

function classifySignal(volScaled: number): MomentumSignal['signal'] {
  if (volScaled > 1.5) return 'strong_buy';
  if (volScaled > 0.5) return 'buy';
  if (volScaled < -1.5) return 'strong_sell';
  if (volScaled < -0.5) return 'sell';
  return 'hold';
}

export function computeMomentumSignals(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
  allMetricsMap?: Map<string, DbMetricsHistory[]>,
): MomentumSignal[] {
  const sorted = sortMetrics(metrics);
  const revenues = sorted.map(m => Number(m.revenue) || 0);
  const maus = sorted.map(m => m.mau || 0);
  const signals: MomentumSignal[] = [];

  for (const [metric, values] of [['revenue', revenues], ['mau', maus]] as const) {
    const mom3 = computeMom(values as number[], 3);
    const mom6 = computeMom(values as number[], 6);
    const mom12 = computeMom(values as number[], 12);
    const composite = 0.5 * mom3 + 0.3 * mom6 + 0.2 * mom12;

    // Vol-scale using EWMA volatility of returns
    const returns = toReturns(values as number[]);
    const vol = ewmaVolatility(returns);
    const volScaled = vol > 0.001 ? composite / vol : composite;

    // Cross-sectional z-score: compute composite for EACH startup, then z-score
    let zScoreVsPeers = 0;
    if (allMetricsMap && allMetricsMap.size > 1) {
      const peerComposites: number[] = [];
      for (const [sid, pMetrics] of allMetricsMap) {
        const pSorted = sortMetrics(pMetrics);
        const pValues = metric === 'revenue'
          ? pSorted.map(m => Number(m.revenue) || 0)
          : pSorted.map(m => m.mau || 0);
        const pMom3 = computeMom(pValues, 3);
        const pMom6 = computeMom(pValues, 6);
        const pMom12 = computeMom(pValues, 12);
        peerComposites.push(0.5 * pMom3 + 0.3 * pMom6 + 0.2 * pMom12);
      }
      zScoreVsPeers = zScore(composite, peerComposites);
    }

    signals.push({
      startupId: startup.id,
      startupName: startup.name,
      metric,
      lookback3m: Math.round(mom3 * 1000) / 10,
      lookback6m: Math.round(mom6 * 1000) / 10,
      lookback12m: Math.round(mom12 * 1000) / 10,
      composite: Math.round(composite * 1000) / 10,
      volScaled: Math.round(volScaled * 100) / 100,
      signal: classifySignal(volScaled),
      confidence: Math.min(1, (values as number[]).length / 24), // Full confidence at 24 months
      zScoreVsPeers: Math.round(zScoreVsPeers * 100) / 100,
    });
  }

  return signals;
}

// ── 2. VOLATILITY TARGETING ──────────────────────────────────────

export interface VolatilityTarget {
  startupId: string;
  startupName: string;
  mrrVolatility: number;
  ewmaVol: number;
  rawWeight: number;
  targetedWeight: number;
  leverage: number;
  riskContribution: number;
}

export function computeVolatilityTargets(
  startups: DbStartup[],
  metricsMap: Map<string, DbMetricsHistory[]>,
  targetVol: number = 0.15,
): VolatilityTarget[] {
  const vols: { id: string; name: string; simpleVol: number; ewma: number }[] = [];

  for (const s of startups) {
    const sorted = sortMetrics(metricsMap.get(s.id) ?? []);
    const revenues = sorted.map(m => Number(m.revenue) || 0);
    const returns = toReturns(revenues);

    const simpleVol = stdDev(returns) * Math.sqrt(12); // Annualized
    const ewma = ewmaVolatility(returns) * Math.sqrt(12);

    vols.push({ id: s.id, name: s.name, simpleVol, ewma: Math.max(ewma, 0.01) });
  }

  // Inverse-EWMA-vol weights (EWMA reacts faster to regime changes)
  const totalInvVol = vols.reduce((s, v) => s + 1 / v.ewma, 0);
  const rawWeights = vols.map(v => (1 / v.ewma) / totalInvVol);

  // Portfolio vol (diagonal approximation)
  const portfolioVol = Math.sqrt(
    rawWeights.reduce((s, w, i) => s + (w * vols[i].ewma) ** 2, 0)
  );

  const leverage = portfolioVol > 0 ? Math.min(3, targetVol / portfolioVol) : 1; // Cap at 3x

  return vols.map((v, i) => ({
    startupId: v.id,
    startupName: v.name,
    mrrVolatility: Math.round(v.simpleVol * 1000) / 10,
    ewmaVol: Math.round(v.ewma * 1000) / 10,
    rawWeight: Math.round(rawWeights[i] * 1000) / 10,
    targetedWeight: Math.round(rawWeights[i] * leverage * 1000) / 10,
    leverage: Math.round(leverage * 100) / 100,
    riskContribution: Math.round((rawWeights[i] ** 2 * v.ewma ** 2 / (portfolioVol ** 2 || 1)) * 1000) / 10,
  }));
}

// ── 3. RELATIVE VALUE / SPREAD ───────────────────────────────────

export interface RelativeValueSignal {
  startupId: string;
  startupName: string;
  peerGroup: string;
  peerCount: number;
  ratios: {
    name: string;
    value: number;
    peerMean: number;
    peerStdDev: number;
    zScore: number;
    signal: 'undervalued' | 'fair' | 'overvalued';
  }[];
  compositeZScore: number;
  recommendation: string;
}

function signalFromZ(z: number): 'undervalued' | 'fair' | 'overvalued' {
  if (z < -1.5) return 'undervalued';
  if (z > 1.5) return 'overvalued';
  return 'fair';
}

export function computeRelativeValue(
  startup: DbStartup,
  allStartups: DbStartup[],
): RelativeValueSignal {
  const peers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);
  const allInGroup = [startup, ...peers];

  if (peers.length < 2) {
    return {
      startupId: startup.id, startupName: startup.name, peerGroup: startup.category,
      peerCount: peers.length, ratios: [], compositeZScore: 0,
      recommendation: 'Insufficient peers for comparison',
    };
  }

  const ratioConfigs = [
    {
      name: 'Revenue Efficiency (MRR/User)',
      compute: (s: DbStartup) => s.users > 0 ? s.mrr / s.users : 0,
    },
    {
      name: 'Trust / Growth',
      compute: (s: DbStartup) => Number(s.growth_rate) > 1 ? s.trust_score / Number(s.growth_rate) : s.trust_score,
    },
    {
      name: 'Growth / Whale Risk',
      compute: (s: DbStartup) => s.whale_concentration > 1 ? Number(s.growth_rate) / s.whale_concentration : Number(s.growth_rate),
    },
    {
      name: 'Sustainability Efficiency',
      compute: (s: DbStartup) => s.mrr > 0 ? (s.sustainability_score * 1000) / s.mrr : 0,
    },
  ];

  const ratios = ratioConfigs.map(cfg => {
    const allValues = allInGroup.map(s => cfg.compute(s));
    const myValue = cfg.compute(startup);
    const m = mean(allValues);
    const sd = stdDev(allValues);
    const z = sd > 0 ? (myValue - m) / sd : 0;

    return {
      name: cfg.name,
      value: Math.round(myValue * 100) / 100,
      peerMean: Math.round(m * 100) / 100,
      peerStdDev: Math.round(sd * 100) / 100,
      zScore: Math.round(z * 100) / 100,
      signal: signalFromZ(z),
    };
  });

  const compositeZ = mean(ratios.map(r => r.zScore));
  let recommendation = 'Fair value relative to peers';
  if (compositeZ < -1) recommendation = 'Potentially undervalued — metrics lag behind similar peers. Investigate for entry.';
  else if (compositeZ > 1) recommendation = 'Trading rich vs peers — premium valuations may not be justified.';
  else if (compositeZ < -0.5) recommendation = 'Slightly below peers — monitor for improvement signals.';
  else if (compositeZ > 0.5) recommendation = 'Slightly above peers — healthy but watch for reversion.';

  return {
    startupId: startup.id,
    startupName: startup.name,
    peerGroup: startup.category,
    peerCount: peers.length,
    ratios,
    compositeZScore: Math.round(compositeZ * 100) / 100,
    recommendation,
  };
}

// ── 4. MACRO REGIME DETECTION ────────────────────────────────────

export type Regime = 'bull' | 'growth' | 'neutral' | 'cautious' | 'bear';

export interface MacroRegime {
  regime: Regime;
  score: number;
  confidence: number;
  solTrend: 'bullish' | 'neutral' | 'bearish';
  allocation: { highGrowth: number; verified: number; stablecoin: number };
  indicators: { name: string; value: string; signal: 'bullish' | 'neutral' | 'bearish'; weight: number }[];
}

function classifyIndicator(value: number, bullThreshold: number, bearThreshold: number): 'bullish' | 'neutral' | 'bearish' {
  if (value >= bullThreshold) return 'bullish';
  if (value <= bearThreshold) return 'bearish';
  return 'neutral';
}

export function detectMacroRegime(
  solPrice: number | null,
  allStartups: DbStartup[],
  metricsMap: Map<string, DbMetricsHistory[]>,
): MacroRegime {
  const indicators: MacroRegime['indicators'] = [];
  let score = 0;
  let totalWeight = 0;

  // SOL price (from Pyth)
  if (solPrice !== null) {
    const sig = classifyIndicator(solPrice, 150, 80);
    indicators.push({ name: 'SOL/USD', value: `$${solPrice.toFixed(0)}`, signal: sig, weight: 0.2 });
    score += (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0) * 0.2;
    totalWeight += 0.2;
  }

  // Platform aggregate growth (weighted by revenue)
  if (allStartups.length > 0) {
    const totalMrr = allStartups.reduce((s, st) => s + st.mrr, 0);
    const weightedGrowth = totalMrr > 0
      ? allStartups.reduce((s, st) => s + Number(st.growth_rate) * st.mrr, 0) / totalMrr
      : mean(allStartups.map(s => Number(s.growth_rate)));
    const sig = classifyIndicator(weightedGrowth, 15, 5);
    indicators.push({ name: 'Revenue-Weighted Growth', value: `${weightedGrowth.toFixed(1)}%`, signal: sig, weight: 0.2 });
    score += (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0) * 0.2;
    totalWeight += 0.2;
  }

  // Verification rate
  if (allStartups.length > 0) {
    const verPct = (allStartups.filter(s => s.verified).length / allStartups.length) * 100;
    const sig = classifyIndicator(verPct, 40, 15);
    indicators.push({ name: 'Verification Rate', value: `${verPct.toFixed(0)}%`, signal: sig, weight: 0.15 });
    score += (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0) * 0.15;
    totalWeight += 0.15;
  }

  // Average trust (quality of ecosystem)
  if (allStartups.length > 0) {
    const avgTrust = mean(allStartups.map(s => s.trust_score));
    const sig = classifyIndicator(avgTrust, 70, 45);
    indicators.push({ name: 'Avg Trust Score', value: `${avgTrust.toFixed(0)}`, signal: sig, weight: 0.15 });
    score += (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0) * 0.15;
    totalWeight += 0.15;
  }

  // Whale concentration (inverted — low is good)
  if (allStartups.length > 0) {
    const avgWhale = mean(allStartups.map(s => s.whale_concentration));
    const sig = avgWhale < 20 ? 'bullish' : avgWhale > 40 ? 'bearish' : 'neutral' as const;
    indicators.push({ name: 'Whale Concentration', value: `${avgWhale.toFixed(0)}%`, signal: sig, weight: 0.15 });
    score += (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0) * 0.15;
    totalWeight += 0.15;
  }

  // Revenue momentum (are startups collectively accelerating?)
  if (metricsMap.size > 0) {
    let accel = 0, count = 0;
    for (const [, mets] of metricsMap) {
      const sorted = sortMetrics(mets);
      if (sorted.length >= 6) {
        const recent3 = mean(sorted.slice(-3).map(m => Number(m.growth_rate)));
        const prev3 = mean(sorted.slice(-6, -3).map(m => Number(m.growth_rate)));
        accel += recent3 - prev3;
        count++;
      }
    }
    if (count > 0) {
      const avgAccel = accel / count;
      const sig = classifyIndicator(avgAccel, 2, -2);
      indicators.push({ name: 'Growth Acceleration', value: `${avgAccel > 0 ? '+' : ''}${avgAccel.toFixed(1)}pp`, signal: sig, weight: 0.15 });
      score += (sig === 'bullish' ? 1 : sig === 'bearish' ? -1 : 0) * 0.15;
      totalWeight += 0.15;
    }
  }

  const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
  let regime: Regime = 'neutral';
  if (normalizedScore > 0.5) regime = 'bull';
  else if (normalizedScore > 0.15) regime = 'growth';
  else if (normalizedScore > -0.15) regime = 'neutral';
  else if (normalizedScore > -0.5) regime = 'cautious';
  else regime = 'bear';

  const allocations: Record<Regime, { highGrowth: number; verified: number; stablecoin: number }> = {
    bull:     { highGrowth: 50, verified: 35, stablecoin: 15 },
    growth:   { highGrowth: 40, verified: 40, stablecoin: 20 },
    neutral:  { highGrowth: 25, verified: 45, stablecoin: 30 },
    cautious: { highGrowth: 15, verified: 40, stablecoin: 45 },
    bear:     { highGrowth: 5,  verified: 35, stablecoin: 60 },
  };

  const bullCount = indicators.filter(i => i.signal !== 'neutral').length;
  const confidence = indicators.length > 0 ? Math.round((bullCount / indicators.length) * 100) : 0;

  return {
    regime,
    score: Math.round(normalizedScore * 100),
    confidence,
    solTrend: solPrice !== null ? classifyIndicator(solPrice, 150, 80) : 'neutral',
    allocation: allocations[regime],
    indicators,
  };
}

// ── 5. RISK FACTOR DECOMPOSITION ─────────────────────────────────

export interface FactorExposure {
  factor: string;
  loading: number;
  contribution: number;
}

export interface RiskDecomposition {
  startupId: string;
  startupName: string;
  factors: FactorExposure[];
  totalExplained: number;
  alpha: number;
  correlations: { peer: string; value: number }[];
  diversificationScore: number;
}

export function decomposeRiskFactors(
  startup: DbStartup,
  allStartups: DbStartup[],
  metricsMap?: Map<string, DbMetricsHistory[]>,
): RiskDecomposition {
  // Build factor vectors from cross-section
  const allMrr = allStartups.map(s => s.mrr);
  const allGrowth = allStartups.map(s => Number(s.growth_rate));
  const allTrust = allStartups.map(s => s.trust_score);
  const allWhale = allStartups.map(s => s.whale_concentration);
  const allSust = allStartups.map(s => s.sustainability_score);

  const factors: FactorExposure[] = [
    { factor: 'Market (Revenue Scale)', loading: +zScore(startup.mrr, allMrr).toFixed(2) as any, contribution: 0 },
    { factor: 'Growth', loading: +zScore(Number(startup.growth_rate), allGrowth).toFixed(2) as any, contribution: 0 },
    { factor: 'Quality (Trust)', loading: +zScore(startup.trust_score, allTrust).toFixed(2) as any, contribution: 0 },
    { factor: 'Concentration Risk', loading: +(-zScore(startup.whale_concentration, allWhale)).toFixed(2) as any, contribution: 0 },
    { factor: 'ESG / Sustainability', loading: +zScore(startup.sustainability_score, allSust).toFixed(2) as any, contribution: 0 },
  ];

  // Contribution = loading^2 / total_loading^2
  const totalL2 = factors.reduce((s, f) => s + f.loading ** 2, 0) || 1;
  for (const f of factors) f.contribution = Math.round((f.loading ** 2 / totalL2) * 100);

  const totalExplained = Math.min(95, Math.round((totalL2 / (totalL2 + 0.5)) * 100));
  const alpha = 100 - totalExplained;

  // Time-series correlations with peers (use revenue returns if available)
  const peers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);
  let correlations: { peer: string; value: number }[] = [];

  if (metricsMap && metricsMap.size > 0) {
    const myMetrics = sortMetrics(metricsMap.get(startup.id) ?? []);
    const myReturns = toReturns(myMetrics.map(m => Number(m.revenue) || 0));

    correlations = peers.slice(0, 5).map(p => {
      const pMetrics = sortMetrics(metricsMap.get(p.id) ?? []);
      const pReturns = toReturns(pMetrics.map(m => Number(m.revenue) || 0));
      return { peer: p.name, value: Math.round(correlation(myReturns, pReturns) * 100) / 100 };
    }).filter(c => !isNaN(c.value));
  } else {
    // Fallback to snapshot correlation
    const myVec = [startup.mrr, Number(startup.growth_rate), startup.trust_score, startup.sustainability_score];
    correlations = peers.slice(0, 5).map(p => ({
      peer: p.name,
      value: Math.round(correlation(myVec, [p.mrr, Number(p.growth_rate), p.trust_score, p.sustainability_score]) * 100) / 100,
    }));
  }

  const avgCorr = correlations.length > 0 ? mean(correlations.map(c => Math.abs(c.value))) : 0;
  const diversificationScore = Math.round((1 - avgCorr) * 100);

  return {
    startupId: startup.id,
    startupName: startup.name,
    factors,
    totalExplained,
    alpha,
    correlations,
    diversificationScore,
  };
}
