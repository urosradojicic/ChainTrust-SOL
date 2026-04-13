/**
 * Cross-Chain Portfolio Tracker
 * ─────────────────────────────
 * Unified portfolio view across multiple blockchains.
 * Normalizes metrics from Solana, Ethereum, Base, Arbitrum, Polygon
 * into a single coherent portfolio view.
 *
 * In production: uses Wormhole/LayerZero for cross-chain queries.
 * This module provides the data model and aggregation logic.
 */

// ── Types ────────────────────────────────────────────────────────────

export type Chain = 'solana' | 'ethereum' | 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'avalanche' | 'bsc';

export interface ChainConfig {
  id: Chain;
  name: string;
  symbol: string;
  color: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeToken: string;
  avgBlockTime: number; // seconds
  avgTxCost: number; // USD
  consensus: string;
  tvl: number; // Total Value Locked (USD)
}

export interface CrossChainAsset {
  /** Asset ID (chain:address) */
  id: string;
  /** Chain */
  chain: Chain;
  /** Token/startup name */
  name: string;
  /** Symbol */
  symbol: string;
  /** Balance */
  balance: number;
  /** USD value */
  usdValue: number;
  /** Token contract address */
  contractAddress: string;
  /** Last updated */
  lastUpdated: number;
  /** Asset type */
  type: 'token' | 'nft' | 'lp_position' | 'staked' | 'investment';
}

export interface CrossChainPortfolio {
  /** All assets across chains */
  assets: CrossChainAsset[];
  /** Total portfolio value (USD) */
  totalValue: number;
  /** Value by chain */
  chainBreakdown: { chain: Chain; value: number; pct: number; assetCount: number }[];
  /** Value by asset type */
  typeBreakdown: { type: string; value: number; pct: number }[];
  /** Chain diversification score (0-1) */
  chainDiversification: number;
  /** Dominant chain */
  dominantChain: Chain;
  /** Total chains used */
  chainCount: number;
  /** Last sync timestamp */
  lastSyncAt: number;
}

export interface CrossChainTransaction {
  /** Transaction hash */
  hash: string;
  /** Chain */
  chain: Chain;
  /** Type */
  type: 'send' | 'receive' | 'swap' | 'bridge' | 'stake' | 'unstake' | 'invest';
  /** Amount (in native denomination) */
  amount: number;
  /** USD value at time of transaction */
  usdValue: number;
  /** From address */
  from: string;
  /** To address */
  to: string;
  /** Timestamp */
  timestamp: number;
  /** Status */
  status: 'confirmed' | 'pending' | 'failed';
  /** Gas fee (USD) */
  gasFee: number;
}

// ── Chain Configurations ─────────────────────────────────────────────

export const CHAINS: Record<Chain, ChainConfig> = {
  solana: {
    id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF',
    explorerUrl: 'https://solscan.io', rpcUrl: 'https://api.mainnet-beta.solana.com',
    nativeToken: 'SOL', avgBlockTime: 0.4, avgTxCost: 0.00025,
    consensus: 'Proof of Stake + Proof of History', tvl: 8500000000,
  },
  ethereum: {
    id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA',
    explorerUrl: 'https://etherscan.io', rpcUrl: 'https://eth.llamarpc.com',
    nativeToken: 'ETH', avgBlockTime: 12, avgTxCost: 5.0,
    consensus: 'Proof of Stake', tvl: 45000000000,
  },
  base: {
    id: 'base', name: 'Base', symbol: 'ETH', color: '#0052FF',
    explorerUrl: 'https://basescan.org', rpcUrl: 'https://mainnet.base.org',
    nativeToken: 'ETH', avgBlockTime: 2, avgTxCost: 0.01,
    consensus: 'Optimistic Rollup', tvl: 3200000000,
  },
  arbitrum: {
    id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', color: '#28A0F0',
    explorerUrl: 'https://arbiscan.io', rpcUrl: 'https://arb1.arbitrum.io/rpc',
    nativeToken: 'ETH', avgBlockTime: 0.25, avgTxCost: 0.02,
    consensus: 'Optimistic Rollup', tvl: 4100000000,
  },
  polygon: {
    id: 'polygon', name: 'Polygon', symbol: 'MATIC', color: '#8247E5',
    explorerUrl: 'https://polygonscan.com', rpcUrl: 'https://polygon-rpc.com',
    nativeToken: 'MATIC', avgBlockTime: 2, avgTxCost: 0.005,
    consensus: 'Proof of Stake', tvl: 1800000000,
  },
  optimism: {
    id: 'optimism', name: 'Optimism', symbol: 'ETH', color: '#FF0420',
    explorerUrl: 'https://optimistic.etherscan.io', rpcUrl: 'https://mainnet.optimism.io',
    nativeToken: 'ETH', avgBlockTime: 2, avgTxCost: 0.015,
    consensus: 'Optimistic Rollup', tvl: 2600000000,
  },
  avalanche: {
    id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', color: '#E84142',
    explorerUrl: 'https://snowtrace.io', rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    nativeToken: 'AVAX', avgBlockTime: 2, avgTxCost: 0.03,
    consensus: 'Snowman Consensus', tvl: 1200000000,
  },
  bsc: {
    id: 'bsc', name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B',
    explorerUrl: 'https://bscscan.com', rpcUrl: 'https://bsc-dataseed.binance.org',
    nativeToken: 'BNB', avgBlockTime: 3, avgTxCost: 0.05,
    consensus: 'Proof of Staked Authority', tvl: 5400000000,
  },
};

// ── Portfolio Aggregation ────────────────────────────────────────────

/**
 * Aggregate assets into a unified cross-chain portfolio view.
 */
export function aggregatePortfolio(assets: CrossChainAsset[]): CrossChainPortfolio {
  const totalValue = assets.reduce((s, a) => s + a.usdValue, 0);

  // Chain breakdown
  const chainMap = new Map<Chain, { value: number; count: number }>();
  for (const asset of assets) {
    const existing = chainMap.get(asset.chain) ?? { value: 0, count: 0 };
    existing.value += asset.usdValue;
    existing.count++;
    chainMap.set(asset.chain, existing);
  }
  const chainBreakdown = Array.from(chainMap.entries())
    .map(([chain, data]) => ({
      chain,
      value: data.value,
      pct: totalValue > 0 ? +(data.value / totalValue * 100).toFixed(1) : 0,
      assetCount: data.count,
    }))
    .sort((a, b) => b.value - a.value);

  // Type breakdown
  const typeMap = new Map<string, number>();
  for (const asset of assets) {
    typeMap.set(asset.type, (typeMap.get(asset.type) ?? 0) + asset.usdValue);
  }
  const typeBreakdown = Array.from(typeMap.entries())
    .map(([type, value]) => ({
      type,
      value,
      pct: totalValue > 0 ? +(value / totalValue * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Chain diversification (1 - HHI of chain allocations)
  const chainPcts = chainBreakdown.map(c => c.pct / 100);
  const hhi = chainPcts.reduce((s, p) => s + p * p, 0);
  const chainDiversification = +(1 - hhi).toFixed(3);

  const dominantChain = chainBreakdown.length > 0 ? chainBreakdown[0].chain : 'solana';

  return {
    assets,
    totalValue,
    chainBreakdown,
    typeBreakdown,
    chainDiversification,
    dominantChain,
    chainCount: chainMap.size,
    lastSyncAt: Date.now(),
  };
}

/**
 * Generate a demo cross-chain portfolio.
 */
export function generateDemoPortfolio(): CrossChainPortfolio {
  const assets: CrossChainAsset[] = [
    { id: 'sol:cmt', chain: 'solana', name: 'ChainTrust CMT', symbol: 'CMT', balance: 25000, usdValue: 12500, contractAddress: 'CMT...abc', lastUpdated: Date.now(), type: 'staked' },
    { id: 'sol:usdc', chain: 'solana', name: 'USDC', symbol: 'USDC', balance: 50000, usdValue: 50000, contractAddress: 'USDC...xyz', lastUpdated: Date.now(), type: 'token' },
    { id: 'sol:sol', chain: 'solana', name: 'Solana', symbol: 'SOL', balance: 150, usdValue: 22500, contractAddress: 'native', lastUpdated: Date.now(), type: 'token' },
    { id: 'sol:payflow', chain: 'solana', name: 'PayFlow Investment', symbol: 'PAYFLOW', balance: 1, usdValue: 200000, contractAddress: 'PF...inv', lastUpdated: Date.now(), type: 'investment' },
    { id: 'eth:usdc', chain: 'ethereum', name: 'USDC', symbol: 'USDC', balance: 30000, usdValue: 30000, contractAddress: '0xa0b8...', lastUpdated: Date.now(), type: 'token' },
    { id: 'eth:eth', chain: 'ethereum', name: 'Ethereum', symbol: 'ETH', balance: 5, usdValue: 15000, contractAddress: 'native', lastUpdated: Date.now(), type: 'token' },
    { id: 'base:usdc', chain: 'base', name: 'USDC', symbol: 'USDC', balance: 15000, usdValue: 15000, contractAddress: '0xb2f8...', lastUpdated: Date.now(), type: 'token' },
    { id: 'arb:defi', chain: 'arbitrum', name: 'DeFi LP Position', symbol: 'LP-ETH-USDC', balance: 10, usdValue: 25000, contractAddress: '0xc3d9...', lastUpdated: Date.now(), type: 'lp_position' },
  ];

  return aggregatePortfolio(assets);
}

/**
 * Get explorer URL for a transaction on a specific chain.
 */
export function getExplorerUrl(chain: Chain, hash: string): string {
  const config = CHAINS[chain];
  return `${config.explorerUrl}/tx/${hash}`;
}

/**
 * Compare cost of verification across chains.
 */
export function compareVerificationCosts(): { chain: Chain; cost: number; time: number }[] {
  return Object.values(CHAINS)
    .map(c => ({
      chain: c.id,
      cost: c.avgTxCost,
      time: c.avgBlockTime,
    }))
    .sort((a, b) => a.cost - b.cost);
}
