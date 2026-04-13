/**
 * Claim Verification Matrix
 * ─────────────────────────
 * Visual matrix showing each startup claim's verification status.
 * Cross-references stated metrics against on-chain and computed data.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX, ShieldOff, ChevronDown, ChevronUp, Search, AlertCircle } from 'lucide-react';
import type { DbStartup, DbMetricsHistory } from '@/types/database';
import { verifyAllClaims, CLAIM_STATUS_CONFIG, type ClaimVerificationReport, type Claim, type ClaimStatus } from '@/lib/claim-verification';

const STATUS_ICONS: Record<ClaimStatus, typeof ShieldCheck> = {
  verified: ShieldCheck,
  plausible: ShieldQuestion,
  unverified: ShieldOff,
  contradicted: ShieldX,
  insufficient_data: ShieldAlert,
};

const STATUS_COLORS: Record<ClaimStatus, { text: string; bg: string; ring: string }> = {
  verified:          { text: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
  plausible:         { text: 'text-blue-500',    bg: 'bg-blue-500/10',    ring: 'ring-blue-500/20' },
  unverified:        { text: 'text-gray-500',    bg: 'bg-gray-500/10',    ring: 'ring-gray-500/20' },
  contradicted:      { text: 'text-red-500',     bg: 'bg-red-500/10',     ring: 'ring-red-500/20' },
  insufficient_data: { text: 'text-gray-400',    bg: 'bg-gray-400/10',    ring: 'ring-gray-400/20' },
};

const ASSESSMENT_LABELS = {
  highly_credible: { label: 'Highly Credible', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  mostly_credible: { label: 'Mostly Credible', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  mixed:           { label: 'Mixed Signals',   color: 'text-amber-500', bg: 'bg-amber-500/10' },
  questionable:    { label: 'Questionable',     color: 'text-orange-500', bg: 'bg-orange-500/10' },
  unreliable:      { label: 'Unreliable',       color: 'text-red-500', bg: 'bg-red-500/10' },
};

function ClaimRow({ claim }: { claim: Claim }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = STATUS_ICONS[claim.status];
  const colors = STATUS_COLORS[claim.status];

  return (
    <div className={`border-b border-border/50 last:border-0`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition text-left"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
          <Icon className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{claim.statement}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
              {CLAIM_STATUS_CONFIG[claim.status].label}
            </span>
            <span className="text-[10px] text-muted-foreground capitalize">{claim.category}</span>
            {claim.discrepancy !== null && Math.abs(claim.discrepancy) > 5 && (
              <span className={`text-[10px] font-mono ${claim.discrepancy > 0 ? 'text-amber-500' : 'text-blue-500'}`}>
                {claim.discrepancy > 0 ? '+' : ''}{claim.discrepancy}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground">{(claim.confidence * 100).toFixed(0)}% conf.</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 pl-14 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/20 p-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Claimed</p>
              <p className="text-xs font-mono font-medium text-foreground">{claim.claimedValue}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Verified</p>
              <p className="text-xs font-mono font-medium text-foreground">{claim.verifiedValue}</p>
            </div>
          </div>
          <div className="rounded-lg bg-muted/20 p-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Analysis</p>
            <p className="text-xs text-foreground">{claim.explanation}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>Source: <span className="text-foreground">{claim.source.replace(/_/g, ' ')}</span></span>
            <span>Confidence: <span className="font-mono text-foreground">{(claim.confidence * 100).toFixed(0)}%</span></span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface ClaimVerificationMatrixProps {
  startup: DbStartup;
  metrics: DbMetricsHistory[];
  allStartups: DbStartup[];
}

export default function ClaimVerificationMatrix({ startup, metrics, allStartups }: ClaimVerificationMatrixProps) {
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('all');

  const report: ClaimVerificationReport = useMemo(
    () => verifyAllClaims(startup, metrics, allStartups),
    [startup, metrics, allStartups],
  );

  const assessment = ASSESSMENT_LABELS[report.assessment];
  const filteredClaims = filter === 'all' ? report.claims : report.claims.filter(c => c.status === filter);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-emerald-500/5 to-blue-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-primary/30">
              <Search className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Claim Verification Matrix</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cross-referencing {report.claims.length} claims against verified data
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold font-mono ${assessment.color}`}>{report.credibilityScore}</span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${assessment.bg} ${assessment.color} mt-1`}>
              {assessment.label}
            </div>
          </div>
        </div>

        {/* Status summary */}
        <div className="flex items-center gap-2 mt-4">
          {(Object.entries(report.counts) as [ClaimStatus, number][]).map(([status, count]) => {
            const colors = STATUS_COLORS[status];
            return (
              <button
                key={status}
                onClick={() => setFilter(filter === status ? 'all' : status)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition
                  ${filter === status ? colors.bg + ' ' + colors.text + ' ring-1 ring-inset ' + colors.ring : 'text-muted-foreground hover:text-foreground'}
                  ${count === 0 ? 'opacity-40' : ''}`}
              >
                <span className="font-mono">{count}</span>
                <span>{CLAIM_STATUS_CONFIG[status].label}</span>
              </button>
            );
          })}
          {report.materialDiscrepancies > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-red-500 ml-auto">
              <AlertCircle className="h-3 w-3" />
              {report.materialDiscrepancies} material discrepancies
            </span>
          )}
        </div>
      </div>

      {/* Claims list */}
      <div>
        {filteredClaims.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No claims matching this filter.
          </div>
        ) : (
          filteredClaims.map(claim => <ClaimRow key={claim.id} claim={claim} />)
        )}
      </div>
    </div>
  );
}
