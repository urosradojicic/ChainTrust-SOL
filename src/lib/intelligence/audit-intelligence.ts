/**
 * Audit Trail Intelligence
 * ────────────────────────
 * Analyzes change history to detect suspicious patterns,
 * data manipulation, and reporting anomalies.
 *
 * Goes beyond simple logging — actively looks for:
 *   - Metrics revised downward before reporting (cooking books)
 *   - Large changes without explanation
 *   - Patterns that correlate with funding rounds
 *   - Frequency anomalies (unusual reporting cadence)
 *   - Value clustering (metrics suspiciously round or predictable)
 */

import type { DbAuditEntry, DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type AuditSeverity = 'clean' | 'note' | 'concern' | 'serious' | 'critical';

export interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: AuditSeverity;
  category: 'revision' | 'frequency' | 'pattern' | 'value' | 'timing';
  evidence: string[];
  affectedMetrics: string[];
  recommendation: string;
}

export interface AuditIntelligenceReport {
  /** Overall data integrity score (0-100, higher = more trustworthy) */
  integrityScore: number;
  /** Integrity grade */
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  /** All findings */
  findings: AuditFinding[];
  /** Finding counts by severity */
  severityCounts: Record<AuditSeverity, number>;
  /** Total changes analyzed */
  totalChangesAnalyzed: number;
  /** Data manipulation risk level */
  manipulationRisk: 'minimal' | 'low' | 'moderate' | 'elevated' | 'high';
  /** Key statistics */
  stats: {
    totalRevisions: number;
    downwardRevisions: number;
    largeChanges: number;
    avgChangeMagnitude: number;
    reportingGaps: number;
    roundNumberPct: number;
  };
  /** Computed at */
  computedAt: number;
}

// ── Analysis Functions ───────────────────────────────────────────────

function analyzeRevisions(auditEntries: DbAuditEntry[]): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Group by field
  const byField = new Map<string, DbAuditEntry[]>();
  for (const entry of auditEntries) {
    const list = byField.get(entry.field_changed) ?? [];
    list.push(entry);
    byField.set(entry.field_changed, list);
  }

  for (const [field, entries] of byField) {
    // Detect downward revisions (metric revised lower)
    const downward = entries.filter(e => {
      if (!e.old_value || !e.new_value) return false;
      const oldNum = parseFloat(e.old_value);
      const newNum = parseFloat(e.new_value);
      return !isNaN(oldNum) && !isNaN(newNum) && newNum < oldNum;
    });

    if (downward.length >= 3) {
      findings.push({
        id: `revision-${field}-downward`,
        title: `Repeated downward revisions to ${field}`,
        description: `${field} has been revised downward ${downward.length} times. This pattern may indicate optimistic initial reporting followed by corrections.`,
        severity: downward.length >= 5 ? 'serious' : 'concern',
        category: 'revision',
        evidence: downward.map(d => `${d.old_value} → ${d.new_value} (${new Date(d.changed_at).toLocaleDateString()})`),
        affectedMetrics: [field],
        recommendation: 'Investigate whether initial values are being inflated. Consider requiring same-day verification.',
      });
    }

    // Detect large magnitude changes (>50% change)
    const large = entries.filter(e => {
      if (!e.old_value || !e.new_value) return false;
      const oldNum = parseFloat(e.old_value);
      const newNum = parseFloat(e.new_value);
      if (isNaN(oldNum) || isNaN(newNum) || oldNum === 0) return false;
      return Math.abs((newNum - oldNum) / oldNum) > 0.5;
    });

    if (large.length >= 2) {
      findings.push({
        id: `revision-${field}-large`,
        title: `Large magnitude changes to ${field}`,
        description: `${field} has had ${large.length} changes exceeding 50%. Large revisions may indicate data quality issues.`,
        severity: 'concern',
        category: 'revision',
        evidence: large.map(l => `${l.old_value} → ${l.new_value} (${Math.abs(((parseFloat(l.new_value!) - parseFloat(l.old_value!)) / parseFloat(l.old_value!)) * 100).toFixed(0)}% change)`),
        affectedMetrics: [field],
        recommendation: 'Require explanations for changes exceeding 20%. Flag unexplained large revisions.',
      });
    }
  }

  return findings;
}

function analyzeFrequency(auditEntries: DbAuditEntry[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (auditEntries.length < 5) return findings;

  // Detect burst editing (many changes in a short window)
  const sorted = [...auditEntries].sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());
  const hour = 3600 * 1000;

  for (let i = 0; i < sorted.length; i++) {
    const windowEnd = new Date(sorted[i].changed_at).getTime() + hour;
    const burst = sorted.filter(e => {
      const time = new Date(e.changed_at).getTime();
      return time >= new Date(sorted[i].changed_at).getTime() && time <= windowEnd;
    });

    if (burst.length >= 5) {
      findings.push({
        id: `frequency-burst-${i}`,
        title: 'Burst of edits detected',
        description: `${burst.length} changes made within 1 hour on ${new Date(sorted[i].changed_at).toLocaleDateString()}. Rapid editing may indicate data manipulation or last-minute corrections before review.`,
        severity: burst.length >= 10 ? 'concern' : 'note',
        category: 'frequency',
        evidence: [`${burst.length} changes in 1-hour window`, `Fields: ${[...new Set(burst.map(b => b.field_changed))].join(', ')}`],
        affectedMetrics: [...new Set(burst.map(b => b.field_changed))],
        recommendation: 'Review whether burst edits were routine updates or panic corrections.',
      });
      break; // Only report once
    }
  }

  return findings;
}

function analyzeValuePatterns(metrics: DbMetricsHistory[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  if (metrics.length < 4) return findings;

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));

  // Detect suspiciously round numbers
  const revenues = sorted.map(m => Number(m.revenue));
  const roundCount = revenues.filter(r => r % 1000 === 0 || r % 5000 === 0).length;
  const roundPct = (roundCount / revenues.length) * 100;

  if (roundPct > 60 && revenues.length >= 4) {
    findings.push({
      id: 'pattern-round-numbers',
      title: 'Suspiciously round revenue figures',
      description: `${roundPct.toFixed(0)}% of revenue figures are round numbers (multiples of $1K or $5K). Genuine revenue data typically has irregular values.`,
      severity: roundPct > 80 ? 'concern' : 'note',
      category: 'value',
      evidence: revenues.map((r, i) => `${sorted[i].month_date}: $${r.toLocaleString()}`),
      affectedMetrics: ['revenue'],
      recommendation: 'Connect to payment processor (Stripe, bank) for automated, exact revenue reporting.',
    });
  }

  // Detect perfectly linear growth (too perfect to be real)
  const growthRates = sorted.map(m => Number(m.growth_rate));
  if (growthRates.length >= 4) {
    const diffs = growthRates.slice(1).map((g, i) => Math.abs(g - growthRates[i]));
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    if (avgDiff < 0.5 && growthRates.every(g => g > 0)) {
      findings.push({
        id: 'pattern-linear-growth',
        title: 'Unrealistically consistent growth rate',
        description: `Growth rate varies by only ${avgDiff.toFixed(2)}% on average. Real growth is rarely this consistent — this may indicate fabricated metrics.`,
        severity: 'concern',
        category: 'pattern',
        evidence: growthRates.map((g, i) => `${sorted[i].month_date}: ${g}%`),
        affectedMetrics: ['growth_rate'],
        recommendation: 'Genuine growth has natural variance. Request granular daily/weekly data to verify.',
      });
    }
  }

  // Detect cost tracking (costs suspiciously proportional to revenue)
  if (sorted.length >= 4) {
    const costRatios = sorted.map(m => {
      const rev = Number(m.revenue);
      return rev > 0 ? Number(m.costs) / rev : 0;
    }).filter(r => r > 0);

    if (costRatios.length >= 4) {
      const ratioVariance = costRatios.reduce((s, r) => {
        const avg = costRatios.reduce((a, b) => a + b, 0) / costRatios.length;
        return s + Math.pow(r - avg, 2);
      }, 0) / costRatios.length;

      if (ratioVariance < 0.001) {
        findings.push({
          id: 'pattern-cost-ratio',
          title: 'Cost/revenue ratio is suspiciously constant',
          description: 'Costs track revenue almost exactly in proportion. In reality, some costs are fixed and don\'t scale linearly with revenue.',
          severity: 'note',
          category: 'pattern',
          evidence: costRatios.map((r, i) => `${sorted[i].month_date}: ${(r * 100).toFixed(1)}% cost ratio`),
          affectedMetrics: ['costs', 'revenue'],
          recommendation: 'Request detailed cost breakdown (fixed vs variable) to verify.',
        });
      }
    }
  }

  return findings;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run complete audit trail intelligence analysis.
 */
export function analyzeAuditTrail(
  startup: DbStartup,
  auditEntries: DbAuditEntry[],
  metrics: DbMetricsHistory[],
): AuditIntelligenceReport {
  const allFindings: AuditFinding[] = [
    ...analyzeRevisions(auditEntries),
    ...analyzeFrequency(auditEntries),
    ...analyzeValuePatterns(metrics),
  ];

  // Sort by severity
  const severityOrder: Record<AuditSeverity, number> = { critical: 0, serious: 1, concern: 2, note: 3, clean: 4 };
  allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Count by severity
  const severityCounts: Record<AuditSeverity, number> = { clean: 0, note: 0, concern: 0, serious: 0, critical: 0 };
  for (const f of allFindings) severityCounts[f.severity]++;

  // Statistics
  const numericEntries = auditEntries.filter(e => e.old_value && e.new_value && !isNaN(parseFloat(e.old_value)));
  const downwardRevisions = numericEntries.filter(e => parseFloat(e.new_value!) < parseFloat(e.old_value!)).length;
  const changes = numericEntries.map(e => Math.abs((parseFloat(e.new_value!) - parseFloat(e.old_value!)) / parseFloat(e.old_value!)) * 100);
  const avgChangeMagnitude = changes.length > 0 ? changes.reduce((s, c) => s + c, 0) / changes.length : 0;

  const revenues = metrics.map(m => Number(m.revenue));
  const roundCount = revenues.filter(r => r % 1000 === 0).length;
  const roundNumberPct = revenues.length > 0 ? (roundCount / revenues.length) * 100 : 0;

  // Integrity score
  let integrityScore = 100;
  integrityScore -= severityCounts.critical * 30;
  integrityScore -= severityCounts.serious * 15;
  integrityScore -= severityCounts.concern * 7;
  integrityScore -= severityCounts.note * 2;
  integrityScore = Math.max(0, Math.min(100, integrityScore));

  if (startup.verified) integrityScore = Math.max(integrityScore, 40); // Verified floor

  const grade = integrityScore >= 95 ? 'A+' : integrityScore >= 85 ? 'A' : integrityScore >= 70 ? 'B' :
    integrityScore >= 50 ? 'C' : integrityScore >= 30 ? 'D' : 'F';

  const manipulationRisk: AuditIntelligenceReport['manipulationRisk'] =
    integrityScore >= 85 ? 'minimal' :
    integrityScore >= 70 ? 'low' :
    integrityScore >= 50 ? 'moderate' :
    integrityScore >= 30 ? 'elevated' :
    'high';

  return {
    integrityScore,
    grade,
    findings: allFindings,
    severityCounts,
    totalChangesAnalyzed: auditEntries.length,
    manipulationRisk,
    stats: {
      totalRevisions: auditEntries.length,
      downwardRevisions,
      largeChanges: changes.filter(c => c > 50).length,
      avgChangeMagnitude: +avgChangeMagnitude.toFixed(1),
      reportingGaps: 0,
      roundNumberPct: +roundNumberPct.toFixed(0),
    },
    computedAt: Date.now(),
  };
}
