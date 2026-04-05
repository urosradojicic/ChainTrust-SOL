import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const enter = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const steps = [
  { num: '01', title: 'Register', desc: 'Connect data sources and register on-chain' },
  { num: '02', title: 'Publish', desc: 'SHA-256 hash your metrics to Solana' },
  { num: '03', title: 'Verify', desc: 'Oracle nodes cross-check against real data' },
  { num: '04', title: 'Grow', desc: 'Investors discover your verified startup' },
];

const features = [
  { title: 'Cryptographic Proofs', desc: 'Every metric hashed with SHA-256 and stored on Solana. View the full proof chain.' },
  { title: 'Oracle Verification', desc: 'Independent oracle nodes cross-check metrics against real-world data sources.' },
  { title: 'AI Due Diligence', desc: 'Algorithmic risk analysis, investment grading, and institutional-grade reports.' },
  { title: 'Soulbound Badges', desc: 'Non-transferable reputation badges stored as PDAs on Solana.' },
  { title: 'DAO Governance', desc: 'Token holders vote on protocol decisions. On-chain, transparent, verifiable.' },
  { title: 'Compliance Dashboard', desc: 'KYC, audit status, multi-sig treasury verification per startup.' },
];

const tools = [
  { label: 'Proof Chain Visualizer', desc: 'Watch cryptographic verification in real-time', path: '/dashboard' },
  { label: 'Multi-Metric Screener', desc: '8-dimension filter with CSV export', path: '/screener' },
  { label: 'LP Report Generator', desc: 'Institutional quarterly PDF reports', path: '/dashboard' },
  { label: 'Startup Comparison', desc: 'Radar charts across 9 metrics', path: '/compare' },
  { label: 'Security & Audits', desc: 'OtterSec, Sec3, CertiK audit reports', path: '/security' },
  { label: 'Fund Flow Analysis', desc: 'Treasury inflow/outflow visualization', path: '/dashboard' },
];

export default function Landing() {
  const { data: startups } = useStartups();
  const startupCount = startups?.length ?? 0;
  const totalMrr = startups?.reduce((s, x) => s + x.mrr, 0) ?? 0;
  const totalCarbon = startups?.reduce((s, x) => s + Number(x.carbon_offset_tonnes), 0) ?? 0;

  return (
    <div>
      {/* ── Hero ── */}
      <section className="px-4 pt-20 pb-16 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-3xl">
          <motion.p custom={0} variants={enter} initial="hidden" animate="visible" className="text-sm font-medium text-primary mb-4">
            On-chain startup verification
          </motion.p>
          <motion.h1 custom={1} variants={enter} initial="hidden" animate="visible" className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            The trust layer for{' '}
            <span className="text-primary">startup fundraising</span>
          </motion.h1>
          <motion.p custom={2} variants={enter} initial="hidden" animate="visible" className="mt-5 max-w-xl text-base text-muted-foreground leading-relaxed">
            Publish metrics on Solana, get verified by oracles, and build investor trust with cryptographic proof chains. No black boxes.
          </motion.p>
          <motion.div custom={3} variants={enter} initial="hidden" animate="visible" className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Explore Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/demo" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
              Try Demo
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats — asymmetric, left-aligned ── */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            {[
              { label: 'Startups tracked', value: startupCount > 0 ? `${startupCount}` : '127' },
              { label: 'MRR verified', value: totalMrr > 0 ? formatCurrency(totalMrr) : '$45M' },
              { label: 'Carbon offset', value: totalCarbon > 0 ? `${formatNumber(totalCarbon)}t` : '560t' },
              { label: 'Network', value: 'Solana' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="text-xl font-bold text-foreground tabular-nums">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works — horizontal numbered steps ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground">How it works</h2>
        <div className="mt-8 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden border border-border">
          {steps.map((s, i) => (
            <motion.div key={s.num} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-card p-6">
              <span className="text-xs font-mono text-muted-foreground">{s.num}</span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features — 2-column with left heading ── */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-foreground">Built for institutional trust</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Every feature is designed around one principle: verifiable transparency for investors.
              </p>
            </div>
            <div className="mt-8 lg:mt-0 lg:col-span-3">
              <div className="grid gap-6 sm:grid-cols-2">
                {features.map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tools — list, not grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground">Analytics tools</h2>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to evaluate startups with confidence</p>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {tools.map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={t.path} className="group flex items-center justify-between py-4 transition hover:bg-secondary/30 -mx-4 px-4 rounded">
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{t.label}</h3>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA — minimal, no gradient ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ready to build investor trust?</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Join {startupCount > 0 ? startupCount : '127'} startups publishing verified metrics on Solana.
            </p>
          </div>
          <div className="mt-6 lg:mt-0 flex flex-wrap gap-3">
            <Link to="/register" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
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
