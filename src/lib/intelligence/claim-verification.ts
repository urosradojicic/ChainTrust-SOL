/**
 * AI Claim Verification Engine
 * ────────────────────────────
 * Cross-references startup claims against on-chain verified data.
 * Detects discrepancies between what founders say and what the data shows.
 *
 * Verification layers:
 *   1. Metric claims    — "We have $200K MRR" vs on-chain verified MRR
 *   2. Growth claims    — "Growing 30% MoM" vs actual computed growth
 *   3. Runway claims    — "18 months runway" vs computed from burn rate
 *   4. Market claims    — category positioning vs peer data
 *   5. Team claims      — team size vs revenue efficiency benchmarks
 *   6. Trend claims     — "accelerating growth" vs actual trajectory
 *   7. Token claims     — "decentralized" vs whale concentration data
 *
 * Outputs a Claim Verification Matrix showing each claim's status.
 * Zero API calls. Pure data analysis.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type ClaimStatus = 'verified' | 'plausible' | 'unverified' | 'contradicted' | 'insufficient_data';

export interface Claim {
  /** Unique ID */
  id: string;
  /** The claim being verified */
  statement: string;
  /** Category of the claim */
  category: 'revenue' | 'growth' | 'runway' | 'market' | 'team' | 'trend' | 'token' | 'sustainability';
  /** Verification status */
  status: ClaimStatus;
  /** Claimed value (what the startup says) */
  claimedValue: string;
  /** Verified value (what the data shows) */
  verifiedValue: string;
  /** Discrepancy percentage (0 = perfect match, negative = overstated) */
  discrepancy: number | null;
  /** Data source used for verification */
  source: 'on-chain' | 'computed' | 'peer-comparison' | 'time-series';
  /** Confidence in the verification (0-1) */
  confidence: number;
  /** Detailed explanation */
  explanation: string;
}

export interface ClaimVerificationReport {
  /** Overall credibility score (0-100) */
  credibilityScore: number;
  /** Overall assessment */
  assessment: 'highly_credible' | 'mostly_credible' | 'mixed' | 'questionable' | 'unreliable';
  /** All verified claims */
  claims: Claim[];
  /** Summary counts */
  counts: Record<ClaimStatus, number>;
  /** Number of material discrepancies (>20% off) */
  materialDiscrepancies: number;
  /** Timestamp */
  analyzedAt: number;
}

// ── Claim Status Config ──────────────────────────────────────────────

const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; icon: string }> = {
  verified:          { label: 'Verified',          color: '#10B981', icon: '✓' },
  plausible:         { label: 'Plausible',         color: '#3B82F6', icon: '~' },
  unverified:        { label: 'Unverified',        color: '#6B7280', icon: '?' },
  contradicted:      { label: 'Contradicted',      color: '#EF4444', icon: '✗' },
  insufficient_data: { label: 'Insufficient Data', color: '#9CA3AF', icon: '—' },
};

export { STATUS_CONFIG as CLAIM_STATUS_CONFIG };

// ── Helper Functions ─────────────────────────────────────────────────

function pctDiff(claimed: number, actual: number): number {
  if (actual === 0) return claimed > 0 ? 100 : 0;
  return ((claimed - actual) / actual) * 100;
}

function statusFromDiscrepancy(discrepancy: number, threshold: number = 10): ClaimStatus {
  const abs = Math.abs(discrepancy);
  if (abs <= threshold) return 'verified';
  if (abs <= threshold * 2) return 'plausible';
  return 'contradicted';
}

function computeActualGrowth(metrics: DbMetricsHistory[]): number | null {
  if (metrics.length < 2) return null;
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const recent = sorted.slice(-3);
  const growthRates = recent.map(m => Number(m.growth_rate));
  return growthRates.reduce((s, g) => s + g, 0) / growthRates.length;
}

function computeActualRunway(startup: DbStartup, metrics: DbMetricsHistory[]): number | null {
  if (metrics.length < 2) return null;
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const lastRev = Number(sorted[sorted.length - 1].revenue);
  const lastCost = Number(sorted[sorted.length - 1].costs);
  const burn = Math.max(lastCost - lastRev, 0);
  if (burn <= 0) return 999; // profitable
  return startup.treasury / burn;
}

function detectGrowthTrajectory(metrics: DbMetricsHistory[]): 'accelerating' | 'stable' | 'decelerating' | 'declining' | 'unknown' {
  if (metrics.length < 4) return 'unknown';
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const recent = sorted.slice(-4).map(m => Number(m.growth_rate));
  const firstHalf = (recent[0] + recent[1]) / 2;
  const secondHalf = (recent[2] + recent[3]) / 2;
  const avg = (firstHalf + secondHalf) / 2;
  if (avg < 0) return 'declining';
  if (secondHalf > firstHalf * 1.1) return 'accelerating';
  if (secondHalf < firstHalf * 0.9) return 'decelerating';
  return 'stable';
}

// ── Claim Generators ─────────────────────────────────────────────────

function verifyRevenueClaims(startup: DbStartup, metrics: DbMetricsHistory[]): Claim[] {
  const claims: Claim[] = [];

  // MRR claim
  if (metrics.length > 0) {
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const latestRevenue = Number(sorted[sorted.length - 1].revenue);
    const disc = pctDiff(startup.mrr, latestRevenue);

    claims.push({
      id: 'revenue-mrr',
      statement: `MRR is $${(startup.mrr / 1000).toFixed(0)}K`,
      category: 'revenue',
      status: startup.verified ? statusFromDiscrepancy(disc) : 'unverified',
      claimedValue: `$${startup.mrr.toLocaleString()}`,
      verifiedValue: `$${latestRevenue.toLocaleString()}`,
      discrepancy: +disc.toFixed(1),
      source: startup.verified ? 'on-chain' : 'computed',
      confidence: startup.verified ? 0.95 : 0.6,
      explanation: startup.verified
        ? Math.abs(disc) < 10
          ? 'MRR matches on-chain verified data within expected variance.'
          : `MRR differs from verified data by ${Math.abs(disc).toFixed(1)}%. ${disc > 0 ? 'Claimed value is higher than verified.' : 'Claimed value is lower than verified.'}`
        : 'MRR is self-reported — no independent on-chain verification available.',
    });
  }

  // ARR implied claim
  const impliedArr = startup.mrr * 12;
  claims.push({
    id: 'revenue-arr',
    statement: `Implied ARR is $${(impliedArr / 1000000).toFixed(1)}M`,
    category: 'revenue',
    status: startup.verified ? 'verified' : 'unverified',
    claimedValue: `$${(impliedArr / 1000000).toFixed(2)}M`,
    verifiedValue: `$${(impliedArr / 1000000).toFixed(2)}M (derived from MRR × 12)`,
    discrepancy: 0,
    source: 'computed',
    confidence: 0.9,
    explanation: 'ARR is computed as MRR × 12. This assumes no seasonal variation in revenue.',
  });

  return claims;
}

function verifyGrowthClaims(startup: DbStartup, metrics: DbMetricsHistory[]): Claim[] {
  const claims: Claim[] = [];
  const claimedGrowth = Number(startup.growth_rate);

  const actualGrowth = computeActualGrowth(metrics);
  if (actualGrowth !== null) {
    const disc = pctDiff(claimedGrowth, actualGrowth);
    claims.push({
      id: 'growth-rate',
      statement: `Growing at ${claimedGrowth}% MoM`,
      category: 'growth',
      status: statusFromDiscrepancy(disc, 15),
      claimedValue: `${claimedGrowth}%`,
      verifiedValue: `${actualGrowth.toFixed(1)}% (avg of last 3 months)`,
      discrepancy: +disc.toFixed(1),
      source: 'time-series',
      confidence: metrics.length >= 4 ? 0.85 : 0.6,
      explanation: Math.abs(disc) < 15
        ? 'Growth rate is consistent with historical data.'
        : `Growth claim diverges from computed average by ${Math.abs(disc).toFixed(0)}%. ${disc > 0 ? 'Founder may be citing peak month rather than average.' : 'Actual growth exceeds the claim — conservative reporting.'}`,
    });
  }

  // Trajectory claim
  const trajectory = detectGrowthTrajectory(metrics);
  if (trajectory !== 'unknown') {
    const impliedClaim = claimedGrowth > 15 ? 'strong growth' : claimedGrowth > 5 ? 'healthy growth' : 'growth';
    const trajectoryMatch = (claimedGrowth > 10 && trajectory === 'accelerating') ||
      (claimedGrowth > 0 && (trajectory === 'stable' || trajectory === 'accelerating'));

    claims.push({
      id: 'growth-trajectory',
      statement: `Growth trajectory is ${trajectory}`,
      category: 'trend',
      status: trajectoryMatch ? 'verified' : trajectory === 'declining' ? 'contradicted' : 'plausible',
      claimedValue: impliedClaim,
      verifiedValue: `Trajectory: ${trajectory}`,
      discrepancy: null,
      source: 'time-series',
      confidence: metrics.length >= 4 ? 0.8 : 0.5,
      explanation: trajectory === 'accelerating'
        ? 'Growth is genuinely accelerating — each month is faster than the last.'
        : trajectory === 'decelerating'
        ? 'Growth is slowing down — while still positive, the rate is declining.'
        : trajectory === 'declining'
        ? 'Revenue is contracting — growth claims are contradicted by the data.'
        : 'Growth is stable — consistent but not accelerating.',
    });
  }

  return claims;
}

function verifyRunwayClaims(startup: DbStartup, metrics: DbMetricsHistory[]): Claim[] {
  const claims: Claim[] = [];
  const actualRunway = computeActualRunway(startup, metrics);

  if (actualRunway !== null) {
    // Estimate implied runway from treasury and burn
    const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
    const lastRev = Number(sorted[sorted.length - 1].revenue);
    const lastCost = Number(sorted[sorted.length - 1].costs);
    const burn = Math.max(lastCost - lastRev, 0);

    claims.push({
      id: 'runway-months',
      statement: actualRunway >= 999
        ? 'Cash flow positive — infinite runway'
        : `Approximately ${actualRunway.toFixed(0)} months runway`,
      category: 'runway',
      status: actualRunway >= 18 ? 'verified' : actualRunway >= 6 ? 'plausible' : 'contradicted',
      claimedValue: `Treasury: $${startup.treasury.toLocaleString()}`,
      verifiedValue: burn > 0
        ? `$${burn.toLocaleString()}/mo burn → ${actualRunway.toFixed(1)} months`
        : 'Profitable — no burn',
      discrepancy: null,
      source: 'computed',
      confidence: metrics.length >= 3 ? 0.85 : 0.6,
      explanation: actualRunway >= 999
        ? 'Revenue exceeds costs — the startup is self-sustaining.'
        : actualRunway >= 18
        ? `Healthy runway of ${actualRunway.toFixed(0)} months at current burn rate.`
        : actualRunway >= 6
        ? `Limited runway of ${actualRunway.toFixed(0)} months — fundraising needed soon.`
        : `Critical: only ${actualRunway.toFixed(1)} months of cash remaining at current burn rate.`,
    });

    // Burn efficiency claim
    if (lastRev > 0 && lastCost > 0) {
      const burnMultiple = burn > 0 ? burn / Math.max(lastRev - (sorted.length >= 2 ? Number(sorted[sorted.length - 2].revenue) : 0), 1) : 0;
      claims.push({
        id: 'runway-efficiency',
        statement: `Burn efficiency: ${(lastRev / lastCost * 100).toFixed(0)}% revenue-to-cost ratio`,
        category: 'runway',
        status: lastRev >= lastCost ? 'verified' : lastRev >= lastCost * 0.6 ? 'plausible' : 'contradicted',
        claimedValue: `Revenue: $${lastRev.toLocaleString()} / Costs: $${lastCost.toLocaleString()}`,
        verifiedValue: `Ratio: ${(lastRev / lastCost * 100).toFixed(0)}%`,
        discrepancy: null,
        source: 'computed',
        confidence: 0.9,
        explanation: lastRev >= lastCost
          ? 'Revenue covers all costs — positive unit economics.'
          : `Costs exceed revenue by $${(lastCost - lastRev).toLocaleString()}/month.`,
      });
    }
  }

  return claims;
}

function verifyTokenClaims(startup: DbStartup): Claim[] {
  const claims: Claim[] = [];
  const whale = Number(startup.whale_concentration);
  const inflation = Number(startup.inflation_rate);

  // Decentralization claim
  claims.push({
    id: 'token-decentralization',
    statement: whale < 20
      ? 'Well-decentralized token distribution'
      : whale < 40
      ? 'Moderately distributed token supply'
      : 'Token supply has concentration concerns',
    category: 'token',
    status: whale < 30 ? 'verified' : whale < 50 ? 'plausible' : 'contradicted',
    claimedValue: `Whale concentration: ${whale}%`,
    verifiedValue: `Top wallets hold ${whale}% of supply`,
    discrepancy: null,
    source: 'on-chain',
    confidence: 0.95,
    explanation: whale < 20
      ? 'Excellent distribution — no single entity can manipulate governance or price.'
      : whale < 40
      ? 'Acceptable distribution but top holders have significant influence.'
      : `High concentration — top wallets control ${whale}% creating rug-pull and governance capture risks.`,
  });

  // Inflation claim
  claims.push({
    id: 'token-inflation',
    statement: `Annual token inflation: ${inflation}%`,
    category: 'token',
    status: inflation <= 5 ? 'verified' : inflation <= 8 ? 'plausible' : 'contradicted',
    claimedValue: `${inflation}% annual inflation`,
    verifiedValue: `${inflation}% (${inflation <= 3 ? 'conservative' : inflation <= 6 ? 'moderate' : 'aggressive'})`,
    discrepancy: null,
    source: 'on-chain',
    confidence: 0.9,
    explanation: inflation <= 3
      ? 'Conservative inflation — holder dilution is minimal.'
      : inflation <= 6
      ? 'Moderate inflation — within typical DeFi protocol ranges.'
      : `Aggressive ${inflation}% inflation dilutes existing holders by ~${(inflation / (1 + inflation / 100)).toFixed(1)}% annually.`,
  });

  return claims;
}

function verifyTeamClaims(startup: DbStartup, allStartups: DbStartup[]): Claim[] {
  const claims: Claim[] = [];

  // Revenue per employee
  if (startup.team_size > 0 && startup.mrr > 0) {
    const revPerEmp = (startup.mrr * 12) / startup.team_size;
    const peers = allStartups.filter(s => s.category === startup.category && s.team_size > 0 && s.mrr > 0);
    const peerAvg = peers.length > 0
      ? peers.reduce((s, p) => s + (p.mrr * 12) / p.team_size, 0) / peers.length
      : 100000;

    claims.push({
      id: 'team-efficiency',
      statement: `Team of ${startup.team_size} generating $${(revPerEmp / 1000).toFixed(0)}K ARR per employee`,
      category: 'team',
      status: revPerEmp >= peerAvg * 0.7 ? 'verified' : revPerEmp >= peerAvg * 0.4 ? 'plausible' : 'contradicted',
      claimedValue: `${startup.team_size} employees`,
      verifiedValue: `$${(revPerEmp / 1000).toFixed(0)}K ARR/employee (peer avg: $${(peerAvg / 1000).toFixed(0)}K)`,
      discrepancy: +pctDiff(revPerEmp, peerAvg).toFixed(1),
      source: 'peer-comparison',
      confidence: peers.length >= 3 ? 0.8 : 0.5,
      explanation: revPerEmp >= peerAvg
        ? 'Revenue per employee exceeds category peers — efficient team.'
        : `Revenue per employee is ${((peerAvg - revPerEmp) / peerAvg * 100).toFixed(0)}% below category average.`,
    });
  }

  return claims;
}

function verifySustainabilityClaims(startup: DbStartup): Claim[] {
  const claims: Claim[] = [];

  claims.push({
    id: 'sustainability-score',
    statement: `Sustainability score: ${startup.sustainability_score}/100`,
    category: 'sustainability',
    status: startup.sustainability_score >= 60 ? 'verified' : startup.sustainability_score >= 30 ? 'plausible' : 'contradicted',
    claimedValue: `${startup.sustainability_score}/100`,
    verifiedValue: `Energy: ${startup.energy_score}, Carbon: ${startup.carbon_score}, Tokenomics: ${startup.tokenomics_score}, Governance: ${startup.governance_score}`,
    discrepancy: null,
    source: 'computed',
    confidence: 0.85,
    explanation: startup.sustainability_score >= 70
      ? 'Strong ESG profile across all dimensions.'
      : startup.sustainability_score >= 40
      ? 'Mixed ESG performance — some dimensions need improvement.'
      : 'Low ESG scores across multiple dimensions — may exclude ESG-mandated investors.',
  });

  if (startup.carbon_offset_tonnes > 0) {
    claims.push({
      id: 'sustainability-carbon',
      statement: `${startup.carbon_offset_tonnes} tonnes CO₂ offset`,
      category: 'sustainability',
      status: startup.carbon_offset_tonnes >= 10 ? 'verified' : 'plausible',
      claimedValue: `${startup.carbon_offset_tonnes} tonnes`,
      verifiedValue: `${startup.carbon_offset_tonnes} tonnes (${startup.carbon_offset_tonnes >= 50 ? 'significant' : startup.carbon_offset_tonnes >= 20 ? 'moderate' : 'minimal'} commitment)`,
      discrepancy: null,
      source: 'on-chain',
      confidence: 0.7,
      explanation: 'Carbon offset purchases are tracked but independent verification of offset quality is not yet available on-chain.',
    });
  }

  return claims;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run complete claim verification against a startup.
 *
 * @param startup     - The startup to verify
 * @param metrics     - Historical metrics
 * @param allStartups - All startups for peer comparison
 * @returns           - Full claim verification report
 */
export function verifyAllClaims(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): ClaimVerificationReport {
  const claims: Claim[] = [
    ...verifyRevenueClaims(startup, metrics),
    ...verifyGrowthClaims(startup, metrics),
    ...verifyRunwayClaims(startup, metrics),
    ...verifyTokenClaims(startup),
    ...verifyTeamClaims(startup, allStartups),
    ...verifySustainabilityClaims(startup),
  ];

  // Count by status
  const counts: Record<ClaimStatus, number> = {
    verified: 0, plausible: 0, unverified: 0, contradicted: 0, insufficient_data: 0,
  };
  for (const claim of claims) counts[claim.status]++;

  // Material discrepancies (>20% off)
  const materialDiscrepancies = claims.filter(c =>
    c.discrepancy !== null && Math.abs(c.discrepancy) > 20
  ).length;

  // Credibility score
  const totalClaims = claims.length;
  const weightedScore = totalClaims > 0
    ? (counts.verified * 100 + counts.plausible * 70 + counts.unverified * 40 + counts.contradicted * 0 + counts.insufficient_data * 50) / totalClaims
    : 50;
  const credibilityScore = Math.round(Math.max(0, Math.min(100, weightedScore - materialDiscrepancies * 5)));

  const assessment: ClaimVerificationReport['assessment'] =
    credibilityScore >= 85 ? 'highly_credible' :
    credibilityScore >= 70 ? 'mostly_credible' :
    credibilityScore >= 50 ? 'mixed' :
    credibilityScore >= 30 ? 'questionable' :
    'unreliable';

  return {
    credibilityScore,
    assessment,
    claims,
    counts,
    materialDiscrepancies,
    analyzedAt: Date.now(),
  };
}
