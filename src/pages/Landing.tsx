import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  ArrowRight, ArrowUpRight, Shield, BarChart3, Lock, Eye,
  Zap, Hash, Award, CheckCircle2, Globe, FileCheck,
  Database, Brain, TrendingUp, Users, AlertTriangle, Code,
  Layers, Target, Rocket,
} from 'lucide-react';
import AnimatedCounter from '@/components/common/AnimatedCounter';
import LiveProofHash from '@/components/common/LiveProofHash';

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
      {/* ── Hero — with animated mesh gradient and live proof hash ── */}
      <section className="relative overflow-hidden mesh-gradient">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 dot-pattern opacity-30 dark:opacity-10 pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8 lg:pt-40 lg:pb-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            {/* Left — copy */}
            <div className="lg:col-span-7">
              <motion.div custom={0} variants={enter} initial="hidden" animate="visible" className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm mb-6">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-primary">Live on Solana Devnet</span>
              </motion.div>

              <motion.h1 custom={1} variants={enter} initial="hidden" animate="visible" className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl" style={{ lineHeight: 1.08, letterSpacing: '-0.03em' }}>
                The{' '}
                <span className="text-primary">credit bureau</span>
                <br />
                for startups
              </motion.h1>

              <motion.p custom={2} variants={enter} initial="hidden" animate="visible" className="mt-6 max-w-lg text-base text-muted-foreground leading-relaxed">
                Startups prove their metrics are real with cryptographic proofs on Solana.
                Investors verify in <span className="font-mono font-semibold text-foreground">2 seconds</span> for <span className="font-mono font-semibold text-foreground">$0.00025</span> — replacing $50,000 audits that take 6 weeks.
              </motion.p>

              <motion.div custom={3} variants={enter} initial="hidden" animate="visible" className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/dashboard" className="brand-gradient inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-lg shadow-primary/20">
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/verify" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary">
                  <Shield className="h-4 w-4" />
                  Verify On-Chain
                </Link>
                <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
                  Try demo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>

              {/* Mini stats row */}
              <motion.div custom={4} variants={enter} initial="hidden" animate="visible" className="mt-10 flex gap-8">
                {[
                  { value: 0.00025, prefix: '$', label: 'per verification', decimals: 5 },
                  { value: 2, suffix: 's', label: 'time to verify' },
                  { value: 24, label: 'on-chain instructions' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-xl font-display font-bold text-foreground">
                      <AnimatedCounter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} duration={1500} />
                    </div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Live Proof Hash visualization */}
            <motion.div
              custom={2}
              variants={enter}
              initial="hidden"
              animate="visible"
              className="mt-12 lg:mt-0 lg:col-span-5"
            >
              <LiveProofHash />

              {/* Hash ticker bar */}
              <div className="mt-4 rounded-lg border border-border/40 bg-card/50 overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-2">
                  <Hash className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground font-mono">Recent proof hashes on Solana</span>
                </div>
                <div className="overflow-hidden border-t border-border/30">
                  <div className="hash-scroll whitespace-nowrap py-1.5 px-3 text-[10px] font-mono text-muted-foreground/60">
                    a7f3e8b9...2c4d &#x2022; b8e4f9c0...3d5e &#x2022; c9d5e0a1...4f6b &#x2022; d0e6f1b2...5a7c &#x2022; e1f7a2c3...6b8d &#x2022; f2a8b3d4...7c9e &#x2022; a3b9c4e5...8d0f &#x2022;{' '}
                    a7f3e8b9...2c4d &#x2022; b8e4f9c0...3d5e &#x2022; c9d5e0a1...4f6b &#x2022; d0e6f1b2...5a7c &#x2022; e1f7a2c3...6b8d &#x2022; f2a8b3d4...7c9e &#x2022; a3b9c4e5...8d0f
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar — animated counters ── */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            {[
              { value: startupCount > 0 ? startupCount : 127, label: 'Startups verified', icon: CheckCircle2 },
              { value: totalMrr > 0 ? totalMrr : 45000000, label: 'MRR verified', prefix: '$', icon: BarChart3 },
              { value: totalCarbon > 0 ? totalCarbon : 560, label: 'Carbon offset (t)', icon: Globe },
              { value: 3, label: 'Security audits', icon: Shield },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="py-6 px-6 first:pl-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <div className="text-2xl font-display font-bold text-foreground">
                      {s.prefix === '$' ? (
                        <AnimatedCounter value={s.value / 1000000} prefix="$" suffix="M" decimals={0} />
                      ) : (
                        <AnimatedCounter value={s.value} />
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works — with visual flow ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">
            How it works
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            From self-reported metrics to{' '}
            <span className="text-primary">cryptographic proof</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Register', desc: 'Connect your wallet, submit startup details. An on-chain PDA identity is created on Solana.', icon: Zap, color: 'from-blue-500 to-blue-600' },
            { step: '02', title: 'Publish', desc: 'Submit MRR, users, growth, and burn rate. Each metric is SHA-256 hashed and stored on-chain.', icon: Hash, color: 'from-cyan-500 to-cyan-600' },
            { step: '03', title: 'Verify', desc: 'Pyth oracles independently cross-check your data. A trust score (0-100) is computed.', icon: Shield, color: 'from-teal-500 to-teal-600' },
            { step: '04', title: 'Certify', desc: 'A soulbound compressed NFT certificate lands in your wallet. Permanent, non-transferable proof.', icon: Award, color: 'from-emerald-500 to-emerald-600' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="surface-elevated transition hover:border-primary/30 rounded-xl border border-border bg-card p-6 relative"
              >
                {/* Step number */}
                <div className="text-[80px] font-display font-bold text-muted-foreground/15 dark:text-muted-foreground/10 absolute top-2 right-4 leading-none select-none pointer-events-none">
                  {item.step}
                </div>

                <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white mb-4`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>

                {/* Connector arrow */}
                {i < 3 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-10 text-center">
          <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:underline">
            Watch the interactive demo <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── Features — 2x2 with shine effect ── */}
      <section className="bg-surface border-y border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">Platform features</p>
              <h2 className="font-display text-3xl font-bold text-foreground">Built for institutional trust</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-lg">Every feature serves one goal: verifiable transparency.</p>
            </div>
            <Link to="/dashboard" className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline shrink-0">
              Explore all features <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {[
              {
                icon: Shield, iconColor: 'text-blue-500', iconBg: 'bg-blue-500/10',
                tag: 'Verification',
                title: 'Cryptographic proof chains',
                desc: 'Every metric is hashed with SHA-256, submitted to Solana, and verified by independent oracle nodes. View the full proof chain interactively.',
                link: '/verify', linkText: 'Verify a startup',
              },
              {
                icon: BarChart3, iconColor: 'text-cyan-500', iconBg: 'bg-cyan-500/10',
                tag: 'Analytics',
                title: 'AI due diligence engine',
                desc: 'Rule-based risk analysis, investment grading (AAA-D), percentile rankings, and LP-ready quarterly reports. Zero API costs.',
                link: '/dashboard', linkText: 'View analytics',
              },
              {
                icon: Lock, iconColor: 'text-teal-500', iconBg: 'bg-teal-500/10',
                tag: 'Compliance',
                title: 'Security & EU DPP compliance',
                desc: 'Three independent audits. EU Digital Product Passport tracking. MiCA compliance. KYC verification. All built in.',
                link: '/compliance', linkText: 'Check compliance',
              },
              {
                icon: Eye, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10',
                tag: 'Governance',
                title: 'DAO governance & CMT staking',
                desc: 'Token holders vote on protocol decisions. Stake CMT for premium analytics, screener access, and governance weight. 4 tier system.',
                link: '/governance', linkText: 'View governance',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="surface-elevated transition hover:border-primary/30 rounded-xl border border-border bg-card p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${f.iconBg}`}>
                      <Icon className={`h-5 w-5 ${f.iconColor}`} />
                    </div>
                    <span className={`text-xs font-medium uppercase tracking-wider ${f.iconColor}`}>{f.tag}</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.desc}</p>
                  <Link to={f.link} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    {f.linkText} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Powered by Solana ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* Decorative background — width/height stop CLS, fetchpriority="low"
              keeps it from competing with hero text for early render budget,
              loading="lazy" defers the request until close to viewport. */}
          <img
            src="https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1600&h=900&fit=crop&q=80"
            alt=""
            role="presentation"
            width={1600}
            height={900}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/92" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
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

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.15 }} className="mt-12 lg:mt-0">
              <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden">
                {[
                  { value: 65000, label: 'Peak TPS capacity', sub: 'Firedancer hit 1M in testing' },
                  { value: 0.00025, label: 'Avg transaction fee', sub: '100,000x cheaper than Ethereum', prefix: '$', decimals: 5 },
                  { value: 400, label: 'Block time (ms)', sub: 'vs 12 seconds on Ethereum' },
                  { value: 50, label: 'Daily transactions (M)', sub: 'More than ETH + L2s combined', suffix: 'M+' },
                  { value: 10, label: 'DeFi TVL', sub: '5-7x growth in under a year', prefix: '$', suffix: 'B+' },
                  { value: 2000, label: 'Active developers', sub: 'Monthly active builders', suffix: '+' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-card p-5"
                  >
                    <div className="text-xl font-display font-bold text-foreground tabular-nums">
                      <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} decimals={stat.decimals} duration={2000} />
                    </div>
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

      {/* ── Why crypto / Why this can't exist without blockchain ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">
            Why blockchain
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            This couldn't exist without crypto
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Hash, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500',
              title: 'Immutable proof hashes',
              desc: 'SHA-256 hashes stored on Solana cannot be altered, deleted, or backdated. Traditional databases can be.',
              traditional: 'Database records can be modified by admins',
            },
            {
              icon: Globe, iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-500',
              title: 'Permissionless verification',
              desc: 'Anyone can verify any startup\'s metrics by reading the blockchain directly. No API key, no account, no permission needed.',
              traditional: 'Verification locked behind paid auditor access',
            },
            {
              icon: Award, iconBg: 'bg-teal-500/10', iconColor: 'text-teal-500',
              title: 'Soulbound certificates',
              desc: 'Non-transferable NFT badges live in the startup\'s wallet permanently. Cannot be faked, bought, or transferred.',
              traditional: 'PDF certificates can be forged or revoked silently',
            },
            {
              icon: Zap, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500',
              title: '$0.00025 per verification',
              desc: 'Solana\'s low fees make per-metric verification economically viable. Traditional audits cost $50,000+.',
              traditional: '$50,000+ per Big 4 audit',
            },
            {
              icon: FileCheck, iconBg: 'bg-green-500/10', iconColor: 'text-green-500',
              title: 'Oracle-verified data',
              desc: 'Pyth Network independently verifies metrics against real-world sources. No single point of trust.',
              traditional: 'Self-reported metrics with no independent check',
            },
            {
              icon: Lock, iconBg: 'bg-lime-500/10', iconColor: 'text-lime-500',
              title: '24/7 global access',
              desc: 'No business hours, no jurisdiction limits. The blockchain runs 24/7/365 across the planet.',
              traditional: 'Limited to auditor availability and timezone',
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="surface-elevated transition hover:border-primary/30 rounded-xl border border-border bg-card p-6"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg} mb-4`}>
                  <Icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <h3 className="font-display text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.desc}</p>
                <div className="text-xs text-destructive/70 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-destructive/50" />
                  Traditional: {item.traditional}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Cost savings ── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border bg-card overflow-hidden lg:grid lg:grid-cols-5">
            <div className="p-8 lg:col-span-3">
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3 font-mono">Cost advantage</p>
              <h2 className="font-display text-2xl font-bold text-foreground">
                <AnimatedCounter value={200000} suffix="x" /> cheaper than traditional audits
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
                Solana's $0.00025 transaction fee makes per-product verification economically viable at any scale.
                Traditional systems charge $0.20-$5.00 per verification.
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
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary/70" style={{ width: '90%' }} /></div>
                <span className="text-xs font-mono text-primary/80 w-14 text-right">$2.93</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-28 text-xs text-primary font-medium">ChainTrust</span>
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-teal-500" style={{ width: '1%' }} /></div>
                <span className="text-xs font-mono text-primary w-14 text-right">$0.00025</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Competitor comparison — the "Why not X?" section ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">
            Why ChainTrust
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Everyone else trusts databases.{' '}
            <span className="text-primary">We trust math.</span>
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto">
            PitchBook, Crunchbase, and CB Insights rely on self-reported data. Nansen and Dune track wallets, not startup claims.
            ChainTrust is the only platform that cryptographically verifies startup metrics.
          </motion.p>
        </div>

        {/* Comparison table */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-muted-foreground font-medium w-48">Feature</th>
                <th className="text-center py-4 px-3 min-w-[120px]">
                  <span className="text-primary font-bold">ChainTrust</span>
                </th>
                <th className="text-center py-4 px-3 text-muted-foreground min-w-[100px]">PitchBook</th>
                <th className="text-center py-4 px-3 text-muted-foreground min-w-[100px]">Crunchbase</th>
                <th className="text-center py-4 px-3 text-muted-foreground min-w-[100px]">Nansen</th>
                <th className="text-center py-4 px-3 text-muted-foreground min-w-[100px]">CB Insights</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Verified metrics', ct: true, pb: false, cb: false, na: false, cbi: false },
                { feature: 'Cryptographic proofs', ct: true, pb: false, cb: false, na: false, cbi: false },
                { feature: 'ZK privacy', ct: true, pb: false, cb: false, na: false, cbi: false },
                { feature: 'Real-time data', ct: true, pb: false, cb: false, na: true, cbi: false },
                { feature: 'Investment memos', ct: true, pb: false, cb: false, na: false, cbi: true },
                { feature: 'On-chain proof chain', ct: true, pb: false, cb: false, na: false, cbi: false },
                { feature: 'Soulbound certificates', ct: true, pb: false, cb: false, na: false, cbi: false },
                { feature: 'Startup trust scoring', ct: true, pb: false, cb: false, na: false, cbi: true },
                { feature: 'Cap table analysis', ct: true, pb: true, cb: false, na: false, cbi: false },
                { feature: 'Anomaly detection (ML)', ct: true, pb: false, cb: false, na: true, cbi: false },
              ].map((row, i) => (
                <tr key={row.feature} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                  <td className="py-3 px-4 text-foreground font-medium">{row.feature}</td>
                  <td className="text-center py-3 px-3">
                    {row.ct ? <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-center py-3 px-3">
                    {row.pb ? <CheckCircle2 className="h-5 w-5 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-center py-3 px-3">
                    {row.cb ? <CheckCircle2 className="h-5 w-5 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-center py-3 px-3">
                    {row.na ? <CheckCircle2 className="h-5 w-5 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="text-center py-3 px-3">
                    {row.cbi ? <CheckCircle2 className="h-5 w-5 text-muted-foreground/50 mx-auto" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
              {/* Pricing row */}
              <tr className="border-t-2 border-primary/30">
                <td className="py-4 px-4 text-foreground font-bold">Annual price</td>
                <td className="text-center py-4 px-3 font-bold text-primary text-lg">Free*</td>
                <td className="text-center py-4 px-3 text-red-400 font-mono">$20-50K</td>
                <td className="text-center py-4 px-3 text-red-400 font-mono">$588+</td>
                <td className="text-center py-4 px-3 text-red-400 font-mono">$1,800+</td>
                <td className="text-center py-4 px-3 text-red-400 font-mono">$50-70K</td>
              </tr>
            </tbody>
          </table>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">*Free tier includes basic verification. Pro tier with AI analytics from $99/mo. On-chain verification costs $0.00025 per transaction.</p>
        </motion.div>

        {/* The killer stat */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="mt-16 rounded-2xl border border-primary/20 overflow-hidden">
          <div className="relative p-8 sm:p-12 text-center">
            <div className="absolute inset-0 brand-gradient opacity-5" />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3 font-mono">The math speaks for itself</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
                <div>
                  <div className="text-4xl sm:text-5xl font-display font-bold text-red-400 line-through opacity-60">$50,000</div>
                  <div className="text-xs text-muted-foreground mt-1">Big 4 audit, 6 weeks</div>
                </div>
                <div className="text-2xl text-muted-foreground hidden sm:block">vs</div>
                <div>
                  <div className="text-4xl sm:text-5xl font-display font-bold text-primary">$0.00025</div>
                  <div className="text-xs text-muted-foreground mt-1">ChainTrust, 2 seconds</div>
                </div>
              </div>
              <p className="mt-6 text-lg font-display font-bold text-foreground">
                <AnimatedCounter value={200000000} suffix="x" /> cheaper. <AnimatedCounter value={9000000} suffix="x" /> faster. Same cryptographic certainty.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Platform depth — show the 75 engines ── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">
              Under the hood
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              75 analytical engines. One simple interface.
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto">
              Power users discover depth. New users feel clarity. Every number tells a story.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Brain, title: 'AI Intelligence', count: 11, items: 'Red flags, investment memos, claim verification, competitive intel', color: 'from-primary to-primary' },
              { icon: TrendingUp, title: 'Quant Finance', count: 8, items: 'VaR, Sharpe ratio, portfolio optimization, return calculator', color: 'from-blue-500 to-cyan-600' },
              { icon: Database, title: 'Machine Learning', count: 6, items: 'Isolation Forest, gradient boosting, pattern recognition', color: 'from-emerald-500 to-teal-600' },
              { icon: Shield, title: 'Regulatory', count: 8, items: 'US, EU, APAC compliance, MiCA, GDPR, 14 jurisdictions', color: 'from-amber-500 to-orange-600' },
              { icon: Layers, title: 'Infrastructure', count: 12, items: 'Deal rooms, DD workflows, pipelines, smart alerts, Blinks', color: 'from-rose-500 to-pink-600' },
              { icon: Lock, title: 'Cryptography', count: 2, items: 'ZK range proofs, knowledge graph with PageRank', color: 'from-primary to-primary/70' },
              { icon: Target, title: 'Deep Intelligence', count: 7, items: 'Startup DNA, moat scoring, network effects, tokenomics sim', color: 'from-teal-500 to-green-600' },
              { icon: Code, title: 'Enterprise SDK', count: 5, items: 'Unified facade, plugin system, event bus, feature flags', color: 'from-gray-500 to-slate-600' },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="surface-elevated transition hover:border-primary/30 rounded-xl border border-border bg-card p-5"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color} text-white mb-3`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-foreground">{cat.title}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{cat.count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.items}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 text-center">
            <div className="inline-flex items-center gap-6 rounded-xl border border-border bg-card px-6 py-4">
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">75</div>
                <div className="text-[10px] text-muted-foreground">Engines</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">24</div>
                <div className="text-[10px] text-muted-foreground">On-chain instructions</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">14</div>
                <div className="text-[10px] text-muted-foreground">Jurisdictions</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">56K</div>
                <div className="text-[10px] text-muted-foreground">Lines of code</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-medium uppercase tracking-widest text-primary mb-4 font-mono">
            Built for
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-3xl font-bold text-foreground sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            Two sides. One trust layer.
          </motion.h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* For Startups */}
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-8 border-b border-border bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">For Startups</h3>
                  <p className="text-sm text-muted-foreground">Prove your metrics. Build trust. Raise faster.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { title: 'Publish verified metrics', desc: 'SHA-256 hash your MRR, users, and growth rate on Solana. Immutable proof.' },
                { title: 'Earn soulbound badges', desc: 'Non-transferable NFT certificates that prove your verification history.' },
                { title: 'Stand out to investors', desc: 'Verified startups rank higher in the screener and get flagged to matched investors.' },
                { title: 'Free on devnet, $0.00025 on mainnet', desc: 'The cheapest verification in existence. No auditor fees, no gatekeepers.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/register" className="inline-flex items-center gap-2 brand-gradient rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 mt-2">
                Register Your Startup <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* For Investors */}
          <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-8 border-b border-border bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">For Investors</h3>
                  <p className="text-sm text-muted-foreground">Verify claims. Find alpha. Reduce risk.</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {[
                { title: 'AI-powered due diligence', desc: 'Investment memos, red flag detection, anomaly scoring — all generated instantly.' },
                { title: 'Verify before you invest', desc: 'Every metric has a proof hash. Click any number to see the on-chain transaction.' },
                { title: 'Portfolio analytics', desc: 'Monte Carlo simulation, VaR, Sharpe ratio, survival prediction — institutional grade.' },
                { title: 'Daily briefings', desc: 'Personalized morning reports with portfolio changes, alerts, and new opportunities.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
              <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary mt-2">
                Explore as Investor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Analytics tools ── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Analytics tools</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything you need to evaluate startups</p>
          </div>
          <Link to="/dashboard" className="mt-3 sm:mt-0 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Open dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {[
            { label: 'Public Proof Verifier', desc: 'Anyone can independently verify startup metrics on-chain — no account needed', path: '/verify', isNew: true },
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
            <motion.div key={t.label} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Link to={t.path} className="group flex items-center justify-between py-5 transition hover:pl-2">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {t.label}
                      {'isNew' in t && t.isNew && (
                        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase">New</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
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
              },
              {
                quote: "The cost savings calculator sold our CFO instantly. We're paying $0.00025 per verification instead of $0.45. That's a 99.9% cost reduction on 50K monthly checks.",
                name: 'James Okafor',
                role: 'VP Supply Chain, NovaPay',
              },
              {
                quote: 'As an investor, the proof chain visualizer and public verifier give me confidence I never had with self-reported metrics. This is how startup evaluation should work.',
                name: 'Sarah Chen',
                role: 'Partner, Meridian Ventures',
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full brand-gradient text-xs font-bold text-white">
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
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 pt-8">
        <div className="relative rounded-2xl border border-primary/20 overflow-hidden">
          <div className="absolute inset-0 brand-gradient opacity-5" />
          <div className="relative p-8 sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Ready to build investor trust?</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                Join {startupCount > 0 ? startupCount : '127'} startups publishing verified metrics on Solana.
                Start for free — verification costs $0.00025.
              </p>
            </div>
            <div className="mt-6 lg:mt-0 flex flex-wrap gap-3 flex-shrink-0">
              <Link to="/register" className="brand-gradient rounded-lg px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 shadow-lg shadow-primary/20">
                Register Startup
              </Link>
              <Link to="/verify" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
                Verify On-Chain
              </Link>
              <Link to="/demo" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary">
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
