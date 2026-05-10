/**
 * Multi-Currency / FX Engine
 * ──────────────────────────
 * Currency exposure analysis and hedging for cross-border investors.
 * What Hong Kong family offices and London hedge funds need.
 *
 * Features:
 *   - Portfolio currency exposure breakdown
 *   - FX risk quantification
 *   - Hedging cost estimation
 *   - Stablecoin vs fiat denomination analysis
 *   - Cross-border settlement optimization
 */

// ── Types ────────────────────────────────────────────────────────────

export type Currency = 'USD' | 'EUR' | 'GBP' | 'SGD' | 'HKD' | 'JPY' | 'CHF' | 'AED' | 'CNY' | 'USDC' | 'USDT' | 'SOL' | 'ETH' | 'BTC';
export type CurrencyType = 'fiat' | 'stablecoin' | 'crypto';

export interface CurrencyConfig {
  code: Currency;
  name: string;
  type: CurrencyType;
  /** Exchange rate to USD */
  rateToUSD: number;
  /** Annual volatility vs USD (%) */
  volatilityVsUSD: number;
  /** Region */
  region: string;
  /** Symbol */
  symbol: string;
}

export interface CurrencyExposure {
  currency: Currency;
  amount: number;
  usdValue: number;
  pctOfPortfolio: number;
  volatility: number;
  hedgingCostAnnual: number;
}

export interface FXRiskReport {
  /** Total portfolio value in USD */
  totalUSD: number;
  /** Currency exposures */
  exposures: CurrencyExposure[];
  /** FX VaR (95%, 1-month) in USD */
  fxVaR95: number;
  /** Total hedging cost (annual) */
  totalHedgingCost: number;
  /** Optimal denomination recommendation */
  optimalDenomination: Currency;
  /** Diversification benefit from multi-currency */
  diversificationBenefit: number;
  /** Stablecoin vs crypto vs fiat split */
  typeSplit: { type: CurrencyType; pct: number; value: number }[];
  /** Settlement recommendations */
  settlementRecommendations: string[];
  /** Computed at */
  computedAt: number;
}

// ── Currency Database ────────────────────────────────────────────────

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD:  { code: 'USD',  name: 'US Dollar',        type: 'fiat',       rateToUSD: 1.00,    volatilityVsUSD: 0,    region: 'North America', symbol: '$' },
  EUR:  { code: 'EUR',  name: 'Euro',             type: 'fiat',       rateToUSD: 1.08,    volatilityVsUSD: 8.5,  region: 'Europe',        symbol: '€' },
  GBP:  { code: 'GBP',  name: 'British Pound',    type: 'fiat',       rateToUSD: 1.26,    volatilityVsUSD: 9.2,  region: 'Europe',        symbol: '£' },
  SGD:  { code: 'SGD',  name: 'Singapore Dollar',  type: 'fiat',       rateToUSD: 0.74,    volatilityVsUSD: 5.5,  region: 'Asia Pacific',  symbol: 'S$' },
  HKD:  { code: 'HKD',  name: 'Hong Kong Dollar',  type: 'fiat',       rateToUSD: 0.128,   volatilityVsUSD: 0.5,  region: 'Asia Pacific',  symbol: 'HK$' },
  JPY:  { code: 'JPY',  name: 'Japanese Yen',      type: 'fiat',       rateToUSD: 0.0067,  volatilityVsUSD: 12.0, region: 'Asia Pacific',  symbol: '¥' },
  CHF:  { code: 'CHF',  name: 'Swiss Franc',       type: 'fiat',       rateToUSD: 1.12,    volatilityVsUSD: 7.8,  region: 'Europe',        symbol: 'Fr' },
  AED:  { code: 'AED',  name: 'UAE Dirham',        type: 'fiat',       rateToUSD: 0.272,   volatilityVsUSD: 0.1,  region: 'Middle East',   symbol: 'د.إ' },
  CNY:  { code: 'CNY',  name: 'Chinese Yuan',      type: 'fiat',       rateToUSD: 0.138,   volatilityVsUSD: 4.5,  region: 'Asia Pacific',  symbol: '¥' },
  USDC: { code: 'USDC', name: 'USD Coin',          type: 'stablecoin', rateToUSD: 1.00,    volatilityVsUSD: 0.1,  region: 'Global',        symbol: 'USDC' },
  USDT: { code: 'USDT', name: 'Tether',            type: 'stablecoin', rateToUSD: 1.00,    volatilityVsUSD: 0.3,  region: 'Global',        symbol: 'USDT' },
  SOL:  { code: 'SOL',  name: 'Solana',            type: 'crypto',     rateToUSD: 150,     volatilityVsUSD: 65.0, region: 'Global',        symbol: 'SOL' },
  ETH:  { code: 'ETH',  name: 'Ethereum',          type: 'crypto',     rateToUSD: 3000,    volatilityVsUSD: 55.0, region: 'Global',        symbol: 'ETH' },
  BTC:  { code: 'BTC',  name: 'Bitcoin',            type: 'crypto',     rateToUSD: 65000,   volatilityVsUSD: 50.0, region: 'Global',        symbol: 'BTC' },
};

// ── FX Analysis ──────────────────────────────────────────────────────

/**
 * Analyze FX risk for a portfolio with multiple currency exposures.
 */
export function analyzeFXRisk(
  holdings: { currency: Currency; amount: number }[],
  baseCurrency: Currency = 'USD',
): FXRiskReport {
  const exposures: CurrencyExposure[] = holdings.map(h => {
    const config = CURRENCIES[h.currency];
    const usdValue = h.amount * config.rateToUSD;
    const hedgingCost = config.type === 'fiat' && config.code !== baseCurrency
      ? usdValue * 0.02 // ~2% annual hedging cost for fiat
      : config.type === 'crypto'
      ? usdValue * 0.05 // ~5% for crypto (higher volatility)
      : 0; // No hedging needed for same currency or stablecoins

    return {
      currency: h.currency,
      amount: h.amount,
      usdValue,
      pctOfPortfolio: 0, // Calculated below
      volatility: config.volatilityVsUSD,
      hedgingCostAnnual: +hedgingCost.toFixed(2),
    };
  });

  const totalUSD = exposures.reduce((s, e) => s + e.usdValue, 0);

  // Calculate portfolio percentages
  for (const exp of exposures) {
    exp.pctOfPortfolio = totalUSD > 0 ? +(exp.usdValue / totalUSD * 100).toFixed(2) : 0;
  }

  // FX VaR (95%, 1-month) — portfolio-level
  // Simplified: weighted average of individual currency VaRs
  const fxVaR95 = exposures.reduce((s, e) => {
    const monthlyVol = e.volatility / Math.sqrt(12);
    return s + e.usdValue * (monthlyVol / 100) * 1.645; // 95% z-score
  }, 0);

  const totalHedgingCost = exposures.reduce((s, e) => s + e.hedgingCostAnnual, 0);

  // Type split
  const typeMap = new Map<CurrencyType, number>();
  for (const exp of exposures) {
    const config = CURRENCIES[exp.currency];
    typeMap.set(config.type, (typeMap.get(config.type) ?? 0) + exp.usdValue);
  }
  const typeSplit = Array.from(typeMap.entries()).map(([type, value]) => ({
    type,
    pct: totalUSD > 0 ? +(value / totalUSD * 100).toFixed(1) : 0,
    value,
  }));

  // Optimal denomination
  const stablecoinPct = typeSplit.find(t => t.type === 'stablecoin')?.pct ?? 0;
  const optimalDenomination: Currency = stablecoinPct > 50 ? 'USDC' : baseCurrency;

  // Diversification benefit
  const hhi = exposures.reduce((s, e) => s + (e.pctOfPortfolio / 100) ** 2, 0);
  const diversificationBenefit = +(1 - hhi).toFixed(3);

  // Settlement recommendations
  const recommendations: string[] = [];
  const cryptoPct = typeSplit.find(t => t.type === 'crypto')?.pct ?? 0;
  if (cryptoPct > 30) recommendations.push('Consider converting crypto holdings to stablecoins (USDC) to reduce FX volatility');
  if (fxVaR95 > totalUSD * 0.05) recommendations.push('FX risk is significant — consider hedging major fiat exposures');
  recommendations.push(`Optimal settlement: USDC on Solana ($0.00025/tx) vs SWIFT ($25-50/tx)`);
  if (diversificationBenefit > 0.5) recommendations.push('Good currency diversification — maintains natural hedging');
  recommendations.push('For cross-border investments, use Solana USDC for instant, near-zero-cost settlement');

  return {
    totalUSD,
    exposures: exposures.sort((a, b) => b.usdValue - a.usdValue),
    fxVaR95: +fxVaR95.toFixed(2),
    totalHedgingCost: +totalHedgingCost.toFixed(2),
    optimalDenomination,
    diversificationBenefit,
    typeSplit,
    settlementRecommendations: recommendations,
    computedAt: Date.now(),
  };
}

/**
 * Generate a demo FX analysis for a typical international investor.
 */
export function generateDemoFXReport(baseCurrency: Currency = 'USD'): FXRiskReport {
  return analyzeFXRisk([
    { currency: 'USDC', amount: 500000 },
    { currency: 'SOL', amount: 200 },
    { currency: 'ETH', amount: 5 },
    { currency: 'USD', amount: 100000 },
    { currency: 'EUR', amount: 50000 },
    { currency: 'SGD', amount: 80000 },
    { currency: 'HKD', amount: 500000 },
  ], baseCurrency);
}
