import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Globe, Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StepProps {
  playing: boolean;
  onComplete: () => void;
}

const checks = [
  { label: 'Stripe MRR cross-reference', detail: '$142,000 ↔ $142,000' },
  { label: 'Analytics user count validation', detail: '12,847 ↔ 12,847' },
  { label: 'Growth rate calculation audit', detail: '+23% confirmed' },
  { label: 'Burn rate / runway consistency', detail: '$89K/mo → 18mo ✓' },
];

export default function StepVerify({ playing, onComplete }: StepProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!playing) {
      setPhase(0);
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => {
        setPhase(4);
        onComplete();
      }, 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [playing]);

  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardContent className="p-5">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" style={{ color: 'hsl(36, 78%, 41%)' }} /> Pyth Oracle Network
          </h4>
          <div className="space-y-3">
            {checks.map((check, i) => {
              const status = !playing ? 'waiting' : phase > i ? 'done' : phase === i ? 'running' : 'waiting';
              return (
                <motion.div
                  key={i}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  animate={{
                    borderColor:
                      status === 'done'
                        ? 'hsl(160, 70%, 37%)'
                        : status === 'running'
                          ? 'hsl(36, 78%, 51%)'
                          : 'hsl(var(--border))',
                    backgroundColor: status === 'done' ? 'hsla(160, 70%, 37%, 0.05)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {status === 'done' && <CheckCircle2 className="h-4 w-4 text-accent" />}
                    {status === 'running' && (
                      <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'hsl(36, 78%, 41%)' }} />
                    )}
                    {status === 'waiting' && <Clock className="h-4 w-4 text-muted-foreground" />}
                    <span className={status === 'done' ? 'font-medium' : 'text-muted-foreground'}>
                      {check.label}
                    </span>
                  </div>
                  {status === 'done' && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs text-accent">
                      {check.detail}
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {playing && phase >= 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-accent/40 bg-accent/5 p-4"
        >
          <div className="flex items-center gap-2 text-accent font-semibold">
            <Shield className="h-5 w-5" />
            Oracle Consensus Reached — All Metrics Verified ✓
          </div>
          <p className="text-xs text-muted-foreground mt-1">3 of 3 oracle nodes confirmed. Trust score: 94/100</p>
        </motion.div>
      )}
    </div>
  );
}
