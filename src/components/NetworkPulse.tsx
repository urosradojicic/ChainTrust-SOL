import { useState, useEffect, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Activity, Zap, Server, Clock, Wifi } from 'lucide-react';
import { SOLANA_NETWORK } from '@/lib/solana-config';

interface SlotData {
  slot: number;
  timestamp: number;
}

export default function NetworkPulse() {
  const { connection } = useConnection();
  const [currentSlot, setCurrentSlot] = useState<number>(0);
  const [tps, setTps] = useState<number>(0);
  const [blockTime, setBlockTime] = useState<number>(0);
  const [slotHistory, setSlotHistory] = useState<SlotData[]>([]);
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const prevSlotRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [slot, perfSamples] = await Promise.all([
          connection.getSlot(),
          connection.getRecentPerformanceSamples(5).catch(() => []),
        ]);

        if (!mounted) return;

        setCurrentSlot(slot);

        if (perfSamples.length > 0) {
          const avgTps = perfSamples.reduce((s, p) => s + p.numTransactions / p.samplePeriodSecs, 0) / perfSamples.length;
          setTps(Math.round(avgTps));

          const avgSlotTime = perfSamples.reduce((s, p) => s + (p.samplePeriodSecs / p.numSlots) * 1000, 0) / perfSamples.length;
          setBlockTime(Math.round(avgSlotTime));
        }

        const now = Date.now();
        setSlotHistory(prev => {
          const next = [...prev, { slot, timestamp: now }].slice(-30);
          return next;
        });

        if (prevSlotRef.current > 0 && slot - prevSlotRef.current > 10) {
          setHealth('degraded');
        } else {
          setHealth('healthy');
        }
        prevSlotRef.current = slot;
      } catch {
        if (mounted) setHealth('offline');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => { mounted = false; clearInterval(interval); };
  }, [connection]);

  const healthColors = {
    healthy: 'text-accent',
    degraded: 'text-amber-400',
    offline: 'text-destructive',
  };

  // Mini sparkline of slot progression
  const sparklineData = slotHistory.length >= 2
    ? slotHistory.map((d, i) => {
        if (i === 0) return 0;
        return d.slot - slotHistory[i - 1].slot;
      }).slice(1)
    : [];

  const maxDelta = Math.max(...sparklineData, 1);

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Solana Network Pulse
        </h3>
        <div className="flex items-center gap-1.5">
          <span className={`relative flex h-2 w-2 ${health === 'healthy' ? '' : 'animate-none'}`}>
            {health === 'healthy' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${health === 'healthy' ? 'bg-emerald-500' : health === 'degraded' ? 'bg-amber-400' : 'bg-destructive'}`} />
          </span>
          <span className={`text-xs font-medium capitalize ${healthColors[health]}`}>{health}</span>
          <span className="text-[10px] text-muted-foreground ml-1">{SOLANA_NETWORK}</span>
        </div>
      </div>

      {/* Stats grid — 2×2 layout: clean rows that never overflow even in narrow sidebars */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="rounded-lg bg-muted/50 p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Server className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider">Slot</span>
          </div>
          <motion.p
            key={currentSlot}
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-1 text-sm font-bold font-mono tabular-nums text-foreground truncate"
            title={currentSlot > 0 ? `#${currentSlot.toLocaleString()}` : undefined}
          >
            {currentSlot > 0 ? `#${formatSlot(currentSlot)}` : '—'}
          </motion.p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider">TPS</span>
          </div>
          <p className={`mt-1 text-sm font-bold font-mono tabular-nums truncate ${tps > 1000 ? 'text-accent' : tps > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
            {tps > 0 ? tps.toLocaleString() : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider">Block</span>
          </div>
          <p className="mt-1 text-sm font-bold font-mono tabular-nums text-foreground truncate">
            {blockTime > 0 ? `${blockTime}ms` : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider">Energy</span>
          </div>
          <p className="mt-1 text-sm font-bold font-mono tabular-nums text-accent truncate">~0.001 kWh</p>
          <p className="text-[9px] text-muted-foreground truncate">est. per tx · PoS</p>
        </div>
      </div>

      {/* Live slot sparkline */}
      {sparklineData.length > 2 && (
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Slot Progression (live)</span>
            <span className="text-[10px] font-mono text-muted-foreground">{sparklineData.length} samples</span>
          </div>
          <div className="flex items-end gap-[2px] h-12">
            {sparklineData.map((delta, i) => {
              const height = (delta / maxDelta) * 100;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  className={`flex-1 rounded-sm ${
                    delta > maxDelta * 0.8 ? 'bg-accent' : delta > maxDelta * 0.4 ? 'bg-primary' : 'bg-primary/50'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact slot formatter — shortens 458,226,105 → "458.2M" so the value
 * fits in a narrow KPI tile. Numbers below 1M show full digits with thin
 * grouping commas to stay scannable.
 */
function formatSlot(slot: number): string {
  if (slot >= 1_000_000_000) return `${(slot / 1_000_000_000).toFixed(2)}B`;
  if (slot >= 1_000_000) return `${(slot / 1_000_000).toFixed(1)}M`;
  return slot.toLocaleString();
}
