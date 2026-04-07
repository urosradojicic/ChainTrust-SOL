import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useStartups } from '@/hooks/use-startups';
import { Link } from 'react-router-dom';
import { Bookmark, Bell, TrendingDown, TrendingUp, FileText, Shield, Plus, X, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

const TIER_COLORS: Record<string, string> = {
  Free: 'bg-muted text-muted-foreground',
  Basic: 'bg-blue-500/15 text-blue-400',
  Pro: 'bg-primary/15 text-primary',
  Whale: 'bg-amber-500/15 text-amber-400',
};

interface WatchAlert {
  id: number;
  startupName: string;
  metric: string;
  condition: 'above' | 'below';
  threshold: number;
  triggered: boolean;
}

const INITIAL_ALERTS: WatchAlert[] = [
  { id: 1, startupName: 'DeFiYield', metric: 'Trust Score', condition: 'below', threshold: 50, triggered: true },
  { id: 2, startupName: 'GreenChain', metric: 'Sustainability', condition: 'above', threshold: 90, triggered: true },
  { id: 3, startupName: 'PayFlow', metric: 'MRR', condition: 'above', threshold: 100000, triggered: true },
  { id: 4, startupName: 'TokenBridge', metric: 'Growth', condition: 'below', threshold: 0, triggered: true },
];

export default function Portfolio() {
  const { connected, address, balance, tier, stakedAmount, bookmarkedStartups, toggleBookmark } = useWallet();
  const { data: startups } = useStartups();
  const [alerts, setAlerts] = useState<WatchAlert[]>(() => {
    try {
      const saved = localStorage.getItem('chaintrust_alerts');
      return saved ? JSON.parse(saved) : INITIAL_ALERTS;
    } catch { return INITIAL_ALERTS; }
  });
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({ startupName: '', metric: 'MRR', condition: 'below' as const, threshold: 0 });

  useEffect(() => {
    localStorage.setItem('chaintrust_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const bookmarked = startups?.filter(s => bookmarkedStartups.includes(s.id)) ?? [];

  // Allow browsing even without wallet — show connect prompt instead of redirect
  const showConnectPrompt = !connected;

  const addAlert = () => {
    if (!newAlert.startupName.trim()) return;
    setAlerts(prev => [...prev, { ...newAlert, id: Date.now(), triggered: false }]);
    setNewAlert({ startupName: '', metric: 'MRR', condition: 'below', threshold: 0 });
    setShowAddAlert(false);
  };

  const removeAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">My Portfolio</h1>

      {/* Connect wallet prompt */}
      {showConnectPrompt && (
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <Shield className="h-8 w-8 text-primary flex-shrink-0" />
          <div className="flex-1">
            <h2 className="font-bold text-foreground">Connect your wallet to unlock full portfolio features</h2>
            <p className="mt-1 text-sm text-muted-foreground">Track bookmarks, set alerts, and view your staking tier. You can browse the dashboard below in the meantime.</p>
          </div>
          <Link to="/staking" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            Connect & Stake
          </Link>
        </div>
      )}

      {/* Wallet overview */}
      {!showConnectPrompt && (
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Wallet</p>
          <p className="mt-1 font-mono text-sm text-foreground">{address.slice(0, 6)}...{address.slice(-4)}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{balance.toLocaleString()} SOL</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Staked</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stakedAmount.toLocaleString()} CMT</p>
          <p className="mt-2 text-xs text-muted-foreground">30-day lock period</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tier</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-bold ${TIER_COLORS[tier]}`}>{tier}</span>
          <p className="mt-2 text-xs text-muted-foreground">
            {tier === 'Whale' ? 'Max tier unlocked' : `${tier === 'Pro' ? '50,000' : tier === 'Basic' ? '5,000' : '100'} CMT for next tier`}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Watching</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{bookmarked.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">{alerts.filter(a => a.triggered).length} alerts triggered</p>
        </div>
      </div>
      )}

      {/* Bookmarked startups */}
      <section className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-foreground">
          <Bookmark className="h-5 w-5 text-primary" /> Bookmarked Startups
        </h2>
        {bookmarked.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No startups bookmarked yet. Visit the <Link to="/dashboard" className="text-primary underline">Dashboard</Link> to bookmark startups.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bookmarked.map(s => (
              <Link key={s.id} to={`/startup/${s.id}`} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:bg-secondary">
                <div>
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.category} · {s.blockchain}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{s.sustainability_score}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(s.mrr)} MRR</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Custom Watchlist Alerts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Bell className="h-5 w-5 text-primary" /> Watchlist Alerts
          </h2>
          <button
            onClick={() => setShowAddAlert(!showAddAlert)}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
          >
            <Plus className="h-3.5 w-3.5" /> Add Alert
          </button>
        </div>

        {showAddAlert && (
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">New Alert</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="relative">
                <input
                  value={newAlert.startupName}
                  onChange={e => setNewAlert(a => ({ ...a, startupName: e.target.value }))}
                  placeholder="Search startups..."
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary w-full"
                  list="startup-names"
                />
                <datalist id="startup-names">
                  {startups?.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
              </div>
              <select
                value={newAlert.metric}
                onChange={e => setNewAlert(a => ({ ...a, metric: e.target.value }))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <option>MRR</option>
                <option>Trust Score</option>
                <option>Growth</option>
                <option>Sustainability</option>
                <option>Users</option>
              </select>
              <div className="flex gap-2">
                <select
                  value={newAlert.condition}
                  onChange={e => setNewAlert(a => ({ ...a, condition: e.target.value as 'above' | 'below' }))}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground flex-1"
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <input
                  type="number"
                  value={newAlert.threshold}
                  onChange={e => setNewAlert(a => ({ ...a, threshold: Number(e.target.value) }))}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground w-24"
                />
              </div>
              <button
                onClick={addAlert}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-4 ${a.triggered ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-card'}`}>
              {a.triggered ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              ) : (
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{a.startupName}</span> — {a.metric} {a.condition === 'below' ? 'drops below' : 'goes above'}{' '}
                  <span className="font-mono font-bold">{a.threshold.toLocaleString()}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.triggered ? 'Triggered' : 'Watching'}
                </p>
              </div>
              <button onClick={() => removeAlert(a.id)} className="text-muted-foreground hover:text-destructive transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              No alerts configured. Click "Add Alert" to create one.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
