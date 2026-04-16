/**
 * Quantitative Investment Models
 * ─────────────────────────────
 * 5 hedge fund models adapted for startup verification:
 * 1. Time-Series Momentum
 * 2. Volatility Targeting
 * 3. Relative Value / Spread
 * 4. Macro Regime Detection
 * 5. Risk Factor Decomposition
 */
import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Utilities ────────────────────────────────────────────────────

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

function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma, xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  const denom = Math.sqrt(da * db);
  return denom > 0 ? num / denom : 0;
}

// ── 1. TIME-SERIES MOMENTUM ─────────────────────────────────────

export interface MomentumSignal {
  startupId: string;
  startupName: string;
  metric: string;
  lookback3m: number;
  lookback6m: number;
  composite: number;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
}

function computeMom(values: number[], lookback: number): number {
  if (values.length < lookback + 1) return 0;
  const current = values[values.length - 1];
  const past = values[values.length - 1 - lookback];
  return past !== 0 ? (current - past) / Math.abs(past) : 0;
}

export function computeMomentumSignals(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): MomentumSignal[] {
  const sorted = [...metrics].sort((a, b) =>
    new Date(a.month_date).getTime() - new Date(b.month_date).getTime()
  );

  const revenues = sorted.map(m => Number(m.revenue) || 0);
  const maus = sorted.map(m => m.mau || 0);

  const signals: MomentumSignal[] = [];

  for (const [metric, values] of [['revenue', revenues], ['mau', maus]] as const) {
    const mom3 = computeMom(values as number[], 3);
    const mom6 = computeMom(values as number[], 6);
    const composite = 0.6 * mom3 + 0.4 * mom6;

    // Cross-sectional z-score
    const allComposites = allStartups.map(() => composite); // Simplified
    const sd = stdDev(allComposites) || 1;
    const volScaled = composite / sd;

    let signal: MomentumSignal['signal'] = 'hold';
    if (volScaled > 1.5) signal = 'strong_buy';
    else if (volScaled > 0.5) signal = 'buy';
    else if (volScaled < -1.5) signal = 'strong_sell';
    else if (volScaled < -0.5) signal = 'sell';

    signals.push({
      startupId: startup.id,
      startupName: startup.name,
      metric,
      lookback3m: Math.round(mom3 * 1000) / 10,
      lookback6m: Math.round(mom6 * 1000) / 10,
      composite: Math.round(composite * 1000) / 10,
      signal,
      confidence: Math.min(1, (values as number[]).length / 12),
    });
  }

  return signals;
}

// ── 2. VOLATILITY TARGETING ──────────────────────────────────────

export interface VolatilityTarget {
  startupId: string;
  startupName: string;
  mrrVolatility: number;
  compositeVol: number;
  rawWeight: number;
  targetedWeight: number;
  riskContribution: number;
}

export function computeVolatilityTargets(
  startups: DbStartup[],
  metricsMap: Map<string, DbMetricsHistory[]>,
  targetVol: number = 0.15,
): VolatilityTarget[] {
  const vols: { id: string; name: string; vol: number }[] = [];

  for (const s of startups) {
    const metrics = metricsMap.get(s.id) ?? [];
    const sorted = [...metrics].sort((a, b) =>
      new Date(a.month_date).getTime() - new Date(b.month_date).getTime()
    );
    const revenues = sorted.map(m => Number(m.revenue) || 0);

    // Compute MoM returns
    const returns: number[] = [];
    for (let i = 1; i < revenues.length; i++) {
      if (revenues[i - 1] > 0) {
        returns.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
      }
    }

    const vol = stdDev(returns) * Math.sqrt(12); // Annualize
    vols.push({ id: s.id, name: s.name, vol: Math.max(vol, 0.01) });
  }

  // Inverse-vol weights
  const totalInvVol = vols.reduce((s, v) => s + 1 / v.vol, 0);
  const rawWeights = vols.map(v => (1 / v.vol) / totalInvVol);

  // Portfolio vol (simplified — assumes zero correlation)
  const portfolioVol = Math.sqrt(
    rawWeights.reduce((s, w, i) => s + (w * vols[i].vol) ** 2, 0)
  );

  const leverage = portfolioVol > 0 ? targetVol / portfolioVol : 1;

  return vols.map((v, i) => ({
    startupId: v.id,
    startupName: v.name,
    mrrVolatility: Math.round(v.vol * 1000) / 10,
    compositeVol: Math.round(v.vol * 1000) / 10,
    rawWeight: Math.round(rawWeights[i] * 1000) / 10,
    targetedWeight: Math.round(rawWeights[i] * leverage * 1000) / 10,
    riskContribution: Math.round((rawWeights[i] * v.vol / portfolioVol) * 1000) / 10,
  }));
}

// ── 3. RELATIVE VALUE / SPREAD ───────────────────────────────────

export interface RelativeValueSignal {
  startupId: string;
  startupName: string;
  peerGroup: string;
  ratios: {
    name: string;
    value: number;
    peerMean: number;
    zScore: number;
    signal: 'undervalued' | 'fair' | 'overvalued';
  }[];
  compositeZScore: number;
  recommendation: string;
}

export function computeRelativeValue(
  startup: DbStartup,
  allStartups: DbStartup[],
): RelativeValueSignal {
  const peers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);
  if (peers.length < 2) {
    return {
      startupId: startup.id, startupName: startup.name, peerGroup: startup.category,
      ratios: [], compositeZScore: 0, recommendation: 'Insufficient peers for comparison',
    };
  }

  const ratios: RelativeValueSignal['ratios'] = [];

  // Efficiency: MRR per user
  const allEfficiency = [startup, ...peers].map(s => s.users > 0 ? s.mrr / s.users : 0);
  const myEfficiency = startup.users > 0 ? startup.mrr / startup.users : 0;
  const effZ = zScore(myEfficiency, allEfficiency);
  ratios.push({
    name: 'MRR per User',
    value: Math.round(myEfficiency * 100) / 100,
    peerMean: Math.round(mean(allEfficiency) * 100) / 100,
    zScore: Math.round(effZ * 100) / 100,
    signal: effZ < -1.5 ? 'undervalued' : effZ > 1.5 ? 'overvalued' : 'fair',
  });

  // Trust to Growth ratio
  const allTG = [startup, ...peers].map(s => Number(s.growth_rate) > 0 ? s.trust_score / Number(s.growth_rate) : 0);
  const myTG = Number(startup.growth_rate) > 0 ? startup.trust_score / Number(startup.growth_rate) : 0;
  const tgZ = zScore(myTG, allTG);
  ratios.push({
    name: 'Trust / Growth',
    value: Math.round(myTG * 100) / 100,
    peerMean: Math.round(mean(allTG) * 100) / 100,
    zScore: Math.round(tgZ * 100) / 100,
    signal: tgZ < -1.5 ? 'undervalued' : tgZ > 1.5 ? 'overvalued' : 'fair',
  });

  // Growth efficiency: Growth / Whale concentration
  const allGE = [startup, ...peers].map(s => s.whale_concentration > 0 ? Number(s.growth_rate) / s.whale_concentration : 0);
  const myGE = startup.whale_concentration > 0 ? Number(startup.growth_rate) / startup.whale_concentration : 0;
  const geZ = zScore(myGE, allGE);
  ratios.push({
    name: 'Growth / Whale Risk',
    value: Math.round(myGE * 100) / 100,
    peerMean: Math.round(mean(allGE) * 100) / 100,
    zScore: Math.round(geZ * 100) / 100,
    signal: geZ < -1.5 ? 'undervalued' : geZ > 1.5 ? 'overvalued' : 'fair',
  });

  const compositeZ = mean(ratios.map(r => r.zScore));
  let recommendation = 'Fair value relative to peers';
  if (compositeZ < -1) recommendation = 'Potentially undervalued — investigate for entry opportunity';
  else if (compositeZ > 1) recommendation = 'Trading rich relative to peers — exercise caution';

  return {
    startupId: startup.id,
    startupName: startup.name,
    peerGroup: startup.category,
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
  allocation: {
    highGrowth: number;
    verified: number;
    stablecoin: number;
  };
  indicators: {
    name: string;
    value: string;
    signal: 'bullish' | 'neutral' | 'bearish';
    weight: number;
  }[];
}

export function detectMacroRegime(
  solPrice: number | null,
  allStartups: DbStartup[],
  metricsMap: Map<string, DbMetricsHistory[]>,
): MacroRegime {
  const indicators: MacroRegime['indicators'] = [];
  let score = 0;
  let maxScore = 0;

  // SOL price level
  if (solPrice !== null) {
    const priceSignal = solPrice > 150 ? 'bullish' : solPrice > 80 ? 'neutral' : 'bearish';
    indicators.push({ name: 'SOL Price', value: `$${solPrice.toFixed(0)}`, signal: priceSignal, weight: 0.25 });
    score += (priceSignal === 'bullish' ? 1 : priceSignal === 'neutral' ? 0 : -1) * 0.25;
    maxScore += 0.25;
  }

  // Platform aggregate MRR growth
  const totalMrr = allStartups.reduce((s, st) => s + st.mrr, 0);
  const avgGrowth = mean(allStartups.map(s => Number(s.growth_rate)));
  const growthSignal = avgGrowth > 15 ? 'bullish' : avgGrowth > 5 ? 'neutral' : 'bearish';
  indicators.push({ name: 'Avg Platform Growth', value: `${avgGrowth.toFixed(1)}%`, signal: growthSignal, weight: 0.2 });
  score += (growthSignal === 'bullish' ? 1 : growthSignal === 'neutral' ? 0 : -1) * 0.2;
  maxScore += 0.2;

  // Verification rate
  const verifiedPct = allStartups.length > 0 ? (allStartups.filter(s => s.verified).length / allStartups.length) * 100 : 0;
  const verifySignal = verifiedPct > 40 ? 'bullish' : verifiedPct > 20 ? 'neutral' : 'bearish';
  indicators.push({ name: 'Verification Rate', value: `${verifiedPct.toFixed(0)}%`, signal: verifySignal, weight: 0.15 });
  score += (verifySignal === 'bullish' ? 1 : verifySignal === 'neutral' ? 0 : -1) * 0.15;
  maxScore += 0.15;

  // Average trust score
  const avgTrust = mean(allStartups.map(s => s.trust_score));
  const trustSignal = avgTrust > 70 ? 'bullish' : avgTrust > 50 ? 'neutral' : 'bearish';
  indicators.push({ name: 'Avg Trust Score', value: `${avgTrust.toFixed(0)}`, signal: trustSignal, weight: 0.15 });
  score += (trustSignal === 'bullish' ? 1 : trustSignal === 'neutral' ? 0 : -1) * 0.15;
  maxScore += 0.15;

  // Whale concentration (inverse — high whale = bearish)
  const avgWhale = mean(allStartups.map(s => s.whale_concentration));
  const whaleSignal = avgWhale < 20 ? 'bullish' : avgWhale < 40 ? 'neutral' : 'bearish';
  indicators.push({ name: 'Avg Whale Concentration', value: `${avgWhale.toFixed(0)}%`, signal: whaleSignal, weight: 0.15 });
  score += (whaleSignal === 'bullish' ? 1 : whaleSignal === 'neutral' ? 0 : -1) * 0.15;
  maxScore += 0.15;

  // Startup count growth (proxy for ecosystem health)
  const startupSignal = allStartups.length > 20 ? 'bullish' : allStartups.length > 10 ? 'neutral' : 'bearish';
  indicators.push({ name: 'Ecosystem Size', value: `${allStartups.length} startups`, signal: startupSignal, weight: 0.1 });
  score += (startupSignal === 'bullish' ? 1 : startupSignal === 'neutral' ? 0 : -1) * 0.1;
  maxScore += 0.1;

  // Classify regime
  const normalizedScore = maxScore > 0 ? score / maxScore : 0;
  let regime: Regime = 'neutral';
  if (normalizedScore > 0.5) regime = 'bull';
  else if (normalizedScore > 0.2) regime = 'growth';
  else if (normalizedScore > -0.2) regime = 'neutral';
  else if (normalizedScore > -0.5) regime = 'cautious';
  else regime = 'bear';

  // Allocation per regime
  const allocations: Record<Regime, { highGrowth: number; verified: number; stablecoin: number }> = {
    bull: { highGrowth: 50, verified: 35, stablecoin: 15 },
    growth: { highGrowth: 40, verified: 40, stablecoin: 20 },
    neutral: { highGrowth: 25, verified: 45, stablecoin: 30 },
    cautious: { highGrowth: 15, verified: 40, stablecoin: 45 },
    bear: { highGrowth: 5, verified: 35, stablecoin: 60 },
  };

  const solTrend = solPrice !== null ? (solPrice > 150 ? 'bullish' : solPrice > 80 ? 'neutral' : 'bearish') : 'neutral';

  return {
    regime,
    score: Math.round(normalizedScore * 100),
    confidence: Math.round((indicators.filter(i => i.signal !== 'neutral').length / indicators.length) * 100),
    solTrend: solTrend as 'bullish' | 'neutral' | 'bearish',
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
): RiskDecomposition {
  // Factor definitions (z-score based loadings)
  const allMrr = allStartups.map(s => s.mrr);
  const allGrowth = allStartups.map(s => Number(s.growth_rate));
  const allTrust = allStartups.map(s => s.trust_score);
  const allWhale = allStartups.map(s => s.whale_concentration);
  const allSustainability = allStartups.map(s => s.sustainability_score);

  const factors: FactorExposure[] = [
    {
      factor: 'Market (MRR Scale)',
      loading: Math.round(zScore(startup.mrr, allMrr) * 100) / 100,
      contribution: 0,
    },
    {
      factor: 'Growth',
      loading: Math.round(zScore(Number(startup.growth_rate), allGrowth) * 100) / 100,
      contribution: 0,
    },
    {
      factor: 'Quality (Trust)',
      loading: Math.round(zScore(startup.trust_score, allTrust) * 100) / 100,
      contribution: 0,
    },
    {
      factor: 'Concentration Risk',
      loading: Math.round(zScore(startup.whale_concentration, allWhale) * -100) / 100, // Invert — high concentration = negative
      contribution: 0,
    },
    {
      factor: 'Sustainability',
      loading: Math.round(zScore(startup.sustainability_score, allSustainability) * 100) / 100,
      contribution: 0,
    },
  ];

  // Compute contributions (loading^2 / sum of loading^2)
  const totalLoading2 = factors.reduce((s, f) => s + f.loading ** 2, 0) || 1;
  for (const f of factors) {
    f.contribution = Math.round((f.loading ** 2 / totalLoading2) * 100);
  }

  // Alpha = residual (how much of performance is NOT explained by factors)
  const totalExplained = Math.min(100, Math.round(totalLoading2 / (totalLoading2 + 1) * 100));
  const alpha = 100 - totalExplained;

  // Correlations with peers in same category
  const peers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);
  const myVector = [startup.mrr, Number(startup.growth_rate), startup.trust_score, startup.sustainability_score];
  const correlations = peers.slice(0, 5).map(p => {
    const pVector = [p.mrr, Number(p.growth_rate), p.trust_score, p.sustainability_score];
    return {
      peer: p.name,
      value: Math.round(correlation(myVector, pVector) * 100) / 100,
    };
  });

  // Diversification score (inverse of avg correlation)
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
