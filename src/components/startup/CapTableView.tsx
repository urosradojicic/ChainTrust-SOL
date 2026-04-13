/**
 * Cap Table Viewer
 * ────────────────
 * Interactive cap table visualization with waterfall analysis
 * and scenario modeling.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { Users, DollarSign, TrendingUp, Layers } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { formatCurrency } from '@/lib/format';
import { chartTooltipStyle } from '@/lib/constants';
import { createDemoCapTable, runWaterfall, type CapTable, type WaterfallAnalysis } from '@/lib/cap-table';

const SHARE_CLASS_COLORS: Record<string, string> = {
  common: '#10B981',
  preferred_seed: '#3B82F6',
  preferred_a: '#8B5CF6',
  preferred_b: '#EC4899',
  options: '#F59E0B',
  safe: '#06B6D4',
  note: '#F97316',
};

const TYPE_COLORS: Record<string, string> = {
  founder: '#10B981',
  investor: '#3B82F6',
  employee: '#F59E0B',
  advisor: '#8B5CF6',
  option_pool: '#6B7280',
  safe: '#06B6D4',
  note: '#F97316',
};

interface CapTableViewProps {
  companyName: string;
}

export default function CapTableView({ companyName }: CapTableViewProps) {
  const [exitValuation, setExitValuation] = useState([50000000]); // $50M default

  const capTable = useMemo(() => createDemoCapTable(companyName), [companyName]);

  const waterfall: WaterfallAnalysis = useMemo(
    () => runWaterfall(capTable, exitValuation[0]),
    [capTable, exitValuation],
  );

  // Pie chart data
  const pieData = capTable.shareholders
    .filter(s => s.ownershipPct > 0.5)
    .map(s => ({
      name: s.name,
      value: +s.ownershipPct.toFixed(1),
      color: TYPE_COLORS[s.type] ?? '#6B7280',
    }));

  // Waterfall chart data
  const waterfallData = waterfall.rows
    .filter(r => r.proceeds > 0)
    .map(r => ({
      name: r.name.length > 15 ? r.name.slice(0, 15) + '...' : r.name,
      proceeds: r.proceeds,
      multiple: r.returnMultiple,
      pct: r.proceedsPct,
    }));

  const founderOwnership = capTable.shareholders
    .filter(s => s.type === 'founder')
    .reduce((s, sh) => s + sh.ownershipPct, 0);

  const investorOwnership = capTable.shareholders
    .filter(s => s.type === 'investor' || s.type === 'safe' || s.type === 'note')
    .reduce((s, sh) => s + sh.ownershipPct, 0);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-emerald-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-primary/30">
              <Layers className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Cap Table</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {capTable.shareholders.length} shareholders &bull; {formatCurrency(capTable.totalRaised)} raised
              </p>
            </div>
          </div>
          {capTable.latestValuation > 0 && (
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Post-Money</span>
              <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(capTable.latestValuation)}</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-lg bg-card/80 p-2 text-center">
            <span className="text-lg font-bold font-mono text-emerald-500">{founderOwnership.toFixed(1)}%</span>
            <p className="text-[10px] text-muted-foreground">Founders</p>
          </div>
          <div className="rounded-lg bg-card/80 p-2 text-center">
            <span className="text-lg font-bold font-mono text-blue-500">{investorOwnership.toFixed(1)}%</span>
            <p className="text-[10px] text-muted-foreground">Investors</p>
          </div>
          <div className="rounded-lg bg-card/80 p-2 text-center">
            <span className="text-lg font-bold font-mono text-foreground">{capTable.totalSharesOutstanding.toLocaleString()}</span>
            <p className="text-[10px] text-muted-foreground">Shares</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 p-4">
        {/* Ownership pie chart */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Ownership Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={2}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Ownership']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map(d => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value}%)
              </span>
            ))}
          </div>
        </div>

        {/* Waterfall at exit */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">Exit Waterfall</h4>
            <span className="text-xs font-mono text-muted-foreground">@ {formatCurrency(exitValuation[0])}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waterfallData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number, name: string, props: any) => [
                  `${formatCurrency(v)} (${props.payload.multiple.toFixed(1)}x)`,
                  'Proceeds',
                ]}
              />
              <Bar dataKey="proceeds" fill="#534AB7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Exit valuation slider */}
      <div className="border-t border-border px-4 py-3 bg-muted/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Model exit at:</span>
          <span className="text-sm font-bold font-mono text-foreground">{formatCurrency(exitValuation[0])}</span>
        </div>
        <Slider
          value={exitValuation}
          onValueChange={setExitValuation}
          min={1000000}
          max={500000000}
          step={1000000}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>$1M</span>
          <span>$250M</span>
          <span>$500M</span>
        </div>
      </div>

      {/* Shareholder table */}
      <div className="border-t border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Shareholder</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Shares</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Ownership</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Invested</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Price/Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {capTable.shareholders.map(sh => (
              <tr key={sh.id} className="hover:bg-muted/20 transition">
                <td className="px-3 py-2 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[sh.type] }} />
                    {sh.name}
                  </div>
                </td>
                <td className="px-3 py-2 text-muted-foreground capitalize">{sh.type.replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 text-right font-mono">{sh.shares > 0 ? sh.shares.toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{sh.ownershipPct > 0 ? `${sh.ownershipPct}%` : '—'}</td>
                <td className="px-3 py-2 text-right font-mono">{sh.invested > 0 ? formatCurrency(sh.invested) : '—'}</td>
                <td className="px-3 py-2 text-right font-mono">{sh.pricePerShare > 0.001 ? `$${sh.pricePerShare.toFixed(4)}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
