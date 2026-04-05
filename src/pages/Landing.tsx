import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.5 },
  }),
};

const steps = [
  { icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', title: 'Register', desc: 'Register your startup and connect data sources' },
  { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', title: 'Publish', desc: 'Publish metrics on-chain with SHA-256 proof hashes' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Verify', desc: 'Chainlink oracles cross-verify your data independently' },
  { icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', title: 'Grow', desc: 'Investors discover and trust verified startups' },
];

const features = [
  { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'Cryptographic Proofs', desc: 'Every metric is hashed with SHA-256 and stored on Solana. View the full proof chain interactively.' },
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Oracle Verification', desc: 'Independent oracle nodes cross-check metrics against real-world data sources.' },
  { icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', title: 'Soulbound Badges', desc: 'Earn non-transferable reputation badges stored as PDAs on Solana.' },
  { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', title: 'DAO Governance', desc: 'Token holders vote on protocol decisions. Transparent, on-chain, verifiable.' },
  { icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', title: 'Staking & Tiers', desc: 'Stake CMT tokens to unlock Screener, Alerts, API access, and premium analytics.' },
  { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064', title: 'Impact-Weighted P&L', desc: 'See true profitability after accounting for environmental externalities.' },
];

const tools = [
  { label: 'Proof Chain Visualizer', desc: 'Watch the cryptographic verification flow in real-time', path: '/dashboard' },
  { label: 'Multi-Metric Screener', desc: '8-dimension filter with CSV export', path: '/screener' },
  { label: 'Startup Comparison', desc: 'Radar chart + table across 9 metrics', path: '/compare' },
  { label: 'Network Pulse', desc: 'Live Solana TPS, slot progression, block time', path: '/dashboard' },
  { label: 'Ecosystem Heatmap', desc: 'Visual treemap sized by MRR, colored by sustainability', path: '/dashboard' },
  { label: 'Trust Score Engine', desc: 'Transparent algorithm breakdown per factor', path: '/dashboard' },
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
    { label: 'On Solana', value: 'Devnet' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] items-center justify-center px-4 py-24">
        <video autoPlay loop muted playsInline className="pointer-events-none absolute inset-0 h-full w-full object-cover" src="/hero-bg.mp4" />
        <div className="pointer-events-none absolute inset-0 bg-background/75 backdrop-blur-[2px]" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible" className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Transparent Startup Metrics,{' '}
            <span className="gradient-text">Verified On-Chain</span>
          </motion.h1>
          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            ChainTrust brings radical transparency to startup fundraising. Publish metrics on Solana, get verified by oracles, and build investor trust with cryptographic proof chains.
          </motion.p>
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/dashboard" className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90">
              Explore Dashboard
            </Link>
            <Link to="/demo" className="rounded-xl border border-primary/30 bg-primary/10 px-6 py-3 font-semibold text-primary transition hover:bg-primary/20">
              Try Interactive Demo
            </Link>
            <Link to="/register" className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-foreground transition hover:border-primary hover:text-primary">
              Register Startup
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          {dynamicStats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-3xl font-bold text-foreground">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-foreground">How it Works</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.1 }} className="rounded-2xl glass-card p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
              </div>
              <div className="mt-3 text-xs font-semibold text-primary">Step {i + 1}</div>
              <h3 className="mt-1 text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-foreground">Built for Trust</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: i * 0.08 }} className="rounded-2xl glass-card p-6 transition hover:shadow-lg hover:shadow-primary/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={f.icon} /></svg>
                </div>
                <h3 className="mt-4 font-bold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Tools Showcase */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-foreground">Powerful Analytics Tools</h2>
        <p className="mt-2 text-center text-muted-foreground">Everything you need to evaluate startups with confidence</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link to={t.path} className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/30 hover:bg-primary/5">
                <h3 className="font-bold text-foreground">{t.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-primary to-cyan-700 p-12 text-center shadow-xl shadow-primary/20">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to Build Investor Trust?</h2>
          <p className="mx-auto mt-4 max-w-md text-cyan-200">
            Join {startupCount > 0 ? `${startupCount}+` : '127+'} startups already publishing verified metrics on Solana.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register" className="rounded-xl bg-background px-6 py-3 font-semibold text-primary transition hover:bg-background/90">Register Now</Link>
            <Link to="/demo" className="rounded-xl border border-primary-foreground/40 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-foreground/10">Try Demo</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
