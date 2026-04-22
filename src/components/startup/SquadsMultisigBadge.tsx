/**
 * Squads Multisig Badge
 * ─────────────────────
 * Auto-detects whether a startup's treasury is a Squads vault. If so,
 * shows a trust-signal badge: "3-of-5 Squads vault". Deep-links to the
 * Squads app for any investor who wants to inspect the full policy.
 *
 * Silently renders nothing if the address is not a Squads vault — this
 * avoids cluttering pages where the feature is irrelevant.
 */
import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { detectSquadsVault, type SquadsDetection } from '@/lib/squads-detect';

interface Props {
  walletAddress: string | null | undefined;
  /** Compact mode renders as a single chip suitable for headers. */
  compact?: boolean;
}

export default function SquadsMultisigBadge({ walletAddress, compact = false }: Props) {
  const { connection } = useConnection();
  const [detection, setDetection] = useState<SquadsDetection | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!walletAddress) {
      setDetection(null);
      return;
    }
    detectSquadsVault(connection, walletAddress)
      .then((result) => {
        if (!cancelled) setDetection(result);
      })
      .catch(() => {
        if (!cancelled) setDetection(null);
      });
    return () => {
      cancelled = true;
    };
  }, [connection, walletAddress]);

  if (!detection?.isMultisig) return null;

  const thresholdLabel =
    detection.threshold && detection.signers
      ? `${detection.threshold}-of-${detection.signers}`
      : 'Multisig';

  if (compact) {
    return (
      <a
        href={detection.squadsAppUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="View multisig policy on Squads"
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition"
      >
        <ShieldCheck className="h-3 w-3" />
        {thresholdLabel} Squads
      </a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold text-sm text-foreground">
            {thresholdLabel} Squads Vault
          </h4>
          <span className="text-[10px] uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 border border-emerald-500/20 font-bold">
            Institutional
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          This treasury is a policy-gated multisig on Squads Protocol — the
          same infrastructure that secures over $10B on Solana. Withdrawals
          require {detection.threshold ?? '≥ 2'} independent signers.
        </p>
        <a
          href={detection.squadsAppUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
        >
          View policy on Squads <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </motion.div>
  );
}
