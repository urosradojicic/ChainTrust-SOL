/**
 * Algorithmic AI Due Diligence Engine
 * 100% rule-based — zero API calls, zero cost, zero tokens.
 * Analyzes startup data and generates institutional-grade risk reports.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SignalType = 'positive' | 'warning' | 'danger' | 'info';

export interface DueDiligenceSignal {
  category: string;
  signal: string;
  detail: string;
  type: SignalType;
  weight: number;
}

export interface DueDiligenceReport {
  overallRisk: RiskLevel;
  riskScore: number; // 0-100, higher = riskier
  investmentGrade: string; // AAA to D
  summary: string;
  signals: DueDiligenceSignal[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  financialHealth: { label: string; score: number; max: number; status: RiskLevel }[];
  comparativePosition: { metric: string; value: number; percentile: number; benchmark: number }[];
}

function calcGrowthTrend(metrics: DbMetricsHistory[]): 'accelerating' | 'stable' | 'decelerating' | 'declining' {
  if (metrics.length < 3) return 'stable';
  const recent = metrics.slice(-3).map(m => Number(m.growth_rate));
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const trend = recent[2] - recent[0];
  if (avg < 0) return 'declining';
  if (trend > 2) return 'accelerating';
  if (trend < -2) return 'decelerating';
  return 'stable';
}

function calcRunwayMonths(startup: DbStartup, metrics: DbMetricsHistory[]): number {
  if (metrics.length < 2) return 12;
  const lastTwo = metrics.slice(-2);
  const avgCosts = (Number(lastTwo[0].costs) + Number(lastTwo[1].costs)) / 2;
  const avgRevenue = (Number(lastTwo[0].revenue) + Number(lastTwo[1].revenue)) / 2;
  const monthlyBurn = Math.max(avgCosts - avgRevenue, 0);
  if (monthlyBurn <= 0) return 999; // profitable
  return Math.round(Number(startup.treasury) / monthlyBurn);
}

function calcRevenueVolatility(metrics: DbMetricsHistory[]): number {
  if (metrics.length < 3) return 0;
  const revs = metrics.map(m => Number(m.revenue));
  const mean = revs.reduce((a, b) => a + b, 0) / revs.length;
  const variance = revs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / revs.length;
  return Math.sqrt(variance) / mean * 100; // coefficient of variation
}

export function generateDueDiligenceReport(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): DueDiligenceReport {
  const signals: DueDiligenceSignal[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  let riskPoints = 0;

  const growthTrend = calcGrowthTrend(metrics);
  const runwayMonths = calcRunwayMonths(startup, metrics);
  const revenueVolatility = calcRevenueVolatility(metrics);

  // ── Financial Health ──
  const growth = Number(startup.growth_rate);
  if (growth > 15) {
    signals.push({ category: 'Growth', signal: 'Strong growth momentum', detail: `${growth}% MoM growth rate exceeds institutional threshold of 15%`, type: 'positive', weight: 3 });
    strengths.push(`Exceptional growth at ${growth}% MoM`);
  } else if (growth > 5) {
    signals.push({ category: 'Growth', signal: 'Healthy growth rate', detail: `${growth}% MoM growth is within healthy range`, type: 'positive', weight: 1 });
  } else if (growth > 0) {
    signals.push({ category: 'Growth', signal: 'Slow growth', detail: `${growth}% MoM growth is below institutional benchmark of 5%`, type: 'warning', weight: 2 });
    riskPoints += 10;
    weaknesses.push('Growth rate below 5% — may indicate market saturation');
  } else {
    signals.push({ category: 'Growth', signal: 'Revenue declining', detail: `Negative growth of ${growth}% indicates revenue contraction`, type: 'danger', weight: 4 });
    riskPoints += 25;
    weaknesses.push(`Revenue declining at ${growth}% — immediate concern`);
    recommendations.push('Investigate revenue decline: churn analysis, market conditions, and competitive landscape');
  }

  if (growthTrend === 'accelerating') {
    signals.push({ category: 'Growth', signal: 'Growth accelerating', detail: 'Recent growth rates show upward trajectory', type: 'positive', weight: 2 });
    strengths.push('Growth is accelerating — positive trajectory');
  } else if (growthTrend === 'decelerating') {
    signals.push({ category: 'Growth', signal: 'Growth decelerating', detail: 'Recent growth rates show downward trajectory despite positive growth', type: 'warning', weight: 2 });
    riskPoints += 8;
  } else if (growthTrend === 'declining') {
    signals.push({ category: 'Growth', signal: 'Revenue in decline', detail: 'Consistent negative growth across recent periods', type: 'danger', weight: 3 });
    riskPoints += 15;
  }

  // Revenue scale
  if (startup.mrr > 100000) {
    signals.push({ category: 'Revenue', signal: 'Strong revenue base', detail: `$${(startup.mrr / 1000).toFixed(0)}K MRR demonstrates product-market fit`, type: 'positive', weight: 2 });
    strengths.push(`$${(startup.mrr / 1000).toFixed(0)}K MRR — clear product-market fit`);
  } else if (startup.mrr < 30000) {
    signals.push({ category: 'Revenue', signal: 'Early-stage revenue', detail: `$${(startup.mrr / 1000).toFixed(0)}K MRR — pre-scale revenue level`, type: 'info', weight: 1 });
    riskPoints += 5;
  }

  // Revenue volatility
  if (revenueVolatility > 30) {
    signals.push({ category: 'Revenue', signal: 'High revenue volatility', detail: `${revenueVolatility.toFixed(1)}% coefficient of variation — inconsistent revenue stream`, type: 'warning', weight: 2 });
    riskPoints += 10;
    weaknesses.push('Revenue is highly volatile — may indicate customer concentration risk');
  }

  // ── Runway & Treasury ──
  if (runwayMonths >= 999) {
    signals.push({ category: 'Treasury', signal: 'Cash flow positive', detail: 'Revenue exceeds costs — self-sustaining', type: 'positive', weight: 3 });
    strengths.push('Cash flow positive — no dependency on external funding');
  } else if (runwayMonths > 18) {
    signals.push({ category: 'Treasury', signal: 'Healthy runway', detail: `${runwayMonths} months of runway at current burn rate`, type: 'positive', weight: 2 });
    strengths.push(`${runwayMonths}-month runway provides strategic flexibility`);
  } else if (runwayMonths > 6) {
    signals.push({ category: 'Treasury', signal: 'Limited runway', detail: `${runwayMonths} months of runway — needs funding within 12 months`, type: 'warning', weight: 2 });
    riskPoints += 12;
    recommendations.push('Initiate fundraising process — runway below 18-month institutional comfort zone');
  } else {
    signals.push({ category: 'Treasury', signal: 'Critical runway', detail: `Only ${runwayMonths} months of runway remaining`, type: 'danger', weight: 4 });
    riskPoints += 25;
    weaknesses.push(`Critical: only ${runwayMonths} months of runway`);
    recommendations.push('URGENT: Secure bridge funding or dramatically reduce burn rate');
  }

  // ── Tokenomics ──
  const whaleConc = Number(startup.whale_concentration);
  if (whaleConc > 60) {
    signals.push({ category: 'Tokenomics', signal: 'Extreme whale concentration', detail: `Top wallets hold ${whaleConc}% — severe rug-pull risk`, type: 'danger', weight: 4 });
    riskPoints += 20;
    weaknesses.push(`${whaleConc}% whale concentration — extreme centralization risk`);
    recommendations.push('Implement token distribution program to reduce whale concentration below 40%');
  } else if (whaleConc > 40) {
    signals.push({ category: 'Tokenomics', signal: 'High whale concentration', detail: `Top wallets hold ${whaleConc}% — above 40% threshold`, type: 'warning', weight: 2 });
    riskPoints += 10;
    weaknesses.push(`${whaleConc}% whale concentration is above institutional comfort level`);
  } else if (whaleConc < 25) {
    signals.push({ category: 'Tokenomics', signal: 'Well-distributed token supply', detail: `Top wallets hold only ${whaleConc}% — healthy distribution`, type: 'positive', weight: 2 });
    strengths.push('Healthy token distribution — low centralization risk');
  }

  const inflation = Number(startup.inflation_rate);
  if (inflation > 8) {
    signals.push({ category: 'Tokenomics', signal: 'Excessive inflation', detail: `${inflation}% annual inflation dilutes holder value`, type: 'danger', weight: 3 });
    riskPoints += 15;
    weaknesses.push(`${inflation}% inflation rate is unsustainable`);
  } else if (inflation > 5) {
    signals.push({ category: 'Tokenomics', signal: 'Moderate inflation', detail: `${inflation}% annual inflation is above 5% benchmark`, type: 'warning', weight: 1 });
    riskPoints += 5;
  } else if (inflation <= 2) {
    signals.push({ category: 'Tokenomics', signal: 'Conservative inflation', detail: `${inflation}% annual inflation is within healthy range`, type: 'positive', weight: 1 });
  }

  // ── Sustainability & ESG ──
  const susScore = startup.sustainability_score;
  if (susScore > 80) {
    signals.push({ category: 'ESG', signal: 'Strong ESG profile', detail: `Sustainability score of ${susScore}/100 exceeds institutional ESG requirements`, type: 'positive', weight: 2 });
    strengths.push(`Top-tier ESG profile (${susScore}/100) — attractive to ESG-focused funds`);
  } else if (susScore < 40) {
    signals.push({ category: 'ESG', signal: 'Low ESG score', detail: `${susScore}/100 sustainability score may exclude ESG-mandated investors`, type: 'warning', weight: 2 });
    riskPoints += 8;
    recommendations.push('Improve sustainability practices to unlock ESG-mandated capital');
  }

  // ── Verification & Trust ──
  if (startup.verified) {
    signals.push({ category: 'Verification', signal: 'On-chain verified', detail: 'Metrics are cryptographically verified on Solana', type: 'positive', weight: 3 });
    strengths.push('On-chain verification — tamper-proof data provenance');
  } else {
    signals.push({ category: 'Verification', signal: 'Unverified metrics', detail: 'Self-reported data — no on-chain verification', type: 'danger', weight: 3 });
    riskPoints += 20;
    weaknesses.push('Metrics are self-reported — no independent verification');
    recommendations.push('Complete on-chain verification to build institutional trust');
  }

  if (startup.trust_score > 80) {
    signals.push({ category: 'Trust', signal: 'High trust score', detail: `${startup.trust_score}/100 trust score indicates strong reliability`, type: 'positive', weight: 2 });
  } else if (startup.trust_score < 50) {
    signals.push({ category: 'Trust', signal: 'Low trust score', detail: `${startup.trust_score}/100 — below institutional minimum of 60`, type: 'danger', weight: 3 });
    riskPoints += 15;
    weaknesses.push(`Trust score of ${startup.trust_score} is below acceptable threshold`);
  }

  // ── Team & Operational ──
  if (startup.team_size >= 20) {
    signals.push({ category: 'Team', signal: 'Mature team size', detail: `${startup.team_size} team members indicate operational maturity`, type: 'positive', weight: 1 });
  } else if (startup.team_size < 8) {
    signals.push({ category: 'Team', signal: 'Small team', detail: `${startup.team_size} team members — key-person risk`, type: 'warning', weight: 1 });
    riskPoints += 5;
    recommendations.push('Expand core team to reduce key-person dependency');
  }

  // ── Comparative Analysis ──
  const mrrRank = allStartups.filter(s => s.mrr > startup.mrr).length;
  const mrrPercentile = Math.round((1 - mrrRank / allStartups.length) * 100);
  const trustRank = allStartups.filter(s => s.trust_score > startup.trust_score).length;
  const trustPercentile = Math.round((1 - trustRank / allStartups.length) * 100);
  const susRank = allStartups.filter(s => s.sustainability_score > startup.sustainability_score).length;
  const susPercentile = Math.round((1 - susRank / allStartups.length) * 100);
  const growthRank = allStartups.filter(s => Number(s.growth_rate) > growth).length;
  const growthPercentile = Math.round((1 - growthRank / allStartups.length) * 100);

  const avgMrr = allStartups.reduce((a, b) => a + b.mrr, 0) / allStartups.length;
  const avgTrust = allStartups.reduce((a, b) => a + b.trust_score, 0) / allStartups.length;
  const avgSus = allStartups.reduce((a, b) => a + b.sustainability_score, 0) / allStartups.length;
  const avgGrowth = allStartups.reduce((a, b) => a + Number(b.growth_rate), 0) / allStartups.length;

  const comparativePosition = [
    { metric: 'MRR', value: startup.mrr, percentile: mrrPercentile, benchmark: Math.round(avgMrr) },
    { metric: 'Trust Score', value: startup.trust_score, percentile: trustPercentile, benchmark: Math.round(avgTrust) },
    { metric: 'Sustainability', value: startup.sustainability_score, percentile: susPercentile, benchmark: Math.round(avgSus) },
    { metric: 'Growth Rate', value: growth, percentile: growthPercentile, benchmark: Math.round(avgGrowth * 10) / 10 },
  ];

  // ── Calculate overall risk ──
  riskPoints = Math.min(riskPoints, 100);
  const overallRisk: RiskLevel = riskPoints > 60 ? 'critical' : riskPoints > 40 ? 'high' : riskPoints > 20 ? 'medium' : 'low';

  const investmentGrade = riskPoints <= 10 ? 'AAA' : riskPoints <= 20 ? 'AA' : riskPoints <= 30 ? 'A' :
    riskPoints <= 40 ? 'BBB' : riskPoints <= 50 ? 'BB' : riskPoints <= 60 ? 'B' :
    riskPoints <= 75 ? 'CCC' : 'D';

  // ── Generate summary ──
  const summaryParts: string[] = [];
  summaryParts.push(`${startup.name} is a ${startup.category} startup on ${startup.blockchain}`);
  if (startup.verified) summaryParts.push('with on-chain verified metrics');
  summaryParts.push(`generating $${(startup.mrr / 1000).toFixed(0)}K MRR`);
  if (growth > 0) summaryParts.push(`growing at ${growth}% MoM`);
  else summaryParts.push(`but declining at ${growth}% MoM`);
  summaryParts.push(`. Investment grade: ${investmentGrade}.`);

  if (strengths.length > 0) summaryParts.push(`Key strengths include ${strengths.slice(0, 2).join(' and ').toLowerCase()}.`);
  if (weaknesses.length > 0) summaryParts.push(`Primary concerns: ${weaknesses.slice(0, 2).join('; ').toLowerCase()}.`);

  const financialHealth = [
    { label: 'Revenue Scale', score: Math.min(Math.round(startup.mrr / 2500), 100), max: 100, status: startup.mrr > 80000 ? 'low' as RiskLevel : startup.mrr > 40000 ? 'medium' as RiskLevel : 'high' as RiskLevel },
    { label: 'Growth Momentum', score: Math.max(Math.min(Math.round(growth * 4), 100), 0), max: 100, status: growth > 10 ? 'low' as RiskLevel : growth > 0 ? 'medium' as RiskLevel : 'critical' as RiskLevel },
    { label: 'Treasury Strength', score: Math.min(Math.round(Number(startup.treasury) / 50000), 100), max: 100, status: runwayMonths > 18 ? 'low' as RiskLevel : runwayMonths > 6 ? 'medium' as RiskLevel : 'critical' as RiskLevel },
    { label: 'Token Health', score: Math.max(100 - whaleConc - inflation * 3, 0), max: 100, status: whaleConc < 30 && inflation < 5 ? 'low' as RiskLevel : whaleConc < 50 ? 'medium' as RiskLevel : 'high' as RiskLevel },
    { label: 'ESG Compliance', score: susScore, max: 100, status: susScore > 70 ? 'low' as RiskLevel : susScore > 40 ? 'medium' as RiskLevel : 'high' as RiskLevel },
    { label: 'Verification', score: startup.verified ? 95 : 20, max: 100, status: startup.verified ? 'low' as RiskLevel : 'critical' as RiskLevel },
  ];

  return {
    overallRisk,
    riskScore: riskPoints,
    investmentGrade,
    summary: summaryParts.join(' '),
    signals: signals.sort((a, b) => b.weight - a.weight),
    strengths,
    weaknesses,
    recommendations,
    financialHealth,
    comparativePosition,
  };
}
