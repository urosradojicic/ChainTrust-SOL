import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Search, Leaf, Shield, BarChart3, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useStartups, useAllPledges } from '@/hooks/use-startups';

const BLOCKCHAINS = ['All', 'Solana Devnet'];

function scoreColor(s: number) {
  if (s >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (s >= 50) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

function trendIcon(growth: number) {
  if (growth > 2) return <TrendingUp className="h-4 w-4 text-primary" />;
  if (growth < -2) return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

const podiumStyles: Record<number, string> = {
  0: 'bg-yellow-500/[0.08] border-l-4 border-l-yellow-400',
  1: 'bg-gray-400/[0.06] border-l-4 border-l-gray-400',
  2: 'bg-amber-700/[0.06] border-l-4 border-l-amber-600',
};

const podiumIcons: Record<number, string> = {
  0: 'text-yellow-400',
  1: 'text-gray-400',
  2: 'text-amber-600',
};

export default function Leaderboard() {
  const { data: startups, isLoading } = useStartups();
  const { data: allPledges } = useAllPledges();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [chainFilter, setChainFilter] = useState('All');

  const ranked = useMemo(() => {
    if (!startups) return [];
    let list = [...startups];
    if (catFilter !== 'All') list = list.filter(s => s.category === catFilter);
    if (search.trim()) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => b.sustainability_score - a.sustainability_score);
    return list;
  }, [startups, search, catFilter, chainFilter]);

  const totalCarbonOffset = startups?.reduce((sum, s) => sum + Number(s.carbon_offset_tonnes), 0) ?? 0;

  // Count startups with 3+ active pledges
  const pledgeCountByStartup = useMemo(() => {
    if (!allPledges) return new Map<string, number>();
    const map = new Map<string, number>();
    allPledges.forEach(p => {
      if (p.status === 'active') map.set(p.startup_id, (map.get(p.startup_id) ?? 0) + 1);
    });
    return map;
  }, [allPledges]);

  const greenPledged = startups?.filter(s => (pledgeCountByStartup.get(s.id) ?? 0) >= 3).length ?? 0;
  const avgScore = startups && startups.length > 0
    ? Math.round(startups.reduce((sum, s) => sum + s.sustainability_score, 0) / startups.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
          🏆 Sustainability Leaderboard
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Startups ranked by on-chain sustainability score — transparency meets impact.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search startups…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={chainFilter} onValueChange={setChainFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-card border-border"><SelectValue placeholder="Blockchain" /></SelectTrigger>
          <SelectContent>
            {BLOCKCHAINS.map(b => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 bg-white/[0.03]">
              <TableHead className="w-16 text-center">#</TableHead>
              <TableHead>Startup</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Blockchain</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((s, i) => (
              <TableRow key={s.id} className={`transition-colors border-white/5 ${podiumStyles[i] ?? 'hover:bg-white/[0.03]'}`}>
                <TableCell className="text-center font-mono font-bold text-foreground">
                  <div className="flex items-center justify-center gap-1">
                    {i < 3 && <Trophy className={`h-4 w-4 ${podiumIcons[i]}`} />}
                    <span>{i + 1}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link to={`/startup/${s.id}`} className="flex items-center gap-3 font-semibold text-foreground hover:text-primary transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {s.name.charAt(0)}
                    </div>
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-sm font-bold ${scoreColor(s.sustainability_score)}`}>
                    {s.sustainability_score}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">{s.category}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{s.blockchain}</TableCell>
                <TableCell className="text-right font-mono font-medium text-foreground">{formatCurrency(s.mrr)}</TableCell>
                <TableCell className="text-center">{trendIcon(Number(s.growth_rate))}</TableCell>
              </TableRow>
            ))}
            {ranked.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No startups match your filters.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-bold text-foreground">Platform Impact Summary</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Leaf, label: 'Total Carbon Offsets', value: `${totalCarbonOffset.toLocaleString()}t`, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Shield, label: 'Green-Pledged Startups', value: `${greenPledged}`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { icon: BarChart3, label: 'Avg Sustainability Score', value: `${avgScore}/100`, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map(card => (
            <div key={card.label} className="rounded-xl glass-card gradient-border p-6">
              <div className={`mb-3 inline-flex rounded-lg p-2.5 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
