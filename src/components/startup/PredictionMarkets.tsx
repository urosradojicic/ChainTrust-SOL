/**
 * Prediction Markets Panel
 * ────────────────────────
 * Displays crowd-sourced prediction markets for startup milestones.
 * Shows probability prices, volume, and trade counts.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, Target } from 'lucide-react';
import { chartTooltipStyle } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';
import type { DbStartup } from '@/types/database';
import { generateDemoMarkets, type PredictionMarket } from '@/lib/prediction-market';

const CATEGORY_COLORS = {
  revenue: '#10B981', growth: '#3B82F6', survival: '#8B5CF6',
  funding: '#F59E0B', product: '#EC4899', custom: '#6B7280',
};

function MarketCard({ market }: { market: PredictionMarket }) {
  const color = CATEGORY_COLORS[market.category] ?? '#6B7280';
  const daysLeft = Math.max(0, Math.ceil((market.closesAt - Date.now()) / (24 * 3600 * 1000)));
  const probPct = (market.yesPrice * 100).toFixed(0);

  return (
    <div className="rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '15', color }}>
                {market.category}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {daysLeft}d left
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{market.question}</p>
          </div>
          <div className="text-right shrink-0">
            <motion.span
              className="text-2xl font-bold font-mono"
              style={{ color: market.yesPrice >= 0.6 ? '#10B981' : market.yesPrice >= 0.4 ? '#F59E0B' : '#EF4444' }}
            >
              {probPct}%
            </motion.span>
            <p className="text-[10px] text-muted-foreground">YES probability</p>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-500">YES</span>
          <div className="flex-1 h-2 rounded-full bg-red-500/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${market.yesPrice * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className="text-[10px] font-mono text-red-500">NO</span>
        </div>

        {/* Price chart */}
        {market.priceHistory.length > 3 && (
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={market.priceHistory}>
                <defs>
                  <linearGradient id={`mkt-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, 1]} />
                <XAxis hide />
                <Area type="monotone" dataKey="yesPrice" stroke={color} strokeWidth={1.5} fill={`url(#mkt-${market.id})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <DollarSign className="h-2.5 w-2.5" />
            ${(market.volume / 1000).toFixed(1)}K volume
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5" />
            {market.traders} traders
          </span>
          {market.oracleMetric && (
            <span className="flex items-center gap-1 text-primary">
              <Target className="h-2.5 w-2.5" />
              Oracle-resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface PredictionMarketsProps {
  startup: DbStartup;
}

export default function PredictionMarkets({ startup }: PredictionMarketsProps) {
  const markets = useMemo(() => generateDemoMarkets(startup), [startup]);

  const totalVolume = markets.reduce((s, m) => s + m.volume, 0);
  const avgProb = markets.reduce((s, m) => s + m.yesPrice, 0) / markets.length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-primary/5 to-blue-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-amber-500/30">
              <TrendingUp className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Prediction Markets</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crowd-sourced probability estimates &bull; Oracle-resolved via on-chain metrics
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold font-mono text-foreground">{formatCurrency(totalVolume)}</span>
            <p className="text-[10px] text-muted-foreground">Total volume</p>
          </div>
        </div>
      </div>

      {/* Markets grid */}
      <div className="p-4 grid gap-3 sm:grid-cols-2">
        {markets.map(market => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
    </div>
  );
}
