/**
 * ZK Proof Panel
 * ──────────────
 * Demonstrates zero-knowledge range proofs for startup metrics.
 * Users can generate and verify proofs that metrics lie within ranges
 * without revealing exact values.
 *
 * "I can prove my MRR is between $50K and $500K without telling you the number."
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Unlock, Eye, EyeOff, Zap, CheckCircle2, XCircle,
  Loader2, ChevronDown, ChevronUp, Binary,
} from 'lucide-react';
import type { DbStartup } from '@/types/database';
import {
  generateRangeProof,
  verifyRangeProof,
  generateZKMetricsPublish,
  getZKTierAccess,
  METRIC_RANGE_CONFIGS,
  type RangeProof,
  type ZKMetricsPublish,
  type ZKTierAccess,
} from '@/lib/zk-range-proof';

// ── Proof Card ───────────────────────────────────────────────────────

function ProofCard({ proof, onVerify }: { proof: RangeProof; onVerify: (proof: RangeProof) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; timeMs: number } | null>(null);

  const config = METRIC_RANGE_CONFIGS[proof.metric];
  const range = config?.ranges.find(r => r.min === proof.rangeMin && r.max === proof.rangeMax);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    const result = await verifyRangeProof(proof);
    setVerificationResult({ valid: result.valid, timeMs: result.verificationTimeMs });
    setVerifying(false);
  }, [proof]);

  return (
    <div className={`rounded-lg border ${proof.isValid ? 'border-emerald-500/20' : 'border-red-500/20'} overflow-hidden`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${proof.isValid ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {proof.isValid ? <Lock className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{config?.label ?? proof.metric}</p>
              <p className="text-[10px] text-muted-foreground">
                Proves value ∈ [{proof.rangeMin.toLocaleString()}, {proof.rangeMax.toLocaleString()}]
                {range && <span className="text-primary ml-1">({range.label})</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition disabled:opacity-50"
            >
              {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify'}
            </button>
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Verification result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-2 flex items-center gap-2 text-[10px] p-1.5 rounded ${verificationResult.valid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
          >
            {verificationResult.valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {verificationResult.valid ? 'Proof verified — value is within stated range' : 'Proof verification failed'}
            <span className="text-muted-foreground ml-auto">{verificationResult.timeMs.toFixed(1)}ms</span>
          </motion.div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="font-mono">{proof.proofSizeBytes} bytes</span>
          <span>Gen: {proof.generationTimeMs.toFixed(1)}ms</span>
          <span>Verify: {proof.verificationTimeMs.toFixed(1)}ms</span>
        </div>
      </div>

      {/* Expanded: proof details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
              <div className="rounded bg-muted/20 p-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Commitment (public)</p>
                <p className="text-[10px] font-mono text-foreground break-all">{proof.commitment}</p>
              </div>
              <div className="rounded bg-muted/20 p-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Proof Hash (for on-chain storage)</p>
                <p className="text-[10px] font-mono text-foreground break-all">{proof.proofHash}</p>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <Binary className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground">
                  On-chain cost: ~${(0.00025).toFixed(5)} SOL per verification
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Tier Access Display ──────────────────────────────────────────────

function TierAccessCard({ tier }: { tier: ZKTierAccess }) {
  return (
    <div className="rounded-lg border bg-muted/10 p-3">
      <p className="text-xs font-bold text-foreground">{tier.tier}</p>
      <p className="text-[10px] text-primary font-mono mt-1">{tier.example}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {tier.visibleData.map((data, i) => (
          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {data}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface ZKProofPanelProps {
  startup: DbStartup;
}

export default function ZKProofPanel({ startup }: ZKProofPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [publish, setPublish] = useState<ZKMetricsPublish | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const tierAccess = useMemo(() => getZKTierAccess(), []);

  const handleGenerateProofs = useCallback(async () => {
    setGenerating(true);
    try {
      const metrics: Record<string, number> = {
        mrr: startup.mrr,
        growth_rate: Number(startup.growth_rate),
        users: startup.users,
      };

      // Add computed burn rate and runway if possible
      if (startup.treasury > 0) {
        const burnRate = Math.max(0, startup.mrr * 0.6 - startup.mrr); // Simplified
        metrics.burn_rate = Math.abs(burnRate);
        if (burnRate > 0) {
          metrics.runway = startup.treasury / burnRate;
        }
      }

      const result = await generateZKMetricsPublish(startup.id, metrics);
      setPublish(result);
    } catch (e) {
      console.error('ZK proof generation failed:', e);
    } finally {
      setGenerating(false);
    }
  }, [startup]);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 via-primary/10 to-cyan-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card border-2 border-purple-500/30">
              <Shield className="h-7 w-7 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Zero-Knowledge Proofs</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prove metrics are in range without revealing exact values
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateProofs}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition"
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating Proofs...
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Generate ZK Proofs
              </>
            )}
          </button>
        </div>

        {/* Privacy visual */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[10px] font-bold text-red-500">WITHOUT ZK (Current)</span>
            </div>
            <p className="text-xs font-mono text-foreground">MRR: ${startup.mrr.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Exact value visible to everyone on-chain</p>
          </div>
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <EyeOff className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500">WITH ZK (Future)</span>
            </div>
            <p className="text-xs font-mono text-foreground">
              MRR: ∈ [{METRIC_RANGE_CONFIGS.mrr.ranges.find(r => startup.mrr >= r.min && startup.mrr <= r.max)?.label ?? 'Range'}]
            </p>
            <p className="text-[10px] text-muted-foreground">Only range is public — exact value is hidden</p>
          </div>
        </div>
      </div>

      {/* Generated proofs */}
      {publish && (
        <div className="p-4 space-y-3">
          {/* Summary */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {publish.proofs.length} proofs generated &bull; {publish.totalProofSizeBytes} bytes total
            </span>
            <span className="font-mono text-primary">
              Est. cost: ${publish.estimatedVerificationCost.toFixed(5)} SOL
            </span>
          </div>

          {/* Public vs Private */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 mb-1">
                <Unlock className="h-3 w-3" /> Public (visible to all)
              </p>
              {publish.publicInformation.map((info, i) => (
                <p key={i} className="text-[10px] text-foreground">{info}</p>
              ))}
            </div>
            <div className="rounded-lg bg-muted/20 p-2.5">
              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mb-1">
                <Lock className="h-3 w-3" /> Private (hidden by ZK proof)
              </p>
              {publish.privateInformation.map((info, i) => (
                <p key={i} className="text-[10px] text-foreground">{info}</p>
              ))}
            </div>
          </div>

          {/* Combined proof hash */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">Combined Proof Hash (for on-chain storage)</p>
            <p className="text-[10px] font-mono text-primary break-all">{publish.combinedProofHash}</p>
          </div>

          {/* Individual proofs */}
          <div className="space-y-2">
            {publish.proofs.map(proof => (
              <ProofCard key={proof.id} proof={proof} onVerify={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Tier access explanation */}
      <div className="border-t border-border p-4">
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-foreground">Programmable Privacy Tiers</span>
          {showPrivacy ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {showPrivacy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 mt-3">
                {tierAccess.map(tier => (
                  <TierAccessCard key={tier.tier} tier={tier} />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3">
                Higher CMT staking tiers unlock more precise data. Whale stakers see exact metrics.
                This maps directly to the existing Free/Basic/Pro/Whale tier system.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
