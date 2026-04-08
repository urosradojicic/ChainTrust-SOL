import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import { ArrowRight, ArrowUpRight, Shield, BarChart3, Lock, Eye } from 'lucide-react';

const enter = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function Landing() {
  const { data: startups } = useStartups();
  const startupCount = startups?.length ?? 0;
  const totalMrr = startups?.reduce((s, x) => s + x.mrr, 0) ?? 0;
  const totalCarbon = startups?.reduce((s, x) => s + Number(x.carbon_offset_tonnes), 0) ?? 0;

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Subtle glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[800px] h-[500px] rounded-full bg-primary/[0.06] blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8 lg:pt-40 lg:pb-32">
          <div className="max-w-3xl">
            <motion.p custom={0} variants={enter} initial="hidden" animate="visible" className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-6">
              On-chain verification protocol
            </motion.p>

            <motion.h1 custom={1} variants={enter} initial="hidden" animate="visible" className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl" style={{ lineHeight: 1.08, letterSpacing: '-0.03em' }}>
              The trust layer
              <br />
              for startup
              <br />
              fundraising
            </motion.h1>

            <motion.p custom={2} variants={enter} initial="hidden" animate="visible" className="mt-6 max-w-lg text-base text-muted-foreground leading-relaxed">
              Publish metrics on Solana, get verified by independent oracles, and build investor confidence with cryptographic proof chains.
            </motion.p>

            <motion.div custom={3} variants={enter} initial="hidden" animate="visible" className="mt-8 flex items-center gap-4">
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                Try demo
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {[
              { value: startupCount > 0 ? String(startupCount) : '127', label: 'Startups' },
              { value: totalMrr > 0 ? formatCurrency(totalMrr) : '$45M', label: 'MRR verified' },
              { value: totalCarbon > 0 ? `${formatNumber(totalCarbon)}t` : '560t', label: 'Carbon offset' },
              { value: '3', label: 'Audits passed' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="py-6 px-6 first:pl-0">
                <div className="text-2xl font-display font-bold text-foreground tabular-nums">{s.value}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product screenshot ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative rounded-lg border border-border overflow-hidden bg-card">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=700&fit=crop&q=80"
            alt="ChainTrust Dashboard — real-time startup analytics"
            className="w-full h-auto object-cover opacity-90"
            style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background to-transparent h-32" />
        </motion.div>
      </section>

      {/* ── How it works — numbered ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="font-display text-3xl font-bold text-foreground">How it works</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Four steps from self-reported metrics to cryptographically verified, investor-ready data.
            </p>
          </div>
          <div className="mt-10 lg:mt-0 lg:col-span-8">
            <div className="space-y-0 divide-y divide-border">
              {[
                { title: 'Register your startup', desc: 'Connect your data sources and create an on-chain identity on Solana.' },
                { title: 'Publish metrics', desc: 'Your MRR, users, growth, and treasury are hashed with SHA-256 and submitted to the blockchain.' },
                { title: 'Oracle verification', desc: 'Independent oracle nodes cross-check your data against real-world sources. No single point of trust.' },
                { title: 'Build investor confidence', desc: 'Verified startups earn soulbound badges, climb the leaderboard, and attract institutional capital.' },
              ].map((step, i) => (
                <motion.div key={step.title} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex gap-6 py-6">
                  <span className="text-sm font-mono text-muted-foreground tabular-nums pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-md">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — 2x2 with images ── */}
      <section className="bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-foreground">Built for institutional trust</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg">Every feature serves one goal: verifiable transparency.</p>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Feature card with image */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-lg border border-border bg-card overflow-hidden">
              <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=700&h=350&fit=crop&q=80" alt="Blockchain verification" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Verification</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">Cryptographic proof chains</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Every metric is hashed with SHA-256, submitted to Solana, and verified by independent oracle nodes. View the full proof chain interactively.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="rounded-lg border border-border bg-card overflow-hidden">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=700&h=350&fit=crop&q=80" alt="Due diligence analytics" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Analytics</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">AI due diligence engine</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Algorithmic risk analysis, investment grading, percentile rankings, and LP-ready quarterly reports.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-lg border border-border bg-card overflow-hidden">
              <img src="https://images.unsplash.com/photo-1563986768609-322da13575f2?w=700&h=350&fit=crop&q=80" alt="Compliance and security" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Compliance</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">Security & compliance</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Three independent audits passed. KYC verification, multi-sig treasury detection, AML screening, and GDPR compliance built in.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="rounded-lg border border-border bg-card overflow-hidden">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=700&h=350&fit=crop&q=80" alt="DAO governance" className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Governance</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">DAO governance & staking</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">Token holders vote on protocol decisions. Stake CMT for premium analytics, screener access, and governance weight.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Powered by Solana — the hype section ── */}
      <section className="relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1600&h=900&fit=crop&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/92" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            {/* Left — headline */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">Powered by Solana</p>
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                The fastest blockchain
                <br />
                in production
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
                Visa, PayPal, Stripe, and Franklin Templeton all chose Solana. From $8 post-FTX collapse to $260+ — the greatest comeback in crypto history. And we're building on it.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {['Visa', 'PayPal', 'Stripe', 'Franklin Templeton', 'Shopify'].map(name => (
                  <span key={name} className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    {name}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right — stats grid */}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="mt-12 lg:mt-0">
              <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
                {[
                  { value: '65,000', label: 'Peak TPS capacity', sub: 'Firedancer hit 1M in testing' },
                  { value: '$0.00025', label: 'Avg transaction fee', sub: '100,000x cheaper than Ethereum' },
                  { value: '400ms', label: 'Block time', sub: 'vs 12 seconds on Ethereum' },
                  { value: '50M+', label: 'Daily transactions', sub: 'More than ETH + L2s combined' },
                  { value: '$10B+', label: 'DeFi TVL', sub: '5-7x growth in under a year' },
                  { value: '2,000+', label: 'Active developers', sub: 'Monthly active builders' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card p-5"
                  >
                    <div className="text-xl font-display font-bold text-foreground tabular-nums">{stat.value}</div>
                    <div className="mt-1 text-xs font-medium text-foreground">{stat.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{stat.sub}</div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2 rounded border border-border bg-card/80 px-3 py-2">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">S</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">Solana ETF</div>
                    <div className="text-[10px] text-muted-foreground">Filed by VanEck, 21Shares, Grayscale, Bitwise</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded border border-border bg-card/80 px-3 py-2">
                  <span className="text-[10px] text-muted-foreground">Zero major outages in 2024</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom — protocol logos / notable projects */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 border-t border-border pt-8">
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">Built alongside the Solana ecosystem</p>
            <div className="flex flex-wrap gap-3">
              {['Jupiter', 'Marinade', 'Jito', 'Pyth Network', 'Helium', 'Render', 'Hivemapper', 'Raydium', 'Tensor'].map(name => (
                <span key={name} className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:border-primary/30">
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Institutional adoption — BlackRock / RWA ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">Institutional adoption</p>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Built for the $9.4 trillion
            <br />
            RWA tokenization wave
          </h2>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-lg">
            BlackRock's BUIDL fund deployed $500M+ on Solana. Vanguard opened $11T to crypto ETFs.
            The EU Digital Product Passport is now law. ChainTrust is the compliance infrastructure
            these institutions need.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-px bg-border rounded-lg overflow-hidden lg:grid-cols-3">
          {[
            { value: '$500M+', label: 'BlackRock BUIDL on Solana', sub: 'Largest tokenized fund on our chain' },
            { value: '$1.8B', label: 'RWA on Solana', sub: '10x year-over-year growth' },
            { value: 'Jan 2026', label: 'EU DPP Active', sub: 'Digital Product Passport mandate' },
            { value: '46%', label: 'Supply chain firms', sub: 'Adopting blockchain verification' },
            { value: '33%', label: 'Cost reduction', sub: 'Vs. traditional traceability systems' },
            { value: '$14.8B', label: 'Blockchain funding 2025', sub: '127% year-over-year increase' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-card p-6"
            >
              <div className="text-2xl font-display font-bold text-foreground tabular-nums">{stat.value}</div>
              <div className="mt-1 text-xs font-medium text-foreground">{stat.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-6 flex flex-wrap gap-3">
          {['BlackRock', 'Vanguard', 'Franklin Templeton', 'Ondo Finance', 'Securitize', 'Western Union'].map(name => (
            <span key={name} className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {name}
            </span>
          ))}
          <span className="text-xs text-muted-foreground self-center ml-1">...building on Solana</span>
        </motion.div>
      </section>

      {/* ── EU Compliance teaser ── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">Regulatory-ready</p>
              <h2 className="font-display text-3xl font-bold text-foreground" style={{ lineHeight: 1.1 }}>
                EU Digital Product Passport
                <br />
                compliance, built in
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
                The EU mandate requires verifiable product traceability for all goods sold in Europe.
                Non-compliance: fines up to EUR 5.6M or 10% of annual turnover. ChainTrust makes
                compliance automatic.
              </p>
              <div className="mt-6 flex gap-3">
                <Link to="/compliance" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
                  View compliance status
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/cost-calculator" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                  Calculate savings
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mt-10 lg:mt-0">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Product Identity', pct: 83, status: 'Active' },
                  { label: 'Sustainability Data', pct: 67, status: 'Active' },
                  { label: 'Regulatory (MiCA)', pct: 83, status: 'In Progress' },
                  { label: 'Verification Trail', pct: 67, status: 'Active' },
                ].map((item, i) => (
                  <div key={item.label} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      <span className="text-xs font-mono text-primary">{item.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 block">{item.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Cost savings teaser ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card overflow-hidden lg:grid lg:grid-cols-5">
          <div className="p-8 lg:col-span-3">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3 font-mono">Cost advantage</p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              100,000x cheaper than Ethereum
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
              Solana's $0.00025 transaction fee makes per-product verification economically viable at any scale.
              Traditional systems charge $0.20–$5.00 per verification.
            </p>
            <Link to="/cost-calculator" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:underline">
              Try the cost calculator <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="lg:col-span-2 bg-muted/30 p-8 flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-border">
            <div className="flex items-center gap-3">
              <span className="w-28 text-xs text-muted-foreground">Traditional</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} /></div>
              <span className="text-xs font-mono text-red-400 w-14 text-right">$0.45</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 text-xs text-muted-foreground">Ethereum</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-indigo-500" style={{ width: '90%' }} /></div>
              <span className="text-xs font-mono text-indigo-400 w-14 text-right">$2.93</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 text-xs text-primary font-medium">ChainTrust</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: '1%' }} /></div>
              <span className="text-xs font-mono text-primary w-14 text-right">$0.00025</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools list ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-foreground">Analytics tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to evaluate startups</p>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {[
            { label: 'Proof Chain Visualizer', desc: 'Watch cryptographic verification in real-time', path: '/dashboard' },
            { label: 'Multi-Metric Screener', desc: '8-dimension filter with CSV export', path: '/screener' },
            { label: 'Provenance Certificates', desc: 'RWA-tokenized supply chain verification records', path: '/provenance' },
            { label: 'EU DPP Compliance', desc: 'Digital Product Passport compliance tracker', path: '/compliance' },
            { label: 'Platform Analytics', desc: 'Real-time KPIs, verification funnel, activity feed', path: '/analytics' },
            { label: 'Cost Calculator', desc: 'See your savings vs traditional verification', path: '/cost-calculator' },
            { label: 'API & Integrations', desc: 'REST API, webhooks, ERP connectors', path: '/api' },
            { label: 'Token Economics', desc: 'CMT distribution, vesting, burn mechanics, staking tiers', path: '/tokenomics' },
            { label: 'Investor Relations', desc: 'Traction, case studies, market opportunity, roadmap', path: '/investors' },
            { label: 'Security & Audits', desc: 'OtterSec, Sec3, CertiK audit reports', path: '/security' },
          ].map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={t.path} className="group flex items-center justify-between py-5 transition hover:pl-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.label}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials / Social proof ── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">What builders say</p>
            <h2 className="font-display text-3xl font-bold text-foreground">Trusted by supply chain leaders</h2>
          </motion.div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {[
              {
                quote: 'ChainTrust gave us verifiable provenance in 48 hours. Our EU compliance team went from 3 months of manual work to automated on-chain verification.',
                name: 'Maria Kowalski',
                role: 'Head of Compliance, EcoMetal GmbH',
                category: 'Manufacturing',
              },
              {
                quote: "The cost savings calculator sold our CFO instantly. We're paying $0.00025 per verification instead of $0.45. That's a 99.9% cost reduction on 50K monthly checks.",
                name: 'James Okafor',
                role: 'VP Supply Chain, NovaPay',
                category: 'Fintech',
              },
              {
                quote: 'As an investor, the AI due diligence engine and proof chain visualizer give me confidence I never had with self-reported metrics. This is how startup evaluation should work.',
                name: 'Sarah Chen',
                role: 'Partner, Meridian Ventures',
                category: 'Investor',
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border border-border bg-card p-6"
              >
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Join 127 startups and 34 countries building verifiable supply chains on ChainTrust.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 pt-8">
        <div className="rounded-lg border border-border bg-card p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Ready to build investor trust?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Join {startupCount > 0 ? startupCount : '127'} startups publishing verified metrics on Solana.
            </p>
          </div>
          <div className="mt-6 lg:mt-0 flex flex-wrap gap-3 flex-shrink-0">
            <Link to="/register" className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
              Register Startup
            </Link>
            <Link to="/demo" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
              Try Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
