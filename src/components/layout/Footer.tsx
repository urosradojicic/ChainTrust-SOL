import { Link } from 'react-router-dom';
import { Shield, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-foreground">ChainTrust &copy; {new Date().getFullYear()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Transparent on-chain startup metrics verified on Solana</p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/dashboard" className="text-xs text-muted-foreground transition hover:text-foreground">Dashboard</Link>
            <Link to="/screener" className="text-xs text-muted-foreground transition hover:text-foreground">Screener</Link>
            <Link to="/security" className="text-xs text-muted-foreground transition hover:text-foreground">Security</Link>
            <Link to="/governance" className="text-xs text-muted-foreground transition hover:text-foreground">Governance</Link>
            <Link to="/demo" className="text-xs text-muted-foreground transition hover:text-foreground">Demo</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-accent" />
              3 Audits Passed
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" />
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-primary to-accent text-[8px] font-bold text-white">S</span>
              Solana
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
