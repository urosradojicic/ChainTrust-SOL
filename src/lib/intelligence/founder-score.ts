/**
 * Founder Score Engine
 * ────────────────────
 * Separate scoring system for founders and founding teams.
 * Evaluates execution capability, not just startup metrics.
 *
 * Dimensions:
 *   1. Execution Track Record — what have they built and shipped?
 *   2. Capital Efficiency — how well do they convert funding into growth?
 *   3. Team Building — can they attract and retain talent?
 *   4. Communication Quality — do they report consistently and honestly?
 *   5. Governance Maturity — do they embrace transparency and accountability?
 *   6. Crisis Resilience — how do they handle setbacks?
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface FounderDimension {
  name: string;
  score: number; // 0-100
  weight: number;
  evidence: string[];
  assessment: string;
}

export interface FounderScore {
  /** Overall founder/team score (0-100) */
  overallScore: number;
  /** Letter grade */
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  /** Qualitative assessment */
  archetype: 'Elite Operator' | 'Strong Builder' | 'Promising Founder' | 'Early Stage' | 'Unproven';
  /** All dimensions */
  dimensions: FounderDimension[];
  /** Key strengths */
  strengths: string[];
  /** Key risks */
  risks: string[];
  /** Recommendation for investors */
  investorGuidance: string;
  /** Computed at */
  computedAt: number;
}

// ── Scoring Functions ────────────────────────────────────────────────

function scoreExecution(startup: DbStartup, metrics: DbMetricsHistory[]): FounderDimension {
  const evidence: string[] = [];
  let score = 40; // Base

  // Product is live with users
  if (startup.users > 0) {
    score += 15;
    evidence.push(`Product live with ${startup.users.toLocaleString()} users`);
  }

  // Revenue generation
  if (startup.mrr > 100000) { score += 20; evidence.push(`Generating $${(startup.mrr / 1000).toFixed(0)}K MRR — significant traction`); }
  else if (startup.mrr > 30000) { score += 12; evidence.push(`$${(startup.mrr / 1000).toFixed(0)}K MRR — product-market fit signals`); }
  else if (startup.mrr > 0) { score += 5; evidence.push('Early revenue — execution has begun'); }

  // Growth execution
  if (Number(startup.growth_rate) > 20) { score += 15; evidence.push(`${startup.growth_rate}% growth — strong execution velocity`); }
  else if (Number(startup.growth_rate) > 10) { score += 8; evidence.push(`Healthy ${startup.growth_rate}% growth`); }

  // Consistent reporting shows execution discipline
  if (metrics.length >= 6) { score += 10; evidence.push(`${metrics.length} months of consistent metric reporting`); }
  else if (metrics.length >= 3) { score += 5; evidence.push(`${metrics.length} months of reporting history`); }

  return {
    name: 'Execution Track Record',
    score: Math.min(100, score),
    weight: 3,
    evidence,
    assessment: score >= 70 ? 'Demonstrated strong execution — product is live, growing, and generating revenue' :
      score >= 40 ? 'Moderate execution track record — product exists but needs more traction proof' :
      'Early stage — limited execution evidence available',
  };
}

function scoreCapitalEfficiency(startup: DbStartup, metrics: DbMetricsHistory[]): FounderDimension {
  const evidence: string[] = [];
  let score = 50;

  // Revenue per dollar raised (using treasury as proxy for total raised)
  if (startup.treasury > 0 && startup.mrr > 0) {
    const revenuePerDollar = (startup.mrr * 12) / startup.treasury;
    if (revenuePerDollar > 1) { score += 30; evidence.push(`$${revenuePerDollar.toFixed(1)} ARR per $1 of capital — exceptional efficiency`); }
    else if (revenuePerDollar > 0.5) { score += 18; evidence.push(`$${revenuePerDollar.toFixed(2)} ARR per $1 — good capital efficiency`); }
    else if (revenuePerDollar > 0.2) { score += 8; evidence.push(`$${revenuePerDollar.toFixed(2)} ARR per $1 — moderate efficiency`); }
    else { evidence.push(`Low ARR/capital ratio — may be over-funded or under-executing`); score -= 10; }
  }

  // Burn rate vs growth (burn multiple)
  if (metrics.length >= 2) {
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const burn = Math.max(Number(sorted[sorted.length - 1].costs) - Number(sorted[sorted.length - 1].revenue), 0);
    const newRevenue = Math.abs(Number(sorted[sorted.length - 1].revenue) - Number(sorted[sorted.length - 2].revenue));
    if (burn > 0 && newRevenue > 0) {
      const burnMultiple = burn / newRevenue;
      if (burnMultiple < 1.5) { score += 15; evidence.push(`Burn multiple: ${burnMultiple.toFixed(1)}x — very efficient`); }
      else if (burnMultiple < 3) { score += 5; evidence.push(`Burn multiple: ${burnMultiple.toFixed(1)}x — acceptable`); }
      else { evidence.push(`Burn multiple: ${burnMultiple.toFixed(1)}x — high burn relative to new revenue`); score -= 5; }
    }
  }

  // Team efficiency
  if (startup.team_size > 0 && startup.mrr > 0) {
    const revPerHead = (startup.mrr * 12) / startup.team_size;
    if (revPerHead > 150000) { score += 10; evidence.push(`$${(revPerHead / 1000).toFixed(0)}K ARR/employee — lean team`); }
  }

  return {
    name: 'Capital Efficiency',
    score: Math.min(100, Math.max(0, score)),
    weight: 2.5,
    evidence,
    assessment: score >= 70 ? 'Highly capital efficient — founders convert dollars into growth effectively' :
      score >= 40 ? 'Moderate capital efficiency — room for improvement' :
      'Capital efficiency concerns — spending may not align with results',
  };
}

function scoreTeamBuilding(startup: DbStartup): FounderDimension {
  const evidence: string[] = [];
  let score = 30;

  if (startup.team_size >= 20) { score += 30; evidence.push(`${startup.team_size}-person team — strong hiring ability`); }
  else if (startup.team_size >= 10) { score += 20; evidence.push(`${startup.team_size} team members — solid nucleus`); }
  else if (startup.team_size >= 5) { score += 10; evidence.push(`${startup.team_size} team members — lean but functional`); }
  else { evidence.push(`Small team of ${startup.team_size} — key-person risk elevated`); }

  // Revenue per employee as signal of hire quality
  if (startup.team_size > 0) {
    const efficiency = (startup.mrr * 12) / startup.team_size;
    if (efficiency > 100000) { score += 20; evidence.push('High-quality team — each hire contributes significantly to revenue'); }
    else if (efficiency > 50000) { score += 10; evidence.push('Good team quality — hires are productive'); }
  }

  // Governance score as proxy for organizational maturity
  if (startup.governance_score >= 70) { score += 15; evidence.push(`Governance score ${startup.governance_score}/100 — mature organization`); }
  else if (startup.governance_score >= 40) { score += 5; evidence.push('Moderate governance maturity'); }

  return {
    name: 'Team Building',
    score: Math.min(100, score),
    weight: 2,
    evidence,
    assessment: score >= 70 ? 'Strong team builder — can attract and retain quality talent' :
      score >= 40 ? 'Adequate team — growing but needs strategic hires' :
      'Team building is a concern — may struggle to scale',
  };
}

function scoreCommunication(startup: DbStartup, metrics: DbMetricsHistory[]): FounderDimension {
  const evidence: string[] = [];
  let score = 30;

  // Reporting consistency
  if (metrics.length >= 6) { score += 25; evidence.push(`${metrics.length} months of consistent reporting — disciplined communication`); }
  else if (metrics.length >= 3) { score += 12; evidence.push(`${metrics.length} months of reporting`); }
  else { evidence.push('Limited reporting history — communication discipline unknown'); }

  // Verification (willingness to be transparent)
  if (startup.verified) { score += 25; evidence.push('Voluntarily verified metrics on-chain — highest transparency'); }
  else { evidence.push('Metrics not verified — transparency could improve'); }

  // Trust score reflects overall communication quality
  if (startup.trust_score >= 80) { score += 15; evidence.push(`Trust score ${startup.trust_score}/100 — excellent credibility`); }
  else if (startup.trust_score >= 50) { score += 8; evidence.push(`Trust score ${startup.trust_score}/100 — reasonable credibility`); }

  // Description completeness
  if (startup.description && startup.description.length > 50) { score += 5; evidence.push('Complete startup description provided'); }

  return {
    name: 'Communication Quality',
    score: Math.min(100, score),
    weight: 1.5,
    evidence,
    assessment: score >= 70 ? 'Excellent communicator — transparent, consistent, and detailed' :
      score >= 40 ? 'Adequate communication — meets baseline expectations' :
      'Communication needs improvement — investors want more transparency',
  };
}

function scoreGovernanceMaturity(startup: DbStartup): FounderDimension {
  const evidence: string[] = [];
  let score = 30;

  if (startup.governance_score >= 80) { score += 30; evidence.push('Strong governance framework in place'); }
  else if (startup.governance_score >= 50) { score += 15; evidence.push('Basic governance structures exist'); }

  if (Number(startup.whale_concentration) < 20) { score += 15; evidence.push('Decentralized token distribution — governance is meaningful'); }
  else if (Number(startup.whale_concentration) < 40) { score += 5; evidence.push('Moderate decentralization'); }
  else { evidence.push(`High concentration (${startup.whale_concentration}%) undermines governance`); score -= 10; }

  if (startup.sustainability_score >= 70) { score += 15; evidence.push('Strong ESG commitment signals long-term thinking'); }

  if (startup.verified) { score += 10; evidence.push('On-chain verification shows accountability mindset'); }

  return {
    name: 'Governance Maturity',
    score: Math.min(100, Math.max(0, score)),
    weight: 1.5,
    evidence,
    assessment: score >= 70 ? 'Mature governance — founders embrace accountability and decentralization' :
      score >= 40 ? 'Developing governance — structures exist but need strengthening' :
      'Governance is weak — centralized control, limited accountability',
  };
}

function scoreCrisisResilience(startup: DbStartup, metrics: DbMetricsHistory[]): FounderDimension {
  const evidence: string[] = [];
  let score = 50; // Base assumption

  if (metrics.length < 3) {
    return { name: 'Crisis Resilience', score: 40, weight: 1, evidence: ['Insufficient history to assess resilience'], assessment: 'Not enough data to evaluate how founders handle setbacks' };
  }

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const revenues = sorted.map(m => Number(m.revenue));

  // Check for dips and recoveries
  let hadDip = false;
  let recovered = false;
  for (let i = 1; i < revenues.length; i++) {
    if (revenues[i] < revenues[i - 1] * 0.85) hadDip = true;
    if (hadDip && i > 1 && revenues[i] > revenues[i - 1] * 1.1) recovered = true;
  }

  if (hadDip && recovered) {
    score += 30;
    evidence.push('Revenue dip followed by recovery — founders can navigate adversity');
  } else if (hadDip && !recovered) {
    score -= 10;
    evidence.push('Revenue dip without recovery — resilience uncertain');
  } else {
    score += 10;
    evidence.push('No significant revenue dips — stable execution (untested under pressure)');
  }

  // Consistent positive growth despite market conditions
  const positiveMonths = sorted.filter(m => Number(m.growth_rate) > 0).length;
  const positivePct = (positiveMonths / sorted.length) * 100;
  if (positivePct >= 80) { score += 15; evidence.push(`${positivePct.toFixed(0)}% of months had positive growth — consistent performer`); }

  return {
    name: 'Crisis Resilience',
    score: Math.min(100, Math.max(0, score)),
    weight: 1,
    evidence,
    assessment: score >= 70 ? 'Resilient founders — demonstrated ability to navigate setbacks' :
      score >= 40 ? 'Resilience untested or partially demonstrated' :
      'Concerns about ability to handle adversity',
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate comprehensive founder/team score.
 */
export function scoreFounder(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): FounderScore {
  const dimensions: FounderDimension[] = [
    scoreExecution(startup, metrics),
    scoreCapitalEfficiency(startup, metrics),
    scoreTeamBuilding(startup),
    scoreCommunication(startup, metrics),
    scoreGovernanceMaturity(startup),
    scoreCrisisResilience(startup, metrics),
  ];

  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const overallScore = Math.round(dimensions.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight);

  const grade = overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B+' :
    overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : overallScore >= 20 ? 'D' : 'F';

  const archetype: FounderScore['archetype'] =
    overallScore >= 85 ? 'Elite Operator' :
    overallScore >= 70 ? 'Strong Builder' :
    overallScore >= 55 ? 'Promising Founder' :
    overallScore >= 35 ? 'Early Stage' :
    'Unproven';

  const strengths = dimensions.filter(d => d.score >= 70).map(d => d.assessment);
  const risks = dimensions.filter(d => d.score < 40).map(d => d.assessment);

  let investorGuidance: string;
  if (overallScore >= 80) investorGuidance = 'Strong founding team — the team itself is a reason to invest. Focus DD on market and terms.';
  else if (overallScore >= 60) investorGuidance = 'Capable team with room to grow. Assess specific skill gaps and plan for key hires post-investment.';
  else if (overallScore >= 40) investorGuidance = 'Team needs strengthening. Consider requiring specific hires as a condition of investment.';
  else investorGuidance = 'Significant team concerns. Investment should be contingent on team augmentation or co-founder additions.';

  return {
    overallScore,
    grade,
    archetype,
    dimensions,
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
    investorGuidance,
    computedAt: Date.now(),
  };
}
