/**
 * LP Portal Engine
 * ────────────────
 * Generates professional quarterly LP reports with fund performance,
 * portfolio company updates, and market commentary.
 *
 * This is what fund administrators charge $50K+/year for.
 * ChainTrust does it automatically from verified on-chain data.
 */

import type { DbStartup } from '@/types/database';
import { calculatePortfolioReturns, type CashFlow, type PortfolioReturnMetrics } from './return-calculator';

// ── Types ────────────────────────────────────────────────────────────

export interface LPReport {
  /** Fund name */
  fundName: string;
  /** Report period */
  period: { quarter: string; year: number; startDate: string; endDate: string };
  /** Fund overview */
  overview: {
    fundSize: number;
    vintage: number;
    deployedCapital: number;
    deployedPct: number;
    portfolioCompanies: number;
    activeDeals: number;
  };
  /** Performance metrics */
  performance: PortfolioReturnMetrics;
  /** Portfolio company summaries */
  companySummaries: CompanySummary[];
  /** Key developments this quarter */
  keyDevelopments: string[];
  /** Market commentary */
  marketCommentary: string[];
  /** Outlook */
  outlook: string;
  /** Capital call / distribution activity */
  capitalActivity: { type: 'call' | 'distribution'; amount: number; date: string; description: string }[];
  /** Generated at */
  generatedAt: number;
}

export interface CompanySummary {
  name: string;
  category: string;
  invested: number;
  currentValue: number;
  moic: number;
  mrr: number;
  growthRate: number;
  trustScore: number;
  verified: boolean;
  status: 'performing' | 'watch' | 'underperforming' | 'exited';
  highlights: string[];
  concerns: string[];
}

// ── Report Generation ────────────────────────────────────────────────

function classifyStatus(startup: DbStartup, moic: number): CompanySummary['status'] {
  if (moic >= 2 && Number(startup.growth_rate) > 10) return 'performing';
  if (moic >= 1 && Number(startup.growth_rate) > 0) return 'watch';
  return 'underperforming';
}

function generateCompanySummary(startup: DbStartup, invested: number, currentValue: number): CompanySummary {
  const moic = invested > 0 ? currentValue / invested : 0;
  const growth = Number(startup.growth_rate);
  const status = classifyStatus(startup, moic);

  const highlights: string[] = [];
  const concerns: string[] = [];

  if (growth >= 20) highlights.push(`Strong ${growth}% MoM growth`);
  if (startup.verified) highlights.push('On-chain verified metrics');
  if (startup.trust_score >= 80) highlights.push(`Elite trust score (${startup.trust_score})`);
  if (moic >= 2) highlights.push(`${moic.toFixed(1)}x return on investment`);
  if (startup.sustainability_score >= 70) highlights.push('Strong ESG profile');

  if (growth < 5) concerns.push(`Low growth (${growth}%)`);
  if (!startup.verified) concerns.push('Metrics not yet verified');
  if (Number(startup.whale_concentration) > 40) concerns.push(`High whale concentration (${startup.whale_concentration}%)`);
  if (moic < 1) concerns.push(`Below cost (${moic.toFixed(2)}x)`);

  return {
    name: startup.name,
    category: startup.category,
    invested,
    currentValue,
    moic: +moic.toFixed(2),
    mrr: startup.mrr,
    growthRate: growth,
    trustScore: startup.trust_score,
    verified: startup.verified,
    status,
    highlights: highlights.slice(0, 3),
    concerns: concerns.slice(0, 3),
  };
}

/**
 * Generate a complete LP quarterly report.
 */
export function generateLPReport(
  fundName: string,
  portfolioStartups: DbStartup[],
  investmentAmounts: Map<string, number>,
  currentValuations: Map<string, number>,
): LPReport {
  const now = new Date();
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  const year = now.getFullYear();

  // Company summaries
  const companySummaries: CompanySummary[] = portfolioStartups.map(s => {
    const invested = investmentAmounts.get(s.id) ?? 200000;
    const currentValue = currentValuations.get(s.id) ?? invested * (1 + Number(s.growth_rate) / 100 * 6);
    return generateCompanySummary(s, invested, currentValue);
  });

  // Performance calculation
  const month = 30 * 24 * 3600 * 1000;
  const investments = portfolioStartups.map(s => {
    const invested = investmentAmounts.get(s.id) ?? 200000;
    const currentValue = currentValuations.get(s.id) ?? invested * 1.5;
    return {
      name: s.name,
      cashFlows: [{ date: Date.now() - 9 * month, amount: -invested, type: 'investment' as const, description: 'Initial investment' }],
      currentValuation: currentValue,
    };
  });
  const performance = calculatePortfolioReturns(investments);

  // Fund overview
  const totalInvested = companySummaries.reduce((s, c) => s + c.invested, 0);
  const fundSize = Math.max(totalInvested * 2, 5000000);

  // Key developments
  const keyDevelopments: string[] = [];
  const topPerformer = companySummaries.sort((a, b) => b.moic - a.moic)[0];
  if (topPerformer) keyDevelopments.push(`Top performer: ${topPerformer.name} at ${topPerformer.moic}x MOIC`);

  const verified = companySummaries.filter(c => c.verified).length;
  keyDevelopments.push(`${verified}/${companySummaries.length} portfolio companies have on-chain verified metrics`);

  const avgGrowth = companySummaries.reduce((s, c) => s + c.growthRate, 0) / companySummaries.length;
  keyDevelopments.push(`Portfolio average growth: ${avgGrowth.toFixed(1)}% MoM`);

  const performing = companySummaries.filter(c => c.status === 'performing').length;
  keyDevelopments.push(`${performing} companies performing, ${companySummaries.length - performing} on watch/underperforming`);

  // Market commentary
  const marketCommentary = [
    'The crypto/Web3 startup ecosystem continues to mature with increasing on-chain transparency.',
    `The ${companySummaries[0]?.category ?? 'DeFi'} sector shows strong momentum with verified metrics becoming the norm.`,
    'Institutional investors increasingly require on-chain verification as a baseline for investment consideration.',
  ];

  // Outlook
  const outlook = performance.aggregate.tvpi >= 1.5
    ? 'The portfolio is well-positioned for continued growth. We expect multiple exits within the next 12-18 months as portfolio companies reach maturity.'
    : 'The portfolio is in the building phase. We are focused on supporting companies to hit key milestones and prepare for follow-on rounds.';

  return {
    fundName,
    period: {
      quarter: `${quarter} ${year}`,
      year,
      startDate: `${year}-${String((Math.ceil((now.getMonth() + 1) / 3) - 1) * 3 + 1).padStart(2, '0')}-01`,
      endDate: now.toISOString().split('T')[0],
    },
    overview: {
      fundSize,
      vintage: year - 1,
      deployedCapital: totalInvested,
      deployedPct: +(totalInvested / fundSize * 100).toFixed(1),
      portfolioCompanies: companySummaries.length,
      activeDeals: companySummaries.filter(c => c.status !== 'exited').length,
    },
    performance,
    companySummaries: companySummaries.sort((a, b) => b.moic - a.moic),
    keyDevelopments,
    marketCommentary,
    outlook,
    capitalActivity: [],
    generatedAt: Date.now(),
  };
}

/**
 * Generate a demo LP report from the platform's startups.
 */
export function generateDemoLPReport(startups: DbStartup[]): LPReport {
  const portfolio = startups.slice(0, 5);
  const investments = new Map<string, number>();
  const valuations = new Map<string, number>();

  for (const s of portfolio) {
    const invested = 100000 + Math.round(s.mrr * 1.5);
    investments.set(s.id, invested);
    valuations.set(s.id, invested * (1 + Number(s.growth_rate) / 100 * 8));
  }

  return generateLPReport('ChainTrust Demo Fund I', portfolio, investments, valuations);
}
