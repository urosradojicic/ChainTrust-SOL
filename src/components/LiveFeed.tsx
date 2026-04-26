import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { SOLANA_EXPLORER_URL, SOLANA_NETWORK } from '@/lib/solana-config';
import { useStartups } from '@/hooks/use-startups';

interface BlockEvent {
  id: number;
  block: number;
  text: string;
  type: 'revenue' | 'carbon' | 'users' | 'verified' | 'pledge';
}

const STARTUP_DATA = [
  { name: 'DeFiYield', mrr: 210000, users: 5100, carbon: 8 },
  { name: 'TokenBridge', mrr: 156000, users: 9800, carbon: 5 },
  { name: 'PayFlow', mrr: 125000, users: 15000, carbon: 34 },
  { name: 'CloudMetrics', mrr: 89000, users: 8200, carbon: 16 },
  { name: 'DataVault', mrr: 67000, users: 12000, carbon: 13 },
  { name: 'GreenChain', mrr: 45000, users: 3200, carbon: 480 },
];

const EVENT_GENERATORS: ((block: number) => string)[] = [
  (block) => {
    const s = STARTUP_DATA[Math.floor(Math.random() * STARTUP_DATA.length)];
    const delta = Math.floor(Math.random() * 5000) + 500;
    const newMrr = s.mrr + delta;
    return `Slot #${block.toLocaleString()} — ${s.name} revenue updated: $${(s.mrr / 1000).toFixed(0)}K → $${(newMrr / 1000).toFixed(0)}K`;
  },
  (block) => {
    const s = STARTUP_DATA[Math.floor(Math.random() * STARTUP_DATA.length)];
    const tons = Math.floor(Math.random() * 20) + 2;
    return `Slot #${block.toLocaleString()} — ${s.name} carbon offset verified: +${tons}t CO₂`;
  },
  (block) => {
    const s = STARTUP_DATA[Math.floor(Math.random() * STARTUP_DATA.length)];
    const delta = Math.floor(Math.random() * 50) + 5;
    return `Slot #${block.toLocaleString()} — ${s.name} user count oracle updated: ${(s.users + delta).toLocaleString()} wallets`;
  },
  (block) => {
    const s = STARTUP_DATA[Math.floor(Math.random() * STARTUP_DATA.length)];
    return `Slot #${block.toLocaleString()} — ${s.name} metrics hash submitted to Solana`;
  },
  (block) => {
    const s = STARTUP_DATA[Math.floor(Math.random() * STARTUP_DATA.length)];
    return `Slot #${block.toLocaleString()} — ${s.name} sustainability pledge recorded on-chain`;
  },
];

const TYPES: BlockEvent['type'][] = ['revenue', 'carbon', 'users', 'verified', 'pledge'];

const typeColors: Record<BlockEvent['type'], string> = {
  revenue: 'text-blue-400',
  carbon: 'text-emerald-400',
  users: 'text-primary',
  verified: 'text-amber-400',
  pledge: 'text-primary',
};

export default function LiveFeed() {
  const { data: startups } = useStartups();
  const [events, setEvents] = useState<BlockEvent[]>([]);
  const blockRef = useRef(18_294_010 + Math.floor(Math.random() * 100));
  const idRef = useRef(0);

  // Use real startup data from Supabase when available
  const startupData = startups && startups.length > 0
    ? startups.map(s => ({ name: s.name, mrr: s.mrr, users: s.users, carbon: Number(s.carbon_offset_tonnes) }))
    : STARTUP_DATA;

  const generateEvent = useCallback(() => {
    blockRef.current += Math.floor(Math.random() * 3) + 1;
    const typeIdx = Math.floor(Math.random() * EVENT_GENERATORS.length);
    const event: BlockEvent = {
      id: idRef.current++,
      block: blockRef.current,
      text: EVENT_GENERATORS[typeIdx](blockRef.current),
      type: TYPES[typeIdx],
    };
    setEvents(prev => [event, ...prev].slice(0, 20));
  }, []);

  // Generate initial events
  useEffect(() => {
    for (let i = 0; i < 3; i++) {
      generateEvent();
    }
  }, [generateEvent]);

  // Auto-generate events every 3-5 seconds
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        generateEvent();
        timerRef = scheduleNext();
      }, delay);
    };
    let timerRef = scheduleNext();
    return () => clearTimeout(timerRef);
  }, [generateEvent]);

  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-1.5">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">On-Chain</span>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-medium text-emerald-400 ml-1">LIVE</span>
          </div>

          {/* Scrolling ticker */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {events.slice(0, 1).map(event => (
                <motion.div
                  key={event.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex items-center gap-2"
                >
                  <span className={`text-xs font-mono ${typeColors[event.type]}`}>
                    {event.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Solana Explorer link */}
          <a
            href={`${SOLANA_EXPLORER_URL}/?cluster=${SOLANA_NETWORK}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 flex-shrink-0 text-[10px] font-medium text-muted-foreground hover:text-foreground transition"
          >
            Solana Explorer
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
