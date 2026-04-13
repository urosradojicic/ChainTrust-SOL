/**
 * Risk Module — barrel export
 * Quantitative risk, regulatory, geopolitical, ESG.
 */

export { analyzeQuantRisk, type QuantRiskReport } from '@/lib/quant-risk';
export { optimizePortfolio, type PortfolioAnalysis } from '@/lib/portfolio-optimizer';
export { calculateReturns, calculatePortfolioReturns, type ReturnMetrics } from '@/lib/return-calculator';
export { generateSignals, type SignalDashboard } from '@/lib/signal-engine';
export { analyzeFXRisk, type FXRiskReport } from '@/lib/fx-engine';
export { analyzeLiquidity, type LiquidityReport } from '@/lib/liquidity-analysis';
export { generateComplianceReport, type ComplianceReport } from '@/lib/regulatory-compliance';
export { analyzeAPACRegulatory, type APACReport } from '@/lib/apac-regulatory';
export { analyzeGeopoliticalRisk, type GeopoliticalReport } from '@/lib/geopolitical-risk';
export { generateESGReport, type ESGReport } from '@/lib/esg-taxonomy';
export { analyzeMacroEnvironment, type MacroReport } from '@/lib/macro-indicators';
