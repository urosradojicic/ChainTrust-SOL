/**
 * Execution Velocity Tracker
 * ──────────────────────────
 * Measures how fast a startup ships, iterates, and responds to data.
 * Execution speed is the #1 predictor of startup success.
 *
 * Metrics:
 *   - Metrics reporting frequency (how often they update)
 *   - Growth acceleration rate (getting faster or slower)
 *   - Response to red flags (do they fix issues?)
 *   - Feature velocity (product improvement rate)
 *   - Capital deployment speed (how fast they spend wisely)
 */

import type { DbStartup, DbMetricsHistory, DbAuditEntry } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface VelocityMetric {
  name: string;
  score: number; // 0-100
  trend: 'accelerating' | 'stable' | 'decelerating';
  detail: string;
  benchmark: string;
}

export interface ExecutionVelocityReport {
  /** Overall velocity score (0-100) */
  velocityScore: number;
  /** Speed grade */
  grade: 'Lightning' | 'Fast' | 'Steady' | 'Slow' | 'Stalled';
  /** Individual metrics */
  metrics: VelocityMetric[];
  /** Execution momentum (is velocity increasing or decreasing?) */
  momentum: 'increasing' | 'stable' | 'decreasing';
  /** Compared to peers */
  peerComparison: { metric: string; startup: number; peerAvg: number; percentile: number }[];
  /** Key insight */
  insight: string;
  /** Computed at */
  computedAt: number;
}

// ── Metric Computation ───────────────────────────────────────────────

function scoreReportingFrequency(metrics: DbMetricsHistory[]): VelocityMetric {
  const count = metrics.length;
  const score = count >= 6 ? 90 : count >= 4 ? 70 : count >= 2 ? 40 : 10;

  // Check for gaps
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  let gaps = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].month_date);
    const curr = new Date(sorted[i].month_date);
    const monthDiff = (curr.getFullYear() - prev.getFullYear()) * 12 + curr.getMonth() - prev.getMonth();
    if (monthDiff > 1) gaps++;
  }

  const adjustedScore = Math.max(0, score - gaps * 15);

  return {
    name: 'Reporting Frequency',
    score: adjustedScore,
    trend: count >= 6 && gaps === 0 ? 'accelerating' : gaps > 0 ? 'decelerating' : 'stable',
    detail: `${count} reports submitted${gaps > 0 ? `, ${gaps} gap(s) detected` : ', no gaps'}`,
    benchmark: '6+ consecutive monthly reports = top tier',
  };
}

function scoreGrowthAcceleration(metrics: DbMetricsHistory[]): VelocityMetric {
  if (metrics.length < 4) return { name: 'Growth Acceleration', score: 50, trend: 'stable', detail: 'Insufficient data', benchmark: 'Need 4+ months' };

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const growthRates = sorted.map(m => Number(m.growth_rate));
  const firstHalf = growthRates.slice(0, Math.floor(growthRates.length / 2));
  const secondHalf = growthRates.slice(Math.floor(growthRates.length / 2));
  const firstAvg = firstHalf.reduce((s, g) => s + g, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, g) => s + g, 0) / secondHalf.length;
  const acceleration = secondAvg - firstAvg;

  let score: number;
  let trend: VelocityMetric['trend'];
  if (acceleration > 5) { score = 90; trend = 'accelerating'; }
  else if (acceleration > 0) { score = 70; trend = 'stable'; }
  else if (acceleration > -5) { score = 40; trend = 'decelerating'; }
  else { score = 15; trend = 'decelerating'; }

  return {
    name: 'Growth Acceleration',
    score,
    trend,
    detail: `Growth ${acceleration >= 0 ? 'accelerated' : 'decelerated'} by ${Math.abs(acceleration).toFixed(1)} percentage points (${firstAvg.toFixed(1)}% → ${secondAvg.toFixed(1)}%)`,
    benchmark: 'Consistent acceleration = product-market fit signal',
  };
}

function scoreCapitalDeployment(startup: DbStartup, metrics: DbMetricsHistory[]): VelocityMetric {
  if (metrics.length < 2) return { name: 'Capital Deployment', score: 50, trend: 'stable', detail: 'Insufficient data', benchmark: 'Need 2+ months' };

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const lastRev = Number(sorted[sorted.length - 1].revenue);
  const lastCost = Number(sorted[sorted.length - 1].costs);
  const firstRev = Number(sorted[0].revenue);

  // Revenue generated per dollar of treasury spent
  const revenueGrowth = lastRev - firstRev;
  const totalCosts = sorted.reduce((s, m) => s + Number(m.costs), 0);
  const efficiency = totalCosts > 0 ? revenueGrowth / totalCosts : 0;

  let score: number;
  if (efficiency > 0.3) score = 90;
  else if (efficiency > 0.1) score = 70;
  else if (efficiency > 0) score = 50;
  else score = 20;

  return {
    name: 'Capital Deployment',
    score,
    trend: efficiency > 0.1 ? 'accelerating' : 'stable',
    detail: `$${Math.abs(revenueGrowth).toFixed(0)} revenue ${revenueGrowth >= 0 ? 'gained' : 'lost'} per $${totalCosts.toFixed(0)} spent`,
    benchmark: '>$0.30 revenue gained per $1 spent = excellent',
  };
}

function scoreDataQuality(startup: DbStartup): VelocityMetric {
  let score = 30;
  const parts: string[] = [];

  if (startup.verified) { score += 30; parts.push('on-chain verified'); }
  if (startup.trust_score >= 70) { score += 20; parts.push(`trust: ${startup.trust_score}`); }
  if (startup.description && startup.description.length > 50) { score += 10; parts.push('complete profile'); }
  if (startup.website) { score += 5; parts.push('website linked'); }
  if (startup.founded_date) { score += 5; parts.push('founded date set'); }

  return {
    name: 'Data Quality & Transparency',
    score: Math.min(100, score),
    trend: startup.verified ? 'accelerating' : 'stable',
    detail: parts.length > 0 ? parts.join(', ') : 'Basic profile only',
    benchmark: 'Verified + trust >70 + complete profile = top tier',
  };
}

function scoreTeamVelocity(startup: DbStartup): VelocityMetric {
  const growth = Number(startup.growth_rate);
  const revPerHead = startup.team_size > 0 ? (startup.mrr * 12) / startup.team_size : 0;

  let score = 30;
  if (growth > 20 && startup.team_size < 15) { score += 30; } // Small team, big growth = fast execution
  else if (growth > 10) { score += 15; }
  if (revPerHead > 150000) { score += 25; }
  else if (revPerHead > 80000) { score += 10; }

  return {
    name: 'Team Velocity',
    score: Math.min(100, score),
    trend: growth > 15 ? 'accelerating' : 'stable',
    detail: `${startup.team_size} people, ${growth}% growth, $${(revPerHead / 1000).toFixed(0)}K ARR/head`,
    benchmark: 'High growth with lean team = exceptional execution speed',
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate execution velocity report.
 */
export function trackExecutionVelocity(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): ExecutionVelocityReport {
  const velocityMetrics: VelocityMetric[] = [
    scoreReportingFrequency(metrics),
    scoreGrowthAcceleration(metrics),
    scoreCapitalDeployment(startup, metrics),
    scoreDataQuality(startup),
    scoreTeamVelocity(startup),
  ];

  const velocityScore = Math.round(
    velocityMetrics.reduce((s, m) => s + m.score, 0) / velocityMetrics.length
  );

  const grade: ExecutionVelocityReport['grade'] =
    velocityScore >= 85 ? 'Lightning' :
    velocityScore >= 65 ? 'Fast' :
    velocityScore >= 45 ? 'Steady' :
    velocityScore >= 25 ? 'Slow' :
    'Stalled';

  // Momentum
  const accelCount = velocityMetrics.filter(m => m.trend === 'accelerating').length;
  const decelCount = velocityMetrics.filter(m => m.trend === 'decelerating').length;
  const momentum: ExecutionVelocityReport['momentum'] =
    accelCount >= 3 ? 'increasing' : decelCount >= 3 ? 'decreasing' : 'stable';

  // Peer comparison
  const peerComparison = [
    {
      metric: 'Growth Rate',
      startup: Number(startup.growth_rate),
      peerAvg: +(allStartups.reduce((s, st) => s + Number(st.growth_rate), 0) / allStartups.length).toFixed(1),
      percentile: Math.round(allStartups.filter(s => Number(s.growth_rate) < Number(startup.growth_rate)).length / allStartups.length * 100),
    },
    {
      metric: 'Trust Score',
      startup: startup.trust_score,
      peerAvg: +(allStartups.reduce((s, st) => s + st.trust_score, 0) / allStartups.length).toFixed(0),
      percentile: Math.round(allStartups.filter(s => s.trust_score < startup.trust_score).length / allStartups.length * 100),
    },
  ];

  const insight = grade === 'Lightning'
    ? `${startup.name} is executing at elite speed — shipping fast, growing faster, and deploying capital efficiently.`
    : grade === 'Fast'
    ? `${startup.name} shows strong execution. Keep this pace and product-market fit is within reach.`
    : grade === 'Steady'
    ? `${startup.name} is making progress but could accelerate. Look for catalysts to shift into higher gear.`
    : `${startup.name}'s execution needs improvement. Focus resources on the highest-impact activities.`;

  return { velocityScore, grade, metrics: velocityMetrics, momentum, peerComparison, insight, computedAt: Date.now() };
}
