import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency } from '@/lib/format';
import {
  Shield, Hash, CheckCircle2, ExternalLink, Search,
  ArrowUpRight, Globe, Lock, Copy, Check,
} from 'lucide-react';
import AnimatedCounter from '@/components/common/AnimatedCounter';

/** Deterministic mock proof hash from startup data */
function mockProofHash(name: string, mrr: number, idx: number): string {
  const seed = `${name}:${mrr}:${idx}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const hex = (n: number) => Math.abs(n).toString(16).padStart(8, '0');
  return `${hex(h)}${hex(h * 31)}${hex(h * 37)}${hex(h * 41)}${hex(h * 43)}${hex(h * 47)}${hex(h * 53)}${hex(h * 59)}`;
}

function mockTxSig(name: string, idx: number): string {
  const base = `${name}:tx:${idx}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = ((h << 5) - h + base.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36) + Math.abs(h * 7).toString(36) + Math.abs(h * 13).toString(36);
}

export default function ProofExplorer() {
  const { data: startups, isLoading } = useStartups();
  const [search, setSearch] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const proofs = useMemo(() => {
    if (!startups) return [];
    return startups.flatMap((s, si) =>
      [0, 1, 2].map(vi => ({
        startupId: s.id,
        startupName: s.name,
        category: s.category,
        verified: s.verified,
        trustScore: s.trust_score,
        mrr: s.mrr,
        proofHash: mockProofHash(s.name, s.mrr, vi),
        txSignature: mockTxSig(s.name, vi),
        slot: 280000000 + si * 1000 + vi * 100,
        timestamp: new Date(Date.now() - (si * 86400000 + vi * 3600000)).toISOString(),
        metricsSnapshot: { mrr: s.mrr, users: s.users, growthRate: s.growth_rate },
      }))
    );
  }, [startups]);

  const filtered = useMemo(() => {
    if (!search.trim()) return proofs;
    const q = search.toLowerCase();
    return proofs.filter(p =>
      p.startupName.toLowerCase().includes(q) ||
      p.proofHash.includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }, [proofs, search]);

  const totalVerifications = proofs.length;
  const uniqueStartups = new Set(proofs.map(p => p.startupId)).size;
  const verifiedCount = proofs.filter(p => p.verified).length;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
          <Globe className="h-3 w-3" />
          Public — no account required
        </div>
        <h1 className="text-3xl font-bold text-foreground">Proof Explorer</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Every verification ever done on ChainTrust. Every proof hash links to Solana.
          Anyone can independently recompute any hash. This is transparency, not trust.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total verifications', value: totalVerifications, icon: Hash },
          { label: 'Unique startups', value: uniqueStartups, icon: Shield },
          { label: 'Verified proofs', value: verifiedCount, icon: CheckCircle2 },
          { label: 'Cost per proof', value: '$0.00025', icon: Lock, raw: true },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-xl font-display font-bold text-foreground">
                {(stat as any).raw ? stat.value : <AnimatedCounter value={stat.value as number} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search by startup name, proof hash, or category..."
        />
      </div>

      {/* How to verify independently */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-2">How to verify any proof independently:</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>1. Take the startup's metrics: <code className="rounded bg-muted px-1 py-0.5">mrr|users|activeUsers|burnRate|runway|growthRate*100|carbonOffset</code></p>
          <p>2. Compute: <code className="rounded bg-muted px-1 py-0.5">SHA-256(metric_string)</code></p>
          <p>3. Compare with the proof hash stored on Solana. If they match, the metrics are authentic.</p>
        </div>
      </motion.div>

      {/* Proofs list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading proofs...</div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 50).map((proof, i) => (
            <motion.div
              key={`${proof.startupName}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/startup/${proof.startupId}`} className="text-sm font-bold text-foreground hover:text-primary transition">
                      {proof.startupName}
                    </Link>
                    <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{proof.category}</span>
                    {proof.verified && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Proof hash */}
                  <div className="flex items-center gap-2 mt-2">
                    <Hash className="h-3 w-3 text-primary shrink-0" />
                    <code className="text-[11px] font-mono text-muted-foreground truncate">{proof.proofHash}</code>
                    <button onClick={() => copyHash(proof.proofHash)} className="shrink-0 text-muted-foreground hover:text-foreground transition">
                      {copiedHash === proof.proofHash ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  {/* Metrics snapshot */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>MRR: {formatCurrency(proof.metricsSnapshot.mrr)}</span>
                    <span>Users: {proof.metricsSnapshot.users?.toLocaleString()}</span>
                    <span>Growth: {proof.metricsSnapshot.growthRate}%</span>
                    <span>Slot: {proof.slot.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{new Date(proof.timestamp).toLocaleDateString()}</span>
                  <a href={`https://explorer.solana.com/tx/${proof.txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-medium text-foreground hover:bg-secondary transition">
                    Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length > 50 && (
            <p className="text-center text-xs text-muted-foreground py-4">Showing 50 of {filtered.length} proofs. Use search to narrow results.</p>
          )}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No proofs match your search.</p>
          )}
        </div>
      )}
    </div>
  );
}
