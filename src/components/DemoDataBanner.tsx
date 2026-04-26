/**
 * Demo Data Banner
 * ─────────────────
 * Surfaces a discreet but unmistakable "this is fictional data" notice
 * whenever the app is running in demo mode (i.e. Supabase is unreachable
 * or returns no rows, so the DEMO_STARTUPS fallback is being shown).
 *
 * One-off dismissal persists in localStorage. The banner is *informational*,
 * not modal — investors can keep exploring while the disclaimer stays
 * visible at the page top, and they can dismiss it once they've read it.
 */
import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

const DISMISS_KEY = 'chaintrust_demo_banner_dismissed';

interface Props {
  /** Force-show even if previously dismissed (e.g. on a "what is this?" link click). */
  forceShow?: boolean;
}

export default function DemoDataBanner({ forceShow }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (forceShow) { setShow(true); return; }
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      setShow(dismissed !== 'true');
    } catch {
      setShow(true);
    }
  }, [forceShow]);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* ignore */ }
  };

  if (!show) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 mb-6 flex items-start gap-3"
    >
      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold text-foreground">Demo data — fictional startups</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          The 33 startups below are illustrative only. Names are inspired by Solana ecosystem
          category patterns (DEX aggregators, liquid staking, DePIN, RWA, etc.) but every
          metric is fabricated. Production deployments connect to live Supabase data.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss demo banner"
        className="text-muted-foreground hover:text-foreground transition shrink-0"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
