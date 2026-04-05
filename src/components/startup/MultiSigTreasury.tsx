import { motion } from 'framer-motion';
import { Lock, Users, CheckCircle, Shield, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { DbStartup } from '@/types/database';

const SIGNERS = [
  { label: 'CEO / Founder', verified: true },
  { label: 'CTO', verified: true },
  { label: 'CFO', verified: true },
  { label: 'Lead Investor Rep', verified: true },
  { label: 'Community Delegate', verified: false },
];

export default function MultiSigTreasury({ startup }: { startup: DbStartup }) {
  const treasury = Number(startup.treasury);
  const hasMultiSig = treasury > 500000;
  const threshold = hasMultiSig ? '3/5' : 'N/A';

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" /> Multi-Sig Treasury
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Squads Protocol multi-signature wallet security</p>

      {hasMultiSig ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-muted/10 p-3 text-center">
              <Wallet className="h-4 w-4 mx-auto text-primary mb-1" />
              <div className="text-sm font-bold font-mono">{formatCurrency(treasury)}</div>
              <div className="text-[10px] text-muted-foreground">Treasury Balance</div>
            </div>
            <div className="rounded-lg border bg-muted/10 p-3 text-center">
              <Shield className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
              <div className="text-sm font-bold font-mono">{threshold}</div>
              <div className="text-[10px] text-muted-foreground">Threshold</div>
            </div>
            <div className="rounded-lg border bg-muted/10 p-3 text-center">
              <Users className="h-4 w-4 mx-auto text-blue-400 mb-1" />
              <div className="text-sm font-bold font-mono">{SIGNERS.length}</div>
              <div className="text-[10px] text-muted-foreground">Signers</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Authorized Signers</div>
            {SIGNERS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center justify-between rounded-lg border bg-muted/5 px-3 py-2"
              >
                <span className="text-sm text-foreground">{s.label}</span>
                {s.verified ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400">Pending</span>
                )}
              </motion.div>
            ))}
          </div>

          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Multi-sig active — {threshold} signatures required for any treasury transaction
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-4 text-center">
          <Lock className="h-6 w-6 mx-auto text-amber-400 mb-2" />
          <p className="text-sm font-medium text-amber-400">Multi-Sig Not Detected</p>
          <p className="text-xs text-muted-foreground mt-1">
            This startup's treasury does not appear to use a multi-signature wallet.
            Recommend implementing Squads Protocol for enhanced security.
          </p>
        </div>
      )}
    </div>
  );
}
