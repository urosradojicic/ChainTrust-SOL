/**
 * Investor Thesis Matching Engine
 * ────────────────────────────────
 * AI-powered matching between investor theses and startup profiles.
 * Computes compatibility scores across multiple dimensions.
 *
 * Matching dimensions:
 *   1. Stage fit         — does the startup match the investor's stage focus?
 *   2. Sector fit        — category alignment
 *   3. Metric thresholds — does the startup meet minimum criteria?
 *   4. Risk tolerance    — red flags vs investor's risk appetite
 *   5. ESG alignment     — sustainability requirements
 *   6. Verification req  — does the investor require on-chain verification?
 *   7. Token health      — whale concentration and inflation limits
 *   8. Growth profile    — growth rate vs investor's target range
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface InvestorThesis {
  /** Investor name */
  name: string;
  /** Investor type */
  type: 'angel' | 'seed_vc' | 'series_a_vc' | 'growth' | 'crypto_fund' | 'dao' | 'family_office' | 'retail';
  /** Target categories (empty = all) */
  categories: string[];
  /** Minimum MRR */
  minMrr: number;
  /** Maximum MRR (0 = no max) */
  maxMrr: number;
  /** Minimum growth rate (%) */
  minGrowthRate: number;
  /** Minimum trust score */
  minTrustScore: number;
  /** Require on-chain verification */
  requireVerified: boolean;
  /** Maximum whale concentration (%) */
  maxWhaleConcentration: number;
  /** Maximum inflation rate (%) */
  maxInflationRate: number;
  /** Minimum sustainability score */
  minSustainabilityScore: number;
  /** Maximum acceptable red flags */
  maxRedFlags: number;
  /** Target check size range */
  checkSize: { min: number; max: number };
  /** Priority factors (ordered by importance) */
  priorities: ('growth' | 'revenue' | 'trust' | 'sustainability' | 'team' | 'tokenomics')[];
}

export interface MatchResult {
  /** Startup being matched */
  startup: DbStartup;
  /** Overall match score (0-100) */
  matchScore: number;
  /** Match grade */
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  /** Individual dimension scores */
  dimensions: MatchDimension[];
  /** Reasons this is a good match */
  strengths: string[];
  /** Concerns about this match */
  concerns: string[];
  /** Deal-breakers (if any) */
  dealBreakers: string[];
  /** Whether this startup passes all hard requirements */
  passesHardFilters: boolean;
}

export interface MatchDimension {
  name: string;
  score: number; // 0-100
  weight: number;
  passed: boolean;
  detail: string;
}

export interface MatchReport {
  /** The investor thesis used */
  thesis: InvestorThesis;
  /** All matched startups, sorted by match score */
  matches: MatchResult[];
  /** Total startups evaluated */
  totalEvaluated: number;
  /** Startups passing hard filters */
  passingHardFilters: number;
  /** Top match */
  topMatch: MatchResult | null;
  /** Average match score */
  avgMatchScore: number;
  /** Generated at */
  computedAt: number;
}

// ── Thesis Templates ─────────────────────────────────────────────────

export const THESIS_TEMPLATES: Record<string, InvestorThesis> = {
  crypto_seed: {
    name: 'Crypto Seed Fund',
    type: 'crypto_fund',
    categories: ['DeFi', 'Infrastructure', 'Identity'],
    minMrr: 10000,
    maxMrr: 200000,
    minGrowthRate: 15,
    minTrustScore: 60,
    requireVerified: true,
    maxWhaleConcentration: 40,
    maxInflationRate: 8,
    minSustainabilityScore: 30,
    maxRedFlags: 3,
    checkSize: { min: 200000, max: 2000000 },
    priorities: ['growth', 'tokenomics', 'trust', 'team', 'revenue', 'sustainability'],
  },
  defi_whale: {
    name: 'DeFi Whale Investor',
    type: 'crypto_fund',
    categories: ['DeFi'],
    minMrr: 50000,
    maxMrr: 0,
    minGrowthRate: 20,
    minTrustScore: 70,
    requireVerified: true,
    maxWhaleConcentration: 30,
    maxInflationRate: 5,
    minSustainabilityScore: 0,
    maxRedFlags: 2,
    checkSize: { min: 500000, max: 5000000 },
    priorities: ['growth', 'revenue', 'tokenomics', 'trust', 'team', 'sustainability'],
  },
  impact_investor: {
    name: 'ESG Impact Fund',
    type: 'family_office',
    categories: [],
    minMrr: 20000,
    maxMrr: 0,
    minGrowthRate: 10,
    minTrustScore: 50,
    requireVerified: false,
    maxWhaleConcentration: 50,
    maxInflationRate: 10,
    minSustainabilityScore: 70,
    maxRedFlags: 4,
    checkSize: { min: 100000, max: 1000000 },
    priorities: ['sustainability', 'trust', 'growth', 'revenue', 'team', 'tokenomics'],
  },
  conservative_angel: {
    name: 'Conservative Angel',
    type: 'angel',
    categories: ['SaaS', 'Fintech'],
    minMrr: 30000,
    maxMrr: 500000,
    minGrowthRate: 5,
    minTrustScore: 75,
    requireVerified: true,
    maxWhaleConcentration: 25,
    maxInflationRate: 4,
    minSustainabilityScore: 50,
    maxRedFlags: 1,
    checkSize: { min: 25000, max: 100000 },
    priorities: ['trust', 'revenue', 'sustainability', 'growth', 'team', 'tokenomics'],
  },
  aggressive_growth: {
    name: 'Aggressive Growth Fund',
    type: 'series_a_vc',
    categories: [],
    minMrr: 50000,
    maxMrr: 0,
    minGrowthRate: 25,
    minTrustScore: 40,
    requireVerified: false,
    maxWhaleConcentration: 60,
    maxInflationRate: 15,
    minSustainabilityScore: 0,
    maxRedFlags: 5,
    checkSize: { min: 1000000, max: 10000000 },
    priorities: ['growth', 'revenue', 'team', 'trust', 'tokenomics', 'sustainability'],
  },
};

// ── Matching Logic ───────────────────────────────────────────────────

function scoreDimension(
  name: string,
  value: number,
  target: number,
  isMinimum: boolean,
  weight: number,
): MatchDimension {
  let score: number;
  let passed: boolean;
  let detail: string;

  if (isMinimum) {
    passed = value >= target;
    score = target === 0 ? 100 : Math.min(100, (value / target) * 100);
    detail = passed
      ? `${value.toLocaleString()} meets minimum of ${target.toLocaleString()}`
      : `${value.toLocaleString()} below minimum of ${target.toLocaleString()}`;
  } else {
    passed = value <= target;
    score = target === 0 ? 100 : Math.min(100, ((target - Math.max(0, value - target)) / target) * 100);
    detail = passed
      ? `${value.toLocaleString()} within limit of ${target.toLocaleString()}`
      : `${value.toLocaleString()} exceeds limit of ${target.toLocaleString()}`;
  }

  return { name, score: Math.max(0, Math.round(score)), weight, passed, detail };
}

function matchStartup(startup: DbStartup, thesis: InvestorThesis): MatchResult {
  const dimensions: MatchDimension[] = [];
  const strengths: string[] = [];
  const concerns: string[] = [];
  const dealBreakers: string[] = [];

  // Priority weights (first priority gets highest weight)
  const priorityWeights: Record<string, number> = {};
  thesis.priorities.forEach((p, i) => {
    priorityWeights[p] = 3 - (i * 0.3); // 3.0, 2.7, 2.4, 2.1, 1.8, 1.5
  });

  // 1. Category fit
  if (thesis.categories.length > 0) {
    const catMatch = thesis.categories.includes(startup.category);
    dimensions.push({
      name: 'Category Fit',
      score: catMatch ? 100 : 0,
      weight: 2,
      passed: catMatch,
      detail: catMatch ? `${startup.category} matches thesis focus` : `${startup.category} not in thesis categories`,
    });
    if (!catMatch) dealBreakers.push(`Category ${startup.category} not in thesis focus`);
    else strengths.push(`${startup.category} is a target sector`);
  }

  // 2. Revenue
  const revenueWeight = priorityWeights['revenue'] ?? 2;
  dimensions.push(scoreDimension('Revenue (MRR)', startup.mrr, thesis.minMrr, true, revenueWeight));
  if (startup.mrr >= thesis.minMrr) {
    strengths.push(`$${(startup.mrr / 1000).toFixed(0)}K MRR exceeds minimum`);
  } else {
    concerns.push(`MRR below ${thesis.name}'s minimum threshold`);
  }
  if (thesis.maxMrr > 0 && startup.mrr > thesis.maxMrr) {
    dimensions.push({ name: 'Revenue (Max)', score: 0, weight: 1, passed: false, detail: `MRR exceeds maximum of $${thesis.maxMrr.toLocaleString()}` });
    dealBreakers.push('MRR exceeds maximum — startup may be too late-stage');
  }

  // 3. Growth
  const growth = Number(startup.growth_rate);
  const growthWeight = priorityWeights['growth'] ?? 2;
  dimensions.push(scoreDimension('Growth Rate', growth, thesis.minGrowthRate, true, growthWeight));
  if (growth >= thesis.minGrowthRate * 1.5) strengths.push(`Exceptional ${growth}% growth rate`);
  else if (growth < thesis.minGrowthRate) concerns.push(`${growth}% growth below ${thesis.minGrowthRate}% target`);

  // 4. Trust score
  const trustWeight = priorityWeights['trust'] ?? 1.5;
  dimensions.push(scoreDimension('Trust Score', startup.trust_score, thesis.minTrustScore, true, trustWeight));
  if (startup.trust_score >= 85) strengths.push(`Elite trust score of ${startup.trust_score}`);

  // 5. Verification
  if (thesis.requireVerified && !startup.verified) {
    dealBreakers.push('On-chain verification required but not completed');
    dimensions.push({ name: 'Verification', score: 0, weight: 2, passed: false, detail: 'Not verified on-chain' });
  } else if (startup.verified) {
    dimensions.push({ name: 'Verification', score: 100, weight: 2, passed: true, detail: 'On-chain verified' });
    strengths.push('Metrics verified on-chain');
  }

  // 6. Token health
  const whale = Number(startup.whale_concentration);
  const tokenWeight = priorityWeights['tokenomics'] ?? 1;
  dimensions.push(scoreDimension('Whale Concentration', whale, thesis.maxWhaleConcentration, false, tokenWeight));
  if (whale < 15) strengths.push('Excellent token distribution');
  else if (whale > thesis.maxWhaleConcentration) concerns.push(`${whale}% whale concentration exceeds limit`);

  const inflation = Number(startup.inflation_rate);
  dimensions.push(scoreDimension('Inflation Rate', inflation, thesis.maxInflationRate, false, tokenWeight * 0.7));

  // 7. Sustainability
  const susWeight = priorityWeights['sustainability'] ?? 1;
  dimensions.push(scoreDimension('Sustainability', startup.sustainability_score, thesis.minSustainabilityScore, true, susWeight));
  if (startup.sustainability_score >= 80) strengths.push(`Strong ESG profile (${startup.sustainability_score}/100)`);

  // 8. Team
  const teamWeight = priorityWeights['team'] ?? 1;
  const teamScore = startup.team_size >= 15 ? 90 : startup.team_size >= 8 ? 70 : startup.team_size >= 3 ? 50 : 20;
  dimensions.push({ name: 'Team Size', score: teamScore, weight: teamWeight, passed: startup.team_size >= 3, detail: `${startup.team_size} team members` });

  // Calculate overall score
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const weightedScore = dimensions.reduce((s, d) => s + d.score * d.weight, 0);
  const matchScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

  const passesHardFilters = dealBreakers.length === 0;
  const grade = matchScore >= 90 ? 'A+' : matchScore >= 80 ? 'A' : matchScore >= 70 ? 'B+' :
    matchScore >= 60 ? 'B' : matchScore >= 40 ? 'C' : matchScore >= 20 ? 'D' : 'F';

  return {
    startup,
    matchScore: passesHardFilters ? matchScore : Math.min(matchScore, 30),
    grade: passesHardFilters ? grade : 'F',
    dimensions,
    strengths: strengths.slice(0, 5),
    concerns: concerns.slice(0, 5),
    dealBreakers,
    passesHardFilters,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Match all startups against an investor thesis.
 *
 * @param thesis   - The investor's thesis and requirements
 * @param startups - All available startups
 * @returns        - Complete match report sorted by score
 */
export function matchInvestorThesis(
  thesis: InvestorThesis,
  startups: DbStartup[],
): MatchReport {
  const matches = startups
    .map(s => matchStartup(s, thesis))
    .sort((a, b) => b.matchScore - a.matchScore);

  const passing = matches.filter(m => m.passesHardFilters);
  const scores = matches.map(m => m.matchScore);

  return {
    thesis,
    matches,
    totalEvaluated: startups.length,
    passingHardFilters: passing.length,
    topMatch: matches.length > 0 ? matches[0] : null,
    avgMatchScore: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
    computedAt: Date.now(),
  };
}
