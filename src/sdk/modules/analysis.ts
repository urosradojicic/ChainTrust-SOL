/**
 * Analysis Module — barrel export
 * All AI, ML, and analytics engines in one namespace.
 */

// AI & Analytics
export { analyzeRedFlags, type RedFlagReport, type RedFlag } from '@/lib/red-flag-detection';
export { computeReputationScore, type ReputationScore } from '@/lib/reputation-score';
export { verifyAllClaims, type ClaimVerificationReport } from '@/lib/claim-verification';
export { generateInvestmentMemo, type InvestmentMemo } from '@/lib/investment-memo';
export { analyzeCompetitiveLandscape, type CompetitiveReport } from '@/lib/competitive-intel';
export { analyzeCohorts, type CohortReport } from '@/lib/cohort-analysis';
export { analyzeRevenueQuality, type RevenueQualityReport } from '@/lib/revenue-quality';
export { scoreFounder, type FounderScore } from '@/lib/founder-score';
export { analyzeAuditTrail, type AuditIntelligenceReport } from '@/lib/audit-intelligence';
export { analyzeGovernance, type GovernanceReport } from '@/lib/governance-analytics';

// Machine Learning
export { detectAnomalies, type IsolationForestResult } from '@/lib/isolation-forest';
export { runGradientBoosting, type GBReport } from '@/lib/gradient-boost';
export { recognizePatterns, type PatternReport } from '@/lib/pattern-recognition';

// Statistics
export { mannWhitneyU, kolmogorovSmirnov, welchTTest, runTestSuite, type TestResult } from '@/lib/statistical-tests';
export { runBayesianInference, type BayesianReport } from '@/lib/bayesian-inference';
