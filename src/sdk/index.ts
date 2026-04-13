/**
 * ChainTrust SDK — Unified API Surface
 * ──────────────────────────────────────
 * Single entry point for all 73 engine libraries.
 * Enterprise-ready: typed, documented, tree-shakeable.
 *
 * Usage:
 *   import { ChainTrust } from '@/sdk';
 *   const analysis = ChainTrust.analyze(startup, metrics, allStartups);
 *   const memo = ChainTrust.memos.generate(startup, metrics, allStartups);
 *   const risk = ChainTrust.quant.analyzeRisk(startup, metrics, allStartups, allMetrics);
 *
 * Or import individual modules:
 *   import { memos, quant, zk } from '@/sdk';
 */

// Re-export all modules through a clean namespace
export { ChainTrust } from './chaintrust';
export { EngineRegistry, getEngine, listEngines } from './registry';
export { EventBus, type ChainTrustEvent } from './event-bus';
export { Config, type ChainTrustConfig } from './config';
export { PluginManager, type ChainTrustPlugin } from './plugins';

// Direct module access (tree-shakeable)
export * as analysis from './modules/analysis';
export * as finance from './modules/finance';
export * as intelligence from './modules/intelligence';
export * as risk from './modules/risk';
export * as simulation from './modules/simulation';
export * as experience from './modules/experience';
