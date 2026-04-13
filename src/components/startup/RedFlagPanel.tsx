/**
 * Red Flag Detection Panel
 * ────────────────────────
 * Displays automated anomaly detection results for a startup.
 * Shows statistical anomalies, cross-metric conflicts, trajectory warnings,
 * tokenomics risks, and operational concerns with severity-coded indicators.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertOctagon, Info, ShieldAlert, ChevronDown, ChevronUp,
  TrendingDown, GitBranch, Coins, Briefcase, ShieldCheck, Activity,
} from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { analyzeRedFlags, type RedFlag, type RedFlagReport, type FlagSeverity, type FlagCategory } from '@/lib/red-flag-detection';

// ── Severity & Category Config ───────────────────────────────────────

const SEVERITY_CONFIG: Record<FlagSeverity, { color: string; bg: string; border: string; icon: typeof AlertTriangle; label: string }> = {
  alert:    { color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    icon: AlertOctagon, label: 'ALERT' },
  critical: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: ShieldAlert,  label: 'Critical' },
  warning:  { color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  icon: AlertTriangle, label: 'Warning' },
  info:     { color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   icon: Info,         label: 'Info' },
};

const CATEGORY_CONFIG: Record<FlagCategory, { icon: typeof Activity; label: string }> = {
  anomaly:      { icon: Activity,     label: 'Statistical Anomaly' },
  correlation:  { icon: GitBranch,    label: 'Cross-Metric Conflict' },
  trajectory:   { icon: TrendingDown, label: 'Trajectory Warning' },
  tokenomics:   { icon: Coins,        label: 'Tokenomics Risk' },
  operational:  { icon: Briefcase,    label: 'Operational Concern' },
  verification: { icon: ShieldCheck,  label: 'Verification Issue' },
};

const RISK_LEVEL_CONFIG = {
  clean:    { color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Clean', description: 'No significant red flags detected' },
  watch:    { color: 'text-blue-500',    bg: 'bg-blue-500/10',    label: 'Watch',   description: 'Minor concerns worth monitoring' },
  cautious: { color: 'text-amber-500',   bg: 'bg-amber-500/10',   label: 'Caution', description: 'Multiple concerns require investigation' },
  danger:   { color: 'text-red-500',     bg: 'bg-red-500/10',     label: 'Danger',  description: 'Critical issues detected — investigate immediately' },
};

// ── Sub-Components ───────────────────────────────────────────────────

function FlagCard({ flag }: { flag: RedFlag }) {
  const [expanded, setExpanded] = useState(false);
  const severityCfg = SEVERITY_CONFIG[flag.severity];
  const categoryCfg = CATEGORY_CONFIG[flag.category];
  const SeverityIcon = severityCfg.icon;
  const CategoryIcon = categoryCfg.icon;

  return (
    <div className={`rounded-lg border ${severityCfg.border} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-start gap-3 p-3 hover:bg-muted/20 transition text-left`}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${severityCfg.bg} mt-0.5`}>
          <SeverityIcon className={`h-4 w-4 ${severityCfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${severityCfg.color}`}>
              {severityCfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <CategoryIcon className="h-3 w-3" />
              {categoryCfg.label}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{flag.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{flag.description}</p>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pl-14 space-y-2">
              {/* Recommendation */}
              <div className="rounded-lg bg-muted/30 p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Recommendation</p>
                <p className="text-xs text-foreground">{flag.recommendation}</p>
              </div>

              {/* Evidence data */}
              <div className="rounded-lg bg-muted/30 p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Evidence</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.entries(flag.evidence).map(([key, value]) => (
                    <span key={key} className="text-xs font-mono">
                      <span className="text-muted-foreground">{key}: </span>
                      <span className="text-foreground font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Confidence & Metrics */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Confidence: <span className="font-mono font-medium text-foreground">{(flag.confidence * 100).toFixed(0)}%</span></span>
                <span>Metrics: <span className="font-mono font-medium text-foreground">{flag.metrics.join(', ')}</span></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface RedFlagPanelProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
}

export default function RedFlagPanel({ startup, metrics, allStartups }: RedFlagPanelProps) {
  const [filter, setFilter] = useState<FlagSeverity | 'all'>('all');

  const report: RedFlagReport = useMemo(
    () => analyzeRedFlags(startup, metrics, allStartups),
    [startup, metrics, allStartups],
  );

  const riskCfg = RISK_LEVEL_CONFIG[report.riskLevel];
  const filteredFlags = filter === 'all' ? report.flags : report.flags.filter(f => f.severity === filter);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-red-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 ${report.riskLevel === 'clean' ? 'border-emerald-500/30' : report.riskLevel === 'danger' ? 'border-red-500/30' : 'border-amber-500/30'}`}>
              <ShieldAlert className={`h-7 w-7 ${riskCfg.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Red Flag Detection</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Automated anomaly detection &bull; {report.dataPointsAnalyzed} data points analyzed</p>
            </div>
          </div>
          <div className="text-right">
            <motion.div
              key={report.riskLevel}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${riskCfg.bg}`}
            >
              <span className={`text-sm font-bold ${riskCfg.color}`}>{riskCfg.label}</span>
            </motion.div>
            <p className="text-xs text-muted-foreground mt-1">{riskCfg.description}</p>
          </div>
        </div>

        {/* Summary counts */}
        <div className="flex items-center gap-3 mt-4">
          {(['alert', 'critical', 'warning', 'info'] as const).map(severity => {
            const cfg = SEVERITY_CONFIG[severity];
            const count = report.counts[severity];
            return (
              <button
                key={severity}
                onClick={() => setFilter(filter === severity ? 'all' : severity)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition
                  ${filter === severity ? cfg.bg + ' ' + cfg.color + ' ring-1 ring-inset ' + cfg.border : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}
                  ${count === 0 ? 'opacity-40' : ''}`}
              >
                <cfg.icon className="h-3 w-3" />
                <span className="font-mono">{count}</span>
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Show all
            </button>
          )}
        </div>
      </div>

      {/* Flag list */}
      <div className="p-4 space-y-2">
        {filteredFlags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="h-12 w-12 text-emerald-500/50 mb-3" />
            <p className="text-sm font-medium text-foreground">
              {filter === 'all' ? 'No red flags detected' : `No ${SEVERITY_CONFIG[filter as FlagSeverity].label.toLowerCase()} flags`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'all'
                ? 'All metrics are within expected ranges.'
                : 'Try showing all flags to see complete results.'}
            </p>
          </div>
        ) : (
          filteredFlags.map(flag => <FlagCard key={flag.id} flag={flag} />)
        )}
      </div>
    </div>
  );
}
