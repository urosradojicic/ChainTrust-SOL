/**
 * ChainTrust Score (CTS) — Reputation Score Card
 * ────────────────────────────────────────────────
 * Displays the comprehensive multi-dimensional reputation score
 * with component breakdown, tier badge, improvement suggestions,
 * and animated score visualizations.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  ShieldCheck, DollarSign, FileText, Coins, Vote, Leaf, Sparkles, ArrowUpRight,
} from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { computeReputationScore, type ReputationScore, type ScoreComponent, type Improvement } from '@/lib/reputation-score';

// ── Config ───────────────────────────────────────────────────────────

const TIER_CONFIG = {
  Platinum: { color: 'text-primary', bg: 'bg-gradient-to-r from-primary/20 to-blue-500/20', border: 'border-primary/30', ring: 'ring-primary/20' },
  Gold:     { color: 'text-amber-400',  bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20', border: 'border-amber-500/30', ring: 'ring-amber-500/20' },
  Silver:   { color: 'text-slate-400',  bg: 'bg-gradient-to-r from-slate-400/20 to-slate-300/20', border: 'border-slate-400/30', ring: 'ring-slate-400/20' },
  Bronze:   { color: 'text-orange-500', bg: 'bg-gradient-to-r from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', ring: 'ring-orange-500/20' },
  Unrated:  { color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-muted', ring: 'ring-muted/20' },
};

const COMPONENT_ICONS: Record<string, typeof Award> = {
  verification:  ShieldCheck,
  financial:     DollarSign,
  reporting:     FileText,
  token:         Coins,
  governance:    Vote,
  sustainability: Leaf,
};

const COMPONENT_COLORS: Record<string, string> = {
  verification:  '#10B981',
  financial:     '#3B82F6',
  reporting:     '#8B5CF6',
  token:         '#F59E0B',
  governance:    '#EC4899',
  sustainability: '#06B6D4',
};

const DIFFICULTY_BADGE = {
  easy:   { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Easy' },
  medium: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   label: 'Medium' },
  hard:   { bg: 'bg-red-500/10',     text: 'text-red-500',     label: 'Hard' },
};

// ── Sub-Components ───────────────────────────────────────────────────

function ComponentRow({ component }: { component: ScoreComponent }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = COMPONENT_ICONS[component.key] ?? Award;
  const color = COMPONENT_COLORS[component.key] ?? '#6B7280';

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: color + '15' }}>
          <Icon className="h-4.5 w-4.5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{component.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '15', color }}>
                {component.grade}
              </span>
              <span className="font-mono text-sm font-bold" style={{ color }}>
                {component.score}/{component.maxScore}
              </span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${component.percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
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
            <div className="px-3 pb-3 pl-[52px] space-y-1.5">
              {component.factors.map(factor => (
                <div key={factor.name} className="flex items-center justify-between rounded-lg bg-muted/20 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{factor.name}</p>
                    <p className="text-[11px] text-muted-foreground">{factor.detail}</p>
                  </div>
                  <span className="font-mono text-xs font-bold shrink-0 ml-2" style={{ color }}>
                    {factor.points}/{factor.maxPoints}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImprovementRow({ improvement }: { improvement: Improvement }) {
  const diff = DIFFICULTY_BADGE[improvement.difficulty];
  const color = COMPONENT_COLORS[improvement.component] ?? '#6B7280';

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 mt-0.5">
        <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{improvement.action}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono font-bold" style={{ color }}>
            +{improvement.potentialPoints} pts
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${diff.bg} ${diff.text}`}>
            {diff.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface ReputationScoreCardProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
}

export default function ReputationScoreCard({ startup, metrics, allStartups }: ReputationScoreCardProps) {
  const [showImprovements, setShowImprovements] = useState(false);

  const score: ReputationScore = useMemo(
    () => computeReputationScore(startup, metrics, allStartups),
    [startup, metrics, allStartups],
  );

  const tierCfg = TIER_CONFIG[score.tier];
  const TrendIcon = score.trend === 'improving' ? TrendingUp : score.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = score.trend === 'improving' ? 'text-emerald-500' : score.trend === 'declining' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header with total score */}
      <div className={`${tierCfg.bg} p-5 border-b border-border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 ${tierCfg.border}`}>
              <Award className={`h-7 w-7 ${tierCfg.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">ChainTrust Score</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Multi-dimensional reputation rating</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1.5">
              <motion.span
                key={score.totalScore}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-4xl font-bold font-mono ${tierCfg.color}`}
              >
                {score.totalScore}
              </motion.span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={`text-xs font-bold ${tierCfg.color}`}>{score.tier}</span>
              <span className="text-xs text-muted-foreground">&bull;</span>
              <span className="text-xs font-mono font-medium text-foreground">{score.grade}</span>
              <span className="text-xs text-muted-foreground">&bull;</span>
              <span className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {score.trend}
              </span>
            </div>
          </div>
        </div>

        {/* Percentile & Stats */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Percentile:</span>
            <span className="font-mono font-bold text-foreground">Top {100 - score.percentile}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80">
            <span className="text-muted-foreground">Components:</span>
            <span className="font-mono font-bold text-foreground">{score.components.length}</span>
          </div>
          {score.improvements.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/80">
              <span className="text-muted-foreground">Potential:</span>
              <span className="font-mono font-bold text-emerald-500">
                +{score.improvements.reduce((s, i) => s + i.potentialPoints, 0)} pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Component breakdown */}
      <div className="divide-y divide-border">
        {score.components.map(component => (
          <ComponentRow key={component.key} component={component} />
        ))}
      </div>

      {/* Improvement suggestions */}
      {score.improvements.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowImprovements(!showImprovements)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition text-left"
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Score Improvement Suggestions
              </span>
              <span className="text-xs text-muted-foreground">({score.improvements.length})</span>
            </div>
            {showImprovements
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showImprovements && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-1.5">
                  {score.improvements.map((imp, i) => (
                    <ImprovementRow key={i} improvement={imp} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
