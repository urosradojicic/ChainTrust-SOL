import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-foreground">ChainTrust</span>
            <span className="text-xs text-muted-foreground">Verified startup metrics on Solana</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/dashboard" className="text-xs text-muted-foreground transition hover:text-foreground">Dashboard</Link>
            <Link to="/screener" className="text-xs text-muted-foreground transition hover:text-foreground">Screener</Link>
            <Link to="/compliance" className="text-xs text-muted-foreground transition hover:text-foreground">Compliance</Link>
            <Link to="/analytics" className="text-xs text-muted-foreground transition hover:text-foreground">Analytics</Link>
            <Link to="/security" className="text-xs text-muted-foreground transition hover:text-foreground">Security</Link>
            <Link to="/api" className="text-xs text-muted-foreground transition hover:text-foreground">API</Link>
            <Link to="/cost-calculator" className="text-xs text-muted-foreground transition hover:text-foreground">Cost Calculator</Link>
            <Link to="/governance" className="text-xs text-muted-foreground transition hover:text-foreground">Governance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
