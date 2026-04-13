/**
 * Investor Preferences Engine
 * ───────────────────────────
 * Personalization system that learns what each investor cares about
 * and tailors the entire experience accordingly.
 *
 * Persisted in localStorage — no backend needed.
 *
 * Preferences drive:
 *   - Which metrics appear prominently
 *   - Default screener filters
 *   - NL query suggestions
 *   - Alert sensitivity
 *   - Dashboard layout
 *   - Report formatting
 */

// ── Types ────────────────────────────────────────────────────────────

export type InvestorType = 'angel' | 'seed_vc' | 'series_a' | 'growth' | 'crypto_fund' | 'family_office' | 'dao' | 'retail';
export type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';
export type RegionFocus = 'global' | 'north_america' | 'europe' | 'asia_pacific' | 'middle_east';

export interface InvestorPreferences {
  /** Investor display name */
  name: string;
  /** Investor type */
  type: InvestorType;
  /** Risk appetite */
  riskAppetite: RiskAppetite;
  /** Primary region focus */
  regionFocus: RegionFocus;
  /** Target categories (empty = all) */
  targetCategories: string[];
  /** Check size range */
  checkSize: { min: number; max: number };
  /** Minimum metrics thresholds */
  thresholds: {
    minMrr: number;
    minGrowthRate: number;
    minTrustScore: number;
    maxWhaleConcentration: number;
    requireVerified: boolean;
    minSustainability: number;
  };
  /** Preferred analysis tools */
  preferredTools: string[];
  /** Dashboard layout preference */
  dashboardLayout: 'overview' | 'detailed' | 'institutional';
  /** Notification preferences */
  notifications: {
    dailyBriefing: boolean;
    weeklyDigest: boolean;
    alertsEnabled: boolean;
    alertSensitivity: 'all' | 'high_only' | 'critical_only';
  };
  /** Currency preference */
  displayCurrency: string;
  /** Saved at */
  updatedAt: number;
}

// ── Presets ───────────────────────────────────────────────────────────

export const INVESTOR_PRESETS: Record<InvestorType, Partial<InvestorPreferences>> = {
  angel: {
    riskAppetite: 'aggressive',
    checkSize: { min: 5000, max: 100000 },
    thresholds: { minMrr: 0, minGrowthRate: 10, minTrustScore: 40, maxWhaleConcentration: 50, requireVerified: false, minSustainability: 0 },
    preferredTools: ['survival-predictor', 'nl-query', 'red-flags'],
    dashboardLayout: 'overview',
    notifications: { dailyBriefing: false, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'high_only' },
  },
  seed_vc: {
    riskAppetite: 'moderate',
    checkSize: { min: 100000, max: 2000000 },
    thresholds: { minMrr: 10000, minGrowthRate: 15, minTrustScore: 50, maxWhaleConcentration: 40, requireVerified: true, minSustainability: 30 },
    preferredTools: ['investment-memo', 'dd-workflow', 'cap-table', 'term-sheet', 'claim-verification'],
    dashboardLayout: 'detailed',
    notifications: { dailyBriefing: true, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'all' },
  },
  series_a: {
    riskAppetite: 'moderate',
    checkSize: { min: 2000000, max: 15000000 },
    thresholds: { minMrr: 50000, minGrowthRate: 15, minTrustScore: 60, maxWhaleConcentration: 35, requireVerified: true, minSustainability: 40 },
    preferredTools: ['investment-memo', 'cohort-analysis', 'revenue-quality', 'competitive-intel', 'valuation-suite'],
    dashboardLayout: 'institutional',
    notifications: { dailyBriefing: true, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'all' },
  },
  growth: {
    riskAppetite: 'conservative',
    checkSize: { min: 10000000, max: 100000000 },
    thresholds: { minMrr: 200000, minGrowthRate: 10, minTrustScore: 70, maxWhaleConcentration: 25, requireVerified: true, minSustainability: 50 },
    preferredTools: ['quant-risk', 'return-calculator', 'esg-taxonomy', 'lp-portal'],
    dashboardLayout: 'institutional',
    notifications: { dailyBriefing: true, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'critical_only' },
  },
  crypto_fund: {
    riskAppetite: 'aggressive',
    checkSize: { min: 200000, max: 10000000 },
    thresholds: { minMrr: 10000, minGrowthRate: 20, minTrustScore: 50, maxWhaleConcentration: 40, requireVerified: true, minSustainability: 0 },
    preferredTools: ['signal-engine', 'prediction-market', 'portfolio-optimizer', 'streaming-rewards'],
    dashboardLayout: 'detailed',
    notifications: { dailyBriefing: true, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'all' },
  },
  family_office: {
    riskAppetite: 'conservative',
    checkSize: { min: 500000, max: 20000000 },
    thresholds: { minMrr: 50000, minGrowthRate: 10, minTrustScore: 65, maxWhaleConcentration: 30, requireVerified: true, minSustainability: 50 },
    preferredTools: ['quant-risk', 'esg-taxonomy', 'geopolitical-risk', 'fx-engine', 'return-calculator'],
    dashboardLayout: 'institutional',
    notifications: { dailyBriefing: false, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'high_only' },
  },
  dao: {
    riskAppetite: 'aggressive',
    checkSize: { min: 50000, max: 5000000 },
    thresholds: { minMrr: 0, minGrowthRate: 5, minTrustScore: 40, maxWhaleConcentration: 50, requireVerified: false, minSustainability: 0 },
    preferredTools: ['governance-analytics', 'milestone-escrow', 'prediction-market', 'token-gating'],
    dashboardLayout: 'overview',
    notifications: { dailyBriefing: false, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'all' },
  },
  retail: {
    riskAppetite: 'moderate',
    checkSize: { min: 100, max: 10000 },
    thresholds: { minMrr: 0, minGrowthRate: 0, minTrustScore: 0, maxWhaleConcentration: 100, requireVerified: false, minSustainability: 0 },
    preferredTools: ['nl-query', 'survival-predictor', 'red-flags', '3d-portfolio'],
    dashboardLayout: 'overview',
    notifications: { dailyBriefing: false, weeklyDigest: false, alertsEnabled: true, alertSensitivity: 'critical_only' },
  },
};

// ── Persistence ──────────────────────────────────────────────────────

const PREFS_STORAGE_KEY = 'chaintrust_investor_preferences';

/**
 * Load investor preferences from localStorage.
 */
export function loadPreferences(): InvestorPreferences | null {
  const stored = localStorage.getItem(PREFS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Save investor preferences to localStorage.
 */
export function savePreferences(prefs: InvestorPreferences): void {
  prefs.updatedAt = Date.now();
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Create preferences from a preset investor type.
 */
export function createFromPreset(type: InvestorType, name: string = 'Investor'): InvestorPreferences {
  const preset = INVESTOR_PRESETS[type];
  return {
    name,
    type,
    riskAppetite: preset.riskAppetite ?? 'moderate',
    regionFocus: 'global',
    targetCategories: [],
    checkSize: preset.checkSize ?? { min: 10000, max: 1000000 },
    thresholds: preset.thresholds ?? {
      minMrr: 0, minGrowthRate: 0, minTrustScore: 0,
      maxWhaleConcentration: 100, requireVerified: false, minSustainability: 0,
    },
    preferredTools: preset.preferredTools ?? [],
    dashboardLayout: preset.dashboardLayout ?? 'overview',
    notifications: preset.notifications ?? {
      dailyBriefing: false, weeklyDigest: true, alertsEnabled: true, alertSensitivity: 'all',
    },
    displayCurrency: 'USD',
    updatedAt: Date.now(),
  };
}

/**
 * Get personalized screener defaults based on preferences.
 */
export function getScreenerDefaults(prefs: InvestorPreferences): Record<string, any> {
  return {
    minMrr: prefs.thresholds.minMrr,
    minGrowth: prefs.thresholds.minGrowthRate,
    minTrust: prefs.thresholds.minTrustScore,
    maxWhale: prefs.thresholds.maxWhaleConcentration,
    verifiedOnly: prefs.thresholds.requireVerified,
    categories: prefs.targetCategories,
  };
}

/**
 * Get personalized NL query suggestions based on investor type.
 */
export function getPersonalizedQuerySuggestions(prefs: InvestorPreferences): string[] {
  const base = [
    `Top 5 startups by growth rate`,
    `How many startups are verified?`,
  ];

  switch (prefs.type) {
    case 'seed_vc':
      return [...base,
        `SaaS startups with MRR over ${prefs.thresholds.minMrr / 1000}k and growth above ${prefs.thresholds.minGrowthRate}%`,
        'Verified startups with trust score above 60',
        'Average MRR across all startups',
      ];
    case 'crypto_fund':
      return [...base,
        'DeFi startups with growth above 20%',
        'Startups with whale concentration below 30%',
        'Infrastructure projects with trust score above 70',
      ];
    case 'family_office':
      return [...base,
        `Verified startups with sustainability above ${prefs.thresholds.minSustainability}`,
        'Startups with treasury over 1M',
        'Low inflation rate startups',
      ];
    default:
      return [...base,
        'Show me all verified startups',
        'Top 3 by trust score',
      ];
  }
}
