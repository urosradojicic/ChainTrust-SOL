/**
 * Entity Dossier — Arkham-style multi-wallet, multi-timeline profile
 * for a ChainTrust-verified startup. Renders everything a professional
 * investor wants at a glance: holdings, wallets, timeline, tags, tier.
 */
import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Layers,
  Link as LinkIcon,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useStartup, useMetricsHistory, useAuditLog, useFundingRounds } from '@/hooks/use-startups';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { buildEntityDossier, type EntityTag, type TimelineEvent } from '@/lib/entity-aggregator';
import { formatCurrency, formatNumber } from '@/lib/format';
import { chartTooltipStyle } from '@/lib/constants';
import SmartMoneyPanel from '@/components/startup/SmartMoneyPanel';
import SquadsMultisigBadge from '@/components/startup/SquadsMultisigBadge';
import ErrorBoundary from '@/components/ErrorBoundary';

const TIER_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  Platinum: { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-900 dark:text-slate-100',  ring: 'ring-slate-400/40' },
  Gold:     { bg: 'bg-amber-100 dark:bg-amber-950/50',  text: 'text-amber-900 dark:text-amber-200',  ring: 'ring-amber-500/40' },
  Silver:   { bg: 'bg-zinc-100 dark:bg-zinc-800',       text: 'text-zinc-800 dark:text-zinc-100',    ring: 'ring-zinc-400/40' },
  Bronze:   { bg: 'bg-orange-100 dark:bg-orange-950/50',text: 'text-orange-900 dark:text-orange-200',ring: 'ring-orange-500/40' },
  Unranked: { bg: 'bg-muted',                           text: 'text-muted-foreground',               ring: 'ring-border' },
};

const TAG_TONE: Record<EntityTag['tone'], string> = {
  positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  neutral: 'bg-muted text-foreground border border-border',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  info: 'bg-primary/10 text-primary border border-primary/20',
};

const EVENT_ICON: Record<TimelineEvent['type'], typeof Clock> = {
  registered: CheckCircle2,
  metric: TrendingUp,
  verification: ShieldCheck,
  funding: Layers,
  audit: Eye,
  badge: Award,
};

export default function EntityDossier() {
  const { id } = useParams<{ id: string }>();
  const { data: startup, isLoading } = useStartup(id);
  useDocumentTitle(startup ? `${startup.name} — Entity Dossier` : 'Entity Dossier');
  const { data: metrics = [] } = useMetricsHistory(id);
  const { data: audit = [] } = useAuditLog(id);
  const { data: rounds = [] } = useFundingRounds(id);

  const dossier = useMemo(() => {
    if (!startup) return null;
    return buildEntityDossier(startup, metrics, audit, rounds);
  }, [startup, metrics, audit, rounds]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-60 rounded bg-muted animate-pulse mb-6" />
        <div className="h-40 rounded-xl bg-muted/60 animate-pulse" />
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Entity not found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't resolve this startup.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const tierStyle = TIER_COLOR[dossier.tier];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground transition">Dashboard</Link>
        <span>/</span>
        <Link to={`/startup/${dossier.id}`} className="hover:text-foreground transition">Startup</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{dossier.name}</span>
      </nav>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-card p-6 md:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">{dossier.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ${tierStyle.bg} ${tierStyle.text} ${tierStyle.ring}`}
              >
                <Award className="h-3.5 w-3.5" /> {dossier.tier}
              </span>
              {dossier.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
            </div>
            {dossier.description && (
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{dossier.description}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-1.5">
              {dossier.tags.map((tag, i) => (
                <span
                  key={`${tag.label}-${i}`}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${TAG_TONE[tag.tone]}`}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/startup/${dossier.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/40 transition"
            >
              Full profile <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="MRR" value={formatCurrency(dossier.latest.revenue)} icon={TrendingUp} />
        <KpiCard label="Treasury" value={formatCurrency(dossier.latest.treasury)} icon={Wallet} />
        <KpiCard label="Users" value={formatNumber(dossier.latest.users)} icon={Users} />
        <KpiCard
          label="Trust Score"
          value={`${dossier.trustScore}/100`}
          icon={ShieldCheck}
          emphasis={dossier.trustScore >= 75 ? 'positive' : dossier.trustScore < 40 ? 'warning' : undefined}
        />
      </div>

      {/* Main grid: holdings chart + wallets */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Holdings chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Holdings over time</h2>
            <span className="text-xs text-muted-foreground">{dossier.holdings.length} reports</span>
          </div>
          {dossier.holdings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No historical data yet — startup hasn't published monthly metrics.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dossier.holdings}>
                  <defs>
                    <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => formatCurrency(Number(v))}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Wallets */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-bold text-foreground mb-3">Wallets</h2>
          {dossier.wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No on-chain wallet linked yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {dossier.wallets.map((w) => (
                <WalletRow key={w.address} wallet={w} />
              ))}
            </ul>
          )}

          <div className="mt-5 pt-4 border-t border-border/60 text-xs text-muted-foreground space-y-1.5">
            <div className="flex justify-between">
              <span>Total raised</span>
              <span className="font-medium text-foreground">
                {formatCurrency(dossier.summary.totalRaised)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rounds</span>
              <span className="font-medium text-foreground">{dossier.summary.rounds}</span>
            </div>
            <div className="flex justify-between">
              <span>Verified reports</span>
              <span className="font-medium text-foreground">{dossier.summary.verifiedMetricReports}</span>
            </div>
            <div className="flex justify-between">
              <span>Audit entries</span>
              <span className="font-medium text-foreground">{dossier.summary.auditEntries}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Squads multisig */}
      <ErrorBoundary fallback={null}>
        <SquadsMultisigBadge walletAddress={dossier.wallets[0]?.address ?? null} />
      </ErrorBoundary>

      {/* Smart Money */}
      <ErrorBoundary fallback={null}>
        <SmartMoneyPanel
          walletAddress={dossier.wallets[0]?.address ?? null}
          startupName={dossier.name}
        />
      </ErrorBoundary>

      {/* Timeline */}
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="font-bold text-foreground mb-3">Activity timeline</h2>
        {dossier.timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ol className="relative border-l-2 border-border pl-5 space-y-4 py-1">
            {dossier.timeline.slice(0, 20).map((ev) => {
              const Icon = EVENT_ICON[ev.type];
              return (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-4 w-4 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center">
                    <Icon className="h-2 w-2 text-primary" />
                  </span>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{ev.detail}</p>
                    </div>
                    <time className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleDateString() : '—'}
                    </time>
                  </div>
                  {ev.txHash && (
                    <a
                      href={`https://explorer.solana.com/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-mono"
                    >
                      {ev.txHash.slice(0, 10)}… <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

// ── Local KPI card ─────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  emphasis?: 'positive' | 'warning';
}
function KpiCard({ label, value, icon: Icon, emphasis }: KpiCardProps) {
  const accent =
    emphasis === 'positive'
      ? 'text-emerald-500'
      : emphasis === 'warning'
      ? 'text-amber-500'
      : 'text-primary';
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent}`} /> {label}
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

// ── Wallet row with truncation + copy ─────────────────────────────────
interface WalletRowProps {
  wallet: { address: string; label: string; explorerUrl: string };
}
function WalletRow({ wallet }: WalletRowProps) {
  const [copied, setCopied] = useState(false);
  const truncated = `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — silent */ }
  };

  return (
    <li className="rounded-lg border border-border/60 bg-muted/30 p-3 transition hover:border-primary/30">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {wallet.label}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copy}
            aria-label={copied ? 'Address copied' : 'Copy wallet address'}
            className="text-muted-foreground hover:text-foreground transition"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
          <a
            href={wallet.explorerUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${wallet.label} on Solana Explorer`}
            className="text-muted-foreground hover:text-primary transition"
          >
            <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
      <code className="block text-[12px] text-foreground font-mono tabular-nums tracking-tight">
        {truncated}
      </code>
    </li>
  );
}
