/**
 * Startup DNA Fingerprint
 * ───────────────────────
 * Creates a unique multi-dimensional "fingerprint" for each startup.
 * Like genetic profiling but for companies — identifies what makes
 * each startup fundamentally unique or similar to others.
 *
 * The fingerprint enables:
 *   - "Find startups similar to X" (nearest neighbor search)
 *   - "What archetype is this startup?" (cluster classification)
 *   - "Has this pattern succeeded before?" (historical matching)
 *   - "Where does this fit in the ecosystem?" (positioning map)
 *
 * Uses 16-dimensional feature vector normalized to [0,1].
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface DNADimension {
  name: string;
  value: number; // 0-1 normalized
  rawValue: number;
  percentile: number; // Among all startups
  description: string;
}

export interface StartupArchetype {
  name: string;
  description: string;
  icon: string;
  /** How well this startup matches the archetype (0-1) */
  match: number;
  /** Famous examples of this archetype */
  examples: string[];
  /** What investors should know about this archetype */
  investorImplication: string;
}

export interface SimilarStartup {
  id: string;
  name: string;
  category: string;
  /** Cosine similarity (0-1) */
  similarity: number;
  /** Which dimensions are most similar */
  sharedTraits: string[];
  /** Key differences */
  keyDifferences: string[];
}

export interface DNAFingerprint {
  /** The 16-dimensional vector */
  dimensions: DNADimension[];
  /** Detected archetype */
  archetype: StartupArchetype;
  /** Alternative archetypes */
  alternateArchetypes: StartupArchetype[];
  /** Most similar startups */
  similarStartups: SimilarStartup[];
  /** Uniqueness score (0-100, how distinctive this startup is) */
  uniquenessScore: number;
  /** Radar chart data (for visualization) */
  radarData: { axis: string; value: number }[];
  /** One-sentence identity summary */
  identitySummary: string;
  /** Computed at */
  computedAt: number;
}

// ── Archetypes ───────────────────────────────────────────────────────

const ARCHETYPES: Omit<StartupArchetype, 'match'>[] = [
  {
    name: 'Rocket Ship',
    description: 'Hyper-growth with strong fundamentals. Everything is accelerating.',
    icon: '🚀',
    examples: ['Solana (early days)', 'Uniswap', 'Jupiter'],
    investorImplication: 'Deploy fast — these windows close quickly. Focus on team capacity to manage hypergrowth.',
  },
  {
    name: 'Fortress Builder',
    description: 'Steady growth with deep moats. Prioritizes defensibility over speed.',
    icon: '🏰',
    examples: ['Chainlink', 'Maker', 'Aave'],
    investorImplication: 'Long-term hold. Lower growth but higher probability of enduring value. Patient capital.',
  },
  {
    name: 'Community Engine',
    description: 'Growth driven by community and network effects. Users are the product.',
    icon: '🌐',
    examples: ['Discord', 'Lens Protocol', 'Farcaster'],
    investorImplication: 'Watch engagement metrics closely. Community-driven growth can be explosive but fragile.',
  },
  {
    name: 'Capital Efficient Machine',
    description: 'Does more with less. High revenue per dollar invested, lean operations.',
    icon: '⚡',
    examples: ['Basecamp', 'Lemlist', 'Cal.com'],
    investorImplication: 'These rarely need large rounds. Good for angels and seed investors.',
  },
  {
    name: 'Trust Pioneer',
    description: 'Leads on transparency and verification. Others follow their compliance standard.',
    icon: '🛡️',
    examples: ['Coinbase (regulatory)', 'Circle', 'Fireblocks'],
    investorImplication: 'Premium valuation justified by trust moat. Institutional investors love these.',
  },
  {
    name: 'Sustainability Champion',
    description: 'Built with ESG at the core. Attracts impact capital and conscious users.',
    icon: '🌱',
    examples: ['Toucan Protocol', 'KlimaDAO', 'Regen Network'],
    investorImplication: 'Access to ESG-mandated capital. Growing market segment. May sacrifice speed for values.',
  },
  {
    name: 'Early Explorer',
    description: 'Pre-PMF. Searching for product-market fit with high potential but high risk.',
    icon: '🧭',
    examples: ['Every startup before their breakout moment'],
    investorImplication: 'High risk, high reward. Bet on the team, not the metrics. Small checks.',
  },
  {
    name: 'Infrastructure Backbone',
    description: 'Critical infrastructure that others build on. Low visibility, high stickiness.',
    icon: '🏗️',
    examples: ['Helius', 'Jito', 'Pyth Network'],
    investorImplication: 'Sticky once adopted. Revenue grows with ecosystem. Long payback but durable.',
  },
];

// ── Feature Extraction ───────────────────────────────────────────────

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function extractDNA(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[]): DNADimension[] {
  // Compute global min/max for normalization
  const allMrr = allStartups.map(s => s.mrr);
  const allGrowth = allStartups.map(s => Number(s.growth_rate));
  const allTrust = allStartups.map(s => s.trust_score);
  const allUsers = allStartups.map(s => s.users);
  const allTeam = allStartups.map(s => s.team_size);
  const allTreasury = allStartups.map(s => s.treasury);
  const allSus = allStartups.map(s => s.sustainability_score);
  const allWhale = allStartups.map(s => Number(s.whale_concentration));
  const allInflation = allStartups.map(s => Number(s.inflation_rate));

  const growth = Number(startup.growth_rate);
  const whale = Number(startup.whale_concentration);
  const inflation = Number(startup.inflation_rate);
  const revPerEmployee = startup.team_size > 0 ? (startup.mrr * 12) / startup.team_size : 0;
  const allRevPerEmp = allStartups.filter(s => s.team_size > 0).map(s => (s.mrr * 12) / s.team_size);

  // Growth consistency
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const growthRates = sorted.map(m => Number(m.growth_rate));
  const growthConsistency = growthRates.length >= 3
    ? 1 - Math.min(1, (Math.sqrt(growthRates.reduce((s, g) => s + (g - growth) ** 2, 0) / growthRates.length) / Math.max(Math.abs(growth), 1)))
    : 0.5;

  // Data completeness
  const dataCompleteness = Math.min(1, metrics.length / 6);

  const pctRank = (value: number, all: number[], higherBetter: boolean = true) => {
    const rank = all.filter(v => higherBetter ? v < value : v > value).length;
    return Math.round((rank / Math.max(all.length - 1, 1)) * 100);
  };

  return [
    { name: 'Revenue Scale', value: normalize(startup.mrr, 0, Math.max(...allMrr)), rawValue: startup.mrr, percentile: pctRank(startup.mrr, allMrr), description: `$${(startup.mrr / 1000).toFixed(0)}K MRR` },
    { name: 'Growth Velocity', value: normalize(growth, Math.min(...allGrowth), Math.max(...allGrowth)), rawValue: growth, percentile: pctRank(growth, allGrowth), description: `${growth}% MoM` },
    { name: 'Trust Level', value: startup.trust_score / 100, rawValue: startup.trust_score, percentile: pctRank(startup.trust_score, allTrust), description: `${startup.trust_score}/100` },
    { name: 'User Base', value: normalize(startup.users, 0, Math.max(...allUsers)), rawValue: startup.users, percentile: pctRank(startup.users, allUsers), description: startup.users.toLocaleString() },
    { name: 'Team Scale', value: normalize(startup.team_size, 0, Math.max(...allTeam)), rawValue: startup.team_size, percentile: pctRank(startup.team_size, allTeam), description: `${startup.team_size} people` },
    { name: 'Treasury Depth', value: normalize(startup.treasury, 0, Math.max(...allTreasury)), rawValue: startup.treasury, percentile: pctRank(startup.treasury, allTreasury), description: `$${(startup.treasury / 1000000).toFixed(1)}M` },
    { name: 'ESG Score', value: startup.sustainability_score / 100, rawValue: startup.sustainability_score, percentile: pctRank(startup.sustainability_score, allSus), description: `${startup.sustainability_score}/100` },
    { name: 'Decentralization', value: 1 - whale / 100, rawValue: 100 - whale, percentile: pctRank(whale, allWhale, false), description: `${(100 - whale).toFixed(0)}% distributed` },
    { name: 'Inflation Control', value: 1 - normalize(inflation, 0, 15), rawValue: inflation, percentile: pctRank(inflation, allInflation, false), description: `${inflation}% annual` },
    { name: 'Verification', value: startup.verified ? 1 : 0, rawValue: startup.verified ? 100 : 0, percentile: startup.verified ? 75 : 25, description: startup.verified ? 'On-chain verified' : 'Self-reported' },
    { name: 'Growth Consistency', value: growthConsistency, rawValue: +(growthConsistency * 100).toFixed(0), percentile: 50, description: `${(growthConsistency * 100).toFixed(0)}% consistent` },
    { name: 'Capital Efficiency', value: normalize(revPerEmployee, 0, Math.max(...allRevPerEmp, 1)), rawValue: revPerEmployee, percentile: pctRank(revPerEmployee, allRevPerEmp), description: `$${(revPerEmployee / 1000).toFixed(0)}K ARR/head` },
    { name: 'Data Maturity', value: dataCompleteness, rawValue: metrics.length, percentile: 50, description: `${metrics.length} months of data` },
    { name: 'Governance', value: startup.governance_score / 100, rawValue: startup.governance_score, percentile: 50, description: `${startup.governance_score}/100` },
    { name: 'Energy Efficiency', value: startup.energy_score / 100, rawValue: startup.energy_score, percentile: 50, description: `${startup.energy_score}/100` },
    { name: 'Carbon Commitment', value: normalize(startup.carbon_offset_tonnes, 0, 150), rawValue: startup.carbon_offset_tonnes, percentile: 50, description: `${startup.carbon_offset_tonnes} tonnes` },
  ];
}

// ── Archetype Classification ─────────────────────────────────────────

function classifyArchetype(dims: DNADimension[]): { primary: StartupArchetype; alternates: StartupArchetype[] } {
  const get = (name: string) => dims.find(d => d.name === name)?.value ?? 0.5;

  const scores: { archetype: typeof ARCHETYPES[number]; score: number }[] = ARCHETYPES.map(arch => {
    let score = 0;
    switch (arch.name) {
      case 'Rocket Ship':
        score = get('Growth Velocity') * 3 + get('Revenue Scale') * 2 + get('Trust Level') * 1;
        break;
      case 'Fortress Builder':
        score = get('Trust Level') * 2 + get('Decentralization') * 2 + get('Growth Consistency') * 2 + get('Governance') * 1;
        break;
      case 'Community Engine':
        score = get('User Base') * 3 + get('Decentralization') * 2 + get('Growth Velocity') * 1;
        break;
      case 'Capital Efficient Machine':
        score = get('Capital Efficiency') * 3 + get('Revenue Scale') * 1 + get('Inflation Control') * 1;
        break;
      case 'Trust Pioneer':
        score = get('Trust Level') * 3 + get('Verification') * 3 + get('Governance') * 1;
        break;
      case 'Sustainability Champion':
        score = get('ESG Score') * 3 + get('Energy Efficiency') * 2 + get('Carbon Commitment') * 2;
        break;
      case 'Early Explorer':
        score = (1 - get('Revenue Scale')) * 2 + (1 - get('Data Maturity')) * 2 + get('Growth Velocity') * 1;
        break;
      case 'Infrastructure Backbone':
        score = get('Trust Level') * 2 + get('Growth Consistency') * 2 + get('Decentralization') * 1 + get('Treasury Depth') * 1;
        break;
    }
    return { archetype: arch, score };
  });

  scores.sort((a, b) => b.score - a.score);
  const maxScore = scores[0]?.score ?? 1;

  const primary: StartupArchetype = { ...scores[0].archetype, match: Math.min(1, scores[0].score / maxScore) };
  const alternates: StartupArchetype[] = scores.slice(1, 3).map(s => ({
    ...s.archetype,
    match: Math.min(1, s.score / maxScore),
  }));

  return { primary, alternates };
}

// ── Similarity Search ────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

function findSimilar(
  target: DNADimension[],
  targetId: string,
  allStartups: DbStartup[],
  allDNA: Map<string, DNADimension[]>,
  limit: number = 5,
): SimilarStartup[] {
  const targetVector = target.map(d => d.value);

  return allStartups
    .filter(s => s.id !== targetId)
    .map(s => {
      const dna = allDNA.get(s.id);
      if (!dna) return null;
      const vector = dna.map(d => d.value);
      const similarity = cosineSimilarity(targetVector, vector);

      // Find shared traits (dimensions where both are high)
      const sharedTraits = target
        .filter((d, i) => d.value > 0.6 && dna[i].value > 0.6)
        .map(d => d.name)
        .slice(0, 3);

      // Find key differences (largest gaps)
      const diffs = target
        .map((d, i) => ({ name: d.name, gap: Math.abs(d.value - dna[i].value) }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 2)
        .map(d => d.name);

      return { id: s.id, name: s.name, category: s.category, similarity: +similarity.toFixed(3), sharedTraits, keyDifferences: diffs };
    })
    .filter((s): s is SimilarStartup => s !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate the DNA fingerprint for a startup.
 */
export function generateDNAFingerprint(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
  allMetrics: Map<string, DbMetricsHistory[]>,
): DNAFingerprint {
  const dimensions = extractDNA(startup, metrics, allStartups);
  const { primary, alternates } = classifyArchetype(dimensions);

  // Compute all DNA for similarity search
  const allDNA = new Map<string, DNADimension[]>();
  for (const s of allStartups) {
    allDNA.set(s.id, extractDNA(s, allMetrics.get(s.id) ?? [], allStartups));
  }

  const similarStartups = findSimilar(dimensions, startup.id, allStartups, allDNA);

  // Uniqueness score (inverse of avg similarity to nearest neighbors)
  const avgSimilarity = similarStartups.length > 0
    ? similarStartups.slice(0, 3).reduce((s, n) => s + n.similarity, 0) / Math.min(3, similarStartups.length)
    : 0.5;
  const uniquenessScore = Math.round((1 - avgSimilarity) * 100);

  // Radar chart data (top 8 dimensions)
  const radarData = dimensions
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map(d => ({ axis: d.name, value: +(d.value * 100).toFixed(0) }));

  // Identity summary
  const topTraits = dimensions.filter(d => d.percentile >= 75).slice(0, 2).map(d => d.name.toLowerCase());
  const identitySummary = topTraits.length >= 2
    ? `${startup.name} is a ${primary.name} defined by exceptional ${topTraits[0]} and ${topTraits[1]}.`
    : `${startup.name} is a ${primary.name} — ${primary.description.toLowerCase()}`;

  return {
    dimensions,
    archetype: primary,
    alternateArchetypes: alternates,
    similarStartups,
    uniquenessScore,
    radarData,
    identitySummary,
    computedAt: Date.now(),
  };
}
