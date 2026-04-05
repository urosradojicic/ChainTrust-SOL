import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity, Target } from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { formatCurrency } from '@/lib/format';

interface ValuationMetricsProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
}

export default function ValuationMetrics({ startup, metrics }: ValuationMetricsProps) {
  const annualizedRevenue = startup.mrr * 12;
  const latestValuation = 45_000_000; // placeholder — would come from funding rounds DB
  const psRatio = annualizedRevenue > 0 ? (latestValuation / annualizedRevenue).toFixed(1) : 'N/A';

  const last6 = metrics.slice(-6);
  const prevMrr = last6.length >= 2 ? Number(last6[last6.length - 2]?.revenue ?? 0) : 0;
  const currentMrr = startup.mrr;
  const mrrGrowthRate = prevMrr > 0 ? ((currentMrr - prevMrr) / prevMrr * 100) : 0;
  const annualGrowth = Math.pow(1 + mrrGrowthRate / 100, 12) - 1;

  const totalCosts = last6.reduce((s, m) => s + Number(m.costs), 0);
  const totalRevenue = last6.reduce((s, m) => s + Number(m.revenue), 0);
  const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue * 100).toFixed(1) : '0';

  const burnRate = totalCosts / (last6.length || 1);
  const runway = burnRate > 0 ? (Number(startup.treasury) / burnRate).toFixed(0) : '∞';

  const ruleOf40 = Number(startup.growth_rate) + Number(grossMargin);

  const items = [
    { label: 'P/S Ratio', value: typeof psRatio === 'string' ? psRatio : `${psRatio}x`, icon: DollarSign, desc: 'Price-to-Sales (annualized MRR)', color: Number(psRatio) < 10 ? 'text-accent' : Number(psRatio) < 30 ? 'text-amber-400' : 'text-destructive' },
    { label: 'ARR', value: formatCurrency(annualizedRevenue), icon: TrendingUp, desc: 'Annualized Recurring Revenue', color: 'text-primary' },
    { label: 'Gross Margin', value: `${grossMargin}%`, icon: Activity, desc: '6-month avg (Revenue - Costs) / Revenue', color: Number(grossMargin) >= 70 ? 'text-accent' : Number(grossMargin) >= 40 ? 'text-amber-400' : 'text-destructive' },
    { label: 'Runway', value: `${runway} mo`, icon: Target, desc: 'Treasury / avg monthly costs', color: Number(runway) >= 18 ? 'text-accent' : Number(runway) >= 6 ? 'text-amber-400' : 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <item.icon className="h-4 w-4" />
              <span className="text-xs">{item.label}</span>
            </div>
            <p className={`mt-1.5 text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Rule of 40 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`rounded-xl border-2 p-5 ${ruleOf40 >= 40 ? 'border-accent/40 bg-accent/5' : 'border-amber-500/30 bg-amber-500/5'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">Rule of 40</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Growth Rate + Profit Margin = {Number(startup.growth_rate).toFixed(1)}% + {grossMargin}%</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold font-mono ${ruleOf40 >= 40 ? 'text-accent' : 'text-amber-400'}`}>
              {ruleOf40.toFixed(0)}
            </span>
            <p className={`text-xs font-medium ${ruleOf40 >= 40 ? 'text-accent' : 'text-amber-400'}`}>
              {ruleOf40 >= 40 ? 'Passing' : 'Below threshold'}
            </p>
          </div>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${ruleOf40 >= 40 ? 'bg-accent' : 'bg-amber-400'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(ruleOf40, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0</span>
          <span className="text-accent font-medium">40 (target)</span>
          <span>100</span>
        </div>
      </motion.div>
    </div>
  );
}
