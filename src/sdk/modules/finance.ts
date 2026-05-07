/**
 * Finance Module — barrel export
 * All financial instruments and tools.
 */

export { createSafeTemplate, createSeriesTemplate, compareToMarket, calculateDilution } from '@/lib/intelligence/term-sheet';
export { createCapTable, addPricedRound, runWaterfall, type CapTable } from '@/lib/intelligence/cap-table';
export { createEscrowDeal, checkAllMilestones, type EscrowDeal } from '@/lib/solana/milestone-escrow';
export { createMarket, executeTrade, calculateTradeCost, type PredictionMarket } from '@/lib/intelligence/prediction-market';
export { createStreamingState, tickRewards, type StreamingRewardsState } from '@/lib/solana/streaming-rewards';
export { runValuationSuite, type ValuationSuiteReport } from '@/lib/intelligence/valuation-suite';
export { analyzeTimeSeries, type TimeSeriesReport } from '@/lib/intelligence/time-series';
export { analyzeDealFlow, type DealFlowReport } from '@/lib/intelligence/deal-flow-analytics';
export { decomposeProtocolRevenue, type ProtocolRevenueReport } from '@/lib/intelligence/protocol-revenue';
export { scoreDeal, compareDealScores, type DealScore } from '@/lib/intelligence/deal-scoring';
