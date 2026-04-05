import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Shield, Zap, Award, BarChart3, Layers, Globe, ArrowRight, CheckCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const steps = [
  { icon: Layers, title: 'Register', desc: 'Connect data sources and register your startup on-chain' },
  { icon: Zap, title: 'Publish', desc: 'Publish metrics with SHA-256 proof hashes to Solana' },
  { icon: Shield, title: 'Verify', desc: 'Oracle nodes cross-verify data against real-world sources' },
  { icon: BarChart3, title: 'Grow', desc: 'Investors discover and trust your verified startup' },
];

const features = [
  { icon: Shield, title: 'Cryptographic Proofs', desc: 'Every metric is hashed with SHA-256 and stored on Solana. View the full proof chain interactively.', span: true },
  { icon: CheckCircle, title: 'Oracle Verification', desc: 'Independent oracle nodes cross-check metrics against real-world data sources.' },
  { icon: Award, title: 'Soulbound Badges', desc: 'Non-transferable reputation badges stored as PDAs on Solana.' },
  { icon: BarChart3, title: 'DAO Governance', desc: 'Token holders vote on protocol decisions. Transparent, on-chain, verifiable.' },
  { icon: Layers, title: 'Staking & Tiers', desc: 'Stake CMT tokens to unlock Screener, API access, and premium analytics.' },
  { icon: Globe, title: 'Impact-Weighted P&L', desc: 'True profitability after accounting for environmental externalities.' },
];

const tools = [
  { label: 'Proof Chain Visualizer', desc: 'Watch cryptographic verification in real-time', path: '/dashboard' },
  { label: 'Multi-Metric Screener', desc: '8-dimension filter with CSV export', path: '/screener' },
  { label: 'AI Due Diligence', desc: 'Algorithmic risk analysis and investment grading', path: '/dashboard' },
  { label: 'Network Pulse', desc: 'Live Solana TPS, slot progression, block time', path: '/dashboard' },
  { label: 'LP Report Generator', desc: 'Institutional quarterly PDF reports', path: '/dashboard' },
  { label: 'Compliance Dashboard', desc: 'KYC, audit, multi-sig verification per startup', path: '/security' },
];

export default function Landing() {
  const { data: startups } = useStartups();
  const startupCount = startups?.length ?? 0;
  const totalMrr = startups?.reduce((s, x) => s + x.mrr, 0) ?? 0;
  const totalCarbon = startups?.reduce((s, x) => s + Number(x.carbon_offset_tonnes), 0) ?? 0;

  const dynamicStats = [
    { label: 'Startups Tracked', value: startupCount > 0 ? `${startupCount}+` : '127+' },
    { label: 'MRR Verified', value: totalMrr > 0 ? formatCurrency(totalMrr) + '+' : '$45M+' },
    { label: 'Carbon Offset', value: totalCarbon > 0 ? `${formatNumber(totalCarbon)}t` : '560t+' },
    { label: 'Network', value: 'Solana' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center px-4 py-24 ambient-glow">
        {/* Ambient gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px] animate-float" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/[0.05] blur-[100px] animate-float-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-primary/[0.03] blur-[80px] animate-pulse-glow" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="text-muted-foreground">Built on <span className="font-semibold text-foreground">Solana</span></span>
          </motion.div>

          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="visible" className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-5xl">
            Transparent Startup Metrics,{' '}
            <span className="gradient-text">Verified On-Chain</span>
          </motion.h1>

          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed">
            ChainTrust brings radical transparency to startup fundraising. Publish metrics on Solana, get verified by oracles, and build investor trust with cryptographic proof chains.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground btn-glow transition hover:bg-primary/90">
              Explore Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/demo" className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-3 font-semibold text-primary transition hover:bg-primary/10 hover:border-primary/50">
              Try Interactive Demo
            </Link>
            <Link to="/register" className="rounded-xl border border-border px-6 py-3 font-semibold text-foreground transition hover:border-primary/40 hover:text-primary">
              Register Startup
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {dynamicStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center">
              <div className="text-2xl font-bold text-foreground tabular-nums">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">How it Works</h2>
          <p className="mt-2 text-muted-foreground">Four steps to verified startup metrics</p>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="relative rounded-2xl border border-border bg-card p-6 text-center transition hover:border-primary/20 hover:shadow-glow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 text-[10px] font-bold text-primary uppercase tracking-wider">Step {i + 1}</div>
              <h3 className="mt-1 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section className="bg-surface/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Built for Trust</h2>
            <p className="mt-2 text-muted-foreground">Institutional-grade transparency infrastructure</p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-glow-sm ${f.span ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition group-hover:bg-primary/15">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Tools */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Powerful Analytics Tools</h2>
          <p className="mt-2 text-muted-foreground">Everything you need to evaluate startups with confidence</p>
        </motion.div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link to={t.path} className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/20 hover:bg-primary/[0.02]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0 mt-0.5">
                  <ArrowRight className="h-3.5 w-3.5 text-primary transition group-hover:translate-x-0.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{t.label}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl p-12 text-center noise-overlay">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white">Ready to Build Investor Trust?</h2>
            <p className="mx-auto mt-4 max-w-md text-white/70">
              Join {startupCount > 0 ? `${startupCount}+` : '127+'} startups already publishing verified metrics on Solana.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="rounded-xl bg-white px-6 py-3 font-semibold text-primary transition hover:bg-white/90 shadow-lg">
                Register Now
              </Link>
              <Link to="/demo" className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
                Try Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
