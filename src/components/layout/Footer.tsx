import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">ChainTrust &copy; {new Date().getFullYear()}</p>
            <p className="text-xs text-muted-foreground">Transparent on-chain startup metrics verified on Solana</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/dashboard" className="text-sm text-muted-foreground transition hover:text-foreground">Dashboard</Link>
            <Link to="/screener" className="text-sm text-muted-foreground transition hover:text-foreground">Screener</Link>
            <Link to="/leaderboard" className="text-sm text-muted-foreground transition hover:text-foreground">Leaderboard</Link>
            <Link to="/demo" className="text-sm text-muted-foreground transition hover:text-foreground">Demo</Link>
            <Link to="/governance" className="text-sm text-muted-foreground transition hover:text-foreground">Governance</Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-green-400 text-[10px] font-bold text-primary-foreground">S</span>
              Built on Solana
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
