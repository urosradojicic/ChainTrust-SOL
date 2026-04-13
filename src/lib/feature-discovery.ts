/**
 * Feature Discovery Engine
 * ────────────────────────
 * Contextually surfaces the RIGHT feature at the RIGHT time.
 * Never overwhelming — just one hint when it's most useful.
 *
 * Philosophy:
 *   - Show tips ONLY when contextually relevant
 *   - Never show more than one at a time
 *   - Dismiss permanently after viewing
 *   - Track which features user has discovered
 *   - Suggest next steps based on current page
 *
 * This is NOT a tutorial wall. It's a gentle nudge system.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface FeatureHint {
  /** Unique identifier */
  id: string;
  /** Feature name */
  feature: string;
  /** Short description (max 100 chars) */
  hint: string;
  /** Longer explanation (shown on expand) */
  detail: string;
  /** Where this hint should appear (page path) */
  triggerPage: string;
  /** What tab to show it on (optional) */
  triggerTab?: string;
  /** Minimum times user has visited the page before showing */
  minPageVisits: number;
  /** Link to the feature */
  actionLink: string;
  /** Action button text */
  actionText: string;
  /** Icon */
  icon: string;
  /** Priority (lower = shown first) */
  priority: number;
}

export interface DiscoveryState {
  /** Features the user has seen */
  seenFeatures: string[];
  /** Features the user has dismissed */
  dismissedFeatures: string[];
  /** Page visit counts */
  pageVisits: Record<string, number>;
  /** Last hint shown timestamp */
  lastHintAt: number;
  /** Total features discovered */
  discoveredCount: number;
}

// ── Feature Hints ────────────────────────────────────────────────────

const FEATURE_HINTS: FeatureHint[] = [
  // Dashboard hints
  {
    id: 'hint-nlquery', feature: 'Natural Language Query', icon: '💬',
    hint: 'Try typing "top 5 by growth" in the search bar above',
    detail: 'You can ask questions in plain English — like "SaaS startups with MRR over 100K" or "how many are verified?"',
    triggerPage: '/dashboard', minPageVisits: 2,
    actionLink: '/dashboard', actionText: 'Try it now', priority: 1,
  },
  {
    id: 'hint-3d', feature: '3D Portfolio Universe', icon: '🌌',
    hint: 'Scroll down to see your startups as orbiting planets',
    detail: 'Each planet represents a startup. Size = revenue, color = category, glow = trust score. Click any planet for details.',
    triggerPage: '/dashboard', minPageVisits: 3,
    actionLink: '/dashboard', actionText: 'Explore 3D', priority: 3,
  },

  // Startup detail hints
  {
    id: 'hint-digitaltwin', feature: 'Digital Twin', icon: '🎲',
    hint: 'The Digital Twin tab simulates 5,000 possible futures for this startup',
    detail: 'Monte Carlo simulation shows probability distributions for revenue and cash. Adjust growth rate and volatility sliders to explore scenarios.',
    triggerPage: '/startup', triggerTab: 'overview', minPageVisits: 1,
    actionLink: '', actionText: 'Open Digital Twin tab', priority: 2,
  },
  {
    id: 'hint-zkproof', feature: 'ZK Proofs', icon: '🔐',
    hint: 'Generate a zero-knowledge proof — prove metrics without revealing exact numbers',
    detail: 'ZK range proofs let startups prove "MRR is between $50K-$500K" without revealing the exact value. Try generating one!',
    triggerPage: '/startup', minPageVisits: 3,
    actionLink: '', actionText: 'Open ZK Proofs tab', priority: 5,
  },
  {
    id: 'hint-memo', feature: 'Investment Memo', icon: '📄',
    hint: 'Auto-generate an institutional-grade investment memo for this startup',
    detail: 'The Memo tab generates a Goldman-Sachs-style investment memo with bull/bear case, key metrics, and suggested terms. Export as PDF.',
    triggerPage: '/startup', minPageVisits: 2,
    actionLink: '', actionText: 'Generate Memo', priority: 3,
  },

  // Screener hints
  {
    id: 'hint-screener-filters', feature: 'Advanced Screener', icon: '🎯',
    hint: 'Combine filters to find startups matching your thesis',
    detail: 'Filter by MRR range, growth rate, trust score, sustainability, and whale concentration. Export results as CSV.',
    triggerPage: '/screener', minPageVisits: 1,
    actionLink: '/screener', actionText: 'Start filtering', priority: 1,
  },

  // Staking hints
  {
    id: 'hint-streaming', feature: 'Streaming Rewards', icon: '💫',
    hint: 'Watch your rewards tick up in real-time — per second',
    detail: 'When you stake CMT, rewards accrue continuously and display at 60fps. The counter literally ticks up every frame.',
    triggerPage: '/staking', minPageVisits: 1,
    actionLink: '/staking', actionText: 'View rewards', priority: 2,
  },

  // Portfolio hints
  {
    id: 'hint-compare', feature: 'Compare Startups', icon: '⚖️',
    hint: 'Bookmark at least 2 startups, then compare them side by side',
    detail: 'The Compare page shows metrics, charts, and ratios for 2+ startups simultaneously.',
    triggerPage: '/portfolio', minPageVisits: 2,
    actionLink: '/compare', actionText: 'Go to Compare', priority: 3,
  },

  // Investor Hub hints
  {
    id: 'hint-streak', feature: 'Login Streak', icon: '🔥',
    hint: 'Come back tomorrow to extend your streak and earn badges',
    detail: 'Consecutive daily logins build your streak. Reach 7, 30, and 100 days for special achievement badges.',
    triggerPage: '/investor-hub', minPageVisits: 1,
    actionLink: '/investor-hub', actionText: 'View streak', priority: 4,
  },
];

// ── Discovery State Management ───────────────────────────────────────

const DISCOVERY_STORAGE_KEY = 'chaintrust_feature_discovery';

function loadState(): DiscoveryState {
  const stored = localStorage.getItem(DISCOVERY_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {
    seenFeatures: [],
    dismissedFeatures: [],
    pageVisits: {},
    lastHintAt: 0,
    discoveredCount: 0,
  };
}

function saveState(state: DiscoveryState): void {
  localStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(state));
}

/**
 * Record a page visit (call on every page navigation).
 */
export function recordFeaturePageVisit(page: string): void {
  const state = loadState();
  state.pageVisits[page] = (state.pageVisits[page] ?? 0) + 1;
  saveState(state);
}

/**
 * Get the contextually relevant hint for the current page.
 * Returns null if no hint is appropriate right now.
 *
 * Rules:
 *   - Only one hint at a time
 *   - Don't show if user dismissed it
 *   - Don't show if feature already discovered
 *   - Minimum 30 seconds between hints
 *   - Respect minPageVisits threshold
 */
export function getContextualHint(currentPage: string, currentTab?: string): FeatureHint | null {
  const state = loadState();
  const now = Date.now();

  // Cooldown: don't show hints too frequently
  if (now - state.lastHintAt < 30000) return null;

  // Find matching hints
  const candidates = FEATURE_HINTS
    .filter(h => {
      // Must match current page
      if (currentPage.startsWith('/startup/') && h.triggerPage === '/startup') {
        // Startup detail page — match
      } else if (h.triggerPage !== currentPage) {
        return false;
      }

      // Tab filter (if specified)
      if (h.triggerTab && currentTab && h.triggerTab !== currentTab) return false;

      // Not already dismissed
      if (state.dismissedFeatures.includes(h.id)) return false;

      // Not already seen too many times
      if (state.seenFeatures.filter(f => f === h.id).length >= 3) return false;

      // Minimum page visits met
      const visits = state.pageVisits[currentPage] ?? 0;
      if (visits < h.minPageVisits) return false;

      return true;
    })
    .sort((a, b) => a.priority - b.priority);

  if (candidates.length === 0) return null;

  // Mark as seen
  const hint = candidates[0];
  state.seenFeatures.push(hint.id);
  state.lastHintAt = now;
  saveState(state);

  return hint;
}

/**
 * Dismiss a hint permanently.
 */
export function dismissHint(hintId: string): void {
  const state = loadState();
  if (!state.dismissedFeatures.includes(hintId)) {
    state.dismissedFeatures.push(hintId);
    saveState(state);
  }
}

/**
 * Mark a feature as discovered (user used it).
 */
export function markFeatureDiscovered(featureId: string): void {
  const state = loadState();
  state.discoveredCount++;
  state.dismissedFeatures.push(featureId); // Auto-dismiss after discovery
  saveState(state);
}

/**
 * Get total discovery progress (for gamification).
 */
export function getDiscoveryProgress(): { discovered: number; total: number; pct: number } {
  const state = loadState();
  const total = FEATURE_HINTS.length;
  const discovered = state.dismissedFeatures.length;
  return { discovered, total, pct: Math.round((discovered / total) * 100) };
}
