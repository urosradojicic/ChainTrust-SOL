import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User, Sun, Moon, Bell, TrendingDown, FileText, Shield, Search } from 'lucide-react';
import SearchModal from '@/components/SearchModal';

const NAV_LINKS: { path: string; label: string; live?: boolean }[] = [
  { path: '/dashboard', label: 'Dashboard', live: true },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/compare', label: 'Compare' },
  { path: '/screener', label: 'Screener' },
  { path: '/staking', label: 'Staking' },
  { path: '/governance', label: 'Governance' },
  { path: '/demo', label: 'Demo' },
];

const STARTUP_NAV = { path: '/my-startup', label: 'My Startup' };

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      setDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

const NOTIFICATIONS = [
  { icon: TrendingDown, text: 'DeFiYield sustainability score dropped below 50', time: '2h ago', color: 'text-destructive' },
  { icon: FileText, text: 'GreenChain published new monthly metrics', time: '5h ago', color: 'text-primary' },
  { icon: Shield, text: 'PayFlow earned a verified soulbound badge', time: '1d ago', color: 'text-accent' },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-xl"
          >
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">{NOTIFICATIONS.length} new</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {NOTIFICATIONS.map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 transition hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0">
                  <n.icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <button className="text-xs text-primary hover:underline">View all notifications</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { connected, address, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);


  // Build nav links dynamically
  const links = [
    ...NAV_LINKS.slice(0, 1),
    ...(connected ? [{ path: '/portfolio', label: 'My Portfolio' }] : []),
    ...(role === 'startup' ? [STARTUP_NAV] : []),
    ...NAV_LINKS.slice(1),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-bold text-primary">
            ChainTrust
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {location.pathname === link.path && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {link.label}
                  {link.live && (
                    <span className="flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-secondary"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
            </button>
            <ThemeToggle />
            <NotificationBell />
            {user ? (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                  <User className="h-3.5 w-3.5" />
                  {role ?? '...'}
                </span>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => { signOut(); navigate('/'); }}>
                  <LogOut className="h-4 w-4 mr-1" /> Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="hidden sm:flex border-border text-foreground" onClick={() => navigate('/login')}>
                <LogIn className="h-4 w-4 mr-1" /> Sign In
              </Button>
            )}




            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground transition hover:bg-secondary md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10 md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 py-3">
                {links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      location.pathname === link.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}


              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
