/**
 * Simulation Module — barrel export
 * Monte Carlo, survival, scenarios, auto-simulator.
 */

export { runSimulation, DEFAULT_PARAMS, type SimulationResult } from '@/lib/monte-carlo';
export { predictSurvival, type SurvivalPrediction } from '@/lib/survival-predictor';
export { runScenarioAnalysis, SCENARIO_TEMPLATES, type ScenarioComparison } from '@/lib/scenario-planning';
export { autoSimulator, initializeAutoSimulator, getCachedAnalysis } from '@/lib/auto-simulator';
export { analyzeMarketTiming, type MarketTimingReport } from '@/lib/market-timing';
