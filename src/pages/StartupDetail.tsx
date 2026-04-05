import { useParams, Link } from 'react-router-dom';
import RiskAnalysisButton from '@/components/RiskAnalysisButton';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/format';
import { chartTooltipStyle, categoryColors } from '@/lib/constants';
import Badge from '@/components/common/Badge';
import SustainabilityScore from '@/components/SustainabilityScore';
import SustainabilityGauge from '@/components/startup/SustainabilityGauge';
import MetricCard from '@/components/startup/MetricCard';
import ImpactPL from '@/components/startup/ImpactPL';
import { OnChainTimestamp, ViewOnExplorerButton, VerifyOnChainButton } from '@/components/startup/OnChainActions';
import { AuditTrailTab } from '@/components/audit/AuditLogTable';
import FundingRounds from '@/components/startup/FundingRounds';
import SoulboundBadge from '@/components/startup/SoulboundBadge';
import TransactionHistory from '@/components/startup/TransactionHistory';
import ProofChainVisualizer from '@/components/startup/ProofChainVisualizer';
import TrustScoreBreakdown from '@/components/startup/TrustScoreBreakdown';
import ValuationMetrics from '@/components/startup/ValuationMetrics';
import TokenUnlockCalendar from '@/components/startup/TokenUnlockCalendar';
import RetentionChart from '@/components/startup/RetentionChart';
import TimeRangeSelector, { sliceByRange } from '@/components/startup/TimeRangeSelector';
import { exportElementAsPDF } from '@/lib/export-pdf';
import {
  Leaf, Shield, AlertTriangle, ExternalLink, Users, Calendar,
  Globe, TrendingUp, Wallet, Zap, Coins, ChevronLeft, Loader2, Download, FileText,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStartup, useMetricsHistory, useStartupPledges, useStartups } from '@/hooks/use-startups';
import type { SustainabilityData } from '@/components/SustainabilityScore';
import type { DbStartup } from '@/types/database';

function buildSustainabilityData(s: DbStartup): SustainabilityData {
  return {
    overall: s.sustainability_score,
    energyEfficiency: { score: s.energy_score, chain: `${s.blockchain} (${s.chain_type})`, energyPerTx: s.energy_per_transaction || '0.001 kWh' },
    carbonOffset: { score: s.carbon_score, purchased: Number(s.carbon_offset_tonnes) > 10, tons: Number(s.carbon_offset_tonnes) },
    tokenomicsHealth: { score: s.tokenomics_score, concentration: Number(s.whale_concentration) > 50 ? 'High' : Number(s.whale_concentration) > 30 ? 'Medium' : 'Low', inflation: `${s.inflation_rate}%`, vesting: '4yr linear' },
    governancePledges: { score: s.governance_score, pledgesCount: s.governance_score, pledges: [] },
  };
}

const defaultTokenDist = [
  { label: 'Community', value: 35, color: '#10B981' },
  { label: 'Team', value: 20, color: '#534AB7' },
  { label: 'Investors', value: 18, color: '#3B82F6' },
  { label: 'Treasury', value: 15, color: '#EAB308' },
  { label: 'Liquidity', value: 12, color: '#F97316' },
];

const defaultVesting = [
  { period: 'Month 0', unlocked: 10 }, { period: 'Month 6', unlocked: 15 },
  { period: 'Year 1', unlocked: 25 }, { period: 'Year 2', unlocked: 50 },
  { period: 'Year 3', unlocked: 75 }, { period: 'Year 4', unlocked: 100 },
];

export default function StartupDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: startup, isLoading } = useStartup(id);
  const { data: metrics = [] } = useMetricsHistory(id);
  const { data: pledges = [] } = useStartupPledges(id);
  const { data: allStartups } = useStartups();
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('6M');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Startup not found</h1>
        <Link to="/dashboard" className="mt-4 inline-block text-primary hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const sus = buildSustainabilityData(startup);
  const avgSustainability = allStartups && allStartups.length > 0
    ? Math.round(allStartups.reduce((s, x) => s + x.sustainability_score, 0) / allStartups.length)
    : 62;

  const financials = metrics.map(m => ({
    month: m.month,
    revenue: Number(m.revenue),
    costs: Number(m.costs),
    profit: Number(m.revenue) - Number(m.costs),
  }));

  const rangedMetrics = sliceByRange(metrics, timeRange);
  const revenueHistory = rangedMetrics.map(m => ({ month: m.month, value: Number(m.revenue) }));
  const userHistory = rangedMetrics.map(m => ({ month: m.month, value: m.mau }));
  const carbonOffsetHistory = rangedMetrics.map(m => ({ month: m.month, tons: Number(m.carbon_offsets) }));

  const metricsTable = metrics.map(m => ({
    date: m.month_date,
    mrr: Number(m.revenue),
    users: m.mau,
    growth: Number(m.growth_rate),
    verified: startup.verified,
  }));

  return (
    <div id="startup-detail-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition print:hidden">
        <ChevronLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold">{startup.name}</h1>
            <Badge variant={categoryColors[startup.category] || 'neutral'}>{startup.category}</Badge>
            {startup.verified && <Badge variant="success">✓ Verified</Badge>}
            <Badge variant="info">{startup.blockchain}</Badge>
          </div>
          <p className="mt-2 max-w-xl text-muted-foreground">{startup.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {startup.founded_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Founded {startup.founded_date}</span>}
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {startup.team_size} team members</span>
            {startup.website && (
              <a href={startup.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                <Globe className="h-3.5 w-3.5" /> {startup.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <OnChainTimestamp />
            <ViewOnExplorerButton />
            <VerifyOnChainButton startup={startup} />
            <RiskAnalysisButton startup={startup} />
            <button
              onClick={() => exportElementAsPDF('startup-detail-content', `${startup.name}-report.pdf`)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:bg-secondary"
            >
              <FileText className="h-3 w-3" /> Export PDF
            </button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <SustainabilityGauge score={sus.overall} />
        </motion.div>
      </div>

      {/* Soulbound Badge */}
      {startup.verified && (
        <div className="mt-6">
          <SoulboundBadge startupId={parseInt(startup.id, 10) || 1} startupName={startup.name} />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="impact-pl">Impact P&L</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
          <TabsTrigger value="funding">Funding</TabsTrigger>
          <TabsTrigger value="pledges">Pledges</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <MetricCard label="MRR" value={formatCurrency(startup.mrr)} icon={Wallet} bg="bg-blue-50 dark:bg-blue-950/30" />
            <MetricCard label="Total Users" value={formatNumber(startup.users)} icon={Users} bg="bg-purple-50 dark:bg-purple-950/30" />
            <MetricCard label="Growth" value={`${Number(startup.growth_rate) >= 0 ? '+' : ''}${startup.growth_rate}%`} icon={TrendingUp} bg="bg-emerald-50 dark:bg-emerald-950/30" />
            <MetricCard label="Treasury" value={formatCurrency(Number(startup.treasury))} icon={Coins} bg="bg-amber-50 dark:bg-amber-950/30" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Showing {timeRange === 'All' ? 'all' : `last ${timeRange}`}</span>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          <RetentionChart metrics={metrics} currentUsers={startup.users} />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-4 font-bold">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueHistory}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#534AB7" stopOpacity={0.3} /><stop offset="95%" stopColor="#534AB7" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${formatNumber(v)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="value" stroke="#534AB7" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-4 font-bold">User Growth</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={userHistory}>
                  <defs><linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatNumber(v), 'Users']} />
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#userGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">MRR</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Users</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Growth</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {metricsTable.map(m => (
                  <tr key={m.date} className="hover:bg-muted/50 transition">
                    <td className="px-4 py-3 font-mono">{m.date}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(m.mrr)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(m.users)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${m.growth >= 0 ? 'text-accent' : 'text-destructive'}`}>{m.growth >= 0 ? '+' : ''}{m.growth}%</td>
                    <td className="px-4 py-3 text-center">{m.verified ? <span className="text-accent">✓</span> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Verification — Proof Chain */}
        <TabsContent value="verification" className="mt-6 space-y-6">
          <ProofChainVisualizer startup={startup} />
          <TrustScoreBreakdown startup={startup} />
        </TabsContent>

        {/* Financials */}
        <TabsContent value="financials" className="mt-6 space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 font-bold">Revenue vs Costs (12 months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={financials}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${formatNumber(v)}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="costs" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="Costs" strokeDasharray="6 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 font-bold">Profit Margin</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={financials}>
                <defs><linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${formatNumber(v)}`, 'Profit']} />
                <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Sustainability */}
        <TabsContent value="sustainability" className="mt-6 space-y-6">
          <SustainabilityScore data={sus} />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-4 font-bold flex items-center gap-2"><Zap className="h-4 w-4" style={{ color: '#10B981' }} /> Energy Consumption</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <span className="text-3xl font-bold font-mono" style={{ color: Number(startup.energy_consumption) < 200 ? '#10B981' : Number(startup.energy_consumption) < 500 ? '#EAB308' : '#EF4444' }}>{Number(startup.energy_consumption)}</span>
                  <p className="text-xs text-muted-foreground">kWh/month</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: Number(startup.energy_consumption) < 200 ? '#10B981' : Number(startup.energy_consumption) < 500 ? '#EAB308' : '#EF4444' }} initial={{ width: 0 }} animate={{ width: `${Math.min((Number(startup.energy_consumption) / 1000) * 100, 100)}%` }} transition={{ duration: 1 }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0</span><span>500</span><span>1000 kWh</span></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-4 font-bold flex items-center gap-2"><Leaf className="h-4 w-4" style={{ color: '#10B981' }} /> Carbon Offset History</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={carbonOffsetHistory}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v} tons`, 'Offset']} />
                  <Bar dataKey="tons" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 font-bold">vs Platform Average</h3>
            <div className="space-y-3">
              {[
                { label: startup.name, score: sus.overall, color: '#10B981' },
                { label: 'Platform Average', score: avgSustainability, color: '#9CA3AF' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="font-medium">{item.label}</span><span className="font-mono font-bold">{item.score}/100</span></div>
                  <div className="h-3 w-full rounded-full bg-muted/50 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Impact P&L */}
        <TabsContent value="impact-pl" className="mt-6 space-y-6">
          <ImpactPL startup={startup} metrics={metrics} />
        </TabsContent>

        {/* Valuation */}
        <TabsContent value="valuation" className="mt-6">
          <ValuationMetrics startup={startup} metrics={metrics} />
        </TabsContent>

        {/* Tokenomics */}
        <TabsContent value="tokenomics" className="mt-6 space-y-6">
          {Number(startup.whale_concentration) > 50 && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div>
                <span className="font-bold text-destructive">Whale Concentration Warning</span>
                <p className="text-sm text-muted-foreground">Top 10 wallets hold {Number(startup.whale_concentration)}% of total supply. High concentration risk.</p>
              </div>
            </motion.div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-4 font-bold">Token Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={defaultTokenDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" nameKey="label" paddingAngle={3}>
                    {defaultTokenDist.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-4 font-bold">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Whale Concentration (Top 10)</span>
                  <span className={`font-bold font-mono ${Number(startup.whale_concentration) > 50 ? 'text-destructive' : Number(startup.whale_concentration) > 35 ? 'text-yellow-500' : 'text-accent'}`}>{Number(startup.whale_concentration)}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Inflation Rate</span>
                  <span className={`font-bold font-mono ${Number(startup.inflation_rate) > 5 ? 'text-destructive' : 'text-accent'}`}>{Number(startup.inflation_rate)}%/yr</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">Tokenomics Score</span>
                  <span className="font-bold font-mono" style={{ color: '#10B981' }}>{sus.tokenomicsHealth.score}/25</span>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 font-bold">Vesting Schedule</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={defaultVesting}>
                <defs><linearGradient id="vestGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#534AB7" stopOpacity={0.3} /><stop offset="95%" stopColor="#534AB7" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Unlocked']} />
                <Area type="monotone" dataKey="unlocked" stroke="#534AB7" strokeWidth={2.5} fill="url(#vestGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <TokenUnlockCalendar />
        </TabsContent>

        {/* Funding */}
        <TabsContent value="funding" className="mt-6">
          <FundingRounds startupId={startup.id} />
        </TabsContent>

        {/* Pledges */}
        <TabsContent value="pledges" className="mt-6 space-y-4">
          <div className="mb-2">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: '#10B981' }} />
              Sustainability Pledges ({pledges.length})
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Commitments this startup has made toward sustainability goals</p>
          </div>
          {pledges.map((pledge, i) => (
            <motion.div key={pledge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-4 rounded-xl border bg-card p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: '#10B98115', color: '#10B981' }}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{pledge.pledge_text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Committed on {new Date(pledge.committed_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <Badge variant={pledge.status === 'active' ? 'success' : 'neutral'}>
                {pledge.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </motion.div>
          ))}
          {pledges.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No pledges yet.</p>
          )}
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="mt-6 space-y-6">
          <AuditTrailTab startupId={startup.id} />
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
