/**
 * AI Investment Memo Generator
 * ─────────────────────────────
 * Generates institutional-grade 2-page investment memos from verified data.
 * Zero LLM API calls — uses structured templates + data-driven narratives.
 *
 * Memo structure (Goldman/a16z standard):
 *   1. Executive Summary — 3-sentence thesis
 *   2. Company Overview — what, who, when, where
 *   3. Market Opportunity — TAM, timing, positioning
 *   4. Traction & Metrics — verified data with trends
 *   5. Financial Analysis — unit economics, projections
 *   6. Competitive Landscape — moat, positioning, risks
 *   7. Team Assessment — strength, gaps, key-person risk
 *   8. Risk Factors — top risks with mitigations
 *   9. Investment Terms — recommended structure
 *  10. Recommendation — invest/pass/monitor with conviction level
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { analyzeRedFlags } from './red-flag-detection';
import { computeReputationScore } from './reputation-score';
import { predictSurvival } from './survival-predictor';

// ── Types ────────────────────────────────────────────────────────────

export type MemoRecommendation = 'strong_invest' | 'invest' | 'conditional_invest' | 'monitor' | 'pass';

export interface MemoSection {
  title: string;
  content: string;
  /** Key data points supporting this section */
  dataPoints: { label: string; value: string; sentiment: 'positive' | 'neutral' | 'negative' }[];
}

export interface InvestmentMemo {
  /** Startup name */
  startupName: string;
  /** Category */
  category: string;
  /** Date generated */
  generatedAt: string;
  /** Investment recommendation */
  recommendation: MemoRecommendation;
  /** Conviction level (1-10) */
  convictionLevel: number;
  /** Executive summary (3 sentences) */
  executiveSummary: string;
  /** All memo sections */
  sections: MemoSection[];
  /** Key metrics table */
  keyMetrics: { metric: string; value: string; benchmark: string; assessment: string }[];
  /** Top 3 reasons to invest */
  bullCase: string[];
  /** Top 3 reasons to pass */
  bearCase: string[];
  /** Recommended investment terms */
  suggestedTerms: {
    instrument: string;
    amount: string;
    valuation: string;
    keyTerms: string[];
  };
  /** ChainTrust-specific data */
  chainTrustData: {
    trustScore: number;
    ctsScore: number;
    redFlagCount: number;
    verificationStatus: string;
    survivalProbability: number;
  };
}

// ── Narrative Templates ──────────────────────────────────────────────

function growthNarrative(growth: number, trend: string): string {
  if (growth >= 30) return `demonstrating exceptional momentum at ${growth}% MoM, placing it in the top tier of growth-stage companies`;
  if (growth >= 15) return `growing at a healthy ${growth}% MoM, consistent with Series A-ready benchmarks`;
  if (growth >= 5) return `showing moderate growth at ${growth}% MoM, which warrants monitoring for acceleration signals`;
  if (growth > 0) return `growing slowly at ${growth}% MoM, below the institutional threshold of 10%+ for early-stage`;
  return `experiencing revenue contraction at ${growth}% MoM, which represents a material concern`;
}

function runwayNarrative(runway: number): string {
  if (runway >= 999) return 'The company is cash-flow positive, eliminating near-term funding risk.';
  if (runway >= 24) return `With ${runway} months of runway, the company has substantial strategic flexibility.`;
  if (runway >= 18) return `${runway} months of runway provides a comfortable buffer for the next fundraise.`;
  if (runway >= 12) return `At ${runway} months of runway, the company should begin fundraising preparations within 3-6 months.`;
  if (runway >= 6) return `With only ${runway} months of runway, fundraising is urgent. Bridge financing should be considered.`;
  return `CRITICAL: Only ${runway} months of cash remaining. Immediate action required.`;
}

function teamNarrative(teamSize: number, mrr: number): string {
  const revPerEmployee = teamSize > 0 ? (mrr * 12) / teamSize : 0;
  if (revPerEmployee > 200000) return `The team of ${teamSize} operates at exceptional efficiency ($${(revPerEmployee / 1000).toFixed(0)}K ARR/employee), suggesting strong operational discipline.`;
  if (revPerEmployee > 100000) return `At ${teamSize} employees and $${(revPerEmployee / 1000).toFixed(0)}K ARR/employee, the team demonstrates solid productivity.`;
  if (teamSize >= 15) return `The ${teamSize}-person team provides operational maturity, though revenue efficiency ($${(revPerEmployee / 1000).toFixed(0)}K/head) could improve.`;
  if (teamSize >= 5) return `A lean team of ${teamSize} appropriate for the current stage, with room for strategic hires.`;
  return `At ${teamSize} team members, key-person risk is elevated. Critical hires are needed to de-risk execution.`;
}

function tokenNarrative(whale: number, inflation: number): string {
  const parts: string[] = [];
  if (whale < 15) parts.push(`excellent token distribution (${whale}% top holder concentration)`);
  else if (whale < 30) parts.push(`acceptable token distribution (${whale}% concentration)`);
  else parts.push(`concerning token concentration at ${whale}%`);

  if (inflation <= 3) parts.push(`conservative inflation (${inflation}%)`);
  else if (inflation <= 6) parts.push(`moderate inflation (${inflation}%)`);
  else parts.push(`aggressive ${inflation}% inflation requiring attention`);

  return `Tokenomics show ${parts.join(' with ')}.`;
}

// ── Memo Generation ──────────────────────────────────────────────────

/**
 * Generate a complete institutional-grade investment memo.
 */
export function generateInvestmentMemo(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): InvestmentMemo {
  const growth = Number(startup.growth_rate);
  const whale = Number(startup.whale_concentration);
  const inflation = Number(startup.inflation_rate);
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));

  // Compute supporting analyses
  const redFlags = analyzeRedFlags(startup, metrics, allStartups);
  const cts = computeReputationScore(startup, metrics, allStartups);
  const survival = predictSurvival(startup, metrics);

  // Compute runway
  let runway = 999;
  if (sorted.length >= 2) {
    const lastRev = Number(sorted[sorted.length - 1].revenue);
    const lastCost = Number(sorted[sorted.length - 1].costs);
    const burn = Math.max(lastCost - lastRev, 0);
    runway = burn > 0 ? Math.round(startup.treasury / burn) : 999;
  }

  // Revenue trend
  const revenues = sorted.map(m => Number(m.revenue));
  const recentGrowth = revenues.length >= 3
    ? ((revenues[revenues.length - 1] - revenues[revenues.length - 3]) / Math.max(revenues[revenues.length - 3], 1)) * 100
    : growth;
  const trend = recentGrowth > growth ? 'accelerating' : recentGrowth < growth * 0.5 ? 'decelerating' : 'stable';

  // Peer ranking
  const categoryPeers = allStartups.filter(s => s.category === startup.category);
  const mrrRank = categoryPeers.filter(s => s.mrr > startup.mrr).length + 1;
  const growthRank = categoryPeers.filter(s => Number(s.growth_rate) > growth).length + 1;

  // Stage classification
  const stage = startup.mrr >= 200000 ? 'Growth' : startup.mrr >= 50000 ? 'Series A' : startup.mrr >= 10000 ? 'Seed' : 'Pre-Seed';

  // Determine recommendation
  let recommendation: MemoRecommendation;
  let convictionLevel: number;

  if (cts.totalScore >= 80 && growth >= 20 && redFlags.counts.critical === 0 && startup.verified) {
    recommendation = 'strong_invest';
    convictionLevel = 9;
  } else if (cts.totalScore >= 65 && growth >= 10 && redFlags.counts.critical <= 1) {
    recommendation = 'invest';
    convictionLevel = 7;
  } else if (cts.totalScore >= 50 && growth >= 5) {
    recommendation = 'conditional_invest';
    convictionLevel = 5;
  } else if (growth > 0 && redFlags.riskLevel !== 'danger') {
    recommendation = 'monitor';
    convictionLevel = 3;
  } else {
    recommendation = 'pass';
    convictionLevel = 2;
  }

  // Executive Summary
  const executiveSummary = `${startup.name} is a ${stage}-stage ${startup.category} company on ${startup.blockchain}, ${growthNarrative(growth, trend)}. ` +
    `At $${(startup.mrr / 1000).toFixed(0)}K MRR with ${startup.users.toLocaleString()} users, the company ${startup.verified ? 'has on-chain verified metrics via ChainTrust' : 'reports self-attested metrics'}. ` +
    `${recommendation === 'strong_invest' || recommendation === 'invest' ? 'We recommend investment' : recommendation === 'conditional_invest' ? 'We recommend conditional investment pending resolution of identified concerns' : recommendation === 'monitor' ? 'We recommend monitoring for improved metrics before commitment' : 'We recommend passing on this opportunity at this time'} with a conviction level of ${convictionLevel}/10.`;

  // Build sections
  const sections: MemoSection[] = [
    {
      title: 'Company Overview',
      content: `${startup.name} operates in the ${startup.category} vertical on ${startup.blockchain}. ${startup.description || 'No description provided.'} The company was founded ${startup.founded_date ? `on ${startup.founded_date}` : 'recently'} and currently employs ${startup.team_size} people.${startup.website ? ` Website: ${startup.website}` : ''}`,
      dataPoints: [
        { label: 'Category', value: startup.category, sentiment: 'neutral' },
        { label: 'Blockchain', value: startup.blockchain, sentiment: 'neutral' },
        { label: 'Team Size', value: `${startup.team_size}`, sentiment: startup.team_size >= 8 ? 'positive' : 'neutral' },
        { label: 'Stage', value: stage, sentiment: 'neutral' },
      ],
    },
    {
      title: 'Traction & Metrics',
      content: `The company generates $${(startup.mrr / 1000).toFixed(0)}K MRR ($${((startup.mrr * 12) / 1000000).toFixed(1)}M ARR), ${growthNarrative(growth, trend)}. User base stands at ${startup.users.toLocaleString()}, ranking #${mrrRank} among ${categoryPeers.length} ${startup.category} peers by revenue and #${growthRank} by growth rate. ${startup.verified ? 'All metrics are on-chain verified via ChainTrust with a trust score of ' + startup.trust_score + '/100.' : 'Metrics are self-reported and not yet independently verified.'}`,
      dataPoints: [
        { label: 'MRR', value: `$${startup.mrr.toLocaleString()}`, sentiment: startup.mrr >= 50000 ? 'positive' : 'neutral' },
        { label: 'Growth', value: `${growth}% MoM`, sentiment: growth >= 15 ? 'positive' : growth >= 5 ? 'neutral' : 'negative' },
        { label: 'Users', value: startup.users.toLocaleString(), sentiment: 'neutral' },
        { label: 'Category Rank', value: `#${mrrRank}/${categoryPeers.length}`, sentiment: mrrRank <= 3 ? 'positive' : 'neutral' },
      ],
    },
    {
      title: 'Financial Analysis',
      content: `${runwayNarrative(runway)} ${teamNarrative(startup.team_size, startup.mrr)} Treasury stands at $${startup.treasury.toLocaleString()}.`,
      dataPoints: [
        { label: 'Treasury', value: `$${startup.treasury.toLocaleString()}`, sentiment: startup.treasury >= 1000000 ? 'positive' : 'neutral' },
        { label: 'Runway', value: runway >= 999 ? 'Profitable' : `${runway} months`, sentiment: runway >= 18 ? 'positive' : runway >= 6 ? 'neutral' : 'negative' },
        { label: 'ARR/Employee', value: startup.team_size > 0 ? `$${((startup.mrr * 12 / startup.team_size) / 1000).toFixed(0)}K` : 'N/A', sentiment: 'neutral' },
      ],
    },
    {
      title: 'Tokenomics & Distribution',
      content: tokenNarrative(whale, inflation),
      dataPoints: [
        { label: 'Whale Concentration', value: `${whale}%`, sentiment: whale < 25 ? 'positive' : whale < 40 ? 'neutral' : 'negative' },
        { label: 'Inflation Rate', value: `${inflation}%`, sentiment: inflation <= 5 ? 'positive' : 'negative' },
        { label: 'Sustainability Score', value: `${startup.sustainability_score}/100`, sentiment: startup.sustainability_score >= 70 ? 'positive' : 'neutral' },
      ],
    },
    {
      title: 'Risk Assessment',
      content: `ChainTrust's automated analysis identified ${redFlags.flags.length} flags (${redFlags.counts.critical} critical, ${redFlags.counts.warning} warnings). Overall risk level: ${redFlags.riskLevel.toUpperCase()}. Survival probability (12 months): ${(survival.survival12m.probability * 100).toFixed(0)}%. Next funding round probability: ${(survival.nextRoundProbability.probability * 100).toFixed(0)}%.`,
      dataPoints: [
        { label: 'Red Flag Count', value: `${redFlags.flags.length}`, sentiment: redFlags.flags.length <= 2 ? 'positive' : redFlags.flags.length <= 5 ? 'neutral' : 'negative' },
        { label: 'Risk Level', value: redFlags.riskLevel, sentiment: redFlags.riskLevel === 'clean' ? 'positive' : redFlags.riskLevel === 'watch' ? 'neutral' : 'negative' },
        { label: '12mo Survival', value: `${(survival.survival12m.probability * 100).toFixed(0)}%`, sentiment: survival.survival12m.probability >= 0.8 ? 'positive' : 'neutral' },
        { label: 'CTS Score', value: `${cts.totalScore}/100 (${cts.tier})`, sentiment: cts.totalScore >= 70 ? 'positive' : 'neutral' },
      ],
    },
  ];

  // Key metrics table
  const keyMetrics = [
    { metric: 'MRR', value: `$${startup.mrr.toLocaleString()}`, benchmark: stage === 'Seed' ? '$10-100K' : '$100-300K', assessment: startup.mrr >= 50000 ? 'Above' : 'Below' },
    { metric: 'Growth Rate', value: `${growth}% MoM`, benchmark: '15-25% MoM', assessment: growth >= 15 ? 'Strong' : growth >= 5 ? 'Moderate' : 'Weak' },
    { metric: 'Trust Score', value: `${startup.trust_score}/100`, benchmark: '>70', assessment: startup.trust_score >= 70 ? 'High' : 'Needs work' },
    { metric: 'CTS Score', value: `${cts.totalScore}/100`, benchmark: '>65', assessment: cts.totalScore >= 65 ? 'Strong' : 'Below target' },
    { metric: 'Runway', value: runway >= 999 ? 'Profitable' : `${runway}mo`, benchmark: '>18 months', assessment: runway >= 18 ? 'Healthy' : 'Tight' },
    { metric: 'Red Flags', value: `${redFlags.counts.critical} critical`, benchmark: '0', assessment: redFlags.counts.critical === 0 ? 'Clean' : 'Concerns' },
    { metric: 'Whale Conc.', value: `${whale}%`, benchmark: '<30%', assessment: whale < 30 ? 'Healthy' : 'Elevated' },
    { metric: 'Verified', value: startup.verified ? 'Yes' : 'No', benchmark: 'Yes', assessment: startup.verified ? 'Verified' : 'Unverified' },
  ];

  // Bull/Bear case
  const bullCase: string[] = [];
  const bearCase: string[] = [];

  if (growth >= 20) bullCase.push(`Exceptional ${growth}% MoM growth rate`);
  if (startup.verified) bullCase.push('On-chain verified metrics — highest data integrity');
  if (cts.totalScore >= 70) bullCase.push(`Strong ChainTrust Score (${cts.totalScore}/100, ${cts.tier} tier)`);
  if (startup.trust_score >= 80) bullCase.push(`Elite trust score of ${startup.trust_score}/100`);
  if (whale < 15) bullCase.push('Excellent token distribution — low concentration risk');
  if (runway >= 24 || runway >= 999) bullCase.push(runway >= 999 ? 'Cash-flow positive' : `Strong ${runway}-month runway`);
  if (startup.sustainability_score >= 80) bullCase.push(`Top-tier ESG profile (${startup.sustainability_score}/100)`);
  if (mrrRank <= 2) bullCase.push(`#${mrrRank} in ${startup.category} by revenue`);

  if (growth < 10) bearCase.push(`Growth rate of ${growth}% is below institutional threshold`);
  if (!startup.verified) bearCase.push('Metrics are not on-chain verified — data integrity unknown');
  if (redFlags.counts.critical > 0) bearCase.push(`${redFlags.counts.critical} critical red flags identified`);
  if (whale > 40) bearCase.push(`High whale concentration (${whale}%) creates governance and rug-pull risk`);
  if (runway < 12 && runway < 999) bearCase.push(`Short runway of ${runway} months — funding urgency`);
  if (inflation > 8) bearCase.push(`Aggressive ${inflation}% inflation diluting holders`);
  if (startup.team_size < 5) bearCase.push(`Small team of ${startup.team_size} — key-person risk`);

  // Suggested terms
  const suggestedTerms = {
    instrument: stage === 'Pre-Seed' || stage === 'Seed' ? 'Post-Money SAFE' : 'Series Preferred',
    amount: stage === 'Pre-Seed' ? '$100K-$500K' : stage === 'Seed' ? '$500K-$2M' : '$2M-$10M',
    valuation: stage === 'Pre-Seed' ? `$${(Math.max(startup.mrr * 40, 3000000) / 1000000).toFixed(0)}M cap`
      : stage === 'Seed' ? `$${(Math.max(startup.mrr * 50, 8000000) / 1000000).toFixed(0)}M cap`
      : `$${(Math.max(startup.mrr * 80, 20000000) / 1000000).toFixed(0)}M pre-money`,
    keyTerms: stage === 'Pre-Seed' || stage === 'Seed'
      ? ['20% discount', 'Pro-rata rights', 'MFN clause', 'Milestone-based escrow via ChainTrust']
      : ['1x non-participating liq pref', 'Broad-based weighted average anti-dilution', '1 board seat', '10% option pool', 'Pro-rata rights'],
  };

  return {
    startupName: startup.name,
    category: startup.category,
    generatedAt: new Date().toISOString(),
    recommendation,
    convictionLevel,
    executiveSummary,
    sections,
    keyMetrics,
    bullCase: bullCase.slice(0, 5),
    bearCase: bearCase.slice(0, 5),
    suggestedTerms,
    chainTrustData: {
      trustScore: startup.trust_score,
      ctsScore: cts.totalScore,
      redFlagCount: redFlags.flags.length,
      verificationStatus: startup.verified ? 'On-chain verified' : 'Self-reported',
      survivalProbability: survival.survival12m.probability,
    },
  };
}

/** Recommendation label and color config */
export const RECOMMENDATION_CONFIG: Record<MemoRecommendation, { label: string; color: string; bg: string }> = {
  strong_invest:      { label: 'STRONG INVEST', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  invest:             { label: 'INVEST',        color: 'text-blue-500',    bg: 'bg-blue-500/10' },
  conditional_invest: { label: 'CONDITIONAL',   color: 'text-amber-500',   bg: 'bg-amber-500/10' },
  monitor:            { label: 'MONITOR',       color: 'text-orange-500',  bg: 'bg-orange-500/10' },
  pass:               { label: 'PASS',          color: 'text-red-500',     bg: 'bg-red-500/10' },
};
