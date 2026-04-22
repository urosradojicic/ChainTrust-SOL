/**
 * Keyboard Help Overlay
 * ─────────────────────
 * Pops up on `?` key press. Bloomberg-style shortcut reference.
 * Helps new users discover the product's keyboard-first surface.
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  label: string;
  group: 'Global' | 'Navigation' | 'Search' | 'Data';
}

const SHORTCUTS: Shortcut[] = [
  // Global
  { keys: ['Cmd', 'K'], label: 'Open command palette', group: 'Global' },
  { keys: ['Ctrl', 'K'], label: 'Open command palette (Windows/Linux)', group: 'Global' },
  { keys: ['?'], label: 'Show this keyboard reference', group: 'Global' },
  { keys: ['Esc'], label: 'Close open overlay / palette', group: 'Global' },

  // Navigation — aligned with Bloomberg `<GO>` idiom
  { keys: ['G', 'H'], label: 'Go to Investor Hub', group: 'Navigation' },
  { keys: ['G', 'D'], label: 'Go to Dashboard', group: 'Navigation' },
  { keys: ['G', 'S'], label: 'Go to Screener', group: 'Navigation' },
  { keys: ['G', 'C'], label: 'Go to Compare view', group: 'Navigation' },
  { keys: ['G', 'P'], label: 'Go to Portfolio', group: 'Navigation' },
  { keys: ['G', 'V'], label: 'Go to Governance', group: 'Navigation' },

  // Search / slash commands
  { keys: ['/', 'go', 'name'], label: 'Jump to a startup by name', group: 'Search' },
  { keys: ['/', 'compare', 'a', 'b'], label: 'Open Compare with two startups pre-filled', group: 'Search' },
  { keys: ['/', 'screen', 'filter'], label: 'Open Screener with a pre-applied filter', group: 'Search' },
  { keys: ['/', 'export'], label: 'Export the current view', group: 'Search' },
  { keys: ['/', 'watch', 'name'], label: 'Add a startup to your watchlist', group: 'Search' },

  // Data
  { keys: ['↑', '↓'], label: 'Navigate results in lists and palettes', group: 'Data' },
  { keys: ['Enter'], label: 'Select the focused item', group: 'Data' },
];

export default function KeyboardHelpOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input
      const target = e.target as HTMLElement;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target && target.isContentEditable) return;
      // Don't trigger if a modifier is held (Cmd+?, Shift+?)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              <h2 id="keyboard-help-title" className="text-lg font-bold text-foreground">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close keyboard shortcuts"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
            {groups.map((group) => (
              <section key={group}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {group}
                </h3>
                <ul className="space-y-1.5">
                  {SHORTCUTS.filter((s) => s.group === group).map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-4 py-1.5 px-2 rounded hover:bg-muted/40 transition"
                    >
                      <span className="text-sm text-foreground">{s.label}</span>
                      <span className="flex items-center gap-1">
                        {s.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="px-1.5 py-0.5 text-[11px] font-mono bg-muted border border-border rounded text-foreground"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="px-6 py-3 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
            Press{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">?</kbd> to
            toggle this reference at any time, or{' '}
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Esc</kbd> to
            close.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
