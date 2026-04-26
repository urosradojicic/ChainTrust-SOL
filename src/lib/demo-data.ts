/**
 * Demo data that matches the database schema types.
 * Used as fallback when Supabase is not configured.
 *
 * ───────────────────────────────────────────────────────────────────
 *  ⚠️  FICTIONAL DEMO DATA — NOT FINANCIAL INFORMATION  ⚠️
 *
 *  Names, metrics, treasuries, growth rates, and trust scores below
 *  are illustrative only. Many entries are inspired by category
 *  patterns common in the Solana ecosystem (DeFi aggregators, liquid
 *  staking, NFT marketplaces, DePIN, RWA, etc.) but every number is
 *  fabricated for demonstration. None of these rows represent real
 *  companies, real investment opportunities, or real financial data.
 *
 *  Remove this file when switching to production Supabase data.
 * ───────────────────────────────────────────────────────────────────
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

  // ── Expanded ecosystem (25 fictional startups inspired by Solana category patterns) ──
  {
    id: 'vortex-dex', name: 'VortexDEX', category: 'DeFi', blockchain: 'Solana',
    mrr: 1850000, users: 412000, growth_rate: 18.4,
    sustainability_score: 79, energy_score: 88, carbon_score: 72, tokenomics_score: 81, governance_score: 76,
    verified: true, logo_url: null, description: 'DEX aggregator routing trades across 30+ Solana liquidity venues with MEV protection',
    founded_date: '2022-08-12', website: 'https://vortexdex.app',
    carbon_offset_tonnes: 220, energy_per_transaction: '0.00041 kWh',
    token_concentration_pct: 14, trust_score: 91, chain_type: 'PoS',
    inflation_rate: 2.4, team_size: 32, treasury: 22500000,
    energy_consumption: 0.00041, whale_concentration: 11.5,
    created_at: '2022-08-12T10:00:00Z',
  },
  {
    id: 'anchorage-liquid', name: 'Anchorage Liquid', category: 'DeFi', blockchain: 'Solana',
    mrr: 920000, users: 87400, growth_rate: 12.1,
    sustainability_score: 84, energy_score: 92, carbon_score: 80, tokenomics_score: 78, governance_score: 81,
    verified: true, logo_url: null, description: 'Non-custodial liquid staking — stake SOL, get aSOL, retain DeFi composability',
    founded_date: '2022-04-22', website: 'https://anchorage.fi',
    carbon_offset_tonnes: 168, energy_per_transaction: '0.00029 kWh',
    token_concentration_pct: 16, trust_score: 89, chain_type: 'PoS',
    inflation_rate: 1.8, team_size: 21, treasury: 14700000,
    energy_consumption: 0.00029, whale_concentration: 13.8,
    created_at: '2022-04-22T10:00:00Z',
  },
  {
    id: 'lend-so', name: 'Lend.so', category: 'DeFi', blockchain: 'Solana',
    mrr: 540000, users: 38200, growth_rate: 9.7,
    sustainability_score: 71, energy_score: 84, carbon_score: 65, tokenomics_score: 70, governance_score: 67,
    verified: true, logo_url: null, description: 'Money-market lending with isolated risk pools and on-chain liquidation auctions',
    founded_date: '2022-11-30', website: 'https://lend.so',
    carbon_offset_tonnes: 95, energy_per_transaction: '0.00052 kWh',
    token_concentration_pct: 22, trust_score: 78, chain_type: 'PoS',
    inflation_rate: 4.6, team_size: 19, treasury: 9800000,
    energy_consumption: 0.00052, whale_concentration: 19.4,
    created_at: '2022-11-30T10:00:00Z',
  },
  {
    id: 'perp-void', name: 'PerpVoid', category: 'DeFi', blockchain: 'Solana',
    mrr: 1240000, users: 52800, growth_rate: 32.6,
    sustainability_score: 67, energy_score: 80, carbon_score: 60, tokenomics_score: 65, governance_score: 58,
    verified: true, logo_url: null, description: 'On-chain perpetual futures with cross-margin and decentralized order book',
    founded_date: '2023-02-14', website: 'https://perpvoid.io',
    carbon_offset_tonnes: 75, energy_per_transaction: '0.00068 kWh',
    token_concentration_pct: 28, trust_score: 81, chain_type: 'PoS',
    inflation_rate: 5.8, team_size: 27, treasury: 16200000,
    energy_consumption: 0.00068, whale_concentration: 24.1,
    created_at: '2023-02-14T10:00:00Z',
  },
  {
    id: 'tidal-amm', name: 'TidalAMM', category: 'DeFi', blockchain: 'Solana',
    mrr: 480000, users: 64300, growth_rate: 14.2,
    sustainability_score: 76, energy_score: 86, carbon_score: 70, tokenomics_score: 73, governance_score: 71,
    verified: true, logo_url: null, description: 'Concentrated-liquidity AMM with dynamic fees and bid/ask range orders',
    founded_date: '2023-05-08', website: 'https://tidalamm.fi',
    carbon_offset_tonnes: 88, energy_per_transaction: '0.00046 kWh',
    token_concentration_pct: 18, trust_score: 83, chain_type: 'PoS',
    inflation_rate: 3.4, team_size: 14, treasury: 5600000,
    energy_consumption: 0.00046, whale_concentration: 14.7,
    created_at: '2023-05-08T10:00:00Z',
  },
  {
    id: 'phoenix-books', name: 'Phoenix Books', category: 'DeFi', blockchain: 'Solana',
    mrr: 312000, users: 18600, growth_rate: 21.5,
    sustainability_score: 73, energy_score: 84, carbon_score: 68, tokenomics_score: 75, governance_score: 70,
    verified: true, logo_url: null, description: 'Fully on-chain central limit order book — no off-chain matching, sub-second fills',
    founded_date: '2023-07-19', website: 'https://phoenix-books.app',
    carbon_offset_tonnes: 52, energy_per_transaction: '0.00038 kWh',
    token_concentration_pct: 17, trust_score: 86, chain_type: 'PoS',
    inflation_rate: 2.7, team_size: 11, treasury: 3400000,
    energy_consumption: 0.00038, whale_concentration: 13.2,
    created_at: '2023-07-19T10:00:00Z',
  },
  {
    id: 'pixel-trade', name: 'PixelTrade', category: 'NFT', blockchain: 'Solana',
    mrr: 690000, users: 138000, growth_rate: -3.2,
    sustainability_score: 62, energy_score: 78, carbon_score: 55, tokenomics_score: 64, governance_score: 53,
    verified: true, logo_url: null, description: 'Pro-trader NFT marketplace with sub-second listing speed and bulk-action UX',
    founded_date: '2022-09-30', website: 'https://pixeltrade.gg',
    carbon_offset_tonnes: 18, energy_per_transaction: '0.00057 kWh',
    token_concentration_pct: 26, trust_score: 71, chain_type: 'PoS',
    inflation_rate: 7.1, team_size: 23, treasury: 4800000,
    energy_consumption: 0.00057, whale_concentration: 22.6,
    created_at: '2022-09-30T10:00:00Z',
  },
  {
    id: 'craft-haus', name: 'CraftHaus', category: 'NFT', blockchain: 'Solana',
    mrr: 84000, users: 9400, growth_rate: 7.8,
    sustainability_score: 70, energy_score: 80, carbon_score: 64, tokenomics_score: 68, governance_score: 60,
    verified: false, logo_url: null, description: 'No-code NFT collection launcher with built-in royalty enforcement and reveal mechanics',
    founded_date: '2024-01-22', website: 'https://crafthaus.studio',
    carbon_offset_tonnes: 12, energy_per_transaction: '0.00043 kWh',
    token_concentration_pct: 31, trust_score: 64, chain_type: 'PoS',
    inflation_rate: 5.4, team_size: 6, treasury: 720000,
    energy_consumption: 0.00043, whale_concentration: 28.0,
    created_at: '2024-01-22T10:00:00Z',
  },
  {
    id: 'aero-pay', name: 'AeroPay', category: 'Fintech', blockchain: 'Solana',
    mrr: 240000, users: 14800, growth_rate: 38.4,
    sustainability_score: 81, energy_score: 90, carbon_score: 76, tokenomics_score: 82, governance_score: 72,
    verified: true, logo_url: null, description: 'Stablecoin payment rails for SaaS — recurring billing, dunning, and accounting export',
    founded_date: '2023-10-04', website: 'https://aeropay.dev',
    carbon_offset_tonnes: 41, energy_per_transaction: '0.00033 kWh',
    token_concentration_pct: 14, trust_score: 87, chain_type: 'PoS',
    inflation_rate: 1.9, team_size: 13, treasury: 3100000,
    energy_consumption: 0.00033, whale_concentration: 10.8,
    created_at: '2023-10-04T10:00:00Z',
  },
  {
    id: 'strato-pay', name: 'Strato Pay', category: 'Fintech', blockchain: 'Solana',
    mrr: 175000, users: 32500, growth_rate: 45.1,
    sustainability_score: 78, energy_score: 89, carbon_score: 73, tokenomics_score: 76, governance_score: 68,
    verified: true, logo_url: null, description: 'Crypto-funded debit cards with on-chain spend authorization and merchant rebates',
    founded_date: '2024-02-09', website: 'https://stratopay.cards',
    carbon_offset_tonnes: 28, energy_per_transaction: '0.00036 kWh',
    token_concentration_pct: 19, trust_score: 82, chain_type: 'PoS',
    inflation_rate: 3.6, team_size: 17, treasury: 5400000,
    energy_consumption: 0.00036, whale_concentration: 15.7,
    created_at: '2024-02-09T10:00:00Z',
  },
  {
    id: 'prism-wallet', name: 'Prism Wallet', category: 'Infrastructure', blockchain: 'Solana',
    mrr: 0, users: 384000, growth_rate: 22.4,
    sustainability_score: 86, energy_score: 94, carbon_score: 82, tokenomics_score: 80, governance_score: 75,
    verified: true, logo_url: null, description: 'Self-custody wallet with embedded swaps, NFT inbox, and hardware-key support — free for users',
    founded_date: '2022-06-01', website: 'https://prismwallet.app',
    carbon_offset_tonnes: 145, energy_per_transaction: '0.00027 kWh',
    token_concentration_pct: 12, trust_score: 92, chain_type: 'PoS',
    inflation_rate: 0, team_size: 38, treasury: 18900000,
    energy_consumption: 0.00027, whale_concentration: 9.4,
    created_at: '2022-06-01T10:00:00Z',
  },
  {
    id: 'lumen-labs', name: 'Lumen Labs', category: 'Infrastructure', blockchain: 'Solana',
    mrr: 1480000, users: 6200, growth_rate: 26.8,
    sustainability_score: 75, energy_score: 86, carbon_score: 70, tokenomics_score: 77, governance_score: 70,
    verified: true, logo_url: null, description: 'Solana RPC and indexing platform — DAS API, webhooks, gRPC streams, dedicated nodes',
    founded_date: '2022-02-18', website: 'https://lumenlabs.dev',
    carbon_offset_tonnes: 210, energy_per_transaction: '0.00045 kWh',
    token_concentration_pct: 13, trust_score: 88, chain_type: 'PoS',
    inflation_rate: 2.2, team_size: 29, treasury: 12600000,
    energy_consumption: 0.00045, whale_concentration: 10.6,
    created_at: '2022-02-18T10:00:00Z',
  },
  {
    id: 'squad-vault', name: 'SquadVault', category: 'Infrastructure', blockchain: 'Solana',
    mrr: 380000, users: 4600, growth_rate: 16.3,
    sustainability_score: 88, energy_score: 93, carbon_score: 85, tokenomics_score: 86, governance_score: 90,
    verified: true, logo_url: null, description: 'On-chain multisig and treasury management — policy-gated transactions, time-locked exits',
    founded_date: '2022-03-15', website: 'https://squadvault.so',
    carbon_offset_tonnes: 64, energy_per_transaction: '0.00031 kWh',
    token_concentration_pct: 11, trust_score: 94, chain_type: 'PoS',
    inflation_rate: 1.4, team_size: 16, treasury: 8200000,
    energy_consumption: 0.00031, whale_concentration: 7.9,
    created_at: '2022-03-15T10:00:00Z',
  },
  {
    id: 'gov-stream', name: 'GovStream', category: 'Infrastructure', blockchain: 'Solana',
    mrr: 56000, users: 2100, growth_rate: 11.5,
    sustainability_score: 82, energy_score: 89, carbon_score: 78, tokenomics_score: 80, governance_score: 88,
    verified: true, logo_url: null, description: 'DAO operating system — proposals, voting, treasury, vesting, all on-chain',
    founded_date: '2023-08-12', website: 'https://govstream.xyz',
    carbon_offset_tonnes: 31, energy_per_transaction: '0.00034 kWh',
    token_concentration_pct: 13, trust_score: 87, chain_type: 'PoS',
    inflation_rate: 2.0, team_size: 9, treasury: 1900000,
    energy_consumption: 0.00034, whale_concentration: 9.8,
    created_at: '2023-08-12T10:00:00Z',
  },
  {
    id: 'orbit-net', name: 'OrbitNet', category: 'DePIN', blockchain: 'Solana',
    mrr: 1620000, users: 264000, growth_rate: 41.2,
    sustainability_score: 88, energy_score: 95, carbon_score: 84, tokenomics_score: 79, governance_score: 73,
    verified: true, logo_url: null, description: 'Decentralized 5G network — hotspot operators earn ON tokens for coverage and data',
    founded_date: '2022-12-05', website: 'https://orbitnet.io',
    carbon_offset_tonnes: 320, energy_per_transaction: '0.00024 kWh',
    token_concentration_pct: 19, trust_score: 85, chain_type: 'PoS',
    inflation_rate: 4.1, team_size: 41, treasury: 24500000,
    energy_consumption: 0.00024, whale_concentration: 16.1,
    created_at: '2022-12-05T10:00:00Z',
  },
  {
    id: 'pixel-render', name: 'Pixel Render', category: 'DePIN', blockchain: 'Solana',
    mrr: 950000, users: 19800, growth_rate: 58.3,
    sustainability_score: 71, energy_score: 65, carbon_score: 60, tokenomics_score: 78, governance_score: 70,
    verified: true, logo_url: null, description: 'Distributed GPU compute marketplace for ML inference and 3D render workloads',
    founded_date: '2023-04-01', website: 'https://pixelrender.network',
    carbon_offset_tonnes: 142, energy_per_transaction: '0.00075 kWh',
    token_concentration_pct: 17, trust_score: 79, chain_type: 'PoS',
    inflation_rate: 3.2, team_size: 25, treasury: 11800000,
    energy_consumption: 0.00075, whale_concentration: 13.4,
    created_at: '2023-04-01T10:00:00Z',
  },
  {
    id: 'terra-map', name: 'TerraMap', category: 'DePIN', blockchain: 'Solana',
    mrr: 220000, users: 41700, growth_rate: 33.0,
    sustainability_score: 80, energy_score: 87, carbon_score: 76, tokenomics_score: 73, governance_score: 65,
    verified: false, logo_url: null, description: 'Crowdsourced street-level mapping — drivers earn TERRA for fresh imagery',
    founded_date: '2023-06-20', website: 'https://terramap.earth',
    carbon_offset_tonnes: 78, energy_per_transaction: '0.00039 kWh',
    token_concentration_pct: 24, trust_score: 72, chain_type: 'PoS',
    inflation_rate: 6.8, team_size: 18, treasury: 6700000,
    energy_consumption: 0.00039, whale_concentration: 19.3,
    created_at: '2023-06-20T10:00:00Z',
  },
  {
    id: 'geno-lab', name: 'GenoLab', category: 'DePIN', blockchain: 'Solana',
    mrr: 38000, users: 2900, growth_rate: 19.4,
    sustainability_score: 92, energy_score: 96, carbon_score: 90, tokenomics_score: 88, governance_score: 84,
    verified: true, logo_url: null, description: 'Genomic-data DePIN — patients control their data, researchers pay to query',
    founded_date: '2024-01-15', website: 'https://genolab.bio',
    carbon_offset_tonnes: 56, energy_per_transaction: '0.00021 kWh',
    token_concentration_pct: 9, trust_score: 89, chain_type: 'PoS',
    inflation_rate: 1.5, team_size: 7, treasury: 1200000,
    energy_consumption: 0.00021, whale_concentration: 6.2,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'vanguard-ai', name: 'Vanguard AI', category: 'AI', blockchain: 'Solana',
    mrr: 460000, users: 11200, growth_rate: 67.8,
    sustainability_score: 73, energy_score: 70, carbon_score: 64, tokenomics_score: 76, governance_score: 67,
    verified: true, logo_url: null, description: 'Permissionless AI inference network — pay-per-token for open models on Solana',
    founded_date: '2024-03-08', website: 'https://vanguardai.xyz',
    carbon_offset_tonnes: 96, energy_per_transaction: '0.00081 kWh',
    token_concentration_pct: 21, trust_score: 80, chain_type: 'PoS',
    inflation_rate: 4.4, team_size: 22, treasury: 9300000,
    energy_consumption: 0.00081, whale_concentration: 17.8,
    created_at: '2024-03-08T10:00:00Z',
  },
  {
    id: 'verite-id', name: 'Verite ID', category: 'Identity', blockchain: 'Solana',
    mrr: 165000, users: 87300, growth_rate: 24.6,
    sustainability_score: 87, energy_score: 92, carbon_score: 84, tokenomics_score: 85, governance_score: 82,
    verified: true, logo_url: null, description: 'Reusable KYC credentials — verify once, use across any Solana app with ZK-backed proofs',
    founded_date: '2023-09-25', website: 'https://verite.id',
    carbon_offset_tonnes: 72, energy_per_transaction: '0.00028 kWh',
    token_concentration_pct: 11, trust_score: 90, chain_type: 'PoS',
    inflation_rate: 1.7, team_size: 15, treasury: 4800000,
    energy_consumption: 0.00028, whale_concentration: 8.9,
    created_at: '2023-09-25T10:00:00Z',
  },
  {
    id: 'whisper-chat', name: 'WhisperChat', category: 'Social', blockchain: 'Solana',
    mrr: 28000, users: 156000, growth_rate: 8.4,
    sustainability_score: 79, energy_score: 88, carbon_score: 75, tokenomics_score: 71, governance_score: 64,
    verified: false, logo_url: null, description: 'Wallet-to-wallet encrypted messaging — every chat addressable by SOL public key',
    founded_date: '2023-11-11', website: 'https://whisperchat.so',
    carbon_offset_tonnes: 22, energy_per_transaction: '0.00031 kWh',
    token_concentration_pct: 27, trust_score: 68, chain_type: 'PoS',
    inflation_rate: 5.0, team_size: 8, treasury: 1100000,
    energy_consumption: 0.00031, whale_concentration: 23.1,
    created_at: '2023-11-11T10:00:00Z',
  },
  {
    id: 'drip-stream', name: 'DripStream', category: 'Social', blockchain: 'Solana',
    mrr: 410000, users: 92800, growth_rate: 36.7,
    sustainability_score: 74, energy_score: 85, carbon_score: 68, tokenomics_score: 72, governance_score: 60,
    verified: true, logo_url: null, description: 'Subscription monetization for creators — fans pay USDC/SOL, on-chain access tokens unlock content',
    founded_date: '2023-04-14', website: 'https://dripstream.fans',
    carbon_offset_tonnes: 47, energy_per_transaction: '0.00040 kWh',
    token_concentration_pct: 23, trust_score: 75, chain_type: 'PoS',
    inflation_rate: 4.8, team_size: 19, treasury: 5900000,
    energy_consumption: 0.00040, whale_concentration: 17.2,
    created_at: '2023-04-14T10:00:00Z',
  },
  {
    id: 'tideland-rwa', name: 'Tideland RWA', category: 'RWA', blockchain: 'Solana',
    mrr: 720000, users: 8400, growth_rate: 51.3,
    sustainability_score: 91, energy_score: 95, carbon_score: 88, tokenomics_score: 87, governance_score: 89,
    verified: true, logo_url: null, description: 'Tokenized US Treasuries — 1:1 backed, daily NAV, redeem to USDC in 30 minutes',
    founded_date: '2023-12-18', website: 'https://tidelandrwa.com',
    carbon_offset_tonnes: 110, energy_per_transaction: '0.00026 kWh',
    token_concentration_pct: 8, trust_score: 95, chain_type: 'PoS',
    inflation_rate: 0.8, team_size: 12, treasury: 31200000,
    energy_consumption: 0.00026, whale_concentration: 5.4,
    created_at: '2023-12-18T10:00:00Z',
  },
  {
    id: 'echo-markets', name: 'EchoMarkets', category: 'DeFi', blockchain: 'Solana',
    mrr: 285000, users: 24600, growth_rate: 78.2,
    sustainability_score: 70, energy_score: 82, carbon_score: 64, tokenomics_score: 72, governance_score: 66,
    verified: false, logo_url: null, description: 'Permissionless prediction markets — anyone creates a market, oracles resolve, traders profit',
    founded_date: '2024-04-22', website: 'https://echomarkets.bet',
    carbon_offset_tonnes: 19, energy_per_transaction: '0.00050 kWh',
    token_concentration_pct: 25, trust_score: 70, chain_type: 'PoS',
    inflation_rate: 6.4, team_size: 11, treasury: 2200000,
    energy_consumption: 0.00050, whale_concentration: 20.5,
    created_at: '2024-04-22T10:00:00Z',
  },
  {
    id: 'aurora-game', name: 'Aurora Quest', category: 'Gaming', blockchain: 'Solana',
    mrr: 540000, users: 318000, growth_rate: -8.4,
    sustainability_score: 64, energy_score: 78, carbon_score: 56, tokenomics_score: 60, governance_score: 52,
    verified: true, logo_url: null, description: 'Mobile RPG with on-chain item ownership — millions of players, in-game economy on Solana',
    founded_date: '2022-07-08', website: 'https://auroraquest.gg',
    carbon_offset_tonnes: 35, energy_per_transaction: '0.00056 kWh',
    token_concentration_pct: 33, trust_score: 67, chain_type: 'PoS',
    inflation_rate: 8.2, team_size: 47, treasury: 18400000,
    energy_consumption: 0.00056, whale_concentration: 28.7,
    created_at: '2022-07-08T10:00:00Z',
  },
];

// ── Metrics History (24 months with realistic patterns) ──────────

// Seeded PRNG for deterministic "random" data across sessions
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// Generate 24 months: Apr 2024 → Mar 2026
const MONTHS_24: string[] = [];
for (let y = 2024; y <= 2026; y++) {
  for (let m = (y === 2024 ? 4 : 1); m <= (y === 2026 ? 3 : 12); m++) {
    MONTHS_24.push(`${y}-${String(m).padStart(2, '0')}`);
  }
}

function genMetrics(
  startupId: string,
  baseRev: number,
  baseMau: number,
  annualGrowthPct: number,
  opts: {
    seasonality?: number;    // 0-1 strength of seasonal pattern
    volatility?: number;     // 0-1 revenue noise level
    costRatio?: number;      // base cost/revenue ratio
    dipMonth?: number;       // month index where a dip occurs (simulates real setbacks)
    dipMagnitude?: number;   // how bad the dip is (0-1)
    accelerating?: boolean;  // growth rate increases over time
  } = {},
): DbMetricsHistory[] {
  const rng = seededRng(startupId.split('').reduce((s, c) => s + c.charCodeAt(0), 0));
  const {
    seasonality = 0.1,
    volatility = 0.08,
    costRatio = 0.6,
    dipMonth = -1,
    dipMagnitude = 0.3,
    accelerating = false,
  } = opts;

  let rev = baseRev * 0.4; // Start at 40% of current (we're generating history)
  let mau = baseMau * 0.35;
  let costBase = rev * costRatio;
  const monthlyGrowth = annualGrowthPct / 100 / 12;

  return MONTHS_24.map((m, i) => {
    // Growth rate varies: accelerating startups speed up, others slow slightly
    const growthAdj = accelerating
      ? monthlyGrowth * (1 + i * 0.02)  // 2% acceleration per month
      : monthlyGrowth * (1 - i * 0.003); // Slight deceleration

    // Seasonal effect (Q4 stronger, Q1 weaker for B2B)
    const monthNum = parseInt(m.split('-')[1]);
    const seasonalFactor = 1 + seasonality * Math.sin((monthNum - 3) * Math.PI / 6);

    // Random noise (deterministic per startup)
    const noise = 1 + (rng() - 0.5) * 2 * volatility;

    // Dip event
    const dipFactor = (i === dipMonth) ? (1 - dipMagnitude)
      : (i === dipMonth + 1) ? (1 - dipMagnitude * 0.4) // Partial recovery
      : 1;

    // Apply growth
    rev *= (1 + growthAdj) * seasonalFactor * noise * dipFactor;
    mau *= (1 + growthAdj * 0.8) * (1 + (rng() - 0.5) * volatility * 0.6);
    costBase *= (1 + growthAdj * 0.5) * (1 + (rng() - 0.5) * volatility * 0.3);

    // Costs don't scale linearly with revenue (some fixed costs)
    const costs = costBase * 0.7 + rev * 0.2 + (rng() * rev * 0.05);

    // MoM growth rate (actual, computed from this month vs last)
    const prevRev = i > 0 ? rev / ((1 + growthAdj) * seasonalFactor * noise * dipFactor) : rev;
    const momGrowth = prevRev > 0 ? ((rev - prevRev) / prevRev) * 100 : 0;

    return {
      id: `${startupId}-${m}`,
      startup_id: startupId,
      month: m.split('-')[1],
      month_date: `${m}-01`,
      revenue: Math.max(0, Math.round(rev)),
      costs: Math.max(0, Math.round(costs)),
      mau: Math.max(0, Math.round(mau)),
      transactions: Math.max(0, Math.round(mau * (2.5 + rng() * 1.5))),
      carbon_offsets: Math.round(3 + i * 1.5 + rng() * 4),
      growth_rate: +momGrowth.toFixed(1),
    };
  });
}

export const DEMO_METRICS: DbMetricsHistory[] = [
  // Each startup has unique growth characteristics
  ...genMetrics('payflow', 142000, 12847, 28, { seasonality: 0.12, volatility: 0.06, costRatio: 0.55, accelerating: true }),
  ...genMetrics('cloudmetrics', 89500, 5234, 22, { seasonality: 0.15, volatility: 0.1, costRatio: 0.65, dipMonth: 14, dipMagnitude: 0.2 }),
  ...genMetrics('defiyield', 312000, 28100, 50, { seasonality: 0.08, volatility: 0.15, costRatio: 0.45, accelerating: true }),
  ...genMetrics('greenchain', 67000, 3800, 19, { seasonality: 0.2, volatility: 0.07, costRatio: 0.7 }),
  ...genMetrics('datavault', 185000, 8400, 35, { seasonality: 0.1, volatility: 0.12, costRatio: 0.5, dipMonth: 8, dipMagnitude: 0.15 }),
  ...genMetrics('tokenbridge', 228000, 15200, 40, { seasonality: 0.05, volatility: 0.18, costRatio: 0.4, accelerating: true }),
  ...genMetrics('solanaid', 45000, 42000, 65, { seasonality: 0.06, volatility: 0.2, costRatio: 0.75, accelerating: true }),
  ...genMetrics('nftmarket', 167000, 21000, 30, { seasonality: 0.25, volatility: 0.14, costRatio: 0.58, dipMonth: 18, dipMagnitude: 0.25 }),

  // ── Expanded ecosystem metrics (24 months each) ──
  ...genMetrics('vortex-dex', 1850000, 412000, 22, { seasonality: 0.08, volatility: 0.16, costRatio: 0.42, accelerating: false }),
  ...genMetrics('anchorage-liquid', 920000, 87400, 14, { seasonality: 0.06, volatility: 0.10, costRatio: 0.50 }),
  ...genMetrics('lend-so', 540000, 38200, 11, { seasonality: 0.09, volatility: 0.13, costRatio: 0.55, dipMonth: 12, dipMagnitude: 0.25 }),
  ...genMetrics('perp-void', 1240000, 52800, 38, { seasonality: 0.07, volatility: 0.22, costRatio: 0.40, accelerating: true }),
  ...genMetrics('tidal-amm', 480000, 64300, 17, { seasonality: 0.10, volatility: 0.12, costRatio: 0.52 }),
  ...genMetrics('phoenix-books', 312000, 18600, 25, { seasonality: 0.08, volatility: 0.14, costRatio: 0.48, accelerating: true }),
  ...genMetrics('pixel-trade', 690000, 138000, -2, { seasonality: 0.30, volatility: 0.20, costRatio: 0.62, dipMonth: 16, dipMagnitude: 0.30 }),
  ...genMetrics('craft-haus', 84000, 9400, 9, { seasonality: 0.18, volatility: 0.18, costRatio: 0.68 }),
  ...genMetrics('aero-pay', 240000, 14800, 44, { seasonality: 0.12, volatility: 0.09, costRatio: 0.50, accelerating: true }),
  ...genMetrics('strato-pay', 175000, 32500, 52, { seasonality: 0.10, volatility: 0.11, costRatio: 0.55, accelerating: true }),
  ...genMetrics('prism-wallet', 0, 384000, 26, { seasonality: 0.08, volatility: 0.10, costRatio: 0.85 }),
  ...genMetrics('lumen-labs', 1480000, 6200, 30, { seasonality: 0.07, volatility: 0.12, costRatio: 0.45 }),
  ...genMetrics('squad-vault', 380000, 4600, 18, { seasonality: 0.06, volatility: 0.08, costRatio: 0.50 }),
  ...genMetrics('gov-stream', 56000, 2100, 13, { seasonality: 0.10, volatility: 0.11, costRatio: 0.65 }),
  ...genMetrics('orbit-net', 1620000, 264000, 48, { seasonality: 0.06, volatility: 0.16, costRatio: 0.42, accelerating: true }),
  ...genMetrics('pixel-render', 950000, 19800, 64, { seasonality: 0.05, volatility: 0.18, costRatio: 0.50, accelerating: true }),
  ...genMetrics('terra-map', 220000, 41700, 36, { seasonality: 0.12, volatility: 0.18, costRatio: 0.62, dipMonth: 10, dipMagnitude: 0.20, accelerating: true }),
  ...genMetrics('geno-lab', 38000, 2900, 22, { seasonality: 0.11, volatility: 0.10, costRatio: 0.70 }),
  ...genMetrics('vanguard-ai', 460000, 11200, 78, { seasonality: 0.06, volatility: 0.18, costRatio: 0.55, accelerating: true }),
  ...genMetrics('verite-id', 165000, 87300, 28, { seasonality: 0.09, volatility: 0.10, costRatio: 0.58, accelerating: true }),
  ...genMetrics('whisper-chat', 28000, 156000, 10, { seasonality: 0.13, volatility: 0.16, costRatio: 0.72, dipMonth: 14, dipMagnitude: 0.18 }),
  ...genMetrics('drip-stream', 410000, 92800, 42, { seasonality: 0.18, volatility: 0.13, costRatio: 0.52, accelerating: true }),
  ...genMetrics('tideland-rwa', 720000, 8400, 60, { seasonality: 0.05, volatility: 0.07, costRatio: 0.35, accelerating: true }),
  ...genMetrics('echo-markets', 285000, 24600, 88, { seasonality: 0.14, volatility: 0.22, costRatio: 0.55, accelerating: true }),
  ...genMetrics('aurora-game', 540000, 318000, -6, { seasonality: 0.22, volatility: 0.18, costRatio: 0.66, dipMonth: 17, dipMagnitude: 0.30 }),
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
