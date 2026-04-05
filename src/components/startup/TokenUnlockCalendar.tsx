import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Lock, Unlock, Calendar } from 'lucide-react';
import { chartTooltipStyle } from '@/lib/constants';

interface UnlockEvent {
  date: string;
  amount: number;
  category: string;
  unlocked: boolean;
}

const UNLOCK_SCHEDULE: UnlockEvent[] = [
  { date: '2024-01', amount: 10_000_000, category: 'Seed Investors', unlocked: true },
  { date: '2024-07', amount: 5_000_000, category: 'Team (cliff)', unlocked: true },
  { date: '2025-01', amount: 15_000_000, category: 'Seed + Team', unlocked: true },
  { date: '2025-07', amount: 10_000_000, category: 'Series A', unlocked: true },
  { date: '2026-01', amount: 20_000_000, category: 'Team + Series A', unlocked: false },
  { date: '2026-07', amount: 15_000_000, category: 'Community', unlocked: false },
  { date: '2027-01', amount: 25_000_000, category: 'Final unlock', unlocked: false },
];

const totalSupply = 1_000_000_000;

export default function TokenUnlockCalendar() {
  const totalUnlocked = UNLOCK_SCHEDULE.filter(e => e.unlocked).reduce((s, e) => s + e.amount, 0);
  const totalPending = UNLOCK_SCHEDULE.filter(e => !e.unlocked).reduce((s, e) => s + e.amount, 0);
  const nextUnlock = UNLOCK_SCHEDULE.find(e => !e.unlocked);

  const chartData = UNLOCK_SCHEDULE.map(e => ({
    date: e.date,
    amount: e.amount / 1_000_000,
    unlocked: e.unlocked,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Unlock className="h-4 w-4 text-accent" />
            <span className="text-xs">Unlocked</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-accent">{(totalUnlocked / 1_000_000).toFixed(0)}M</p>
          <p className="text-[10px] text-muted-foreground">{((totalUnlocked / totalSupply) * 100).toFixed(1)}% of supply</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4 text-amber-400" />
            <span className="text-xs">Pending</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-amber-400">{(totalPending / 1_000_000).toFixed(0)}M</p>
          <p className="text-[10px] text-muted-foreground">{((totalPending / totalSupply) * 100).toFixed(1)}% of supply</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-xs">Next Unlock</span>
          </div>
          <p className="mt-1 text-xl font-bold font-mono text-primary">{nextUnlock?.date ?? 'None'}</p>
          <p className="text-[10px] text-muted-foreground">{nextUnlock ? `${(nextUnlock.amount / 1_000_000).toFixed(0)}M — ${nextUnlock.category}` : 'All tokens unlocked'}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 font-bold text-foreground">Unlock Schedule</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `${v}M`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}M tokens`, 'Amount']} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.unlocked ? '#10B981' : '#EAB308'} opacity={entry.unlocked ? 0.7 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent/70" /> Unlocked</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Pending</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="mb-4 font-bold text-foreground">Event Timeline</h3>
        <div className="space-y-3">
          {UNLOCK_SCHEDULE.map((event, i) => (
            <motion.div
              key={event.date}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-center gap-4 rounded-lg border p-3 ${event.unlocked ? 'border-accent/20 bg-accent/5' : 'border-border'}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.unlocked ? 'bg-accent/20' : 'bg-amber-400/20'}`}>
                {event.unlocked ? <Unlock className="h-4 w-4 text-accent" /> : <Lock className="h-4 w-4 text-amber-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{event.category}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
              <span className="font-mono text-sm font-bold text-foreground">{(event.amount / 1_000_000).toFixed(0)}M</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
