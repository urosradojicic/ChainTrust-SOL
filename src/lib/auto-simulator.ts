/**
 * Auto-Simulation Runner
 * ──────────────────────
 * Background processing engine that continuously runs simulations,
 * updates predictions, and detects anomalies WITHOUT blocking the UI.
 *
 * Architecture:
 *   - Main thread schedules work via requestIdleCallback
 *   - Simulation batches process during idle frames
 *   - Results cached and incrementally updated
 *   - Event-driven: subscribers get notified of new results
 *
 * This is the "always-on brain" of ChainTrust — constantly analyzing
 * every startup in the background, surfacing insights proactively.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { runSimulation, DEFAULT_PARAMS, type SimulationResult } from './monte-carlo';
import { analyzeRedFlags, type RedFlagReport } from './red-flag-detection';
import { computeReputationScore, type ReputationScore } from './reputation-score';
import { predictSurvival, type SurvivalPrediction } from './survival-predictor';

// ── Types ────────────────────────────────────────────────────────────

export type SimulationType = 'monte_carlo' | 'red_flags' | 'reputation' | 'survival' | 'full';

export interface SimulationJob {
  id: string;
  startupId: string;
  type: SimulationType;
  priority: number; // 1 = highest
  scheduledAt: number;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result: any | null;
  duration: number | null;
}

export interface SimulationCache {
  startupId: string;
  monteCarlo: SimulationResult | null;
  redFlags: RedFlagReport | null;
  reputation: ReputationScore | null;
  survival: SurvivalPrediction | null;
  lastUpdated: number;
  computeTimeMs: number;
}

export type SimulationListener = (cache: SimulationCache) => void;

export interface AutoSimulatorState {
  /** All cached results */
  cache: Map<string, SimulationCache>;
  /** Job queue */
  queue: SimulationJob[];
  /** Completed job count */
  completedJobs: number;
  /** Total compute time (ms) */
  totalComputeTime: number;
  /** Whether the simulator is running */
  running: boolean;
  /** Jobs per second throughput */
  throughput: number;
  /** Last cycle timestamp */
  lastCycleAt: number;
}

// ── Simulation Engine ────────────────────────────────────────────────

class AutoSimulator {
  private cache = new Map<string, SimulationCache>();
  private queue: SimulationJob[] = [];
  private listeners = new Map<string, Set<SimulationListener>>();
  private globalListeners = new Set<SimulationListener>();
  private running = false;
  private completedJobs = 0;
  private totalComputeTime = 0;
  private rafId: number | null = null;
  private batchSize = 2; // Jobs per idle frame

  /**
   * Schedule simulations for all startups.
   */
  scheduleAll(
    startups: DbStartup[],
    allMetrics: Map<string, DbMetricsHistory[]>,
    allStartups: DbStartup[],
    type: SimulationType = 'full',
  ): void {
    for (const startup of startups) {
      this.schedule(startup, allMetrics.get(startup.id) ?? [], allStartups, type);
    }
  }

  /**
   * Schedule simulation for a single startup.
   */
  schedule(
    startup: DbStartup,
    metrics: DbMetricsHistory[],
    allStartups: DbStartup[],
    type: SimulationType = 'full',
    priority: number = 3,
  ): void {
    const job: SimulationJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startupId: startup.id,
      type,
      priority,
      scheduledAt: Date.now(),
      status: 'queued',
      result: null,
      duration: null,
    };

    // Store context for execution
    (job as any)._startup = startup;
    (job as any)._metrics = metrics;
    (job as any)._allStartups = allStartups;

    this.queue.push(job);
    this.queue.sort((a, b) => a.priority - b.priority);

    if (!this.running) this.start();
  }

  /**
   * Start the background processing loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.processNextBatch();
  }

  /**
   * Stop the background processing loop.
   */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Process next batch of jobs during idle time.
   */
  private processNextBatch = (): void => {
    if (!this.running || this.queue.length === 0) {
      this.running = false;
      return;
    }

    // Process a batch
    const batch = this.queue.splice(0, this.batchSize);
    for (const job of batch) {
      this.executeJob(job);
    }

    // Schedule next batch using requestAnimationFrame for smooth UI
    this.rafId = requestAnimationFrame(this.processNextBatch);
  };

  /**
   * Execute a single simulation job.
   */
  private executeJob(job: SimulationJob): void {
    const start = performance.now();
    job.status = 'running';

    try {
      const startup = (job as any)._startup as DbStartup;
      const metrics = (job as any)._metrics as DbMetricsHistory[];
      const allStartups = (job as any)._allStartups as DbStartup[];

      // Get or create cache entry
      let cache = this.cache.get(job.startupId) ?? {
        startupId: job.startupId,
        monteCarlo: null,
        redFlags: null,
        reputation: null,
        survival: null,
        lastUpdated: 0,
        computeTimeMs: 0,
      };

      // Execute based on type
      if (job.type === 'monte_carlo' || job.type === 'full') {
        cache.monteCarlo = runSimulation(startup, metrics, {
          ...DEFAULT_PARAMS,
          iterations: 1000, // Reduced for background processing
          horizonMonths: 18,
        });
      }

      if (job.type === 'red_flags' || job.type === 'full') {
        cache.redFlags = analyzeRedFlags(startup, metrics, allStartups);
      }

      if (job.type === 'reputation' || job.type === 'full') {
        cache.reputation = computeReputationScore(startup, metrics, allStartups);
      }

      if (job.type === 'survival' || job.type === 'full') {
        cache.survival = predictSurvival(startup, metrics);
      }

      const duration = performance.now() - start;
      cache.lastUpdated = Date.now();
      cache.computeTimeMs = duration;

      this.cache.set(job.startupId, cache);
      job.status = 'completed';
      job.duration = duration;
      job.result = cache;

      this.completedJobs++;
      this.totalComputeTime += duration;

      // Notify listeners
      this.notifyListeners(job.startupId, cache);

      // Clean up context references
      delete (job as any)._startup;
      delete (job as any)._metrics;
      delete (job as any)._allStartups;

    } catch (error) {
      job.status = 'failed';
      job.duration = performance.now() - start;
    }
  }

  /**
   * Get cached results for a startup.
   */
  getCache(startupId: string): SimulationCache | null {
    return this.cache.get(startupId) ?? null;
  }

  /**
   * Get all cached results.
   */
  getAllCaches(): SimulationCache[] {
    return Array.from(this.cache.values());
  }

  /**
   * Subscribe to updates for a specific startup.
   */
  subscribe(startupId: string, listener: SimulationListener): () => void {
    let listeners = this.listeners.get(startupId);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(startupId, listeners);
    }
    listeners.add(listener);
    return () => listeners!.delete(listener);
  }

  /**
   * Subscribe to all updates.
   */
  subscribeAll(listener: SimulationListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  private notifyListeners(startupId: string, cache: SimulationCache): void {
    const listeners = this.listeners.get(startupId);
    if (listeners) {
      for (const listener of listeners) listener(cache);
    }
    for (const listener of this.globalListeners) listener(cache);
  }

  /**
   * Get current state for debugging/monitoring.
   */
  getState(): AutoSimulatorState {
    return {
      cache: this.cache,
      queue: [...this.queue],
      completedJobs: this.completedJobs,
      totalComputeTime: this.totalComputeTime,
      running: this.running,
      throughput: this.completedJobs > 0 ? this.completedJobs / (this.totalComputeTime / 1000) : 0,
      lastCycleAt: Date.now(),
    };
  }

  /**
   * Clear all caches and reset state.
   */
  reset(): void {
    this.stop();
    this.cache.clear();
    this.queue = [];
    this.completedJobs = 0;
    this.totalComputeTime = 0;
  }

  /**
   * Get a ranked list of startups by any cached metric.
   */
  getRankedStartups(
    metric: 'survival' | 'reputation' | 'redFlags',
    limit: number = 10,
  ): { startupId: string; score: number }[] {
    const entries = Array.from(this.cache.entries());

    return entries
      .map(([id, cache]) => {
        let score = 0;
        switch (metric) {
          case 'survival':
            score = cache.survival?.investabilityScore ?? 0;
            break;
          case 'reputation':
            score = cache.reputation?.totalScore ?? 0;
            break;
          case 'redFlags':
            score = 100 - (cache.redFlags?.riskScore ?? 50); // Invert: fewer flags = higher score
            break;
        }
        return { startupId: id, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// ── Singleton Instance ───────────────────────────────────────────────

/** Global auto-simulator instance */
export const autoSimulator = new AutoSimulator();

/**
 * Initialize the auto-simulator with all platform startups.
 * Call this once when the app loads.
 */
export function initializeAutoSimulator(
  startups: DbStartup[],
  allMetrics: Map<string, DbMetricsHistory[]>,
): void {
  autoSimulator.reset();
  autoSimulator.scheduleAll(startups, allMetrics, startups, 'full');
}

/**
 * React hook helper: get cached simulation results.
 */
export function getCachedAnalysis(startupId: string): SimulationCache | null {
  return autoSimulator.getCache(startupId);
}
