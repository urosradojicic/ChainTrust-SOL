import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency } from '@/lib/format';
import { Loader2 } from 'lucide-react';

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Fintech: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  SaaS: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  DeFi: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Cleantech: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Infrastructure: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
};

function getScoreColor(score: number) {
  if (score >= 75) return 'from-emerald-500/20 to-emerald-500/5';
  if (score >= 50) return 'from-amber-500/20 to-amber-500/5';
  return 'from-red-500/20 to-red-500/5';
}

export default function EcosystemHeatmap() {
  const { data: startups, isLoading } = useStartups();

  const sorted = useMemo(() => {
    if (!startups) return [];
    return [...startups].sort((a, b) => b.mrr - a.mrr);
  }, [startups]);

  const totalMrr = sorted.reduce((s, x) => s + x.mrr, 0);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-foreground">Ecosystem Heatmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Startup size by MRR, colored by sustainability score</p>
        </div>
        <span className="text-xs font-mono text-muted-foreground">Total: {formatCurrency(totalMrr)} MRR</span>
      </div>

      {/* Treemap-style grid */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(140px, 1fr))` }}>
        {sorted.map((s, i) => {
          const sizePct = totalMrr > 0 ? (s.mrr / totalMrr) * 100 : 0;
          const catColors = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.SaaS;
          const isLarge = sizePct > 20;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              style={{ gridColumn: isLarge ? 'span 2' : undefined, gridRow: isLarge ? 'span 2' : undefined }}
            >
              <Link
                to={`/startup/${s.id}`}
                className={`block h-full rounded-xl border bg-gradient-to-br ${getScoreColor(s.sustainability_score)} p-4 transition hover:scale-[1.02] hover:shadow-lg ${catColors.border}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${catColors.bg} ${catColors.text}`}>{s.category}</span>
                  {s.verified && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20">
                      <svg className="h-2.5 w-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                  )}
                </div>
                <h4 className={`${isLarge ? 'text-lg' : 'text-sm'} font-bold text-foreground mt-2`}>{s.name}</h4>
                <p className={`${isLarge ? 'text-xl' : 'text-sm'} font-mono font-bold text-foreground mt-1`}>{formatCurrency(s.mrr)}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs font-mono ${s.sustainability_score >= 75 ? 'text-accent' : s.sustainability_score >= 50 ? 'text-amber-400' : 'text-destructive'}`}>
                    {s.sustainability_score}/100
                  </span>
                  <span className={`text-xs font-mono ${Number(s.growth_rate) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    {Number(s.growth_rate) >= 0 ? '+' : ''}{Number(s.growth_rate)}%
                  </span>
                </div>
                {isLarge && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-gradient-to-br from-emerald-500/40 to-emerald-500/10" /> Score 75+</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-gradient-to-br from-amber-500/40 to-amber-500/10" /> Score 50-74</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-gradient-to-br from-red-500/40 to-red-500/10" /> Score &lt;50</span>
        <span className="text-muted-foreground/50">|</span>
        <span>Size = MRR share</span>
      </div>
    </div>
  );
}
