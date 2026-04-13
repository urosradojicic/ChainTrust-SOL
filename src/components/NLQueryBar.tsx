/**
 * Natural Language Query Bar
 * ──────────────────────────
 * A chat-like interface where investors type questions in plain English
 * and get instant, structured results from the startup database.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ArrowRight, X, MessageSquare, Filter, SortDesc, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { DbStartup } from '@/types/database';
import { executeQuery, EXAMPLE_QUERIES, type QueryResult } from '@/lib/nl-query';

// ── Result Display ───────────────────────────────────────────────────

function ResultStartupRow({ startup }: { startup: DbStartup }) {
  return (
    <Link
      to={`/startup/${startup.id}`}
      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition group"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
        startup.verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
      }`}>
        {startup.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition truncate">
            {startup.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {startup.category}
          </span>
          {startup.verified && (
            <span className="text-[10px] text-emerald-500">verified</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs font-mono shrink-0">
        <span className="text-foreground">{formatCurrency(startup.mrr)}</span>
        <span className={Number(startup.growth_rate) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
          {Number(startup.growth_rate) >= 0 ? '+' : ''}{Number(startup.growth_rate)}%
        </span>
        <span className="text-muted-foreground">{startup.trust_score}ts</span>
      </div>
    </Link>
  );
}

function QueryResultDisplay({ result }: { result: QueryResult }) {
  if (result.type === 'error') {
    return <p className="text-sm text-muted-foreground p-3">{result.answer}</p>;
  }

  return (
    <div className="space-y-2">
      {/* Answer */}
      <div className="flex items-start gap-2 p-3">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: result.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">{result.interpretation}</p>
        </div>
      </div>

      {/* Filters applied */}
      {(result.filtersApplied.length > 0 || result.sortApplied) && (
        <div className="flex flex-wrap gap-1.5 px-3">
          {result.filtersApplied.map((f, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
              <Filter className="h-2.5 w-2.5" /> {f}
            </span>
          ))}
          {result.sortApplied && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 flex items-center gap-1">
              <SortDesc className="h-2.5 w-2.5" /> {result.sortApplied}
            </span>
          )}
          {result.limit && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Hash className="h-2.5 w-2.5" /> Limit: {result.limit}
            </span>
          )}
        </div>
      )}

      {/* Aggregate value */}
      {result.type === 'aggregate' && result.aggregateValue !== undefined && (
        <div className="mx-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
          <span className="text-2xl font-bold font-mono text-primary">
            {result.aggregateValue.toLocaleString()}
          </span>
        </div>
      )}

      {/* Startup list */}
      {result.startups.length > 0 && result.type !== 'aggregate' && (
        <div className="border-t border-border">
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border/50">
            {result.startups.slice(0, 20).map(s => (
              <ResultStartupRow key={s.id} startup={s} />
            ))}
          </div>
          {result.startups.length > 20 && (
            <p className="text-[10px] text-muted-foreground text-center py-2">
              +{result.startups.length - 20} more results
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface NLQueryBarProps {
  startups: DbStartup[];
  /** Compact mode for embedding in dashboards */
  compact?: boolean;
}

export default function NLQueryBar({ startups, compact = false }: NLQueryBarProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((q?: string) => {
    const queryText = q ?? query;
    if (!queryText.trim()) return;
    const r = executeQuery(queryText, startups);
    setResult(r);
    setIsOpen(true);
    if (!history.includes(queryText)) {
      setHistory(prev => [queryText, ...prev].slice(0, 10));
    }
  }, [query, startups, history]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') {
      setIsOpen(false);
      setResult(null);
    }
  }, [handleSubmit]);

  const handleExampleClick = useCallback((example: string) => {
    setQuery(example);
    handleSubmit(example);
  }, [handleSubmit]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResult(null);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-nl-query]')) {
        // Don't close, let user interact with results
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <div data-nl-query className="relative">
      {/* Search input */}
      <div className={`flex items-center gap-2 rounded-xl border bg-card ${isOpen ? 'rounded-b-none border-b-0' : ''} transition-all`}>
        <div className="flex items-center gap-2 pl-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          {!compact && <Sparkles className="h-3 w-3 text-primary/50" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (result) setIsOpen(true); }}
          placeholder={compact ? 'Ask anything...' : 'Ask anything about your startups... (e.g., "Top 5 by growth rate")'}
          className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button onClick={handleClear} className="p-1.5 hover:bg-muted/50 rounded-md transition">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={() => handleSubmit()}
          disabled={!query.trim()}
          className="flex items-center gap-1 px-3 py-1.5 mr-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90 transition"
        >
          <Search className="h-3 w-3" />
          {!compact && 'Query'}
        </button>
      </div>

      {/* Results dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 z-50 rounded-b-xl border border-t-0 bg-card shadow-lg max-h-[500px] overflow-y-auto"
          >
            {result ? (
              <QueryResultDisplay result={result} />
            ) : (
              <div className="p-3 space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXAMPLE_QUERIES.slice(0, 6).map((example, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(example)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example queries (shown when not focused and no result) */}
      {!isOpen && !compact && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {EXAMPLE_QUERIES.slice(0, 4).map((example, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(example)}
              className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
