/**
 * Competitive Intelligence Engine
 * ────────────────────────────────
 * Maps competitive landscapes, identifies moats, analyzes positioning,
 * and generates competitive battle cards.
 *
 * Uses peer data from ChainTrust's verified startup database to provide
 * real, data-driven competitive analysis (not generic market research).
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type MoatType = 'network_effects' | 'switching_costs' | 'data_moat' | 'brand' | 'regulatory' | 'technology' | 'scale' | 'none';
export type ThreatLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface Competitor {
  startup: DbStartup;
  /** How similar this competitor is (0-1) */
  similarity: number;
  /** Relative strength vs the target (-1 to +1, positive = competitor is stronger) */
  relativeStrength: number;
  /** Which dimensions the competitor excels at */
  advantages: string[];
  /** Which dimensions the target excels at */
  disadvantages: string[];
  /** Threat assessment */
  threatLevel: ThreatLevel;
}

export interface CompetitiveMoat {
  type: MoatType;
  strength: number; // 0-100
  evidence: string;
  durability: 'weak' | 'moderate' | 'strong' | 'fortress';
}

export interface MarketPosition {
  /** Where the startup sits in the market (0-100 on two axes) */
  growthAxis: number;
  marketShareAxis: number;
  /** BCG matrix quadrant */
  quadrant: 'star' | 'question_mark' | 'cash_cow' | 'dog';
  /** Position label */
  positionLabel: string;
}

export interface BattleCard {
  /** Competitor name */
  competitorName: string;
  /** How to win against this competitor */
  winStrategy: string[];
  /** Where you lose to this competitor */
  vulnerabilities: string[];
  /** Key differentiators */
  differentiators: string[];
  /** Pricing comparison */
  pricingPosition: 'cheaper' | 'similar' | 'premium' | 'unknown';
}

export interface CompetitiveReport {
  /** Target startup */
  startup: DbStartup;
  /** Direct competitors (same category) */
  directCompetitors: Competitor[];
  /** Indirect competitors (similar metrics, different category) */
  indirectCompetitors: Competitor[];
  /** Identified moats */
  moats: CompetitiveMoat[];
  /** Market position */
  position: MarketPosition;
  /** Battle cards */
  battleCards: BattleCard[];
  /** Overall competitive strength (0-100) */
  competitiveStrength: number;
  /** Category dominance score (0-100) */
  categoryDominance: number;
  /** Key insights */
  insights: string[];
  /** Computed at */
  computedAt: number;
}

// ── Analysis Functions ───────────────────────────────────────────────

function computeSimilarity(a: DbStartup, b: DbStartup): number {
  const maxMrr = Math.max(a.mrr, b.mrr, 1);
  const mrrSim = 1 - Math.abs(a.mrr - b.mrr) / maxMrr;
  const growthSim = 1 - Math.abs(Number(a.growth_rate) - Number(b.growth_rate)) / 50;
  const userSim = 1 - Math.abs(a.users - b.users) / Math.max(a.users, b.users, 1);
  const trustSim = 1 - Math.abs(a.trust_score - b.trust_score) / 100;
  return Math.max(0, (mrrSim * 0.3 + growthSim * 0.25 + userSim * 0.25 + trustSim * 0.2));
}

function assessCompetitor(target: DbStartup, comp: DbStartup): Competitor {
  const similarity = computeSimilarity(target, comp);

  // Compare across dimensions
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  let strengthSum = 0;
  let comparisons = 0;

  if (comp.mrr > target.mrr * 1.2) { advantages.push(`Higher revenue ($${(comp.mrr / 1000).toFixed(0)}K vs $${(target.mrr / 1000).toFixed(0)}K)`); strengthSum += 0.3; }
  else if (target.mrr > comp.mrr * 1.2) { disadvantages.push(`Lower revenue`); strengthSum -= 0.3; }
  comparisons++;

  if (Number(comp.growth_rate) > Number(target.growth_rate) * 1.3) { advantages.push(`Faster growth (${comp.growth_rate}% vs ${target.growth_rate}%)`); strengthSum += 0.25; }
  else if (Number(target.growth_rate) > Number(comp.growth_rate) * 1.3) { disadvantages.push(`Slower growth`); strengthSum -= 0.25; }
  comparisons++;

  if (comp.users > target.users * 1.5) { advantages.push(`Larger user base (${comp.users.toLocaleString()} vs ${target.users.toLocaleString()})`); strengthSum += 0.2; }
  else if (target.users > comp.users * 1.5) { disadvantages.push(`Smaller user base`); strengthSum -= 0.2; }
  comparisons++;

  if (comp.trust_score > target.trust_score + 10) { advantages.push(`Higher trust score`); strengthSum += 0.15; }
  else if (target.trust_score > comp.trust_score + 10) { disadvantages.push(`Lower trust score`); strengthSum -= 0.15; }
  comparisons++;

  if (comp.team_size > target.team_size * 1.5) { advantages.push(`Larger team (${comp.team_size} vs ${target.team_size})`); strengthSum += 0.1; }
  comparisons++;

  const relativeStrength = comparisons > 0 ? strengthSum / comparisons : 0;
  const threatLevel: ThreatLevel = relativeStrength > 0.3 ? 'critical' : relativeStrength > 0.1 ? 'high' : relativeStrength > -0.1 ? 'moderate' : 'low';

  return { startup: comp, similarity, relativeStrength, advantages, disadvantages, threatLevel };
}

function identifyMoats(startup: DbStartup, competitors: Competitor[]): CompetitiveMoat[] {
  const moats: CompetitiveMoat[] = [];

  // Network effects (user base relative to competitors)
  const avgPeerUsers = competitors.length > 0 ? competitors.reduce((s, c) => s + c.startup.users, 0) / competitors.length : 0;
  if (startup.users > avgPeerUsers * 2 && startup.users > 10000) {
    moats.push({
      type: 'network_effects',
      strength: Math.min(90, Math.round((startup.users / avgPeerUsers) * 30)),
      evidence: `${startup.users.toLocaleString()} users is ${(startup.users / Math.max(avgPeerUsers, 1)).toFixed(1)}x the peer average`,
      durability: startup.users > avgPeerUsers * 5 ? 'fortress' : startup.users > avgPeerUsers * 3 ? 'strong' : 'moderate',
    });
  }

  // Data moat (if verified and high trust)
  if (startup.verified && startup.trust_score >= 80) {
    moats.push({
      type: 'data_moat',
      strength: startup.trust_score,
      evidence: `On-chain verified metrics with ${startup.trust_score}/100 trust score — data integrity is a competitive advantage`,
      durability: 'strong',
    });
  }

  // Technology moat (based on category and sustainability)
  if (startup.energy_score >= 85 && startup.sustainability_score >= 75) {
    moats.push({
      type: 'technology',
      strength: Math.round((startup.energy_score + startup.sustainability_score) / 2),
      evidence: `Superior technology stack with ${startup.energy_score}/100 energy efficiency and ${startup.sustainability_score}/100 sustainability`,
      durability: 'moderate',
    });
  }

  // Scale moat (revenue dominance)
  const avgPeerMrr = competitors.length > 0 ? competitors.reduce((s, c) => s + c.startup.mrr, 0) / competitors.length : 0;
  if (startup.mrr > avgPeerMrr * 2 && startup.mrr > 100000) {
    moats.push({
      type: 'scale',
      strength: Math.min(85, Math.round((startup.mrr / avgPeerMrr) * 25)),
      evidence: `$${(startup.mrr / 1000).toFixed(0)}K MRR is ${(startup.mrr / Math.max(avgPeerMrr, 1)).toFixed(1)}x the category average`,
      durability: startup.mrr > avgPeerMrr * 5 ? 'fortress' : 'strong',
    });
  }

  // If no moats found
  if (moats.length === 0) {
    moats.push({
      type: 'none',
      strength: 10,
      evidence: 'No clear competitive moat identified. The startup competes primarily on execution speed.',
      durability: 'weak',
    });
  }

  return moats.sort((a, b) => b.strength - a.strength);
}

function classifyPosition(startup: DbStartup, categoryPeers: DbStartup[]): MarketPosition {
  // Growth axis (0-100 based on growth percentile)
  const growthRates = categoryPeers.map(s => Number(s.growth_rate));
  const growthRank = growthRates.filter(g => g < Number(startup.growth_rate)).length;
  const growthAxis = categoryPeers.length > 1 ? (growthRank / (categoryPeers.length - 1)) * 100 : 50;

  // Market share axis (0-100 based on MRR percentile)
  const mrrs = categoryPeers.map(s => s.mrr);
  const mrrRank = mrrs.filter(m => m < startup.mrr).length;
  const marketShareAxis = categoryPeers.length > 1 ? (mrrRank / (categoryPeers.length - 1)) * 100 : 50;

  // BCG quadrant
  let quadrant: MarketPosition['quadrant'];
  if (growthAxis >= 50 && marketShareAxis >= 50) quadrant = 'star';
  else if (growthAxis >= 50 && marketShareAxis < 50) quadrant = 'question_mark';
  else if (growthAxis < 50 && marketShareAxis >= 50) quadrant = 'cash_cow';
  else quadrant = 'dog';

  const labels = { star: 'Star — High Growth, High Share', question_mark: 'Question Mark — High Growth, Low Share', cash_cow: 'Cash Cow — Low Growth, High Share', dog: 'Dog — Low Growth, Low Share' };

  return { growthAxis, marketShareAxis, quadrant, positionLabel: labels[quadrant] };
}

function generateBattleCards(target: DbStartup, competitors: Competitor[]): BattleCard[] {
  return competitors.slice(0, 5).map(comp => {
    const winStrategy: string[] = [];
    const vulnerabilities: string[] = [];
    const differentiators: string[] = [];

    // Analyze where target wins
    if (target.trust_score > comp.startup.trust_score) {
      winStrategy.push('Emphasize verified metrics and data integrity');
      differentiators.push(`Higher trust score (${target.trust_score} vs ${comp.startup.trust_score})`);
    }
    if (Number(target.growth_rate) > Number(comp.startup.growth_rate)) {
      winStrategy.push('Highlight superior growth trajectory');
      differentiators.push(`Faster growth (${target.growth_rate}% vs ${comp.startup.growth_rate}%)`);
    }
    if (target.sustainability_score > comp.startup.sustainability_score + 15) {
      winStrategy.push('Leverage ESG advantage for impact-focused investors');
      differentiators.push('Stronger ESG profile');
    }
    if (target.verified && !comp.startup.verified) {
      winStrategy.push('On-chain verification is a unique advantage — competitor is unverified');
      differentiators.push('On-chain verified vs self-reported');
    }

    // Analyze where target loses
    if (comp.startup.mrr > target.mrr * 1.5) vulnerabilities.push(`Revenue gap: competitor has ${(comp.startup.mrr / target.mrr).toFixed(1)}x more MRR`);
    if (comp.startup.users > target.users * 2) vulnerabilities.push(`User base gap: competitor has ${(comp.startup.users / target.users).toFixed(1)}x more users`);
    if (comp.startup.team_size > target.team_size * 2) vulnerabilities.push('Larger team suggests more resources and execution capacity');

    if (winStrategy.length === 0) winStrategy.push('Focus on unique value proposition and niche positioning');
    if (differentiators.length === 0) differentiators.push('Currently no clear differentiators — product innovation needed');

    return {
      competitorName: comp.startup.name,
      winStrategy,
      vulnerabilities,
      differentiators,
      pricingPosition: target.mrr > comp.startup.mrr ? 'premium' : target.mrr < comp.startup.mrr * 0.5 ? 'cheaper' : 'similar',
    };
  });
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate complete competitive intelligence report.
 */
export function analyzeCompetitiveLandscape(
  startup: DbStartup,
  allStartups: DbStartup[],
): CompetitiveReport {
  const others = allStartups.filter(s => s.id !== startup.id);

  // Direct competitors (same category)
  const directCompetitors = others
    .filter(s => s.category === startup.category)
    .map(comp => assessCompetitor(startup, comp))
    .sort((a, b) => b.similarity - a.similarity);

  // Indirect competitors (different category but similar metrics)
  const indirectCompetitors = others
    .filter(s => s.category !== startup.category)
    .map(comp => assessCompetitor(startup, comp))
    .filter(c => c.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  const moats = identifyMoats(startup, directCompetitors);
  const categoryPeers = allStartups.filter(s => s.category === startup.category);
  const position = classifyPosition(startup, categoryPeers);
  const battleCards = generateBattleCards(startup, directCompetitors);

  // Competitive strength (based on relative strengths)
  const avgRelStrength = directCompetitors.length > 0
    ? directCompetitors.reduce((s, c) => s + c.relativeStrength, 0) / directCompetitors.length
    : 0;
  const competitiveStrength = Math.round(Math.max(0, Math.min(100, 50 - avgRelStrength * 100)));

  // Category dominance
  const mrrRank = categoryPeers.filter(s => s.mrr > startup.mrr).length + 1;
  const categoryDominance = Math.round((1 - (mrrRank - 1) / Math.max(categoryPeers.length - 1, 1)) * 100);

  // Key insights
  const insights: string[] = [];
  if (position.quadrant === 'star') insights.push(`${startup.name} is a "Star" — high growth AND high market share in ${startup.category}`);
  if (moats.length > 0 && moats[0].type !== 'none') insights.push(`Strongest moat: ${moats[0].type.replace(/_/g, ' ')} (${moats[0].strength}/100)`);
  if (directCompetitors.filter(c => c.threatLevel === 'critical').length > 0) insights.push(`${directCompetitors.filter(c => c.threatLevel === 'critical').length} critical-threat competitors identified`);
  if (categoryDominance >= 80) insights.push(`Dominates the ${startup.category} category (#${mrrRank} of ${categoryPeers.length})`);
  if (startup.verified && directCompetitors.some(c => !c.startup.verified)) insights.push('Verification advantage: some competitors lack on-chain verification');

  return {
    startup,
    directCompetitors,
    indirectCompetitors,
    moats,
    position,
    battleCards,
    competitiveStrength,
    categoryDominance,
    insights,
    computedAt: Date.now(),
  };
}
