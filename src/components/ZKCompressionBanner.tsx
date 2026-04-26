/**
 * ZK Compression Cost Banner
 * ──────────────────────────
 * Interactive illustration of the economics change when verification
 * proofs live in ZK-compressed state. Lets the user slide through
 * verification volume and see the cost delta live.
 *
 * No runtime dependency on Light Protocol — this is a pure narrative
 * component that's wired to real math via `@/lib/zk-compression`.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Sparkles, TrendingDown } from 'lucide-react';
import { compareCosts } from '@/lib/zk-compression';

const PRESETS = [1_000, 10_000, 100_000, 1_000_000];

export default function ZKCompressionBanner() {
  const [n, setN] = useState(1_000_000);
  const cmp = useMemo(() => compareCosts(n), [n]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Minimize2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            ZK Compression economics
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5 border border-primary/20">
              Light Protocol
            </span>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            ChainTrust proof hashes live in ZK-compressed state — {cmp.multiplier.toLocaleString()}× cheaper than
            regular account rent. Pick a volume to see the delta.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setN(p)}
                className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                  n === p
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-foreground hover:bg-muted/40'
                }`}
              >
                {cmp.multiplier && n === p ? p.toLocaleString() : p.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4">
            <CostCell
              title="Regular PDA"
              value={`$${cmp.regularCostUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              sub="rent-based verification"
              tone="muted"
            />
            <CostCell
              title="ZK-compressed"
              value={`$${cmp.compressedCostUsd.toFixed(4)}`}
              sub="calldata-only state"
              tone="primary"
              icon={TrendingDown}
            />
            <CostCell
              title="Savings"
              value={`$${cmp.savingsUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              sub={`${cmp.multiplier.toLocaleString()}× cheaper`}
              tone="emerald"
              icon={Sparkles}
            />
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            Economics match Light Protocol 0.23 (April 2026). A 1M-verification airdrop
            costs ~$260k on regular accounts and ~$50 compressed — the delta is what
            enables ChainTrust to verify every startup on Solana, not just the big ones.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface CostCellProps {
  title: string;
  value: string;
  sub: string;
  tone: 'muted' | 'primary' | 'emerald';
  icon?: typeof Sparkles;
}
function CostCell({ title, value, sub, tone, icon: Icon }: CostCellProps) {
  const toneCls =
    tone === 'primary'
      ? 'text-primary'
      : tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-foreground';
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />} {title}
      </p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${toneCls}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
