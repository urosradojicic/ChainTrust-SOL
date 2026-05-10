import type { SustainabilityData } from '@/components/SustainabilityScore';

export interface TokenDistribution {
  label: string;
  value: number;
  color: string;
}

export interface FundingRound {
  round: string;
  amount: number;
  date: string;
  valuation: number;
}

export interface Pledge {
  text: string;
  dateCommitted: string;
  active: boolean;
}

export interface ExtendedData {
  teamSize: number;
  foundedDate: string;
  treasury: number;
  financials: { month: string; revenue: number; costs: number; profit: number }[];
  fundingRounds: FundingRound[];
  tokenDistribution: TokenDistribution[];
  vestingSchedule: { period: string; unlocked: number }[];
  whaleConcentration: number;
  inflationRate: number;
  sdgAlignment: number[];
  energyConsumption: number;
  carbonOffsetHistory: { month: string; tons: number }[];
  pledges: Pledge[];
  platformAvgSustainability: number;
}

export interface StartupData {
  id: string;
  name: string;
  category: string;
  verified: boolean;
  trustScore: number;
  mrr: number;
  users: number;
  growth: number;
  mrrHistory: number[];
  description: string;
  website: string;
  registeredAt: number;
  owner: string;
  burnRate: number;
  runway: number;
  carbonOffset: number;
  revenueHistory: { month: string; value: number }[];
  userHistory: { month: string; value: number }[];
  carbonHistory: { month: string; value: number }[];
  metricsHistory: { date: string; mrr: number; users: number; growth: number; verified: boolean }[];
  txHash: string;
  blockNumber: number;
  sustainability: SustainabilityData;
  extended: ExtendedData;
}

const MONTHS_12 = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const MONTHS_6 = ['Oct','Nov','Dec','Jan','Feb','Mar'];

function makeFinancials(revs: number[], costBase: number): { month: string; revenue: number; costs: number; profit: number }[] {
  return MONTHS_12.map((m, i) => ({ month: m, revenue: revs[i], costs: costBase, profit: revs[i] - costBase }));
}

function makeCarbonHist(vals: number[]): { month: string; tons: number }[] {
  return MONTHS_6.map((m, i) => ({ month: m, tons: vals[i] }));
}

function makeRevHist(vals: number[]): { month: string; value: number }[] {
  return MONTHS_6.map((m, i) => ({ month: m, value: vals[i] }));
}

function makeUserHist(vals: number[]): { month: string; value: number }[] {
  return MONTHS_6.map((m, i) => ({ month: m, value: vals[i] }));
}

const defaultTokenDist: TokenDistribution[] = [
  { label: 'Community', value: 35, color: '#10B981' },
  { label: 'Team', value: 20, color: '#534AB7' },
  { label: 'Investors', value: 18, color: '#3B82F6' },
  { label: 'Treasury', value: 15, color: '#EAB308' },
  { label: 'Liquidity', value: 12, color: '#F97316' },
];

const defaultVesting = [
  { period: 'Month 0', unlocked: 10 }, { period: 'Month 6', unlocked: 15 },
  { period: 'Year 1', unlocked: 25 }, { period: 'Year 2', unlocked: 50 },
  { period: 'Year 3', unlocked: 75 }, { period: 'Year 4', unlocked: 100 },
];

export const STARTUPS: StartupData[] = [
  {
    id: 'payflow', name: 'PayFlow', category: 'Fintech', verified: true, trustScore: 92,
    mrr: 125000, users: 15000, growth: 12.5,
    mrrHistory: [78000, 85000, 92000, 101000, 112000, 125000],
    description: 'Next-generation payment infrastructure for Web3 businesses. Seamless fiat on/off ramps with instant settlement.',
    website: 'https://payflow.example.com', registeredAt: 1695830400,
    owner: '7Kp2xN4mB8vR3qF5wT9dL1hJ6cY0zU2sA4eG8',
    burnRate: 45000, runway: 18, carbonOffset: 34,
    revenueHistory: makeRevHist([78000, 85000, 92000, 101000, 112000, 125000]),
    userHistory: makeUserHist([9200, 10500, 11800, 12900, 14100, 15000]),
    carbonHistory: makeRevHist([12, 15, 18, 22, 28, 34]),
    metricsHistory: [
      { date: '2025-10-01', mrr: 78000, users: 9200, growth: 8.2, verified: true },
      { date: '2025-11-01', mrr: 85000, users: 10500, growth: 9.0, verified: true },
      { date: '2025-12-01', mrr: 92000, users: 11800, growth: 8.2, verified: true },
      { date: '2026-01-01', mrr: 101000, users: 12900, growth: 9.8, verified: true },
      { date: '2026-02-01', mrr: 112000, users: 14100, growth: 10.9, verified: true },
      { date: '2026-03-01', mrr: 125000, users: 15000, growth: 12.5, verified: true },
    ],
    txHash: '5Ht9kZ3bN7qRx2wLm4pTv8jFc1dS6eYgA0nKuP9hXr3mBwQ7tRz1vLk5jN8pF',
    blockNumber: 14523891,
    sustainability: {
      overall: 82,
      energyEfficiency: { score: 23, chain: 'Solana (PoS)', energyPerTx: '0.001 kWh' },
      carbonOffset: { score: 20, purchased: true, tons: 34 },
      tokenomicsHealth: { score: 21, concentration: 'Low', inflation: '2%', vesting: '4yr linear' },
      governancePledges: { score: 18, pledgesCount: 4, pledges: ['Net Zero 2027', 'Green Hosting', 'Carbon Reporting', 'Fair Token Distribution'] },
    },
    extended: {
      teamSize: 24, foundedDate: '2023-06-15', treasury: 2800000,
      financials: makeFinancials([65000,70000,72000,75000,78000,80000,85000,92000,98000,108000,118000,125000], 45000),
      fundingRounds: [
        { round: 'Pre-Seed', amount: 500000, date: '2023-06', valuation: 3000000 },
        { round: 'Seed', amount: 2500000, date: '2024-01', valuation: 12000000 },
        { round: 'Series A', amount: 8000000, date: '2025-03', valuation: 45000000 },
      ],
      tokenDistribution: defaultTokenDist,
      vestingSchedule: defaultVesting,
      whaleConcentration: 32, inflationRate: 2.0,
      sdgAlignment: [7, 9, 11, 13],
      energyConsumption: 120,
      carbonOffsetHistory: makeCarbonHist([12, 15, 18, 22, 28, 34]),
      pledges: [
        { text: 'Achieve Net Zero emissions by 2027', dateCommitted: '2024-01-15', active: true },
        { text: '100% renewable-powered hosting', dateCommitted: '2024-03-01', active: true },
        { text: 'Publish quarterly carbon reports', dateCommitted: '2024-06-01', active: true },
        { text: 'Fair token distribution (no >20% single holder)', dateCommitted: '2024-09-01', active: true },
      ],
      platformAvgSustainability: 62,
    },
  },
  {
    id: 'cloudmetrics', name: 'CloudMetrics', category: 'SaaS', verified: true, trustScore: 87,
    mrr: 89000, users: 8200, growth: 8.3,
    mrrHistory: [62000, 68000, 72000, 78000, 82000, 89000],
    description: 'Cloud infrastructure monitoring with AI-powered anomaly detection and cost optimization.',
    website: 'https://cloudmetrics.example.com', registeredAt: 1696435200,
    owner: '9Rt4wQ6nD1zL5xK3mB7jF8vH2pS0cY4eG6aU',
    burnRate: 35000, runway: 24, carbonOffset: 16,
    revenueHistory: makeRevHist([62000, 68000, 72000, 78000, 82000, 89000]),
    userHistory: makeUserHist([5800, 6200, 6700, 7200, 7700, 8200]),
    carbonHistory: makeRevHist([5, 7, 9, 11, 14, 16]),
    metricsHistory: [
      { date: '2025-10-01', mrr: 62000, users: 5800, growth: 6.1, verified: true },
      { date: '2025-11-01', mrr: 68000, users: 6200, growth: 9.7, verified: true },
      { date: '2025-12-01', mrr: 72000, users: 6700, growth: 5.9, verified: true },
      { date: '2026-01-01', mrr: 78000, users: 7200, growth: 8.3, verified: true },
      { date: '2026-02-01', mrr: 82000, users: 7700, growth: 5.1, verified: true },
      { date: '2026-03-01', mrr: 89000, users: 8200, growth: 8.3, verified: true },
    ],
    txHash: '3Jw7nQ1kT4pRx8vLm2hBz6jFc9dS5eYgA0wKuP3rXn7mBtQ1zRk4vLj8pN5sF',
    blockNumber: 14523950,
    sustainability: {
      overall: 71,
      energyEfficiency: { score: 22, chain: 'Solana (PoS)', energyPerTx: '0.001 kWh' },
      carbonOffset: { score: 14, purchased: true, tons: 16 },
      tokenomicsHealth: { score: 19, concentration: 'Medium', inflation: '3%', vesting: '3yr cliff' },
      governancePledges: { score: 16, pledgesCount: 3, pledges: ['Green Hosting', 'Carbon Reporting', 'Open Source Commitment'] },
    },
    extended: {
      teamSize: 18, foundedDate: '2023-09-01', treasury: 1500000,
      financials: makeFinancials([45000,48000,52000,55000,58000,60000,62000,68000,72000,78000,82000,89000], 35000),
      fundingRounds: [
        { round: 'Pre-Seed', amount: 300000, date: '2023-09', valuation: 2000000 },
        { round: 'Seed', amount: 1800000, date: '2024-04', valuation: 8000000 },
      ],
      tokenDistribution: [
        { label: 'Community', value: 30, color: '#10B981' }, { label: 'Team', value: 25, color: '#534AB7' },
        { label: 'Investors', value: 20, color: '#3B82F6' }, { label: 'Treasury', value: 15, color: '#EAB308' },
        { label: 'Liquidity', value: 10, color: '#F97316' },
      ],
      vestingSchedule: defaultVesting,
      whaleConcentration: 41, inflationRate: 3.0,
      sdgAlignment: [9, 12, 13],
      energyConsumption: 95,
      carbonOffsetHistory: makeCarbonHist([5, 7, 9, 11, 14, 16]),
      pledges: [
        { text: '100% renewable-powered hosting', dateCommitted: '2024-04-01', active: true },
        { text: 'Publish quarterly carbon reports', dateCommitted: '2024-07-01', active: true },
        { text: 'Open source core infrastructure', dateCommitted: '2024-10-01', active: true },
      ],
      platformAvgSustainability: 62,
    },
  },
  {
    id: 'defiyield', name: 'DeFiYield', category: 'DeFi', verified: true, trustScore: 78,
    mrr: 210000, users: 5100, growth: 22.1,
    mrrHistory: [95000, 120000, 140000, 165000, 185000, 210000],
    description: 'Automated yield optimization across DeFi protocols with risk-adjusted strategies.',
    website: 'https://defiyield.example.com', registeredAt: 1697040000,
    owner: '3Mf8hN2kT6pR9wV1xL4jB5qS7cD0eY3gA8zU',
    burnRate: 80000, runway: 12, carbonOffset: 8,
    revenueHistory: makeRevHist([95000, 120000, 140000, 165000, 185000, 210000]),
    userHistory: makeUserHist([2100, 2800, 3300, 3900, 4500, 5100]),
    carbonHistory: makeRevHist([2, 3, 4, 5, 6, 8]),
    metricsHistory: [
      { date: '2025-10-01', mrr: 95000, users: 2100, growth: 15.2, verified: true },
      { date: '2025-11-01', mrr: 120000, users: 2800, growth: 26.3, verified: true },
      { date: '2025-12-01', mrr: 140000, users: 3300, growth: 16.7, verified: true },
      { date: '2026-01-01', mrr: 165000, users: 3900, growth: 17.9, verified: true },
      { date: '2026-02-01', mrr: 185000, users: 4500, growth: 12.1, verified: true },
      { date: '2026-03-01', mrr: 210000, users: 5100, growth: 22.1, verified: true },
    ],
    txHash: '2Km4xR8wT1nLp5vB9jFz3hSc7dQ6eYgA0kKuP2rXm8sBtN4zRj1vLk7pQ5nF',
    blockNumber: 14524100,
    sustainability: {
      overall: 48,
      energyEfficiency: { score: 20, chain: 'Solana (PoS)', energyPerTx: '0.002 kWh' },
      carbonOffset: { score: 8, purchased: false, tons: 8 },
      tokenomicsHealth: { score: 10, concentration: 'High', inflation: '8%', vesting: '1yr cliff' },
      governancePledges: { score: 10, pledgesCount: 2, pledges: ['Carbon Reporting', 'DAO Governance'] },
    },
    extended: {
      teamSize: 12, foundedDate: '2023-10-20', treasury: 4200000,
      financials: makeFinancials([50000,60000,72000,85000,95000,105000,120000,140000,155000,170000,190000,210000], 80000),
      fundingRounds: [
        { round: 'Seed', amount: 3000000, date: '2023-11', valuation: 15000000 },
        { round: 'Series A', amount: 12000000, date: '2025-01', valuation: 60000000 },
      ],
      tokenDistribution: [
        { label: 'Community', value: 25, color: '#10B981' }, { label: 'Team', value: 22, color: '#534AB7' },
        { label: 'Investors', value: 28, color: '#3B82F6' }, { label: 'Treasury', value: 15, color: '#EAB308' },
        { label: 'Liquidity', value: 10, color: '#F97316' },
      ],
      vestingSchedule: [
        { period: 'Month 0', unlocked: 20 }, { period: 'Month 3', unlocked: 35 },
        { period: 'Month 6', unlocked: 50 }, { period: 'Year 1', unlocked: 100 },
      ],
      whaleConcentration: 58, inflationRate: 8.0,
      sdgAlignment: [9, 13],
      energyConsumption: 340,
      carbonOffsetHistory: makeCarbonHist([2, 3, 4, 5, 6, 8]),
      pledges: [
        { text: 'Publish quarterly carbon reports', dateCommitted: '2024-08-01', active: true },
        { text: 'Transition to DAO governance', dateCommitted: '2025-01-01', active: true },
      ],
      platformAvgSustainability: 62,
    },
  },
  {
    id: 'greenchain', name: 'GreenChain', category: 'Cleantech', verified: true, trustScore: 95,
    mrr: 45000, users: 3200, growth: 15.7,
    mrrHistory: [22000, 27000, 31000, 36000, 40000, 45000],
    description: 'Blockchain-verified carbon credit marketplace connecting offset projects with enterprises.',
    website: 'https://greenchain.example.com', registeredAt: 1697644800,
    owner: '5Jw1vP9sK4nR7mX2tL6hB3qF8cD0eY5gA9zU',
    burnRate: 20000, runway: 36, carbonOffset: 480,
    revenueHistory: makeRevHist([22000, 27000, 31000, 36000, 40000, 45000]),
    userHistory: makeUserHist([1400, 1800, 2100, 2500, 2900, 3200]),
    carbonHistory: makeRevHist([120, 185, 245, 310, 390, 480]),
    metricsHistory: [
      { date: '2025-10-01', mrr: 22000, users: 1400, growth: 10.0, verified: true },
      { date: '2025-11-01', mrr: 27000, users: 1800, growth: 22.7, verified: true },
      { date: '2025-12-01', mrr: 31000, users: 2100, growth: 14.8, verified: true },
      { date: '2026-01-01', mrr: 36000, users: 2500, growth: 16.1, verified: true },
      { date: '2026-02-01', mrr: 40000, users: 2900, growth: 11.1, verified: true },
      { date: '2026-03-01', mrr: 45000, users: 3200, growth: 15.7, verified: true },
    ],
    txHash: '4Nw9yQ2kT7pRx1vLm5hBz3jFc8dS6eYgA0nKuP4rXw9mBtQ2zRk5vLj1pN8sF',
    blockNumber: 14524200,
    sustainability: {
      overall: 96,
      energyEfficiency: { score: 25, chain: 'Solana (PoS)', energyPerTx: '0.0005 kWh' },
      carbonOffset: { score: 25, purchased: true, tons: 480 },
      tokenomicsHealth: { score: 22, concentration: 'Low', inflation: '1.5%', vesting: '5yr linear' },
      governancePledges: { score: 24, pledgesCount: 6, pledges: ['Net Zero 2025', 'Green Hosting', 'Carbon Reporting', 'Renewable Energy', 'Fair Token Distribution', 'Community Treasury'] },
    },
    extended: {
      teamSize: 15, foundedDate: '2023-08-10', treasury: 1200000,
      financials: makeFinancials([12000,15000,18000,20000,22000,24000,27000,31000,34000,38000,42000,45000], 20000),
      fundingRounds: [
        { round: 'Pre-Seed', amount: 250000, date: '2023-08', valuation: 1500000 },
        { round: 'Seed', amount: 1500000, date: '2024-02', valuation: 7000000 },
      ],
      tokenDistribution: [
        { label: 'Community', value: 40, color: '#10B981' }, { label: 'Team', value: 15, color: '#534AB7' },
        { label: 'Investors', value: 15, color: '#3B82F6' }, { label: 'Treasury', value: 20, color: '#EAB308' },
        { label: 'Liquidity', value: 10, color: '#F97316' },
      ],
      vestingSchedule: [
        { period: 'Month 0', unlocked: 5 }, { period: 'Year 1', unlocked: 15 },
        { period: 'Year 2', unlocked: 35 }, { period: 'Year 3', unlocked: 55 },
        { period: 'Year 4', unlocked: 80 }, { period: 'Year 5', unlocked: 100 },
      ],
      whaleConcentration: 18, inflationRate: 1.5,
      sdgAlignment: [7, 9, 11, 12, 13, 15],
      energyConsumption: 45,
      carbonOffsetHistory: makeCarbonHist([120, 185, 245, 310, 390, 480]),
      pledges: [
        { text: 'Achieve Net Zero by 2025', dateCommitted: '2023-09-01', active: true },
        { text: '100% renewable-powered hosting', dateCommitted: '2023-10-01', active: true },
        { text: 'Publish quarterly carbon reports', dateCommitted: '2023-12-01', active: true },
        { text: '100% renewable energy sourcing', dateCommitted: '2024-01-15', active: true },
        { text: 'Fair token distribution (no >15% single holder)', dateCommitted: '2024-03-01', active: true },
        { text: 'Community-controlled treasury', dateCommitted: '2024-06-01', active: true },
      ],
      platformAvgSustainability: 62,
    },
  },
  {
    id: 'datavault', name: 'DataVault', category: 'SaaS', verified: false, trustScore: 65,
    mrr: 67000, users: 12000, growth: 5.2,
    mrrHistory: [52000, 55000, 58000, 61000, 64000, 67000],
    description: 'Encrypted data storage and sharing platform with zero-knowledge proof verification.',
    website: 'https://datavault.example.com', registeredAt: 1698249600,
    owner: '8Gn3xQ7wT2kL5pR9mV1jB6hF4cD0sY2eA8zU',
    burnRate: 55000, runway: 8, carbonOffset: 13,
    revenueHistory: makeRevHist([52000, 55000, 58000, 61000, 64000, 67000]),
    userHistory: makeUserHist([9500, 10100, 10600, 11000, 11500, 12000]),
    carbonHistory: makeRevHist([8, 9, 10, 11, 12, 13]),
    metricsHistory: [
      { date: '2025-10-01', mrr: 52000, users: 9500, growth: 4.0, verified: false },
      { date: '2025-11-01', mrr: 55000, users: 10100, growth: 5.8, verified: false },
      { date: '2025-12-01', mrr: 58000, users: 10600, growth: 5.5, verified: false },
      { date: '2026-01-01', mrr: 61000, users: 11000, growth: 5.2, verified: false },
      { date: '2026-02-01', mrr: 64000, users: 11500, growth: 4.9, verified: false },
      { date: '2026-03-01', mrr: 67000, users: 12000, growth: 5.2, verified: false },
    ],
    txHash: '6Pw3zR7wT4nLp8vB2jFk1hSc5dQ9eYgA0mKuP6rXz3sBtN7kRj4vLw1pQ8nF',
    blockNumber: 14524350,
    sustainability: {
      overall: 55,
      energyEfficiency: { score: 21, chain: 'Solana (PoS)', energyPerTx: '0.001 kWh' },
      carbonOffset: { score: 12, purchased: true, tons: 13 },
      tokenomicsHealth: { score: 13, concentration: 'Medium', inflation: '5%', vesting: '2yr cliff' },
      governancePledges: { score: 9, pledgesCount: 2, pledges: ['Carbon Reporting', 'Open Source Commitment'] },
    },
    extended: {
      teamSize: 22, foundedDate: '2023-07-20', treasury: 900000,
      financials: makeFinancials([38000,40000,42000,45000,48000,50000,52000,55000,58000,61000,64000,67000], 55000),
      fundingRounds: [
        { round: 'Pre-Seed', amount: 400000, date: '2023-07', valuation: 2500000 },
        { round: 'Seed', amount: 2000000, date: '2024-03', valuation: 10000000 },
      ],
      tokenDistribution: defaultTokenDist,
      vestingSchedule: [
        { period: 'Month 0', unlocked: 15 }, { period: 'Month 6', unlocked: 25 },
        { period: 'Year 1', unlocked: 50 }, { period: 'Year 2', unlocked: 100 },
      ],
      whaleConcentration: 44, inflationRate: 5.0,
      sdgAlignment: [9, 12],
      energyConsumption: 180,
      carbonOffsetHistory: makeCarbonHist([8, 9, 10, 11, 12, 13]),
      pledges: [
        { text: 'Publish quarterly carbon reports', dateCommitted: '2024-05-01', active: true },
        { text: 'Open source core infrastructure', dateCommitted: '2024-08-01', active: true },
      ],
      platformAvgSustainability: 62,
    },
  },
  {
    id: 'tokenbridge', name: 'TokenBridge', category: 'DeFi', verified: false, trustScore: 43,
    mrr: 156000, users: 9800, growth: -3.4,
    mrrHistory: [180000, 175000, 170000, 165000, 160000, 156000],
    description: 'Cross-chain bridge protocol enabling seamless token transfers between L1 and L2 networks.',
    website: 'https://tokenbridge.example.com', registeredAt: 1698854400,
    owner: '4Hs6yR1wK8nT3pV5mX9jL2qB7cF0dS4eG6aU',
    burnRate: 120000, runway: 6, carbonOffset: 5,
    revenueHistory: makeRevHist([180000, 175000, 170000, 165000, 160000, 156000]),
    userHistory: makeUserHist([11200, 10900, 10600, 10300, 10000, 9800]),
    carbonHistory: makeRevHist([3, 3, 4, 4, 5, 5]),
    metricsHistory: [
      { date: '2025-10-01', mrr: 180000, users: 11200, growth: -1.5, verified: false },
      { date: '2025-11-01', mrr: 175000, users: 10900, growth: -2.8, verified: false },
      { date: '2025-12-01', mrr: 170000, users: 10600, growth: -2.9, verified: false },
      { date: '2026-01-01', mrr: 165000, users: 10300, growth: -2.9, verified: false },
      { date: '2026-02-01', mrr: 160000, users: 10000, growth: -3.0, verified: false },
      { date: '2026-03-01', mrr: 156000, users: 9800, growth: -3.4, verified: false },
    ],
    txHash: '1Qw5xR9kT2nLp6vB4jFz8hSc3dQ7eYgA0wKuP1rXx5mBtQ9zRn2vLk6pJ3sF',
    blockNumber: 14524500,
    sustainability: {
      overall: 22,
      energyEfficiency: { score: 15, chain: 'Multi-chain', energyPerTx: '0.01 kWh' },
      carbonOffset: { score: 3, purchased: false, tons: 5 },
      tokenomicsHealth: { score: 2, concentration: 'Very High', inflation: '12%', vesting: 'No vesting' },
      governancePledges: { score: 2, pledgesCount: 1, pledges: ['DAO Governance'] },
    },
    extended: {
      teamSize: 8, foundedDate: '2023-11-01', treasury: 7500000,
      financials: makeFinancials([200000,195000,192000,188000,185000,183000,180000,175000,170000,165000,160000,156000], 120000),
      fundingRounds: [
        { round: 'Seed', amount: 5000000, date: '2023-12', valuation: 25000000 },
      ],
      tokenDistribution: [
        { label: 'Community', value: 15, color: '#10B981' }, { label: 'Team', value: 30, color: '#534AB7' },
        { label: 'Investors', value: 35, color: '#3B82F6' }, { label: 'Treasury', value: 12, color: '#EAB308' },
        { label: 'Liquidity', value: 8, color: '#F97316' },
      ],
      vestingSchedule: [
        { period: 'Month 0', unlocked: 40 }, { period: 'Month 3', unlocked: 60 },
        { period: 'Month 6', unlocked: 80 }, { period: 'Year 1', unlocked: 100 },
      ],
      whaleConcentration: 72, inflationRate: 12.0,
      sdgAlignment: [9],
      energyConsumption: 890,
      carbonOffsetHistory: makeCarbonHist([3, 3, 4, 4, 5, 5]),
      pledges: [
        { text: 'Transition to DAO governance', dateCommitted: '2025-02-01', active: true },
      ],
      platformAvgSustainability: 62,
    },
  },
];

export const ACTIVITY_FEED = [
  { text: 'PayFlow published monthly metrics', color: 'bg-blue-500', time: '5 min ago' },
  { text: 'DeFiYield verified by Chainlink oracle', color: 'bg-emerald-500', time: '12 min ago' },
  { text: 'New startup GreenChain registered', color: 'bg-primary', time: '1 hr ago' },
  { text: 'CloudMetrics earned Gold Badge', color: 'bg-amber-500', time: '2 hrs ago' },
  { text: 'TokenBridge trust score updated', color: 'bg-orange-500', time: '3 hrs ago' },
  { text: 'DataVault connected Stripe API', color: 'bg-cyan-500', time: '5 hrs ago' },
];

export const PROPOSALS = [
  { id: 1, title: 'Increase verification fee to 500 CMT', description: 'Proposal to raise the oracle verification fee from 100 CMT to 500 CMT to ensure higher quality submissions.', status: 'Active' as const, forVotes: 325000, againstVotes: 175000, abstainVotes: 50000, endDate: '2026-04-05', proposer: '7Kp2xN4mB8vR3qF5wT9dL1hJ6cY0zU2sA4eG8' },
  { id: 2, title: 'Add NFT marketplace category', description: 'Introduce a new NFT Marketplace category to attract web3-native startups building NFT infrastructure.', status: 'Active' as const, forVotes: 492000, againstVotes: 108000, abstainVotes: 30000, endDate: '2026-04-03', proposer: '9Rt4wQ6nD1zL5xK3mB7jF8vH2pS0cY4eG6aU' },
  { id: 3, title: 'Fund ecosystem grants - 50K CMT', description: 'Allocate 50,000 CMT from treasury to fund ecosystem grants for builders integrating with ChainTrust.', status: 'Active' as const, forVotes: 225000, againstVotes: 275000, abstainVotes: 100000, endDate: '2026-04-07', proposer: '3Mf8hN2kT6pR9wV1xL4jB5qS7cD0eY3gA8zU' },
  { id: 4, title: 'Reduce quorum to 3%', description: 'Lower the governance quorum from 4% to 3% to enable faster decision-making.', status: 'Passed' as const, forVotes: 546000, againstVotes: 54000, abstainVotes: 20000, endDate: '2026-03-15', proposer: '5Jw1vP9sK4nR7mX2tL6hB3qF8cD0eY5gA9zU' },
  { id: 5, title: 'Add burn mechanism to staking rewards', description: 'Implement a 2% burn on staking rewards to create deflationary pressure on CMT supply.', status: 'Passed' as const, forVotes: 438000, againstVotes: 162000, abstainVotes: 40000, endDate: '2026-03-10', proposer: '8Gn3xQ7wT2kL5pR9mV1jB6hF4cD0sY2eA8zU' },
  { id: 6, title: 'Remove Cleantech category', description: 'Proposal to remove the Cleantech category due to low adoption and merge into a broader "Impact" category.', status: 'Defeated' as const, forVotes: 115000, againstVotes: 385000, abstainVotes: 60000, endDate: '2026-03-08', proposer: '4Hs6yR1wK8nT3pV5mX9jL2qB7cF0dS4eG6aU' },
];

export const CATEGORIES = ['All', 'Fintech', 'SaaS', 'DeFi', 'Cleantech', 'Supply Chain', 'Data', 'Infrastructure', 'Identity', 'NFT'];

export const TIERS = [
  { name: 'Free', minStake: 0, color: '#9CA3AF', features: ['View public metrics', 'Basic dashboard'] },
  { name: 'Basic', minStake: 100, color: '#3B82F6', features: ['Historical data access', 'Category filters', 'Email alerts'] },
  { name: 'Pro', minStake: 1000, color: '#A855F7', features: ['Raw data & API', 'Advanced analytics', 'Priority support'] },
  { name: 'Whale', minStake: 10000, color: '#F59E0B', features: ['Everything in Pro', 'Real-time alerts', 'Direct startup chat', 'Governance boost'] },
];
