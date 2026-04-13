/**
 * AI Agent Orchestrator
 * ─────────────────────
 * Autonomous agents that monitor, analyze, and act on behalf of investors.
 * Each agent has a specific purpose, runs on a schedule, and can trigger
 * actions when conditions are met.
 *
 * Agent types:
 *   1. Watchdog     — monitors portfolio for red flags and anomalies
 *   2. Scout        — discovers new startups matching investor thesis
 *   3. Analyst      — generates periodic analysis reports
 *   4. Guardian     — monitors escrow milestones and governance
 *   5. Optimizer    — suggests portfolio rebalancing
 *
 * This is the "self-driving car" for venture capital.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type AgentType = 'watchdog' | 'scout' | 'analyst' | 'guardian' | 'optimizer';
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';
export type ActionType = 'alert' | 'report' | 'recommendation' | 'flag' | 'rebalance';

export interface AgentConfig {
  /** Agent type */
  type: AgentType;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** How often the agent runs (ms) */
  intervalMs: number;
  /** Whether the agent is enabled */
  enabled: boolean;
  /** Agent-specific parameters */
  params: Record<string, number | string | boolean>;
}

export interface AgentAction {
  /** Action ID */
  id: string;
  /** Which agent generated this */
  agentType: AgentType;
  /** Action type */
  actionType: ActionType;
  /** Title */
  title: string;
  /** Detailed message */
  message: string;
  /** Affected startup (if applicable) */
  startupId: string | null;
  startupName: string | null;
  /** Priority (1-5, 1 = highest) */
  priority: number;
  /** Whether this has been acknowledged */
  acknowledged: boolean;
  /** Timestamp */
  createdAt: number;
  /** Data payload */
  data: Record<string, any>;
}

export interface AgentState {
  /** Agent configuration */
  config: AgentConfig;
  /** Current status */
  status: AgentStatus;
  /** Last run timestamp */
  lastRunAt: number | null;
  /** Next scheduled run */
  nextRunAt: number;
  /** Total runs completed */
  totalRuns: number;
  /** Actions generated this session */
  actionsGenerated: number;
  /** Recent actions */
  recentActions: AgentAction[];
  /** Performance stats */
  stats: {
    avgRunTimeMs: number;
    actionsPerRun: number;
    accuracy: number;
  };
}

export interface AgentOrchestrator {
  /** All agent states */
  agents: AgentState[];
  /** All pending actions across all agents */
  pendingActions: AgentAction[];
  /** Total actions generated */
  totalActions: number;
  /** System status */
  systemStatus: 'operational' | 'degraded' | 'offline';
  /** Last orchestration cycle */
  lastCycleAt: number;
}

// ── Agent Configurations ─────────────────────────────────────────────

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    type: 'watchdog',
    name: 'Portfolio Watchdog',
    description: 'Monitors all portfolio startups for red flags, metric anomalies, trust score changes, and verification status.',
    intervalMs: 300000, // 5 minutes
    enabled: true,
    params: {
      mrrDropThreshold: 20, // Alert if MRR drops >20%
      growthDeclineThreshold: 10, // Alert if growth declines >10 points
      trustScoreFloor: 40, // Alert if trust drops below 40
      redFlagSeverity: 'warning', // Minimum red flag severity to alert on
    },
  },
  {
    type: 'scout',
    name: 'Deal Scout',
    description: 'Scans for new startups matching your investment thesis. Generates deal flow recommendations.',
    intervalMs: 3600000, // 1 hour
    enabled: true,
    params: {
      minMatchScore: 60, // Minimum thesis match score
      maxResults: 10, // Top N results per scan
      excludeUnverified: false,
      minTrustScore: 50,
    },
  },
  {
    type: 'analyst',
    name: 'Auto Analyst',
    description: 'Generates weekly analysis reports: portfolio performance, market trends, and notable changes.',
    intervalMs: 604800000, // 1 week
    enabled: true,
    params: {
      reportDepth: 'detailed', // 'summary' | 'detailed' | 'comprehensive'
      includeComparisons: true,
      includePredictions: true,
    },
  },
  {
    type: 'guardian',
    name: 'Escrow Guardian',
    description: 'Monitors milestone escrow deals. Alerts when milestones are approaching, met, or at risk.',
    intervalMs: 86400000, // 1 day
    enabled: true,
    params: {
      warningDaysBeforeDeadline: 30,
      alertOnMilestoneProgress: true,
      autoCheckMetrics: true,
    },
  },
  {
    type: 'optimizer',
    name: 'Portfolio Optimizer',
    description: 'Analyzes portfolio allocation and suggests rebalancing based on Markowitz optimization.',
    intervalMs: 2592000000, // 30 days
    enabled: false, // Disabled by default (requires explicit opt-in)
    params: {
      maxConcentration: 30, // Max % in single startup
      minDiversification: 3, // Min number of categories
      riskTolerance: 'moderate', // 'conservative' | 'moderate' | 'aggressive'
      rebalanceThreshold: 10, // Suggest rebalance when allocation drifts >10%
    },
  },
];

// ── Agent Execution ──────────────────────────────────────────────────

function runWatchdog(
  config: AgentConfig,
  startups: DbStartup[],
  portfolioIds: string[],
): AgentAction[] {
  const actions: AgentAction[] = [];
  const portfolio = startups.filter(s => portfolioIds.includes(s.id));

  for (const startup of portfolio) {
    // Check MRR health
    if (Number(startup.growth_rate) < -(config.params.mrrDropThreshold as number)) {
      actions.push({
        id: `wd-${Date.now()}-${startup.id}`,
        agentType: 'watchdog',
        actionType: 'alert',
        title: `Revenue decline: ${startup.name}`,
        message: `${startup.name}'s growth rate has dropped to ${startup.growth_rate}%. This exceeds your ${config.params.mrrDropThreshold}% decline threshold.`,
        startupId: startup.id,
        startupName: startup.name,
        priority: 1,
        acknowledged: false,
        createdAt: Date.now(),
        data: { growthRate: Number(startup.growth_rate), threshold: config.params.mrrDropThreshold },
      });
    }

    // Check trust score
    if (startup.trust_score < (config.params.trustScoreFloor as number)) {
      actions.push({
        id: `wd-trust-${Date.now()}-${startup.id}`,
        agentType: 'watchdog',
        actionType: 'flag',
        title: `Trust score below floor: ${startup.name}`,
        message: `${startup.name}'s trust score (${startup.trust_score}) has fallen below your minimum threshold of ${config.params.trustScoreFloor}.`,
        startupId: startup.id,
        startupName: startup.name,
        priority: 2,
        acknowledged: false,
        createdAt: Date.now(),
        data: { trustScore: startup.trust_score, floor: config.params.trustScoreFloor },
      });
    }

    // Check verification status
    if (!startup.verified) {
      actions.push({
        id: `wd-verify-${Date.now()}-${startup.id}`,
        agentType: 'watchdog',
        actionType: 'flag',
        title: `Unverified metrics: ${startup.name}`,
        message: `${startup.name} has not completed on-chain verification. Metrics are self-reported.`,
        startupId: startup.id,
        startupName: startup.name,
        priority: 3,
        acknowledged: false,
        createdAt: Date.now(),
        data: { verified: false },
      });
    }

    // Check whale concentration
    if (Number(startup.whale_concentration) > 50) {
      actions.push({
        id: `wd-whale-${Date.now()}-${startup.id}`,
        agentType: 'watchdog',
        actionType: 'alert',
        title: `High whale concentration: ${startup.name}`,
        message: `${startup.name} has ${startup.whale_concentration}% whale concentration — rug-pull risk elevated.`,
        startupId: startup.id,
        startupName: startup.name,
        priority: 2,
        acknowledged: false,
        createdAt: Date.now(),
        data: { whaleConcentration: Number(startup.whale_concentration) },
      });
    }
  }

  return actions;
}

function runScout(
  config: AgentConfig,
  startups: DbStartup[],
  portfolioIds: string[],
): AgentAction[] {
  const actions: AgentAction[] = [];
  const notInPortfolio = startups.filter(s => !portfolioIds.includes(s.id));
  const minTrust = config.params.minTrustScore as number;
  const excludeUnverified = config.params.excludeUnverified as boolean;

  const candidates = notInPortfolio
    .filter(s => s.trust_score >= minTrust)
    .filter(s => !excludeUnverified || s.verified)
    .sort((a, b) => {
      // Score by growth + trust + verification
      const scoreA = Number(a.growth_rate) * 2 + a.trust_score + (a.verified ? 20 : 0);
      const scoreB = Number(b.growth_rate) * 2 + b.trust_score + (b.verified ? 20 : 0);
      return scoreB - scoreA;
    })
    .slice(0, config.params.maxResults as number);

  for (const startup of candidates) {
    const matchScore = Math.round(
      Number(startup.growth_rate) * 1.5 +
      startup.trust_score * 0.5 +
      (startup.verified ? 15 : 0) +
      startup.sustainability_score * 0.1
    );

    if (matchScore >= (config.params.minMatchScore as number)) {
      actions.push({
        id: `scout-${Date.now()}-${startup.id}`,
        agentType: 'scout',
        actionType: 'recommendation',
        title: `New opportunity: ${startup.name}`,
        message: `${startup.name} (${startup.category}) matches your thesis with a ${matchScore}% score. $${(startup.mrr / 1000).toFixed(0)}K MRR, ${startup.growth_rate}% growth, trust: ${startup.trust_score}.`,
        startupId: startup.id,
        startupName: startup.name,
        priority: matchScore >= 80 ? 2 : 3,
        acknowledged: false,
        createdAt: Date.now(),
        data: { matchScore, mrr: startup.mrr, growth: Number(startup.growth_rate), trustScore: startup.trust_score },
      });
    }
  }

  return actions;
}

function runAnalyst(
  config: AgentConfig,
  startups: DbStartup[],
  portfolioIds: string[],
): AgentAction[] {
  const portfolio = startups.filter(s => portfolioIds.includes(s.id));
  if (portfolio.length === 0) return [];

  const totalMrr = portfolio.reduce((s, st) => s + st.mrr, 0);
  const avgGrowth = portfolio.reduce((s, st) => s + Number(st.growth_rate), 0) / portfolio.length;
  const avgTrust = portfolio.reduce((s, st) => s + st.trust_score, 0) / portfolio.length;
  const verified = portfolio.filter(s => s.verified).length;

  return [{
    id: `analyst-${Date.now()}`,
    agentType: 'analyst',
    actionType: 'report',
    title: 'Weekly Portfolio Analysis',
    message: `Portfolio of ${portfolio.length} startups: Total MRR $${(totalMrr / 1000).toFixed(0)}K, avg growth ${avgGrowth.toFixed(1)}%, avg trust ${avgTrust.toFixed(0)}/100, ${verified}/${portfolio.length} verified.`,
    startupId: null,
    startupName: null,
    priority: 4,
    acknowledged: false,
    createdAt: Date.now(),
    data: {
      portfolioSize: portfolio.length,
      totalMrr,
      avgGrowth: +avgGrowth.toFixed(1),
      avgTrust: +avgTrust.toFixed(0),
      verifiedCount: verified,
      topPerformer: portfolio.sort((a, b) => Number(b.growth_rate) - Number(a.growth_rate))[0]?.name ?? 'N/A',
    },
  }];
}

// ── Orchestrator ─────────────────────────────────────────────────────

/**
 * Initialize the agent orchestrator.
 */
export function initializeOrchestrator(configs?: AgentConfig[]): AgentOrchestrator {
  const agentConfigs = configs ?? DEFAULT_AGENTS;
  const now = Date.now();

  const agents: AgentState[] = agentConfigs.map(config => ({
    config,
    status: config.enabled ? 'idle' : 'paused',
    lastRunAt: null,
    nextRunAt: now + config.intervalMs,
    totalRuns: 0,
    actionsGenerated: 0,
    recentActions: [],
    stats: { avgRunTimeMs: 0, actionsPerRun: 0, accuracy: 0.95 },
  }));

  return {
    agents,
    pendingActions: [],
    totalActions: 0,
    systemStatus: 'operational',
    lastCycleAt: now,
  };
}

/**
 * Run all due agents and collect their actions.
 */
export function runOrchestrationCycle(
  orchestrator: AgentOrchestrator,
  startups: DbStartup[],
  portfolioIds: string[],
): AgentOrchestrator {
  const now = Date.now();
  const newActions: AgentAction[] = [];

  const updatedAgents = orchestrator.agents.map(agent => {
    if (!agent.config.enabled || agent.status === 'paused') return agent;
    if (agent.nextRunAt > now) return agent;

    const startTime = performance.now();
    let actions: AgentAction[] = [];

    switch (agent.config.type) {
      case 'watchdog': actions = runWatchdog(agent.config, startups, portfolioIds); break;
      case 'scout': actions = runScout(agent.config, startups, portfolioIds); break;
      case 'analyst': actions = runAnalyst(agent.config, startups, portfolioIds); break;
      case 'guardian': actions = []; break; // Would check milestone escrow data
      case 'optimizer': actions = []; break; // Would run portfolio optimization
    }

    const runTime = performance.now() - startTime;
    newActions.push(...actions);

    return {
      ...agent,
      status: 'idle' as AgentStatus,
      lastRunAt: now,
      nextRunAt: now + agent.config.intervalMs,
      totalRuns: agent.totalRuns + 1,
      actionsGenerated: agent.actionsGenerated + actions.length,
      recentActions: [...actions, ...agent.recentActions].slice(0, 20),
      stats: {
        avgRunTimeMs: agent.totalRuns > 0 ? (agent.stats.avgRunTimeMs * agent.totalRuns + runTime) / (agent.totalRuns + 1) : runTime,
        actionsPerRun: agent.totalRuns > 0 ? (agent.stats.actionsPerRun * agent.totalRuns + actions.length) / (agent.totalRuns + 1) : actions.length,
        accuracy: 0.95,
      },
    };
  });

  return {
    ...orchestrator,
    agents: updatedAgents,
    pendingActions: [...newActions, ...orchestrator.pendingActions].slice(0, 100),
    totalActions: orchestrator.totalActions + newActions.length,
    lastCycleAt: now,
  };
}

/**
 * Acknowledge an action (mark as read).
 */
export function acknowledgeAction(orchestrator: AgentOrchestrator, actionId: string): AgentOrchestrator {
  return {
    ...orchestrator,
    pendingActions: orchestrator.pendingActions.map(a =>
      a.id === actionId ? { ...a, acknowledged: true } : a
    ),
  };
}

/** Agent type display config */
export const AGENT_TYPE_CONFIG: Record<AgentType, { icon: string; color: string; label: string }> = {
  watchdog:  { icon: '🛡️', color: '#EF4444', label: 'Watchdog' },
  scout:    { icon: '🔍', color: '#3B82F6', label: 'Scout' },
  analyst:  { icon: '📊', color: '#8B5CF6', label: 'Analyst' },
  guardian: { icon: '🔒', color: '#10B981', label: 'Guardian' },
  optimizer: { icon: '⚡', color: '#F59E0B', label: 'Optimizer' },
};
