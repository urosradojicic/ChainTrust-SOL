/**
 * ChainTrust Score (CTS) — On-Chain Reputation System
 * ────────────────────────────────────────────────────
 * A comprehensive, portable credit score for startups.
 * Evolves the basic trust_score into a multi-dimensional reputation system.
 *
 * Score components (total: 100 points):
 *   1. Verification Integrity   (25 pts) — on-chain verification status & consistency
 *   2. Financial Health         (25 pts) — revenue, growth, burn efficiency
 *   3. Reporting Consistency    (15 pts) — regular, timely, accurate reporting
 *   4. Token Health             (15 pts) — distribution, inflation, concentration
 *   5. Governance Participation (10 pts) — DAO engagement, proposal quality
 *   6. Sustainability           (10 pts) — ESG score, carbon offset commitment
 *
 * Designed for future on-chain storage in the Anchor program.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type ScoreTier = 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Unrated';

export interface ScoreComponent {
  /** Component name */
  name: string;
  /** Component key for identification */
  key: string;
  /** Points earned */
  score: number;
  /** Maximum possible points */
  maxScore: number;
  /** Percentage of max */
  percentage: number;
  /** Letter grade for this component */
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  /** Factors that contributed to this score */
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  /** Factor name */
  name: string;
  /** Points contributed */
  points: number;
  /** Max possible */
  maxPoints: number;
  /** Explanation */
  detail: string;
}

export interface ReputationScore {
  /** Total ChainTrust Score (0-100) */
  totalScore: number;
  /** Score tier */
  tier: ScoreTier;
  /** Letter grade */
  grade: string;
  /** Component breakdown */
  components: ScoreComponent[];
  /** Trend compared to what the score would have been without the latest data */
  trend: 'improving' | 'stable' | 'declining';
  /** Percentile rank among all startups */
  percentile: number;
  /** Actionable improvement suggestions, ordered by impact */
  improvements: Improvement[];
  /** Timestamp */
  computedAt: number;
}

export interface Improvement {
  /** What to improve */
  action: string;
  /** Estimated point gain */
  potentialPoints: number;
  /** Difficulty to implement */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Which component it affects */
  component: string;
}

// ── Grading Utilities ────────────────────────────────────────────────

function letterGrade(pct: number): ScoreComponent['grade'] {
  if (pct >= 95) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 40) return 'C';
  if (pct >= 20) return 'D';
  return 'F';
}

function overallGrade(score: number): string {
  if (score >= 95) return 'AAA';
  if (score >= 90) return 'AA+';
  if (score >= 85) return 'AA';
  if (score >= 80) return 'AA-';
  if (score >= 75) return 'A+';
  if (score >= 70) return 'A';
  if (score >= 65) return 'A-';
  if (score >= 60) return 'BBB+';
  if (score >= 55) return 'BBB';
  if (score >= 50) return 'BBB-';
  if (score >= 45) return 'BB+';
  if (score >= 40) return 'BB';
  if (score >= 35) return 'BB-';
  if (score >= 30) return 'B';
  if (score >= 20) return 'CCC';
  if (score >= 10) return 'CC';
  return 'D';
}

function scoreTier(score: number): ScoreTier {
  if (score >= 85) return 'Platinum';
  if (score >= 70) return 'Gold';
  if (score >= 50) return 'Silver';
  if (score >= 30) return 'Bronze';
  return 'Unrated';
}

function buildComponent(
  name: string,
  key: string,
  maxScore: number,
  factors: ScoreFactor[],
): ScoreComponent {
  const score = Math.min(maxScore, factors.reduce((sum, f) => sum + f.points, 0));
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return { name, key, score, maxScore, percentage, grade: letterGrade(percentage), factors };
}

// ── Score Computation ────────────────────────────────────────────────

/**
 * 1. VERIFICATION INTEGRITY (25 points)
 */
function computeVerificationScore(startup: DbStartup): ScoreComponent {
  const factors: ScoreFactor[] = [];

  // On-chain verification (10 pts)
  factors.push({
    name: 'On-chain verification',
    points: startup.verified ? 10 : 0,
    maxPoints: 10,
    detail: startup.verified
      ? 'Metrics are cryptographically verified on Solana'
      : 'No on-chain verification — data is self-reported',
  });

  // Trust score calibration (10 pts) — how consistent is the trust score with the data
  const trustPoints = Math.min(10, Math.round(startup.trust_score / 10));
  factors.push({
    name: 'Trust score level',
    points: trustPoints,
    maxPoints: 10,
    detail: `Current trust score: ${startup.trust_score}/100`,
  });

  // Verification completeness (5 pts) — are all core metrics populated
  let completeness = 0;
  if (startup.mrr > 0) completeness++;
  if (startup.users > 0) completeness++;
  if (startup.team_size > 0) completeness++;
  if (startup.treasury > 0) completeness++;
  if (startup.description) completeness++;
  const completenessPoints = Math.round((completeness / 5) * 5);
  factors.push({
    name: 'Data completeness',
    points: completenessPoints,
    maxPoints: 5,
    detail: `${completeness}/5 core data fields populated`,
  });

  return buildComponent('Verification Integrity', 'verification', 25, factors);
}

/**
 * 2. FINANCIAL HEALTH (25 points)
 */
function computeFinancialScore(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): ScoreComponent {
  const factors: ScoreFactor[] = [];

  // Revenue scale (8 pts)
  const mrr = startup.mrr;
  const revenuePoints =
    mrr >= 200000 ? 8 :
    mrr >= 100000 ? 7 :
    mrr >= 50000 ? 5 :
    mrr >= 20000 ? 3 :
    mrr > 0 ? 1 : 0;
  factors.push({
    name: 'Revenue scale',
    points: revenuePoints,
    maxPoints: 8,
    detail: `$${(mrr / 1000).toFixed(0)}K MRR`,
  });

  // Growth rate (8 pts)
  const growth = Number(startup.growth_rate);
  const growthPoints =
    growth >= 30 ? 8 :
    growth >= 20 ? 7 :
    growth >= 10 ? 5 :
    growth >= 5 ? 3 :
    growth > 0 ? 1 : 0;
  factors.push({
    name: 'Growth momentum',
    points: growthPoints,
    maxPoints: 8,
    detail: `${growth}% MoM growth rate`,
  });

  // Burn efficiency (5 pts)
  let burnEfficiency = 3; // default for insufficient data
  if (metrics.length >= 2) {
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const lastRev = Number(sorted[sorted.length - 1].revenue);
    const lastCost = Number(sorted[sorted.length - 1].costs);
    if (lastRev >= lastCost) {
      burnEfficiency = 5; // profitable
    } else if (lastCost > 0) {
      const costRatio = lastRev / lastCost;
      burnEfficiency = costRatio > 0.8 ? 4 : costRatio > 0.5 ? 3 : costRatio > 0.3 ? 2 : 1;
    }
  }
  factors.push({
    name: 'Burn efficiency',
    points: burnEfficiency,
    maxPoints: 5,
    detail: burnEfficiency === 5 ? 'Revenue exceeds costs — cash flow positive' : `Efficiency score: ${burnEfficiency}/5`,
  });

  // Runway health (4 pts)
  let runwayPoints = 2;
  if (metrics.length >= 2) {
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const lastRev = Number(sorted[sorted.length - 1].revenue);
    const lastCost = Number(sorted[sorted.length - 1].costs);
    const monthlyBurn = Math.max(lastCost - lastRev, 0);
    if (monthlyBurn <= 0) {
      runwayPoints = 4; // profitable, infinite runway
    } else {
      const runway = startup.treasury / monthlyBurn;
      runwayPoints = runway > 24 ? 4 : runway > 18 ? 3 : runway > 12 ? 2 : runway > 6 ? 1 : 0;
    }
  }
  factors.push({
    name: 'Runway strength',
    points: runwayPoints,
    maxPoints: 4,
    detail: runwayPoints === 4 ? 'Comfortable runway or profitable' : `Runway score: ${runwayPoints}/4`,
  });

  return buildComponent('Financial Health', 'financial', 25, factors);
}

/**
 * 3. REPORTING CONSISTENCY (15 points)
 */
function computeReportingScore(metrics: DbMetricsHistory[]): ScoreComponent {
  const factors: ScoreFactor[] = [];

  // Number of reporting periods (6 pts)
  const periods = metrics.length;
  const periodsPoints = Math.min(6, periods);
  factors.push({
    name: 'Reporting history length',
    points: periodsPoints,
    maxPoints: 6,
    detail: `${periods} monthly reports submitted`,
  });

  // Revenue trend consistency (5 pts) — low volatility = higher score
  if (metrics.length >= 3) {
    const revenues = metrics.map(m => Number(m.revenue));
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const cv = avg > 0 ? (Math.sqrt(revenues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / revenues.length) / avg) * 100 : 0;
    const consistencyPoints = cv < 10 ? 5 : cv < 20 ? 4 : cv < 35 ? 3 : cv < 50 ? 2 : 1;
    factors.push({
      name: 'Revenue consistency',
      points: consistencyPoints,
      maxPoints: 5,
      detail: `Revenue CV: ${cv.toFixed(0)}% (lower is more consistent)`,
    });
  } else {
    factors.push({
      name: 'Revenue consistency',
      points: 1,
      maxPoints: 5,
      detail: 'Insufficient data (need 3+ months)',
    });
  }

  // Data completeness per report (4 pts)
  if (metrics.length > 0) {
    const completeReports = metrics.filter(m =>
      Number(m.revenue) > 0 && Number(m.costs) >= 0 && Number(m.mau) > 0
    ).length;
    const completenessPct = completeReports / metrics.length;
    const completenessPoints = Math.round(completenessPct * 4);
    factors.push({
      name: 'Report completeness',
      points: completenessPoints,
      maxPoints: 4,
      detail: `${completeReports}/${metrics.length} reports have complete data`,
    });
  } else {
    factors.push({
      name: 'Report completeness',
      points: 0,
      maxPoints: 4,
      detail: 'No reports submitted',
    });
  }

  return buildComponent('Reporting Consistency', 'reporting', 15, factors);
}

/**
 * 4. TOKEN HEALTH (15 points)
 */
function computeTokenScore(startup: DbStartup): ScoreComponent {
  const factors: ScoreFactor[] = [];
  const whale = Number(startup.whale_concentration);
  const inflation = Number(startup.inflation_rate);

  // Token distribution quality (7 pts)
  const distPoints =
    whale < 10 ? 7 :
    whale < 20 ? 6 :
    whale < 30 ? 5 :
    whale < 40 ? 3 :
    whale < 60 ? 1 : 0;
  factors.push({
    name: 'Token distribution',
    points: distPoints,
    maxPoints: 7,
    detail: `${whale}% whale concentration (lower = healthier)`,
  });

  // Inflation control (5 pts)
  const inflationPoints =
    inflation <= 2 ? 5 :
    inflation <= 4 ? 4 :
    inflation <= 6 ? 3 :
    inflation <= 8 ? 1 : 0;
  factors.push({
    name: 'Inflation control',
    points: inflationPoints,
    maxPoints: 5,
    detail: `${inflation}% annual inflation rate`,
  });

  // Tokenomics sub-score (3 pts)
  const tokenomicsScore = startup.tokenomics_score;
  const tokenomicsPoints =
    tokenomicsScore >= 80 ? 3 :
    tokenomicsScore >= 60 ? 2 :
    tokenomicsScore >= 40 ? 1 : 0;
  factors.push({
    name: 'Tokenomics design',
    points: tokenomicsPoints,
    maxPoints: 3,
    detail: `Tokenomics sub-score: ${tokenomicsScore}/100`,
  });

  return buildComponent('Token Health', 'token', 15, factors);
}

/**
 * 5. GOVERNANCE PARTICIPATION (10 points)
 */
function computeGovernanceScore(startup: DbStartup): ScoreComponent {
  const factors: ScoreFactor[] = [];
  const govScore = startup.governance_score;

  // Governance score (6 pts)
  const govPoints =
    govScore >= 80 ? 6 :
    govScore >= 60 ? 4 :
    govScore >= 40 ? 3 :
    govScore >= 20 ? 1 : 0;
  factors.push({
    name: 'Governance score',
    points: govPoints,
    maxPoints: 6,
    detail: `Governance sub-score: ${govScore}/100`,
  });

  // DAO readiness (4 pts) — is governance infrastructure in place
  let daoPoints = 0;
  if (govScore > 50) daoPoints += 2; // basic governance
  if (startup.verified) daoPoints += 1; // verified = accountable
  if (Number(startup.whale_concentration) < 40) daoPoints += 1; // decentralized enough for meaningful governance
  factors.push({
    name: 'DAO readiness',
    points: daoPoints,
    maxPoints: 4,
    detail: `DAO readiness: ${daoPoints}/4 criteria met`,
  });

  return buildComponent('Governance Participation', 'governance', 10, factors);
}

/**
 * 6. SUSTAINABILITY (10 points)
 */
function computeSustainabilityScore(startup: DbStartup): ScoreComponent {
  const factors: ScoreFactor[] = [];

  // ESG composite (5 pts)
  const susScore = startup.sustainability_score;
  const esgPoints =
    susScore >= 80 ? 5 :
    susScore >= 60 ? 4 :
    susScore >= 40 ? 3 :
    susScore >= 20 ? 1 : 0;
  factors.push({
    name: 'ESG composite score',
    points: esgPoints,
    maxPoints: 5,
    detail: `Sustainability score: ${susScore}/100`,
  });

  // Carbon offset commitment (3 pts)
  const carbonPoints =
    startup.carbon_offset_tonnes >= 50 ? 3 :
    startup.carbon_offset_tonnes >= 20 ? 2 :
    startup.carbon_offset_tonnes > 0 ? 1 : 0;
  factors.push({
    name: 'Carbon offset program',
    points: carbonPoints,
    maxPoints: 3,
    detail: `${startup.carbon_offset_tonnes} tonnes of carbon offsets`,
  });

  // Energy efficiency (2 pts)
  const energyPoints = startup.energy_score >= 80 ? 2 : startup.energy_score >= 50 ? 1 : 0;
  factors.push({
    name: 'Energy efficiency',
    points: energyPoints,
    maxPoints: 2,
    detail: `Energy score: ${startup.energy_score}/100`,
  });

  return buildComponent('Sustainability', 'sustainability', 10, factors);
}

// ── Improvement Suggestions ──────────────────────────────────────────

function generateImprovements(components: ScoreComponent[], startup: DbStartup): Improvement[] {
  const improvements: Improvement[] = [];

  for (const component of components) {
    const gap = component.maxScore - component.score;
    if (gap <= 0) continue;

    for (const factor of component.factors) {
      const factorGap = factor.maxPoints - factor.points;
      if (factorGap <= 1) continue;

      // Generate specific improvement suggestions
      if (factor.name === 'On-chain verification' && factor.points === 0) {
        improvements.push({
          action: 'Complete on-chain metric verification on Solana',
          potentialPoints: factor.maxPoints,
          difficulty: 'medium',
          component: component.key,
        });
      }
      if (factor.name === 'Token distribution' && factorGap >= 3) {
        improvements.push({
          action: 'Reduce whale concentration below 30% via distribution programs',
          potentialPoints: Math.min(factorGap, 4),
          difficulty: 'hard',
          component: component.key,
        });
      }
      if (factor.name === 'Reporting history length' && factor.points < 4) {
        improvements.push({
          action: 'Submit monthly metric reports consistently to build reporting history',
          potentialPoints: Math.min(factorGap, 3),
          difficulty: 'easy',
          component: component.key,
        });
      }
      if (factor.name === 'Carbon offset program' && factor.points < 2) {
        improvements.push({
          action: 'Start a carbon offset program (even small commitments count)',
          potentialPoints: factorGap,
          difficulty: 'easy',
          component: component.key,
        });
      }
      if (factor.name === 'Inflation control' && factor.points < 3) {
        improvements.push({
          action: 'Implement token burn mechanisms or reduce emission schedule',
          potentialPoints: Math.min(factorGap, 3),
          difficulty: 'hard',
          component: component.key,
        });
      }
      if (factor.name === 'Data completeness' && factorGap >= 2) {
        improvements.push({
          action: 'Fill in all core profile fields (description, website, team size, treasury)',
          potentialPoints: factorGap,
          difficulty: 'easy',
          component: component.key,
        });
      }
    }
  }

  // Sort by potential points descending, then by difficulty (easy first)
  const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  improvements.sort((a, b) => {
    const pointDiff = b.potentialPoints - a.potentialPoints;
    if (pointDiff !== 0) return pointDiff;
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  return improvements.slice(0, 6); // Top 6 actionable improvements
}

// ── Main Computation Function ────────────────────────────────────────

/**
 * Compute the full ChainTrust Score (CTS) for a startup.
 *
 * @param startup     - The startup to score
 * @param metrics     - Historical metrics data
 * @param allStartups - All startups for percentile ranking
 * @returns           - Complete reputation score report
 */
export function computeReputationScore(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): ReputationScore {
  const components = [
    computeVerificationScore(startup),
    computeFinancialScore(startup, metrics),
    computeReportingScore(metrics),
    computeTokenScore(startup),
    computeGovernanceScore(startup),
    computeSustainabilityScore(startup),
  ];

  const totalScore = components.reduce((sum, c) => sum + c.score, 0);

  // Calculate percentile rank
  const allScores = allStartups.map(s => {
    // Quick approximation for ranking without full computation
    let approxScore = 0;
    if (s.verified) approxScore += 10;
    approxScore += Math.min(10, s.trust_score / 10);
    approxScore += Math.min(8, s.mrr / 25000);
    approxScore += Math.min(8, Number(s.growth_rate) / 4);
    approxScore += Math.min(5, s.sustainability_score / 20);
    approxScore += Math.min(5, (100 - Number(s.whale_concentration)) / 20);
    return approxScore;
  });

  const approxOwn = totalScore;
  const betterCount = allScores.filter(s => s > approxOwn * 0.5).length; // approximate
  const percentile = Math.round((1 - betterCount / Math.max(allStartups.length, 1)) * 100);

  // Determine trend (simplified — compare current scores to what they'd be without latest metrics)
  let trend: ReputationScore['trend'] = 'stable';
  if (metrics.length >= 3) {
    const metricsWithout = metrics.slice(0, -1);
    const prevFinancial = computeFinancialScore(startup, metricsWithout);
    const currFinancial = components.find(c => c.key === 'financial')!;
    const diff = currFinancial.score - prevFinancial.score;
    if (diff > 1) trend = 'improving';
    else if (diff < -1) trend = 'declining';
  }

  const improvements = generateImprovements(components, startup);

  return {
    totalScore,
    tier: scoreTier(totalScore),
    grade: overallGrade(totalScore),
    components,
    trend,
    percentile: Math.max(0, Math.min(100, percentile)),
    improvements,
    computedAt: Date.now(),
  };
}
