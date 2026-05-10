/**
 * Risk Module — barrel export
 * Quantitative risk, regulatory, geopolitical, ESG.
 */

export { analyzeQuantRisk, type QuantRiskReport } from '@/lib/intelligence/quant-risk';
export { optimizePortfolio, type PortfolioAnalysis } from '@/lib/intelligence/portfolio-optimizer';
export { calculateReturns, calculatePortfolioReturns, type ReturnMetrics } from '@/lib/intelligence/return-calculator';
export { generateSignals, type SignalDashboard } from '@/lib/intelligence/signal-engine';
export { analyzeFXRisk, type FXRiskReport } from '@/lib/intelligence/fx-engine';
export { analyzeLiquidity, type LiquidityReport } from '@/lib/intelligence/liquidity-analysis';
export { generateComplianceReport, type ComplianceReport } from '@/lib/intelligence/regulatory-compliance';
export { analyzeAPACRegulatory, type APACReport } from '@/lib/intelligence/apac-regulatory';
export { analyzeGeopoliticalRisk, type GeopoliticalReport } from '@/lib/intelligence/geopolitical-risk';
export { generateESGReport, type ESGReport } from '@/lib/intelligence/esg-taxonomy';
export { analyzeMacroEnvironment, type MacroReport } from '@/lib/intelligence/macro-indicators';
