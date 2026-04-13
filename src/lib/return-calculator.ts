/**
 * Investment Return Calculator
 * ────────────────────────────
 * Professional-grade return metrics used by institutional investors.
 * Calculates IRR, TVPI, DPI, RVPI, MOIC with proper time-weighting.
 *
 * These are the numbers LPs care about most.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface CashFlow {
  date: number; // timestamp
  amount: number; // negative = investment, positive = distribution
  type: 'investment' | 'distribution' | 'valuation';
  description: string;
}

export interface ReturnMetrics {
  /** Internal Rate of Return (annualized) */
  irr: number;
  /** Total Value to Paid-In (unrealized + realized / invested) */
  tvpi: number;
  /** Distributions to Paid-In (cash returned / invested) */
  dpi: number;
  /** Residual Value to Paid-In (unrealized / invested) */
  rvpi: number;
  /** Multiple on Invested Capital */
  moic: number;
  /** Total invested */
  totalInvested: number;
  /** Total distributed (cash back) */
  totalDistributed: number;
  /** Current unrealized value */
  unrealizedValue: number;
  /** Total value (distributed + unrealized) */
  totalValue: number;
  /** Net profit/loss */
  netPnl: number;
  /** Holding period (years) */
  holdingPeriod: number;
  /** Annualized return */
  annualizedReturn: number;
  /** Cash-on-cash return */
  cashOnCash: number;
}

export interface PortfolioReturnMetrics {
  /** Aggregate metrics across all investments */
  aggregate: ReturnMetrics;
  /** Per-investment breakdown */
  investments: {
    name: string;
    invested: number;
    currentValue: number;
    metrics: ReturnMetrics;
  }[];
  /** Vintage year analysis */
  vintageAnalysis: { year: number; invested: number; tvpi: number; irr: number }[];
  /** Best and worst performers */
  bestPerformer: { name: string; moic: number };
  worstPerformer: { name: string; moic: number };
  /** Loss ratio (% of investments below 1x) */
  lossRatio: number;
  /** Home run ratio (% of investments above 10x) */
  homeRunRatio: number;
}

// ── IRR Calculation ──────────────────────────────────────────────────

/**
 * Calculate IRR using Newton-Raphson method.
 * IRR is the discount rate that makes NPV = 0.
 */
function calculateIRR(cashFlows: CashFlow[], maxIterations: number = 100, tolerance: number = 0.0001): number {
  if (cashFlows.length < 2) return 0;

  const sorted = [...cashFlows].sort((a, b) => a.date - b.date);
  const baseDate = sorted[0].date;

  // Convert to years from base date
  const flows = sorted.map(cf => ({
    amount: cf.amount,
    years: (cf.date - baseDate) / (365.25 * 24 * 3600 * 1000),
  }));

  // NPV function
  const npv = (rate: number): number => {
    return flows.reduce((sum, cf) => sum + cf.amount / Math.pow(1 + rate, cf.years), 0);
  };

  // NPV derivative
  const npvDerivative = (rate: number): number => {
    return flows.reduce((sum, cf) => sum - cf.years * cf.amount / Math.pow(1 + rate, cf.years + 1), 0);
  };

  // Newton-Raphson iteration
  let rate = 0.1; // Initial guess
  for (let i = 0; i < maxIterations; i++) {
    const value = npv(rate);
    const derivative = npvDerivative(rate);

    if (Math.abs(derivative) < 1e-10) break;

    const newRate = rate - value / derivative;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    // Clamp to prevent divergence
    rate = Math.max(-0.99, Math.min(10, newRate));
  }

  return rate;
}

// ── Return Metrics ───────────────────────────────────────────────────

/**
 * Calculate comprehensive return metrics from cash flows.
 *
 * @param cashFlows - All cash flows (investments as negative, distributions as positive)
 * @param currentValuation - Current unrealized value of the position
 */
export function calculateReturns(
  cashFlows: CashFlow[],
  currentValuation: number,
): ReturnMetrics {
  const investments = cashFlows.filter(cf => cf.type === 'investment');
  const distributions = cashFlows.filter(cf => cf.type === 'distribution');

  const totalInvested = Math.abs(investments.reduce((s, cf) => s + cf.amount, 0));
  const totalDistributed = distributions.reduce((s, cf) => s + cf.amount, 0);
  const unrealizedValue = currentValuation;
  const totalValue = totalDistributed + unrealizedValue;

  // TVPI: Total Value / Paid-In
  const tvpi = totalInvested > 0 ? totalValue / totalInvested : 0;

  // DPI: Distributions / Paid-In
  const dpi = totalInvested > 0 ? totalDistributed / totalInvested : 0;

  // RVPI: Residual Value / Paid-In
  const rvpi = totalInvested > 0 ? unrealizedValue / totalInvested : 0;

  // MOIC: Multiple on Invested Capital (same as TVPI for single investment)
  const moic = tvpi;

  // Holding period
  const firstInvestment = investments.length > 0 ? Math.min(...investments.map(i => i.date)) : Date.now();
  const holdingPeriod = (Date.now() - firstInvestment) / (365.25 * 24 * 3600 * 1000);

  // IRR
  const irrFlows: CashFlow[] = [
    ...cashFlows,
    { date: Date.now(), amount: currentValuation, type: 'valuation', description: 'Current value' },
  ];
  const irr = calculateIRR(irrFlows);

  // Annualized return
  const annualizedReturn = holdingPeriod > 0 ? Math.pow(tvpi, 1 / holdingPeriod) - 1 : 0;

  // Cash-on-cash
  const cashOnCash = totalInvested > 0 ? (totalDistributed / totalInvested - 1) * 100 : 0;

  return {
    irr: +(irr * 100).toFixed(2),
    tvpi: +tvpi.toFixed(2),
    dpi: +dpi.toFixed(2),
    rvpi: +rvpi.toFixed(2),
    moic: +moic.toFixed(2),
    totalInvested,
    totalDistributed,
    unrealizedValue,
    totalValue,
    netPnl: totalValue - totalInvested,
    holdingPeriod: +holdingPeriod.toFixed(1),
    annualizedReturn: +(annualizedReturn * 100).toFixed(2),
    cashOnCash: +cashOnCash.toFixed(2),
  };
}

/**
 * Calculate portfolio-level return metrics across multiple investments.
 */
export function calculatePortfolioReturns(
  investments: { name: string; cashFlows: CashFlow[]; currentValuation: number }[],
): PortfolioReturnMetrics {
  // Per-investment metrics
  const perInvestment = investments.map(inv => ({
    name: inv.name,
    invested: Math.abs(inv.cashFlows.filter(cf => cf.type === 'investment').reduce((s, cf) => s + cf.amount, 0)),
    currentValue: inv.currentValuation,
    metrics: calculateReturns(inv.cashFlows, inv.currentValuation),
  }));

  // Aggregate cash flows
  const allFlows = investments.flatMap(inv => inv.cashFlows);
  const totalCurrentValuation = investments.reduce((s, inv) => s + inv.currentValuation, 0);
  const aggregate = calculateReturns(allFlows, totalCurrentValuation);

  // Vintage year analysis
  const vintageMap = new Map<number, { invested: number; value: number }>();
  for (const inv of perInvestment) {
    const firstDate = inv.metrics.holdingPeriod > 0
      ? new Date(Date.now() - inv.metrics.holdingPeriod * 365.25 * 24 * 3600 * 1000).getFullYear()
      : new Date().getFullYear();
    const existing = vintageMap.get(firstDate) ?? { invested: 0, value: 0 };
    existing.invested += inv.invested;
    existing.value += inv.currentValue;
    vintageMap.set(firstDate, existing);
  }
  const vintageAnalysis = Array.from(vintageMap.entries()).map(([year, data]) => ({
    year,
    invested: data.invested,
    tvpi: data.invested > 0 ? +(data.value / data.invested).toFixed(2) : 0,
    irr: 0, // Would need per-vintage IRR
  }));

  // Best/worst
  const sorted = [...perInvestment].sort((a, b) => b.metrics.moic - a.metrics.moic);
  const bestPerformer = sorted.length > 0 ? { name: sorted[0].name, moic: sorted[0].metrics.moic } : { name: 'N/A', moic: 0 };
  const worstPerformer = sorted.length > 0 ? { name: sorted[sorted.length - 1].name, moic: sorted[sorted.length - 1].metrics.moic } : { name: 'N/A', moic: 0 };

  // Ratios
  const lossRatio = perInvestment.length > 0 ? perInvestment.filter(i => i.metrics.moic < 1).length / perInvestment.length * 100 : 0;
  const homeRunRatio = perInvestment.length > 0 ? perInvestment.filter(i => i.metrics.moic >= 10).length / perInvestment.length * 100 : 0;

  return {
    aggregate,
    investments: perInvestment,
    vintageAnalysis,
    bestPerformer,
    worstPerformer,
    lossRatio: +lossRatio.toFixed(1),
    homeRunRatio: +homeRunRatio.toFixed(1),
  };
}

/**
 * Generate demo portfolio returns for the platform.
 */
export function generateDemoPortfolioReturns(): PortfolioReturnMetrics {
  const now = Date.now();
  const month = 30 * 24 * 3600 * 1000;

  return calculatePortfolioReturns([
    { name: 'PayFlow', cashFlows: [{ date: now - 12 * month, amount: -200000, type: 'investment', description: 'Seed' }], currentValuation: 480000 },
    { name: 'CloudMetrics', cashFlows: [{ date: now - 8 * month, amount: -150000, type: 'investment', description: 'Pre-seed' }], currentValuation: 210000 },
    { name: 'DeFiYield', cashFlows: [{ date: now - 6 * month, amount: -300000, type: 'investment', description: 'Seed' }], currentValuation: 750000 },
    { name: 'GreenChain', cashFlows: [{ date: now - 4 * month, amount: -100000, type: 'investment', description: 'Pre-seed' }], currentValuation: 130000 },
    { name: 'TokenBridge', cashFlows: [{ date: now - 10 * month, amount: -250000, type: 'investment', description: 'Seed' }, { date: now - 2 * month, amount: 50000, type: 'distribution', description: 'Token distribution' }], currentValuation: 520000 },
  ]);
}
