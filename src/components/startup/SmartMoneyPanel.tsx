/**
 * Smart Money Panel
 * ─────────────────
 * Nansen-style panel: shows which labeled VC / exchange / foundation wallets
 * have interacted with the startup's treasury recently.
 *
 * Uses Helius enhanced transactions when configured; otherwise quietly
 * falls back to a hint that Helius integration is optional.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Building2,
  Coins,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { SMART_WALLETS, lookupSmartWallet, type SmartWallet } from '@/lib/smart-wallets';
import { getRecentCounterparties, isHeliusConfigured } from '@/lib/helius';

interface SmartMoneyPanelProps {
  walletAddress: string | null | undefined;
  startupName: string;
}

const TYPE_ICON: Record<SmartWallet['type'], typeof Building2> = {
  vc: Sparkles,
  fund: Building2,
  exchange: Coins,
  dao: ShieldCheck,
  foundation: ShieldCheck,
  'market-maker': Activity,
  angel: Users,
};

const TYPE_STYLE: Record<SmartWallet['type'], string> = {
  vc: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  fund: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  exchange: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  dao: 'bg-primary/10 text-primary dark:text-primary border-primary/20',
  foundation: 'bg-primary/10 text-primary dark:text-primary border-primary/20',
  'market-maker': 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  angel: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
};

export default function SmartMoneyPanel({ walletAddress, startupName }: SmartMoneyPanelProps) {
  const [touched, setTouched] = useState<SmartWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!walletAddress) {
      setTouched([]);
      setChecked(true);
      return;
    }
    if (!isHeliusConfigured()) {
      // No Helius — stay quiet; UI surfaces helpful CTA below.
      setChecked(true);
      return;
    }
    setLoading(true);
    getRecentCounterparties(walletAddress, 50)
      .then((addrs) => {
        if (cancelled) return;
        const hits: SmartWallet[] = [];
        for (const a of addrs) {
          const w = lookupSmartWallet(a);
          if (w) hits.push(w);
        }
        setTouched(hits);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const stats = useMemo(() => {
    const byType = new Map<SmartWallet['type'], number>();
    for (const w of touched) byType.set(w.type, (byType.get(w.type) ?? 0) + 1);
    return Array.from(byType.entries());
  }, [touched]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2 text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Smart Money Activity
        </h3>
        <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground uppercase tracking-wider">
          {SMART_WALLETS.length} labels tracked
        </span>
      </div>

      {!walletAddress && (
        <EmptyCard text={`${startupName} has no linked on-chain wallet yet.`} />
      )}

      {walletAddress && !isHeliusConfigured() && (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">Smart Money detection is optional.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Set{' '}
            <code className="text-[11px] bg-muted px-1 py-0.5 rounded">VITE_HELIUS_API_KEY</code>{' '}
            to enable real-time cross-referencing against the registry of {SMART_WALLETS.length} labeled
            wallets. Works with the free Helius tier.
          </p>
        </div>
      )}

      {walletAddress && isHeliusConfigured() && (
        <>
          {loading && (
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-muted/40 animate-pulse" />
              <div className="h-12 rounded-lg bg-muted/40 animate-pulse" />
            </div>
          )}

          {!loading && checked && touched.length === 0 && (
            <EmptyCard text="No labeled wallets detected in the last 50 transactions." />
          )}

          {!loading && touched.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {stats.map(([type, count]) => (
                  <span
                    key={type}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${TYPE_STYLE[type]}`}
                  >
                    {count}× {type.toUpperCase()}
                  </span>
                ))}
              </div>
              <ul className="space-y-2">
                {touched.map((w) => {
                  const Icon = TYPE_ICON[w.type];
                  return (
                    <li
                      key={w.address}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {w.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {w.blurb ?? w.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      {w.url && (
                        <a
                          href={w.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${w.label} external link`}
                          className="text-primary hover:text-primary/80 transition shrink-0"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
