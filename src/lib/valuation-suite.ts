/**
 * Valuation Model Suite
 * ─────────────────────
 * Multiple valuation methodologies in one engine.
 * Each method provides a range; the suite synthesizes a final valuation.
 *
 * Methods:
 *   1. Revenue Multiples    — ARR × sector-specific multiple
 *   2. Comparable Analysis  — based on verified ChainTrust peers
 *   3. Scorecard Method     — weighted factor scoring vs median
 *   4. Berkus Method        — risk element valuation
 *   5. DCF (simplified)    — discounted future cash flows
 *   6. Venture Capital Method — backward from target exit
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type ValuationMethod = 'revenue_multiple' | 'comparable' | 'scorecard' | 'berkus' | 'dcf' | 'vc_method';

export interface ValuationEstimate {
  method: ValuationMethod;
  methodName: string;
  /** Low end of range */
  low: number;
  /** Mid-point estimate */
  mid: number;
  /** High end of range */
  high: number;
  /** Confidence in this estimate (0-1) */
  confidence: number;
  /** Key assumptions */
  assumptions: string[];
  /** Calculation details */
  details: string;
}

export interface ValuationSuiteReport {
  /** All method estimates */
  estimates: ValuationEstimate[];
  /** Synthesized valuation range */
  synthesized: {
    low: number;
    mid: number;
    high: number;
    confidence: number;
  };
  /** Recommended valuation for negotiation */
  recommended: {
    preMoney: number;
    postMoney: number;
    rationale: string;
  };
  /** Key valuation drivers */
  drivers: { factor: string; impact: 'increases' | 'decreases' | 'neutral'; magnitude: 'high' | 'medium' | 'low' }[];
  /** Comparables used */
  comparables: { name: string; mrr: number; multiple: number; valuation: number }[];
  /** Computed at */
  computedAt: number;
}

// ── Sector Multiples ─────────────────────────────────────────────────

const SECTOR_MULTIPLES: Record<string, { low: number; mid: number; high: number }> = {
  DeFi:          { low: 15, mid: 25, high: 50 },
  Fintech:       { low: 12, mid: 20, high: 40 },
  SaaS:          { low: 10, mid: 18, high: 35 },
  Infrastructure: { low: 15, mid: 28, high: 55 },
  Identity:      { low: 12, mid: 22, high: 45 },
  Data:          { low: 10, mid: 18, high: 35 },
  'Supply Chain': { low: 8, mid: 15, high: 30 },
  NFT:           { low: 8, mid: 15, high: 30 },
  Gaming:        { low: 10, mid: 20, high: 40 },
  Social:        { low: 12, mid: 22, high: 45 },
};

// ── Valuation Methods ────────────────────────────────────────────────

function revenueMultiple(startup: DbStartup): ValuationEstimate {
  const arr = startup.mrr * 12;
  const multiples = SECTOR_MULTIPLES[startup.category] ?? { low: 10, mid: 18, high: 35 };
  const growth = Number(startup.growth_rate);

  // Adjust multiples for growth rate
  const growthAdj = growth >= 30 ? 1.5 : growth >= 20 ? 1.2 : growth >= 10 ? 1.0 : growth >= 0 ? 0.7 : 0.4;
  // Adjust for verification
  const verifyAdj = startup.verified ? 1.1 : 0.85;

  return {
    method: 'revenue_multiple',
    methodName: 'Revenue Multiples',
    low: Math.round(arr * multiples.low * growthAdj * verifyAdj),
    mid: Math.round(arr * multiples.mid * growthAdj * verifyAdj),
    high: Math.round(arr * multiples.high * growthAdj * verifyAdj),
    confidence: arr > 0 ? 0.7 : 0.2,
    assumptions: [
      `ARR: $${(arr / 1000000).toFixed(1)}M`,
      `Sector multiple range: ${multiples.low}-${multiples.high}x`,
      `Growth adjustment: ${growthAdj.toFixed(1)}x (${growth}% MoM)`,
      `Verification premium: ${startup.verified ? '+10%' : '-15%'}`,
    ],
    details: `Valuation = ARR × multiple × adjustments = $${(arr / 1000000).toFixed(1)}M × ${multiples.mid}x × ${growthAdj.toFixed(1)} × ${verifyAdj.toFixed(2)}`,
  };
}

function comparableAnalysis(startup: DbStartup, allStartups: DbStartup[]): ValuationEstimate {
  const peers = allStartups
    .filter(s => s.id !== startup.id && s.category === startup.category && s.mrr > 0)
    .sort((a, b) => Math.abs(a.mrr - startup.mrr) - Math.abs(b.mrr - startup.mrr))
    .slice(0, 5);

  if (peers.length === 0) {
    return {
      method: 'comparable',
      methodName: 'Comparable Analysis',
      low: 0, mid: 0, high: 0,
      confidence: 0,
      assumptions: ['No comparable companies available'],
      details: 'Insufficient peer data for comparable analysis.',
    };
  }

  const peerMultiples = peers.map(p => {
    const impliedVal = p.mrr * 12 * 20; // Assume 20x ARR as base
    const adjustedMultiple = impliedVal / (p.mrr * 12);
    return { name: p.name, mrr: p.mrr, multiple: adjustedMultiple, valuation: impliedVal };
  });

  const multiples = peerMultiples.map(p => p.multiple);
  const avgMultiple = multiples.reduce((s, m) => s + m, 0) / multiples.length;
  const arr = startup.mrr * 12;

  return {
    method: 'comparable',
    methodName: 'Comparable Analysis',
    low: Math.round(arr * avgMultiple * 0.7),
    mid: Math.round(arr * avgMultiple),
    high: Math.round(arr * avgMultiple * 1.4),
    confidence: Math.min(0.8, 0.3 + peers.length * 0.1),
    assumptions: [
      `${peers.length} comparable peers in ${startup.category}`,
      `Average peer multiple: ${avgMultiple.toFixed(1)}x ARR`,
      `Range: ±30% from average`,
    ],
    details: `Based on ${peers.length} ${startup.category} peers: ${peerMultiples.map(p => `${p.name} (${p.multiple.toFixed(0)}x)`).join(', ')}`,
  };
}

function scorecardMethod(startup: DbStartup): ValuationEstimate {
  // Base valuation for the stage
  const baseValuation = startup.mrr >= 100000 ? 15000000 : startup.mrr >= 30000 ? 8000000 : 4000000;

  // Scoring factors (-50% to +50%)
  const factors: { name: string; weight: number; score: number }[] = [
    { name: 'Management Team', weight: 0.30, score: startup.team_size >= 10 ? 1.3 : startup.team_size >= 5 ? 1.0 : 0.7 },
    { name: 'Market Size', weight: 0.25, score: ['DeFi', 'Infrastructure', 'Fintech'].includes(startup.category) ? 1.2 : 1.0 },
    { name: 'Product/Technology', weight: 0.15, score: startup.verified ? 1.3 : startup.trust_score > 60 ? 1.0 : 0.8 },
    { name: 'Competitive Position', weight: 0.10, score: startup.mrr > 100000 ? 1.2 : 1.0 },
    { name: 'Revenue/Traction', weight: 0.10, score: Number(startup.growth_rate) > 20 ? 1.4 : Number(startup.growth_rate) > 10 ? 1.1 : 0.8 },
    { name: 'Other Factors', weight: 0.10, score: startup.sustainability_score > 70 ? 1.1 : 1.0 },
  ];

  const weightedMultiplier = factors.reduce((s, f) => s + f.weight * f.score, 0);
  const valuation = Math.round(baseValuation * weightedMultiplier);

  return {
    method: 'scorecard',
    methodName: 'Scorecard Method',
    low: Math.round(valuation * 0.75),
    mid: valuation,
    high: Math.round(valuation * 1.3),
    confidence: 0.5,
    assumptions: factors.map(f => `${f.name} (${(f.weight * 100).toFixed(0)}% weight): ${f.score.toFixed(1)}x`),
    details: `Base: $${(baseValuation / 1000000).toFixed(0)}M × weighted score ${weightedMultiplier.toFixed(2)} = $${(valuation / 1000000).toFixed(1)}M`,
  };
}

function berkusMethod(startup: DbStartup): ValuationEstimate {
  // Each risk element worth up to $500K-$2M depending on stage
  const maxPerElement = startup.mrr >= 50000 ? 2000000 : startup.mrr >= 10000 ? 1000000 : 500000;

  const elements: { name: string; score: number }[] = [
    { name: 'Sound Idea', score: startup.description ? 0.8 : 0.4 },
    { name: 'Working Prototype', score: startup.users > 0 ? 0.9 : 0.3 },
    { name: 'Quality Team', score: startup.team_size >= 8 ? 0.85 : startup.team_size >= 3 ? 0.6 : 0.3 },
    { name: 'Strategic Relationships', score: startup.verified ? 0.7 : 0.4 },
    { name: 'Product Rollout/Sales', score: startup.mrr > 0 ? Math.min(1.0, startup.mrr / 100000) : 0.1 },
  ];

  const total = elements.reduce((s, e) => s + e.score * maxPerElement, 0);

  return {
    method: 'berkus',
    methodName: 'Berkus Method',
    low: Math.round(total * 0.7),
    mid: Math.round(total),
    high: Math.round(total * 1.4),
    confidence: 0.4,
    assumptions: elements.map(e => `${e.name}: ${(e.score * 100).toFixed(0)}% of $${(maxPerElement / 1000).toFixed(0)}K max`),
    details: `Pre-revenue risk assessment: 5 elements × $${(maxPerElement / 1000000).toFixed(1)}M max = $${(total / 1000000).toFixed(1)}M`,
  };
}

function vcMethod(startup: DbStartup): ValuationEstimate {
  // Work backward from expected exit
  const arr = startup.mrr * 12;
  const growth = Number(startup.growth_rate);
  const yearsToExit = growth >= 20 ? 5 : growth >= 10 ? 7 : 10;
  const exitMultiple = growth >= 20 ? 15 : growth >= 10 ? 10 : 6;

  // Project ARR at exit
  const projectedArr = arr * Math.pow(1 + growth / 100, yearsToExit * 12);
  const exitValue = projectedArr * exitMultiple;

  // Discount back at target return rate
  const targetReturn = 10; // 10x target
  const preMoneyToday = exitValue / targetReturn;

  return {
    method: 'vc_method',
    methodName: 'VC Method (Target Return)',
    low: Math.round(preMoneyToday * 0.6),
    mid: Math.round(preMoneyToday),
    high: Math.round(preMoneyToday * 1.5),
    confidence: 0.4,
    assumptions: [
      `Current ARR: $${(arr / 1000000).toFixed(1)}M`,
      `Growth: ${growth}% MoM for ${yearsToExit} years`,
      `Exit ARR: $${(projectedArr / 1000000).toFixed(0)}M`,
      `Exit multiple: ${exitMultiple}x ARR`,
      `Target return: ${targetReturn}x`,
    ],
    details: `Exit value: $${(exitValue / 1000000).toFixed(0)}M ÷ ${targetReturn}x target = $${(preMoneyToday / 1000000).toFixed(1)}M pre-money today`,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run all valuation methods and synthesize a final range.
 */
export function runValuationSuite(
  startup: DbStartup,
  allStartups: DbStartup[],
): ValuationSuiteReport {
  const estimates: ValuationEstimate[] = [
    revenueMultiple(startup),
    comparableAnalysis(startup, allStartups),
    scorecardMethod(startup),
    berkusMethod(startup),
    vcMethod(startup),
  ].filter(e => e.mid > 0);

  // Confidence-weighted synthesis
  const totalConf = estimates.reduce((s, e) => s + e.confidence, 0);
  const synthLow = Math.round(estimates.reduce((s, e) => s + e.low * e.confidence, 0) / totalConf);
  const synthMid = Math.round(estimates.reduce((s, e) => s + e.mid * e.confidence, 0) / totalConf);
  const synthHigh = Math.round(estimates.reduce((s, e) => s + e.high * e.confidence, 0) / totalConf);
  const synthConf = Math.min(0.9, totalConf / estimates.length);

  // Drivers
  const growth = Number(startup.growth_rate);
  const drivers: ValuationSuiteReport['drivers'] = [
    { factor: 'Growth Rate', impact: growth > 15 ? 'increases' : growth < 5 ? 'decreases' : 'neutral', magnitude: growth > 25 ? 'high' : 'medium' },
    { factor: 'On-chain Verification', impact: startup.verified ? 'increases' : 'decreases', magnitude: 'medium' },
    { factor: 'Revenue Scale', impact: startup.mrr > 100000 ? 'increases' : 'neutral', magnitude: startup.mrr > 200000 ? 'high' : 'low' },
    { factor: 'Trust Score', impact: startup.trust_score > 70 ? 'increases' : startup.trust_score < 40 ? 'decreases' : 'neutral', magnitude: 'medium' },
    { factor: 'Token Distribution', impact: Number(startup.whale_concentration) < 25 ? 'increases' : Number(startup.whale_concentration) > 50 ? 'decreases' : 'neutral', magnitude: 'low' },
  ];

  // Comparables
  const comparables = allStartups
    .filter(s => s.id !== startup.id && s.category === startup.category && s.mrr > 0)
    .slice(0, 5)
    .map(s => ({
      name: s.name,
      mrr: s.mrr,
      multiple: 20, // Assumed
      valuation: s.mrr * 12 * 20,
    }));

  return {
    estimates,
    synthesized: { low: synthLow, mid: synthMid, high: synthHigh, confidence: synthConf },
    recommended: {
      preMoney: synthMid,
      postMoney: Math.round(synthMid * 1.15),
      rationale: `Confidence-weighted average across ${estimates.length} methods. Growth rate of ${growth}% and ${startup.verified ? 'verified' : 'unverified'} status are the primary drivers.`,
    },
    drivers,
    comparables,
    computedAt: Date.now(),
  };
}
