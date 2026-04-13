/**
 * Smart Alert System
 * ──────────────────
 * Configurable real-time alerts on metric changes.
 * Investors set thresholds; the system fires alerts when conditions are met.
 *
 * Alert types:
 *   - Threshold breach (metric crosses a value)
 *   - Trend change (growth reverses direction)
 *   - Anomaly detected (red flag system integration)
 *   - Milestone achieved (escrow milestone met)
 *   - Verification event (startup verifies or de-verifies)
 *   - Peer divergence (startup diverges from category peers)
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type AlertType = 'threshold' | 'trend' | 'anomaly' | 'milestone' | 'verification' | 'peer_divergence';
export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertChannel = 'in_app' | 'email' | 'webhook' | 'telegram';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  /** Startup ID to watch (null = all startups) */
  startupId: string | null;
  /** Metric to monitor */
  metric: string;
  /** Condition */
  condition: {
    operator: '>' | '<' | '>=' | '<=' | '==' | 'changes_by';
    value: number;
    /** For changes_by: percentage change threshold */
    changePercent?: number;
    /** Time window for trend detection (months) */
    timeWindow?: number;
  };
  /** Alert priority */
  priority: AlertPriority;
  /** Delivery channels */
  channels: AlertChannel[];
  /** Whether this rule is active */
  active: boolean;
  /** Cooldown between alerts (ms) */
  cooldownMs: number;
  /** Last triggered timestamp */
  lastTriggeredAt: number | null;
  /** Times triggered */
  triggerCount: number;
  /** Created at */
  createdAt: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  type: AlertType;
  priority: AlertPriority;
  /** Startup that triggered this alert */
  startupId: string;
  startupName: string;
  /** Alert message */
  message: string;
  /** Current metric value */
  currentValue: number;
  /** Threshold that was crossed */
  thresholdValue: number;
  /** Whether the alert has been read/acknowledged */
  read: boolean;
  /** Whether the alert has been dismissed */
  dismissed: boolean;
  /** Triggered at */
  triggeredAt: number;
  /** Action URL (link to relevant page) */
  actionUrl: string;
}

// ── Alert Rule Templates ─────────────────────────────────────────────

export const ALERT_RULE_TEMPLATES: Omit<AlertRule, 'id' | 'lastTriggeredAt' | 'triggerCount' | 'createdAt'>[] = [
  {
    name: 'MRR drops below threshold',
    type: 'threshold',
    startupId: null,
    metric: 'mrr',
    condition: { operator: '<', value: 50000 },
    priority: 'high',
    channels: ['in_app'],
    active: true,
    cooldownMs: 24 * 3600 * 1000,
  },
  {
    name: 'Growth rate turns negative',
    type: 'threshold',
    startupId: null,
    metric: 'growth_rate',
    condition: { operator: '<', value: 0 },
    priority: 'critical',
    channels: ['in_app', 'email'],
    active: true,
    cooldownMs: 7 * 24 * 3600 * 1000,
  },
  {
    name: 'Trust score drops below 50',
    type: 'threshold',
    startupId: null,
    metric: 'trust_score',
    condition: { operator: '<', value: 50 },
    priority: 'high',
    channels: ['in_app'],
    active: true,
    cooldownMs: 24 * 3600 * 1000,
  },
  {
    name: 'Whale concentration exceeds 40%',
    type: 'threshold',
    startupId: null,
    metric: 'whale_concentration',
    condition: { operator: '>', value: 40 },
    priority: 'medium',
    channels: ['in_app'],
    active: true,
    cooldownMs: 7 * 24 * 3600 * 1000,
  },
  {
    name: 'Growth decelerates significantly',
    type: 'trend',
    startupId: null,
    metric: 'growth_rate',
    condition: { operator: 'changes_by', value: 0, changePercent: -30, timeWindow: 3 },
    priority: 'high',
    channels: ['in_app'],
    active: true,
    cooldownMs: 30 * 24 * 3600 * 1000,
  },
  {
    name: 'Startup loses verification',
    type: 'verification',
    startupId: null,
    metric: 'verified',
    condition: { operator: '==', value: 0 },
    priority: 'critical',
    channels: ['in_app', 'email'],
    active: true,
    cooldownMs: 24 * 3600 * 1000,
  },
  {
    name: 'MRR exceeds $100K (milestone)',
    type: 'milestone',
    startupId: null,
    metric: 'mrr',
    condition: { operator: '>=', value: 100000 },
    priority: 'low',
    channels: ['in_app'],
    active: true,
    cooldownMs: 0,
  },
  {
    name: 'Sustainability score drops below 30',
    type: 'threshold',
    startupId: null,
    metric: 'sustainability_score',
    condition: { operator: '<', value: 30 },
    priority: 'medium',
    channels: ['in_app'],
    active: true,
    cooldownMs: 7 * 24 * 3600 * 1000,
  },
];

// ── Alert Evaluation ─────────────────────────────────────────────────

function getMetricValue(startup: DbStartup, metric: string): number {
  const mapping: Record<string, number> = {
    mrr: startup.mrr,
    growth_rate: Number(startup.growth_rate),
    trust_score: startup.trust_score,
    sustainability_score: startup.sustainability_score,
    whale_concentration: Number(startup.whale_concentration),
    inflation_rate: Number(startup.inflation_rate),
    users: startup.users,
    treasury: startup.treasury,
    team_size: startup.team_size,
    verified: startup.verified ? 1 : 0,
  };
  return mapping[metric] ?? 0;
}

function evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
  switch (condition.operator) {
    case '>': return value > condition.value;
    case '<': return value < condition.value;
    case '>=': return value >= condition.value;
    case '<=': return value <= condition.value;
    case '==': return value === condition.value;
    case 'changes_by': return false; // Requires historical data
    default: return false;
  }
}

/**
 * Check all alert rules against current startup data.
 * Returns newly triggered alerts.
 */
export function evaluateAlerts(
  rules: AlertRule[],
  startups: DbStartup[],
): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  for (const rule of rules) {
    if (!rule.active) continue;

    // Cooldown check
    if (rule.lastTriggeredAt && (now - rule.lastTriggeredAt) < rule.cooldownMs) continue;

    const targets = rule.startupId
      ? startups.filter(s => s.id === rule.startupId)
      : startups;

    for (const startup of targets) {
      const value = getMetricValue(startup, rule.metric);

      if (evaluateCondition(value, rule.condition)) {
        alerts.push({
          id: `alert-${now}-${Math.random().toString(36).slice(2, 8)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          priority: rule.priority,
          startupId: startup.id,
          startupName: startup.name,
          message: `${startup.name}: ${rule.name} — ${rule.metric} is ${value.toLocaleString()} (threshold: ${rule.condition.operator} ${rule.condition.value.toLocaleString()})`,
          currentValue: value,
          thresholdValue: rule.condition.value,
          read: false,
          dismissed: false,
          triggeredAt: now,
          actionUrl: `/startup/${startup.id}`,
        });
      }
    }
  }

  return alerts;
}

/**
 * Create a new alert rule from a template.
 */
export function createAlertRule(
  template: typeof ALERT_RULE_TEMPLATES[number],
  startupId?: string,
): AlertRule {
  return {
    ...template,
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startupId: startupId ?? template.startupId,
    lastTriggeredAt: null,
    triggerCount: 0,
    createdAt: Date.now(),
  };
}

/**
 * Initialize default alert rules for a new investor.
 */
export function initializeDefaultRules(): AlertRule[] {
  return ALERT_RULE_TEMPLATES.map(t => createAlertRule(t));
}

/** Priority config for UI */
export const PRIORITY_CONFIG: Record<AlertPriority, { label: string; color: string; bg: string; icon: string }> = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10', icon: '🔴' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: '🟠' },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: '🟡' },
  low: { label: 'Low', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: '🔵' },
};
