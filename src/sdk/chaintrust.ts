/**
 * ChainTrust — Unified Facade
 * ────────────────────────────
 * One object to access all 73 engines.
 * The API surface that enterprise integrators use.
 *
 * Usage:
 *   import { ChainTrust } from '@/sdk';
 *
 *   // Quick analysis
 *   const report = ChainTrust.analyze(startup, metrics, allStartups);
 *
 *   // Individual modules
 *   const memo = ChainTrust.memos.generate(startup, metrics, allStartups);
 *   const risk = ChainTrust.risk.quant(startup, metrics, allStartups, allMetrics);
 *   const dna = ChainTrust.intelligence.dna(startup, metrics, allStartups, allMetrics);
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { EngineRegistry } from './registry';
import { EventBus } from './event-bus';
import { Config } from './config';

// Lazy imports for tree shaking — only loaded when called
const lazyImport = {
  redFlags: () => import('@/lib/intelligence/red-flag-detection'),
  reputation: () => import('@/lib/intelligence/reputation-score'),
  claims: () => import('@/lib/intelligence/claim-verification'),
  memo: () => import('@/lib/intelligence/investment-memo'),
  competitive: () => import('@/lib/intelligence/competitive-intel'),
  cohort: () => import('@/lib/intelligence/cohort-analysis'),
  revenueQuality: () => import('@/lib/intelligence/revenue-quality'),
  founder: () => import('@/lib/intelligence/founder-score'),
  audit: () => import('@/lib/intelligence/audit-intelligence'),
  isolation: () => import('@/lib/intelligence/isolation-forest'),
  gradient: () => import('@/lib/intelligence/gradient-boost'),
  patterns: () => import('@/lib/intelligence/pattern-recognition'),
  bayesian: () => import('@/lib/intelligence/bayesian-inference'),
  quantRisk: () => import('@/lib/intelligence/quant-risk'),
  portfolio: () => import('@/lib/intelligence/portfolio-optimizer'),
  returns: () => import('@/lib/intelligence/return-calculator'),
  signals: () => import('@/lib/intelligence/signal-engine'),
  fx: () => import('@/lib/intelligence/fx-engine'),
  monteCarlo: () => import('@/lib/intelligence/monte-carlo'),
  survival: () => import('@/lib/intelligence/survival-predictor'),
  scenarios: () => import('@/lib/intelligence/scenario-planning'),
  dna: () => import('@/lib/intelligence/startup-dna'),
  networkEffects: () => import('@/lib/intelligence/network-effects'),
  moat: () => import('@/lib/intelligence/moat-scorer'),
  tokenomics: () => import('@/lib/intelligence/tokenomics-simulator'),
  velocity: () => import('@/lib/intelligence/execution-velocity'),
  lifecycle: () => import('@/lib/intelligence/lifecycle-detector'),
  liquidity: () => import('@/lib/intelligence/liquidity-analysis'),
  smartMoney: () => import('@/lib/intelligence/smart-money'),
  protocolRevenue: () => import('@/lib/intelligence/protocol-revenue'),
  dealScoring: () => import('@/lib/intelligence/deal-scoring'),
  narrative: () => import('@/lib/intelligence/narrative-engine'),
  valuation: () => import('@/lib/intelligence/valuation-suite'),
  esg: () => import('@/lib/intelligence/esg-taxonomy'),
  geopolitical: () => import('@/lib/intelligence/geopolitical-risk'),
  graph: () => import('@/lib/intelligence/knowledge-graph'),
  zkProof: () => import('@/lib/solana/zk-range-proof'),
};

// ── Unified Facade ───────────────────────────────────────────────────

export const ChainTrust = {
  /** SDK version */
  version: '1.0.0',

  /** Engine count */
  engineCount: EngineRegistry.count,

  /** Configuration */
  config: Config,

  /** Event bus */
  events: EventBus,

  /** Engine registry */
  engines: EngineRegistry,

  /**
   * Run a comprehensive analysis on a startup.
   * Returns combined results from multiple engines.
   */
  async analyze(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[]) {
    const start = performance.now();

    const [redFlagsMod, reputationMod, survivalMod, patternsMod, dealScoringMod] = await Promise.all([
      lazyImport.redFlags(),
      lazyImport.reputation(),
      lazyImport.survival(),
      lazyImport.patterns(),
      lazyImport.dealScoring(),
    ]);

    const result = {
      redFlags: redFlagsMod.analyzeRedFlags(startup, metrics, allStartups),
      reputation: reputationMod.computeReputationScore(startup, metrics, allStartups),
      survival: survivalMod.predictSurvival(startup, metrics),
      patterns: patternsMod.recognizePatterns(startup, metrics),
      dealScore: dealScoringMod.scoreDeal(startup, metrics, allStartups),
      computeTimeMs: 0,
    };

    result.computeTimeMs = performance.now() - start;

    EventBus.emit('analysis:redflags:complete', {
      startupId: startup.id,
      flagCount: result.redFlags.flags.length,
      riskLevel: result.redFlags.riskLevel,
    });

    EventBus.emit('analysis:reputation:complete', {
      startupId: startup.id,
      score: result.reputation.totalScore,
      tier: result.reputation.tier,
    });

    return result;
  },

  /** Investment memo generation */
  memos: {
    async generate(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[]) {
      const mod = await lazyImport.memo();
      return mod.generateInvestmentMemo(startup, metrics, allStartups);
    },
  },

  /** Risk analysis */
  risk: {
    async quant(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[], allMetrics: Map<string, DbMetricsHistory[]>) {
      const mod = await lazyImport.quantRisk();
      return mod.analyzeQuantRisk(startup, metrics, allStartups, allMetrics);
    },
    async liquidity(startup: DbStartup) {
      const mod = await lazyImport.liquidity();
      return mod.analyzeLiquidity(startup);
    },
    async geopolitical(startup: DbStartup) {
      const mod = await lazyImport.geopolitical();
      return mod.analyzeGeopoliticalRisk(startup);
    },
    async esg(startup: DbStartup) {
      const mod = await lazyImport.esg();
      return mod.generateESGReport(startup);
    },
  },

  /** Deep intelligence */
  intelligence: {
    async dna(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[], allMetrics: Map<string, DbMetricsHistory[]>) {
      const mod = await lazyImport.dna();
      return mod.generateDNAFingerprint(startup, metrics, allStartups, allMetrics);
    },
    async moat(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[]) {
      const mod = await lazyImport.moat();
      return mod.analyzeMoatDepth(startup, metrics, allStartups);
    },
    async networkEffects(startup: DbStartup, metrics: DbMetricsHistory[]) {
      const mod = await lazyImport.networkEffects();
      return mod.analyzeNetworkEffects(startup, metrics);
    },
    async lifecycle(startup: DbStartup, metrics: DbMetricsHistory[]) {
      const mod = await lazyImport.lifecycle();
      return mod.detectLifecycle(startup, metrics);
    },
    async smartMoney(startup: DbStartup) {
      const mod = await lazyImport.smartMoney();
      return mod.analyzeSmartMoney(startup);
    },
  },

  /** Simulation */
  simulation: {
    async monteCarlo(startup: DbStartup, metrics: DbMetricsHistory[]) {
      const mod = await lazyImport.monteCarlo();
      return mod.runSimulation(startup, metrics);
    },
    async scenarios(startup: DbStartup, metrics: DbMetricsHistory[]) {
      const mod = await lazyImport.scenarios();
      return mod.runScenarioAnalysis(startup, metrics);
    },
  },

  /** Narratives */
  narratives: {
    async generate(startup: DbStartup, metrics: DbMetricsHistory[], allStartups: DbStartup[]) {
      const mod = await lazyImport.narrative();
      return mod.generateStartupNarrative(startup, metrics, allStartups);
    },
    async cardInsight(startup: DbStartup, allStartups: DbStartup[]) {
      const mod = await lazyImport.narrative();
      return mod.generateCardInsight(startup, allStartups);
    },
  },

  /** ZK Proofs */
  zk: {
    async generateProof(metric: string, value: number, min: number, max: number) {
      const mod = await lazyImport.zkProof();
      return mod.generateRangeProof(metric, value, min, max);
    },
    async verifyProof(proof: any) {
      const mod = await lazyImport.zkProof();
      return mod.verifyRangeProof(proof);
    },
  },
};
