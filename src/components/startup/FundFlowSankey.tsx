import { motion } from 'framer-motion';
import { ArrowRight, Wallet, Code, Megaphone, Server, Users, Shield, type LucideIcon } from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface FlowNode {
  label: string;
  value: number;
  color: string;
  icon: LucideIcon;
  pct: number;
}

function computeFlows(startup: DbStartup, metrics: DbMetricsHistory[]): { sources: FlowNode[]; destinations: FlowNode[]; totalInflow: number; totalOutflow: number } {
  const lastMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const revenue = lastMetrics ? Number(lastMetrics.revenue) : startup.mrr;
  const costs = lastMetrics ? Number(lastMetrics.costs) : Math.round(startup.mrr * 0.6);
  const treasury = Number(startup.treasury);

  // Simulate fund sources from startup data
  const totalInflow = revenue + Math.round(treasury * 0.05); // revenue + treasury yield
  const sources: FlowNode[] = [
    { label: 'Revenue', value: revenue, color: '#10B981', icon: Wallet, pct: Math.round((revenue / totalInflow) * 100) },
    { label: 'Treasury Yield', value: Math.round(treasury * 0.05), color: '#3B82F6', icon: Shield, pct: Math.round((treasury * 0.05 / totalInflow) * 100) },
  ];

  // Allocate costs across departments
  const devPct = 0.40;
  const marketingPct = 0.20;
  const infraPct = 0.15;
  const teamPct = 0.15;
  const reservePct = 0.10;

  const totalOutflow = costs;
  const destinations: FlowNode[] = [
    { label: 'Development', value: Math.round(costs * devPct), color: '#8B5CF6', icon: Code, pct: Math.round(devPct * 100) },
    { label: 'Marketing', value: Math.round(costs * marketingPct), color: '#F59E0B', icon: Megaphone, pct: Math.round(marketingPct * 100) },
    { label: 'Infrastructure', value: Math.round(costs * infraPct), color: '#06B6D4', icon: Server, pct: Math.round(infraPct * 100) },
    { label: 'Team', value: Math.round(costs * teamPct), color: '#EC4899', icon: Users, pct: Math.round(teamPct * 100) },
    { label: 'Reserve', value: Math.round(costs * reservePct), color: '#6B7280', icon: Shield, pct: Math.round(reservePct * 100) },
  ];

  return { sources, destinations, totalInflow, totalOutflow };
}

function FlowBar({ node, side, index }: { node: FlowNode; side: 'left' | 'right'; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-3"
    >
      {side === 'right' && (
        <div className="w-16 h-2 rounded-full bg-muted/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: node.color }}
            initial={{ width: 0 }}
            animate={{ width: `${node.pct}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        </div>
      )}
      <div className={`flex items-center gap-2 ${side === 'left' ? 'flex-row-reverse text-right' : ''}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: node.color + '20' }}>
          <node.icon className="h-4 w-4" style={{ color: node.color }} />
        </div>
        <div>
          <div className="text-xs font-medium">{node.label}</div>
          <div className="text-xs text-muted-foreground font-mono">{formatCurrency(node.value)}</div>
        </div>
      </div>
      {side === 'left' && (
        <div className="w-16 h-2 rounded-full bg-muted/20 overflow-hidden flex justify-end">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: node.color }}
            initial={{ width: 0 }}
            animate={{ width: `${node.pct}%` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        </div>
      )}
    </motion.div>
  );
}

interface FundFlowSankeyProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
}

export default function FundFlowSankey({ startup, metrics }: FundFlowSankeyProps) {
  const { sources, destinations, totalInflow, totalOutflow } = computeFlows(startup, metrics);
  const netFlow = totalInflow - totalOutflow;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Wallet className="h-4 w-4 text-primary" /> Fund Flow Analysis
      </h3>
      <p className="text-xs text-muted-foreground mb-6">Monthly capital flow visualization</p>

      <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
        {/* Sources */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Inflow</div>
          {sources.map((s, i) => (
            <FlowBar key={s.label} node={s} side="left" index={i} />
          ))}
          <div className="mt-2 pt-2 border-t border-border/50 text-right">
            <span className="text-xs text-muted-foreground">Total: </span>
            <span className="text-sm font-bold font-mono text-emerald-400">{formatCurrency(totalInflow)}</span>
          </div>
        </div>

        {/* Center - Treasury */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-1 text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
          </div>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5">
            <div className="text-center">
              <Wallet className="h-5 w-5 mx-auto text-primary" />
              <div className="text-[10px] text-muted-foreground mt-1">Treasury</div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
          </div>
          <div className={`text-xs font-bold font-mono ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
          </div>
          <div className="text-[9px] text-muted-foreground">Net Flow</div>
        </motion.div>

        {/* Destinations */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Outflow</div>
          {destinations.map((d, i) => (
            <FlowBar key={d.label} node={d} side="right" index={i} />
          ))}
          <div className="mt-2 pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Total: </span>
            <span className="text-sm font-bold font-mono text-red-400">{formatCurrency(totalOutflow)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
