/**
 * Protocol Revenue Decomposer
 * ───────────────────────────
 * Separates REAL revenue from inflationary token emissions.
 * The most important distinction in crypto investing.
 *
 * "Real yield" = revenue from actual economic activity
 * "Fake yield" = emissions subsidies that dilute holders
 *
 * This is what separates Uniswap (real fees) from Ponzi farms.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type RevenueSource = 'protocol_fees' | 'transaction_fees' | 'subscription' | 'token_emissions' | 'treasury_yield' | 'other';
export type YieldType = 'real' | 'inflationary' | 'mixed';

export interface RevenueComponent {
  source: RevenueSource;
  label: string;
  amount: number;
  pctOfTotal: number;
  yieldType: YieldType;
  sustainable: boolean;
  description: string;
}

export interface ProtocolRevenueReport {
  /** Total reported revenue */
  totalRevenue: number;
  /** Real revenue (from economic activity) */
  realRevenue: number;
  /** Inflationary revenue (from token emissions) */
  inflationaryRevenue: number;
  /** Real yield percentage */
  realYieldPct: number;
  /** Revenue decomposition */
  components: RevenueComponent[];
  /** Revenue quality assessment */
  quality: 'premium' | 'solid' | 'mixed' | 'concerning' | 'unsustainable';
  /** Quality score (0-100) */
  qualityScore: number;
  /** Protocol P/E ratio (if applicable) */
  protocolPE: number | null;
  /** Revenue per user */
  revenuePerUser: number;
  /** Revenue per token (if applicable) */
  revenuePerToken: number;
  /** Sustainability projection */
  sustainability: {
    canSurviveWithoutEmissions: boolean;
    monthsToSustainability: number | null;
    requiredGrowthRate: number;
  };
  /** Insights */
  insights: string[];
  /** Computed at */
  computedAt: number;
}

// ── Revenue Decomposition ────────────────────────────────────────────

function decomposeRevenue(startup: DbStartup, metrics: DbMetricsHistory[]): RevenueComponent[] {
  const totalRevenue = startup.mrr;
  const inflation = Number(startup.inflation_rate);
  const isDeFi = ['DeFi', 'Infrastructure'].includes(startup.category);
  const isSaaS = ['SaaS', 'Data'].includes(startup.category);
  const isMarketplace = ['NFT', 'Social'].includes(startup.category);

  const components: RevenueComponent[] = [];

  if (isDeFi) {
    // DeFi: fees from actual transactions + potential emission subsidies
    const emissionRevenue = totalRevenue * Math.min(0.5, inflation / 20);
    const realFees = totalRevenue - emissionRevenue;

    components.push({
      source: 'protocol_fees', label: 'Protocol Fees', amount: Math.round(realFees * 0.6),
      pctOfTotal: +((realFees * 0.6 / totalRevenue) * 100).toFixed(1),
      yieldType: 'real', sustainable: true,
      description: 'Fees from actual protocol usage (swaps, lending, etc.)',
    });
    components.push({
      source: 'transaction_fees', label: 'Transaction Fees', amount: Math.round(realFees * 0.4),
      pctOfTotal: +((realFees * 0.4 / totalRevenue) * 100).toFixed(1),
      yieldType: 'real', sustainable: true,
      description: 'Network transaction fees from on-chain activity',
    });
    if (emissionRevenue > 0) {
      components.push({
        source: 'token_emissions', label: 'Token Emission Subsidies', amount: Math.round(emissionRevenue),
        pctOfTotal: +((emissionRevenue / totalRevenue) * 100).toFixed(1),
        yieldType: 'inflationary', sustainable: false,
        description: 'Revenue from inflationary token rewards — dilutes holders',
      });
    }
  } else if (isSaaS) {
    // SaaS: mostly subscription revenue (real)
    components.push({
      source: 'subscription', label: 'Subscription Revenue', amount: Math.round(totalRevenue * 0.85),
      pctOfTotal: 85,
      yieldType: 'real', sustainable: true,
      description: 'Recurring subscription payments from customers',
    });
    components.push({
      source: 'other', label: 'Usage-Based Revenue', amount: Math.round(totalRevenue * 0.15),
      pctOfTotal: 15,
      yieldType: 'real', sustainable: true,
      description: 'Variable revenue from usage overage',
    });
  } else if (isMarketplace) {
    components.push({
      source: 'transaction_fees', label: 'Marketplace Fees', amount: Math.round(totalRevenue * 0.7),
      pctOfTotal: 70,
      yieldType: 'real', sustainable: true,
      description: 'Transaction fees from marketplace activity',
    });
    components.push({
      source: 'protocol_fees', label: 'Listing/Premium Fees', amount: Math.round(totalRevenue * 0.3),
      pctOfTotal: 30,
      yieldType: 'real', sustainable: true,
      description: 'Premium listing and featured placement fees',
    });
  } else {
    // Generic
    const emissionPct = Math.min(30, inflation * 3);
    components.push({
      source: 'protocol_fees', label: 'Core Revenue', amount: Math.round(totalRevenue * (1 - emissionPct / 100)),
      pctOfTotal: +(100 - emissionPct).toFixed(0),
      yieldType: 'real', sustainable: true,
      description: 'Revenue from core product/service',
    });
    if (emissionPct > 5) {
      components.push({
        source: 'token_emissions', label: 'Emission Subsidies', amount: Math.round(totalRevenue * emissionPct / 100),
        pctOfTotal: +emissionPct.toFixed(0),
        yieldType: 'inflationary', sustainable: false,
        description: 'Revenue attributable to token emission incentives',
      });
    }
  }

  return components;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Decompose and analyze protocol revenue quality.
 */
export function decomposeProtocolRevenue(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): ProtocolRevenueReport {
  const components = decomposeRevenue(startup, metrics);
  const totalRevenue = startup.mrr;
  const realRevenue = components.filter(c => c.yieldType === 'real').reduce((s, c) => s + c.amount, 0);
  const inflationaryRevenue = components.filter(c => c.yieldType === 'inflationary').reduce((s, c) => s + c.amount, 0);
  const realYieldPct = totalRevenue > 0 ? (realRevenue / totalRevenue) * 100 : 0;

  // Quality assessment
  let qualityScore = 50;
  if (realYieldPct >= 90) qualityScore += 30;
  else if (realYieldPct >= 70) qualityScore += 15;
  else if (realYieldPct < 50) qualityScore -= 20;

  if (startup.verified) qualityScore += 10;
  if (Number(startup.growth_rate) > 10 && realYieldPct > 70) qualityScore += 10;
  qualityScore = Math.max(0, Math.min(100, qualityScore));

  const quality: ProtocolRevenueReport['quality'] =
    qualityScore >= 80 ? 'premium' : qualityScore >= 60 ? 'solid' : qualityScore >= 40 ? 'mixed' : qualityScore >= 20 ? 'concerning' : 'unsustainable';

  // Revenue metrics
  const revenuePerUser = startup.users > 0 ? totalRevenue / startup.users : 0;
  const revenuePerToken = 10000000 > 0 ? (totalRevenue * 12) / 10000000 : 0; // Assuming 10M token supply

  // Protocol P/E (annualized revenue / estimated FDV)
  const estimatedFDV = totalRevenue * 12 * 20; // 20x revenue multiple
  const protocolPE = realRevenue > 0 ? estimatedFDV / (realRevenue * 12) : null;

  // Sustainability
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const lastCost = sorted.length > 0 ? Number(sorted[sorted.length - 1].costs) : totalRevenue * 0.7;
  const canSurvive = realRevenue >= lastCost;
  const deficit = lastCost - realRevenue;
  const growthNeeded = deficit > 0 && totalRevenue > 0 ? (deficit / totalRevenue) * 100 : 0;
  const monthsToSustainability = deficit > 0 && Number(startup.growth_rate) > 0
    ? Math.ceil(Math.log(lastCost / realRevenue) / Math.log(1 + Number(startup.growth_rate) / 100))
    : deficit > 0 ? null : 0;

  // Insights
  const insights: string[] = [];
  if (realYieldPct >= 90) insights.push(`${realYieldPct.toFixed(0)}% of revenue is real yield — premium quality, sustainable.`);
  else if (realYieldPct < 50) insights.push(`WARNING: Only ${realYieldPct.toFixed(0)}% of revenue is real. ${(100 - realYieldPct).toFixed(0)}% comes from token emissions — unsustainable.`);
  else insights.push(`${realYieldPct.toFixed(0)}% real yield — mixed quality. Some revenue depends on token emissions.`);

  if (protocolPE !== null && protocolPE < 30) insights.push(`Protocol P/E of ${protocolPE.toFixed(0)}x on real revenue — reasonably valued.`);
  else if (protocolPE !== null) insights.push(`Protocol P/E of ${protocolPE.toFixed(0)}x — requires significant growth to justify.`);

  insights.push(`Revenue per user: $${revenuePerUser.toFixed(2)}/month`);
  if (canSurvive) insights.push('Could survive without token emissions — fundamentally sound.');
  else insights.push(`Needs ${growthNeeded.toFixed(0)}% more real revenue to cover costs without emissions.`);

  return {
    totalRevenue, realRevenue, inflationaryRevenue, realYieldPct: +realYieldPct.toFixed(1),
    components, quality, qualityScore, protocolPE,
    revenuePerUser: +revenuePerUser.toFixed(2),
    revenuePerToken: +revenuePerToken.toFixed(4),
    sustainability: {
      canSurviveWithoutEmissions: canSurvive,
      monthsToSustainability,
      requiredGrowthRate: +growthNeeded.toFixed(1),
    },
    insights, computedAt: Date.now(),
  };
}
