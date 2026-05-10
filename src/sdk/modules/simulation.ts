/**
 * Simulation Module — barrel export
 * Monte Carlo, survival, scenarios, auto-simulator.
 */

export { runSimulation, DEFAULT_PARAMS, type SimulationResult } from '@/lib/intelligence/monte-carlo';
export { predictSurvival, type SurvivalPrediction } from '@/lib/intelligence/survival-predictor';
export { runScenarioAnalysis, SCENARIO_TEMPLATES, type ScenarioComparison } from '@/lib/intelligence/scenario-planning';
export { autoSimulator, initializeAutoSimulator, getCachedAnalysis } from '@/lib/intelligence/auto-simulator';
export { analyzeMarketTiming, type MarketTimingReport } from '@/lib/intelligence/market-timing';
