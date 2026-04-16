/**
 * Quantitative Models Panel
 * ─────────────────────────
 * Displays all 5 hedge fund models for a startup.
 * Used in StartupDetail page.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Shield, BarChart3, Activity, Target,
  Minus, ArrowUpRight, ArrowDownRight, Gauge, Layers,
} from 'lucide-react';
import {
  computeMomentumSignals,
  computeRelativeValue,
  decomposeRiskFactors,
  type MomentumSignal,
  type RelativeValueSignal,
  type RiskDecomposition,
} from '@/lib/quant-models';
import type { DbStartup, DbMetricsHistory } from '@/types/database';

interface Props {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
  metricsMap?: Map<string, DbMetricsHistory[]>;
}

const SIGNAL_COLORS: Record<string, string> = {
  strong_buy: 'text-emerald-400 bg-emerald-500/10',
  buy: 'text-emerald-400 bg-emerald-500/5',
  hold: 'text-muted-foreground bg-muted/50',
  sell: 'text-red-400 bg-red-500/5',
  strong_sell: 'text-red-400 bg-red-500/10',
};

const SIGNAL_LABELS: Record<string, string> = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strong_sell: 'Strong Sell',
};

export default function QuantModelsPanel({ startup, metrics, allStartups, metricsMap }: Props) {
  const momentum = useMemo(
    () => computeMomentumSignals(startup, metrics, allStartups, metricsMap),
    [startup, metrics, allStartups, metricsMap],
  );

  const relativeValue = useMemo(
    () => computeRelativeValue(startup, allStartups),
    [startup, allStartups],
  );

  const riskFactors = useMemo(
    () => decomposeRiskFactors(startup, allStartups, metricsMap),
    [startup, allStartups, metricsMap],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Gauge className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold">Quantitative Models</h3>
          <p className="text-xs text-muted-foreground">Hedge fund-grade analysis: momentum, volatility, relative value, risk factors</p>
        </div>
      </div>

      {/* 1. Momentum Signals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-5">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Time-Series Momentum
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Multi-horizon momentum (3m + 6m blend) — measures whether metrics are accelerating or decelerating.
        </p>
        <div className="space-y-2">
          {momentum.map(sig => (
            <div key={sig.metric} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div className="flex-1">
                <div className="text-sm font-medium capitalize">{sig.metric}</div>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  <span>3m: <strong className={sig.lookback3m >= 0 ? 'text-emerald-400' : 'text-red-400'}>{sig.lookback3m > 0 ? '+' : ''}{sig.lookback3m}%</strong></span>
                  <span>6m: <strong className={sig.lookback6m >= 0 ? 'text-emerald-400' : 'text-red-400'}>{sig.lookback6m > 0 ? '+' : ''}{sig.lookback6m}%</strong></span>
                  <span>Blend: <strong>{sig.composite > 0 ? '+' : ''}{sig.composite}%</strong></span>
                </div>
              </div>
              <div className={`rounded-lg px-3 py-1.5 text-xs font-bold ${SIGNAL_COLORS[sig.signal]}`}>
                {SIGNAL_LABELS[sig.signal]}
              </div>
              <div className="text-[10px] text-muted-foreground w-12 text-right">
                {Math.round(sig.confidence * 100)}% conf
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3. Relative Value */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-5">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Relative Value vs {relativeValue.peerGroup} Peers
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Z-score comparison against category peers. Negative = potentially undervalued, positive = rich.
        </p>
        <div className="space-y-2">
          {relativeValue.ratios.map(r => (
            <div key={r.name} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
              <div className="flex-1">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Value: <strong className="text-foreground">{r.value}</strong></span>
                  <span>Peer avg: <strong>{r.peerMean}</strong></span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold font-mono ${r.zScore < -1 ? 'text-emerald-400' : r.zScore > 1 ? 'text-red-400' : 'text-foreground'}`}>
                  {r.zScore > 0 ? '+' : ''}{r.zScore}σ
                </div>
                <div className={`text-[10px] ${r.signal === 'undervalued' ? 'text-emerald-400' : r.signal === 'overvalued' ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {r.signal}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-muted/30 p-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Composite relative value</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold font-mono ${relativeValue.compositeZScore < -1 ? 'text-emerald-400' : relativeValue.compositeZScore > 1 ? 'text-red-400' : 'text-foreground'}`}>
              {relativeValue.compositeZScore > 0 ? '+' : ''}{relativeValue.compositeZScore}σ
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{relativeValue.recommendation}</p>
      </motion.div>

      {/* 5. Risk Factor Decomposition */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5">
        <h4 className="font-bold mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" /> Risk Factor Decomposition
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          How much of this startup's profile is explained by market factors vs unique alpha.
        </p>

        {/* Factor bars */}
        <div className="space-y-2 mb-4">
          {riskFactors.factors.map(f => (
            <div key={f.factor} className="flex items-center gap-3">
              <span className="w-36 text-xs text-muted-foreground truncate">{f.factor}</span>
              <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden relative">
                {/* Centered zero-point bar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-px h-full bg-border" />
                </div>
                <div
                  className={`absolute top-0 h-full rounded-full transition-all ${f.loading >= 0 ? 'bg-primary' : 'bg-red-500'}`}
                  style={{
                    left: f.loading >= 0 ? '50%' : `${50 + f.loading * 20}%`,
                    width: `${Math.min(50, Math.abs(f.loading) * 20)}%`,
                  }}
                />
              </div>
              <span className={`w-12 text-right text-xs font-mono ${f.loading >= 0 ? 'text-primary' : 'text-red-400'}`}>
                {f.loading > 0 ? '+' : ''}{f.loading}
              </span>
              <span className="w-10 text-right text-[10px] text-muted-foreground">{f.contribution}%</span>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Factors Explain</div>
            <div className="text-lg font-bold font-mono">{riskFactors.totalExplained}%</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Alpha</div>
            <div className="text-lg font-bold font-mono text-primary">{riskFactors.alpha}%</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <div className="text-xs text-muted-foreground">Diversification</div>
            <div className="text-lg font-bold font-mono">{riskFactors.diversificationScore}</div>
          </div>
        </div>

        {/* Peer correlations */}
        {riskFactors.correlations.length > 0 && (
          <div className="mt-4">
            <h5 className="text-xs font-medium text-muted-foreground mb-2">Peer Correlations</h5>
            <div className="flex flex-wrap gap-2">
              {riskFactors.correlations.map(c => (
                <div key={c.peer} className="rounded bg-muted/30 px-2.5 py-1 text-xs">
                  <span className="text-muted-foreground">{c.peer}:</span>{' '}
                  <span className={`font-mono font-bold ${c.value > 0.7 ? 'text-red-400' : c.value > 0.3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
