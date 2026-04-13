/**
 * Deal Scoring Matrix
 * ───────────────────
 * Weighted multi-criteria decision framework for investment decisions.
 * Standardizes how deals are evaluated, enabling consistent comparison.
 *
 * Investors configure which criteria matter most to them.
 * Each criterion is scored 1-5 and weighted by importance.
 * Final score enables apples-to-apples comparison across deals.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface ScoringCriterion {
  id: string;
  name: string;
  category: 'market' | 'product' | 'team' | 'financials' | 'tokenomics' | 'trust';
  weight: number; // 1-5 importance
  score: number; // 1-5 rating
  autoScored: boolean;
  rationale: string;
  benchmark: string;
}

export interface DealScore {
  startupId: string;
  startupName: string;
  /** Weighted total score (0-100) */
  totalScore: number;
  /** Grade */
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  /** Individual criteria */
  criteria: ScoringCriterion[];
  /** Strongest criteria */
  strengths: string[];
  /** Weakest criteria */
  weaknesses: string[];
  /** Category scores */
  categoryScores: { category: string; score: number; maxScore: number }[];
  /** Recommendation */
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass';
  /** Computed at */
  computedAt: number;
}

// ── Auto-Scoring ─────────────────────────────────────────────────────

function autoScore(value: number, thresholds: number[]): number {
  // thresholds = [1_max, 2_max, 3_max, 4_max] — value above 4_max gets 5
  if (value >= thresholds[3]) return 5;
  if (value >= thresholds[2]) return 4;
  if (value >= thresholds[1]) return 3;
  if (value >= thresholds[0]) return 2;
  return 1;
}

function autoScoreInverse(value: number, thresholds: number[]): number {
  // Lower is better
  if (value <= thresholds[0]) return 5;
  if (value <= thresholds[1]) return 4;
  if (value <= thresholds[2]) return 3;
  if (value <= thresholds[3]) return 2;
  return 1;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Score a deal using the weighted multi-criteria framework.
 * All criteria are auto-scored from ChainTrust data.
 */
export function scoreDeal(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): DealScore {
  const growth = Number(startup.growth_rate);
  const whale = Number(startup.whale_concentration);
  const inflation = Number(startup.inflation_rate);
  const peers = allStartups.filter(s => s.category === startup.category);

  const criteria: ScoringCriterion[] = [
    // Market (weight: high)
    {
      id: 'market-size', name: 'Market Opportunity', category: 'market', weight: 4,
      score: autoScore(startup.users, [1000, 5000, 15000, 30000]),
      autoScored: true,
      rationale: `${startup.users.toLocaleString()} users in ${startup.category}`,
      benchmark: '>30K users = 5, >15K = 4, >5K = 3',
    },
    {
      id: 'market-growth', name: 'Growth Rate', category: 'market', weight: 5,
      score: autoScore(growth, [3, 10, 20, 30]),
      autoScored: true,
      rationale: `${growth}% MoM growth`,
      benchmark: '>30% = 5, >20% = 4, >10% = 3, >3% = 2',
    },
    {
      id: 'market-position', name: 'Competitive Position', category: 'market', weight: 3,
      score: autoScore(
        peers.length > 0 ? (1 - peers.filter(p => p.mrr > startup.mrr).length / peers.length) * 100 : 50,
        [25, 50, 70, 85],
      ),
      autoScored: true,
      rationale: `#${peers.filter(p => p.mrr > startup.mrr).length + 1} of ${peers.length} in ${startup.category} by MRR`,
      benchmark: 'Top 15% = 5, Top 30% = 4',
    },

    // Product
    {
      id: 'product-pmf', name: 'Product-Market Fit', category: 'product', weight: 5,
      score: growth >= 25 && startup.mrr >= 50000 ? 5 : growth >= 15 ? 4 : growth >= 5 ? 3 : growth > 0 ? 2 : 1,
      autoScored: true,
      rationale: `${growth}% growth at $${(startup.mrr / 1000).toFixed(0)}K MRR — ${growth >= 15 ? 'strong PMF signals' : 'PMF not yet clear'}`,
      benchmark: '>25% growth + >$50K MRR = strong PMF',
    },
    {
      id: 'product-verification', name: 'Data Integrity', category: 'product', weight: 4,
      score: startup.verified ? (startup.trust_score >= 80 ? 5 : 4) : (startup.trust_score >= 60 ? 3 : 2),
      autoScored: true,
      rationale: `${startup.verified ? 'On-chain verified' : 'Self-reported'}, trust: ${startup.trust_score}/100`,
      benchmark: 'Verified + trust >80 = 5',
    },

    // Team
    {
      id: 'team-size', name: 'Team Strength', category: 'team', weight: 3,
      score: autoScore(startup.team_size, [3, 8, 15, 25]),
      autoScored: true,
      rationale: `${startup.team_size} team members`,
      benchmark: '>25 = 5, >15 = 4, >8 = 3',
    },
    {
      id: 'team-efficiency', name: 'Team Efficiency', category: 'team', weight: 3,
      score: startup.team_size > 0 ? autoScore((startup.mrr * 12) / startup.team_size, [30000, 80000, 150000, 250000]) : 2,
      autoScored: true,
      rationale: `$${startup.team_size > 0 ? ((startup.mrr * 12) / startup.team_size / 1000).toFixed(0) : 0}K ARR/employee`,
      benchmark: '>$250K = 5, >$150K = 4',
    },

    // Financials
    {
      id: 'fin-revenue', name: 'Revenue Scale', category: 'financials', weight: 4,
      score: autoScore(startup.mrr, [10000, 50000, 100000, 250000]),
      autoScored: true,
      rationale: `$${(startup.mrr / 1000).toFixed(0)}K MRR ($${((startup.mrr * 12) / 1000000).toFixed(1)}M ARR)`,
      benchmark: '>$250K MRR = 5',
    },
    {
      id: 'fin-treasury', name: 'Treasury Strength', category: 'financials', weight: 3,
      score: autoScore(startup.treasury, [200000, 500000, 1500000, 4000000]),
      autoScored: true,
      rationale: `$${(startup.treasury / 1000000).toFixed(1)}M treasury`,
      benchmark: '>$4M = 5',
    },

    // Tokenomics
    {
      id: 'token-distribution', name: 'Token Distribution', category: 'tokenomics', weight: 3,
      score: autoScoreInverse(whale, [10, 20, 35, 50]),
      autoScored: true,
      rationale: `${whale}% whale concentration`,
      benchmark: '<10% = 5, <20% = 4',
    },
    {
      id: 'token-inflation', name: 'Inflation Control', category: 'tokenomics', weight: 2,
      score: autoScoreInverse(inflation, [2, 4, 6, 10]),
      autoScored: true,
      rationale: `${inflation}% annual inflation`,
      benchmark: '<2% = 5, <4% = 4',
    },

    // Trust
    {
      id: 'trust-score', name: 'Trust Score', category: 'trust', weight: 4,
      score: autoScore(startup.trust_score, [30, 50, 70, 85]),
      autoScored: true,
      rationale: `Trust score: ${startup.trust_score}/100`,
      benchmark: '>85 = 5, >70 = 4',
    },
    {
      id: 'trust-esg', name: 'ESG/Sustainability', category: 'trust', weight: 2,
      score: autoScore(startup.sustainability_score, [20, 40, 60, 80]),
      autoScored: true,
      rationale: `Sustainability: ${startup.sustainability_score}/100`,
      benchmark: '>80 = 5',
    },
  ];

  // Compute weighted total
  const maxWeightedScore = criteria.reduce((s, c) => s + c.weight * 5, 0);
  const actualWeightedScore = criteria.reduce((s, c) => s + c.weight * c.score, 0);
  const totalScore = Math.round((actualWeightedScore / maxWeightedScore) * 100);

  const grade: DealScore['grade'] =
    totalScore >= 90 ? 'A+' : totalScore >= 80 ? 'A' : totalScore >= 70 ? 'B+' :
    totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : totalScore >= 20 ? 'D' : 'F';

  // Category scores
  const categories = ['market', 'product', 'team', 'financials', 'tokenomics', 'trust'];
  const categoryScores = categories.map(cat => {
    const catCriteria = criteria.filter(c => c.category === cat);
    const catMax = catCriteria.reduce((s, c) => s + c.weight * 5, 0);
    const catActual = catCriteria.reduce((s, c) => s + c.weight * c.score, 0);
    return { category: cat, score: catActual, maxScore: catMax };
  });

  // Strengths & weaknesses
  const sorted = [...criteria].sort((a, b) => (b.score * b.weight) - (a.score * a.weight));
  const strengths = sorted.filter(c => c.score >= 4).slice(0, 3).map(c => `${c.name}: ${c.score}/5 — ${c.rationale}`);
  const weaknesses = sorted.filter(c => c.score <= 2).reverse().slice(0, 3).map(c => `${c.name}: ${c.score}/5 — ${c.rationale}`);

  // Recommendation
  const recommendation: DealScore['recommendation'] =
    totalScore >= 80 ? 'strong_buy' : totalScore >= 60 ? 'buy' : totalScore >= 40 ? 'hold' : 'pass';

  return {
    startupId: startup.id, startupName: startup.name,
    totalScore, grade, criteria, strengths, weaknesses, categoryScores,
    recommendation, computedAt: Date.now(),
  };
}

/**
 * Compare deal scores for multiple startups.
 */
export function compareDealScores(scores: DealScore[]): {
  ranked: DealScore[];
  bestDeal: DealScore | null;
  avgScore: number;
  scoreSpread: number;
} {
  const ranked = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, d) => s + d.totalScore, 0) / scores.length) : 0;
  const maxScore = Math.max(...scores.map(s => s.totalScore), 0);
  const minScore = Math.min(...scores.map(s => s.totalScore), 100);
  return { ranked, bestDeal: ranked[0] ?? null, avgScore, scoreSpread: maxScore - minScore };
}
