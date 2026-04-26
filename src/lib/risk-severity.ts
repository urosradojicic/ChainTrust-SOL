/**
 * Quantitative risk severity scoring.
 * ──────────────────────────────────────
 * Computes per-category severity (financial, environmental, tokenomics)
 * and an overall blended score for a startup. All thresholds match the
 * deterministic `generateRiskAnalysis()` narrative in lib/risk-analysis.ts
 * so the textual recommendation and the visual severity bars never disagree.
 */

import type { DbStartup } from '@/types/database';

export type SeverityLabel = 'low' | 'moderate' | 'elevated' | 'critical';

export interface CategorySeverity {
  /** 0-100 — higher = riskier */
  score: number;
  label: SeverityLabel;
  detail: string;
}

export interface RiskSeverity {
  overall: CategorySeverity;
  financial: CategorySeverity;
  environmental: CategorySeverity;
  tokenomics: CategorySeverity;
}

const labelFor = (score: number): SeverityLabel => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'elevated';
  if (score >= 25) return 'moderate';
  return 'low';
};

export function computeRiskSeverity(s: DbStartup): RiskSeverity {
  const mrr = s.mrr ?? 0;
  const growth = Number(s.growth_rate ?? 0);
  const sustainability = s.sustainability_score ?? 0;
  const concentration = s.token_concentration_pct ?? s.whale_concentration ?? 0;
  const treasury = Number((s as unknown as { treasury?: number }).treasury ?? 0);
  const verified = Boolean(s.verified);

  // Financial: runway < 6 = critical, weak growth penalizes too.
  const runway = treasury > 0 && mrr > 0 ? treasury / (mrr * 0.7) : 0;
  let finScore = 0;
  if (runway === 0) finScore += 35;             // unknown runway = moderate flag
  else if (runway < 6) finScore += 70;
  else if (runway < 12) finScore += 40;
  else if (runway < 18) finScore += 20;
  else finScore += 5;
  if (growth < 0) finScore += 25;
  else if (growth < 5) finScore += 15;
  else if (growth >= 15) finScore -= 10;
  if (!verified) finScore += 10;
  finScore = clamp(finScore, 0, 100);

  // Environmental — inverse of sustainability.
  const envScore = clamp(100 - sustainability, 0, 100);

  // Tokenomics — concentration risk.
  let tokScore = 0;
  if (concentration > 60) tokScore = 90;
  else if (concentration > 40) tokScore = 65;
  else if (concentration > 25) tokScore = 35;
  else tokScore = 12;

  // Overall — weighted: financial 0.45, tokenomics 0.35, environmental 0.20.
  const overallScore = clamp(
    Math.round(finScore * 0.45 + tokScore * 0.35 + envScore * 0.2),
    0,
    100,
  );

  return {
    overall: {
      score: overallScore,
      label: labelFor(overallScore),
      detail: overallNarrative(overallScore, finScore, tokScore, envScore),
    },
    financial: {
      score: Math.round(finScore),
      label: labelFor(finScore),
      detail: financialNarrative(runway, growth, verified),
    },
    environmental: {
      score: Math.round(envScore),
      label: labelFor(envScore),
      detail: `Sustainability score ${sustainability}/100. ${
        sustainability >= 70 ? 'Strong ESG positioning.' : sustainability >= 50 ? 'Average — improvement possible.' : 'Below institutional standard.'
      }`,
    },
    tokenomics: {
      score: Math.round(tokScore),
      label: labelFor(tokScore),
      detail: `Top wallet concentration ${concentration.toFixed(1)}%. ${
        concentration > 40
          ? 'High concentration creates governance and sell-pressure risk.'
          : concentration > 25
          ? 'Moderate concentration — monitor for top-wallet movement.'
          : 'Distribution looks healthy.'
      }`,
    },
  };
}

/**
 * Compute the percentile rank of a startup's overall risk among peers in
 * the same category. Returns 0-100 — lower is *better* (less risky than peers).
 */
export function riskPercentile(target: DbStartup, peers: DbStartup[]): number {
  if (peers.length === 0) return 50;
  const targetScore = computeRiskSeverity(target).overall.score;
  const sameCat = peers.filter((p) => p.category === target.category && p.id !== target.id);
  if (sameCat.length === 0) return 50;
  const lowerCount = sameCat.filter((p) => computeRiskSeverity(p).overall.score < targetScore).length;
  return Math.round((lowerCount / sameCat.length) * 100);
}

// ── Helpers ───────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function financialNarrative(runway: number, growth: number, verified: boolean): string {
  const r = runway === 0 ? 'unknown' : `${runway.toFixed(1)} months`;
  const g = growth >= 15 ? 'strong' : growth >= 5 ? 'moderate' : growth >= 0 ? 'modest' : 'declining';
  const v = verified ? 'verified on-chain' : 'self-reported';
  return `Runway ${r}; growth ${g} (${growth.toFixed(1)}%); metrics ${v}.`;
}

function overallNarrative(
  overall: number,
  financial: number,
  tokenomics: number,
  environmental: number,
): string {
  const driver =
    Math.max(financial, tokenomics, environmental) === financial
      ? 'financial'
      : Math.max(financial, tokenomics, environmental) === tokenomics
      ? 'tokenomics'
      : 'environmental';
  if (overall >= 75) return `Critical risk — ${driver} category dominates the profile.`;
  if (overall >= 50) return `Elevated risk — ${driver} is the main driver to address.`;
  if (overall >= 25) return `Moderate profile — ${driver} is the largest open question.`;
  return `Low overall risk — ${driver} is still the largest residual factor.`;
}
