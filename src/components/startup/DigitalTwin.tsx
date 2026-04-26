/**
 * Digital Twin — Monte Carlo Simulation Visualizer
 * ─────────────────────────────────────────────────
 * Interactive fan chart showing thousands of simulated futures.
 * Users adjust parameters and see probability distributions update in real-time.
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Activity, TrendingUp, DollarSign, Percent, Target, Zap, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { formatCurrency, formatNumber } from '@/lib/format';
import { chartTooltipStyle } from '@/lib/constants';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { runSimulation, DEFAULT_PARAMS, type SimulationParams, type SimulationResult } from '@/lib/monte-carlo';

// ── Stat Card ────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: typeof Activity; label: string; value: string; subtext: string; color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{subtext}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface DigitalTwinProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
}

export default function DigitalTwin({ startup, metrics }: DigitalTwinProps) {
  const [params, setParams] = useState<SimulationParams>({
    ...DEFAULT_PARAMS,
    iterations: 3000,
    horizonMonths: 24,
    revenueMilestone: Math.max(startup.mrr * 5, 500000),
  });

  const [view, setView] = useState<'revenue' | 'cash'>('revenue');

  const result: SimulationResult = useMemo(
    () => runSimulation(startup, metrics, params),
    [startup, metrics, params],
  );

  const chartData = view === 'revenue' ? result.revenueBands : result.cashBands;

  const handleGrowthChange = useCallback((value: number[]) => {
    setParams(p => ({ ...p, growthRateOverride: value[0] }));
  }, []);

  const handleVolatilityChange = useCallback((value: number[]) => {
    setParams(p => ({ ...p, growthVolatilityOverride: value[0] }));
  }, []);

  const handleHorizonChange = useCallback((value: number[]) => {
    setParams(p => ({ ...p, horizonMonths: value[0] }));
  }, []);

  const handleReset = useCallback(() => {
    setParams({
      ...DEFAULT_PARAMS,
      iterations: 3000,
      horizonMonths: 24,
      revenueMilestone: Math.max(startup.mrr * 5, 500000),
    });
  }, [startup.mrr]);

  const s = result.summary;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-cyan-500/5 to-primary/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-primary/30">
              <Activity className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Digital Twin</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {params.iterations.toLocaleString()} Monte Carlo simulations &bull; {params.horizonMonths}-month horizon
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === 'revenue' ? 'cash' : 'revenue')}
              className="text-xs px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted/50 transition"
            >
              {view === 'revenue' ? 'Show Cash' : 'Show Revenue'}
            </button>
            <button onClick={handleReset} className="p-1.5 rounded-md border border-border hover:bg-muted/50 transition">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
        <StatCard
          icon={Target}
          label={`$${(params.revenueMilestone / 1000).toFixed(0)}K Milestone`}
          value={`${(result.milestoneProbability * 100).toFixed(0)}%`}
          subtext={result.milestoneMedianMonth ? `Median: month ${result.milestoneMedianMonth}` : 'Unlikely in horizon'}
          color="#8B5CF6"
        />
        <StatCard
          icon={DollarSign}
          label="Median Revenue (End)"
          value={formatCurrency(s.medianFinalRevenue)}
          subtext={`${(s.prob2xRevenue * 100).toFixed(0)}% chance of 2x`}
          color="#10B981"
        />
        <StatCard
          icon={Zap}
          label="Cash-Out Risk"
          value={`${(result.cashOutProbability * 100).toFixed(0)}%`}
          subtext={`Median runway: ${result.medianRunway}mo`}
          color={result.cashOutProbability > 0.5 ? '#EF4444' : '#10B981'}
        />
        <StatCard
          icon={Percent}
          label="Solvent at End"
          value={`${(s.probSolvent * 100).toFixed(0)}%`}
          subtext={`5x return: ${(s.prob5xRevenue * 100).toFixed(0)}% chance`}
          color="#3B82F6"
        />
      </div>

      {/* Fan chart */}
      <div className="px-4 pb-2">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="band95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#534AB7" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#534AB7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="band75" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#534AB7" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#534AB7" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="band50" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#534AB7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#534AB7" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={Math.floor(params.horizonMonths / 8)} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} width={60} />
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={(v: number, name: string) => {
                const labels: Record<string, string> = {
                  p95: '95th percentile (best case)',
                  p75: '75th percentile',
                  p50: 'Median',
                  p25: '25th percentile',
                  p5: '5th percentile (worst case)',
                };
                return [formatCurrency(v), labels[name] || name];
              }}
            />
            {/* 5-95 band */}
            <Area type="monotone" dataKey="p95" stroke="none" fill="url(#band95)" />
            <Area type="monotone" dataKey="p5" stroke="none" fill="transparent" />
            {/* 25-75 band */}
            <Area type="monotone" dataKey="p75" stroke="none" fill="url(#band75)" />
            <Area type="monotone" dataKey="p25" stroke="none" fill="transparent" />
            {/* Median line */}
            <Area type="monotone" dataKey="p50" stroke="#534AB7" strokeWidth={2.5} fill="url(#band50)" dot={false} />
            {/* Milestone reference */}
            {view === 'revenue' && (
              <ReferenceLine y={params.revenueMilestone} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Milestone', position: 'right', fontSize: 10, fill: '#F59E0B' }} />
            )}
            {view === 'cash' && (
              <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Cash-out', position: 'right', fontSize: 10, fill: '#EF4444' }} />
            )}
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-primary/10 inline-block" /> 5th-95th %ile</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-sm bg-primary/20 inline-block" /> 25th-75th %ile</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block" /> Median</span>
        </div>
      </div>

      {/* Profitability probability chart */}
      <div className="px-4 pb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2">Probability of Profitability by Month</p>
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={result.profitabilityByMonth.map((p, i) => ({ month: i, prob: p * 100 }))}>
            <defs>
              <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" hide />
            <YAxis hide domain={[0, 100]} />
            <Area type="monotone" dataKey="prob" stroke="#10B981" strokeWidth={1.5} fill="url(#profGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Parameter sliders */}
      <div className="border-t border-border p-4 space-y-4 bg-muted/10">
        <p className="text-xs font-medium text-foreground">Adjust Assumptions</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">Growth Rate</span>
              <span className="text-xs font-mono font-bold text-foreground">
                {params.growthRateOverride !== null ? `${params.growthRateOverride}%` : `${s.baseGrowthRate.toFixed(1)}% (auto)`}
              </span>
            </div>
            <Slider
              value={[params.growthRateOverride ?? Math.round(s.baseGrowthRate)]}
              onValueChange={handleGrowthChange}
              min={-10}
              max={50}
              step={1}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">Volatility</span>
              <span className="text-xs font-mono font-bold text-foreground">
                {params.growthVolatilityOverride !== null ? `${params.growthVolatilityOverride}%` : `${s.growthVolatility.toFixed(1)}% (auto)`}
              </span>
            </div>
            <Slider
              value={[params.growthVolatilityOverride ?? Math.round(s.growthVolatility)]}
              onValueChange={handleVolatilityChange}
              min={1}
              max={30}
              step={1}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">Horizon</span>
              <span className="text-xs font-mono font-bold text-foreground">{params.horizonMonths} months</span>
            </div>
            <Slider
              value={[params.horizonMonths]}
              onValueChange={handleHorizonChange}
              min={6}
              max={36}
              step={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
