/**
 * Intelligence Summary
 * ────────────────────
 * Surfaces three deep-intelligence signals in one compact card:
 *   1. Sentiment analysis of the startup description + recent audit notes.
 *   2. PELT change-points on the revenue series with labelled markers.
 *   3. Ensemble agreement across three scoring heuristics (momentum,
 *      fundamentals, on-chain) with dispersion-aware confidence.
 *
 * The goal is to give an investor the "here's what the math is saying"
 * view without reading any individual panel.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brain,
  TrendingUp,
} from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { analyzeSentiment } from '@/lib/sentiment';
import { detectChangePoints } from '@/lib/change-points';
import { ensemble } from '@/lib/ensemble';

interface Props {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
}

const SENTIMENT_COLOR: Record<string, string> = {
  'very positive': 'text-emerald-600 dark:text-emerald-400',
  'positive': 'text-emerald-500',
  'neutral': 'text-muted-foreground',
  'negative': 'text-amber-500',
  'very negative': 'text-red-500',
};

export default function IntelligenceSummary({ startup, metrics }: Props) {
  const sentiment = useMemo(() => {
    const parts = [startup.description ?? '', startup.name].filter(Boolean);
    return analyzeSentiment(parts.join(' '));
  }, [startup]);

  const revenueSeries = useMemo(
    () => metrics.map((m) => Number(m.revenue ?? 0)).filter((v) => Number.isFinite(v)),
    [metrics],
  );

  const changePoints = useMemo(() => detectChangePoints(revenueSeries), [revenueSeries]);

  const vote = useMemo(() => {
    // Three heuristic scorers — 0-100 scale each.
    const growth = Math.max(0, Math.min(100, (Number(startup.growth_rate) + 10) * 3));
    const fundamentals = Math.max(0, Math.min(100, startup.trust_score));
    const onChain = Math.max(
      0,
      Math.min(100, startup.verified ? 85 : 45) + (startup.whale_concentration > 60 ? -10 : 0),
    );
    return ensemble([
      { name: 'Momentum', prediction: growth, weight: 1 },
      { name: 'Fundamentals', prediction: fundamentals, weight: 1.5 },
      { name: 'On-Chain', prediction: onChain, weight: 1.2 },
    ]);
  }, [startup]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-5 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Intelligence Summary
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          deterministic · no API
        </span>
      </div>

      {/* Sentiment */}
      <section>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="uppercase tracking-wider text-muted-foreground font-bold">Sentiment</span>
          <span className={`font-bold capitalize ${SENTIMENT_COLOR[sentiment.label]}`}>
            {sentiment.label} · {sentiment.score.toFixed(2)}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden" role="meter" aria-valuenow={sentiment.score} aria-valuemin={-1} aria-valuemax={1}>
          <div
            className={`h-full transition-all ${
              sentiment.score >= 0 ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{
              width: `${Math.min(100, Math.max(5, Math.abs(sentiment.score) * 100))}%`,
              marginLeft: sentiment.score < 0 ? `${100 - Math.abs(sentiment.score) * 100}%` : '0',
            }}
          />
        </div>
        {(sentiment.positive.length > 0 || sentiment.negative.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {sentiment.positive.slice(0, 5).map((k) => (
              <span key={`p-${k}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                + {k}
              </span>
            ))}
            {sentiment.negative.slice(0, 5).map((k) => (
              <span key={`n-${k}`} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
                − {k}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Change points */}
      <section>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Revenue Change-Points
          </span>
          <span className="text-muted-foreground">
            {changePoints.changePoints.length} inflection{changePoints.changePoints.length === 1 ? '' : 's'}
          </span>
        </div>
        {revenueSeries.length < 4 ? (
          <p className="text-xs text-muted-foreground">Need at least 4 data points to detect inflections.</p>
        ) : changePoints.changePoints.length === 0 ? (
          <p className="text-xs text-muted-foreground">No structural breaks — revenue trajectory is steady.</p>
        ) : (
          <ul className="space-y-1.5">
            {changePoints.changePoints.slice(0, 3).map((cp) => {
              const label = metrics[cp.index]?.month ?? `Point ${cp.index}`;
              const Icon = cp.direction === 'up' ? ArrowUp : ArrowDown;
              const color = cp.direction === 'up' ? 'text-emerald-500' : 'text-amber-500';
              return (
                <li key={cp.index} className="flex items-center justify-between text-xs rounded-md bg-muted/40 px-2.5 py-1.5">
                  <span className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    <span className="text-foreground font-medium">{label}</span>
                  </span>
                  <span className={`font-mono ${color}`}>
                    {cp.magnitude >= 0 ? '+' : ''}
                    {cp.magnitude.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Ensemble */}
      <section>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" /> Ensemble Score
          </span>
          <span className="text-foreground font-bold">
            {vote.prediction.toFixed(0)}/100
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {vote.contributions.map((c) => (
            <div
              key={c.name}
              className="rounded-lg border border-border/60 bg-muted/20 p-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.name}</p>
              <p className="mt-0.5 text-sm font-bold text-foreground">{c.prediction.toFixed(0)}</p>
              <p className={`text-[10px] ${c.delta >= 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {c.delta >= 0 ? '+' : ''}
                {c.delta.toFixed(1)} Δ
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Dispersion: {vote.dispersion.toFixed(1)}</span>
          <span className={`flex items-center gap-1 font-medium ${
            vote.confidence >= 0.7 ? 'text-emerald-500'
              : vote.confidence >= 0.4 ? 'text-amber-500'
              : 'text-red-500'
          }`}>
            {vote.confidence < 0.4 && <AlertTriangle className="h-3 w-3" />}
            Confidence {Math.round(vote.confidence * 100)}%
          </span>
        </div>
      </section>
    </motion.div>
  );
}
