/**
 * Smart portfolio monitoring — automated alerts for investor portfolios.
 * Detects anomalies, metric changes, and risk events across tracked startups.
 * Runs client-side with zero API cost.
 */
import { useMemo } from 'react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'positive';

export interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  startupId: string;
  startupName: string;
  category: string;
  timestamp: number;
  actionUrl: string;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2, positive: 3 };

/**
 * Generate smart alerts from startup data — no AI API calls, all deterministic.
 */
export function generateSmartAlerts(
  startups: DbStartup[],
  metricsMap: Map<string, DbMetricsHistory[]>,
  portfolioIds: string[],
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const tracked = portfolioIds.length > 0
    ? startups.filter(s => portfolioIds.includes(s.id))
    : startups.slice(0, 10); // Default: top 10

  for (const s of tracked) {
    const metrics = metricsMap.get(s.id) ?? [];

    // MRR decline alert
    if (metrics.length >= 2) {
      const latest = metrics[metrics.length - 1];
      const prev = metrics[metrics.length - 2];
      const prevRevenue = Number(prev.revenue) || 0;
      const mrrChange = prevRevenue > 0
        ? ((Number(latest.revenue) - prevRevenue) / prevRevenue) * 100
        : 0;

      if (mrrChange < -20) {
        alerts.push({
          id: `mrr-drop-${s.id}`,
          severity: 'critical',
          title: `${s.name}: Revenue dropped ${Math.abs(mrrChange).toFixed(0)}%`,
          detail: `MRR fell from $${Number(prev.revenue).toLocaleString()} to $${Number(latest.revenue).toLocaleString()} — investigate immediately.`,
          startupId: s.id,
          startupName: s.name,
          category: 'revenue',
          timestamp: Date.now(),
          actionUrl: `/startup/${s.id}`,
        });
      } else if (mrrChange < -5) {
        alerts.push({
          id: `mrr-dip-${s.id}`,
          severity: 'warning',
          title: `${s.name}: Revenue declined ${Math.abs(mrrChange).toFixed(1)}%`,
          detail: `Month-over-month MRR decrease detected. Monitor for trend continuation.`,
          startupId: s.id,
          startupName: s.name,
          category: 'revenue',
          timestamp: Date.now(),
          actionUrl: `/startup/${s.id}`,
        });
      } else if (mrrChange > 30) {
        alerts.push({
          id: `mrr-surge-${s.id}`,
          severity: 'positive',
          title: `${s.name}: Revenue surged +${mrrChange.toFixed(0)}%`,
          detail: `Strong MoM growth from $${Number(prev.revenue).toLocaleString()} to $${Number(latest.revenue).toLocaleString()}.`,
          startupId: s.id,
          startupName: s.name,
          category: 'revenue',
          timestamp: Date.now(),
          actionUrl: `/startup/${s.id}`,
        });
      }
    }

    // Trust score drop
    if (s.trust_score < 40) {
      alerts.push({
        id: `trust-low-${s.id}`,
        severity: 'critical',
        title: `${s.name}: Trust score critically low (${s.trust_score})`,
        detail: `Trust score is below 40. Review verification status and on-chain data.`,
        startupId: s.id,
        startupName: s.name,
        category: 'trust',
        timestamp: Date.now(),
        actionUrl: `/startup/${s.id}`,
      });
    }

    // Whale concentration warning
    if (s.whale_concentration > 60) {
      alerts.push({
        id: `whale-${s.id}`,
        severity: 'warning',
        title: `${s.name}: High token concentration (${s.whale_concentration}%)`,
        detail: `Top holders control ${s.whale_concentration}% of supply. Potential sell pressure risk.`,
        startupId: s.id,
        startupName: s.name,
        category: 'tokenomics',
        timestamp: Date.now(),
        actionUrl: `/startup/${s.id}`,
      });
    }

    // Verification nudge: high trust score but not yet verified — encourage them to verify
    if (!s.verified && s.trust_score > 70) {
      alerts.push({
        id: `unverified-${s.id}`,
        severity: 'info',
        title: `${s.name}: High trust but not yet verified`,
        detail: `Trust score is ${s.trust_score} but startup hasn't completed on-chain oracle verification. Recommend they apply to strengthen credibility.`,
        startupId: s.id,
        startupName: s.name,
        category: 'verification',
        timestamp: Date.now(),
        actionUrl: `/startup/${s.id}`,
      });
    }

    // Low runway warning
    const treasury = Number(s.treasury) || 0;
    const mrr = s.mrr || 0;
    const runwayMonths = (treasury > 0 && mrr > 0) ? Math.round(treasury / (mrr * 0.7)) : 0;
    if (runwayMonths > 0 && runwayMonths < 6) {
      alerts.push({
        id: `runway-${s.id}`,
        severity: 'warning',
        title: `${s.name}: Low runway (~${runwayMonths} months)`,
        detail: `At current burn rate, treasury runs out in ~${runwayMonths} months. Fundraise may be needed.`,
        startupId: s.id,
        startupName: s.name,
        category: 'financial',
        timestamp: Date.now(),
        actionUrl: `/startup/${s.id}`,
      });
    }

    // Growth stall
    if (Number(s.growth_rate) <= 0 && s.mrr > 10000) {
      alerts.push({
        id: `growth-stall-${s.id}`,
        severity: 'warning',
        title: `${s.name}: Growth stalled (${s.growth_rate}%)`,
        detail: `No revenue growth detected for a startup with $${s.mrr.toLocaleString()} MRR. May indicate product-market fit issues.`,
        startupId: s.id,
        startupName: s.name,
        category: 'growth',
        timestamp: Date.now(),
        actionUrl: `/startup/${s.id}`,
      });
    }
  }

  // Sort by severity
  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * Hook: auto-generate smart alerts for portfolio startups.
 */
export function useSmartAlerts(
  startups: DbStartup[],
  metricsMap: Map<string, DbMetricsHistory[]>,
  portfolioIds: string[],
) {
  const alerts = useMemo(
    () => generateSmartAlerts(startups, metricsMap, portfolioIds),
    [startups, metricsMap, portfolioIds],
  );

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return { alerts, criticalCount, warningCount };
}
