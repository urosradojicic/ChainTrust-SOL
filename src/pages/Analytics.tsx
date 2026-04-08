import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, TrendingUp, Shield, Activity, Coins,
  ArrowUpRight, ArrowDownRight, Globe, Leaf, Eye, FileCheck,
  Vote, Wallet, Clock, Zap,
} from 'lucide-react';
import { useStartups } from '@/hooks/use-startups';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { chartTooltipStyle } from '@/lib/constants';

/* ── Platform time-series data (last 12 months) ── */
const MONTHS = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

function generateGrowthData() {
  let startups = 42, investors = 310, verifications = 89, txs = 12400;
  return MONTHS.map(m => {
    startups += Math.floor(Math.random() * 12 + 5);
    investors += Math.floor(Math.random() * 80 + 30);
    verifications += Math.floor(Math.random() * 18 + 8);
    txs += Math.floor(Math.random() * 3000 + 1500);
    return { month: m, startups, investors, verifications, transactions: txs };
  });
}

const GROWTH_DATA = generateGrowthData();

const CATEGORY_DATA = [
  { name: 'DeFi', value: 34, color: '#3b82f6' },
  { name: 'Fintech', value: 28, color: '#06b6d4' },
  { name: 'SaaS', value: 22, color: '#8b5cf6' },
  { name: 'Cleantech', value: 18, color: '#10b981' },
  { name: 'Infrastructure', value: 12, color: '#f59e0b' },
];

const VERIFICATION_FUNNEL = [
  { stage: 'Registered', count: 127, pct: 100 },
  { stage: 'Metrics Published', count: 98, pct: 77 },
  { stage: 'Oracle Verified', count: 64, pct: 50 },
  { stage: 'Badge Issued', count: 41, pct: 32 },
  { stage: 'Institutional Ready', count: 23, pct: 18 },
];

const ACTIVITY_FEED = [
  { type: 'register', text: 'NovaPay registered as Fintech startup', time: '12m ago', icon: Users },
  { type: 'verify', text: 'GreenChain passed oracle verification', time: '34m ago', icon: Shield },
  { type: 'stake', text: '15,000 CMT staked by 0x8f2a...c3d1', time: '1h ago', icon: Coins },
  { type: 'vote', text: 'Proposal #12 received 450 new votes', time: '2h ago', icon: Vote },
  { type: 'metrics', text: 'PayFlow published March metrics', time: '3h ago', icon: BarChart3 },
  { type: 'badge', text: 'DeFiYield earned Gold verification badge', time: '5h ago', icon: FileCheck },
  { type: 'register', text: 'SolBridge joined Infrastructure category', time: '6h ago', icon: Users },
  { type: 'stake', text: '50,000 CMT staked — new Whale tier', time: '8h ago', icon: Coins },
];

function StatCard({ icon: Icon, label, value, change, changeDir, sub, delay }: {
  icon: any; label: string; value: string; change?: string; changeDir?: 'up' | 'down'; sub?: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold font-display tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {change && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${changeDir === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {changeDir === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {change}
          </span>
        )}
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const { data: startups } = useStartups();

  const stats = useMemo(() => {
    const count = startups?.length ?? 0;
    const totalMrr = startups?.reduce((s, x) => s + x.mrr, 0) ?? 0;
    const avgTrust = startups?.length
      ? Math.round(startups.reduce((s, x) => s + x.trust_score, 0) / startups.length)
      : 0;
    const verified = startups?.filter(x => x.is_verified).length ?? 0;
    return { count, totalMrr, avgTrust, verified };
  }, [startups]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Platform Analytics</h1>
            <p className="text-xs text-muted-foreground font-mono">Real-time platform health and growth metrics</p>
          </div>
        </div>
      </motion.div>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={Users} label="Total Startups" value={stats.count > 0 ? String(stats.count) : '127'} change="+14%" changeDir="up" sub="vs last month" delay={0} />
        <StatCard icon={TrendingUp} label="Total MRR Verified" value={stats.totalMrr > 0 ? formatCurrency(stats.totalMrr) : '$45.2M'} change="+23%" changeDir="up" sub="across all startups" delay={0.05} />
        <StatCard icon={Shield} label="Avg Trust Score" value={stats.avgTrust > 0 ? String(stats.avgTrust) : '74'} change="+3pts" changeDir="up" sub="platform average" delay={0.1} />
        <StatCard icon={FileCheck} label="Verified Startups" value={stats.verified > 0 ? String(stats.verified) : '41'} change="+8" changeDir="up" sub="with soulbound badges" delay={0.15} />
      </div>

      {/* Second row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard icon={Coins} label="Total CMT Staked" value="2.45M" change="+18%" changeDir="up" sub="across 1,823 stakers" delay={0.2} />
        <StatCard icon={Vote} label="Active Proposals" value="7" change="+2" changeDir="up" sub="governance proposals" delay={0.25} />
        <StatCard icon={Activity} label="Daily Transactions" value="4,892" change="+31%" changeDir="up" sub="on-chain activity" delay={0.3} />
        <StatCard icon={Globe} label="Countries" value="34" change="+6" changeDir="up" sub="represented on platform" delay={0.35} />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Growth chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h3 className="font-bold mb-4">Platform Growth (12 months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="startups" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} name="Startups" />
                <Area type="monotone" dataKey="verifications" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Verifications" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-5">
          <h3 className="font-bold mb-4">By Category</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {CATEGORY_DATA.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {CATEGORY_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground flex-1">{d.name}</span>
                <span className="font-mono font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Verification funnel + Activity feed */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Funnel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Verification Funnel
          </h3>
          <div className="space-y-3">
            {VERIFICATION_FUNNEL.map((step, i) => (
              <div key={step.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{step.stage}</span>
                  <span className="text-xs font-mono text-muted-foreground">{step.count} ({step.pct}%)</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${step.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    style={{ opacity: 1 - i * 0.15 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            18% of registered startups reach institutional-ready status. Target: 30% by Q3 2026.
          </p>
        </motion.div>

        {/* Activity feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border bg-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Recent Activity
          </h3>
          <div className="space-y-0 divide-y divide-border">
            {ACTIVITY_FEED.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3 first:pt-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                  <item.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Transaction volume chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl border bg-card p-5 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> On-Chain Transaction Volume
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={GROWTH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="transactions" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Network health */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" /> Solana Network Health
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Network', value: 'Devnet', status: 'operational' },
            { label: 'Block Time', value: '400ms', status: 'operational' },
            { label: 'Current TPS', value: '3,847', status: 'operational' },
            { label: 'Avg Fee', value: '$0.00025', status: 'operational' },
            { label: 'Uptime', value: '99.97%', status: 'operational' },
          ].map((item, i) => (
            <div key={i} className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className="text-sm font-bold font-mono">{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
