/**
 * Hackathon Judge Landing Page
 * ────────────────────────────
 * One-page pitch designed for Colosseum Frontier judges.
 * Shows what ChainTrust does, why it matters, and how to try it — in under 60 seconds.
 */
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Zap, Award, BarChart3, Lock, Globe, ArrowRight,
  CheckCircle, ExternalLink, Code, Users, TrendingUp, DollarSign,
  Eye, Coins, FileCheck, Activity,
} from 'lucide-react';

const enter = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export default function Hackathon() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero — What is ChainTrust in one sentence */}
      <motion.div custom={0} variants={enter} initial="hidden" animate="visible" className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Colosseum Frontier Hackathon Submission
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground" style={{ lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          Verify startup claims
          <br />
          against the actual blockchain
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          ChainTrust reads live Solana data to verify treasury balances, token distribution,
          payment volume, and transaction activity. No self-reporting. No trust required.
          Cost per verification: <span className="font-mono font-bold text-foreground">$0.00025</span>.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90">
            Try it now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/verify" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary">
            <Shield className="h-4 w-4" /> Verify any wallet
          </Link>
          <a href="https://github.com/urosradojicic/ChainTrust-SOL" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            <Code className="h-4 w-4" /> GitHub <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </motion.div>

      {/* The Problem */}
      <motion.div custom={1} variants={enter} initial="hidden" animate="visible" className="mb-12 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-6">
        <h2 className="text-xl font-bold text-foreground mb-3">The Problem</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-card p-4">
            <div className="text-2xl font-display font-bold text-destructive">$1.7B</div>
            <div className="text-xs text-muted-foreground mt-1">Lost to fraudulent blockchain startups in 2024 alone</div>
          </div>
          <div className="rounded-lg bg-card p-4">
            <div className="text-2xl font-display font-bold text-destructive">70%</div>
            <div className="text-xs text-muted-foreground mt-1">Of token listing applications rejected due to DD failures</div>
          </div>
          <div className="rounded-lg bg-card p-4">
            <div className="text-2xl font-display font-bold text-destructive">2-8 weeks</div>
            <div className="text-xs text-muted-foreground mt-1">Average time for manual startup due diligence</div>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Investors rely on self-reported metrics. Startups can claim any MRR, any user count, any treasury balance —
          and nobody verifies it until it's too late. Post-FTX, this is unacceptable.
        </p>
      </motion.div>

      {/* The Solution — What we verify */}
      <motion.div custom={2} variants={enter} initial="hidden" animate="visible" className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-4">What We Verify (All Free, All On-Chain)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: DollarSign, title: 'Treasury Balance', desc: 'SOL + all SPL tokens via getBalance() + Pyth oracle USD pricing', tag: 'Pyth Network' },
            { icon: Users, title: 'Token Distribution', desc: 'All holders, top-10 concentration, Gini coefficient', tag: 'getParsedProgramAccounts' },
            { icon: Activity, title: 'Transaction Activity', desc: '7d/30d/all-time tx counts, avg activity per day', tag: 'getSignaturesForAddress' },
            { icon: TrendingUp, title: 'Payment Volume', desc: 'Inbound/outbound SOL+USDC, net cash flow, unique counterparties', tag: 'Parsed tx history' },
            { icon: Lock, title: 'Mint Authority', desc: 'Can new tokens be minted? Is supply capped?', tag: 'getParsedAccountInfo' },
            { icon: Shield, title: 'Wash Trading', desc: 'Self-transfers, circular transfers, real vs inflated volume', tag: 'Wallet intelligence' },
          ].map((item, i) => (
            <div key={item.title} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              <span className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground">{item.tag}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Result: A verification score (0-100) with A-F grade + compressed NFT certificate minted for ~$0.0001
        </p>
      </motion.div>

      {/* Tech Stack */}
      <motion.div custom={3} variants={enter} initial="hidden" animate="visible" className="mb-12 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Built on Solana</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Smart Contract', value: '24 instructions', sub: 'Anchor Framework' },
            { label: 'Oracle', value: 'Pyth Network', sub: 'Live SOL/USD pricing' },
            { label: 'Certificates', value: 'Bubblegum cNFTs', sub: '~$0.0001 per mint' },
            { label: 'Verification', value: '6 on-chain checks', sub: 'Zero API cost' },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-sm font-bold mt-0.5">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Anchor', 'Solana Web3.js', 'Pyth', 'Metaplex Bubblegum', 'Supabase', 'Tailwind', 'Recharts', 'Framer Motion'].map(t => (
            <span key={t} className="rounded border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{t}</span>
          ))}
        </div>
      </motion.div>

      {/* What No One Else Has */}
      <motion.div custom={4} variants={enter} initial="hidden" animate="visible" className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-4">What No Other Project Has</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Eye, title: 'Live oracle-verified treasury', desc: 'Pyth Network SOL/USD price feeds refresh every 30 seconds. Not an estimate.' },
            { icon: Award, title: 'cNFT verification certificates', desc: 'Proof of verification lives in the startup\'s wallet — permanent, immutable, ~$0.0001.' },
            { icon: Shield, title: 'Wash trading detection', desc: 'Wallet intelligence tags known wallets, detects self-transfers, filters real vs fake volume.' },
            { icon: Lock, title: 'ZK range proofs', desc: 'Startups prove "revenue > $100K" without revealing the exact number. Privacy-preserving verification.' },
            { icon: BarChart3, title: '17 ML algorithms', desc: 'Monte Carlo, Bayesian inference, Isolation Forest, gradient boosting — for risk scoring and prediction.' },
            { icon: Coins, title: 'Full token economics', desc: 'Distribution, 48-month vesting schedule, 4 burn mechanics, 4 staking tiers with rewards calculator.' },
          ].map((item, i) => (
            <div key={item.title} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* By the Numbers */}
      <motion.div custom={5} variants={enter} initial="hidden" animate="visible" className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-4">By the Numbers</h2>
        <div className="grid gap-px bg-border rounded-lg overflow-hidden grid-cols-2 sm:grid-cols-4">
          {[
            { value: '25', label: 'Pages' },
            { value: '92', label: 'Components' },
            { value: '24', label: 'On-chain instructions' },
            { value: '80+', label: 'Intelligence libraries' },
            { value: '15', label: 'Blockchain hooks' },
            { value: '3', label: 'User roles' },
            { value: '10', label: 'Database tables' },
            { value: '$0', label: 'API cost' },
          ].map(s => (
            <div key={s.label} className="bg-card p-4 text-center">
              <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* How to Evaluate */}
      <motion.div custom={6} variants={enter} initial="hidden" animate="visible" className="mb-12 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
        <h2 className="text-xl font-bold text-foreground mb-3">How to Evaluate This Submission</h2>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Sign in as Investor', desc: 'Click "Continue as Investor" on the login page', link: '/login' },
            { step: '2', title: 'Browse the Dashboard', desc: 'See all startups with live metrics, filters, and search', link: '/dashboard' },
            { step: '3', title: 'Click any startup', desc: 'See 20+ analysis tabs: AI due diligence, red flags, ZK proofs, verification', link: '/dashboard' },
            { step: '4', title: 'Try on-chain verification', desc: 'Go to the Verification tab → click "Verify Now" → see live Solana data', link: '/dashboard' },
            { step: '5', title: 'Try the public verifier', desc: 'Enter any Solana address and see instant on-chain analysis', link: '/verify' },
          ].map(item => (
            <Link key={item.step} to={item.link} className="flex items-center gap-4 rounded-lg bg-card p-3 transition hover:bg-muted/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                {item.step}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Market Opportunity */}
      <motion.div custom={7} variants={enter} initial="hidden" animate="visible" className="mb-12 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-3xl font-display font-bold text-primary">$9.4T</div>
          <div className="text-sm font-medium mt-1">RWA tokenization by 2030</div>
          <div className="text-xs text-muted-foreground mt-1">Every tokenized asset needs verification infrastructure</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-3xl font-display font-bold text-primary">$300B+</div>
          <div className="text-sm font-medium mt-1">Annual startup investment</div>
          <div className="text-xs text-muted-foreground mt-1">VCs spend 20+ hours per deal on manual due diligence</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-3xl font-display font-bold text-primary">46%</div>
          <div className="text-sm font-medium mt-1">Supply chain firms adopting blockchain</div>
          <div className="text-xs text-muted-foreground mt-1">EU Digital Product Passport mandate active Jan 2026</div>
        </div>
      </motion.div>

      {/* Team */}
      <motion.div custom={8} variants={enter} initial="hidden" animate="visible" className="mb-12 rounded-xl border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-3">Team</h2>
        <p className="text-sm text-muted-foreground">
          Building full-time. Committed to making ChainTrust the standard for startup verification on Solana.
          Looking to join the Colosseum accelerator to scale to mainnet and onboard institutional investors.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div custom={9} variants={enter} initial="hidden" animate="visible" className="text-center pb-10">
        <h2 className="font-display text-2xl font-bold text-foreground">Ready to try it?</h2>
        <p className="text-muted-foreground mt-1">Sign in with one click. Verify a startup in under 2 seconds.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to="/login" className="rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90">
            Launch App
          </Link>
          <a href="https://github.com/urosradojicic/ChainTrust-SOL" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
            View Source Code
          </a>
        </div>
      </motion.div>
    </div>
  );
}
