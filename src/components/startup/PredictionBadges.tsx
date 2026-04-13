/**
 * Prediction Badges
 * ─────────────────
 * Compact probability badges showing survival and success predictions.
 * Designed to be placed in startup cards, headers, and detail pages.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Target, Zap, Info } from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { predictSurvival, type SurvivalPrediction, type PredictionBadge } from '@/lib/survival-predictor';

// ── Badge Colors ─────────────────────────────────────────────────────

const BADGE_COLORS = {
  green:  { bg: 'bg-emerald-500/10', text: 'text-emerald-500', ring: 'ring-emerald-500/20' },
  blue:   { bg: 'bg-blue-500/10',    text: 'text-blue-500',    ring: 'ring-blue-500/20' },
  amber:  { bg: 'bg-amber-500/10',   text: 'text-amber-500',   ring: 'ring-amber-500/20' },
  red:    { bg: 'bg-red-500/10',     text: 'text-red-500',     ring: 'ring-red-500/20' },
  purple: { bg: 'bg-purple-500/10',  text: 'text-purple-500',  ring: 'ring-purple-500/20' },
};

// ── Single Badge ─────────────────────────────────────────────────────

function Badge({ badge, icon: Icon }: { badge: PredictionBadge; icon: typeof TrendingUp }) {
  const colors = BADGE_COLORS[badge.color];
  return (
    <div className={`rounded-lg border ${colors.bg} p-3 ring-1 ring-inset ${colors.ring}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
          <span className="text-[11px] font-medium text-muted-foreground">{badge.label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          ±{((1 - badge.confidence) * 100).toFixed(0)}%
        </span>
      </div>
      <motion.p
        key={badge.probability}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className={`text-2xl font-bold font-mono ${colors.text}`}
      >
        {(badge.probability * 100).toFixed(0)}%
      </motion.p>
      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{badge.reason}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface PredictionBadgesProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  /** Compact mode shows only 2 badges in a row */
  compact?: boolean;
}

export default function PredictionBadges({ startup, metrics, compact = false }: PredictionBadgesProps) {
  const prediction: SurvivalPrediction = useMemo(
    () => predictSurvival(startup, metrics),
    [startup, metrics],
  );

  const stageColors: Record<string, string> = {
    'Pre-Seed': 'text-purple-500', 'Seed': 'text-blue-500',
    'Series A': 'text-emerald-500', 'Series B+': 'text-amber-500', 'Growth': 'text-cyan-500',
  };

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Badge badge={prediction.nextRoundProbability} icon={TrendingUp} />
        <Badge badge={prediction.survival12m} icon={Shield} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-emerald-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-blue-500/30">
              <Target className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Survival Predictions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Heuristic-based probability estimates</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${stageColors[prediction.stage] ?? 'text-foreground'}`}>
                {prediction.stage}
              </span>
              <span className="text-xs text-muted-foreground">Stage</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">Investability:</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {prediction.investabilityScore}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction badges grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
        <Badge badge={prediction.nextRoundProbability} icon={TrendingUp} />
        <Badge badge={prediction.tenXProbability} icon={Zap} />
        <Badge badge={prediction.survival12m} icon={Shield} />
        <Badge badge={prediction.survival24m} icon={Shield} />
      </div>

      {/* Key factors */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Info className="h-3 w-3" /> Key Factors
        </p>
        <div className="flex flex-wrap gap-1.5">
          {prediction.keyFactors.map((f, i) => (
            <span
              key={i}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                f.impact === 'positive' ? 'bg-emerald-500/10 text-emerald-500' :
                f.impact === 'negative' ? 'bg-red-500/10 text-red-500' :
                'bg-muted text-muted-foreground'
              }`}
            >
              {f.impact === 'positive' ? '+' : f.impact === 'negative' ? '-' : '~'} {f.factor}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
