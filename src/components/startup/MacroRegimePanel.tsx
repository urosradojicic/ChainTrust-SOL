/**
 * Macro Regime Detection Panel
 * ────────────────────────────
 * Displays current market regime and allocation recommendations.
 * Uses Pyth oracle data + platform metrics for regime classification.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, Minus, Shield, BarChart3,
  Sun, CloudRain, Cloud, Zap, Snowflake,
} from 'lucide-react';
import { detectMacroRegime, type MacroRegime, type Regime } from '@/lib/quant-models';
import { useSolPrice } from '@/hooks/use-pyth-price';
import { useStartups } from '@/hooks/use-startups';

const REGIME_CONFIG: Record<Regime, { label: string; color: string; icon: any; bg: string }> = {
  bull: { label: 'Bull Market', color: 'text-emerald-400', icon: Sun, bg: 'bg-emerald-500/10 border-emerald-500/20' },
  growth: { label: 'Growth Phase', color: 'text-blue-400', icon: TrendingUp, bg: 'bg-blue-500/10 border-blue-500/20' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', icon: Cloud, bg: 'bg-muted/50 border-border' },
  cautious: { label: 'Cautious', color: 'text-amber-400', icon: CloudRain, bg: 'bg-amber-500/10 border-amber-500/20' },
  bear: { label: 'Bear Market', color: 'text-red-400', icon: Snowflake, bg: 'bg-red-500/10 border-red-500/20' },
};

const SIGNAL_ICONS: Record<string, any> = {
  bullish: TrendingUp,
  neutral: Minus,
  bearish: TrendingDown,
};

interface MacroProps {
  metricsMap?: Map<string, any[]>;
}

export default function MacroRegimePanel({ metricsMap }: MacroProps = {}) {
  const { price: solPrice } = useSolPrice();
  const { data: startups = [] } = useStartups();

  const regime = useMemo(
    () => detectMacroRegime(solPrice?.price ?? null, startups, metricsMap ?? new Map()),
    [solPrice, startups, metricsMap],
  );

  const cfg = REGIME_CONFIG[regime.regime];
  const Icon = cfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5">
      <h4 className="font-bold mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" /> Macro Regime Detection
      </h4>

      {/* Regime badge */}
      <div className={`rounded-xl border p-4 mb-4 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80">
            <Icon className={`h-6 w-6 ${cfg.color}`} />
          </div>
          <div>
            <div className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</div>
            <div className="text-xs text-muted-foreground">
              Score: {regime.score}/100 — Confidence: {regime.confidence}%
            </div>
          </div>
        </div>
      </div>

      {/* Allocation recommendation */}
      <div className="mb-4">
        <h5 className="text-xs font-medium text-muted-foreground mb-2">Recommended Allocation</h5>
        <div className="space-y-1.5">
          {[
            { label: 'High-Growth Startups', pct: regime.allocation.highGrowth, color: 'bg-primary' },
            { label: 'Verified / Low-Risk', pct: regime.allocation.verified, color: 'bg-emerald-500' },
            { label: 'Stablecoin Yield', pct: regime.allocation.stablecoin, color: 'bg-amber-500' },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-2">
              <span className="w-36 text-xs text-muted-foreground">{a.label}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${a.color}`} style={{ width: `${a.pct}%` }} />
              </div>
              <span className="w-10 text-right text-xs font-mono font-bold">{a.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Indicators grid */}
      <div className="grid grid-cols-2 gap-2">
        {regime.indicators.map(ind => {
          const SigIcon = SIGNAL_ICONS[ind.signal] ?? Minus;
          return (
            <div key={ind.name} className="rounded-lg bg-muted/30 p-2.5 flex items-center gap-2">
              <SigIcon className={`h-3.5 w-3.5 shrink-0 ${
                ind.signal === 'bullish' ? 'text-emerald-400' :
                ind.signal === 'bearish' ? 'text-red-400' :
                'text-muted-foreground'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground truncate">{ind.name}</div>
                <div className="text-xs font-mono font-bold">{ind.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
