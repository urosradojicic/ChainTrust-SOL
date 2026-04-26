import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, DollarSign, ArrowRight, TrendingDown, Zap, Clock,
  BarChart3, CheckCircle, Globe, Shield, Package, ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { chartTooltipStyle } from '@/lib/constants';
import { Link } from 'react-router-dom';

const SOLANA_FEE = 0.00025; // USD per transaction
const ETH_FEE = 2.93;

interface CalcInputs {
  products: number;
  verificationsPerMonth: number;
  currentCostPerVerification: number;
  countries: number;
  complianceStaff: number;
}

const INDUSTRY_PRESETS: { label: string; icon: any; inputs: CalcInputs }[] = [
  {
    label: 'Small Brand (D2C)',
    icon: Package,
    inputs: { products: 500, verificationsPerMonth: 2000, currentCostPerVerification: 0.85, countries: 3, complianceStaff: 1 },
  },
  {
    label: 'Mid-Market Manufacturer',
    icon: Globe,
    inputs: { products: 5000, verificationsPerMonth: 25000, currentCostPerVerification: 0.45, countries: 12, complianceStaff: 4 },
  },
  {
    label: 'Enterprise Supply Chain',
    icon: BarChart3,
    inputs: { products: 50000, verificationsPerMonth: 500000, currentCostPerVerification: 0.22, countries: 40, complianceStaff: 15 },
  },
];

const COMPARISON_DATA = [
  { category: 'Per Verification', traditional: 0.45, chainTrust: 0.00025, unit: '$' },
  { category: 'Monthly (25K verif.)', traditional: 11250, chainTrust: 6.25, unit: '$' },
  { category: 'Compliance Staff', traditional: 4, chainTrust: 1, unit: 'FTE' },
  { category: 'Audit Turnaround', traditional: 45, chainTrust: 0.007, unit: 'days' },
  { category: 'Data Integrity', traditional: 85, chainTrust: 100, unit: '%' },
];

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

export default function CostCalculator() {
  const [inputs, setInputs] = useState<CalcInputs>({
    products: 5000,
    verificationsPerMonth: 25000,
    currentCostPerVerification: 0.45,
    countries: 12,
    complianceStaff: 4,
  });

  const results = useMemo(() => {
    const currentMonthlyCost = inputs.verificationsPerMonth * inputs.currentCostPerVerification;
    const chainTrustMonthlyCost = inputs.verificationsPerMonth * SOLANA_FEE;
    const monthlySavings = currentMonthlyCost - chainTrustMonthlyCost;
    const annualSavings = monthlySavings * 12;
    const savingsPct = currentMonthlyCost > 0 ? (monthlySavings / currentMonthlyCost) * 100 : 0;

    // Compliance cost savings (estimate: each FTE costs $75K/yr, ChainTrust automates ~60%)
    const currentComplianceCost = inputs.complianceStaff * 75000;
    const automatedComplianceSavings = currentComplianceCost * 0.6;

    // Cross-border savings (estimate: $2K per country per year in compliance overhead)
    const crossBorderSavings = inputs.countries * 2000;

    const totalAnnualSavings = annualSavings + automatedComplianceSavings + crossBorderSavings;

    // Ethereum comparison
    const ethMonthlyCost = inputs.verificationsPerMonth * ETH_FEE;

    return {
      currentMonthlyCost,
      chainTrustMonthlyCost,
      monthlySavings,
      annualSavings,
      savingsPct,
      currentComplianceCost,
      automatedComplianceSavings,
      crossBorderSavings,
      totalAnnualSavings,
      ethMonthlyCost,
    };
  }, [inputs]);

  const chartData = [
    { name: 'Current System', cost: results.currentMonthlyCost, fill: '#ef4444' },
    { name: 'Ethereum', cost: results.ethMonthlyCost, fill: '#6366f1' },
    { name: 'ChainTrust (Solana)', cost: results.chainTrustMonthlyCost, fill: '#06b6d4' },
  ];

  const setPreset = (preset: typeof INDUSTRY_PRESETS[0]) => {
    setInputs(preset.inputs);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Cost Savings Calculator</h1>
            <p className="text-xs text-muted-foreground font-mono">See how much ChainTrust saves vs. traditional verification</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Blockchain-powered supply chain verification on Solana costs a fraction of traditional systems.
          Configure your parameters below and see the real numbers.
        </p>
      </motion.div>

      {/* Industry presets */}
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground mb-3">Quick presets:</p>
        <div className="flex flex-wrap gap-3">
          {INDUSTRY_PRESETS.map((preset, i) => (
            <motion.button
              key={preset.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setPreset(preset)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:border-primary hover:text-primary"
            >
              <preset.icon className="h-4 w-4" />
              {preset.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-6">
          <h2 className="font-bold text-lg mb-5">Your Parameters</h2>
          <div className="space-y-5">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Products / SKUs tracked</span>
                <span className="text-sm font-mono text-primary">{inputs.products.toLocaleString()}</span>
              </label>
              <input
                type="range" min="100" max="100000" step="100"
                value={inputs.products}
                onChange={e => setInputs(p => ({ ...p, products: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>100</span><span>100,000</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Verifications per month</span>
                <span className="text-sm font-mono text-primary">{inputs.verificationsPerMonth.toLocaleString()}</span>
              </label>
              <input
                type="range" min="100" max="1000000" step="500"
                value={inputs.verificationsPerMonth}
                onChange={e => setInputs(p => ({ ...p, verificationsPerMonth: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>100</span><span>1,000,000</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current cost per verification</span>
                <span className="text-sm font-mono text-primary">${inputs.currentCostPerVerification.toFixed(2)}</span>
              </label>
              <input
                type="range" min="0.05" max="5" step="0.05"
                value={inputs.currentCostPerVerification}
                onChange={e => setInputs(p => ({ ...p, currentCostPerVerification: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>$0.05</span><span>$5.00</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Countries operating in</span>
                <span className="text-sm font-mono text-primary">{inputs.countries}</span>
              </label>
              <input
                type="range" min="1" max="100" step="1"
                value={inputs.countries}
                onChange={e => setInputs(p => ({ ...p, countries: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1</span><span>100</span>
              </div>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Compliance staff (FTEs)</span>
                <span className="text-sm font-mono text-primary">{inputs.complianceStaff}</span>
              </label>
              <input
                type="range" min="0" max="50" step="1"
                value={inputs.complianceStaff}
                onChange={e => setInputs(p => ({ ...p, complianceStaff: Number(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0</span><span>50</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results panel */}
        <div className="space-y-6">
          {/* Big savings number */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              Total Annual Savings
            </div>
            <div className="text-4xl font-display font-bold text-primary tabular-nums">
              {formatUSD(results.totalAnnualSavings)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {results.savingsPct.toFixed(1)}% reduction in verification costs alone
            </div>
          </motion.div>

          {/* Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5">
            <h3 className="font-bold mb-4">Savings Breakdown (Annual)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm">Verification cost reduction</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{formatUSD(results.annualSavings)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm">Compliance automation (60%)</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{formatUSD(results.automatedComplianceSavings)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm">Cross-border compliance overhead</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{formatUSD(results.crossBorderSavings)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-foreground" />
                  <span className="text-sm font-bold">Total annual savings</span>
                </div>
                <span className="font-mono font-bold text-primary text-lg">{formatUSD(results.totalAnnualSavings)}</span>
              </div>
            </div>
          </motion.div>

          {/* Monthly comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border bg-card p-5">
            <h3 className="font-bold mb-2">Monthly Verification Cost</h3>
            <p className="text-xs text-muted-foreground mb-4">{inputs.verificationsPerMonth.toLocaleString()} verifications/month</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-32 text-sm text-muted-foreground">Current System</span>
                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} />
                </div>
                <span className="w-24 text-right text-sm font-mono font-bold text-red-400">{formatUSD(results.currentMonthlyCost)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-32 text-sm text-muted-foreground">Ethereum</span>
                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, (results.ethMonthlyCost / results.currentMonthlyCost) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-sm font-mono font-bold text-primary/80">{formatUSD(results.ethMonthlyCost)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-32 text-sm text-primary font-medium">ChainTrust</span>
                <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(1, (results.chainTrustMonthlyCost / results.currentMonthlyCost) * 100)}%` }} />
                </div>
                <span className="w-24 text-right text-sm font-mono font-bold text-primary">{formatUSD(results.chainTrustMonthlyCost)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom comparison chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 rounded-xl border bg-card p-6">
        <h3 className="font-bold mb-4">Monthly Cost Comparison (Log Scale)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={140} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => formatUSD(v)} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]} name="Monthly Cost">
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Key advantages */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Zap, title: '100,000x Cheaper', desc: 'Solana verification at $0.00025 vs Ethereum at $2.93 per transaction' },
          { icon: Clock, title: 'Real-Time Verification', desc: '400ms finality — verify at point of sale, customs, or anywhere in the supply chain' },
          { icon: Shield, title: 'Immutable Records', desc: 'Once on Solana, compliance records cannot be altered, deleted, or disputed' },
          { icon: Globe, title: 'Cross-Border Ready', desc: 'One verification system works across 100+ jurisdictions — no per-country setup' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border bg-card p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <h4 className="font-bold text-sm">{item.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-8 rounded-xl border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Ready to cut your verification costs by {results.savingsPct.toFixed(0)}%?</h3>
          <p className="text-sm text-muted-foreground">Register your startup and start publishing verified metrics on Solana today.</p>
        </div>
        <Link to="/register" className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 shrink-0">
          Get Started <ChevronRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
