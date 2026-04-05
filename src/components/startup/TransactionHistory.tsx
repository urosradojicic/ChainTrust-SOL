import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, Clock, ArrowUpRight } from 'lucide-react';
import { PROGRAM_ID } from '@/lib/contracts';
import { explorerTxUrl } from '@/lib/solana-config';
import { formatAddress } from '@/lib/format';

interface TxRecord {
  signature: string;
  slot: number;
  blockTime: number | null;
  err: boolean;
}

export default function TransactionHistory() {
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTxs = async () => {
      setLoading(true);
      try {
        const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 20 });
        setTransactions(
          signatures.map(s => ({
            signature: s.signature,
            slot: s.slot,
            blockTime: s.blockTime,
            err: !!s.err,
          })),
        );
      } catch {
        setTransactions([]);
      }
      setLoading(false);
    };
    fetchTxs();
  }, [connection]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No on-chain transactions found for this program</p>
        <p className="text-xs text-muted-foreground mt-1">Transactions will appear here after program deployment</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Recent Program Transactions</h3>
        <span className="text-xs text-muted-foreground">{transactions.length} tx</span>
      </div>
      <div className="divide-y divide-border/50">
        {transactions.map((tx, i) => (
          <motion.div
            key={tx.signature}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tx.err ? 'bg-destructive/10' : 'bg-accent/10'}`}>
              <ArrowUpRight className={`h-4 w-4 ${tx.err ? 'text-destructive' : 'text-accent'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={explorerTxUrl(tx.signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
              >
                {formatAddress(tx.signature)} <ExternalLink className="h-3 w-3" />
              </a>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Slot #{tx.slot.toLocaleString()}
                {tx.blockTime && ` · ${new Date(tx.blockTime * 1000).toLocaleString()}`}
              </p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tx.err ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'}`}>
              {tx.err ? 'Failed' : 'Success'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
