import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Hash, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Animated proof hash visualization.
 * Shows live SHA-256 hashing of startup metrics — the visual "aha" moment.
 * Cycles through different startups and shows the hash being computed.
 */
export default function LiveProofHash() {
  const [phase, setPhase] = useState(0); // 0=input, 1=hashing, 2=verified
  const [startupIdx, setStartupIdx] = useState(0);
  const [hashChars, setHashChars] = useState<string[]>([]);

  const startups = useMemo(() => [
    { name: 'PayFlow', mrr: '142,000', users: '12,847', growth: '+23%' },
    { name: 'CloudMetrics', mrr: '89,500', users: '5,234', growth: '+18%' },
    { name: 'DeFiYield', mrr: '312,000', users: '28,100', growth: '+41%' },
  ], []);

  const hashes = useMemo(() => [
    'a7f3e8b92c4d1f6e0a5b3c8d7e2f1a9b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4',
    'b8e4f9c03d5e2a7f1b6c4d9e8f3a2b5c7d0e1f3a5b7c9d1e3f5a7b9c1d3e5f7',
    'c9d5e0a14f6b3c8d2e7f4a3b6c8d1e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4',
  ], []);

  const currentStartup = startups[startupIdx];
  const currentHash = hashes[startupIdx];

  // Cycle: show input (2s) -> hash animation (1.5s) -> verified (2s) -> next startup
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 2000),     // Start hashing
      setTimeout(() => setPhase(2), 3500),      // Show verified
      setTimeout(() => {                        // Reset for next
        setPhase(0);
        setStartupIdx((i) => (i + 1) % startups.length);
      }, 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [startupIdx, startups.length]);

  // Animate hash characters appearing
  useEffect(() => {
    if (phase !== 1) {
      if (phase === 2) setHashChars(currentHash.split(''));
      else setHashChars([]);
      return;
    }

    const chars = currentHash.split('');
    let i = 0;
    const interval = setInterval(() => {
      setHashChars(chars.slice(0, i + 1));
      i++;
      if (i >= chars.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [phase, currentHash]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Proof Hash</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${phase === 2 ? 'bg-green-500' : 'bg-primary'} ${phase === 1 ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] text-muted-foreground font-mono">
            {phase === 0 ? 'Input' : phase === 1 ? 'Hashing...' : 'Verified'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Input metrics */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Startup</span>
            <motion.span
              key={startupIdx}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-foreground"
            >
              {currentStartup.name}
            </motion.span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'MRR', value: `$${currentStartup.mrr}` },
              { label: 'Users', value: currentStartup.users },
              { label: 'Growth', value: currentStartup.growth },
            ].map((m) => (
              <div key={m.label} className="rounded-md bg-muted/50 px-2.5 py-1.5">
                <span className="text-[9px] text-muted-foreground block">{m.label}</span>
                <span className="text-xs font-mono font-semibold text-foreground">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hash arrow */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          <span className="font-mono">SHA-256(mrr|users|growth)</span>
        </div>

        {/* Hash output */}
        <div className={`rounded-md border p-2.5 font-mono text-[10px] leading-relaxed break-all transition-colors ${
          phase === 2
            ? 'border-green-400/40 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
            : 'border-border/40 bg-muted/30 text-muted-foreground'
        }`}>
          {hashChars.length > 0 ? (
            <span>
              {hashChars.map((c, i) => (
                <motion.span
                  key={`${startupIdx}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={i >= hashChars.length - 3 && phase === 1 ? 'text-primary font-bold' : ''}
                >
                  {c}
                </motion.span>
              ))}
              {phase === 1 && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />}
            </span>
          ) : (
            <span className="text-muted-foreground/50">Waiting for input...</span>
          )}
        </div>

        {/* Verified badge */}
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Proof hash verified on Solana</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
