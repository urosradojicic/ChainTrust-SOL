/**
 * Engine Registry
 * ───────────────
 * Central registry of all ChainTrust engines.
 * Enables lazy loading, dependency tracking, and capability discovery.
 *
 * Enterprise integration: query what's available before calling it.
 */

// ── Types ────────────────────────────────────────────────────────────

export type EngineCategory =
  | 'ai'
  | 'ml'
  | 'statistics'
  | 'quant'
  | 'finance'
  | 'intelligence'
  | 'simulation'
  | 'experience'
  | 'infrastructure'
  | 'regulatory'
  | 'crypto'
  | 'visualization';

export interface EngineMetadata {
  /** Unique engine ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category */
  category: EngineCategory;
  /** Description */
  description: string;
  /** Module path (for lazy loading) */
  modulePath: string;
  /** Exported function names */
  exports: string[];
  /** Dependencies (other engine IDs) */
  dependencies: string[];
  /** Required data inputs */
  inputs: string[];
  /** Data outputs */
  outputs: string[];
  /** Whether this engine requires startup data */
  requiresStartupData: boolean;
  /** Whether this engine requires metrics history */
  requiresMetrics: boolean;
  /** Whether this engine requires peer comparison data */
  requiresPeers: boolean;
  /** Computational complexity */
  complexity: 'O(1)' | 'O(n)' | 'O(n²)' | 'O(n·log·n)';
  /** Version */
  version: string;
}

// ── Engine Registry ──────────────────────────────────────────────────

const ENGINES: EngineMetadata[] = [
  // AI & Analytics
  { id: 'red-flag-detection', name: 'Red Flag Detection', category: 'ai', description: 'Statistical anomaly detection across 6 categories', modulePath: '@/lib/red-flag-detection', exports: ['analyzeRedFlags'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['RedFlagReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'reputation-score', name: 'ChainTrust Score (CTS)', category: 'ai', description: 'Multi-dimensional reputation scoring (100-point, 6 components)', modulePath: '@/lib/reputation-score', exports: ['computeReputationScore'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['ReputationScore'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'claim-verification', name: 'Claim Verification', category: 'ai', description: 'Cross-references startup claims against verified data', modulePath: '@/lib/claim-verification', exports: ['verifyAllClaims'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['ClaimVerificationReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'investment-memo', name: 'Investment Memo', category: 'ai', description: 'Generates institutional-grade investment memos', modulePath: '@/lib/investment-memo', exports: ['generateInvestmentMemo'], dependencies: ['red-flag-detection', 'reputation-score', 'survival-predictor'], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['InvestmentMemo'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'competitive-intel', name: 'Competitive Intelligence', category: 'intelligence', description: 'Competitive landscape analysis with moat identification', modulePath: '@/lib/competitive-intel', exports: ['analyzeCompetitiveLandscape'], dependencies: [], inputs: ['startup', 'allStartups'], outputs: ['CompetitiveReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n²)', version: '1.0.0' },
  { id: 'cohort-analysis', name: 'Cohort Analysis', category: 'ai', description: 'Retention curves, unit economics, PMF detection', modulePath: '@/lib/cohort-analysis', exports: ['analyzeCohorts'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['CohortReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'revenue-quality', name: 'Revenue Quality', category: 'ai', description: 'Revenue quality scoring across 7 dimensions', modulePath: '@/lib/revenue-quality', exports: ['analyzeRevenueQuality'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['RevenueQualityReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'founder-score', name: 'Founder Score', category: 'ai', description: 'Founder/team capability assessment (6 dimensions)', modulePath: '@/lib/founder-score', exports: ['scoreFounder'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['FounderScore'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'audit-intelligence', name: 'Audit Intelligence', category: 'ai', description: 'Data manipulation detection from audit trails', modulePath: '@/lib/audit-intelligence', exports: ['analyzeAuditTrail'], dependencies: [], inputs: ['startup', 'auditEntries', 'metrics'], outputs: ['AuditIntelligenceReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'governance-analytics', name: 'Governance Analytics', category: 'ai', description: 'DAO governance health and voting pattern analysis', modulePath: '@/lib/governance-analytics', exports: ['analyzeGovernance'], dependencies: [], inputs: ['proposals', 'votes'], outputs: ['GovernanceReport'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'ai-agent', name: 'AI Agent Orchestrator', category: 'ai', description: '5 autonomous agent types for portfolio monitoring', modulePath: '@/lib/ai-agent', exports: ['initializeOrchestrator', 'runOrchestrationCycle'], dependencies: [], inputs: ['startups', 'portfolioIds'], outputs: ['AgentOrchestrator'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },

  // Machine Learning
  { id: 'isolation-forest', name: 'Isolation Forest', category: 'ml', description: 'ML anomaly detection with random binary trees', modulePath: '@/lib/isolation-forest', exports: ['detectAnomalies'], dependencies: [], inputs: ['startups'], outputs: ['IsolationForestResult'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n·log·n)', version: '1.0.0' },
  { id: 'gradient-boost', name: 'Gradient Boosting', category: 'ml', description: 'Client-side gradient boosting for success prediction', modulePath: '@/lib/gradient-boost', exports: ['runGradientBoosting'], dependencies: [], inputs: ['startup', 'allStartups'], outputs: ['GBReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n²)', version: '1.0.0' },
  { id: 'pattern-recognition', name: 'Pattern Recognition', category: 'ml', description: '8 growth pattern classifiers (T2D3, hockey stick, etc.)', modulePath: '@/lib/pattern-recognition', exports: ['recognizePatterns'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['PatternReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },

  // Statistics
  { id: 'statistical-tests', name: 'Statistical Tests', category: 'statistics', description: 'Mann-Whitney U, KS test, Welch t-test, proportion test', modulePath: '@/lib/statistical-tests', exports: ['mannWhitneyU', 'kolmogorovSmirnov', 'welchTTest', 'proportionTest', 'runTestSuite'], dependencies: [], inputs: ['group1', 'group2'], outputs: ['TestResult[]'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n·log·n)', version: '1.0.0' },
  { id: 'bayesian-inference', name: 'Bayesian Inference', category: 'statistics', description: 'Bayesian belief updating for startup metrics', modulePath: '@/lib/bayesian-inference', exports: ['runBayesianInference'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['BayesianReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },

  // Quantitative Finance
  { id: 'quant-risk', name: 'Quantitative Risk', category: 'quant', description: 'VaR, Sharpe, Sortino, Calmar, Beta, Alpha, factor decomposition', modulePath: '@/lib/quant-risk', exports: ['analyzeQuantRisk'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups', 'allMetrics'], outputs: ['QuantRiskReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n²)', version: '1.0.0' },
  { id: 'portfolio-optimizer', name: 'Portfolio Optimizer', category: 'quant', description: 'Markowitz efficient frontier for startups', modulePath: '@/lib/portfolio-optimizer', exports: ['optimizePortfolio'], dependencies: [], inputs: ['startups', 'allMetrics'], outputs: ['PortfolioAnalysis'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n²)', version: '1.0.0' },
  { id: 'return-calculator', name: 'Return Calculator', category: 'quant', description: 'IRR, TVPI, DPI, RVPI, MOIC with portfolio aggregation', modulePath: '@/lib/return-calculator', exports: ['calculateReturns', 'calculatePortfolioReturns'], dependencies: [], inputs: ['cashFlows', 'currentValuation'], outputs: ['ReturnMetrics'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'signal-engine', name: 'Signal Engine', category: 'quant', description: 'Momentum, mean reversion, cross-sectional, quality signals', modulePath: '@/lib/signal-engine', exports: ['generateSignals'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['SignalDashboard'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'fx-engine', name: 'FX Engine', category: 'quant', description: 'Multi-currency exposure, FX VaR, hedging analysis', modulePath: '@/lib/fx-engine', exports: ['analyzeFXRisk'], dependencies: [], inputs: ['holdings'], outputs: ['FXRiskReport'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },

  // Financial Instruments
  { id: 'term-sheet', name: 'Term Sheet Builder', category: 'finance', description: 'SAFE, convertible note, series preferred with market benchmarks', modulePath: '@/lib/term-sheet', exports: ['createSafeTemplate', 'createSeriesTemplate', 'compareToMarket', 'calculateDilution'], dependencies: [], inputs: ['investmentAmount'], outputs: ['TermSheet'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'cap-table', name: 'Cap Table', category: 'finance', description: 'Shareholder registry with waterfall analysis', modulePath: '@/lib/cap-table', exports: ['createCapTable', 'addPricedRound', 'runWaterfall'], dependencies: [], inputs: ['companyName', 'founders'], outputs: ['CapTable'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'milestone-escrow', name: 'Milestone Escrow', category: 'finance', description: 'Programmable money — oracle-verified auto-release', modulePath: '@/lib/milestone-escrow', exports: ['createEscrowDeal', 'checkAllMilestones'], dependencies: [], inputs: ['startupId', 'milestones'], outputs: ['EscrowDeal'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'prediction-market', name: 'Prediction Market', category: 'finance', description: 'LMSR binary markets resolved by oracle data', modulePath: '@/lib/prediction-market', exports: ['createMarket', 'executeTrade', 'calculateTradeCost'], dependencies: [], inputs: ['startupId', 'question'], outputs: ['PredictionMarket'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'streaming-rewards', name: 'Streaming Rewards', category: 'finance', description: 'Per-second staking reward calculation', modulePath: '@/lib/streaming-rewards', exports: ['createStreamingState', 'tickRewards'], dependencies: [], inputs: ['stakedAmount'], outputs: ['StreamingRewardsState'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'valuation-suite', name: 'Valuation Suite', category: 'finance', description: '5 valuation methods with confidence-weighted synthesis', modulePath: '@/lib/valuation-suite', exports: ['runValuationSuite'], dependencies: [], inputs: ['startup', 'allStartups'], outputs: ['ValuationSuiteReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'time-series', name: 'Time-Series Analysis', category: 'finance', description: 'Trend decomposition, changepoint detection, forecasting', modulePath: '@/lib/time-series', exports: ['analyzeTimeSeries'], dependencies: [], inputs: ['metrics'], outputs: ['TimeSeriesReport'], requiresStartupData: false, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'deal-flow-analytics', name: 'Deal Flow Analytics', category: 'finance', description: 'Funnel metrics, conversion rates, pipeline velocity', modulePath: '@/lib/deal-flow-analytics', exports: ['analyzeDealFlow'], dependencies: ['investment-flow'], inputs: ['deals'], outputs: ['DealFlowReport'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },

  // Deep Intelligence
  { id: 'startup-dna', name: 'Startup DNA', category: 'intelligence', description: '16-dimensional fingerprint with archetype classification', modulePath: '@/lib/startup-dna', exports: ['generateDNAFingerprint'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups', 'allMetrics'], outputs: ['DNAFingerprint'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n²)', version: '1.0.0' },
  { id: 'network-effects', name: 'Network Effects', category: 'intelligence', description: 'Identifies and quantifies 5 types of network effects', modulePath: '@/lib/network-effects', exports: ['analyzeNetworkEffects'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['NetworkEffectAnalysis'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'moat-scorer', name: 'Moat Scorer', category: 'intelligence', description: 'Buffett-style 6-moat competitive analysis', modulePath: '@/lib/moat-scorer', exports: ['analyzeMoatDepth'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['MoatReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'tokenomics-simulator', name: 'Tokenomics Simulator', category: 'intelligence', description: '24-month supply/demand dynamics projection', modulePath: '@/lib/tokenomics-simulator', exports: ['simulateTokenomics'], dependencies: [], inputs: ['startup'], outputs: ['TokenomicsReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'execution-velocity', name: 'Execution Velocity', category: 'intelligence', description: 'Shipping speed metrics with peer comparison', modulePath: '@/lib/execution-velocity', exports: ['trackExecutionVelocity'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['ExecutionVelocityReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },

  // Alpha Extraction
  { id: 'liquidity-analysis', name: 'Liquidity Analysis', category: 'quant', description: 'AMM slippage modeling, exit time, depth levels', modulePath: '@/lib/liquidity-analysis', exports: ['analyzeLiquidity'], dependencies: [], inputs: ['startup'], outputs: ['LiquidityReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'smart-money', name: 'Smart Money Tracker', category: 'intelligence', description: 'Whale wallet intelligence and flow direction', modulePath: '@/lib/smart-money', exports: ['analyzeSmartMoney'], dependencies: [], inputs: ['startup'], outputs: ['SmartMoneyReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'protocol-revenue', name: 'Protocol Revenue', category: 'finance', description: 'Real yield vs inflationary yield decomposition', modulePath: '@/lib/protocol-revenue', exports: ['decomposeProtocolRevenue'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['ProtocolRevenueReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'conviction-tracker', name: 'Conviction Tracker', category: 'experience', description: 'Investment decision journal with bias detection', modulePath: '@/lib/conviction-tracker', exports: ['logDecision', 'reviewOutcome', 'computeConvictionStats'], dependencies: [], inputs: ['startupId', 'decision', 'thesis'], outputs: ['ConvictionEntry'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'deal-scoring', name: 'Deal Scoring', category: 'finance', description: '14-criteria weighted scoring matrix', modulePath: '@/lib/deal-scoring', exports: ['scoreDeal', 'compareDealScores'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['DealScore'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'lifecycle-detector', name: 'Lifecycle Detector', category: 'intelligence', description: '7-stage lifecycle with transition signals', modulePath: '@/lib/lifecycle-detector', exports: ['detectLifecycle'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['LifecycleReport'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },

  // Simulation
  { id: 'monte-carlo', name: 'Monte Carlo', category: 'simulation', description: '5000-iteration stochastic simulation with fan charts', modulePath: '@/lib/monte-carlo', exports: ['runSimulation'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['SimulationResult'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'survival-predictor', name: 'Survival Predictor', category: 'simulation', description: 'Probability estimates for survival and success', modulePath: '@/lib/survival-predictor', exports: ['predictSurvival'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['SurvivalPrediction'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'scenario-planning', name: 'Scenario Planning', category: 'simulation', description: 'What-if analysis with 8 scenario templates', modulePath: '@/lib/scenario-planning', exports: ['runScenarioAnalysis'], dependencies: [], inputs: ['startup', 'metrics'], outputs: ['ScenarioComparison'], requiresStartupData: true, requiresMetrics: true, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'auto-simulator', name: 'Auto Simulator', category: 'simulation', description: 'Background processing with RAF job queue', modulePath: '@/lib/auto-simulator', exports: ['autoSimulator', 'initializeAutoSimulator'], dependencies: ['monte-carlo', 'red-flag-detection', 'reputation-score', 'survival-predictor'], inputs: ['startups', 'allMetrics'], outputs: ['SimulationCache'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },

  // Experience
  { id: 'narrative-engine', name: 'Narrative Engine', category: 'experience', description: 'Transforms metrics into compelling human stories', modulePath: '@/lib/narrative-engine', exports: ['generateStartupNarrative', 'generateCardInsight'], dependencies: [], inputs: ['startup', 'metrics', 'allStartups'], outputs: ['StartupNarrative'], requiresStartupData: true, requiresMetrics: true, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'command-palette', name: 'Command Palette', category: 'experience', description: 'Fuzzy search across pages, startups, actions', modulePath: '@/lib/command-palette', exports: ['searchCommands', 'getRecentPages'], dependencies: [], inputs: ['query', 'startups'], outputs: ['CommandSearchResult'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'feature-discovery', name: 'Feature Discovery', category: 'experience', description: 'Contextual hints that teach without overwhelming', modulePath: '@/lib/feature-discovery', exports: ['getContextualHint', 'dismissHint'], dependencies: [], inputs: ['currentPage'], outputs: ['FeatureHint'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'investor-engagement', name: 'Investor Engagement', category: 'experience', description: 'Daily briefings, streaks, achievements, onboarding', modulePath: '@/lib/investor-engagement', exports: ['generateDailyBriefing', 'recordLogin', 'getAchievements'], dependencies: [], inputs: ['portfolioStartups', 'allStartups'], outputs: ['DailyBriefing'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'investor-preferences', name: 'Investor Preferences', category: 'experience', description: '8 investor type presets with personalization', modulePath: '@/lib/investor-preferences', exports: ['loadPreferences', 'savePreferences', 'createFromPreset'], dependencies: [], inputs: ['investorType'], outputs: ['InvestorPreferences'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },

  // Infrastructure
  { id: 'nl-query', name: 'Natural Language Query', category: 'infrastructure', description: 'Pattern-matching NLP for database queries', modulePath: '@/lib/nl-query', exports: ['executeQuery'], dependencies: [], inputs: ['query', 'startups'], outputs: ['QueryResult'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'wallet-abstraction', name: 'Wallet Abstraction', category: 'infrastructure', description: 'Provider-agnostic wallet interface', modulePath: '@/lib/wallet-abstraction', exports: ['createBrowserExtensionAdapter', 'sendAbstractedTransaction'], dependencies: [], inputs: [], outputs: ['WalletAdapter'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'solana-actions', name: 'Solana Actions', category: 'infrastructure', description: 'Shareable verification Blinks for social media', modulePath: '@/lib/solana-actions', exports: ['generateVerifyBlink', 'generateShareableLink'], dependencies: [], inputs: ['startup'], outputs: ['BlinkMetadata'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'deal-room', name: 'Deal Room', category: 'infrastructure', description: 'Data room with SHA-256 document hashing', modulePath: '@/lib/deal-room', exports: ['createDealRoom', 'addDocument', 'hashDocument'], dependencies: [], inputs: ['startupId'], outputs: ['DealRoom'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'investment-flow', name: 'Investment Flow', category: 'infrastructure', description: '9-stage pipeline with 24-item DD checklist', modulePath: '@/lib/investment-flow', exports: ['createDeal', 'advanceDeal', 'calculatePipelineStats'], dependencies: [], inputs: ['startupId'], outputs: ['PipelineDeal'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'dd-workflow', name: 'DD Workflow', category: 'infrastructure', description: 'Interactive 7-phase due diligence process', modulePath: '@/lib/dd-workflow', exports: ['createDDWorkflow', 'updateDDItem', 'runAutoChecks'], dependencies: [], inputs: ['startupId'], outputs: ['DDWorkflow'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'smart-alerts', name: 'Smart Alerts', category: 'infrastructure', description: 'Configurable threshold-based alert system', modulePath: '@/lib/smart-alerts', exports: ['evaluateAlerts', 'initializeDefaultRules'], dependencies: [], inputs: ['rules', 'startups'], outputs: ['Alert[]'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'token-gating', name: 'Token Gating', category: 'infrastructure', description: '37 features mapped to 4 CMT staking tiers', modulePath: '@/lib/token-gating', exports: ['checkAccess', 'getUserTier', 'getFeaturesForTier'], dependencies: [], inputs: ['featureId', 'stakedCMT'], outputs: ['AccessCheckResult'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'benchmarking', name: 'Benchmarking', category: 'infrastructure', description: '12-metric percentile ranking system', modulePath: '@/lib/benchmarking', exports: ['generateBenchmarkReport'], dependencies: [], inputs: ['startup', 'allStartups'], outputs: ['BenchmarkReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n)', version: '1.0.0' },
  { id: 'investor-matching', name: 'Investor Matching', category: 'infrastructure', description: '8-dimension thesis matching with 5 templates', modulePath: '@/lib/investor-matching', exports: ['matchInvestorThesis'], dependencies: [], inputs: ['thesis', 'startups'], outputs: ['MatchReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'market-timing', name: 'Market Timing', category: 'infrastructure', description: '7 macro indicators for regime detection', modulePath: '@/lib/market-timing', exports: ['analyzeMarketTiming'], dependencies: [], inputs: ['startups'], outputs: ['MarketTimingReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
  { id: 'social-proof', name: 'Social Proof', category: 'infrastructure', description: 'GitHub/Twitter/Discord/Web alternative data', modulePath: '@/lib/social-proof', exports: ['analyzeSocialProof'], dependencies: [], inputs: ['startup'], outputs: ['SocialProofReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'lp-portal', name: 'LP Portal', category: 'infrastructure', description: 'Professional quarterly LP reports', modulePath: '@/lib/lp-portal', exports: ['generateLPReport'], dependencies: ['return-calculator'], inputs: ['portfolioStartups'], outputs: ['LPReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },

  // Regulatory
  { id: 'regulatory-compliance', name: 'Regulatory Compliance', category: 'regulatory', description: 'Multi-jurisdiction compliance (US/EU)', modulePath: '@/lib/regulatory-compliance', exports: ['generateComplianceReport'], dependencies: [], inputs: ['jurisdictions'], outputs: ['ComplianceReport'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'apac-regulatory', name: 'APAC Regulatory', category: 'regulatory', description: '6 Asia-Pacific jurisdiction profiles', modulePath: '@/lib/apac-regulatory', exports: ['analyzeAPACRegulatory'], dependencies: [], inputs: ['jurisdictions'], outputs: ['APACReport'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'geopolitical-risk', name: 'Geopolitical Risk', category: 'regulatory', description: '8 jurisdictions with sanctions screening', modulePath: '@/lib/geopolitical-risk', exports: ['analyzeGeopoliticalRisk'], dependencies: [], inputs: ['startup'], outputs: ['GeopoliticalReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },

  // ESG & Macro
  { id: 'esg-taxonomy', name: 'ESG Taxonomy', category: 'regulatory', description: 'EU SFDR, Taxonomy, PAI, carbon footprint, SDGs', modulePath: '@/lib/esg-taxonomy', exports: ['generateESGReport'], dependencies: [], inputs: ['startup'], outputs: ['ESGReport'], requiresStartupData: true, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },
  { id: 'macro-indicators', name: 'Macro Indicators', category: 'infrastructure', description: '12 macro indicators for allocation decisions', modulePath: '@/lib/macro-indicators', exports: ['analyzeMacroEnvironment'], dependencies: [], inputs: [], outputs: ['MacroReport'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },

  // Cryptography
  { id: 'zk-range-proof', name: 'ZK Range Proofs', category: 'crypto', description: 'Pedersen commitments with Fiat-Shamir proofs', modulePath: '@/lib/zk-range-proof', exports: ['generateRangeProof', 'verifyRangeProof', 'generateZKMetricsPublish'], dependencies: [], inputs: ['metric', 'value', 'range'], outputs: ['RangeProof'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(1)', version: '1.0.0' },

  // Graph
  { id: 'knowledge-graph', name: 'Knowledge Graph', category: 'intelligence', description: 'BFS pathfinding, community detection, influence scoring', modulePath: '@/lib/knowledge-graph', exports: ['buildKnowledgeGraph', 'findPath', 'calculateInfluence'], dependencies: [], inputs: ['startups', 'proposals'], outputs: ['KnowledgeGraph'], requiresStartupData: true, requiresMetrics: false, requiresPeers: true, complexity: 'O(n²)', version: '1.0.0' },

  // Multi-Chain
  { id: 'cross-chain', name: 'Cross-Chain', category: 'infrastructure', description: 'Unified portfolio across 8 blockchains', modulePath: '@/lib/cross-chain', exports: ['aggregatePortfolio', 'compareVerificationCosts'], dependencies: [], inputs: ['assets'], outputs: ['CrossChainPortfolio'], requiresStartupData: false, requiresMetrics: false, requiresPeers: false, complexity: 'O(n)', version: '1.0.0' },
];

// ── Public API ───────────────────────────────────────────────────────

/**
 * Get metadata for a specific engine by ID.
 */
export function getEngine(id: string): EngineMetadata | undefined {
  return ENGINES.find(e => e.id === id);
}

/**
 * List all registered engines, optionally filtered by category.
 */
export function listEngines(category?: EngineCategory): EngineMetadata[] {
  return category ? ENGINES.filter(e => e.category === category) : [...ENGINES];
}

/**
 * Get all engine categories with counts.
 */
export function getCategories(): { category: EngineCategory; count: number; engines: string[] }[] {
  const map = new Map<EngineCategory, string[]>();
  for (const e of ENGINES) {
    const list = map.get(e.category) ?? [];
    list.push(e.id);
    map.set(e.category, list);
  }
  return Array.from(map.entries())
    .map(([category, engines]) => ({ category, count: engines.length, engines }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get dependency graph for an engine.
 */
export function getDependencies(id: string): EngineMetadata[] {
  const engine = getEngine(id);
  if (!engine) return [];
  return engine.dependencies
    .map(depId => getEngine(depId))
    .filter((e): e is EngineMetadata => e !== undefined);
}

/**
 * Get all engines that depend on a given engine.
 */
export function getDependents(id: string): EngineMetadata[] {
  return ENGINES.filter(e => e.dependencies.includes(id));
}

/**
 * Search engines by keyword.
 */
export function searchEngines(query: string): EngineMetadata[] {
  const q = query.toLowerCase();
  return ENGINES.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.id.includes(q) ||
    e.exports.some(exp => exp.toLowerCase().includes(q))
  );
}

/** Total engine count */
export const ENGINE_COUNT = ENGINES.length;

/** Engine Registry singleton */
export const EngineRegistry = {
  get: getEngine,
  list: listEngines,
  categories: getCategories,
  dependencies: getDependencies,
  dependents: getDependents,
  search: searchEngines,
  count: ENGINE_COUNT,
};
