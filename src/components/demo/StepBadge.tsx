import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock } from 'lucide-react';
import { PROGRAM_ID } from '@/lib/contracts';
import SimulatedTerminal from './SimulatedTerminal';

const MOCK_WALLET = '7Kp2…xQ4f';
const MOCK_STARTUP_ID = '7';
const MOCK_BADGE_ID = '42';

interface StepProps {
  playing: boolean;
  onComplete: () => void;
}

export default function StepBadge({ playing, onComplete }: StepProps) {
  const [minted, setMinted] = useState(false);

  useEffect(() => {
    if (!playing) {
      setMinted(false);
      return;
    }
    const timer = setTimeout(() => {
      setMinted(true);
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [playing]);

  const terminalLines = [
    `❯ chainmetrics::mint_badge(${MOCK_WALLET}, ${MOCK_STARTUP_ID}, trustScore: 94)`,
    `⏳ Minting soulbound badge…`,
    `⏳ Confirming… slot #248,921,755`,
    `✓ Badge minted: PDA #${MOCK_BADGE_ID}`,
    `🛡 Badge is LOCKED (soulbound) — non-transferable`,
    `✓ Program log: BadgeMinted { startup_id: ${MOCK_STARTUP_ID}, owner: ${MOCK_WALLET}, trust_score: 94 }`,
  ];

  return (
    <div className="space-y-5">
      {playing && <SimulatedTerminal lines={terminalLines} speed={100} />}

      <AnimatePresence>
        {minted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mx-auto max-w-sm"
          >
            <div className="relative overflow-hidden rounded-2xl border-2 border-purple-400/50 bg-gradient-to-br from-purple-950/40 via-card to-primary/10 p-6 text-center shadow-2xl shadow-purple-500/10">
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

              <div className="relative">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-primary">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold">Verified Startup</h3>
                <p className="text-sm text-muted-foreground mt-1">PayFlow — Fintech</p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <span className="text-muted-foreground">Trust Score</span>
                    <p className="font-bold text-lg text-accent">94/100</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <span className="text-muted-foreground">Token ID</span>
                    <p className="font-bold text-lg font-mono">#{MOCK_BADGE_ID}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-purple-400">
                  <Lock className="h-3 w-3" />
                  Soulbound — Non-Transferable (Solana PDA)
                </div>

                <div className="mt-3 font-mono text-[10px] text-muted-foreground">
                  {PROGRAM_ID.toBase58()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
