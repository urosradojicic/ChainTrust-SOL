/**
 * Moat Depth Scorer
 * ─────────────────
 * Warren Buffett-style competitive moat analysis.
 * Identifies and quantifies what makes a startup defensible.
 *
 * Moat types (from Morningstar's framework):
 *   1. Network Effects      — value increases with users
 *   2. Switching Costs      — painful to leave
 *   3. Intangible Assets    — brand, IP, regulatory licenses
 *   4. Cost Advantages      — structural cost leadership
 *   5. Efficient Scale      — natural monopoly in niche market
 *
 * Enhanced with crypto-native moats:
 *   6. Protocol Lock-in     — composability creates dependency
 *   7. Data Moat            — proprietary on-chain data accumulation
 *   8. Trust Moat           — verification history is hard to replicate
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type MoatType = 'network_effects' | 'switching_costs' | 'intangible_assets' | 'cost_advantage' | 'efficient_scale' | 'protocol_lockin' | 'data_moat' | 'trust_moat';

export interface MoatAssessment {
  type: MoatType;
  name: string;
  icon: string;
  /** Strength (0-100) */
  strength: number;
  /** Durability estimate */
  durability: 'fragile' | 'moderate' | 'strong' | 'fortress';
  /** Evidence supporting this moat */
  evidence: string[];
  /** How this moat could be eroded */
  threats: string[];
  /** Time to replicate by a competitor (months) */
  replicationTime: number;
}

export interface MoatReport {
  /** Overall moat score (0-100) */
  overallScore: number;
  /** Moat width classification */
  width: 'no_moat' | 'narrow' | 'wide' | 'ultra_wide';
  /** All moat assessments */
  moats: MoatAssessment[];
  /** Primary moat (strongest) */
  primaryMoat: MoatAssessment | null;
  /** Buffett-style investability */
  buffettScore: number;
  /** How long would it take a well-funded competitor to replicate? */
  competitiveShield: { months: number; cost: string; difficulty: string };
  /** Strategic recommendations */
  recommendations: string[];
  /** Computed at */
  computedAt: number;
}

// ── Moat Assessors ───────────────────────────────────────────────────

function assessNetworkEffects(startup: DbStartup, metrics: DbMetricsHistory[], peers: DbStartup[]): MoatAssessment {
  const userScale = startup.users;
  const avgPeerUsers = peers.length > 0 ? peers.reduce((s, p) => s + p.users, 0) / peers.length : 1;
  const userAdvantage = avgPeerUsers > 0 ? userScale / avgPeerUsers : 1;
  const growth = Number(startup.growth_rate);

  let strength = 0;
  const evidence: string[] = [];
  const threats: string[] = [];

  if (userAdvantage > 3) { strength += 40; evidence.push(`${userAdvantage.toFixed(1)}x more users than category average`); }
  else if (userAdvantage > 1.5) { strength += 20; evidence.push(`${userAdvantage.toFixed(1)}x more users than average peer`); }

  if (growth > 20 && userScale > 10000) { strength += 30; evidence.push('High growth with large base — network effect flywheel spinning'); }
  if (['DeFi', 'Social', 'NFT'].includes(startup.category)) { strength += 15; evidence.push(`${startup.category} has inherent network dynamics`); }

  if (strength < 30) threats.push('User base may not be large enough for meaningful network effects');
  threats.push('A competitor with better UX could attract users despite network effects');

  return {
    type: 'network_effects', name: 'Network Effects', icon: '🌐',
    strength: Math.min(100, strength),
    durability: strength > 70 ? 'fortress' : strength > 40 ? 'strong' : strength > 20 ? 'moderate' : 'fragile',
    evidence, threats,
    replicationTime: Math.round(12 + userScale / 5000),
  };
}

function assessSwitchingCosts(startup: DbStartup, metrics: DbMetricsHistory[]): MoatAssessment {
  let strength = 0;
  const evidence: string[] = [];
  const threats: string[] = [];

  // Data lock-in (more data = harder to leave)
  if (metrics.length >= 6) { strength += 25; evidence.push(`${metrics.length} months of historical data creates lock-in`); }
  // Integration depth
  if (startup.verified) { strength += 20; evidence.push('On-chain verification creates integration dependency'); }
  // Category-specific switching costs
  if (['Infrastructure', 'SaaS', 'Identity'].includes(startup.category)) { strength += 20; evidence.push(`${startup.category} typically has high switching costs`); }
  // Trust/reputation built
  if (startup.trust_score > 70) { strength += 15; evidence.push(`Trust score of ${startup.trust_score} took time to build — hard to replicate`); }

  threats.push('Open-source alternatives could reduce switching costs');
  if (startup.category === 'DeFi') threats.push('DeFi composability means users can switch with one transaction');

  return {
    type: 'switching_costs', name: 'Switching Costs', icon: '🔗',
    strength: Math.min(100, strength),
    durability: strength > 60 ? 'strong' : strength > 30 ? 'moderate' : 'fragile',
    evidence, threats,
    replicationTime: Math.round(6 + metrics.length * 2),
  };
}

function assessTrustMoat(startup: DbStartup): MoatAssessment {
  let strength = 0;
  const evidence: string[] = [];

  if (startup.verified) { strength += 35; evidence.push('On-chain verified metrics — highest data integrity'); }
  if (startup.trust_score >= 85) { strength += 30; evidence.push(`Elite trust score of ${startup.trust_score}/100`); }
  else if (startup.trust_score >= 70) { strength += 20; evidence.push(`Strong trust score of ${startup.trust_score}/100`); }
  if (Number(startup.whale_concentration) < 15) { strength += 15; evidence.push('Excellent token distribution reinforces trust'); }
  if (startup.sustainability_score >= 80) { strength += 10; evidence.push('High ESG standards build institutional trust'); }

  return {
    type: 'trust_moat', name: 'Trust Moat', icon: '🛡️',
    strength: Math.min(100, strength),
    durability: strength > 70 ? 'fortress' : strength > 40 ? 'strong' : 'moderate',
    evidence,
    threats: ['Trust can be lost with a single incident', 'New entrants with strong verification can compete'],
    replicationTime: Math.round(12 + startup.trust_score / 5),
  };
}

function assessDataMoat(startup: DbStartup, metrics: DbMetricsHistory[]): MoatAssessment {
  let strength = 0;
  const evidence: string[] = [];

  if (metrics.length >= 6) { strength += 30; evidence.push(`${metrics.length} months of proprietary data accumulation`); }
  if (startup.users > 10000) { strength += 25; evidence.push(`${startup.users.toLocaleString()} users generating proprietary data`); }
  if (['Data', 'Identity', 'Infrastructure'].includes(startup.category)) { strength += 20; evidence.push(`${startup.category} businesses naturally accumulate data moats`); }
  if (startup.verified) { strength += 10; evidence.push('On-chain data is immutable — permanent competitive asset'); }

  return {
    type: 'data_moat', name: 'Data Moat', icon: '📊',
    strength: Math.min(100, strength),
    durability: strength > 60 ? 'strong' : strength > 30 ? 'moderate' : 'fragile',
    evidence,
    threats: ['Data can become commoditized', 'Regulations may require data sharing'],
    replicationTime: Math.round(metrics.length * 3 + 6),
  };
}

function assessCostAdvantage(startup: DbStartup): MoatAssessment {
  let strength = 0;
  const evidence: string[] = [];

  const revPerEmployee = startup.team_size > 0 ? (startup.mrr * 12) / startup.team_size : 0;
  if (revPerEmployee > 200000) { strength += 35; evidence.push(`$${(revPerEmployee / 1000).toFixed(0)}K ARR/employee — exceptional efficiency`); }
  else if (revPerEmployee > 100000) { strength += 20; evidence.push(`$${(revPerEmployee / 1000).toFixed(0)}K ARR/employee — good efficiency`); }

  if (startup.energy_score >= 90) { strength += 15; evidence.push('Best-in-class energy efficiency reduces operating costs'); }
  if (startup.blockchain === 'Solana') { strength += 10; evidence.push('Solana\'s low transaction costs ($0.00025) provide structural cost advantage'); }

  return {
    type: 'cost_advantage', name: 'Cost Advantage', icon: '💰',
    strength: Math.min(100, strength),
    durability: strength > 50 ? 'strong' : 'moderate',
    evidence,
    threats: ['Cost advantages can be replicated with funding', 'Technology improvements may level the field'],
    replicationTime: 12,
  };
}

function assessProtocolLockin(startup: DbStartup): MoatAssessment {
  if (!['Infrastructure', 'DeFi', 'Identity'].includes(startup.category)) {
    return { type: 'protocol_lockin', name: 'Protocol Lock-in', icon: '⛓️', strength: 0, durability: 'fragile', evidence: ['Not a protocol-category startup'], threats: [], replicationTime: 0 };
  }

  let strength = 0;
  const evidence: string[] = [];

  if (startup.verified) { strength += 25; evidence.push('On-chain presence enables composability — other protocols depend on it'); }
  if (startup.trust_score > 70) { strength += 20; evidence.push('High trust makes it the default choice for integration'); }
  if (startup.users > 15000) { strength += 25; evidence.push(`${startup.users.toLocaleString()} users/integrations create switching friction`); }
  if (startup.governance_score > 60) { strength += 15; evidence.push('Active governance ensures protocol evolution — reduces fork risk'); }

  return {
    type: 'protocol_lockin', name: 'Protocol Lock-in', icon: '⛓️',
    strength: Math.min(100, strength),
    durability: strength > 60 ? 'fortress' : strength > 30 ? 'strong' : 'moderate',
    evidence,
    threats: ['Protocols can be forked', 'Standards may shift to new technology'],
    replicationTime: Math.round(18 + startup.users / 3000),
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate comprehensive moat depth analysis.
 */
export function analyzeMoatDepth(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): MoatReport {
  const peers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);

  const moats: MoatAssessment[] = [
    assessNetworkEffects(startup, metrics, peers),
    assessSwitchingCosts(startup, metrics),
    assessTrustMoat(startup),
    assessDataMoat(startup, metrics),
    assessCostAdvantage(startup),
    assessProtocolLockin(startup),
  ].filter(m => m.strength > 0).sort((a, b) => b.strength - a.strength);

  const overallScore = moats.length > 0
    ? Math.round(moats.reduce((s, m) => s + m.strength, 0) / moats.length)
    : 0;

  const width: MoatReport['width'] =
    overallScore >= 70 ? 'ultra_wide' :
    overallScore >= 45 ? 'wide' :
    overallScore >= 20 ? 'narrow' :
    'no_moat';

  const primaryMoat = moats.length > 0 ? moats[0] : null;

  // Buffett score (would Warren invest?)
  const buffettScore = Math.round(
    overallScore * 0.4 +
    (startup.trust_score > 70 ? 20 : 0) +
    (Number(startup.growth_rate) > 15 ? 15 : 0) +
    (startup.verified ? 15 : 0) +
    (Number(startup.whale_concentration) < 25 ? 10 : 0)
  );

  // Competitive shield
  const avgReplicationTime = moats.length > 0
    ? Math.round(moats.reduce((s, m) => s + m.replicationTime, 0) / moats.length)
    : 6;

  const recommendations: string[] = [];
  if (width === 'no_moat') recommendations.push('CRITICAL: Build at least one defensible moat before competitors catch up');
  if (!moats.some(m => m.type === 'trust_moat' && m.strength > 40)) recommendations.push('Complete on-chain verification to build a trust moat — unique to ChainTrust');
  if (!moats.some(m => m.type === 'data_moat' && m.strength > 30)) recommendations.push('Accumulate proprietary data — each month of verified metrics deepens the data moat');
  if (moats.some(m => m.durability === 'fragile')) recommendations.push('Strengthen fragile moats — they provide temporary advantage at best');
  if (recommendations.length === 0) recommendations.push('Strong moat portfolio. Focus on deepening existing advantages rather than building new ones.');

  return {
    overallScore,
    width,
    moats,
    primaryMoat,
    buffettScore,
    competitiveShield: {
      months: avgReplicationTime,
      cost: avgReplicationTime > 18 ? '$5M+' : avgReplicationTime > 12 ? '$2-5M' : '$500K-2M',
      difficulty: avgReplicationTime > 18 ? 'Very difficult' : avgReplicationTime > 12 ? 'Difficult' : 'Moderate',
    },
    recommendations,
    computedAt: Date.now(),
  };
}
