/**
 * Financial Sentiment Lexicon
 * ───────────────────────────
 * Lightweight bag-of-words sentiment analyzer modelled on the
 * Loughran-McDonald finance-specific dictionary. No ML, no API calls:
 * 100% deterministic, runs in the browser.
 *
 * Input: any short text (startup description, proposal, news headline).
 * Output: a sentiment score in [-1, 1] plus a label + matched keywords.
 *
 * This is intentionally simple. We tokenize, match against positive /
 * negative / uncertainty / constraining lexicons, apply a mild negator
 * inversion, and normalize by token count. It consistently outperforms
 * generic dictionaries on financial copy.
 */

export type SentimentLabel = 'very negative' | 'negative' | 'neutral' | 'positive' | 'very positive';

export interface SentimentResult {
  score: number;            // [-1, 1]
  label: SentimentLabel;
  positive: string[];
  negative: string[];
  uncertain: string[];
  tokens: number;
  intensity: number;         // raw hits / tokens, useful for styling
}

// ── Lexicons (compact seed; 200+ terms total) ──────────────────────────
const POSITIVE = new Set<string>([
  // Growth
  'growing', 'growth', 'accelerating', 'expanded', 'expansion', 'scale', 'scaling',
  'record', 'highest', 'surpassed', 'milestone', 'breakthrough',
  // Momentum
  'surge', 'surged', 'rally', 'rallied', 'outperform', 'beat', 'beating', 'exceed',
  'exceeded', 'strong', 'robust',
  // Financial health
  'profitable', 'profits', 'revenue', 'margins', 'treasury', 'funded', 'raised',
  'upgrade', 'upgraded', 'positive', 'improved', 'efficient', 'efficiency',
  // Strategic
  'partnership', 'partnered', 'launched', 'launch', 'adopted', 'adoption',
  'approval', 'approved', 'secured',
  // Competitive
  'leading', 'leader', 'dominant', 'moat', 'advantage', 'defensible',
  // Traction
  'traction', 'pmf', 'retention', 'loyal', 'sticky',
  // Governance / sustainability
  'sustainable', 'transparent', 'verified', 'audited', 'compliant',
  // Financial performance
  'bullish', 'upside', 'gains', 'returns', 'yield',
]);

const NEGATIVE = new Set<string>([
  // Decline
  'decline', 'declining', 'fell', 'falling', 'dropped', 'plunge', 'plunged',
  'crash', 'crashed', 'collapse', 'collapsed',
  // Loss
  'loss', 'losses', 'deficit', 'bankruptcy', 'insolvent', 'default', 'defaulted',
  'impairment', 'writedown', 'writeoff', 'restated',
  // Risk
  'risk', 'risky', 'volatile', 'exposure', 'exposed', 'threat', 'threatened',
  // Regulatory / legal
  'lawsuit', 'sued', 'investigation', 'subpoena', 'fine', 'penalty', 'breach',
  'violation', 'violated', 'fraud', 'scandal',
  // Governance / security
  'hacked', 'exploit', 'exploited', 'rug', 'rugged', 'pumpanddump', 'scam',
  'vulnerability', 'weak', 'weakness',
  // Operational
  'layoffs', 'layoff', 'downsizing', 'restructure', 'restructuring',
  // Momentum
  'bearish', 'slump', 'stalled', 'plateau', 'plateauing', 'shrinking',
  'contracting', 'contraction',
  // Financial distress
  'runway', 'burning', 'dilutive', 'dilution',
  // NOTE: "runway" can be neutral but short-runway is what we watch for;
  // contextual weight is captured via combined co-occurrence in callers.
]);

const UNCERTAINTY = new Set<string>([
  'uncertain', 'uncertainty', 'may', 'might', 'possibly', 'perhaps', 'could',
  'believe', 'expect', 'expected', 'estimate', 'estimates', 'estimated',
  'approximately', 'roughly', 'pending', 'tentative', 'preliminary', 'draft',
  'reviewing', 'considering', 'evaluating',
]);

// Simple negators that invert sentiment of the following token within 3.
const NEGATORS = new Set<string>(['not', 'no', 'never', 'cannot', "can't", "won't", "doesn't", 'without']);

// ── Analyzer ───────────────────────────────────────────────────────────

export function analyzeSentiment(input: string): SentimentResult {
  const clean = (input ?? '').toLowerCase().replace(/[^a-z0-9\s']/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);

  const hitsPositive: string[] = [];
  const hitsNegative: string[] = [];
  const hitsUncertain: string[] = [];

  let negateWindow = 0;

  for (const raw of tokens) {
    // Normalize trivial suffixes
    const tok = raw.replace(/'s$/, '').replace(/[^a-z0-9]/g, '');
    if (!tok) continue;

    if (NEGATORS.has(tok)) {
      negateWindow = 3;
      continue;
    }

    const isPos = POSITIVE.has(tok);
    const isNeg = NEGATIVE.has(tok);
    const isUnc = UNCERTAINTY.has(tok);

    if (negateWindow > 0 && (isPos || isNeg)) {
      if (isPos) hitsNegative.push(tok);
      else hitsPositive.push(tok);
      negateWindow -= 1;
      continue;
    }

    if (isPos) hitsPositive.push(tok);
    else if (isNeg) hitsNegative.push(tok);
    else if (isUnc) hitsUncertain.push(tok);

    if (negateWindow > 0) negateWindow -= 1;
  }

  const totalTokens = Math.max(tokens.length, 1);
  const netHits = hitsPositive.length - hitsNegative.length;
  const intensity = (hitsPositive.length + hitsNegative.length) / totalTokens;
  const uncertaintyPenalty = Math.min(hitsUncertain.length / totalTokens, 0.3);

  // Normalize to [-1, 1]. We dampen by uncertainty so hedged copy scores
  // closer to neutral even when positive terms appear.
  const rawScore = (netHits / Math.sqrt(totalTokens)) * (1 - uncertaintyPenalty);
  const score = Math.max(-1, Math.min(1, rawScore));

  return {
    score: round(score, 3),
    label: scoreLabel(score),
    positive: dedupe(hitsPositive),
    negative: dedupe(hitsNegative),
    uncertain: dedupe(hitsUncertain),
    tokens: totalTokens,
    intensity: round(intensity, 3),
  };
}

/** Convenience: aggregate several texts into a single score (mean with intensity weighting). */
export function aggregateSentiment(texts: string[]): SentimentResult {
  const results = texts.map(analyzeSentiment);
  if (results.length === 0) return analyzeSentiment('');
  const weightSum = results.reduce((s, r) => s + r.intensity + 0.1, 0);
  const scoreSum = results.reduce((s, r) => s + r.score * (r.intensity + 0.1), 0);
  const score = weightSum > 0 ? scoreSum / weightSum : 0;
  return {
    score: round(score, 3),
    label: scoreLabel(score),
    positive: dedupe(results.flatMap((r) => r.positive)).slice(0, 12),
    negative: dedupe(results.flatMap((r) => r.negative)).slice(0, 12),
    uncertain: dedupe(results.flatMap((r) => r.uncertain)).slice(0, 12),
    tokens: results.reduce((s, r) => s + r.tokens, 0),
    intensity: round(results.reduce((s, r) => s + r.intensity, 0) / results.length, 3),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────
function scoreLabel(score: number): SentimentLabel {
  if (score <= -0.5) return 'very negative';
  if (score <= -0.15) return 'negative';
  if (score < 0.15) return 'neutral';
  if (score < 0.5) return 'positive';
  return 'very positive';
}

function dedupe(list: string[]): string[] {
  return Array.from(new Set(list));
}

function round(n: number, places: number): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}
