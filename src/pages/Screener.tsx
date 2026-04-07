import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import Badge from '@/components/common/Badge';
import { categoryColors } from '@/lib/constants';
import { Loader2, SlidersHorizontal, Download, ArrowUpDown } from 'lucide-react';

type SortKey = 'mrr' | 'users' | 'growth_rate' | 'trust_score' | 'sustainability_score' | 'treasury' | 'whale_concentration';

interface Filters {
  minMrr: string;
  maxMrr: string;
  minTrust: string;
  minSustainability: string;
  maxWhaleConcentration: string;
  category: string;
  verified: string;
  minGrowth: string;
}

const initFilters: Filters = {
  minMrr: '', maxMrr: '', minTrust: '', minSustainability: '',
  maxWhaleConcentration: '', category: 'All', verified: 'All', minGrowth: '',
};

function exportCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Screener() {
  const { data: startups, isLoading } = useStartups();
  const [filters, setFilters] = useState<Filters>(initFilters);
  const [sortKey, setSortKey] = useState<SortKey>('trust_score');
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const u = (key: keyof Filters, val: string) => setFilters(f => ({ ...f, [key]: val }));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const results = useMemo(() => {
    if (!startups) return [];
    return startups
      .filter(s => {
        if (filters.minMrr && s.mrr < Number(filters.minMrr)) return false;
        if (filters.maxMrr && s.mrr > Number(filters.maxMrr)) return false;
        if (filters.minTrust && s.trust_score < Number(filters.minTrust)) return false;
        if (filters.minSustainability && s.sustainability_score < Number(filters.minSustainability)) return false;
        if (filters.maxWhaleConcentration && s.whale_concentration > Number(filters.maxWhaleConcentration)) return false;
        if (filters.category !== 'All' && s.category !== filters.category) return false;
        if (filters.verified === 'Yes' && !s.verified) return false;
        if (filters.verified === 'No' && s.verified) return false;
        if (filters.minGrowth && Number(s.growth_rate) < Number(filters.minGrowth)) return false;
        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortKey] as number;
        const bVal = b[sortKey] as number;
        return sortAsc ? aVal - bVal : bVal - aVal;
      });
  }, [startups, filters, sortKey, sortAsc]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'All').length;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const inputCls = 'rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-full';

  const presets = [
    { label: 'High Growth', apply: () => setFilters({ ...initFilters, minGrowth: '10' }) },
    { label: 'ESG Leaders', apply: () => setFilters({ ...initFilters, minSustainability: '70' }) },
    { label: 'Low Risk', apply: () => setFilters({ ...initFilters, maxWhaleConcentration: '30', minTrust: '60' }) },
    { label: 'Verified Only', apply: () => setFilters({ ...initFilters, verified: 'Yes' }) },
    { label: 'Revenue >$100K', apply: () => setFilters({ ...initFilters, minMrr: '100000' }) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Screener</h1>
          <p className="mt-1 text-muted-foreground">Filter startups by any metric combination</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${showFilters ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>
          <button
            onClick={() => exportCSV(results.map(s => ({ Name: s.name, Category: s.category, MRR: s.mrr, Users: s.users, Growth: s.growth_rate, Trust: s.trust_score, Sustainability: s.sustainability_score, Verified: s.verified, Whale: s.whale_concentration })), 'screener-results.csv')}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Quick filter presets */}
      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map(p => (
          <button key={p.label} onClick={p.apply} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary hover:bg-primary/5">
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Min MRR ($)</label>
              <input type="number" value={filters.minMrr} onChange={e => u('minMrr', e.target.value)} className={inputCls} placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Max MRR ($)</label>
              <input type="number" value={filters.maxMrr} onChange={e => u('maxMrr', e.target.value)} className={inputCls} placeholder="No limit" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground" title="0-100 score based on on-chain verification, metrics accuracy, and governance participation">Min Trust Score (0-100)</label>
              <input type="number" value={filters.minTrust} onChange={e => u('minTrust', e.target.value)} className={inputCls} placeholder="0" min={0} max={100} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground" title="0-100 score based on energy usage, carbon offsets, tokenomics fairness, and governance pledges">Min Sustainability (0-100)</label>
              <input type="number" value={filters.minSustainability} onChange={e => u('minSustainability', e.target.value)} className={inputCls} placeholder="0" min={0} max={100} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground" title="Percentage of tokens held by the top wallet holders. Lower = more distributed = less risk of market manipulation">Max Whale Concentration (%)</label>
              <input type="number" value={filters.maxWhaleConcentration} onChange={e => u('maxWhaleConcentration', e.target.value)} className={inputCls} placeholder="100" max={100} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Min Growth (%)</label>
              <input type="number" value={filters.minGrowth} onChange={e => u('minGrowth', e.target.value)} className={inputCls} placeholder="Any" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
              <select value={filters.category} onChange={e => u('category', e.target.value)} className={inputCls}>
                {['All', 'DeFi', 'Fintech', 'SaaS', 'Cleantech', 'Infrastructure'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Verified</label>
              <select value={filters.verified} onChange={e => u('verified', e.target.value)} className={inputCls}>
                <option>All</option><option>Yes</option><option>No</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{results.length} startup{results.length !== 1 ? 's' : ''} match</span>
            <button onClick={() => setFilters(initFilters)} className="text-xs text-primary hover:underline">Reset all</button>
          </div>
        </motion.div>
      )}

      {/* Results table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {[
                { key: 'name' as const, label: 'Startup', align: 'text-left' },
                { key: 'mrr' as SortKey, label: 'MRR', align: 'text-right' },
                { key: 'users' as SortKey, label: 'Users', align: 'text-right' },
                { key: 'growth_rate' as SortKey, label: 'Growth', align: 'text-right' },
                { key: 'trust_score' as SortKey, label: 'Trust', align: 'text-right' },
                { key: 'sustainability_score' as SortKey, label: 'Sust.', align: 'text-right' },
                { key: 'whale_concentration' as SortKey, label: 'Whale %', align: 'text-right' },
                { key: 'treasury' as SortKey, label: 'Treasury', align: 'text-right' },
              ].map(col => (
                <th
                  key={col.label}
                  className={`px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition ${col.align}`}
                  onClick={() => col.key !== 'name' && toggleSort(col.key as SortKey)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && <ArrowUpDown className="h-3 w-3" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {results.map((s, i) => (
              <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-muted/30 transition">
                <td className="px-4 py-3">
                  <Link to={`/startup/${s.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{s.name.charAt(0)}</div>
                    <div>
                      <span>{s.name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={categoryColors[s.category] || 'neutral'}>{s.category}</Badge>
                        {s.verified && <Badge variant="success">✓</Badge>}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(s.mrr)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatNumber(s.users)}</td>
                <td className={`px-4 py-3 text-right font-mono ${Number(s.growth_rate) >= 0 ? 'text-accent' : 'text-destructive'}`}>{Number(s.growth_rate) >= 0 ? '+' : ''}{Number(s.growth_rate)}%</td>
                <td className="px-4 py-3 text-right"><span className={`font-mono font-bold ${s.trust_score > 70 ? 'text-accent' : s.trust_score > 40 ? 'text-amber-400' : 'text-destructive'}`}>{s.trust_score}</span></td>
                <td className="px-4 py-3 text-right"><span className={`font-mono font-bold ${s.sustainability_score >= 75 ? 'text-accent' : s.sustainability_score >= 50 ? 'text-amber-400' : 'text-destructive'}`}>{s.sustainability_score}</span></td>
                <td className="px-4 py-3 text-right"><span className={`font-mono ${s.whale_concentration > 50 ? 'text-destructive' : s.whale_concentration > 30 ? 'text-amber-400' : 'text-accent'}`}>{s.whale_concentration}%</span></td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(s.treasury))}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">No startups match your filters.</p>
          <button onClick={() => setFilters(initFilters)} className="mt-2 text-sm text-primary hover:underline">Reset all filters</button>
        </div>
      )}
    </div>
  );
}
