/**
 * Configuration System
 * ────────────────────
 * Runtime feature flags and configuration.
 * No rebuild required to change behavior.
 *
 * Levels:
 *   1. Defaults    — hardcoded sensible defaults
 *   2. Environment — from VITE env vars
 *   3. User prefs  — from localStorage (overrides env)
 *   4. Runtime     — programmatic overrides (highest priority)
 */

// ── Types ────────────────────────────────────────────────────────────

export interface ChainTrustConfig {
  // Feature flags
  features: {
    /** Enable 3D portfolio visualization */
    enable3D: boolean;
    /** Enable ZK proof generation */
    enableZKProofs: boolean;
    /** Enable streaming rewards animation */
    enableStreamingRewards: boolean;
    /** Enable AI agent orchestrator */
    enableAIAgents: boolean;
    /** Enable prediction markets */
    enablePredictionMarkets: boolean;
    /** Enable natural language querying */
    enableNLQuery: boolean;
    /** Enable command palette (Cmd+K) */
    enableCommandPalette: boolean;
    /** Enable feature discovery hints */
    enableFeatureDiscovery: boolean;
    /** Enable narrative engine (story mode) */
    enableNarratives: boolean;
    /** Enable gamification (streaks, badges) */
    enableGamification: boolean;
  };

  // Performance
  performance: {
    /** Monte Carlo iteration count (default 5000) */
    monteCarloIterations: number;
    /** Auto-simulator batch size */
    autoSimBatchSize: number;
    /** Isolation forest tree count */
    isolationForestTrees: number;
    /** Gradient boosting stump count */
    gradientBoostStumps: number;
    /** Max startups to process in background */
    maxBackgroundProcessing: number;
  };

  // Display
  display: {
    /** Default currency for display */
    currency: string;
    /** Number format locale */
    locale: string;
    /** Date format */
    dateFormat: 'US' | 'EU' | 'ISO';
    /** Default dashboard layout */
    dashboardLayout: 'overview' | 'detailed' | 'institutional';
    /** Animation speed multiplier (0 = disabled) */
    animationSpeed: number;
  };

  // Data
  data: {
    /** Solana network */
    solanaNetwork: 'mainnet-beta' | 'devnet' | 'testnet';
    /** Supabase URL */
    supabaseUrl: string;
    /** Demo mode (use fallback data) */
    demoMode: boolean;
    /** Cache TTL in seconds */
    cacheTTL: number;
  };
}

// ── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ChainTrustConfig = {
  features: {
    enable3D: true,
    enableZKProofs: true,
    enableStreamingRewards: true,
    enableAIAgents: true,
    enablePredictionMarkets: true,
    enableNLQuery: true,
    enableCommandPalette: true,
    enableFeatureDiscovery: true,
    enableNarratives: true,
    enableGamification: true,
  },
  performance: {
    monteCarloIterations: 5000,
    autoSimBatchSize: 2,
    isolationForestTrees: 100,
    gradientBoostStumps: 30,
    maxBackgroundProcessing: 50,
  },
  display: {
    currency: 'USD',
    locale: 'en-US',
    dateFormat: 'US',
    dashboardLayout: 'overview',
    animationSpeed: 1,
  },
  data: {
    solanaNetwork: 'devnet',
    supabaseUrl: '',
    demoMode: true,
    cacheTTL: 300,
  },
};

// ── Config Manager ───────────────────────────────────────────────────

const CONFIG_STORAGE_KEY = 'chaintrust_config';

class ConfigManager {
  private config: ChainTrustConfig;
  private listeners = new Set<(config: ChainTrustConfig) => void>();

  constructor() {
    this.config = this.load();
  }

  private load(): ChainTrustConfig {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<ChainTrustConfig>;
        const merged = this.merge(
          DEFAULT_CONFIG as unknown as Record<string, unknown>,
          parsed as Record<string, unknown>,
        );
        return merged as unknown as ChainTrustConfig;
      } catch {
        return { ...DEFAULT_CONFIG };
      }
    }
    return { ...DEFAULT_CONFIG };
  }

  // Recursive deep-merge of arbitrary records. Generic over the shape so
  // the public API stays typed; internals remain dynamic since the keys
  // arrive at runtime from localStorage.
  private merge<T extends Record<string, unknown>>(defaults: T, overrides: Partial<T>): T {
    const result: Record<string, unknown> = { ...defaults };
    const ovr = overrides as Record<string, unknown>;
    for (const key of Object.keys(ovr)) {
      const def = (defaults as Record<string, unknown>)[key];
      if (typeof def === 'object' && def !== null && !Array.isArray(def)) {
        result[key] = this.merge(
          def as Record<string, unknown>,
          ovr[key] as Partial<Record<string, unknown>>,
        );
      } else {
        result[key] = ovr[key];
      }
    }
    return result as T;
  }

  private save(): void {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    for (const listener of this.listeners) listener(this.config);
  }

  /** Get the full config */
  get(): ChainTrustConfig {
    return { ...this.config };
  }

  /** Get a specific nested value. Caller is responsible for picking the
   *  right type parameter — runtime validation isn't done here because
   *  the config is fully owned by us, not user input. */
  getValue<T>(path: string): T {
    return path
      .split('.')
      .reduce<unknown>((obj, key) => (obj as Record<string, unknown> | undefined)?.[key], this.config) as T;
  }

  /** Set a specific nested value. */
  setValue(path: string, value: unknown): void {
    const keys = path.split('.');
    let obj: Record<string, unknown> = this.config as unknown as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]] as Record<string, unknown>;
    }
    obj[keys[keys.length - 1]] = value;
    this.save();
  }

  /** Check if a feature is enabled */
  isFeatureEnabled(feature: keyof ChainTrustConfig['features']): boolean {
    return this.config.features[feature] ?? false;
  }

  /** Toggle a feature flag */
  toggleFeature(feature: keyof ChainTrustConfig['features']): boolean {
    this.config.features[feature] = !this.config.features[feature];
    this.save();
    return this.config.features[feature];
  }

  /** Reset to defaults */
  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
  }

  /** Subscribe to config changes */
  onChange(listener: (config: ChainTrustConfig) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Get config summary for debugging */
  summary(): { features: number; performance: Record<string, number>; demoMode: boolean } {
    const enabledFeatures = Object.values(this.config.features).filter(Boolean).length;
    return {
      features: enabledFeatures,
      performance: this.config.performance,
      demoMode: this.config.data.demoMode,
    };
  }
}

/** Global config singleton */
export const Config = new ConfigManager();
