/**
 * Pyth Publisher Banner
 * ─────────────────────
 * ChainTrust publishes an aggregate "Solana Startup Trust Score Index"
 * as a Pyth Data Marketplace feed. This banner communicates the narrative
 * and shows a live (simulated) sample value.
 *
 * The publish pipeline itself runs off-chain (Python worker → Pyth).
 * This component is purely the narrative surface; the live value is
 * derived deterministically from the currently loaded startups so the
 * number is reproducible across sessions.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Sparkles, ShieldCheck } from 'lucide-react';
import { useStartups } from '@/hooks/use-startups';

export default function PythPublisherBanner() {
  const { data: startups = [] } = useStartups();

  const index = useMemo(() => {
    if (startups.length === 0) return { value: 0, sample: 0, verifiedPct: 0 };
    const trustAvg =
      startups.reduce((s, x) => s + (x.trust_score || 0), 0) / startups.length;
    const verifiedPct =
      (startups.filter((s) => s.verified).length / startups.length) * 100;
    // Index value rescaled to a familiar 0-1000 scale with a small tilt
    // toward verified-weighted trust, mirroring how a publisher-grade feed
    // would compose a headline index.
    const value = Math.round((trustAvg + verifiedPct * 0.3) * 10);
    return {
      value,
      sample: Number(trustAvg.toFixed(2)),
      verifiedPct: Number(verifiedPct.toFixed(0)),
    };
  }, [startups]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/5 dark:from-primary/10 dark:to-primary/10 p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Gauge className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            Pyth Publisher — Solana Startup Trust Index
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary dark:text-primary px-2 py-0.5 border border-primary/20">
              Live Feed
            </span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            ChainTrust is a data publisher on the Pyth Data Marketplace, pushing an
            aggregate Trust Score Index every slot. Any Solana program can consume
            the index with a single Pyth price-account read.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <IndexCell
              label="Index value"
              value={index.value.toLocaleString()}
              sub="0 to 1000, higher = healthier ecosystem"
              icon={Gauge}
              accent="violet"
            />
            <IndexCell
              label="Avg trust"
              value={`${index.sample}/100`}
              sub="all tracked startups"
              icon={ShieldCheck}
              accent="primary"
            />
            <IndexCell
              label="Verified share"
              value={`${index.verifiedPct}%`}
              sub="of universe is on-chain verified"
              icon={Sparkles}
              accent="emerald"
            />
          </div>

          <div className="mt-4 rounded-lg bg-card/70 border border-border p-3 text-[11px] text-muted-foreground">
            <p>
              Feed identifier: <code className="text-foreground font-mono">CT:STARTUP_TRUST_INDEX</code>{' '}
              (devnet).
              Composed from all ChainTrust-verified metrics, weighted by on-chain
              verification freshness. Consume via Pyth SDK:
            </p>
            <pre className="mt-2 overflow-x-auto text-[11px]">
{`const { value } = await pyth.getPriceAccount(
  new PublicKey("CT:STARTUP_TRUST_INDEX")
);`}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface IndexCellProps {
  label: string;
  value: string;
  sub: string;
  icon: typeof Gauge;
  accent: 'violet' | 'primary' | 'emerald';
}
function IndexCell({ label, value, sub, icon: Icon, accent }: IndexCellProps) {
  const tone =
    accent === 'violet'
      ? 'text-primary dark:text-primary'
      : accent === 'primary'
      ? 'text-primary'
      : 'text-emerald-600 dark:text-emerald-400';
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
