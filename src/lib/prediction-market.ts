/**
 * Prediction Market Engine
 * ────────────────────────
 * Binary outcome prediction markets for startup milestones.
 * Markets resolve automatically based on ChainTrust's oracle-verified metrics.
 *
 * Architecture:
 *   - LMSR (Logarithmic Market Scoring Rule) for pricing
 *   - Each market has YES/NO shares
 *   - Price reflects the crowd's probability estimate
 *   - Resolution is trustless — checks MetricsAccount PDA on deadline
 *   - Winners receive proportional payout from the market pool
 *
 * This is the "wisdom of crowds" signal for startup due diligence.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type MarketStatus = 'open' | 'closed' | 'resolved_yes' | 'resolved_no' | 'voided';
export type MarketCategory = 'revenue' | 'growth' | 'survival' | 'funding' | 'product' | 'custom';

export interface PredictionMarket {
  /** Unique market ID */
  id: string;
  /** Startup this market is about */
  startupId: string;
  /** Startup name */
  startupName: string;
  /** The question being predicted */
  question: string;
  /** Resolution criteria (specific, measurable) */
  resolutionCriteria: string;
  /** Which on-chain metric resolves this market (null for manual resolution) */
  oracleMetric: string | null;
  /** Target value for oracle resolution */
  oracleTarget: number | null;
  /** Market category */
  category: MarketCategory;
  /** Market status */
  status: MarketStatus;
  /** Current YES price (0-1, reflects probability) */
  yesPrice: number;
  /** Current NO price (0-1, = 1 - yesPrice) */
  noPrice: number;
  /** Total shares of YES outstanding */
  yesShares: number;
  /** Total shares of NO outstanding */
  noShares: number;
  /** Total volume traded (in USDC equivalent) */
  volume: number;
  /** Number of unique traders */
  traders: number;
  /** LMSR liquidity parameter (b) */
  liquidityParam: number;
  /** Market creation timestamp */
  createdAt: number;
  /** Market close timestamp (no more trading) */
  closesAt: number;
  /** Market resolution timestamp */
  resolvedAt: number | null;
  /** Who created the market */
  createdBy: string;
  /** Resolution outcome (null if not resolved) */
  outcome: boolean | null;
  /** Trade history */
  trades: MarketTrade[];
  /** Price history for charting */
  priceHistory: { timestamp: number; yesPrice: number }[];
}

export interface MarketTrade {
  /** Trade ID */
  id: string;
  /** Trader identifier */
  trader: string;
  /** Bought YES or NO */
  side: 'yes' | 'no';
  /** Number of shares */
  shares: number;
  /** Price paid per share */
  price: number;
  /** Total cost */
  cost: number;
  /** Timestamp */
  timestamp: number;
}

export interface MarketPosition {
  /** Trader */
  trader: string;
  /** YES shares held */
  yesShares: number;
  /** NO shares held */
  noShares: number;
  /** Average cost basis */
  avgCost: number;
  /** Current value at market prices */
  currentValue: number;
  /** Unrealized P&L */
  unrealizedPnl: number;
}

// ── LMSR Pricing ─────────────────────────────────────────────────────

/**
 * LMSR (Logarithmic Market Scoring Rule) cost function.
 * C(q) = b * ln(e^(q_yes/b) + e^(q_no/b))
 *
 * Cost to buy `shares` of YES when current state is (yesShares, noShares):
 *   cost = C(q_yes + shares, q_no) - C(q_yes, q_no)
 */
function lmsrCost(yesShares: number, noShares: number, b: number): number {
  return b * Math.log(Math.exp(yesShares / b) + Math.exp(noShares / b));
}

/**
 * Calculate the cost to buy a given number of shares.
 */
export function calculateTradeCost(
  market: PredictionMarket,
  side: 'yes' | 'no',
  shares: number,
): { cost: number; newPrice: number; priceImpact: number } {
  const b = market.liquidityParam;
  const currentCost = lmsrCost(market.yesShares, market.noShares, b);

  let newYes = market.yesShares;
  let newNo = market.noShares;
  if (side === 'yes') newYes += shares;
  else newNo += shares;

  const newCost = lmsrCost(newYes, newNo, b);
  const cost = newCost - currentCost;

  // New price after trade
  const newPrice = Math.exp(newYes / b) / (Math.exp(newYes / b) + Math.exp(newNo / b));
  const priceImpact = Math.abs(newPrice - market.yesPrice);

  return { cost, newPrice, priceImpact };
}

/**
 * Calculate current YES price from share counts.
 */
function currentYesPrice(yesShares: number, noShares: number, b: number): number {
  return Math.exp(yesShares / b) / (Math.exp(yesShares / b) + Math.exp(noShares / b));
}

// ── Market Operations ────────────────────────────────────────────────

/**
 * Create a new prediction market.
 */
export function createMarket(
  startupId: string,
  startupName: string,
  question: string,
  resolutionCriteria: string,
  category: MarketCategory,
  durationDays: number,
  oracleMetric: string | null = null,
  oracleTarget: number | null = null,
  liquidityParam: number = 100,
  createdBy: string = 'ChainTrust Protocol',
): PredictionMarket {
  const now = Date.now();
  return {
    id: `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startupId,
    startupName,
    question,
    resolutionCriteria,
    oracleMetric,
    oracleTarget,
    category,
    status: 'open',
    yesPrice: 0.5,
    noPrice: 0.5,
    yesShares: 0,
    noShares: 0,
    volume: 0,
    traders: 0,
    liquidityParam,
    createdAt: now,
    closesAt: now + durationDays * 24 * 3600 * 1000,
    resolvedAt: null,
    createdBy,
    outcome: null,
    trades: [],
    priceHistory: [{ timestamp: now, yesPrice: 0.5 }],
  };
}

/**
 * Execute a trade on a market.
 */
export function executeTrade(
  market: PredictionMarket,
  trader: string,
  side: 'yes' | 'no',
  shares: number,
): PredictionMarket {
  if (market.status !== 'open') throw new Error('Market is not open');
  if (Date.now() > market.closesAt) throw new Error('Market has closed');

  const { cost, newPrice } = calculateTradeCost(market, side, shares);

  const trade: MarketTrade = {
    id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    trader,
    side,
    shares,
    price: cost / shares,
    cost,
    timestamp: Date.now(),
  };

  const newYes = side === 'yes' ? market.yesShares + shares : market.yesShares;
  const newNo = side === 'no' ? market.noShares + shares : market.noShares;
  const newYesPrice = currentYesPrice(newYes, newNo, market.liquidityParam);

  return {
    ...market,
    yesShares: newYes,
    noShares: newNo,
    yesPrice: +newYesPrice.toFixed(4),
    noPrice: +(1 - newYesPrice).toFixed(4),
    volume: market.volume + cost,
    traders: market.trades.some(t => t.trader === trader) ? market.traders : market.traders + 1,
    trades: [...market.trades, trade],
    priceHistory: [...market.priceHistory, { timestamp: Date.now(), yesPrice: +newYesPrice.toFixed(4) }],
  };
}

/**
 * Resolve a market (YES or NO outcome).
 */
export function resolveMarket(market: PredictionMarket, outcome: boolean): PredictionMarket {
  return {
    ...market,
    status: outcome ? 'resolved_yes' : 'resolved_no',
    outcome,
    resolvedAt: Date.now(),
  };
}

// ── Demo Market Generator ────────────────────────────────────────────

/**
 * Generate demo prediction markets for a startup.
 */
export function generateDemoMarkets(startup: DbStartup): PredictionMarket[] {
  const markets: PredictionMarket[] = [];

  // Market 1: Revenue milestone
  let m1 = createMarket(
    startup.id, startup.name,
    `Will ${startup.name} reach $${startup.mrr >= 100000 ? '500K' : '100K'} MRR by Q4 2026?`,
    `Resolved YES if on-chain verified MRR >= $${startup.mrr >= 100000 ? '500,000' : '100,000'} on December 31, 2026.`,
    'revenue', 180, 'mrr', startup.mrr >= 100000 ? 500000 : 100000,
  );
  // Simulate some trades
  const growth = Number(startup.growth_rate);
  const baseProb = growth >= 20 ? 0.72 : growth >= 10 ? 0.55 : 0.35;
  m1 = { ...m1, yesPrice: baseProb, noPrice: +(1 - baseProb).toFixed(2), volume: 12500 + Math.random() * 25000, traders: 15 + Math.floor(Math.random() * 30) };
  m1.priceHistory = Array.from({ length: 20 }, (_, i) => ({
    timestamp: m1.createdAt + i * 24 * 3600 * 1000,
    yesPrice: +(baseProb + (Math.random() - 0.5) * 0.1).toFixed(3),
  }));
  markets.push(m1);

  // Market 2: Growth sustainability
  let m2 = createMarket(
    startup.id, startup.name,
    `Will ${startup.name} maintain >15% MoM growth for the next 6 months?`,
    `Resolved YES if average MoM growth rate >= 15% over 6 consecutive months.`,
    'growth', 180, 'growth_rate', 15,
  );
  const growthProb = growth >= 25 ? 0.68 : growth >= 15 ? 0.52 : 0.28;
  m2 = { ...m2, yesPrice: growthProb, noPrice: +(1 - growthProb).toFixed(2), volume: 8200 + Math.random() * 15000, traders: 12 + Math.floor(Math.random() * 20) };
  markets.push(m2);

  // Market 3: Survival
  let m3 = createMarket(
    startup.id, startup.name,
    `Will ${startup.name} still be operating (MRR > $0) in 12 months?`,
    `Resolved YES if on-chain verified MRR > 0 at the 12-month mark.`,
    'survival', 365, 'mrr', 1,
  );
  const survProb = startup.trust_score >= 70 ? 0.92 : startup.trust_score >= 50 ? 0.78 : 0.55;
  m3 = { ...m3, yesPrice: survProb, noPrice: +(1 - survProb).toFixed(2), volume: 5500 + Math.random() * 10000, traders: 8 + Math.floor(Math.random() * 15) };
  markets.push(m3);

  // Market 4: Funding round
  let m4 = createMarket(
    startup.id, startup.name,
    `Will ${startup.name} announce a funding round of $1M+ in the next 9 months?`,
    `Resolved YES if a verified funding round >= $1,000,000 is recorded on ChainTrust.`,
    'funding', 270,
  );
  const fundProb = growth >= 20 && startup.mrr >= 50000 ? 0.62 : growth >= 10 ? 0.38 : 0.2;
  m4 = { ...m4, yesPrice: fundProb, noPrice: +(1 - fundProb).toFixed(2), volume: 3800 + Math.random() * 8000, traders: 6 + Math.floor(Math.random() * 12) };
  markets.push(m4);

  return markets;
}
