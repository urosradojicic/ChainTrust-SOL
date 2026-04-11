/**
 * Demo data that matches the database schema types.
 * Used as fallback when Supabase is not configured.
 * Remove this file when switching to production.
 */
import type { DbStartup, DbMetricsHistory, DbProposal } from '@/types/database';

// ── Startups ──────────────────────────────────────────────────────

export const DEMO_STARTUPS: DbStartup[] = [
  {
    id: 'payflow', name: 'PayFlow', category: 'Fintech', blockchain: 'Solana',
    mrr: 142000, users: 12847, growth_rate: 23.4,
    sustainability_score: 82, energy_score: 91, carbon_score: 78, tokenomics_score: 85, governance_score: 74,
    verified: true, logo_url: null, description: 'Decentralized payment infrastructure for emerging markets',
    founded_date: '2024-03-15', website: 'https://payflow.xyz',
    carbon_offset_tonnes: 45, energy_per_transaction: '0.00051 kWh',
    token_concentration_pct: 12, trust_score: 94, chain_type: 'PoS',
    inflation_rate: 2.1, team_size: 18, treasury: 2400000,
    energy_consumption: 0.00051, whale_concentration: 8.3,
    created_at: '2024-03-15T10:00:00Z',
  },
  {
    id: 'cloudmetrics', name: 'CloudMetrics', category: 'SaaS', blockchain: 'Solana',
    mrr: 89500, users: 5234, growth_rate: 18.2,
    sustainability_score: 76, energy_score: 88, carbon_score: 72, tokenomics_score: 79, governance_score: 65,
    verified: true, logo_url: null, description: 'Cloud-native observability platform with on-chain audit logs',
    founded_date: '2024-01-10', website: 'https://cloudmetrics.io',
    carbon_offset_tonnes: 32, energy_per_transaction: '0.00048 kWh',
    token_concentration_pct: 15, trust_score: 87, chain_type: 'PoS',
    inflation_rate: 3.2, team_size: 12, treasury: 1800000,
    energy_consumption: 0.00048, whale_concentration: 11.2,
    created_at: '2024-01-10T10:00:00Z',
  },
  {
    id: 'defiyield', name: 'DeFiYield', category: 'DeFi', blockchain: 'Solana',
    mrr: 312000, users: 28100, growth_rate: 41.7,
    sustainability_score: 68, energy_score: 85, carbon_score: 62, tokenomics_score: 71, governance_score: 54,
    verified: true, logo_url: null, description: 'Automated yield optimization across Solana DeFi protocols',
    founded_date: '2023-11-20', website: 'https://defiyield.sol',
    carbon_offset_tonnes: 28, energy_per_transaction: '0.00062 kWh',
    token_concentration_pct: 22, trust_score: 78, chain_type: 'PoS',
    inflation_rate: 5.1, team_size: 24, treasury: 5200000,
    energy_consumption: 0.00062, whale_concentration: 18.7,
    created_at: '2023-11-20T10:00:00Z',
  },
  {
    id: 'greenchain', name: 'GreenChain', category: 'Supply Chain', blockchain: 'Solana',
    mrr: 67000, users: 3890, growth_rate: 15.8,
    sustainability_score: 95, energy_score: 97, carbon_score: 96, tokenomics_score: 92, governance_score: 91,
    verified: true, logo_url: null, description: 'Carbon-neutral supply chain verification for EU DPP compliance',
    founded_date: '2024-05-01', website: 'https://greenchain.earth',
    carbon_offset_tonnes: 120, energy_per_transaction: '0.00032 kWh',
    token_concentration_pct: 8, trust_score: 96, chain_type: 'PoS',
    inflation_rate: 1.5, team_size: 10, treasury: 980000,
    energy_consumption: 0.00032, whale_concentration: 5.1,
    created_at: '2024-05-01T10:00:00Z',
  },
  {
    id: 'datavault', name: 'DataVault', category: 'Data', blockchain: 'Solana',
    mrr: 198000, users: 8920, growth_rate: 29.3,
    sustainability_score: 74, energy_score: 82, carbon_score: 70, tokenomics_score: 76, governance_score: 68,
    verified: false, logo_url: null, description: 'Decentralized data marketplace with verifiable computation proofs',
    founded_date: '2024-02-28', website: 'https://datavault.xyz',
    carbon_offset_tonnes: 15, energy_per_transaction: '0.00055 kWh',
    token_concentration_pct: 18, trust_score: 71, chain_type: 'PoS',
    inflation_rate: 4.0, team_size: 16, treasury: 3100000,
    energy_consumption: 0.00055, whale_concentration: 14.5,
    created_at: '2024-02-28T10:00:00Z',
  },
  {
    id: 'tokenbridge', name: 'TokenBridge', category: 'Infrastructure', blockchain: 'Solana',
    mrr: 245000, users: 15670, growth_rate: 34.1,
    sustainability_score: 71, energy_score: 79, carbon_score: 65, tokenomics_score: 74, governance_score: 66,
    verified: true, logo_url: null, description: 'Cross-chain bridge infrastructure with insurance and MEV protection',
    founded_date: '2023-09-12', website: 'https://tokenbridge.io',
    carbon_offset_tonnes: 22, energy_per_transaction: '0.00071 kWh',
    token_concentration_pct: 20, trust_score: 83, chain_type: 'PoS',
    inflation_rate: 3.8, team_size: 22, treasury: 4500000,
    energy_consumption: 0.00071, whale_concentration: 16.2,
    created_at: '2023-09-12T10:00:00Z',
  },
  {
    id: 'solanaid', name: 'SolanaID', category: 'Identity', blockchain: 'Solana',
    mrr: 52000, users: 42300, growth_rate: 52.6,
    sustainability_score: 88, energy_score: 93, carbon_score: 84, tokenomics_score: 89, governance_score: 86,
    verified: true, logo_url: null, description: 'Decentralized identity and credential verification on Solana',
    founded_date: '2024-06-18', website: 'https://solanaid.me',
    carbon_offset_tonnes: 38, energy_per_transaction: '0.00029 kWh',
    token_concentration_pct: 10, trust_score: 91, chain_type: 'PoS',
    inflation_rate: 1.8, team_size: 8, treasury: 720000,
    energy_consumption: 0.00029, whale_concentration: 6.8,
    created_at: '2024-06-18T10:00:00Z',
  },
  {
    id: 'nftmarket', name: 'ArtVault', category: 'NFT', blockchain: 'Solana',
    mrr: 178000, users: 21500, growth_rate: 27.9,
    sustainability_score: 65, energy_score: 75, carbon_score: 58, tokenomics_score: 68, governance_score: 59,
    verified: false, logo_url: null, description: 'Pro-grade NFT marketplace with real-time floor analytics and portfolio tracking',
    founded_date: '2024-04-05', website: 'https://artvault.xyz',
    carbon_offset_tonnes: 10, energy_per_transaction: '0.00044 kWh',
    token_concentration_pct: 25, trust_score: 65, chain_type: 'PoS',
    inflation_rate: 6.2, team_size: 14, treasury: 2800000,
    energy_consumption: 0.00044, whale_concentration: 21.3,
    created_at: '2024-04-05T10:00:00Z',
  },
];

// ── Metrics History ──────────────────────────────────────────────

const MONTHS = ['2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'];

function genMetrics(startupId: string, baseRev: number, baseMau: number, growthPct: number): DbMetricsHistory[] {
  return MONTHS.map((m, i) => {
    const mult = Math.pow(1 + growthPct / 100 / 6, i);
    return {
      id: `${startupId}-${m}`,
      startup_id: startupId,
      month: m.split('-')[1],
      month_date: `${m}-01`,
      revenue: Math.round(baseRev * mult),
      costs: Math.round(baseRev * 0.6 * mult),
      mau: Math.round(baseMau * mult),
      transactions: Math.round(baseMau * 3.2 * mult),
      carbon_offsets: Math.round(5 + i * 2 + Math.random() * 3),
      growth_rate: +(growthPct / 6 * (0.8 + Math.random() * 0.4)).toFixed(1),
    };
  });
}

export const DEMO_METRICS: DbMetricsHistory[] = [
  ...genMetrics('payflow', 120000, 10000, 23.4),
  ...genMetrics('cloudmetrics', 75000, 4200, 18.2),
  ...genMetrics('defiyield', 250000, 22000, 41.7),
  ...genMetrics('greenchain', 55000, 3100, 15.8),
  ...genMetrics('datavault', 160000, 7200, 29.3),
  ...genMetrics('tokenbridge', 200000, 12800, 34.1),
  ...genMetrics('solanaid', 38000, 35000, 52.6),
  ...genMetrics('nftmarket', 145000, 17500, 27.9),
];

// ── Proposals ──────────────────────────────────────────────────

export const DEMO_PROPOSALS: DbProposal[] = [
  {
    id: 'prop-1', title: 'Increase staking APY to 15% for Whale tier',
    description: 'Proposal to increase the annual staking reward rate for Whale tier (50K+ CMT) from 12.5% to 15% to incentivize long-term holding and reduce sell pressure.',
    proposer: 'demo-admin', votes_for: 12450, votes_against: 3200, votes_abstain: 890,
    status: 'Active', ends_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'prop-2', title: 'Add EU DPP compliance module to free tier',
    description: 'Make the basic EU Digital Product Passport compliance tracker available to all users, not just Pro tier. This will increase adoption among EU-based startups.',
    proposer: 'demo-investor', votes_for: 8900, votes_against: 1100, votes_abstain: 450,
    status: 'Active', ends_at: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'prop-3', title: 'Treasury diversification: 20% to USDC reserves',
    description: 'Move 20% of the protocol treasury from SOL to USDC to reduce volatility exposure and ensure 18+ months of operational runway regardless of market conditions.',
    proposer: 'demo-admin', votes_for: 15600, votes_against: 7800, votes_abstain: 2100,
    status: 'Passed', ends_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'prop-4', title: 'Launch ChainTrust grants program for open-source tools',
    description: 'Allocate 500,000 CMT from the community treasury to fund open-source verification tools, SDK contributions, and ecosystem integrations over the next 6 months.',
    proposer: 'demo-startup', votes_for: 21000, votes_against: 2400, votes_abstain: 1800,
    status: 'Passed', ends_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  },
];
