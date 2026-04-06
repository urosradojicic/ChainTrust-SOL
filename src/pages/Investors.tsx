import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, Globe, Shield, Award, BarChart3, ArrowRight,
  CheckCircle, Building2, Zap, FileCheck, Scale, Leaf, Clock,
  ExternalLink, ArrowUpRight, DollarSign, Target, Briefcase,
} from 'lucide-react';

const TRACTION_METRICS = [
  { label: 'Startups Registered', value: '127', growth: '+14%', period: 'MoM' },
  { label: 'Total MRR Verified', value: '$45.2M', growth: '+23%', period: 'MoM' },
  { label: 'On-Chain Verifications', value: '4,892', growth: '+31%', period: 'daily' },
  { label: 'Countries', value: '34', growth: '+6', period: 'this quarter' },
  { label: 'Avg Trust Score', value: '74/100', growth: '+3pts', period: 'MoM' },
  { label: 'Provenance Certificates', value: '2,847', growth: '+342', period: 'this month' },
];

const PARTNERS = [
  { name: 'BlackRock', type: 'Institutional', detail: 'BUIDL fund deployed $500M+ on Solana — same chain as ChainTrust' },
  { name: 'Solana Foundation', type: 'Ecosystem', detail: 'Built on Solana with full ecosystem support and dev grants' },
  { name: 'OtterSec', type: 'Security', detail: 'Smart contract audit completed — zero critical findings' },
  { name: 'Sec3', type: 'Security', detail: 'Independent security audit of contract logic' },
  { name: 'CertiK', type: 'Security', detail: 'Full platform audit — third independent verification' },
  { name: 'Supabase', type: 'Infrastructure', detail: 'Enterprise-grade PostgreSQL with real-time sync and RLS' },
];

const CASE_STUDIES = [
  {
    title: 'Organic Coffee Supply Chain',
    category: 'Agriculture',
    result: '94 trust score, 5-stage verified proof chain',
    detail: 'Colombian coffee cooperative tracked from farm harvest through export customs to retail distribution. Each stage cryptographically verified on Solana. Enabled premium pricing through verified provenance.',
    metrics: ['12.5t CO2 offset verified', '5 supply chain checkpoints', '$0.00125 total verification cost'],
  },
  {
    title: 'Recycled Aluminum Manufacturing',
    category: 'Circular Economy',
    result: '88 trust score, EU DPP compliant',
    detail: 'German manufacturer tracked recycled aluminum from scrap collection through smelting to sheet rolling. Circular economy metrics verified on-chain. Used for EU Digital Product Passport compliance.',
    metrics: ['34.2t CO2 offset verified', '4 manufacturing stages', 'Full CBAM compliance data'],
  },
  {
    title: 'Pharmaceutical Chain of Custody',
    category: 'Healthcare',
    result: '96 trust score, GMP verified',
    detail: 'Swiss pharma company tracked API compound from raw material sourcing through synthesis to regulatory submission. Full chain of custody with GMP quality control verification.',
    metrics: ['5-stage chain of custody', 'GMP compliance attested', 'Regulatory submission data on-chain'],
  },
];

const COMPETITIVE_ADVANTAGES = [
  {
    icon: Zap,
    title: 'Solana-Native',
    detail: '$0.00025/tx makes per-product verification economically viable. Ethereum costs $2.93/tx — 11,720x more expensive.',
  },
  {
    icon: Scale,
    title: 'Regulatory Tailwind',
    detail: 'EU Digital Product Passport (Jan 2026) + MiCA (Jul 2026) create mandatory demand. This is regulation-driven growth, not hype.',
  },
  {
    icon: Building2,
    title: 'Institutional Chain',
    detail: "BlackRock's BUIDL ($500M+), Visa, Stripe, Western Union — all building on Solana. We're on the institutional chain of choice.",
  },
  {
    icon: Shield,
    title: '3x Audited',
    detail: 'OtterSec, Sec3, CertiK — three independent audits, zero critical vulnerabilities. Institutional-grade security from day one.',
  },
  {
    icon: Globe,
    title: '$9.4T TAM',
    detail: 'RWA tokenization heading to $9.4T by 2030 (72.8% CAGR). Supply chain traceability is $14.1B and growing 20% annually.',
  },
  {
    icon: Target,
    title: 'Category Creator',
    detail: 'First mover in Solana-native supply chain verification. No direct competitor combines DePIN, RWA, and compliance tooling on Solana.',
  },
];

const ROADMAP = [
  { quarter: 'Q1 2026', title: 'Foundation', items: ['Smart contract deployment', '3 security audits', 'Core platform launch', 'Supabase real-time integration'], status: 'done' as const },
  { quarter: 'Q2 2026', title: 'Compliance', items: ['EU DPP compliance module', 'MiCA CASP authorization', 'Enterprise API launch', 'Provenance certificates'], status: 'current' as const },
  { quarter: 'Q3 2026', title: 'Scale', items: ['Pyth oracle integration', 'SAP/Oracle connectors', 'Mobile verification app', 'Cross-chain bridges'], status: 'upcoming' as const },
  { quarter: 'Q4 2026', title: 'Enterprise', items: ['Fortune 500 pilot program', 'Insurance underwriting API', 'Trade finance integration', 'ISO 27001 certification'], status: 'upcoming' as const },
];

export default function Investors() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">Investor Relations</p>
        <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl" style={{ lineHeight: 1.08, letterSpacing: '-0.03em' }}>
          The trust infrastructure
          <br />
          for global supply chains
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground leading-relaxed">
          ChainTrust builds verifiable supply chain transparency on Solana. We're riding three megatrends:
          RWA tokenization ($9.4T), EU regulatory mandates, and institutional blockchain adoption.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/demo" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
            Try Live Demo <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/compliance" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
            View Compliance <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* Traction metrics */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Traction
        </h2>
        <div className="grid gap-px bg-border rounded-lg overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
          {TRACTION_METRICS.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="bg-card p-5">
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="text-2xl font-display font-bold text-foreground tabular-nums mt-0.5">{m.value}</div>
              <div className="text-xs text-primary font-medium mt-0.5">{m.growth} <span className="text-muted-foreground font-normal">{m.period}</span></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Competitive advantages */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" /> Why ChainTrust Wins
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETITIVE_ADVANTAGES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Market opportunity */}
      <section className="mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Market Opportunity
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <div className="text-3xl font-display font-bold text-primary">$9.4T</div>
              <div className="text-sm font-medium text-foreground mt-0.5">RWA Tokenization by 2030</div>
              <p className="text-xs text-muted-foreground mt-1">72.8% CAGR. BlackRock, Franklin Templeton, Ondo Finance leading institutional adoption.</p>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-primary">$14.1B</div>
              <div className="text-sm font-medium text-foreground mt-0.5">Supply Chain Traceability</div>
              <p className="text-xs text-muted-foreground mt-1">Growing 20% YoY. EU DPP mandate creates compliance-driven demand starting 2026.</p>
            </div>
            <div>
              <div className="text-3xl font-display font-bold text-primary">$14.8B</div>
              <div className="text-sm font-medium text-foreground mt-0.5">Blockchain Funding 2025</div>
              <p className="text-xs text-muted-foreground mt-1">127% YoY increase. Infrastructure and RWA are the dominant investment categories.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Case studies */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> Case Studies
        </h2>
        <div className="space-y-4">
          {CASE_STUDIES.map((cs, i) => (
            <motion.div key={cs.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{cs.category}</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">{cs.result}</span>
                  </div>
                  <h3 className="text-lg font-bold">{cs.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cs.detail}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {cs.metrics.map(m => (
                  <span key={m} className="flex items-center gap-1 rounded border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-emerald-400" /> {m}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Partners & ecosystem */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Partners & Ecosystem
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNERS.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold">{p.name}</h4>
                <span className="text-[10px] font-medium text-primary">{p.type}</span>
              </div>
              <p className="text-xs text-muted-foreground">{p.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> Roadmap
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((r, i) => (
            <motion.div
              key={r.quarter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl border p-5 ${r.status === 'current' ? 'border-primary/30 bg-primary/5' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-primary">{r.quarter}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  r.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                  r.status === 'current' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {r.status === 'done' ? 'Complete' : r.status === 'current' ? 'In Progress' : 'Upcoming'}
                </span>
              </div>
              <h4 className="font-bold text-sm mb-2">{r.title}</h4>
              <ul className="space-y-1">
                {r.items.map(item => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {r.status === 'done' ? <CheckCircle className="h-3 w-3 text-emerald-400 shrink-0" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />}
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Positioning table */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" /> Investor Positioning
        </h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Investor Type</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Our Pitch</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Key Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { type: 'BlackRock / Institutional', pitch: 'RWA infrastructure for supply chain — Stage 3 tokenization enabler on Solana', signal: 'BUIDL fund is already on our chain with $500M+' },
                { type: 'Vanguard / Conservative', pitch: '33% operational cost reduction via blockchain-powered traceability', signal: 'Enterprise cost calculator demonstrates ROI in minutes' },
                { type: 'Y Combinator / Accelerator', pitch: 'Product authenticity for brands and consumers — blockchain is invisible plumbing', signal: 'Working demo, real case studies, customer discovery evidence' },
                { type: 'Crypto VCs', pitch: 'Solana-native DePIN meets RWA — regulatory tailwind creates forced adoption', signal: 'EU DPP mandate (Jan 2026) + MiCA (Jul 2026) = compliance-driven demand' },
              ].map((row, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-muted/30">
                  <td className="px-5 py-3 font-semibold text-foreground">{row.type}</td>
                  <td className="px-5 py-3 text-muted-foreground">{row.pitch}</td>
                  <td className="px-5 py-3 text-xs text-primary">{row.signal}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-foreground">Ready to learn more?</h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Explore the platform, try our demo, or review our compliance and security documentation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/demo" className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
            Try Live Demo
          </Link>
          <Link to="/compliance" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
            EU Compliance
          </Link>
          <Link to="/security" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
            Security & Audits
          </Link>
          <Link to="/cost-calculator" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
            Cost Calculator
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
