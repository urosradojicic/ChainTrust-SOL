/**
 * Network Effects Analyzer
 * ────────────────────────
 * Identifies and quantifies network effects in startups.
 * Network effects are the most powerful moat in technology.
 *
 * Types analyzed:
 *   1. Direct (same-side)    — more users → more value for each user
 *   2. Indirect (cross-side) — more users → more supply/content → more users
 *   3. Data                  — more usage → better product → more users
 *   4. Platform/marketplace  — more buyers ↔ more sellers
 *   5. Protocol              — more builders → more integrations → more users
 *
 * Outputs: network effect type, strength, growth multiplier, viral coefficient
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type NetworkEffectType = 'direct' | 'indirect' | 'data' | 'platform' | 'protocol' | 'none';

export interface NetworkEffectAnalysis {
  /** Primary network effect type */
  primaryType: NetworkEffectType;
  /** All detected network effects */
  effects: DetectedEffect[];
  /** Overall network effect strength (0-100) */
  strength: number;
  /** Estimated viral coefficient (K-factor) */
  viralCoefficient: number;
  /** User growth elasticity (1% more users → X% more value) */
  growthElasticity: number;
  /** Defensibility score based on network effects (0-100) */
  defensibility: number;
  /** Network maturity phase */
  phase: 'pre_critical_mass' | 'approaching_critical_mass' | 'critical_mass_achieved' | 'mature_network';
  /** What needs to happen to strengthen network effects */
  recommendations: string[];
  /** Computed at */
  computedAt: number;
}

export interface DetectedEffect {
  type: NetworkEffectType;
  name: string;
  strength: number; // 0-100
  evidence: string[];
  /** How this effect manifests in the data */
  mechanism: string;
  /** Growth multiplier from this effect */
  multiplier: number;
}

// ── Analysis ─────────────────────────────────────────────────────────

function analyzeDirectEffects(startup: DbStartup, metrics: DbMetricsHistory[]): DetectedEffect | null {
  // Direct network effects: user growth accelerates as user base grows
  // Signal: MoM growth rate increases with user count
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 4) return null;

  const userGrowthRates = sorted.slice(1).map((m, i) => {
    const prev = Number(sorted[i].mau);
    return prev > 0 ? (Number(m.mau) - prev) / prev * 100 : 0;
  });

  // Check if growth accelerates with size
  const firstHalf = userGrowthRates.slice(0, Math.floor(userGrowthRates.length / 2));
  const secondHalf = userGrowthRates.slice(Math.floor(userGrowthRates.length / 2));
  const firstAvg = firstHalf.reduce((s, g) => s + g, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, g) => s + g, 0) / secondHalf.length;

  if (secondAvg <= firstAvg * 0.9) return null; // Growth not accelerating

  const acceleration = secondAvg / Math.max(firstAvg, 0.1);
  const strength = Math.min(100, Math.round(acceleration * 30));

  return {
    type: 'direct',
    name: 'Direct Network Effect',
    strength,
    evidence: [
      `User growth accelerating: ${firstAvg.toFixed(1)}% → ${secondAvg.toFixed(1)}% MoM`,
      `${startup.users.toLocaleString()} current users`,
      `Growth acceleration factor: ${acceleration.toFixed(2)}x`,
    ],
    mechanism: 'More users make the platform more valuable for each existing user, creating a self-reinforcing growth loop.',
    multiplier: 1 + acceleration * 0.1,
  };
}

function analyzeDataEffects(startup: DbStartup, metrics: DbMetricsHistory[]): DetectedEffect | null {
  // Data network effects: more usage → better product → more users
  // Signal: revenue per user increases over time (product gets better)
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 3) return null;

  const rpus = sorted.map(m => {
    const mau = Number(m.mau);
    return mau > 0 ? Number(m.revenue) / mau : 0;
  }).filter(r => r > 0);

  if (rpus.length < 3) return null;

  const firstRPU = rpus[0];
  const lastRPU = rpus[rpus.length - 1];
  const rpuGrowth = firstRPU > 0 ? ((lastRPU - firstRPU) / firstRPU) * 100 : 0;

  if (rpuGrowth <= 5) return null; // Not growing meaningfully

  const strength = Math.min(100, Math.round(rpuGrowth * 2));

  return {
    type: 'data',
    name: 'Data Network Effect',
    strength,
    evidence: [
      `Revenue per user grew ${rpuGrowth.toFixed(1)}% over ${rpus.length} months`,
      `Current ARPU: $${lastRPU.toFixed(2)}`,
      'Product value increases with usage data accumulation',
    ],
    mechanism: 'More users generate more data, which improves the product (algorithms, recommendations, matching), attracting even more users.',
    multiplier: 1 + rpuGrowth / 100 * 0.5,
  };
}

function analyzeProtocolEffects(startup: DbStartup): DetectedEffect | null {
  // Protocol network effects: more builders → more integrations → more users
  // Signal: Infrastructure or DeFi category + high trust + verified
  const isProtocol = ['Infrastructure', 'DeFi', 'Identity', 'Data'].includes(startup.category);
  if (!isProtocol) return null;

  const strength = Math.min(100, Math.round(
    (startup.verified ? 25 : 0) +
    (startup.trust_score > 70 ? 20 : startup.trust_score > 50 ? 10 : 0) +
    (startup.users > 10000 ? 25 : startup.users > 1000 ? 15 : 5) +
    (Number(startup.whale_concentration) < 25 ? 15 : 5) +
    (startup.governance_score > 60 ? 15 : 5)
  ));

  if (strength < 30) return null;

  return {
    type: 'protocol',
    name: 'Protocol Network Effect',
    strength,
    evidence: [
      `${startup.category} category — inherently protocol-like`,
      `${startup.users.toLocaleString()} users/integrators`,
      startup.verified ? 'On-chain verified — composable by other protocols' : 'Not yet verified — limits composability',
    ],
    mechanism: 'More developers and protocols build on this platform, increasing its utility and attracting more builders and users.',
    multiplier: 1 + strength / 100 * 0.3,
  };
}

function analyzePlatformEffects(startup: DbStartup): DetectedEffect | null {
  // Platform/marketplace effects: more supply ↔ more demand
  const isPlatform = ['NFT', 'DeFi', 'Social', 'Data'].includes(startup.category);
  if (!isPlatform) return null;

  const strength = Math.min(100, Math.round(
    (startup.users > 20000 ? 35 : startup.users > 5000 ? 20 : 5) +
    (Number(startup.growth_rate) > 20 ? 25 : Number(startup.growth_rate) > 10 ? 15 : 5) +
    (startup.mrr > 100000 ? 25 : startup.mrr > 30000 ? 15 : 5) +
    (startup.trust_score > 70 ? 15 : 5)
  ));

  if (strength < 25) return null;

  return {
    type: 'platform',
    name: 'Platform Network Effect',
    strength,
    evidence: [
      `${startup.category} marketplace dynamics`,
      `${startup.users.toLocaleString()} participants`,
      `$${(startup.mrr / 1000).toFixed(0)}K MRR suggests active marketplace`,
    ],
    mechanism: 'More buyers attract more sellers, and vice versa. Each new participant increases value for all others.',
    multiplier: 1 + strength / 100 * 0.4,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Analyze network effects for a startup.
 */
export function analyzeNetworkEffects(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): NetworkEffectAnalysis {
  const effects: DetectedEffect[] = [];

  const direct = analyzeDirectEffects(startup, metrics);
  const data = analyzeDataEffects(startup, metrics);
  const protocol = analyzeProtocolEffects(startup);
  const platform = analyzePlatformEffects(startup);

  if (direct) effects.push(direct);
  if (data) effects.push(data);
  if (protocol) effects.push(protocol);
  if (platform) effects.push(platform);

  effects.sort((a, b) => b.strength - a.strength);

  const primaryType = effects.length > 0 ? effects[0].type : 'none';
  const strength = effects.length > 0
    ? Math.round(effects.reduce((s, e) => s + e.strength, 0) / effects.length)
    : 0;

  // Viral coefficient estimate
  const growth = Number(startup.growth_rate);
  const viralCoefficient = growth > 30 ? 1.5 : growth > 15 ? 1.1 : growth > 5 ? 0.7 : 0.3;

  // Growth elasticity
  const growthElasticity = effects.length > 0
    ? effects.reduce((s, e) => s + (e.multiplier - 1), 0) / effects.length
    : 0;

  // Defensibility
  const defensibility = Math.min(100, strength * 0.7 + (startup.verified ? 15 : 0) + (startup.trust_score > 70 ? 15 : 0));

  // Network maturity phase
  const phase: NetworkEffectAnalysis['phase'] =
    startup.users > 50000 && effects.some(e => e.strength > 60) ? 'critical_mass_achieved' :
    startup.users > 10000 && effects.length > 0 ? 'approaching_critical_mass' :
    effects.length > 0 ? 'pre_critical_mass' :
    'pre_critical_mass';

  // Recommendations
  const recommendations: string[] = [];
  if (effects.length === 0) {
    recommendations.push('No strong network effects detected — focus on building features that create user-to-user value');
    recommendations.push('Consider adding social features, composability, or marketplace dynamics');
  } else {
    if (phase === 'pre_critical_mass') recommendations.push('Focus all resources on reaching critical mass — network effects don\'t kick in until then');
    if (!effects.some(e => e.type === 'data')) recommendations.push('Build data flywheel — use accumulated user data to improve the product');
    if (startup.category === 'Infrastructure' && !effects.some(e => e.type === 'protocol')) recommendations.push('Open APIs and SDKs to enable protocol-level network effects');
  }

  return {
    primaryType,
    effects,
    strength,
    viralCoefficient: +viralCoefficient.toFixed(2),
    growthElasticity: +growthElasticity.toFixed(3),
    defensibility: Math.round(defensibility),
    phase,
    recommendations,
    computedAt: Date.now(),
  };
}
