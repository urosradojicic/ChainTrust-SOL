import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, GitCompareArrows, Loader2, Download } from 'lucide-react';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { DbStartup } from '@/types/database';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
} from 'recharts';

const RADAR_COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

interface Row {
  label: string;
  key: string;
  getValue: (s: DbStartup) => number | string;
  getNumeric: (s: DbStartup) => number;
  higherIsBetter: boolean;
  format?: (v: number | string) => string;
}

const rows: Row[] = [
  { label: 'Sustainability Score', key: 'sustainability', getValue: s => s.sustainability_score, getNumeric: s => s.sustainability_score, higherIsBetter: true, format: v => `${v}/100` },
  { label: 'MRR', key: 'mrr', getValue: s => s.mrr, getNumeric: s => s.mrr, higherIsBetter: true, format: v => formatCurrency(v as number) },
  { label: 'Monthly Active Users', key: 'users', getValue: s => s.users, getNumeric: s => s.users, higherIsBetter: true, format: v => formatNumber(v as number) },
  { label: 'Growth Rate', key: 'growth', getValue: s => Number(s.growth_rate), getNumeric: s => Number(s.growth_rate), higherIsBetter: true, format: v => `${Number(v) >= 0 ? '+' : ''}${v}%` },
  { label: 'Energy / Transaction', key: 'energy', getValue: s => s.energy_per_transaction || '0.001 kWh', getNumeric: s => parseFloat(s.energy_per_transaction || '0.001'), higherIsBetter: false },
  { label: 'Carbon Offsets (tonnes)', key: 'carbon', getValue: s => Number(s.carbon_offset_tonnes), getNumeric: s => Number(s.carbon_offset_tonnes), higherIsBetter: true, format: v => `${Number(v).toLocaleString()}t` },
  { label: 'Whale Concentration', key: 'concentration', getValue: s => s.whale_concentration, getNumeric: s => s.whale_concentration, higherIsBetter: false, format: v => `${v}%` },
  { label: 'Trust Score', key: 'trust', getValue: s => s.trust_score, getNumeric: s => s.trust_score, higherIsBetter: true, format: v => `${v}/100` },
  { label: 'Governance Score', key: 'governance', getValue: s => s.governance_score, getNumeric: s => s.governance_score, higherIsBetter: true, format: v => `${v}/25` },
];

function cellHighlight(values: number[], idx: number, higherIsBetter: boolean) {
  if (values.length < 2) return '';
  const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
  const worst = higherIsBetter ? Math.min(...values) : Math.max(...values);
  if (values[idx] === best && best !== worst) return 'bg-emerald-500/10';
  if (values[idx] === worst && best !== worst) return 'bg-red-500/10';
  return '';
}

export default function Compare() {
  const { data: allStartups, isLoading } = useStartups();
  const [selected, setSelected] = useState<string[]>([]);

  // Initialize selection when data loads
  useMemo(() => {
    if (allStartups && allStartups.length >= 2 && selected.length === 0) {
      setSelected([allStartups[0].id, allStartups[1].id]);
    }
  }, [allStartups]);

  const startups = useMemo(
    () => selected.map(id => allStartups?.find(s => s.id === id)).filter(Boolean) as DbStartup[],
    [selected, allStartups],
  );

  const canAddMore = selected.length < 3;

  const updateSelection = (idx: number, val: string) => {
    setSelected(prev => prev.map((v, i) => (i === idx ? val : v)));
  };

  const removeSlot = (idx: number) => {
    if (selected.length <= 2) return;
    setSelected(prev => prev.filter((_, i) => i !== idx));
  };

  const addSlot = () => {
    if (!canAddMore || !allStartups) return;
    const unused = allStartups.find(s => !selected.includes(s.id));
    if (unused) setSelected(prev => [...prev, unused.id]);
  };

  const radarData = useMemo(() => {
    if (!allStartups || startups.length === 0) return [];
    const maxMrr = Math.max(...allStartups.map(s => s.mrr), 1);
    const maxUsers = Math.max(...allStartups.map(s => s.users), 1);
    const maxGrowth = Math.max(...allStartups.map(s => Math.abs(Number(s.growth_rate))), 1);
    const dims = [
      { key: 'Revenue', get: (s: DbStartup) => s.mrr, max: maxMrr },
      { key: 'Users', get: (s: DbStartup) => s.users, max: maxUsers },
      { key: 'Growth', get: (s: DbStartup) => Math.max(0, Number(s.growth_rate)), max: maxGrowth },
      { key: 'Sustainability', get: (s: DbStartup) => s.sustainability_score, max: 100 },
      { key: 'Tokenomics', get: (s: DbStartup) => s.tokenomics_score, max: 25 },
      { key: 'Governance', get: (s: DbStartup) => s.governance_score, max: 25 },
    ];
    return dims.map(d => {
      const point: Record<string, string | number> = { dimension: d.key };
      startups.forEach(s => { point[s.name] = Math.round((d.get(s) / (d.max || 1)) * 100); });
      return point;
    });
  }, [startups, allStartups]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!allStartups || allStartups.length < 2) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Not enough startups to compare</h1>
        <p className="mt-2 text-muted-foreground">At least 2 startups needed.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Compare Startups</h1>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            const csv = ['Metric,' + startups.map(s => s.name).join(','), ...rows.map(r => r.label + ',' + startups.map(s => r.format ? r.format(r.getValue(s) as number) : r.getValue(s)).join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'comparison.csv'; a.click();
          }}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
        <p className="mt-2 text-lg text-muted-foreground">Side-by-side analysis across financial, sustainability, and governance metrics.</p>
      </motion.div>

      {/* Selectors */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 flex flex-wrap items-end gap-3">
        {selected.map((id, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Startup {idx + 1}</label>
              <Select value={id} onValueChange={v => updateSelection(idx, v)}>
                <SelectTrigger className="w-full sm:w-52 bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allStartups.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {selected.length > 2 && (
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeSlot(idx)}><X className="h-4 w-4" /></Button>
            )}
          </div>
        ))}
        {canAddMore && (
          <Button variant="outline" size="sm" className="border-dashed border-border text-muted-foreground" onClick={addSlot}><Plus className="h-4 w-4 mr-1" /> Add Startup</Button>
        )}
      </motion.div>

      {/* Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10 overflow-x-auto rounded-xl glass-card">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-4 text-left font-medium text-muted-foreground w-56">Metric</th>
              {startups.map(s => (
                <th key={s.id} className="px-5 py-4 text-center font-semibold text-foreground">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{s.name.charAt(0)}</div>
                    {s.name}
                    {s.verified && <span className="text-[9px] text-accent font-medium">Verified</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(row => {
              const numericValues = startups.map(s => row.getNumeric(s));
              return (
                <tr key={row.key} className="transition hover:bg-muted/50">
                  <td className="px-5 py-3.5 font-medium text-muted-foreground">{row.label}</td>
                  {startups.map((s, idx) => {
                    const val = row.getValue(s);
                    const display = row.format ? row.format(val as number) : String(val);
                    return (
                      <td key={s.id} className={`px-5 py-3.5 text-center font-mono font-medium text-foreground ${cellHighlight(numericValues, idx, row.higherIsBetter)}`}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Radar Chart */}
      {radarData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl glass-card p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground">Multi-Dimensional Comparison</h2>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="hsl(217 20% 25%)" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 13 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              {startups.map((s, i) => (
                <Radar key={s.id} name={s.name} dataKey={s.name} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
