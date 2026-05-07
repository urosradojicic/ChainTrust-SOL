/**
 * Startup Lifecycle Detector
 * ──────────────────────────
 * Identifies which lifecycle stage a startup is in and detects
 * stage transitions — the moments that matter most for investors.
 *
 * Lifecycle stages:
 *   1. Ideation     — pre-product, concept stage
 *   2. MVP          — first product, early users
 *   3. Traction     — growing users, early revenue
 *   4. Growth       — product-market fit, scaling
 *   5. Scale        — category leadership, expansion
 *   6. Maturity     — market dominance, cash flow focus
 *   7. Decline      — shrinking metrics, potential pivot needed
 *
 * Stage transitions are the highest-signal moments for investment.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type LifecycleStage = 'ideation' | 'mvp' | 'traction' | 'growth' | 'scale' | 'maturity' | 'decline';

export interface StageProfile {
  stage: LifecycleStage;
  name: string;
  description: string;
  icon: string;
  /** How well the startup fits this stage (0-1) */
  fit: number;
  /** Typical investor types for this stage */
  typicalInvestors: string[];
  /** Key metrics to watch at this stage */
  keyMetrics: string[];
  /** What signals transition to next stage */
  nextStageSignals: string[];
  /** Typical valuation range */
  typicalValuation: string;
}

export interface TransitionSignal {
  /** From stage */
  from: LifecycleStage;
  /** To stage */
  to: LifecycleStage;
  /** Signal name */
  signal: string;
  /** Strength (0-1) */
  strength: number;
  /** What this means for investors */
  implication: string;
  /** Whether this transition is positive or negative */
  direction: 'positive' | 'neutral' | 'negative';
}

export interface LifecycleReport {
  /** Current stage */
  currentStage: StageProfile;
  /** All stage fit scores */
  allStages: StageProfile[];
  /** Detected transition signals */
  transitions: TransitionSignal[];
  /** Stage maturity (how deep into the current stage, 0-100) */
  stageMaturity: number;
  /** Estimated time to next stage (months) */
  timeToNextStage: number | null;
  /** Investment timing assessment */
  timing: {
    assessment: 'ideal' | 'good' | 'acceptable' | 'late' | 'too_early';
    explanation: string;
  };
  /** Stage history (if detectable from data) */
  stageHistory: { stage: LifecycleStage; startMonth: string; endMonth: string | null }[];
  /** Computed at */
  computedAt: number;
}

// ── Stage Definitions ────────────────────────────────────────────────

const STAGE_CONFIGS: Record<LifecycleStage, Omit<StageProfile, 'fit'>> = {
  ideation: {
    stage: 'ideation', name: 'Ideation', icon: '💡',
    description: 'Concept stage — no product, no users, just a vision.',
    typicalInvestors: ['Angel investors', 'Pre-seed funds', 'Friends & family'],
    keyMetrics: ['Team quality', 'Market size', 'Unique insight'],
    nextStageSignals: ['First MVP deployed', 'First users onboarded'],
    typicalValuation: '$500K - $3M',
  },
  mvp: {
    stage: 'mvp', name: 'MVP', icon: '🔨',
    description: 'First product built. Testing with early users. Seeking product-market fit.',
    typicalInvestors: ['Pre-seed funds', 'Angel syndicates', 'Accelerators'],
    keyMetrics: ['User engagement', 'Retention (D7, D30)', 'NPS', 'Feature usage'],
    nextStageSignals: ['First paying customers', 'Revenue > $0', 'Organic user growth'],
    typicalValuation: '$2M - $8M',
  },
  traction: {
    stage: 'traction', name: 'Traction', icon: '📈',
    description: 'Revenue generating. Growing users. Approaching product-market fit.',
    typicalInvestors: ['Seed VCs', 'Angel investors', 'Strategic angels'],
    keyMetrics: ['MRR growth', 'User growth', 'Retention', 'CAC'],
    nextStageSignals: ['MRR > $50K', 'Growth > 15% MoM sustained', 'Strong retention'],
    typicalValuation: '$5M - $20M',
  },
  growth: {
    stage: 'growth', name: 'Growth', icon: '🚀',
    description: 'Product-market fit achieved. Scaling aggressively. Repeatable growth engine.',
    typicalInvestors: ['Series A VCs', 'Growth funds', 'Crypto funds'],
    keyMetrics: ['Revenue growth rate', 'Unit economics (LTV/CAC)', 'Burn multiple', 'NRR'],
    nextStageSignals: ['MRR > $200K', 'Category leadership', 'Multiple growth channels'],
    typicalValuation: '$20M - $100M',
  },
  scale: {
    stage: 'scale', name: 'Scale', icon: '🌍',
    description: 'Category leader. Expanding to new markets, products, or geographies.',
    typicalInvestors: ['Growth equity', 'Late-stage VCs', 'Crossover funds'],
    keyMetrics: ['Revenue efficiency (Rule of 40)', 'Market share', 'Expansion revenue'],
    nextStageSignals: ['Revenue stabilizes', 'Multiple product lines', 'Profitability focus'],
    typicalValuation: '$100M - $1B+',
  },
  maturity: {
    stage: 'maturity', name: 'Maturity', icon: '🏛️',
    description: 'Established business. Focus on profitability and shareholder returns.',
    typicalInvestors: ['Public market investors', 'PE firms', 'Strategic acquirers'],
    keyMetrics: ['Profitability', 'Free cash flow', 'Dividend/buyback yield'],
    nextStageSignals: ['Market disruption', 'New competitor emergence'],
    typicalValuation: '$500M+',
  },
  decline: {
    stage: 'decline', name: 'Decline', icon: '📉',
    description: 'Metrics declining. Needs pivot, acquisition, or wind-down.',
    typicalInvestors: ['Turnaround specialists', 'Acqui-hirers'],
    keyMetrics: ['Burn rate', 'Runway', 'Customer churn'],
    nextStageSignals: ['Successful pivot', 'Acquisition offer', 'Shutdown'],
    typicalValuation: 'Asset value or pivot potential',
  },
};

// ── Stage Classification ─────────────────────────────────────────────

function classifyStage(startup: DbStartup, metrics: DbMetricsHistory[]): Map<LifecycleStage, number> {
  const mrr = startup.mrr;
  const growth = Number(startup.growth_rate);
  const users = startup.users;
  const team = startup.team_size;
  const dataMonths = metrics.length;

  const fits = new Map<LifecycleStage, number>();

  // Ideation
  fits.set('ideation', mrr === 0 && users < 100 ? 0.8 : mrr === 0 ? 0.4 : 0);

  // MVP
  fits.set('mvp', mrr > 0 && mrr < 10000 && users < 1000 ? 0.7 :
    mrr < 10000 ? 0.3 : 0);

  // Traction
  fits.set('traction', mrr >= 10000 && mrr < 50000 && growth > 5 ? 0.8 :
    mrr >= 5000 && mrr < 80000 ? 0.4 : 0);

  // Growth
  fits.set('growth', mrr >= 50000 && mrr < 300000 && growth >= 15 ? 0.9 :
    mrr >= 30000 && growth >= 10 ? 0.5 : 0);

  // Scale
  fits.set('scale', mrr >= 200000 && growth >= 10 && team >= 20 ? 0.8 :
    mrr >= 150000 && team >= 15 ? 0.4 : 0);

  // Maturity
  fits.set('maturity', mrr >= 500000 && growth < 10 && growth > 0 ? 0.7 :
    mrr >= 300000 && growth < 5 ? 0.3 : 0);

  // Decline
  fits.set('decline', growth < -5 && dataMonths >= 3 ? 0.8 :
    growth < 0 ? 0.5 : 0);

  return fits;
}

// ── Transition Detection ─────────────────────────────────────────────

function detectTransitions(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  currentStage: LifecycleStage,
): TransitionSignal[] {
  const signals: TransitionSignal[] = [];
  const growth = Number(startup.growth_rate);
  const mrr = startup.mrr;

  // Traction → Growth transition signals
  if (currentStage === 'traction') {
    if (growth >= 20 && mrr >= 30000) {
      signals.push({
        from: 'traction', to: 'growth',
        signal: 'Sustained high growth with meaningful revenue',
        strength: Math.min(1, growth / 30),
        implication: 'Product-market fit may be achieved — ideal time for Series A/Seed investment',
        direction: 'positive',
      });
    }
  }

  // Growth → Scale transition signals
  if (currentStage === 'growth') {
    if (mrr >= 200000 && startup.team_size >= 15) {
      signals.push({
        from: 'growth', to: 'scale',
        signal: 'Revenue and team size indicate scaling phase',
        strength: Math.min(1, mrr / 300000),
        implication: 'Moving beyond product-market fit into scaling — growth equity territory',
        direction: 'positive',
      });
    }
  }

  // Any → Decline signals
  if (growth < -5 && currentStage !== 'decline') {
    signals.push({
      from: currentStage, to: 'decline',
      signal: `Revenue declining at ${growth}% MoM`,
      strength: Math.min(1, Math.abs(growth) / 20),
      implication: 'WARNING: Stage regression detected — investigate root cause immediately',
      direction: 'negative',
    });
  }

  // MVP → Traction signals
  if (currentStage === 'mvp' && mrr >= 5000 && growth > 10) {
    signals.push({
      from: 'mvp', to: 'traction',
      signal: 'First meaningful revenue with growth',
      strength: Math.min(1, mrr / 15000),
      implication: 'Moving from building to selling — seed investment opportunity',
      direction: 'positive',
    });
  }

  return signals;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Detect startup lifecycle stage and transitions.
 */
export function detectLifecycle(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): LifecycleReport {
  const stageFits = classifyStage(startup, metrics);

  // Find best-fitting stage
  let bestStage: LifecycleStage = 'ideation';
  let bestFit = 0;
  for (const [stage, fit] of stageFits) {
    if (fit > bestFit) { bestFit = fit; bestStage = stage; }
  }

  // Build all stage profiles
  const allStages: StageProfile[] = Object.entries(STAGE_CONFIGS).map(([key, config]) => ({
    ...config,
    fit: stageFits.get(key as LifecycleStage) ?? 0,
  }));

  const currentStage = allStages.find(s => s.stage === bestStage)!;

  // Detect transitions
  const transitions = detectTransitions(startup, metrics, bestStage);

  // Stage maturity (how deep into this stage)
  const growth = Number(startup.growth_rate);
  let stageMaturity = 50;
  if (bestStage === 'traction') stageMaturity = Math.min(100, (startup.mrr / 50000) * 100);
  if (bestStage === 'growth') stageMaturity = Math.min(100, (startup.mrr / 300000) * 100);
  if (bestStage === 'scale') stageMaturity = Math.min(100, (startup.mrr / 500000) * 100);

  // Time to next stage
  const timeToNext = growth > 0 && bestStage !== 'maturity' && bestStage !== 'decline'
    ? Math.round((100 - stageMaturity) / (growth * 2))
    : null;

  // Investment timing
  const positiveTransitions = transitions.filter(t => t.direction === 'positive');
  const timing: LifecycleReport['timing'] = {
    assessment: positiveTransitions.length > 0 && stageMaturity < 50 ? 'ideal' :
      positiveTransitions.length > 0 ? 'good' :
      stageMaturity < 30 ? 'too_early' :
      stageMaturity > 80 ? 'late' : 'acceptable',
    explanation: positiveTransitions.length > 0
      ? `Stage transition signals detected — ${positiveTransitions[0].signal}. This is typically the best time to invest.`
      : stageMaturity < 30
      ? 'Very early in the current stage — high risk but maximum upside.'
      : stageMaturity > 80
      ? 'Late in the current stage — less upside, but lower risk. Wait for next transition.'
      : 'Mid-stage — reasonable entry point with balanced risk/reward.',
  };

  // Stage history (simplified)
  const stageHistory: LifecycleReport['stageHistory'] = [
    { stage: bestStage, startMonth: metrics.length > 0 ? metrics[0].month_date.slice(0, 7) : 'N/A', endMonth: null },
  ];

  return {
    currentStage, allStages, transitions, stageMaturity: Math.round(stageMaturity),
    timeToNextStage: timeToNext, timing, stageHistory,
    computedAt: Date.now(),
  };
}
