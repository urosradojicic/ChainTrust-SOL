import { motion } from 'framer-motion';
import { Leaf, Zap, Coins, Vote } from 'lucide-react';

export interface SustainabilityData {
  overall: number;
  energyEfficiency: { score: number; chain: string; energyPerTx: string };
  carbonOffset: { score: number; purchased: boolean; tons: number };
  tokenomicsHealth: { score: number; concentration: string; inflation: string; vesting: string };
  governancePledges: { score: number; pledgesCount: number; pledges: string[] };
}

function getScoreColor(score: number): string {
  if (score <= 33) return '#EF4444';
  if (score <= 66) return '#EAB308';
  return '#10B981';
}

function getGaugeGradientId(id: string) {
  return `sustainability-gauge-${id}`;
}

function CircularGauge({ score, size = 160, id = 'main' }: { score: number; size?: number; id?: string }) {
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const gradId = getGaugeGradientId(id);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="hsl(var(--border))" strokeWidth={8} opacity={0.3}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Leaf className="h-5 w-5 mb-1" style={{ color: '#10B981' }} />
        <span className="text-3xl font-bold font-mono" style={{ color: getScoreColor(score) }}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function SubScoreBar({
  label, score, maxScore, icon: Icon, detail, delay,
}: {
  label: string; score: number; maxScore: number; icon: React.ElementType; detail: string; delay: number;
}) {
  const pct = (score / maxScore) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: '#10B981' }} />
          <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{detail}</span>
          <span className="font-mono font-bold text-sm" style={{ color: getScoreColor((score / maxScore) * 100) }}>
            {score}/{maxScore}
          </span>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getScoreColor(pct) }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: delay + 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

export default function SustainabilityScore({ data }: { data: SustainabilityData }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Leaf className="h-5 w-5" style={{ color: '#10B981' }} />
        <h3 className="text-lg font-bold">Sustainability Score</h3>
      </div>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Gauge */}
        <div className="flex-shrink-0">
          <CircularGauge score={data.overall} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {data.overall >= 75 ? 'Excellent' : data.overall >= 50 ? 'Good' : data.overall >= 25 ? 'Needs Improvement' : 'Poor'}
          </p>
        </div>

        {/* Sub-scores */}
        <div className="flex-1 w-full space-y-4">
          <SubScoreBar
            label="Energy Efficiency"
            score={data.energyEfficiency.score}
            maxScore={25}
            icon={Zap}
            detail={`${data.energyEfficiency.chain} · ${data.energyEfficiency.energyPerTx}`}
            delay={0.1}
          />
          <SubScoreBar
            label="Carbon Offset"
            score={data.carbonOffset.score}
            maxScore={25}
            icon={Leaf}
            detail={`${data.carbonOffset.tons} tons offset`}
            delay={0.2}
          />
          <SubScoreBar
            label="Tokenomics Health"
            score={data.tokenomicsHealth.score}
            maxScore={25}
            icon={Coins}
            detail={`${data.tokenomicsHealth.concentration} conc.`}
            delay={0.3}
          />
          <SubScoreBar
            label="Governance & Pledges"
            score={data.governancePledges.score}
            maxScore={25}
            icon={Vote}
            detail={`${data.governancePledges.pledgesCount} pledges`}
            delay={0.4}
          />
        </div>
      </div>

      {/* Pledges list */}
      {data.governancePledges.pledges.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Active Pledges</h4>
          <div className="flex flex-wrap gap-2">
            {data.governancePledges.pledges.map((pledge) => (
              <span
                key={pledge}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border"
                style={{ borderColor: '#10B98140', backgroundColor: '#10B98110', color: '#10B981' }}
              >
                <Leaf className="h-3 w-3" />
                {pledge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
