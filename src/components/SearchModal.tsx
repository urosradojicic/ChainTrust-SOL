import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, TrendingUp, Building2, BarChart3, Shield, Vote } from 'lucide-react';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency } from '@/lib/format';

const PAGES = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/leaderboard', label: 'Leaderboard', icon: TrendingUp },
  { path: '/staking', label: 'Staking', icon: Shield },
  { path: '/governance', label: 'Governance', icon: Vote },
  { path: '/compare', label: 'Compare', icon: Building2 },
];

export default function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: startups } = useStartups();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return { startups: [], pages: PAGES.slice(0, 3) };
    const q = query.toLowerCase();
    return {
      startups: (startups ?? []).filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, 5),
      pages: PAGES.filter(p => p.label.toLowerCase().includes(q)),
    };
  }, [query, startups]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search startups, pages..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
              onKeyDown={e => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Enter' && results.startups.length > 0) go(`/startup/${results.startups[0].id}`);
              }}
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.startups.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Startups</p>
                {results.startups.map(s => (
                  <button
                    key={s.id}
                    onClick={() => go(`/startup/${s.id}`)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.category} · Trust {s.trust_score}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono font-medium text-foreground">{formatCurrency(s.mrr)}</p>
                      <p className="text-[10px] text-muted-foreground">MRR</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.pages.length > 0 && (
              <div className="border-t border-border p-2">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pages</p>
                {results.pages.map(p => (
                  <button
                    key={p.path}
                    onClick={() => go(p.path)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-muted/50"
                  >
                    <p.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {query.trim() && results.startups.length === 0 && results.pages.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No results for "{query}"
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
