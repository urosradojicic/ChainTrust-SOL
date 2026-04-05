import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { DbStartup } from '@/types/database';

interface PercentileRankProps {
  startup: DbStartup;
  allStartups: DbStartup[];
}

function calcPercentile(value: number, allValues: number[]): number {
  const below = allValues.filter(v => v < value).length;
  return Math.round((below / allValues.length) * 100);
}

function PercentileBar({ label, percentile, value, unit }: { label: string; percentile: number; value: string; unit?: string }) {
  const color = percentile >= 75 ? '#10B981' : percentile >= 50 ? '#3B82F6' : percentile >= 25 ? '#F59E0B' : '#EF4444';
  const tierLabel = percentile >= 75 ? 'Top Quartile' : percentile >= 50 ? 'Above Median' : percentile >= 25 ? 'Below Median' : 'Bottom Quartile';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium">{value}{unit}</span>
          <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ backgroundColor: color + '20', color }}>{tierLabel}</span>
        </div>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted/20 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentile}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        {/* Median marker */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-foreground/20" />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>P0</span>
        <span>P{percentile}</span>
        <span>P100</span>
      </div>
    </div>
  );
}

export default function PercentileRank({ startup, allStartups }: PercentileRankProps) {
  if (allStartups.length < 2) return null;

  const mrrPercentile = calcPercentile(startup.mrr, allStartups.map(s => s.mrr));
  const trustPercentile = calcPercentile(startup.trust_score, allStartups.map(s => s.trust_score));
  const susPercentile = calcPercentile(startup.sustainability_score, allStartups.map(s => s.sustainability_score));
  const growthPercentile = calcPercentile(Number(startup.growth_rate), allStartups.map(s => Number(s.growth_rate)));
  const usersPercentile = calcPercentile(startup.users, allStartups.map(s => s.users));

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Platform Percentile Rankings
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Compared against {allStartups.length} startups on ChainTrust</p>
      <div className="space-y-4">
        <PercentileBar label="MRR" percentile={mrrPercentile} value={`$${(startup.mrr / 1000).toFixed(0)}K`} />
        <PercentileBar label="Trust Score" percentile={trustPercentile} value={String(startup.trust_score)} unit="/100" />
        <PercentileBar label="Sustainability" percentile={susPercentile} value={String(startup.sustainability_score)} unit="/100" />
        <PercentileBar label="Growth Rate" percentile={growthPercentile} value={`${Number(startup.growth_rate) >= 0 ? '+' : ''}${Number(startup.growth_rate)}`} unit="%" />
        <PercentileBar label="User Base" percentile={usersPercentile} value={startup.users >= 1000 ? `${(startup.users / 1000).toFixed(1)}K` : String(startup.users)} />
      </div>
    </div>
  );
}
