import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import {
  LogIn, LogOut, User, Sun, Moon, Bell, TrendingDown, FileText, Shield,
  Search, Building2, Menu, X, BarChart3, Coins, Vote, Eye, Award,
  FileCheck, Calculator, Code, Users, Globe, TrendingUp, GitCompareArrows,
  Scale, ChevronRight, Radio,
} from 'lucide-react';
import SearchModal from '@/components/SearchModal';
import ChainStatus from '@/components/common/ChainStatus';
import { useInstitutionalView } from '@/contexts/InstitutionalViewContext';
import { canAccess } from '@/lib/role-access';

/* ── Header links — role-aware essentials ── */
interface HeaderLink { path: string; label: string; live?: boolean; roles: ('investor' | 'startup' | 'admin' | null)[] }

const HEADER_LINKS_ALL: HeaderLink[] = [
  { path: '/dashboard', label: 'Dashboard', live: true, roles: ['investor', 'startup', 'admin', null] },
  { path: '/investor-hub', label: 'Investor Hub', roles: ['investor', 'admin'] },
  { path: '/screener', label: 'Screener', roles: ['investor', 'admin'] },
  { path: '/my-startup', label: 'My Startup', roles: ['startup', 'admin'] },
  { path: '/staking', label: 'Staking', roles: ['investor', 'startup', 'admin'] },
  { path: '/governance', label: 'Governance', roles: ['investor', 'startup', 'admin'] },
];

/* ── Sidebar sections ── */
interface SidebarLink { path: string; label: string; icon: any; desc: string }
const SIDEBAR_SECTIONS: { title: string; links: SidebarLink[] }[] = [
  {
    title: 'Getting Started',
    links: [
      { path: '/dashboard', label: 'Dashboard', icon: BarChart3, desc: 'Platform metrics overview' },
      { path: '/investor-hub', label: 'Investor Hub', icon: BarChart3, desc: 'AI briefings & deal flow' },
      { path: '/demo', label: 'Interactive Demo', icon: Eye, desc: 'Try the full workflow' },
      { path: '/testnet-demo', label: 'Live Testnet Demo', icon: Radio, desc: 'Real Solana devnet tx — sign & verify' },
    ],
  },
  {
    title: 'Core',
    links: [
      { path: '/portfolio', label: 'Portfolio', icon: Shield, desc: 'Bookmarks & alerts' },
      { path: '/screener', label: 'Screener', icon: Search, desc: 'Multi-metric filter' },
      { path: '/leaderboard', label: 'Leaderboard', icon: TrendingUp, desc: 'Top startups ranked' },
      { path: '/compare', label: 'Compare', icon: GitCompareArrows, desc: 'Side-by-side analysis' },
    ],
  },
  {
    title: 'My Business',
    links: [
      { path: '/my-startup', label: 'My Startup', icon: Building2, desc: 'Manage profile & metrics' },
      { path: '/register', label: 'Register Startup', icon: FileText, desc: 'On-chain registration' },
    ],
  },
  {
    title: 'Verification',
    links: [
      { path: '/provenance', label: 'Provenance Certificates', icon: Award, desc: 'RWA supply chain records' },
      { path: '/compliance', label: 'EU DPP Compliance', icon: FileCheck, desc: 'Digital Product Passport' },
      { path: '/security', label: 'Security & Audits', icon: Shield, desc: 'Audit reports, MiCA status' },
    ],
  },
  {
    title: 'Token & Governance',
    links: [
      { path: '/staking', label: 'Staking', icon: Coins, desc: 'Stake CMT, earn rewards' },
      { path: '/governance', label: 'Governance', icon: Vote, desc: 'Proposals & voting' },
      { path: '/tokenomics', label: 'Token Economics', icon: Coins, desc: 'Distribution, vesting, burns' },
    ],
  },
  {
    title: 'Intelligence',
    links: [
      { path: '/analytics', label: 'Platform Analytics', icon: BarChart3, desc: 'KPIs & growth metrics' },
      { path: '/cost-calculator', label: 'Cost Calculator', icon: Calculator, desc: 'Savings vs. traditional' },
      { path: '/investors', label: 'Investor Relations', icon: Users, desc: 'Traction & case studies' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { path: '/integrate', label: 'Build on ChainTrust', icon: Code, desc: 'SDK, CPI, Blinks, API' },
      { path: '/api', label: 'API Docs', icon: Code, desc: 'REST API, webhooks' },
      { path: '/proof-explorer', label: 'Proof Explorer', icon: Globe, desc: 'All proofs, public' },
      { path: '/verify', label: 'Verify On-Chain', icon: Shield, desc: 'Public proof verification' },
    ],
  },
];

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
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDark(false);
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
  { icon: TrendingDown, text: 'DeFiYield sustainability score dropped below 50', time: '2h ago', color: 'text-destructive', actionUrl: '/startup/defiyield' },
  { icon: FileText, text: 'GreenChain published new monthly metrics', time: '5h ago', color: 'text-primary', actionUrl: '/startup/greenchain' },
  { icon: Shield, text: 'PayFlow earned a verified soulbound badge', time: '1d ago', color: 'text-accent', actionUrl: '/startup/payflow' },
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
                <Link key={i} to={n.actionUrl} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 transition hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-0">
                  <n.icon className={`mt-0.5 h-4 w-4 shrink-0 ${n.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-snug">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2.5 text-center">
              <Link to="/portfolio" onClick={() => setOpen(false)} className="text-xs text-primary hover:underline">View all alerts</Link>
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
  const { institutionalMode, toggleInstitutionalMode } = useInstitutionalView();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Filter header links by role
  const headerLinks = HEADER_LINKS_ALL.filter(
    link => link.roles.includes(role) || link.roles.includes(null)
  );

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Left: logo + sidebar toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="text-xl font-bold text-primary">
              ChainTrust
            </Link>
          </div>

          {/* Center: header links (desktop only) */}
          <div className="hidden items-center gap-1 lg:flex">
            {headerLinks.map((link) => (
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
                  {(link as any).live && (
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

          {/* Right: search, institutional, theme, notifications, auth */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-secondary"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search...</span>
              <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">{navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl+K'}</kbd>
            </button>
            <button
              onClick={toggleInstitutionalMode}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                institutionalMode
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
              title="Toggle Institutional View — dense data, no animations"
            >
              <Building2 className="h-3.5 w-3.5" />
              {institutionalMode ? 'Institutional' : 'Standard'}
            </button>
            <ChainStatus compact />
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
          </div>
        </div>
      </nav>

      {/* ── Sidebar overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar panel */}
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-[70] w-80 border-r border-border bg-background overflow-y-auto"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <Link to="/" onClick={() => setSidebarOpen(false)} className="text-lg font-bold text-primary">
                  ChainTrust
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Role indicator */}
              {role && (
                <div className="mx-5 mt-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Signed in as</div>
                  <div className="text-sm font-bold text-primary capitalize">{role}</div>
                </div>
              )}

              {/* Sidebar sections — filtered by role */}
              <div className="px-3 py-3 space-y-5">
                {SIDEBAR_SECTIONS.map((section) => {
                  const visibleLinks = section.links.filter(link => canAccess(role, link.path));
                  if (visibleLinks.length === 0) return null;
                  return (
                    <div key={section.title}>
                      <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </p>
                      <div className="space-y-0.5">
                        {visibleLinks.map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                              location.pathname === link.path
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                          >
                            <link.icon className="h-4 w-4 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">{link.label}</div>
                              <div className="text-[10px] text-muted-foreground truncate">{link.desc}</div>
                            </div>
                            {location.pathname === link.path && (
                              <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sidebar footer */}
              <div className="border-t border-border px-5 py-4 mt-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                        <User className="h-3.5 w-3.5" />
                        {role ?? '...'}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => { signOut(); navigate('/'); setSidebarOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full border-border text-foreground" onClick={() => { navigate('/login'); setSidebarOpen(false); }}>
                    <LogIn className="h-4 w-4 mr-2" /> Sign In
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
