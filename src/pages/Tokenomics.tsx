import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Coins, TrendingUp, Lock, Shield, Users, Flame, ArrowRight,
  Clock, BarChart3, Wallet, Gift, Zap, ChevronRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { chartTooltipStyle } from '@/lib/constants';

const TOTAL_SUPPLY = 100_000_000;

const DISTRIBUTION = [
  { name: 'Staking Rewards', pct: 35, amount: 35_000_000, color: '#06b6d4', icon: Gift, vesting: 'Linear over 4 years', desc: 'Distributed to CMT stakers as yield — 12.5% base APY' },
  { name: 'Treasury', pct: 25, amount: 25_000_000, color: '#3b82f6', icon: Shield, vesting: 'DAO-governed unlocks', desc: 'Protocol development, grants, partnerships — controlled by governance' },
  { name: 'Community & Ecosystem', pct: 20, amount: 20_000_000, color: '#10b981', icon: Users, vesting: 'Event-based releases', desc: 'Airdrops, bug bounties, developer grants, hackathon prizes' },
  { name: 'Team & Advisors', pct: 15, amount: 15_000_000, color: '#f59e0b', icon: Lock, vesting: '12mo cliff, 36mo linear', desc: 'Core team allocation — fully locked for 1 year, then 3-year vesting' },
  { name: 'Liquidity Provision', pct: 5, amount: 5_000_000, color: '#ec4899', icon: Zap, vesting: 'At launch', desc: 'Initial DEX liquidity on Raydium/Jupiter — protocol-owned' },
];

const VESTING_SCHEDULE = [
  { month: 'Launch', team: 0, staking: 2, community: 5, treasury: 0, liquidity: 100 },
  { month: 'M3', team: 0, staking: 8, community: 10, treasury: 2, liquidity: 100 },
  { month: 'M6', team: 0, staking: 15, community: 18, treasury: 5, liquidity: 100 },
  { month: 'M12', team: 10, staking: 25, community: 30, treasury: 10, liquidity: 100 },
  { month: 'M18', team: 25, staking: 38, community: 45, treasury: 18, liquidity: 100 },
  { month: 'M24', team: 42, staking: 50, community: 60, treasury: 25, liquidity: 100 },
  { month: 'M30', team: 58, staking: 63, community: 75, treasury: 35, liquidity: 100 },
  { month: 'M36', team: 75, staking: 75, community: 85, treasury: 45, liquidity: 100 },
  { month: 'M42', team: 92, staking: 85, community: 92, treasury: 55, liquidity: 100 },
  { month: 'M48', team: 100, staking: 100, community: 100, treasury: 65, liquidity: 100 },
];

const BURN_MECHANICS = [
  { source: 'Verification Fees', rate: '0.5% of fee', desc: 'Every on-chain verification burns 0.5% of the fee in CMT', annual: '~125,000 CMT' },
  { source: 'Premium Features', rate: '1% of payment', desc: 'Screener access, LP reports, API usage — 1% burned', annual: '~80,000 CMT' },
  { source: 'Proposal Deposits', rate: '10% of deposit', desc: 'Failed governance proposals forfeit 10% of deposit, which is burned', annual: '~15,000 CMT' },
  { source: 'Badge Minting', rate: 'Flat 100 CMT', desc: 'Each soulbound badge minting burns 100 CMT permanently', annual: '~50,000 CMT' },
];

const UTILITY_USES = [
  { icon: Shield, title: 'Staking & Governance', desc: 'Stake CMT to vote on protocol proposals and earn 12.5% APY rewards' },
  { icon: BarChart3, title: 'Premium Analytics', desc: 'Unlock screener filters, AI due diligence, LP reports based on staking tier' },
  { icon: Coins, title: 'Verification Fees', desc: 'Pay for on-chain metric verification and provenance certificate issuance' },
  { icon: Gift, title: 'Ecosystem Incentives', desc: 'Earn CMT for registering startups, publishing metrics, oracle verification' },
  { icon: Lock, title: 'Access Tiers', desc: 'Free (0 CMT) → Basic (1+) → Pro (5K+) → Whale (50K+) — progressive access' },
  { icon: Flame, title: 'Deflationary Burns', desc: 'Multiple burn mechanics reduce circulating supply over time' },
];

function formatM(n: number): string {
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export default function Tokenomics() {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  const circulatingData = useMemo(() => {
    return VESTING_SCHEDULE.map(v => ({
      month: v.month,
      circulating: Math.round(
        (v.staking / 100 * 35 + v.treasury / 100 * 25 + v.community / 100 * 20 + v.team / 100 * 15 + v.liquidity / 100 * 5)
      ),
    }));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">CMT Token Economics</h1>
            <p className="text-xs text-muted-foreground font-mono">Total Supply: {TOTAL_SUPPLY.toLocaleString()} CMT — Deflationary, Utility-Driven</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mt-2">
          CMT is the utility token powering ChainTrust's verification, governance, and staking systems on Solana.
          Designed for sustainable value accrual with multiple burn mechanisms and real protocol utility.
        </p>
      </motion.div>

      {/* Key stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Coins, label: 'Total Supply', value: '100M CMT', sub: 'Fixed, no inflation' },
          { icon: TrendingUp, label: 'Staking APY', value: '12.5%', sub: 'Paid from rewards pool' },
          { icon: Flame, label: 'Annual Burn', value: '~270K CMT', sub: '0.27% deflationary rate' },
          { icon: Lock, label: 'Team Lock', value: '12mo cliff', sub: '+ 36mo linear vest' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4" /> {s.label}
            </div>
            <div className="mt-1 text-2xl font-bold font-display tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Distribution chart + breakdown */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-6">
          <h2 className="font-bold text-lg mb-4">Token Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="pct"
                  onMouseEnter={(_, i) => setHoveredSlice(i)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  {DISTRIBUTION.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={d.color}
                      opacity={hoveredSlice === null || hoveredSlice === i ? 1 : 0.4}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number, name: string) => [`${v}% (${formatM(v * 1_000_000)})`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-muted-foreground mt-2">Hover slices for details</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border bg-card p-6">
          <h2 className="font-bold text-lg mb-4">Allocation Details</h2>
          <div className="space-y-3">
            {DISTRIBUTION.map((d, i) => (
              <div
                key={d.name}
                className={`rounded-lg p-3 transition ${hoveredSlice === i ? 'bg-muted/50 ring-1 ring-primary/20' : 'bg-muted/20'}`}
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-medium">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono">{d.pct}%</span>
                    <span className="text-xs text-muted-foreground ml-2">{formatM(d.amount)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{d.desc}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-mono">{d.vesting}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Vesting schedule chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-2">Vesting Schedule</h2>
        <p className="text-xs text-muted-foreground mb-4">Percentage of each allocation unlocked over 48 months</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={VESTING_SCHEDULE}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="staking" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.08} name="Staking Rewards" />
              <Area type="monotone" dataKey="community" stroke="#10b981" fill="#10b981" fillOpacity={0.08} name="Community" />
              <Area type="monotone" dataKey="treasury" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} name="Treasury" />
              <Area type="monotone" dataKey="team" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} name="Team" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Circulating supply projection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-2">Circulating Supply Projection</h2>
        <p className="text-xs text-muted-foreground mb-4">Total tokens unlocked across all allocations (% of 100M)</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={circulatingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => `${v}% (${formatM(v * 1_000_000)})`} />
              <Bar dataKey="circulating" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Circulating %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Burn mechanics */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-400" /> Burn Mechanics
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          CMT is deflationary — multiple burn mechanisms permanently reduce circulating supply.
          Estimated ~270,000 CMT burned annually at current usage levels.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {BURN_MECHANICS.map((b, i) => (
            <div key={b.source} className="rounded-lg bg-muted/30 p-4 border border-red-500/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{b.source}</span>
                <span className="text-xs font-mono text-red-400">{b.rate}</span>
              </div>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
              <div className="flex items-center gap-1 mt-2">
                <Flame className="h-3 w-3 text-red-400" />
                <span className="text-[10px] font-mono text-red-400">{b.annual}/year</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Token utility */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" /> Token Utility
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITY_USES.map((u, i) => (
            <div key={u.title} className="rounded-lg bg-muted/30 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-2">
                <u.icon className="h-4 w-4 text-primary" />
              </div>
              <h4 className="font-bold text-sm">{u.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{u.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Staking tiers reference */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4">Staking Tiers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tier</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Min Stake</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">APY</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Features</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Vote Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { tier: 'Free', min: '0', apy: '0%', features: 'Dashboard, leaderboard, basic screener', weight: '0x', color: 'text-muted-foreground' },
                { tier: 'Basic', min: '1 CMT', apy: '8%', features: '+ Full screener, CSV export, bookmarks', weight: '1x', color: 'text-blue-400' },
                { tier: 'Pro', min: '5,000 CMT', apy: '12.5%', features: '+ AI due diligence, LP reports, API access', weight: '2.5x', color: 'text-primary' },
                { tier: 'Whale', min: '50,000 CMT', apy: '15%', features: '+ Priority oracle, institutional view, direct contact', weight: '5x', color: 'text-amber-400' },
              ].map(t => (
                <tr key={t.tier} className="hover:bg-muted/30">
                  <td className={`px-4 py-3 font-bold ${t.color}`}>{t.tier}</td>
                  <td className="px-4 py-3 text-right font-mono">{t.min}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{t.apy}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.features}</td>
                  <td className="px-4 py-3 text-right font-mono">{t.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Link to="/staking" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Stake CMT now <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Ready to participate in ChainTrust governance?</h3>
          <p className="text-sm text-muted-foreground">Stake CMT to earn rewards and shape the future of supply chain verification.</p>
        </div>
        <Link to="/staking" className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 shrink-0">
          Start Staking <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
