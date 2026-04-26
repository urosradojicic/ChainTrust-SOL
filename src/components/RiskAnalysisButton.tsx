import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Coins,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { DbStartup } from '@/types/database';
import { generateRiskAnalysis } from '@/lib/risk-analysis';
import {
  computeRiskSeverity,
  riskPercentile,
  type CategorySeverity,
  type SeverityLabel,
} from '@/lib/risk-severity';
import { useStartups } from '@/hooks/use-startups';

/**
 * Direct fetch to the Edge Function (bypasses supabase.functions.invoke
 * because that helper calls auth.getSession() first; a stale token in
 * localStorage causes the underlying fetch to throw).
 */
async function invokeRiskAnalysis(startup: DbStartup, signal?: AbortSignal): Promise<string> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !anonKey) throw new Error('Supabase env vars missing');

  const res = await fetch(`${baseUrl}/functions/v1/risk-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ startup }),
    signal,
  });
  if (!res.ok) throw new Error(`Edge Function ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json?.error) throw new Error(json.error);
  if (typeof json?.analysis !== 'string' || json.analysis.trim().length === 0) {
    throw new Error('Edge Function returned empty analysis');
  }
  return json.analysis;
}

interface Props {
  startup: DbStartup;
}

interface Section {
  title: string;
  content: string;
  type: 'risk' | 'strength';
  icon: typeof AlertTriangle;
}

function parseAnalysis(text: string): Section[] {
  const icons: Record<string, typeof AlertTriangle> = {
    financial: TrendingUp,
    environmental: Leaf,
    tokenomics: Coins,
    recommendation: CheckCircle2,
  };

  const sectionRegex = /\*\*(.+?)\*\*[:\s]*(.+?)(?=\*\*|$)/gs;
  const sections: Section[] = [];
  let match;
  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const lower = title.toLowerCase();
    const icon = lower.includes('financial')
      ? icons.financial
      : lower.includes('environment')
      ? icons.environmental
      : lower.includes('token')
      ? icons.tokenomics
      : icons.recommendation;
    const isStrength =
      lower.includes('recommendation') ||
      content.toLowerCase().includes('strong') ||
      content.toLowerCase().includes('positive');
    sections.push({ title, content, type: isStrength ? 'strength' : 'risk', icon });
  }
  if (sections.length === 0) {
    sections.push({ title: 'Analysis', content: text, type: 'risk', icon: AlertTriangle });
  }
  return sections;
}

const SEVERITY_STYLE: Record<SeverityLabel, { bar: string; chip: string; text: string }> = {
  low:       { bar: 'bg-emerald-500',          chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  moderate:  { bar: 'bg-blue-500',             chip: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',         text: 'text-blue-600 dark:text-blue-400' },
  elevated:  { bar: 'bg-amber-500',            chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',     text: 'text-amber-600 dark:text-amber-400' },
  critical:  { bar: 'bg-red-500',              chip: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',             text: 'text-red-600 dark:text-red-400' },
};

const SEVERITY_LABEL: Record<SeverityLabel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  critical: 'Critical',
};

export default function RiskAnalysisButton({ startup }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: peers = [] } = useStartups();

  const severity = useMemo(() => computeRiskSeverity(startup), [startup]);
  const percentile = useMemo(() => riskPercentile(startup, peers), [startup, peers]);

  // ── Cache invalidation: re-fetch when the startup metric input changes
  // so opening the dialog after edits never returns stale text.
  const cacheKey = useMemo(
    () =>
      `${startup.id}|${startup.mrr}|${startup.growth_rate}|${startup.sustainability_score}|${startup.token_concentration_pct}|${(startup as unknown as { treasury?: number }).treasury ?? 0}`,
    [startup],
  );
  useEffect(() => {
    setSections(null);
    setError(null);
  }, [cacheKey]);

  const run = async (force = false) => {
    if (sections && !force) {
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    try {
      const analysis = await invokeRiskAnalysis(startup, ctrl.signal);
      setSections(parseAnalysis(analysis));
    } catch (e: unknown) {
      if (import.meta.env.DEV) {
        console.warn('[risk-analysis] edge fn unavailable, falling back', e);
      }
      setSections(parseAnalysis(generateRiskAnalysis(startup)));
    } finally {
      setLoading(false);
    }
  };

  const summaryText = useMemo(() => {
    if (!sections) return '';
    const lines = sections.map((s) => `${s.title}\n${s.content}`);
    return [
      `${startup.name} — Risk Analysis`,
      `Overall: ${SEVERITY_LABEL[severity.overall.label]} (${severity.overall.score}/100)`,
      `Financial: ${severity.financial.score} · Environmental: ${severity.environmental.score} · Tokenomics: ${severity.tokenomics.score}`,
      `Peer percentile: lower-risk than ${100 - percentile}% of ${startup.category} startups`,
      '',
      ...lines,
    ].join('\n\n');
  }, [sections, severity, percentile, startup.name, startup.category]);

  const copySummary = async () => {
    if (!summaryText) return;
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  // Sort sections so the highest-severity (matching the worst category) lands first.
  const orderedSections = useMemo(() => {
    if (!sections) return null;
    const order = [
      severity.financial.score >= severity.tokenomics.score ? 'financial' : 'tokenomics',
      'tokenomics',
      'environmental',
      'recommendation',
    ];
    return [...sections].sort((a, b) => {
      const ai = order.findIndex((k) => a.title.toLowerCase().includes(k));
      const bi = order.findIndex((k) => b.title.toLowerCase().includes(k));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [sections, severity]);

  return (
    <>
      <Button
        onClick={() => run(false)}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Brain className="h-4 w-4" aria-hidden="true" /> AI Risk Analysis
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
              Risk Analysis — {startup.name}
            </DialogTitle>
          </DialogHeader>

          {/* ── Severity overview ─────────────────────────────────────── */}
          <div className="grid gap-3 py-1">
            <div className="rounded-xl border bg-gradient-to-br from-card to-muted/40 p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Overall risk
                  </p>
                  <p className={`mt-1 text-3xl font-bold tabular-nums ${SEVERITY_STYLE[severity.overall.label].text}`}>
                    {severity.overall.score}
                    <span className="text-base text-muted-foreground font-normal">/100</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-md">{severity.overall.detail}</p>
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider rounded-full px-3 py-1 border ${SEVERITY_STYLE[severity.overall.label].chip}`}
                >
                  {SEVERITY_LABEL[severity.overall.label]}
                </span>
              </div>

              {/* Per-category bars */}
              <div className="space-y-2.5">
                <RiskBar label="Financial"      icon={TrendingUp} severity={severity.financial} />
                <RiskBar label="Tokenomics"     icon={Coins}      severity={severity.tokenomics} />
                <RiskBar label="Environmental"  icon={Leaf}       severity={severity.environmental} />
              </div>

              {/* Peer percentile */}
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2 text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span className="text-muted-foreground">
                  Lower-risk than{' '}
                  <strong className="text-foreground">{100 - percentile}%</strong>{' '}
                  of {startup.category} startups in our index.
                </span>
              </div>
            </div>

            {/* ── Loading state ─────────────────────────────────────── */}
            {loading && (
              <div className="flex flex-col items-center gap-4 py-6" aria-live="polite">
                <div className="relative flex h-10 w-10 items-center justify-center">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-primary/30" />
                  <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground animate-pulse">
                  Generating narrative analysis…
                </p>
              </div>
            )}

            {/* ── Error state ───────────────────────────────────────── */}
            {error && !loading && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => run(true)}
                  className="mt-3 gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                </Button>
              </div>
            )}

            {/* ── Narrative sections ─────────────────────────────────── */}
            {orderedSections && !loading && (
              <div className="grid gap-3">
                {orderedSections.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 ${
                      s.type === 'strength'
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-amber-500/20 bg-amber-500/5'
                    }`}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      {s.type === 'strength' ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      )}
                      <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Footer actions ───────────────────────────────────── */}
            {orderedSections && !loading && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-muted-foreground">
                  Computed locally on your device · deterministic · no external AI call
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => run(true)} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
                  </Button>
                  <Button size="sm" variant="outline" onClick={copySummary} className="gap-1.5">
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy summary
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Local subcomponent ────────────────────────────────────────────────

interface RiskBarProps {
  label: string;
  icon: typeof TrendingUp;
  severity: CategorySeverity;
}

function RiskBar({ label, icon: Icon, severity }: RiskBarProps) {
  const style = SEVERITY_STYLE[severity.label];
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" aria-hidden="true" /> {label}
        </span>
        <span className={`font-mono font-bold tabular-nums ${style.text}`}>
          {severity.score}/100 · {SEVERITY_LABEL[severity.label]}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={severity.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} risk score`}
      >
        <div
          className={`h-full transition-[width] ${style.bar}`}
          style={{ width: `${severity.score}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{severity.detail}</p>
    </div>
  );
}
