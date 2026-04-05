import { motion } from 'framer-motion';
import { Award, Lock, Shield, ExternalLink } from 'lucide-react';
import { useBadge } from '@/hooks/use-blockchain';
import { explorerAddressUrl } from '@/lib/solana-config';
import { formatAddress, formatTimestamp } from '@/lib/format';

interface SoulboundBadgeProps {
  startupId: number;
  startupName: string;
}

export default function SoulboundBadge({ startupId, startupName }: SoulboundBadgeProps) {
  const { data: badge, isLoading } = useBadge(startupId);

  if (isLoading) return null;

  if (!badge) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No soulbound badge minted yet</p>
        <p className="text-xs text-muted-foreground mt-1">Badges are issued after oracle verification</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border-2 border-purple-400/30 bg-gradient-to-br from-purple-950/30 via-card to-primary/5 p-6"
    >
      <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-primary">
          <Award className="h-7 w-7 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">Soulbound Badge</h3>
            <div className="flex items-center gap-1 rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
              <Lock className="h-2.5 w-2.5" /> Non-Transferable
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-0.5">{startupName} — Verified Startup</p>

          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Trust Score</span>
              <p className="text-xl font-bold font-mono text-accent">{badge.trustScore}</p>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Owner</span>
              <a
                href={explorerAddressUrl(badge.owner)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-mono text-primary hover:underline"
              >
                {formatAddress(badge.owner)} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified At</span>
              <p className="text-sm font-mono text-foreground">{formatTimestamp(badge.verifiedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
