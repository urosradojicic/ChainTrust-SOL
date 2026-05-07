/**
 * Conviction Tracker
 * ──────────────────
 * Investment decision journal that tracks WHY you made each decision.
 * The most powerful tool for becoming a better investor over time.
 *
 * "The best investors are relentless about tracking their decisions
 *  and learning from the outcomes." — Howard Marks
 *
 * Features:
 *   - Log investment thesis for each deal
 *   - Track conviction level over time
 *   - Record decision rationale
 *   - Compare predictions vs outcomes
 *   - Pattern recognition in your own decision-making
 */

// ── Types ────────────────────────────────────────────────────────────

export type DecisionType = 'invest' | 'pass' | 'watch' | 'increase' | 'decrease' | 'exit';
export type DecisionOutcome = 'correct' | 'partially_correct' | 'too_early' | 'wrong' | 'pending';

export interface ConvictionEntry {
  id: string;
  /** Startup ID */
  startupId: string;
  startupName: string;
  /** Decision made */
  decision: DecisionType;
  /** Conviction level at time of decision (1-10) */
  conviction: number;
  /** Primary thesis (why this decision?) */
  thesis: string;
  /** Key assumptions that must be true */
  keyAssumptions: string[];
  /** What would change your mind */
  killCriteria: string[];
  /** Metrics at time of decision */
  metricsSnapshot: {
    mrr: number;
    growth: number;
    trustScore: number;
    ctsScore: number;
  };
  /** Expected outcome */
  expectedOutcome: string;
  /** Time horizon for this thesis */
  timeHorizon: string;
  /** Actual outcome (filled in later) */
  actualOutcome: DecisionOutcome;
  /** Outcome notes */
  outcomeNotes: string;
  /** What you learned */
  learnings: string;
  /** Timestamp */
  createdAt: number;
  /** Outcome review timestamp */
  reviewedAt: number | null;
  /** Tags */
  tags: string[];
}

export interface ConvictionStats {
  /** Total decisions logged */
  totalDecisions: number;
  /** Decisions by type */
  byType: Record<DecisionType, number>;
  /** Outcomes breakdown */
  byOutcome: Record<DecisionOutcome, number>;
  /** Hit rate (correct / total reviewed) */
  hitRate: number;
  /** Average conviction level */
  avgConviction: number;
  /** Hit rate at high conviction (>7) */
  highConvictionHitRate: number;
  /** Hit rate at low conviction (<4) */
  lowConvictionHitRate: number;
  /** Most common learnings */
  topLearnings: string[];
  /** Decision-making bias detected */
  biases: { bias: string; evidence: string; suggestion: string }[];
}

// ── Storage ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'chaintrust_conviction_journal';

function loadEntries(): ConvictionEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveEntries(entries: ConvictionEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Operations ───────────────────────────────────────────────────────

/**
 * Log a new investment decision.
 */
export function logDecision(
  startupId: string,
  startupName: string,
  decision: DecisionType,
  conviction: number,
  thesis: string,
  keyAssumptions: string[],
  killCriteria: string[],
  metricsSnapshot: ConvictionEntry['metricsSnapshot'],
  expectedOutcome: string,
  timeHorizon: string,
  tags: string[] = [],
): ConvictionEntry {
  const entry: ConvictionEntry = {
    id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    startupId,
    startupName,
    decision,
    conviction: Math.max(1, Math.min(10, conviction)),
    thesis,
    keyAssumptions,
    killCriteria,
    metricsSnapshot,
    expectedOutcome,
    timeHorizon,
    actualOutcome: 'pending',
    outcomeNotes: '',
    learnings: '',
    createdAt: Date.now(),
    reviewedAt: null,
    tags,
  };

  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  return entry;
}

/**
 * Review an outcome of a previous decision.
 */
export function reviewOutcome(
  entryId: string,
  outcome: DecisionOutcome,
  notes: string,
  learnings: string,
): ConvictionEntry | null {
  const entries = loadEntries();
  const entry = entries.find(e => e.id === entryId);
  if (!entry) return null;

  entry.actualOutcome = outcome;
  entry.outcomeNotes = notes;
  entry.learnings = learnings;
  entry.reviewedAt = Date.now();

  saveEntries(entries);
  return entry;
}

/**
 * Get all entries for a startup.
 */
export function getStartupEntries(startupId: string): ConvictionEntry[] {
  return loadEntries().filter(e => e.startupId === startupId);
}

/**
 * Get all entries.
 */
export function getAllEntries(): ConvictionEntry[] {
  return loadEntries();
}

/**
 * Compute conviction statistics and detect biases.
 */
export function computeConvictionStats(): ConvictionStats {
  const entries = loadEntries();

  const byType: Record<DecisionType, number> = { invest: 0, pass: 0, watch: 0, increase: 0, decrease: 0, exit: 0 };
  const byOutcome: Record<DecisionOutcome, number> = { correct: 0, partially_correct: 0, too_early: 0, wrong: 0, pending: 0 };

  for (const e of entries) {
    byType[e.decision]++;
    byOutcome[e.actualOutcome]++;
  }

  const reviewed = entries.filter(e => e.actualOutcome !== 'pending');
  const correct = reviewed.filter(e => e.actualOutcome === 'correct' || e.actualOutcome === 'partially_correct');
  const hitRate = reviewed.length > 0 ? (correct.length / reviewed.length) * 100 : 0;

  const avgConviction = entries.length > 0 ? entries.reduce((s, e) => s + e.conviction, 0) / entries.length : 0;

  const highConv = reviewed.filter(e => e.conviction >= 7);
  const highConvCorrect = highConv.filter(e => e.actualOutcome === 'correct' || e.actualOutcome === 'partially_correct');
  const highConvictionHitRate = highConv.length > 0 ? (highConvCorrect.length / highConv.length) * 100 : 0;

  const lowConv = reviewed.filter(e => e.conviction <= 3);
  const lowConvCorrect = lowConv.filter(e => e.actualOutcome === 'correct' || e.actualOutcome === 'partially_correct');
  const lowConvictionHitRate = lowConv.length > 0 ? (lowConvCorrect.length / lowConv.length) * 100 : 0;

  // Top learnings
  const learningCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.learnings) {
      const key = e.learnings.slice(0, 50);
      learningCounts.set(key, (learningCounts.get(key) ?? 0) + 1);
    }
  }
  const topLearnings = Array.from(learningCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([learning]) => learning);

  // Bias detection
  const biases: ConvictionStats['biases'] = [];

  if (byType.invest > byType.pass * 3) {
    biases.push({
      bias: 'Action Bias',
      evidence: `You invest ${byType.invest}x more than you pass — may be too eager to deploy capital.`,
      suggestion: 'Practice saying "no" more often. The best investors pass on 95%+ of deals.',
    });
  }

  if (highConvictionHitRate < lowConvictionHitRate && reviewed.length >= 5) {
    biases.push({
      bias: 'Overconfidence Bias',
      evidence: `Your high-conviction bets (${highConvictionHitRate.toFixed(0)}% hit rate) underperform low-conviction ones (${lowConvictionHitRate.toFixed(0)}%).`,
      suggestion: 'Your gut may be overriding your analysis. Trust the data more at high conviction.',
    });
  }

  const investConvictions = entries.filter(e => e.decision === 'invest').map(e => e.conviction);
  if (investConvictions.length > 0 && investConvictions.every(c => c >= 7)) {
    biases.push({
      bias: 'Conviction Inflation',
      evidence: 'All your invest decisions are rated 7+ conviction. Either you only invest in sure things (good) or you inflate your conviction (needs reflection).',
      suggestion: 'Be honest about uncertainty. A 5/10 conviction investment can still be worth making at the right price.',
    });
  }

  return {
    totalDecisions: entries.length,
    byType,
    byOutcome,
    hitRate: +hitRate.toFixed(1),
    avgConviction: +avgConviction.toFixed(1),
    highConvictionHitRate: +highConvictionHitRate.toFixed(1),
    lowConvictionHitRate: +lowConvictionHitRate.toFixed(1),
    topLearnings,
    biases,
  };
}

/**
 * Get a pre-filled decision template.
 */
export function getDecisionTemplate(decision: DecisionType): {
  suggestedAssumptions: string[];
  suggestedKillCriteria: string[];
} {
  switch (decision) {
    case 'invest':
      return {
        suggestedAssumptions: [
          'Growth rate will sustain above 15% MoM for 6+ months',
          'Team can execute on the roadmap',
          'Market opportunity is large enough (TAM > $1B)',
          'Unit economics will improve with scale',
        ],
        suggestedKillCriteria: [
          'Growth drops below 5% for 2 consecutive months',
          'Key team member leaves',
          'Major security incident or smart contract exploit',
          'Trust score drops below 50',
        ],
      };
    case 'pass':
      return {
        suggestedAssumptions: [
          'Current traction is insufficient for the valuation',
          'Team lacks critical expertise',
          'Market timing is wrong',
        ],
        suggestedKillCriteria: [
          'Growth accelerates to 25%+ (reconsider)',
          'Strong co-investor enters (signal)',
          'Market conditions change favorably',
        ],
      };
    default:
      return { suggestedAssumptions: [], suggestedKillCriteria: [] };
  }
}
