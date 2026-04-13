/**
 * Token-Gated Access Controller
 * ──────────────────────────────
 * Controls data access based on CMT staking tier.
 * Each feature and data point has a minimum tier requirement.
 *
 * Tiers: Free (0 CMT) < Basic (>0) < Pro (5,000+) < Whale (50,000+)
 *
 * This is the business model: stake more CMT = access more data.
 * ZK proofs control what precision of data each tier can see.
 */

// ── Types ────────────────────────────────────────────────────────────

export type AccessTier = 'free' | 'basic' | 'pro' | 'whale';

export interface GatedFeature {
  id: string;
  name: string;
  description: string;
  minTier: AccessTier;
  category: 'data' | 'analysis' | 'tools' | 'export' | 'api';
}

export interface AccessCheckResult {
  allowed: boolean;
  currentTier: AccessTier;
  requiredTier: AccessTier;
  upgradeMessage: string | null;
  cmtNeeded: number;
}

// ── Feature Registry ─────────────────────────────────────────────────

export const GATED_FEATURES: GatedFeature[] = [
  // Data Access
  { id: 'basic-metrics', name: 'Basic Metrics (MRR range, growth range)', description: 'See broad metric ranges for all startups', minTier: 'free', category: 'data' },
  { id: 'detailed-metrics', name: 'Detailed Metrics (exact values)', description: 'See exact MRR, users, treasury values', minTier: 'basic', category: 'data' },
  { id: 'metrics-history', name: 'Historical Metrics (time-series)', description: 'Access monthly metric history for trend analysis', minTier: 'basic', category: 'data' },
  { id: 'real-time-data', name: 'Real-Time Data Feed', description: 'Live metric updates via WebSocket', minTier: 'pro', category: 'data' },
  { id: 'raw-on-chain', name: 'Raw On-Chain Data Access', description: 'Direct PDA queries and raw account data', minTier: 'whale', category: 'data' },

  // Analysis Tools
  { id: 'red-flags', name: 'Red Flag Detection', description: 'Automated anomaly detection', minTier: 'free', category: 'analysis' },
  { id: 'trust-score', name: 'Trust Score Breakdown', description: 'Detailed trust score components', minTier: 'free', category: 'analysis' },
  { id: 'cts-score', name: 'ChainTrust Score (CTS)', description: 'Multi-dimensional reputation score', minTier: 'basic', category: 'analysis' },
  { id: 'ai-dd', name: 'AI Due Diligence Report', description: 'Automated due diligence analysis', minTier: 'basic', category: 'analysis' },
  { id: 'claim-verification', name: 'Claim Verification Matrix', description: 'Cross-reference claims vs data', minTier: 'pro', category: 'analysis' },
  { id: 'investment-memo', name: 'Investment Memo Generator', description: 'Institutional-grade memos', minTier: 'pro', category: 'analysis' },
  { id: 'competitive-intel', name: 'Competitive Intelligence', description: 'Battle cards, moat analysis, positioning', minTier: 'pro', category: 'analysis' },
  { id: 'cohort-analysis', name: 'Cohort Analysis', description: 'Retention curves, unit economics, PMF detection', minTier: 'pro', category: 'analysis' },
  { id: 'revenue-quality', name: 'Revenue Quality Scoring', description: 'Revenue durability assessment', minTier: 'pro', category: 'analysis' },
  { id: 'founder-score', name: 'Founder Score', description: 'Team/founder capability assessment', minTier: 'pro', category: 'analysis' },
  { id: 'governance-analytics', name: 'Governance Analytics', description: 'DAO health and voting patterns', minTier: 'whale', category: 'analysis' },

  // Tools
  { id: 'screener', name: 'Startup Screener', description: 'Filter and sort startups by metrics', minTier: 'basic', category: 'tools' },
  { id: 'compare', name: 'Startup Comparison', description: 'Side-by-side metric comparison', minTier: 'basic', category: 'tools' },
  { id: 'nl-query', name: 'Natural Language Query', description: 'Ask questions in plain English', minTier: 'basic', category: 'tools' },
  { id: 'digital-twin', name: 'Digital Twin (Monte Carlo)', description: '5,000 simulation fan charts', minTier: 'pro', category: 'tools' },
  { id: 'predictions', name: 'Survival Predictions', description: 'Probability badges and prediction markets', minTier: 'pro', category: 'tools' },
  { id: 'cap-table', name: 'Cap Table & Waterfall', description: 'Equity modeling and exit analysis', minTier: 'pro', category: 'tools' },
  { id: 'milestone-escrow', name: 'Milestone Escrow', description: 'Programmable investment terms', minTier: 'whale', category: 'tools' },
  { id: 'scenario-planning', name: 'Scenario Planning', description: 'What-if analysis engine', minTier: 'whale', category: 'tools' },
  { id: 'portfolio-optimizer', name: 'Portfolio Optimizer', description: 'Markowitz efficient frontier', minTier: 'whale', category: 'tools' },
  { id: 'dd-workflow', name: 'DD Workflow System', description: 'Interactive due diligence process', minTier: 'whale', category: 'tools' },
  { id: 'term-sheet', name: 'Term Sheet Builder', description: 'Generate and compare term sheets', minTier: 'whale', category: 'tools' },
  { id: 'zk-proofs', name: 'ZK Proof Generation', description: 'Generate zero-knowledge range proofs', minTier: 'whale', category: 'tools' },

  // Export
  { id: 'pdf-basic', name: 'Basic PDF Export', description: 'Export startup detail as PDF', minTier: 'basic', category: 'export' },
  { id: 'csv-export', name: 'CSV Data Export', description: 'Download screener results as CSV', minTier: 'pro', category: 'export' },
  { id: 'lp-report', name: 'LP Report Generator', description: 'Professional LP quarterly reports', minTier: 'pro', category: 'export' },
  { id: 'investment-memo-export', name: 'Investment Memo PDF', description: 'Export investment memos as PDFs', minTier: 'pro', category: 'export' },
  { id: 'bulk-export', name: 'Bulk Data Export', description: 'Export all portfolio data in bulk', minTier: 'whale', category: 'export' },

  // API Access
  { id: 'api-basic', name: 'Basic API Access', description: 'Read-only API (100 calls/day)', minTier: 'pro', category: 'api' },
  { id: 'api-full', name: 'Full API Access', description: 'Full API with webhooks (10K calls/day)', minTier: 'whale', category: 'api' },
  { id: 'api-streaming', name: 'Streaming API', description: 'WebSocket streaming data feed', minTier: 'whale', category: 'api' },
];

// ── Tier Configuration ───────────────────────────────────────────────

export const TIER_THRESHOLDS: Record<AccessTier, { minStake: number; label: string; color: string }> = {
  free:  { minStake: 0,     label: 'Free',  color: '#6B7280' },
  basic: { minStake: 1,     label: 'Basic', color: '#3B82F6' },
  pro:   { minStake: 5000,  label: 'Pro',   color: '#8B5CF6' },
  whale: { minStake: 50000, label: 'Whale', color: '#F59E0B' },
};

const TIER_ORDER: AccessTier[] = ['free', 'basic', 'pro', 'whale'];

// ── Access Check ─────────────────────────────────────────────────────

/**
 * Determine user's tier based on staked CMT amount.
 */
export function getUserTier(stakedCMT: number): AccessTier {
  if (stakedCMT >= 50000) return 'whale';
  if (stakedCMT >= 5000) return 'pro';
  if (stakedCMT > 0) return 'basic';
  return 'free';
}

/**
 * Check if a user has access to a specific feature.
 */
export function checkAccess(featureId: string, stakedCMT: number): AccessCheckResult {
  const userTier = getUserTier(stakedCMT);
  const feature = GATED_FEATURES.find(f => f.id === featureId);

  if (!feature) {
    return { allowed: true, currentTier: userTier, requiredTier: 'free', upgradeMessage: null, cmtNeeded: 0 };
  }

  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const requiredTierIndex = TIER_ORDER.indexOf(feature.minTier);
  const allowed = userTierIndex >= requiredTierIndex;

  let upgradeMessage: string | null = null;
  let cmtNeeded = 0;

  if (!allowed) {
    const requiredConfig = TIER_THRESHOLDS[feature.minTier];
    cmtNeeded = Math.max(0, requiredConfig.minStake - stakedCMT);
    upgradeMessage = `${feature.name} requires ${requiredConfig.label} tier. Stake ${cmtNeeded.toLocaleString()} more CMT to unlock.`;
  }

  return { allowed, currentTier: userTier, requiredTier: feature.minTier, upgradeMessage, cmtNeeded };
}

/**
 * Get all features available at a given tier.
 */
export function getFeaturesForTier(tier: AccessTier): GatedFeature[] {
  const tierIndex = TIER_ORDER.indexOf(tier);
  return GATED_FEATURES.filter(f => TIER_ORDER.indexOf(f.minTier) <= tierIndex);
}

/**
 * Get features that would be unlocked by upgrading to the next tier.
 */
export function getUpgradeFeatures(currentTier: AccessTier): { nextTier: AccessTier; features: GatedFeature[]; cmtNeeded: number } | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex >= TIER_ORDER.length - 1) return null;

  const nextTier = TIER_ORDER[currentIndex + 1];
  const features = GATED_FEATURES.filter(f => f.minTier === nextTier);
  const cmtNeeded = TIER_THRESHOLDS[nextTier].minStake;

  return { nextTier, features, cmtNeeded };
}

/**
 * Get a summary of what each tier unlocks.
 */
export function getTierComparison(): Record<AccessTier, { features: number; categories: Record<string, number> }> {
  const result: Record<AccessTier, { features: number; categories: Record<string, number> }> = {
    free: { features: 0, categories: {} },
    basic: { features: 0, categories: {} },
    pro: { features: 0, categories: {} },
    whale: { features: 0, categories: {} },
  };

  for (const tier of TIER_ORDER) {
    const available = getFeaturesForTier(tier);
    result[tier].features = available.length;
    for (const f of available) {
      result[tier].categories[f.category] = (result[tier].categories[f.category] ?? 0) + 1;
    }
  }

  return result;
}
