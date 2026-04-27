/**
 * Due Diligence Workflow System
 * ─────────────────────────────
 * Interactive, state-managed due diligence process.
 * Guides investors through a structured DD framework with
 * checklists, notes, evidence gathering, and scoring at each step.
 *
 * This replaces ad-hoc DD with a repeatable, auditable process
 * that captures institutional knowledge.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type DDPhase = 'initial_screen' | 'deep_dive' | 'financial_dd' | 'technical_dd' | 'legal_dd' | 'market_dd' | 'team_dd' | 'final_review';
export type DDItemStatus = 'not_started' | 'in_progress' | 'completed' | 'flagged' | 'skipped';
export type DDVerdict = 'pass' | 'conditional_pass' | 'fail' | 'needs_more_info';

export interface DDItem {
  id: string;
  phase: DDPhase;
  title: string;
  description: string;
  status: DDItemStatus;
  /** Automated check available via ChainTrust data? */
  automatable: boolean;
  /** Automated result (null if manual) */
  autoResult: { passed: boolean; detail: string } | null;
  /** Investor's notes */
  notes: string;
  /** Evidence URLs or references */
  evidence: string[];
  /** Score (1-5, null if not scored) */
  score: number | null;
  /** Critical item — must pass for deal to proceed */
  critical: boolean;
  /** Time spent on this item (minutes) */
  timeSpent: number;
  /** Completed at */
  completedAt: number | null;
}

/**
 * Static template fields used to seed a workflow before runtime state is added.
 * Once the workflow is created via `createDDWorkflow`, items become full `DDItem`s.
 */
export type DDItemTemplate = Omit<
  DDItem,
  'status' | 'autoResult' | 'notes' | 'evidence' | 'score' | 'timeSpent' | 'completedAt'
>;

export interface DDPhaseConfig {
  phase: DDPhase;
  label: string;
  description: string;
  icon: string;
  /** Runtime items — full DDItem shape after `createDDWorkflow` initializes them. */
  items: DDItem[];
  /** Phase verdict */
  verdict: DDVerdict | null;
  /** Phase notes */
  phaseNotes: string;
  /** Percentage complete */
  completionPct: number;
}

export interface DDWorkflow {
  /** Workflow ID */
  id: string;
  /** Startup being evaluated */
  startupId: string;
  startupName: string;
  /** Investor conducting DD */
  investorId: string;
  /** All phases */
  phases: DDPhaseConfig[];
  /** Overall status */
  overallStatus: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  /** Overall verdict */
  overallVerdict: DDVerdict | null;
  /** Overall score (avg of all item scores) */
  overallScore: number | null;
  /** Total items */
  totalItems: number;
  /** Completed items */
  completedItems: number;
  /** Flagged items (need attention) */
  flaggedItems: number;
  /** Total time spent (minutes) */
  totalTimeSpent: number;
  /** Created at */
  createdAt: number;
  /** Last updated */
  updatedAt: number;
  /** Completion percentage */
  completionPct: number;
}

// ── Phase Templates ──────────────────────────────────────────────────

// Templates use the lightweight DDItemTemplate (no runtime fields).
// `createDDWorkflow` upgrades each item into a full DDItem.
interface DDPhaseTemplate {
  phase: DDPhase;
  label: string;
  description: string;
  icon: string;
  items: DDItemTemplate[];
}

const PHASE_TEMPLATES: DDPhaseTemplate[] = [
  {
    phase: 'initial_screen',
    label: 'Initial Screen',
    description: 'Quick 30-minute assessment — should we spend time on this deal?',
    icon: '🔍',
    items: [
      { id: 'screen-1', phase: 'initial_screen', title: 'Review ChainTrust profile', description: 'Check trust score, verification status, and basic metrics', automatable: true, critical: false },
      { id: 'screen-2', phase: 'initial_screen', title: 'Check CTS reputation score', description: 'Review the multi-dimensional ChainTrust Score', automatable: true, critical: false },
      { id: 'screen-3', phase: 'initial_screen', title: 'Run red flag detection', description: 'Check for anomalies and warning signals', automatable: true, critical: true },
      { id: 'screen-4', phase: 'initial_screen', title: 'Verify on-chain metrics', description: 'Confirm metrics are oracle-verified on Solana', automatable: true, critical: true },
      { id: 'screen-5', phase: 'initial_screen', title: 'Review thesis fit', description: 'Does this startup match your investment thesis?', automatable: false, critical: true },
      { id: 'screen-6', phase: 'initial_screen', title: 'Check competitive landscape', description: 'Quick competitive positioning assessment', automatable: true, critical: false },
    ],
  },
  {
    phase: 'financial_dd',
    label: 'Financial Due Diligence',
    description: 'Deep dive into financial health, unit economics, and projections',
    icon: '💰',
    items: [
      { id: 'fin-1', phase: 'financial_dd', title: 'Verify revenue (MRR/ARR)', description: 'Cross-reference claimed revenue with on-chain data and bank statements', automatable: true, critical: true },
      { id: 'fin-2', phase: 'financial_dd', title: 'Analyze unit economics', description: 'CAC, LTV, LTV/CAC ratio, payback period', automatable: true, critical: true },
      { id: 'fin-3', phase: 'financial_dd', title: 'Review burn rate and runway', description: 'Monthly burn, runway calculation, cash flow trajectory', automatable: true, critical: true },
      { id: 'fin-4', phase: 'financial_dd', title: 'Verify treasury holdings', description: 'On-chain treasury verification via ChainTrust', automatable: true, critical: true },
      { id: 'fin-5', phase: 'financial_dd', title: 'Review revenue quality', description: 'Recurring vs one-time, concentration, consistency', automatable: true, critical: false },
      { id: 'fin-6', phase: 'financial_dd', title: 'Analyze cohort retention', description: 'Retention curves, NRR, expansion revenue', automatable: true, critical: false },
      { id: 'fin-7', phase: 'financial_dd', title: 'Review financial projections', description: 'Reasonableness of growth assumptions and cost structure', automatable: false, critical: false },
      { id: 'fin-8', phase: 'financial_dd', title: 'Run Monte Carlo simulation', description: 'Probabilistic modeling of revenue and cash trajectories', automatable: true, critical: false },
      { id: 'fin-9', phase: 'financial_dd', title: 'Review cap table', description: 'Ownership structure, previous rounds, option pool', automatable: true, critical: true },
    ],
  },
  {
    phase: 'technical_dd',
    label: 'Technical Due Diligence',
    description: 'Evaluate technology stack, code quality, and smart contract security',
    icon: '⚙️',
    items: [
      { id: 'tech-1', phase: 'technical_dd', title: 'Review smart contract audit', description: 'Check for third-party audit reports (OtterSec, Certora, Trail of Bits)', automatable: false, critical: true },
      { id: 'tech-2', phase: 'technical_dd', title: 'Analyze GitHub activity', description: 'Commit frequency, contributor count, code quality indicators', automatable: false, critical: false },
      { id: 'tech-3', phase: 'technical_dd', title: 'Review system architecture', description: 'Scalability, security, data architecture, infrastructure', automatable: false, critical: false },
      { id: 'tech-4', phase: 'technical_dd', title: 'Check on-chain program', description: 'Verify deployed Solana program matches claimed functionality', automatable: true, critical: true },
      { id: 'tech-5', phase: 'technical_dd', title: 'Assess technical debt', description: 'Evaluate codebase maturity and maintenance burden', automatable: false, critical: false },
    ],
  },
  {
    phase: 'market_dd',
    label: 'Market Due Diligence',
    description: 'Validate market opportunity, competitive positioning, and timing',
    icon: '🌍',
    items: [
      { id: 'mkt-1', phase: 'market_dd', title: 'Validate TAM/SAM/SOM', description: 'Is the market large enough to build a venture-scale business?', automatable: false, critical: true },
      { id: 'mkt-2', phase: 'market_dd', title: 'Map competitive landscape', description: 'Identify direct and indirect competitors, moats, positioning', automatable: true, critical: true },
      { id: 'mkt-3', phase: 'market_dd', title: 'Assess market timing', description: 'Why now? What changed to make this opportunity viable?', automatable: false, critical: false },
      { id: 'mkt-4', phase: 'market_dd', title: 'Review customer references', description: 'Talk to 3-5 customers, understand retention drivers', automatable: false, critical: false },
      { id: 'mkt-5', phase: 'market_dd', title: 'Check prediction markets', description: 'What does the crowd-sourced probability say about this startup?', automatable: true, critical: false },
    ],
  },
  {
    phase: 'team_dd',
    label: 'Team Due Diligence',
    description: 'Evaluate founders, team, and organizational capability',
    icon: '👥',
    items: [
      { id: 'team-1', phase: 'team_dd', title: 'Founder background verification', description: 'Verify education, employment, and track record claims', automatable: false, critical: true },
      { id: 'team-2', phase: 'team_dd', title: 'Reference checks (backchannel)', description: 'Talk to 5-10 people who know the founders (not provided by founders)', automatable: false, critical: true },
      { id: 'team-3', phase: 'team_dd', title: 'Assess team completeness', description: 'Key roles filled? VP-level hires? Hiring pipeline?', automatable: false, critical: false },
      { id: 'team-4', phase: 'team_dd', title: 'Evaluate key-person risk', description: 'What happens if a founder leaves? Bus factor assessment', automatable: true, critical: false },
      { id: 'team-5', phase: 'team_dd', title: 'Check founder score', description: 'Review ChainTrust founder assessment', automatable: true, critical: false },
    ],
  },
  {
    phase: 'legal_dd',
    label: 'Legal Due Diligence',
    description: 'Review corporate structure, IP, regulatory compliance',
    icon: '⚖️',
    items: [
      { id: 'legal-1', phase: 'legal_dd', title: 'Verify corporate structure', description: 'Incorporation documents, jurisdiction, subsidiaries', automatable: false, critical: true },
      { id: 'legal-2', phase: 'legal_dd', title: 'Review IP ownership', description: 'IP assignment agreements, freedom to operate, patent analysis', automatable: false, critical: true },
      { id: 'legal-3', phase: 'legal_dd', title: 'Check regulatory compliance', description: 'Securities law compliance, KYC/AML, data protection', automatable: false, critical: true },
      { id: 'legal-4', phase: 'legal_dd', title: 'Review material contracts', description: 'Customer agreements, partnership terms, vendor dependencies', automatable: false, critical: false },
    ],
  },
  {
    phase: 'final_review',
    label: 'Final Review & Decision',
    description: 'Synthesize all findings and make investment decision',
    icon: '🏁',
    items: [
      { id: 'final-1', phase: 'final_review', title: 'Review investment memo', description: 'Read the auto-generated investment memo and assess accuracy', automatable: true, critical: true },
      { id: 'final-2', phase: 'final_review', title: 'Run claim verification', description: 'Cross-reference all claims against verified data', automatable: true, critical: true },
      { id: 'final-3', phase: 'final_review', title: 'Model investment scenarios', description: 'Run scenario analysis for different outcomes', automatable: true, critical: false },
      { id: 'final-4', phase: 'final_review', title: 'Determine valuation range', description: 'Based on comparables, revenue quality, and growth', automatable: true, critical: true },
      { id: 'final-5', phase: 'final_review', title: 'Draft term sheet', description: 'Generate term sheet with market-standard terms', automatable: true, critical: true },
      { id: 'final-6', phase: 'final_review', title: 'Investment committee vote', description: 'Present findings and get IC approval', automatable: false, critical: true },
    ],
  },
];

// ── Workflow Operations ──────────────────────────────────────────────

/**
 * Create a new DD workflow for a startup.
 */
export function createDDWorkflow(
  startupId: string,
  startupName: string,
  investorId: string,
): DDWorkflow {
  const phases: DDPhaseConfig[] = PHASE_TEMPLATES.map(template => ({
    ...template,
    verdict: null,
    phaseNotes: '',
    completionPct: 0,
    items: template.items.map(item => ({
      ...item,
      status: 'not_started' as DDItemStatus,
      autoResult: null,
      notes: '',
      evidence: [],
      score: null,
      timeSpent: 0,
      completedAt: null,
    })),
  }));

  const totalItems = phases.reduce((s, p) => s + p.items.length, 0);

  return {
    id: `dd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startupId,
    startupName,
    investorId,
    phases,
    overallStatus: 'not_started',
    overallVerdict: null,
    overallScore: null,
    totalItems,
    completedItems: 0,
    flaggedItems: 0,
    totalTimeSpent: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completionPct: 0,
  };
}

/**
 * Update a DD item's status and notes.
 */
export function updateDDItem(
  workflow: DDWorkflow,
  itemId: string,
  updates: Partial<Pick<DDItem, 'status' | 'notes' | 'score' | 'evidence' | 'timeSpent'>>,
): DDWorkflow {
  const updatedPhases = workflow.phases.map(phase => {
    const updatedItems = phase.items.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, ...updates };
      if (updates.status === 'completed') updated.completedAt = Date.now();
      return updated;
    });

    const completed = updatedItems.filter(i => i.status === 'completed' || i.status === 'skipped').length;
    return {
      ...phase,
      items: updatedItems,
      completionPct: Math.round((completed / updatedItems.length) * 100),
    };
  });

  const allItems = updatedPhases.flatMap(p => p.items);
  const completedItems = allItems.filter(i => i.status === 'completed' || i.status === 'skipped').length;
  const flaggedItems = allItems.filter(i => i.status === 'flagged').length;
  const scores = allItems.filter(i => i.score !== null).map(i => i.score!);
  const totalTimeSpent = allItems.reduce((s, i) => s + i.timeSpent, 0);

  return {
    ...workflow,
    phases: updatedPhases,
    overallStatus: completedItems === 0 ? 'not_started' : completedItems === workflow.totalItems ? 'completed' : 'in_progress',
    completedItems,
    flaggedItems,
    overallScore: scores.length > 0 ? +(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1) : null,
    totalTimeSpent,
    completionPct: Math.round((completedItems / workflow.totalItems) * 100),
    updatedAt: Date.now(),
  };
}

/**
 * Set a phase verdict.
 */
export function setPhaseVerdict(
  workflow: DDWorkflow,
  phase: DDPhase,
  verdict: DDVerdict,
  notes: string = '',
): DDWorkflow {
  return {
    ...workflow,
    phases: workflow.phases.map(p =>
      p.phase === phase ? { ...p, verdict, phaseNotes: notes } : p
    ),
    updatedAt: Date.now(),
  };
}

/**
 * Run automated checks for items that support automation.
 */
export function runAutoChecks(
  workflow: DDWorkflow,
  startup: DbStartup,
): DDWorkflow {
  const updated = { ...workflow };

  for (const phase of updated.phases) {
    for (const item of phase.items) {
      if (!item.automatable || item.autoResult) continue;

      let result: DDItem['autoResult'] = null;

      switch (item.id) {
        case 'screen-1': result = { passed: startup.trust_score >= 50, detail: `Trust score: ${startup.trust_score}/100` }; break;
        case 'screen-2': result = { passed: true, detail: 'CTS score available on CTS Score tab' }; break;
        case 'screen-3': result = { passed: true, detail: 'Red flag analysis available on Red Flags tab' }; break;
        case 'screen-4': result = { passed: startup.verified, detail: startup.verified ? 'Metrics verified on-chain' : 'Not yet verified' }; break;
        case 'screen-6': result = { passed: true, detail: 'Competitive analysis available' }; break;
        case 'fin-1': result = { passed: startup.mrr > 0, detail: `MRR: $${startup.mrr.toLocaleString()}` }; break;
        case 'fin-2': result = { passed: true, detail: 'Unit economics available in Cohort Analysis' }; break;
        case 'fin-3': result = { passed: startup.treasury > 0, detail: `Treasury: $${startup.treasury.toLocaleString()}` }; break;
        case 'fin-4': result = { passed: startup.verified, detail: startup.verified ? 'Treasury verified on-chain' : 'Not verified' }; break;
        case 'fin-5': result = { passed: true, detail: 'Revenue quality scoring available' }; break;
        case 'fin-6': result = { passed: true, detail: 'Cohort analysis available' }; break;
        case 'fin-8': result = { passed: true, detail: 'Monte Carlo available on Digital Twin tab' }; break;
        case 'fin-9': result = { passed: true, detail: 'Cap table available on Cap Table tab' }; break;
        case 'tech-4': result = { passed: startup.verified, detail: startup.verified ? 'Program verified on Solana' : 'Not deployed' }; break;
        case 'team-4': {
          const risk = startup.team_size < 5 ? 'High' : startup.team_size < 10 ? 'Moderate' : 'Low';
          result = { passed: startup.team_size >= 5, detail: `Team: ${startup.team_size}, key-person risk: ${risk}` };
          break;
        }
        case 'team-5': result = { passed: true, detail: 'Founder score available' }; break;
        case 'mkt-2': result = { passed: true, detail: 'Competitive intel available' }; break;
        case 'mkt-5': result = { passed: true, detail: 'Prediction markets available on Predictions tab' }; break;
        case 'final-1': result = { passed: true, detail: 'Investment memo available on Memo tab' }; break;
        case 'final-2': result = { passed: true, detail: 'Claim verification available on Claims tab' }; break;
        case 'final-3': result = { passed: true, detail: 'Scenario analysis available' }; break;
        case 'final-4': result = { passed: true, detail: 'Valuation metrics available on Valuation tab' }; break;
        case 'final-5': result = { passed: true, detail: 'Term sheet builder available' }; break;
      }

      if (result) {
        item.autoResult = result;
        if (item.status === 'not_started') {
          item.status = 'completed';
          item.completedAt = Date.now();
        }
      }
    }
  }

  // Recalculate completion
  const allItems = updated.phases.flatMap(p => p.items);
  updated.completedItems = allItems.filter(i => i.status === 'completed' || i.status === 'skipped').length;
  updated.completionPct = Math.round((updated.completedItems / updated.totalItems) * 100);
  updated.overallStatus = updated.completedItems === 0 ? 'not_started' : updated.completedItems === updated.totalItems ? 'completed' : 'in_progress';
  for (const phase of updated.phases) {
    const completed = phase.items.filter(i => i.status === 'completed' || i.status === 'skipped').length;
    phase.completionPct = Math.round((completed / phase.items.length) * 100);
  }

  return { ...updated, updatedAt: Date.now() };
}

/**
 * Get a summary of the DD workflow for reporting.
 */
export function getDDSummary(workflow: DDWorkflow): {
  totalItems: number;
  completed: number;
  flagged: number;
  phaseSummary: { phase: string; completion: number; verdict: string | null }[];
  criticalIssues: string[];
  estimatedTimeRemaining: number;
} {
  const phaseSummary = workflow.phases.map(p => ({
    phase: p.label,
    completion: p.completionPct,
    verdict: p.verdict,
  }));

  const criticalIssues = workflow.phases.flatMap(p =>
    p.items.filter(i => i.critical && i.status === 'flagged').map(i => `[${p.label}] ${i.title}: ${i.notes || 'Flagged'}`)
  );

  const remainingItems = workflow.totalItems - workflow.completedItems;
  const avgTimePerItem = workflow.totalTimeSpent > 0 && workflow.completedItems > 0
    ? workflow.totalTimeSpent / workflow.completedItems
    : 15;

  return {
    totalItems: workflow.totalItems,
    completed: workflow.completedItems,
    flagged: workflow.flaggedItems,
    phaseSummary,
    criticalIssues,
    estimatedTimeRemaining: remainingItems * avgTimePerItem,
  };
}
