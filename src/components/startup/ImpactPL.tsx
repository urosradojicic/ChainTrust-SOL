import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { chartTooltipStyle } from '@/lib/constants';
import type { DbStartup, DbMetricsHistory } from '@/types/database';

const CARBON_PRICE = 50;

export default function ImpactPL({ startup, metrics }: { startup: DbStartup; metrics: DbMetricsHistory[] }) {
  const last6 = metrics.slice(-6);
  const totalRevenue = last6.reduce((s, m) => s + Number(m.revenue), 0);
  const totalCosts = last6.reduce((s, m) => s + Number(m.costs), 0);
  const reportedProfit = totalRevenue - totalCosts;

  const co2Tonnes = Number(startup.carbon_offset_tonnes);
  const energyCostEstimate = startup.energy_score < 20 ? 8000 : 3000;
  const envExternalities = co2Tonnes * CARBON_PRICE + energyCostEstimate;
  const impactProfit = reportedProfit - envExternalities;
  const delta = impactProfit - reportedProfit;
  const deltaPct = reportedProfit !== 0 ? ((delta / Math.abs(reportedProfit)) * 100).toFixed(1) : '0';

  const chartData = last6.map((m) => {
    const trad = Number(m.revenue) - Number(m.costs);
    const mEnv = (co2Tonnes / 6) * CARBON_PRICE + energyCostEstimate / 6;
    return { month: m.month, traditional: trad, impactAdjusted: Math.round(trad - mEnv) };
  });

  const fmt = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v.toLocaleString()}`);

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-foreground">Impact-Weighted P&L</h2>
        <UITooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">
            Impact-weighted accounting subtracts estimated environmental costs from reported profits to reveal true
            sustainable profitability.
          </TooltipContent>
        </UITooltip>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl glass-card p-5">
          <h3 className="mb-4 font-bold text-foreground">Traditional P&L</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-mono font-medium text-foreground">{fmt(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">− Operating Costs</span>
              <span className="font-mono font-medium text-destructive">−{fmt(totalCosts)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Reported Profit</span>
              <span className={`font-mono font-bold ${reportedProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {fmt(reportedProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl glass-card gradient-border p-5">
          <h3 className="mb-4 font-bold text-foreground">Impact-Adjusted P&L</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-mono font-medium text-foreground">{fmt(totalRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">− Operating Costs</span>
              <span className="font-mono font-medium text-destructive">−{fmt(totalCosts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">− Environmental Externalities</span>
              <span className="font-mono font-medium text-amber-400">−{fmt(envExternalities)}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Impact-Adjusted Profit</span>
              <span className={`font-mono font-bold ${impactProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {fmt(impactProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center justify-between"
      >
        <span className="font-semibold text-foreground">Impact Gap</span>
        <span className="font-mono font-bold text-amber-400">
          {delta >= 0 ? '+' : ''}
          {fmt(delta)} / {deltaPct}%
        </span>
      </motion.div>

      <div className="rounded-xl glass-card p-5">
        <h3 className="mb-4 font-bold text-foreground">6-Month Profit Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={4}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v: number, name: string) => [
                fmt(v),
                name === 'traditional' ? 'Traditional' : 'Impact-Adjusted',
              ]}
            />
            <Legend formatter={(v) => (v === 'traditional' ? 'Traditional Profit' : 'Impact-Adjusted Profit')} />
            <Bar dataKey="traditional" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="impactAdjusted" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
