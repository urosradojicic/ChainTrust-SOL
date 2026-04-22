/**
 * Entity Aggregator
 * ─────────────────
 * Roll a startup up into an Arkham-style "entity dossier": every wallet,
 * every activity tag, every related entity, one timeline.
 *
 * Inputs are the startup row, its metric history, its audit log, and the
 * knowledge graph. Outputs are structured blocks the dossier UI renders.
 */

import type { DbStartup, DbMetricsHistory, DbAuditEntry, DbFundingRound } from '@/types/database';

export type EntityTagType = 'category' | 'stage' | 'status' | 'verification' | 'network' | 'sustainability' | 'esg';

export interface EntityTag {
  label: string;
  type: EntityTagType;
  tone: 'positive' | 'neutral' | 'warning' | 'info';
}

export interface EntityWallet {
  address: string;
  label: string;
  role: 'treasury' | 'mint' | 'team' | 'reserve' | 'liquidity' | 'unknown';
  explorerUrl: string;
}

export interface TimelineEvent {
  id: string;
  type: 'registered' | 'metric' | 'verification' | 'funding' | 'audit' | 'badge';
  title: string;
  detail: string;
  timestamp: number;
  txHash?: string;
}

export interface HoldingsPoint {
  month: string;
  revenue: number;
  treasury: number;
  userCount: number;
}

export interface EntityDossier {
  id: string;
  name: string;
  description: string;
  category: string;
  trustScore: number;
  verified: boolean;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Unranked';
  tags: EntityTag[];
  wallets: EntityWallet[];
  holdings: HoldingsPoint[];
  timeline: TimelineEvent[];
  latest: {
    revenue: number;
    treasury: number;
    users: number;
    growthRate: number;
  };
  summary: {
    totalRaised: number;
    rounds: number;
    verifiedMetricReports: number;
    auditEntries: number;
    firstSeen: string | null;
  };
}

// ── Tier computation matches on-chain logic ────────────────────────────
// Mirror of blockchain::compute_badge_tier so UI and chain stay in sync.
function tierFromTrustScore(score: number, verified: boolean): EntityDossier['tier'] {
  if (!verified) return 'Unranked';
  if (score >= 90) return 'Platinum';
  if (score >= 75) return 'Gold';
  if (score >= 60) return 'Silver';
  if (score >= 50) return 'Bronze';
  return 'Unranked';
}

// ── Tag derivation ─────────────────────────────────────────────────────
function deriveTags(s: DbStartup): EntityTag[] {
  const tags: EntityTag[] = [];

  // Verification
  tags.push(
    s.verified
      ? { label: 'Verified', type: 'verification', tone: 'positive' }
      : { label: 'Unverified', type: 'verification', tone: 'warning' },
  );

  // Category
  if (s.category) tags.push({ label: s.category, type: 'category', tone: 'info' });

  // Network
  if (s.blockchain) tags.push({ label: s.blockchain, type: 'network', tone: 'neutral' });

  // Chain type
  if (s.chain_type) tags.push({ label: s.chain_type, type: 'network', tone: 'neutral' });

  // Trust tiering
  if (s.trust_score >= 80) tags.push({ label: 'High Trust', type: 'status', tone: 'positive' });
  else if (s.trust_score < 40) tags.push({ label: 'Low Trust', type: 'status', tone: 'warning' });

  // Concentration risk
  if (s.whale_concentration > 60) tags.push({ label: 'Whale Risk', type: 'status', tone: 'warning' });

  // Sustainability
  if (s.sustainability_score >= 80) {
    tags.push({ label: 'Sustainable', type: 'sustainability', tone: 'positive' });
  }
  if (s.carbon_offset_tonnes && s.carbon_offset_tonnes > 0) {
    tags.push({ label: 'Carbon-Offset', type: 'esg', tone: 'positive' });
  }

  // Growth
  if (Number(s.growth_rate) > 20) tags.push({ label: 'High Growth', type: 'status', tone: 'positive' });
  else if (Number(s.growth_rate) < 0) tags.push({ label: 'Declining', type: 'status', tone: 'warning' });

  return tags;
}

// ── Wallet discovery ───────────────────────────────────────────────────
// The schema only carries a single address per startup today; we synthesize
// role-specific entries so the UI reads like Arkham's multi-wallet list.
function deriveWallets(s: DbStartup): EntityWallet[] {
  const rawAddr = (s as unknown as { solana_address?: string; wallet_address?: string });
  const treasury = rawAddr.solana_address || rawAddr.wallet_address;
  const wallets: EntityWallet[] = [];
  if (treasury) {
    wallets.push({
      address: treasury,
      label: 'Treasury',
      role: 'treasury',
      explorerUrl: `https://explorer.solana.com/address/${treasury}`,
    });
  }
  return wallets;
}

// ── Holdings time-series ───────────────────────────────────────────────
function buildHoldings(metrics: DbMetricsHistory[]): HoldingsPoint[] {
  return metrics.map((m) => ({
    month: m.month,
    revenue: Number(m.revenue ?? 0),
    treasury: Number((m as unknown as { treasury_balance?: number }).treasury_balance ?? 0),
    userCount: Number(m.mau ?? 0),
  }));
}

// ── Timeline synthesis ────────────────────────────────────────────────
function buildTimeline(
  s: DbStartup,
  metrics: DbMetricsHistory[],
  audit: DbAuditEntry[],
  rounds: DbFundingRound[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (s.created_at) {
    events.push({
      id: `reg-${s.id}`,
      type: 'registered',
      title: 'Startup registered',
      detail: `${s.name} joined ChainTrust`,
      timestamp: new Date(s.created_at).getTime(),
    });
  }

  for (const m of metrics.slice(-6)) {
    events.push({
      id: `metric-${s.id}-${m.month}`,
      type: 'metric',
      title: 'Metrics published',
      detail: `Rev $${Number(m.revenue ?? 0).toLocaleString()} · MAU ${Number(m.mau ?? 0).toLocaleString()}`,
      timestamp: new Date(m.month_date ?? `${m.month}-01`).getTime(),
    });
  }

  for (const r of rounds) {
    const when = r.round_date ? new Date(r.round_date).getTime() : 0;
    events.push({
      id: `round-${r.id}`,
      type: 'funding',
      title: `${r.round_name ?? 'Round'}`,
      detail: `$${Number(r.amount ?? 0).toLocaleString()} at $${Number(r.valuation ?? 0).toLocaleString()} valuation`,
      timestamp: when,
    });
  }

  for (const a of audit.slice(0, 20)) {
    events.push({
      id: `audit-${a.id}`,
      type: 'audit',
      title: `Audit: ${a.field_changed}`,
      detail: `${a.old_value ?? '∅'} → ${a.new_value ?? '∅'}`,
      timestamp: a.changed_at ? new Date(a.changed_at).getTime() : 0,
      txHash: (a as unknown as { tx_hash?: string }).tx_hash,
    });
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

// ── Main entry point ──────────────────────────────────────────────────
export function buildEntityDossier(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  audit: DbAuditEntry[],
  rounds: DbFundingRound[] = [],
): EntityDossier {
  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const totalRaised = rounds.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  return {
    id: startup.id,
    name: startup.name,
    description: startup.description ?? '',
    category: startup.category,
    trustScore: startup.trust_score,
    verified: startup.verified,
    tier: tierFromTrustScore(startup.trust_score, startup.verified),
    tags: deriveTags(startup),
    wallets: deriveWallets(startup),
    holdings: buildHoldings(metrics),
    timeline: buildTimeline(startup, metrics, audit, rounds),
    latest: {
      revenue: Number(latestMetric?.revenue ?? startup.mrr ?? 0),
      treasury: Number((startup as unknown as { treasury?: number }).treasury ?? 0),
      users: Number(latestMetric?.mau ?? startup.users ?? 0),
      growthRate: Number(startup.growth_rate ?? 0),
    },
    summary: {
      totalRaised,
      rounds: rounds.length,
      verifiedMetricReports: metrics.length,
      auditEntries: audit.length,
      firstSeen: startup.created_at ?? null,
    },
  };
}
