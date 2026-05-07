/**
 * Analysis Module — barrel export
 * All AI, ML, and analytics engines in one namespace.
 */

// AI & Analytics
export { analyzeRedFlags, type RedFlagReport, type RedFlag } from '@/lib/intelligence/red-flag-detection';
export { computeReputationScore, type ReputationScore } from '@/lib/intelligence/reputation-score';
export { verifyAllClaims, type ClaimVerificationReport } from '@/lib/intelligence/claim-verification';
export { generateInvestmentMemo, type InvestmentMemo } from '@/lib/intelligence/investment-memo';
export { analyzeCompetitiveLandscape, type CompetitiveReport } from '@/lib/intelligence/competitive-intel';
export { analyzeCohorts, type CohortReport } from '@/lib/intelligence/cohort-analysis';
export { analyzeRevenueQuality, type RevenueQualityReport } from '@/lib/intelligence/revenue-quality';
export { scoreFounder, type FounderScore } from '@/lib/intelligence/founder-score';
export { analyzeAuditTrail, type AuditIntelligenceReport } from '@/lib/intelligence/audit-intelligence';
export { analyzeGovernance, type GovernanceReport } from '@/lib/intelligence/governance-analytics';

// Machine Learning
export { detectAnomalies, type IsolationForestResult } from '@/lib/intelligence/isolation-forest';
export { runGradientBoosting, type GBReport } from '@/lib/intelligence/gradient-boost';
export { recognizePatterns, type PatternReport } from '@/lib/intelligence/pattern-recognition';

// Statistics
export { mannWhitneyU, kolmogorovSmirnov, welchTTest, runTestSuite, type TestResult } from '@/lib/intelligence/statistical-tests';
export { runBayesianInference, type BayesianReport } from '@/lib/intelligence/bayesian-inference';
