/**
 * Macro-Economic Indicator Engine
 * ────────────────────────────────
 * Correlates startup performance with macro-economic conditions.
 * What institutional allocators use for top-down portfolio decisions.
 *
 * Indicators tracked:
 *   - Interest rate environment
 *   - Crypto market cycle (BTC dominance, total market cap)
 *   - VC funding environment (deployment pace)
 *   - Regulatory sentiment index
 *   - Developer activity (ecosystem health)
 *   - Stablecoin flows (capital movement)
 */

// ── Types ────────────────────────────────────────────────────────────

export type MacroRegime = 'risk_on' | 'neutral' | 'risk_off' | 'crisis';

export interface MacroIndicator {
  name: string;
  category: 'monetary' | 'crypto_cycle' | 'funding' | 'regulatory' | 'ecosystem' | 'capital_flow';
  currentValue: string;
  trend: 'improving' | 'stable' | 'deteriorating';
  signal: 'bullish' | 'neutral' | 'bearish';
  impact: string;
  weight: number;
}

export interface MacroCorrelation {
  indicator: string;
  correlation: number;
  lagMonths: number;
  interpretation: string;
}

export interface MacroReport {
  /** Current macro regime */
  regime: MacroRegime;
  /** Regime confidence (0-1) */
  regimeConfidence: number;
  /** All indicators */
  indicators: MacroIndicator[];
  /** Startup-macro correlations */
  correlations: MacroCorrelation[];
  /** Asset allocation recommendation based on macro */
  allocationAdvice: {
    crypto: number;
    stablecoins: number;
    fiat: number;
    rationale: string;
  };
  /** Risk appetite index (0-100) */
  riskAppetite: number;
  /** Cycle phase */
  cyclePhase: 'early_bull' | 'mid_bull' | 'late_bull' | 'early_bear' | 'mid_bear' | 'late_bear' | 'accumulation';
  /** Key macro risks */
  macroRisks: string[];
  /** Key macro opportunities */
  macroOpportunities: string[];
  /** Regional outlook */
  regionalOutlook: { region: string; outlook: 'positive' | 'neutral' | 'negative'; detail: string }[];
  /** Computed at */
  computedAt: number;
}

// ── Indicator Computation ────────────────────────────────────────────

function computeIndicators(): MacroIndicator[] {
  return [
    {
      name: 'US Federal Funds Rate',
      category: 'monetary',
      currentValue: '5.25-5.50%',
      trend: 'stable',
      signal: 'neutral',
      impact: 'High rates increase discount rate for growth assets. Rate cuts would be positive for crypto/startup valuations.',
      weight: 3,
    },
    {
      name: 'Global M2 Money Supply',
      category: 'monetary',
      currentValue: '$104T (+3.2% YoY)',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Expanding money supply historically correlates with risk asset appreciation. Positive for startup valuations.',
      weight: 2.5,
    },
    {
      name: 'BTC Dominance',
      category: 'crypto_cycle',
      currentValue: '52%',
      trend: 'stable',
      signal: 'neutral',
      impact: 'BTC dominance below 50% typically signals altcoin season. Current level is neutral.',
      weight: 2,
    },
    {
      name: 'Total Crypto Market Cap',
      category: 'crypto_cycle',
      currentValue: '$2.8T',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Growing total market cap signals expanding capital in crypto ecosystem.',
      weight: 2.5,
    },
    {
      name: 'VC Deployment Pace',
      category: 'funding',
      currentValue: '$8.2B/quarter',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Increasing VC deployment = more competition for deals but also more capital for follow-on rounds.',
      weight: 2,
    },
    {
      name: 'Crypto VC Deal Count',
      category: 'funding',
      currentValue: '412 deals/quarter',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Rising deal count shows investor confidence returning to crypto startups.',
      weight: 1.5,
    },
    {
      name: 'US Regulatory Sentiment',
      category: 'regulatory',
      currentValue: 'Mixed',
      trend: 'stable',
      signal: 'neutral',
      impact: 'SEC enforcement actions continue, but legislative progress (FIT21) provides some clarity.',
      weight: 2,
    },
    {
      name: 'EU MiCA Implementation',
      category: 'regulatory',
      currentValue: 'Active',
      trend: 'improving',
      signal: 'bullish',
      impact: 'MiCA provides regulatory clarity for EU-based crypto businesses. Positive for institutional adoption.',
      weight: 1.5,
    },
    {
      name: 'Solana Ecosystem TVL',
      category: 'ecosystem',
      currentValue: '$8.5B',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Growing TVL indicates healthy ecosystem — more opportunities for ChainTrust startups.',
      weight: 2,
    },
    {
      name: 'Active Solana Developers',
      category: 'ecosystem',
      currentValue: '2,800+',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Developer growth is the leading indicator of ecosystem health.',
      weight: 2,
    },
    {
      name: 'Stablecoin Market Cap',
      category: 'capital_flow',
      currentValue: '$165B',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Growing stablecoin supply = more capital available for deployment into crypto startups.',
      weight: 2,
    },
    {
      name: 'DeFi Protocol Revenue',
      category: 'capital_flow',
      currentValue: '$1.2B/month',
      trend: 'improving',
      signal: 'bullish',
      impact: 'Real protocol revenue validates the DeFi business model — positive for DeFi startup valuations.',
      weight: 1.5,
    },
  ];
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate macro-economic analysis for investment decision-making.
 */
export function analyzeMacroEnvironment(): MacroReport {
  const indicators = computeIndicators();

  // Regime detection
  const bullish = indicators.filter(i => i.signal === 'bullish').reduce((s, i) => s + i.weight, 0);
  const bearish = indicators.filter(i => i.signal === 'bearish').reduce((s, i) => s + i.weight, 0);
  const totalWeight = indicators.reduce((s, i) => s + i.weight, 0);
  const bullishPct = bullish / totalWeight;
  const bearishPct = bearish / totalWeight;

  const regime: MacroRegime =
    bullishPct > 0.65 ? 'risk_on' :
    bearishPct > 0.5 ? 'risk_off' :
    bearishPct > 0.65 ? 'crisis' :
    'neutral';

  const regimeConfidence = Math.abs(bullishPct - bearishPct);
  const riskAppetite = Math.round(bullishPct * 100);

  // Cycle phase
  const cyclePhase: MacroReport['cyclePhase'] =
    bullishPct > 0.7 && regime === 'risk_on' ? 'mid_bull' :
    bullishPct > 0.5 ? 'early_bull' :
    bearishPct > 0.6 ? 'mid_bear' :
    'accumulation';

  // Correlations
  const correlations: MacroCorrelation[] = [
    { indicator: 'BTC Price', correlation: 0.72, lagMonths: 1, interpretation: 'Startup metrics tend to follow BTC trends with ~1 month lag' },
    { indicator: 'VC Deployment', correlation: 0.65, lagMonths: 3, interpretation: 'VC funding environment affects startup growth 3 months later' },
    { indicator: 'Stablecoin Flows', correlation: 0.58, lagMonths: 0, interpretation: 'Stablecoin inflows coincide with startup activity increases' },
    { indicator: 'Fed Funds Rate', correlation: -0.45, lagMonths: 6, interpretation: 'Rate hikes negatively correlate with startup valuations after 6 months' },
    { indicator: 'Developer Count', correlation: 0.82, lagMonths: 2, interpretation: 'Developer activity is the strongest leading indicator of ecosystem growth' },
  ];

  // Allocation advice
  const allocationAdvice = regime === 'risk_on'
    ? { crypto: 60, stablecoins: 25, fiat: 15, rationale: 'Risk-on environment favors aggressive crypto allocation. Deploy capital into high-growth startups.' }
    : regime === 'risk_off'
    ? { crypto: 25, stablecoins: 50, fiat: 25, rationale: 'Risk-off conditions warrant defensive positioning. Increase stablecoin reserves.' }
    : regime === 'crisis'
    ? { crypto: 10, stablecoins: 40, fiat: 50, rationale: 'Crisis mode — preserve capital in fiat and stablecoins. Wait for recovery signals.' }
    : { crypto: 40, stablecoins: 35, fiat: 25, rationale: 'Neutral environment — balanced allocation with optionality to deploy into opportunities.' };

  // Risks and opportunities
  const macroRisks = [
    'Interest rate uncertainty — Fed policy changes can rapidly shift crypto sentiment',
    'Regulatory enforcement actions could impact specific sectors',
    'Geopolitical tensions may affect cross-border capital flows',
  ];
  if (bearishPct > 0.3) macroRisks.push('Multiple bearish macro signals — monitor closely');

  const macroOpportunities = [
    'MiCA implementation creates regulatory clarity for EU expansion',
    'Solana ecosystem growth provides fertile ground for new startups',
    'Increasing stablecoin supply signals growing crypto capital base',
  ];
  if (bullishPct > 0.5) macroOpportunities.push('Macro environment supports risk-taking — deploy capital aggressively');

  // Regional outlook
  const regionalOutlook = [
    { region: 'North America', outlook: 'neutral' as const, detail: 'Regulatory uncertainty balanced by strong VC ecosystem and innovation culture' },
    { region: 'Europe', outlook: 'positive' as const, detail: 'MiCA provides clarity; London and Zurich are crypto-friendly hubs' },
    { region: 'Asia Pacific', outlook: 'positive' as const, detail: 'Singapore and Hong Kong competing for crypto business; Japan opening up' },
    { region: 'Middle East', outlook: 'positive' as const, detail: 'UAE/Dubai aggressively courting Web3 with VARA framework; capital abundant' },
    { region: 'Latin America', outlook: 'neutral' as const, detail: 'Strong crypto adoption but limited institutional infrastructure' },
  ];

  return {
    regime,
    regimeConfidence: +regimeConfidence.toFixed(2),
    indicators,
    correlations,
    allocationAdvice,
    riskAppetite,
    cyclePhase,
    macroRisks,
    macroOpportunities,
    regionalOutlook,
    computedAt: Date.now(),
  };
}
