/**
 * Investment Memo Panel
 * ─────────────────────
 * Generates and displays an institutional-grade investment memo.
 * The kind of document that Goldman Sachs writes for $500K.
 * ChainTrust does it for free, backed by verified on-chain data.
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ThumbsUp, ThumbsDown, TrendingUp, Shield, AlertTriangle,
  ChevronDown, ChevronUp, Download, DollarSign, Target, Sparkles, BarChart3,
} from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { generateInvestmentMemo, RECOMMENDATION_CONFIG, type InvestmentMemo } from '@/lib/investment-memo';
import { exportElementAsPDF } from '@/lib/export-pdf';

function DataPointTag({ dp }: { dp: { label: string; value: string; sentiment: 'positive' | 'neutral' | 'negative' } }) {
  const colors = {
    positive: 'bg-emerald-500/10 text-emerald-500',
    neutral: 'bg-muted text-muted-foreground',
    negative: 'bg-red-500/10 text-red-500',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[dp.sentiment]}`}>
      {dp.label}: {dp.value}
    </span>
  );
}

function MemoSection({ section, index }: { section: { title: string; content: string; dataPoints: any[] }; index: number }) {
  const [expanded, setExpanded] = useState(index < 3); // First 3 expanded by default

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition text-left"
      >
        <span className="text-sm font-bold text-foreground">{index + 1}. {section.title}</span>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <p className="text-xs text-foreground leading-relaxed">{section.content}</p>
              {section.dataPoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {section.dataPoints.map((dp: any, i: number) => (
                    <DataPointTag key={i} dp={dp} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface InvestmentMemoPanelProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
}

export default function InvestmentMemoPanel({ startup, metrics, allStartups }: InvestmentMemoPanelProps) {
  const memo: InvestmentMemo = useMemo(
    () => generateInvestmentMemo(startup, metrics, allStartups),
    [startup, metrics, allStartups],
  );

  const recConfig = RECOMMENDATION_CONFIG[memo.recommendation];

  return (
    <div id="investment-memo-content" className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-emerald-500/5 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-primary/30">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Investment Memo</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generated {new Date(memo.generatedAt).toLocaleDateString()} &bull; Institutional grade
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportElementAsPDF('investment-memo-content', `${startup.name}-Investment-Memo.pdf`)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-border hover:bg-muted/50 transition"
            >
              <Download className="h-3 w-3" /> Export PDF
            </button>
            <div className={`px-4 py-2 rounded-lg ${recConfig.bg}`}>
              <span className={`text-lg font-bold ${recConfig.color}`}>{recConfig.label}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-muted-foreground">Conviction:</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className={`w-1.5 h-3 rounded-sm ${i < memo.convictionLevel ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-mono font-bold text-foreground">{memo.convictionLevel}/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-4 rounded-lg bg-card/80 p-3 border border-border/50">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Executive Summary
          </p>
          <p className="text-xs text-foreground leading-relaxed">{memo.executiveSummary}</p>
        </div>

        {/* ChainTrust verification badge */}
        <div className="mt-3 flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary">
            <Shield className="h-3 w-3" />
            CTS: {memo.chainTrustData.ctsScore}/100
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${memo.chainTrustData.verificationStatus.includes('verified') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
            {memo.chainTrustData.verificationStatus}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground">
            <Target className="h-3 w-3" />
            {(memo.chainTrustData.survivalProbability * 100).toFixed(0)}% survival (12mo)
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {memo.chainTrustData.redFlagCount} red flags
          </span>
        </div>
      </div>

      {/* Bull/Bear Case */}
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="p-4">
          <h4 className="text-xs font-bold text-emerald-500 flex items-center gap-1 mb-2">
            <ThumbsUp className="h-3.5 w-3.5" /> Bull Case
          </h4>
          <ul className="space-y-1.5">
            {memo.bullCase.map((point, i) => (
              <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4">
          <h4 className="text-xs font-bold text-red-500 flex items-center gap-1 mb-2">
            <ThumbsDown className="h-3.5 w-3.5" /> Bear Case
          </h4>
          <ul className="space-y-1.5">
            {memo.bearCase.map((point, i) => (
              <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5 shrink-0">-</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key Metrics Table */}
      <div className="border-b border-border overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Metric</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Value</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Benchmark</th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">Assessment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {memo.keyMetrics.map(m => (
              <tr key={m.metric} className="hover:bg-muted/10">
                <td className="px-3 py-1.5 font-medium text-foreground">{m.metric}</td>
                <td className="px-3 py-1.5 text-right font-mono">{m.value}</td>
                <td className="px-3 py-1.5 text-right text-muted-foreground">{m.benchmark}</td>
                <td className="px-3 py-1.5 text-center">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    ['Strong', 'High', 'Healthy', 'Clean', 'Verified', 'Above'].includes(m.assessment)
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : ['Weak', 'Concerns', 'Tight', 'Unverified', 'Below'].includes(m.assessment)
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {m.assessment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Memo Sections */}
      <div>
        {memo.sections.map((section, i) => (
          <MemoSection key={i} section={section} index={i} />
        ))}
      </div>

      {/* Suggested Terms */}
      <div className="border-t border-border p-4 bg-primary/5">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1 mb-2">
          <DollarSign className="h-3.5 w-3.5 text-primary" /> Suggested Investment Terms
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Instrument</p>
            <p className="text-xs font-bold text-foreground">{memo.suggestedTerms.instrument}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Amount</p>
            <p className="text-xs font-bold text-foreground">{memo.suggestedTerms.amount}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Valuation</p>
            <p className="text-xs font-bold text-foreground">{memo.suggestedTerms.valuation}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {memo.suggestedTerms.keyTerms.map((term, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
