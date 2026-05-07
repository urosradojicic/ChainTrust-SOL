/**
 * Milestone Escrow Engine
 * ───────────────────────
 * Programmable money: investment funds sit in escrow and auto-release
 * when on-chain verified metrics cross predefined thresholds.
 *
 * This is the KILLER APPLICATION for ChainTrust — investment terms
 * that enforce themselves via oracle-verified data.
 *
 * Architecture:
 *   1. Investor deposits funds into escrow smart contract
 *   2. Milestones are defined with metric thresholds
 *   3. When MetricsAccount is updated + oracle_verified, check milestones
 *   4. If milestone met, release tranche to startup
 *   5. If deadline passes without milestone, refund to investor
 *
 * This module provides the client-side logic and types.
 * The actual smart contract would be an Anchor program extension.
 */

// ── Types ────────────────────────────────────────────────────────────

export type MilestoneMetric = 'mrr' | 'users' | 'growth_rate' | 'trust_score' | 'burn_rate' | 'runway_months';

export type MilestoneOperator = '>=' | '<=' | '>' | '<' | '==';

export type MilestoneStatus = 'pending' | 'in_progress' | 'met' | 'failed' | 'expired';

export type EscrowStatus = 'draft' | 'funded' | 'active' | 'completed' | 'refunded' | 'disputed';

export interface Milestone {
  /** Unique ID */
  id: string;
  /** Milestone name */
  name: string;
  /** Description */
  description: string;
  /** Which metric to check */
  metric: MilestoneMetric;
  /** Comparison operator */
  operator: MilestoneOperator;
  /** Target value */
  targetValue: number;
  /** Tranche amount to release on completion (in USDC) */
  trancheAmount: number;
  /** Tranche as percentage of total escrow */
  tranchePct: number;
  /** Deadline (timestamp) — if not met by this date, milestone fails */
  deadline: number;
  /** Current status */
  status: MilestoneStatus;
  /** When this milestone was met (null if not yet) */
  metAt: number | null;
  /** On-chain tx hash of the release (null if not yet) */
  releaseTxHash: string | null;
  /** Actual value when checked */
  actualValue: number | null;
  /** Whether the metric was oracle-verified at check time */
  oracleVerified: boolean;
}

export interface EscrowDeal {
  /** Unique deal ID */
  id: string;
  /** Startup ID */
  startupId: string;
  /** Startup name */
  startupName: string;
  /** Investor wallet address */
  investorWallet: string;
  /** Investor display name */
  investorName: string;
  /** Total escrow amount (USDC) */
  totalAmount: number;
  /** Amount released so far */
  releasedAmount: number;
  /** Amount remaining in escrow */
  remainingAmount: number;
  /** Escrow status */
  status: EscrowStatus;
  /** All milestones */
  milestones: Milestone[];
  /** Creation date */
  createdAt: number;
  /** Last checked date */
  lastCheckedAt: number;
  /** On-chain escrow account address (PDA) */
  escrowPda: string | null;
  /** Funding transaction hash */
  fundingTxHash: string | null;
  /** Refund conditions */
  refundConditions: string;
  /** Dispute resolution mechanism */
  disputeResolution: string;
}

export interface MilestoneCheckResult {
  milestoneId: string;
  met: boolean;
  actualValue: number;
  targetValue: number;
  oracleVerified: boolean;
  checkedAt: number;
}

// ── Metric Labels ────────────────────────────────────────────────────

export const METRIC_LABELS: Record<MilestoneMetric, { label: string; unit: string; format: (v: number) => string }> = {
  mrr:            { label: 'Monthly Recurring Revenue', unit: 'USD',    format: v => `$${v.toLocaleString()}` },
  users:          { label: 'Total Users',               unit: 'users',  format: v => v.toLocaleString() },
  growth_rate:    { label: 'Growth Rate',               unit: '%',      format: v => `${v}%` },
  trust_score:    { label: 'Trust Score',               unit: 'pts',    format: v => `${v}/100` },
  burn_rate:      { label: 'Monthly Burn Rate',         unit: 'USD',    format: v => `$${v.toLocaleString()}` },
  runway_months:  { label: 'Runway (months)',           unit: 'months', format: v => `${v} months` },
};

// ── Milestone Checking ───────────────────────────────────────────────

/**
 * Check if a milestone condition is met given current metric values.
 */
export function checkMilestone(
  milestone: Milestone,
  currentValues: Record<MilestoneMetric, number>,
  isOracleVerified: boolean = false,
): MilestoneCheckResult {
  const actual = currentValues[milestone.metric] ?? 0;
  let met = false;

  switch (milestone.operator) {
    case '>=': met = actual >= milestone.targetValue; break;
    case '<=': met = actual <= milestone.targetValue; break;
    case '>':  met = actual > milestone.targetValue; break;
    case '<':  met = actual < milestone.targetValue; break;
    case '==': met = actual === milestone.targetValue; break;
  }

  return {
    milestoneId: milestone.id,
    met,
    actualValue: actual,
    targetValue: milestone.targetValue,
    oracleVerified: isOracleVerified,
    checkedAt: Date.now(),
  };
}

/**
 * Check all milestones in a deal and update their statuses.
 */
export function checkAllMilestones(
  deal: EscrowDeal,
  currentValues: Record<MilestoneMetric, number>,
  isOracleVerified: boolean = false,
): EscrowDeal {
  const now = Date.now();
  const updatedMilestones = deal.milestones.map(m => {
    // Skip already completed or failed milestones
    if (m.status === 'met' || m.status === 'failed') return m;

    // Check if expired
    if (m.deadline < now) {
      return { ...m, status: 'expired' as MilestoneStatus };
    }

    const result = checkMilestone(m, currentValues, isOracleVerified);

    if (result.met && result.oracleVerified) {
      return {
        ...m,
        status: 'met' as MilestoneStatus,
        metAt: now,
        actualValue: result.actualValue,
        oracleVerified: true,
      };
    }

    return {
      ...m,
      status: 'in_progress' as MilestoneStatus,
      actualValue: result.actualValue,
    };
  });

  const releasedAmount = updatedMilestones
    .filter(m => m.status === 'met')
    .reduce((s, m) => s + m.trancheAmount, 0);

  const allCompleted = updatedMilestones.every(m => m.status === 'met');
  const allExpired = updatedMilestones.every(m => m.status === 'expired' || m.status === 'failed');

  return {
    ...deal,
    milestones: updatedMilestones,
    releasedAmount,
    remainingAmount: deal.totalAmount - releasedAmount,
    status: allCompleted ? 'completed' : allExpired ? 'refunded' : 'active',
    lastCheckedAt: now,
  };
}

// ── Deal Factory ─────────────────────────────────────────────────────

/**
 * Create a new escrow deal with milestones.
 */
export function createEscrowDeal(
  startupId: string,
  startupName: string,
  investorName: string,
  investorWallet: string,
  totalAmount: number,
  milestones: Omit<Milestone, 'status' | 'metAt' | 'releaseTxHash' | 'actualValue' | 'oracleVerified'>[],
): EscrowDeal {
  return {
    id: `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startupId,
    startupName,
    investorWallet,
    investorName,
    totalAmount,
    releasedAmount: 0,
    remainingAmount: totalAmount,
    status: 'draft',
    milestones: milestones.map(m => ({
      ...m,
      status: 'pending' as MilestoneStatus,
      metAt: null,
      releaseTxHash: null,
      actualValue: null,
      oracleVerified: false,
    })),
    createdAt: Date.now(),
    lastCheckedAt: Date.now(),
    escrowPda: null,
    fundingTxHash: null,
    refundConditions: 'Full refund if all milestones expire without being met. Partial refund for remaining tranches if some milestones met.',
    disputeResolution: 'Disputes resolved via ChainTrust DAO governance vote. Both parties can submit evidence. CMT stakers vote on resolution.',
  };
}

/**
 * Create a demo escrow deal for a startup.
 */
export function createDemoEscrowDeal(startupId: string, startupName: string, mrr: number): EscrowDeal {
  const now = Date.now();
  const month = 30 * 24 * 3600 * 1000;

  return createEscrowDeal(
    startupId,
    startupName,
    'Demo Investor Fund',
    'DemoWa11etAddress1234567890abcdef',
    500000,
    [
      {
        id: 'ms-1',
        name: 'Product-Market Fit',
        description: 'Reach $100K MRR demonstrating product-market fit',
        metric: 'mrr',
        operator: '>=',
        targetValue: 100000,
        trancheAmount: 150000,
        tranchePct: 30,
        deadline: now + 6 * month,
      },
      {
        id: 'ms-2',
        name: 'User Growth',
        description: 'Reach 10,000 active users',
        metric: 'users',
        operator: '>=',
        targetValue: 10000,
        trancheAmount: 100000,
        tranchePct: 20,
        deadline: now + 9 * month,
      },
      {
        id: 'ms-3',
        name: 'Trust Verification',
        description: 'Achieve a trust score of 80+ on ChainTrust',
        metric: 'trust_score',
        operator: '>=',
        targetValue: 80,
        trancheAmount: 100000,
        tranchePct: 20,
        deadline: now + 6 * month,
      },
      {
        id: 'ms-4',
        name: 'Growth Velocity',
        description: 'Maintain 15%+ monthly growth rate',
        metric: 'growth_rate',
        operator: '>=',
        targetValue: 15,
        trancheAmount: 75000,
        tranchePct: 15,
        deadline: now + 12 * month,
      },
      {
        id: 'ms-5',
        name: 'Scale',
        description: 'Reach $200K MRR demonstrating scalability',
        metric: 'mrr',
        operator: '>=',
        targetValue: 200000,
        trancheAmount: 75000,
        tranchePct: 15,
        deadline: now + 12 * month,
      },
    ],
  );
}

/**
 * Compute overall progress of an escrow deal.
 */
export function computeEscrowProgress(deal: EscrowDeal): {
  overallPct: number;
  milestonesCompleted: number;
  totalMilestones: number;
  fundsReleased: number;
  fundsRemaining: number;
  nextMilestone: Milestone | null;
  daysUntilNextDeadline: number | null;
} {
  const completed = deal.milestones.filter(m => m.status === 'met').length;
  const total = deal.milestones.length;
  const overallPct = total > 0 ? (completed / total) * 100 : 0;

  const pendingMilestones = deal.milestones
    .filter(m => m.status !== 'met' && m.status !== 'failed' && m.status !== 'expired')
    .sort((a, b) => a.deadline - b.deadline);

  const nextMilestone = pendingMilestones.length > 0 ? pendingMilestones[0] : null;
  const daysUntilNextDeadline = nextMilestone
    ? Math.ceil((nextMilestone.deadline - Date.now()) / (24 * 3600 * 1000))
    : null;

  return {
    overallPct,
    milestonesCompleted: completed,
    totalMilestones: total,
    fundsReleased: deal.releasedAmount,
    fundsRemaining: deal.remainingAmount,
    nextMilestone,
    daysUntilNextDeadline,
  };
}
