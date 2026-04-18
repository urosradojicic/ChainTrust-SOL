import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Code, Copy, Check, Terminal, Layers, Zap, Shield,
  ArrowRight, ExternalLink, GitBranch, Package, Globe,
} from 'lucide-react';

const CODE_EXAMPLES = {
  verify: {
    label: 'Verify a Startup',
    lang: 'typescript',
    code: `import { ChainTrust } from '@chaintrust/sdk';

const ct = new ChainTrust({ cluster: 'mainnet-beta' });

// Get trust score for any startup
const score = await ct.getTrustScore('startup-pda-address');
console.log(score); // { score: 87, tier: 'Gold', verified: true }

// Verify a specific proof hash
const proof = await ct.verifyProof('startup-pda', {
  mrr: 150000,
  users: 12000,
  growthRate: 15.5,
});
console.log(proof.valid); // true — hash matches on-chain data`,
  },
  cpi: {
    label: 'CPI Integration (Rust)',
    lang: 'rust',
    code: `use anchor_lang::prelude::*;
use chaintrust::cpi::accounts::GetTrustScore;
use chaintrust::program::Chaintrust;

// Read ChainTrust score from another Solana program
pub fn approve_loan(ctx: Context<ApproveLoan>) -> Result<()> {
    // Derive the startup's metrics PDA
    let metrics = &ctx.accounts.metrics_account;

    // Check trust score before approving
    require!(
        metrics.trust_score >= 70,
        ErrorCode::InsufficientTrustScore
    );

    // Verify proof hash is recent (within 30 days)
    let age = Clock::get()?.unix_timestamp - metrics.last_updated;
    require!(age < 30 * 86400, ErrorCode::StaleMetrics);

    msg!("Loan approved: trust_score={}", metrics.trust_score);
    Ok(())
}`,
  },
  blink: {
    label: 'Solana Blink',
    lang: 'typescript',
    code: `import { createAction } from '@solana/actions';

// Create a shareable Blink for startup verification
const action = createAction({
  title: 'Verify PayFlow on ChainTrust',
  description: 'Cryptographically verify this startup\\'s metrics',
  icon: 'https://chaintrust.io/icon.png',
  label: 'Verify Now',
  links: {
    actions: [{
      label: 'Verify Metrics',
      href: '/api/actions/verify?startup=payflow',
    }],
  },
});

// Share on Twitter/X — unfurls into interactive card
const blinkUrl = 'https://chaintrust.io/blink/verify/payflow';`,
  },
  webhook: {
    label: 'Webhook / REST API',
    lang: 'bash',
    code: `# Get startup trust score via REST API
curl -X GET https://api.chaintrust.io/v1/startups/payflow/score \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response:
# {
#   "startup": "PayFlow",
#   "trust_score": 87,
#   "tier": "Gold",
#   "verified": true,
#   "proof_hash": "a7f3e8b9...2c4d",
#   "last_verified": "2026-04-15T10:30:00Z",
#   "metrics": {
#     "mrr": 150000,
#     "users": 12000,
#     "growth_rate": 15.5
#   }
# }

# Register a webhook for score changes
curl -X POST https://api.chaintrust.io/v1/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"event": "score_change", "url": "https://your-app.com/webhook"}'`,
  },
};

type TabKey = keyof typeof CODE_EXAMPLES;

export default function Integrate() {
  const [activeTab, setActiveTab] = useState<TabKey>('verify');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-4">
          <Code className="h-3 w-3" />
          Open Source & Composable
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Build on ChainTrust</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl text-base">
          ChainTrust is infrastructure, not just an app. Any Solana program can read our trust scores via CPI.
          Any dApp can verify startups through our SDK. Here's how.
        </p>
      </div>

      {/* Integration methods grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {[
          { icon: Package, title: 'NPM SDK', desc: '3 functions: verify(), getScore(), getBadge()', tag: 'TypeScript' },
          { icon: GitBranch, title: 'CPI (On-chain)', desc: 'Other Solana programs call ChainTrust directly', tag: 'Rust / Anchor' },
          { icon: Globe, title: 'Solana Blinks', desc: 'Shareable verification links for Twitter/X', tag: 'Solana Actions' },
          { icon: Terminal, title: 'REST API', desc: 'Webhooks, score queries, batch verification', tag: 'HTTP / JSON' },
        ].map((method, i) => {
          const Icon = method.icon;
          return (
            <motion.div key={method.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 card-shine">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/5 rounded-full px-2 py-0.5">{method.tag}</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">{method.title}</h3>
              <p className="text-xs text-muted-foreground">{method.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Code examples */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-4">Code Examples</h2>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-0">
          {(Object.keys(CODE_EXAMPLES) as TabKey[]).map(key => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {CODE_EXAMPLES[key].label}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div className="relative rounded-b-xl border border-t-0 border-border bg-[#0d1117] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-xs text-white/40 font-mono">{CODE_EXAMPLES[activeTab].lang}</span>
            <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition">
              {copied ? <><Check className="h-3 w-3 text-emerald-400" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
            <code className="text-[#e6edf3] font-mono text-[13px]">{CODE_EXAMPLES[activeTab].code}</code>
          </pre>
        </div>
      </div>

      {/* Use cases */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6">Integration Use Cases</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Lending Protocols',
              desc: 'Check trust scores before approving startup loans. Higher scores = lower collateral requirements.',
              example: 'DeFi protocol reads ChainTrust PDA before issuing undercollateralized loan',
            },
            {
              title: 'Launchpads',
              desc: 'Require ChainTrust verification before token launches. Reduce rug pull risk for investors.',
              example: 'Jupiter LFG requires trust_score >= 70 for token listing',
            },
            {
              title: 'Prediction Markets',
              desc: 'Create markets resolved by ChainTrust oracle data. "Will startup X hit $1M MRR?"',
              example: 'Market auto-resolves when MetricsAccount MRR exceeds threshold',
            },
            {
              title: 'Wallet Integration',
              desc: 'Display trust badges when users browse tokens. "This project is ChainTrust verified."',
              example: 'Phantom wallet shows green badge for verified projects',
            },
            {
              title: 'VC Portfolio Dashboards',
              desc: 'Auto-pull verified metrics for all portfolio companies. Real-time LP reporting.',
              example: 'VC firm queries ChainTrust API for all portfolio trust scores',
            },
            {
              title: 'Insurance Protocols',
              desc: 'Price smart contract insurance based on verified team and financial data.',
              example: 'Insurance premium calculation uses trust_score as risk factor',
            },
          ].map((useCase, i) => (
            <motion.div key={useCase.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-bold text-foreground mb-2">{useCase.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{useCase.desc}</p>
              <div className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-[11px] text-muted-foreground font-mono">{useCase.example}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="rounded-2xl border border-border bg-card p-8 mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6 text-center">How ChainTrust Composes with Solana</h2>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6">
          {[
            { label: 'Your dApp', sub: 'React / Next.js', color: 'bg-blue-500/10 border-blue-500/30 text-blue-500' },
            { label: 'ChainTrust SDK', sub: '@chaintrust/sdk', color: 'bg-primary/10 border-primary/30 text-primary' },
            { label: 'Anchor CPI', sub: 'Cross-Program Invocation', color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500' },
            { label: 'ChainTrust Program', sub: 'CMTRgstry...111', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },
            { label: 'Solana', sub: 'Mainnet / Devnet', color: 'bg-violet-500/10 border-violet-500/30 text-violet-500' },
          ].map((box, i) => (
            <div key={box.label} className="flex items-center gap-4 lg:gap-6">
              <div className={`rounded-xl border ${box.color} p-4 text-center min-w-[140px]`}>
                <div className="text-sm font-bold">{box.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{box.sub}</div>
              </div>
              {i < 4 && <ArrowRight className="h-5 w-5 text-muted-foreground hidden lg:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-primary/20 overflow-hidden">
        <div className="relative p-8 sm:p-12 text-center">
          <div className="absolute inset-0 brand-gradient opacity-5" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-foreground">Ready to build on ChainTrust?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              The SDK is open source. The program is deployed. Start integrating in 5 minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="https://github.com/urosradojicic/ChainTrust-SOL" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 brand-gradient rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                <GitBranch className="h-4 w-4" /> View on GitHub
              </a>
              <Link to="/api" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
                API Docs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
