/**
 * Command Palette (Cmd+K)
 * ───────────────────────
 * Universal search and navigation. Users never get lost.
 * One shortcut to find any page, startup, or action.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Command, Hash, Zap, Star, Clock, Keyboard, Terminal } from 'lucide-react';
import { useStartups } from '@/hooks/use-startups';
import { searchCommands, getRecentPages, recordPageVisit, type Command as CommandType } from '@/lib/command-palette';
import { parseSlashCommand, addToWatchlist, type SlashCommandMatch } from '@/lib/slash-commands';
import { toast } from '@/hooks/use-toast';

const CATEGORY_ICONS: Record<string, typeof Search> = {
  page: Hash,
  startup: Star,
  action: Zap,
  shortcut: Keyboard,
  recent: Clock,
};

const CATEGORY_LABELS: Record<string, string> = {
  recent: 'Recent',
  page: 'Pages',
  startup: 'Startups',
  action: 'Actions',
  shortcut: 'Keyboard Shortcuts',
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: startups = [] } = useStartups();

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const recentPages = getRecentPages();
  const results = searchCommands(query, startups, recentPages);
  const slashMatch: SlashCommandMatch | null = query.trim().startsWith('/')
    ? parseSlashCommand(query, startups)
    : null;

  // Group results by category
  const grouped = new Map<string, CommandType[]>();
  for (const cmd of results.commands) {
    const list = grouped.get(cmd.category) ?? [];
    list.push(cmd);
    grouped.set(cmd.category, list);
  }

  const flatResults = results.commands;

  const runSlashCommand = useCallback((match: SlashCommandMatch) => {
    if (!match.valid) {
      if (match.hint) toast({ title: 'Incomplete', description: match.hint });
      return;
    }
    setOpen(false);
    if (match.kind === 'watch') {
      const id = match.target.replace(/^watch:/, '');
      addToWatchlist(id);
      toast({ title: 'Added to watchlist', description: match.label });
      return;
    }
    if (match.kind === 'export') {
      // Dispatch a custom event that pages can listen to for current-view export
      window.dispatchEvent(new CustomEvent('chaintrust:export-request'));
      toast({ title: 'Export triggered' });
      return;
    }
    if (match.kind === 'help') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
      return;
    }
    if (match.target.startsWith('/')) {
      recordPageVisit(match.target);
      navigate(match.target);
    }
  }, [navigate]);

  const handleSelect = useCallback((command: CommandType) => {
    setOpen(false);
    if (command.action.startsWith('/')) {
      recordPageVisit(command.action);
      navigate(command.action);
    } else if (command.action === 'focus-nl-query') {
      navigate('/dashboard');
      setTimeout(() => {
        const input = document.querySelector('[data-nl-query] input') as HTMLInputElement;
        input?.focus();
      }, 300);
    }
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Slash-command takes priority: Enter runs the parsed command
    if (slashMatch && e.key === 'Enter') {
      e.preventDefault();
      runSlashCommand(slashMatch);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      handleSelect(flatResults[selectedIndex]);
    }
  }, [flatResults, selectedIndex, handleSelect, slashMatch, runSlashCommand]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search, or type / for slash commands..."
              className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-mono">
              ESC
            </kbd>
          </div>

          {/* Slash command preview */}
          {slashMatch && (
            <button
              onClick={() => runSlashCommand(slashMatch)}
              disabled={!slashMatch.valid}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-border text-left transition ${
                slashMatch.valid ? 'bg-primary/5 hover:bg-primary/10' : 'bg-amber-500/5'
              }`}
            >
              <Terminal className={`h-4 w-4 shrink-0 ${slashMatch.valid ? 'text-primary' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${slashMatch.valid ? 'text-primary' : 'text-amber-600 dark:text-amber-400'}`}>
                  {slashMatch.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{slashMatch.description}</p>
              </div>
              {slashMatch.valid && (
                <kbd className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono shrink-0">
                  ↵
                </kbd>
              )}
            </button>
          )}

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {flatResults.length === 0 && !slashMatch ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for "{query}"
              </div>
            ) : (
              Array.from(grouped.entries()).map(([category, commands]) => (
                <div key={category}>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[category] ?? category}
                  </p>
                  {commands.map((cmd) => {
                    const globalIndex = flatResults.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = CATEGORY_ICONS[cmd.category] ?? Hash;

                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'}`}
                      >
                        <span className="text-lg w-6 text-center shrink-0">{cmd.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isSelected ? 'text-primary font-medium' : 'text-foreground'}`}>{cmd.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{cmd.description}</p>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="hidden sm:block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono shrink-0">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-muted font-mono">esc</kbd> Close</span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="h-3 w-3" />K to open anytime
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
