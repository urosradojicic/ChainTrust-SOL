/**
 * Milestone Escrow Panel
 * ──────────────────────
 * Visualizes milestone-based escrow deals with progress tracking,
 * deadline countdowns, and fund release status.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, Target, DollarSign, AlertTriangle, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { DbStartup } from '@/types/database';
import {
  createDemoEscrowDeal,
  computeEscrowProgress,
  METRIC_LABELS,
  type EscrowDeal,
  type Milestone,
  type MilestoneStatus,
} from '@/lib/milestone-escrow';

const STATUS_CONFIG: Record<MilestoneStatus, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  pending:     { icon: Clock,          color: 'text-gray-400',    bg: 'bg-gray-400/10',    label: 'Pending' },
  in_progress: { icon: Timer,          color: 'text-blue-500',    bg: 'bg-blue-500/10',    label: 'In Progress' },
  met:         { icon: CheckCircle2,   color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' },
  failed:      { icon: XCircle,        color: 'text-red-500',     bg: 'bg-red-500/10',     label: 'Failed' },
  expired:     { icon: AlertTriangle,  color: 'text-amber-500',   bg: 'bg-amber-500/10',   label: 'Expired' },
};

function MilestoneRow({ milestone, index }: { milestone: Milestone; index: number }) {
  const config = STATUS_CONFIG[milestone.status];
  const Icon = config.icon;
  const metricInfo = METRIC_LABELS[milestone.metric];
  const daysLeft = Math.ceil((milestone.deadline - Date.now()) / (24 * 3600 * 1000));
  const isOverdue = daysLeft < 0 && milestone.status !== 'met';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-start gap-3 p-3 rounded-lg border ${milestone.status === 'met' ? 'border-emerald-500/20 bg-emerald-500/5' : isOverdue ? 'border-red-500/20 bg-red-500/5' : 'border-border'}`}
    >
      {/* Status icon */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg} mt-0.5`}>
        <Icon className={`h-4.5 w-4.5 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">{milestone.name}</h4>
          <span className={`text-[10px] font-bold uppercase ${config.color}`}>{config.label}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>

        {/* Condition */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
            {metricInfo.label} {milestone.operator} {metricInfo.format(milestone.targetValue)}
          </span>
          {milestone.actualValue !== null && (
            <span className={`text-[10px] font-mono ${milestone.status === 'met' ? 'text-emerald-500' : 'text-foreground'}`}>
              Current: {metricInfo.format(milestone.actualValue)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="font-mono font-medium text-foreground">{formatCurrency(milestone.trancheAmount)}</span>
            <span>({milestone.tranchePct}% of escrow)</span>
          </div>
          <span className={`text-[10px] ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {milestone.status === 'met'
              ? `Completed ${milestone.metAt ? new Date(milestone.metAt).toLocaleDateString() : ''}`
              : isOverdue
              ? `Overdue by ${Math.abs(daysLeft)} days`
              : `${daysLeft} days remaining`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface MilestoneEscrowPanelProps {
  startup: DbStartup;
}

export default function MilestoneEscrowPanel({ startup }: MilestoneEscrowPanelProps) {
  const deal = useMemo(
    () => createDemoEscrowDeal(startup.id, startup.name, startup.mrr),
    [startup.id, startup.name, startup.mrr],
  );

  const progress = useMemo(() => computeEscrowProgress(deal), [deal]);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-primary/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-emerald-500/30">
              <Lock className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Milestone Escrow</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Programmable investment — funds release when milestones are verified on-chain
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-foreground">{formatCurrency(deal.totalAmount)}</span>
            <p className="text-xs text-muted-foreground">Total Escrow</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {progress.milestonesCompleted}/{progress.totalMilestones} milestones completed
            </span>
            <span className="font-mono">
              <span className="text-emerald-500">{formatCurrency(progress.fundsReleased)}</span>
              <span className="text-muted-foreground"> / {formatCurrency(deal.totalAmount)}</span>
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress.overallPct}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="rounded-lg bg-card/80 p-2 text-center">
            <span className="text-lg font-bold font-mono text-emerald-500">{formatCurrency(progress.fundsReleased)}</span>
            <p className="text-[10px] text-muted-foreground">Released</p>
          </div>
          <div className="rounded-lg bg-card/80 p-2 text-center">
            <span className="text-lg font-bold font-mono text-foreground">{formatCurrency(progress.fundsRemaining)}</span>
            <p className="text-[10px] text-muted-foreground">Locked</p>
          </div>
          <div className="rounded-lg bg-card/80 p-2 text-center">
            <span className={`text-lg font-bold font-mono ${progress.daysUntilNextDeadline && progress.daysUntilNextDeadline < 30 ? 'text-amber-500' : 'text-foreground'}`}>
              {progress.daysUntilNextDeadline ?? '—'}
            </span>
            <p className="text-[10px] text-muted-foreground">Days to next deadline</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="p-4 space-y-2">
        {deal.milestones.map((ms, i) => (
          <MilestoneRow key={ms.id} milestone={ms} index={i} />
        ))}
      </div>

      {/* Escrow info */}
      <div className="border-t border-border px-4 py-3 bg-muted/10">
        <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground mb-0.5">Escrow Terms</p>
            <p>{deal.refundConditions}</p>
            <p className="mt-1">{deal.disputeResolution}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
