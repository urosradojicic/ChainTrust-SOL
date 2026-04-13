/**
 * Finance Module — barrel export
 * All financial instruments and tools.
 */

export { createSafeTemplate, createSeriesTemplate, compareToMarket, calculateDilution } from '@/lib/term-sheet';
export { createCapTable, addPricedRound, runWaterfall, type CapTable } from '@/lib/cap-table';
export { createEscrowDeal, checkAllMilestones, type EscrowDeal } from '@/lib/milestone-escrow';
export { createMarket, executeTrade, calculateTradeCost, type PredictionMarket } from '@/lib/prediction-market';
export { createStreamingState, tickRewards, type StreamingRewardsState } from '@/lib/streaming-rewards';
export { runValuationSuite, type ValuationSuiteReport } from '@/lib/valuation-suite';
export { analyzeTimeSeries, type TimeSeriesReport } from '@/lib/time-series';
export { analyzeDealFlow, type DealFlowReport } from '@/lib/deal-flow-analytics';
export { decomposeProtocolRevenue, type ProtocolRevenueReport } from '@/lib/protocol-revenue';
export { scoreDeal, compareDealScores, type DealScore } from '@/lib/deal-scoring';
