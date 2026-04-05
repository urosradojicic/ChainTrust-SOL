import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, Info, TrendingUp, Leaf, Coins, Vote, Award } from 'lucide-react';
import type { DbStartup } from '@/types/database';

interface Factor {
  name: string;
  icon: any;
  weight: number;
  score: number;
  maxScore: number;
  formula: string;
  details: string;
  color: string;
}

function computeFactors(s: DbStartup): Factor[] {
  const energyScore = s.energy_score;
  const carbonScore = s.carbon_score;
  const tokenomicsScore = s.tokenomics_score;
  const governanceScore = s.governance_score;

  // Financial health factor (derived from trust_score and growth)
  const growthFactor = Math.min(25, Math.max(0, Math.round(Number(s.growth_rate) * 1.5)));
  const revenueStability = Math.min(25, Math.round(s.mrr / 10000));
  const financialScore = Math.min(25, Math.round((growthFactor + revenueStability) / 2));

  return [
    {
      name: 'Energy Efficiency',
      icon: Leaf,
      weight: 25,
      score: energyScore,
      maxScore: 25,
      formula: 'PoS = 20pts base, PoW = 8pts. Bonus for low energy/tx.',
      details: `Chain: ${s.blockchain} (${s.chain_type}), Energy: ${s.energy_per_transaction || '0.001 kWh'}/tx`,
      color: '#10B981',
    },
    {
      name: 'Carbon Offset',
      icon: Leaf,
      weight: 25,
      score: carbonScore,
      maxScore: 25,
      formula: 'min(25, carbon_offset_tonnes / 10)',
      details: `${Number(s.carbon_offset_tonnes)} tonnes CO₂ offset purchased`,
      color: '#3B82F6',
    },
    {
      name: 'Tokenomics Health',
      icon: Coins,
      weight: 25,
      score: tokenomicsScore,
      maxScore: 25,
      formula: 'max(0, 25 - whale_concentration / 4)',
      details: `Whale concentration: ${s.whale_concentration}%, Inflation: ${s.inflation_rate}%`,
      color: '#A855F7',
    },
    {
      name: 'Governance & Pledges',
      icon: Vote,
      weight: 25,
      score: governanceScore,
      maxScore: 25,
      formula: 'min(25, active_pledges × 5)',
      details: `Score derived from active sustainability commitments`,
      color: '#F59E0B',
    },
  ];
}

export default function TrustScoreBreakdown({ startup }: { startup: DbStartup }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const factors = computeFactors(startup);
  const totalScore = startup.sustainability_score;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header with total score */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-purple-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-primary/30">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Trust Score Algorithm</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Transparent, verifiable scoring formula</p>
            </div>
          </div>
          <div className="text-right">
            <motion.span
              key={totalScore}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-4xl font-bold font-mono ${totalScore >= 75 ? 'text-accent' : totalScore >= 50 ? 'text-amber-400' : 'text-destructive'}`}
            >
              {totalScore}
            </motion.span>
            <p className="text-xs text-muted-foreground">/100</p>
          </div>
        </div>

        {/* Formula bar */}
        <div className="mt-4 flex items-center gap-1 rounded-lg bg-card/80 p-2 font-mono text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>score = </span>
          {factors.map((f, i) => (
            <span key={f.name}>
              <span style={{ color: f.color }} className="font-medium">{f.name.split(' ')[0].toLowerCase()}</span>
              {i < factors.length - 1 && <span className="mx-1">+</span>}
            </span>
          ))}
          <span className="ml-1">= {factors.map(f => f.score).join(' + ')} = <span className="font-bold text-foreground">{totalScore}</span></span>
        </div>
      </div>

      {/* Factor rows */}
      <div className="divide-y divide-border">
        {factors.map(factor => {
          const Icon = factor.icon;
          const pct = (factor.score / factor.maxScore) * 100;
          const isExpanded = expanded === factor.name;

          return (
            <div key={factor.name}>
              <button
                onClick={() => setExpanded(isExpanded ? null : factor.name)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: factor.color + '15' }}>
                  <Icon className="h-5 w-5" style={{ color: factor.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm" style={{ color: factor.color }}>
                        {factor.score}/{factor.maxScore}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: factor.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-[72px] space-y-2">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Formula</p>
                        <code className="text-xs font-mono text-foreground">{factor.formula}</code>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Current Data</p>
                        <p className="text-xs text-foreground">{factor.details}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
