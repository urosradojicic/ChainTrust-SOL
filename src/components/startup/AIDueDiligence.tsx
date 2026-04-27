import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Shield, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, CheckCircle, XCircle, Info, Zap, type LucideIcon } from 'lucide-react';
import { generateDueDiligenceReport, type DueDiligenceReport, type RiskLevel, type SignalType } from '@/lib/ai-due-diligence';
import type { DbStartup, DbMetricsHistory } from '@/types/database';

const riskColors: Record<RiskLevel, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

const riskBg: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/10 border-emerald-500/20',
  medium: 'bg-amber-500/10 border-amber-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  critical: 'bg-red-500/10 border-red-500/20',
};

const signalIcons: Record<SignalType, LucideIcon> = {
  positive: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
};

const signalColors: Record<SignalType, string> = {
  positive: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  info: 'text-blue-400',
};

function GradeRing({ grade, risk }: { grade: string; risk: RiskLevel }) {
  const color = risk === 'low' ? '#10B981' : risk === 'medium' ? '#F59E0B' : risk === 'high' ? '#F97316' : '#EF4444';
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="4" />
        <circle cx="48" cy="48" r="42" fill="none" stroke={color} strokeWidth="4" strokeDasharray={`${(1 - (risk === 'low' ? 0.15 : risk === 'medium' ? 0.4 : risk === 'high' ? 0.7 : 0.9)) * 264} 264`} strokeLinecap="round" transform="rotate(-90 48 48)" />
      </svg>
      <span className="text-2xl font-bold" style={{ color }}>{grade}</span>
    </div>
  );
}

function HealthBar({ label, score, max, status }: { label: string; score: number; max: number; status: RiskLevel }) {
  const color = status === 'low' ? '#10B981' : status === 'medium' ? '#F59E0B' : status === 'high' ? '#F97316' : '#EF4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium" style={{ color }}>{score}/{max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${(score / max) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function PercentileBar({ metric, value, percentile, benchmark }: { metric: string; value: number; percentile: number; benchmark: number }) {
  const pColor = percentile >= 75 ? '#10B981' : percentile >= 50 ? '#3B82F6' : percentile >= 25 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-24 text-sm text-muted-foreground">{metric}</div>
      <div className="flex-1">
        <div className="relative h-6 rounded-full bg-muted/20 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: pColor + '30' }}
            initial={{ width: 0 }}
            animate={{ width: `${percentile}%` }}
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-y-0 flex items-center px-2">
            <span className="text-xs font-mono font-medium" style={{ color: pColor }}>P{percentile}</span>
          </div>
          <div className="absolute inset-y-0 right-2 flex items-center">
            <span className="text-[10px] text-muted-foreground">Avg: {typeof benchmark === 'number' && benchmark >= 1000 ? `$${(benchmark/1000).toFixed(0)}K` : benchmark}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AIDueDiligenceProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
}

export default function AIDueDiligence({ startup, metrics, allStartups }: AIDueDiligenceProps) {
  const [report, setReport] = useState<DueDiligenceReport | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate brief processing for visual feedback
    setTimeout(() => {
      const r = generateDueDiligenceReport(startup, metrics, allStartups);
      setReport(r);
      setGenerating(false);
      setExpanded(true);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {!report && (
        <motion.button
          onClick={handleGenerate}
          disabled={generating}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-primary transition hover:bg-primary/10 hover:border-primary/50 disabled:opacity-60"
        >
          {generating ? (
            <>
              <Zap className="h-5 w-5 animate-pulse" />
              <span className="font-medium">Analyzing {startup.name}...</span>
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              <span className="font-medium">Generate AI Due Diligence Report</span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Free</span>
            </>
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header Card */}
            <div className={`rounded-xl border-2 p-6 ${riskBg[report.overallRisk]}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">AI Due Diligence Report</h3>
                    <span className="rounded-full bg-muted/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Algorithmic</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${riskBg[report.overallRisk]} ${riskColors[report.overallRisk]}`}>
                      <Shield className="h-3 w-3" /> Risk: {report.overallRisk.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-foreground">
                      Score: {report.riskScore}/100
                    </span>
                  </div>
                </div>
                <GradeRing grade={report.investmentGrade} risk={report.overallRisk} />
              </div>
            </div>

            {/* Financial Health Bars */}
            <div className="rounded-xl border bg-card p-5">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Financial Health Assessment
              </h4>
              <div className="space-y-3">
                {report.financialHealth.map(h => (
                  <HealthBar key={h.label} {...h} />
                ))}
              </div>
            </div>

            {/* Comparative Position */}
            <div className="rounded-xl border bg-card p-5">
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Percentile Rankings vs Platform
              </h4>
              <div className="divide-y divide-border/50">
                {report.comparativePosition.map(cp => (
                  <PercentileBar key={cp.metric} {...cp} />
                ))}
              </div>
            </div>

            {/* Expandable Signals */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between rounded-xl border bg-card p-4 transition hover:bg-muted/30"
            >
              <span className="font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                {report.signals.length} Signals Detected
              </span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {report.signals.map((s, i) => {
                    const Icon = signalIcons[s.type];
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 rounded-lg border bg-card p-3"
                      >
                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${signalColors[s.type]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{s.signal}</span>
                            <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[9px] text-muted-foreground">{s.category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Strengths & Weaknesses */}
            <div className="grid gap-4 lg:grid-cols-2">
              {report.strengths.length > 0 && (
                <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-5">
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.weaknesses.length > 0 && (
                <div className="rounded-xl border bg-red-500/5 border-red-500/20 p-5">
                  <h4 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Weaknesses
                  </h4>
                  <ul className="space-y-2">
                    {report.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="rounded-xl border bg-blue-500/5 border-blue-500/20 p-5">
                <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Recommendations
                </h4>
                <ol className="space-y-2">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-400 flex-shrink-0">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Regenerate */}
            <button
              onClick={handleGenerate}
              className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              <Brain className="h-3 w-3" /> Regenerate report
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
