import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/format';
import { useFundingRounds } from '@/hooks/use-startups';
import type { DbFundingRound } from '@/types/database';

interface FundingRound {
  round: string;
  amount: number;
  date: string;
  valuation: number;
  investors: string[];
}

const MOCK_ROUNDS: FundingRound[] = [
  { round: 'Pre-Seed', amount: 500000, date: '2023-06', valuation: 3000000, investors: ['Angel Collective', 'Founder Fund'] },
  { round: 'Seed', amount: 2500000, date: '2024-01', valuation: 12000000, investors: ['a16z Scout', 'Polychain Capital', 'Solana Ventures'] },
  { round: 'Series A', amount: 8000000, date: '2025-03', valuation: 45000000, investors: ['Paradigm', 'Dragonfly Capital', 'Coinbase Ventures'] },
];

function mapDbRounds(dbRounds: DbFundingRound[]): FundingRound[] {
  return dbRounds.map(r => ({
    round: r.round_name,
    amount: Number(r.amount),
    date: r.round_date,
    valuation: Number(r.valuation),
    investors: r.investors ?? [],
  }));
}

export default function FundingRounds({ startupId }: { startupId?: string }) {
  const { data: dbRounds } = useFundingRounds(startupId);
  const rounds = dbRounds && dbRounds.length > 0 ? mapDbRounds(dbRounds) : MOCK_ROUNDS;

  const totalRaised = rounds.reduce((s, r) => s + r.amount, 0);
  const latestValuation = rounds[rounds.length - 1]?.valuation ?? 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Total Raised</span>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">{formatCurrency(totalRaised)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Latest Valuation</span>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">{formatCurrency(latestValuation)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <span className="text-xs text-muted-foreground">Rounds Completed</span>
          <p className="mt-1 text-xl font-bold font-mono text-foreground">{rounds.length}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />
        {rounds.map((round, i) => (
          <motion.div
            key={round.round}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <div className="flex-1 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-foreground">{round.round}</h4>
                  <p className="text-xs text-muted-foreground">{round.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold font-mono text-primary">{formatCurrency(round.amount)}</p>
                  <p className="text-xs text-muted-foreground">@ {formatCurrency(round.valuation)} val</p>
                </div>
              </div>
              {round.investors.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {round.investors.map(inv => (
                    <span key={inv} className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-foreground">
                      {inv}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
