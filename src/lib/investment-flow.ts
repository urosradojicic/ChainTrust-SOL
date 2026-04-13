/**
 * Investment Flow Engine
 * ──────────────────────
 * Manages the complete end-to-end investment lifecycle:
 *   Discovery → Screening → DD → Valuation → Terms → Legal → Deploy → Monitor → Exit
 *
 * Tracks where each potential investment is in the pipeline,
 * what actions are needed, and provides stage-specific tools.
 */

// ── Types ────────────────────────────────────────────────────────────

export type PipelineStage =
  | 'discovered'
  | 'screening'
  | 'due_diligence'
  | 'valuation'
  | 'term_sheet'
  | 'legal_review'
  | 'capital_deployment'
  | 'monitoring'
  | 'exit';

export type DealOutcome = 'active' | 'passed' | 'invested' | 'exited' | 'written_off';

export interface PipelineDeal {
  /** Unique deal ID */
  id: string;
  /** Startup ID in ChainTrust */
  startupId: string;
  /** Startup name */
  startupName: string;
  /** Startup category */
  category: string;
  /** Current pipeline stage */
  stage: PipelineStage;
  /** Deal outcome */
  outcome: DealOutcome;
  /** How the deal was sourced */
  source: 'screener' | 'referral' | 'inbound' | 'event' | 'ai_match';
  /** Date entered pipeline */
  discoveredAt: number;
  /** Date of last stage transition */
  lastUpdatedAt: number;
  /** Investment amount (null if not yet determined) */
  investmentAmount: number | null;
  /** Instrument type (null if not yet determined) */
  instrumentType: string | null;
  /** Notes from the investor */
  notes: string;
  /** Tags for categorization */
  tags: string[];
  /** Checklist of DD items completed */
  ddChecklist: DDChecklistItem[];
  /** Associated term sheet ID (null if none) */
  termSheetId: string | null;
  /** Associated escrow deal ID (null if none) */
  escrowDealId: string | null;
  /** Priority (1-5, 1 = highest) */
  priority: number;
  /** Investor's conviction score (1-10) */
  convictionScore: number;
  /** Red flag count from analysis */
  redFlagCount: number;
  /** ChainTrust Score at time of analysis */
  ctsScore: number | null;
}

export interface DDChecklistItem {
  /** Item name */
  name: string;
  /** Category */
  category: 'financial' | 'technical' | 'legal' | 'market' | 'team';
  /** Whether completed */
  completed: boolean;
  /** Notes */
  notes: string;
}

export interface PipelineStats {
  /** Total deals in pipeline */
  totalDeals: number;
  /** Deals by stage */
  byStage: Record<PipelineStage, number>;
  /** Deals by outcome */
  byOutcome: Record<DealOutcome, number>;
  /** Average time in pipeline (days) */
  avgTimeInPipeline: number;
  /** Conversion rate (discovered → invested) */
  conversionRate: number;
  /** Total invested amount */
  totalInvested: number;
  /** Total deals passed on */
  totalPassed: number;
}

// ── Stage Configuration ──────────────────────────────────────────────

export const PIPELINE_STAGES: Record<PipelineStage, {
  label: string;
  description: string;
  actions: string[];
  requiredBefore: string[];
  color: string;
  icon: string;
}> = {
  discovered: {
    label: 'Discovered',
    description: 'Deal identified but not yet evaluated',
    actions: ['Review startup profile', 'Check trust score', 'Initial metrics scan'],
    requiredBefore: [],
    color: '#6B7280',
    icon: '🔍',
  },
  screening: {
    label: 'Screening',
    description: 'Initial evaluation against investment thesis',
    actions: ['Run red flag detection', 'Check CTS score', 'Review AI due diligence', 'Compare against peers'],
    requiredBefore: ['View startup detail page'],
    color: '#3B82F6',
    icon: '📋',
  },
  due_diligence: {
    label: 'Due Diligence',
    description: 'Deep investigation across all dimensions',
    actions: ['Financial DD', 'Technical DD', 'Legal DD', 'Market DD', 'Team DD', 'Review deal room', 'Run claim verification'],
    requiredBefore: ['Screening complete', 'Red flag review'],
    color: '#8B5CF6',
    icon: '🔬',
  },
  valuation: {
    label: 'Valuation',
    description: 'Determine fair value and investment terms',
    actions: ['Run Monte Carlo simulation', 'Review comparable analysis', 'Model cap table scenarios', 'Determine target ownership'],
    requiredBefore: ['DD checklist >50%'],
    color: '#EC4899',
    icon: '💰',
  },
  term_sheet: {
    label: 'Term Sheet',
    description: 'Negotiate and finalize investment terms',
    actions: ['Generate term sheet', 'Compare to market benchmarks', 'Model dilution impact', 'Negotiate terms'],
    requiredBefore: ['Valuation analysis complete'],
    color: '#F59E0B',
    icon: '📄',
  },
  legal_review: {
    label: 'Legal Review',
    description: 'Legal documentation and compliance',
    actions: ['KYC/AML verification', 'Securities compliance check', 'Document review', 'E-sign agreements'],
    requiredBefore: ['Term sheet signed'],
    color: '#EF4444',
    icon: '⚖️',
  },
  capital_deployment: {
    label: 'Capital Deployment',
    description: 'Fund transfer and escrow setup',
    actions: ['Set up milestone escrow', 'Define milestone conditions', 'Fund escrow account', 'Confirm on-chain deployment'],
    requiredBefore: ['Legal review complete'],
    color: '#10B981',
    icon: '🚀',
  },
  monitoring: {
    label: 'Monitoring',
    description: 'Post-investment portfolio tracking',
    actions: ['Review monthly metrics', 'Check milestone progress', 'Monitor red flags', 'Track CTS score changes'],
    requiredBefore: ['Capital deployed'],
    color: '#06B6D4',
    icon: '📊',
  },
  exit: {
    label: 'Exit',
    description: 'Liquidity event or write-off',
    actions: ['Evaluate exit options', 'Calculate returns', 'Process distribution', 'Update portfolio'],
    requiredBefore: ['Exit event occurs'],
    color: '#A855F7',
    icon: '🏁',
  },
};

// ── DD Checklist Template ────────────────────────────────────────────

export const DD_CHECKLIST_TEMPLATE: DDChecklistItem[] = [
  // Financial (8 items)
  { name: 'Revenue verification (on-chain or bank)', category: 'financial', completed: false, notes: '' },
  { name: 'Unit economics analysis (CAC, LTV, payback)', category: 'financial', completed: false, notes: '' },
  { name: 'Burn rate and runway calculation', category: 'financial', completed: false, notes: '' },
  { name: 'Financial projections review', category: 'financial', completed: false, notes: '' },
  { name: 'Cap table review', category: 'financial', completed: false, notes: '' },
  { name: 'Revenue quality (recurring vs one-time)', category: 'financial', completed: false, notes: '' },
  { name: 'Customer concentration analysis', category: 'financial', completed: false, notes: '' },
  { name: 'Monte Carlo simulation review', category: 'financial', completed: false, notes: '' },
  // Technical (5 items)
  { name: 'Smart contract audit verification', category: 'technical', completed: false, notes: '' },
  { name: 'Code quality assessment (GitHub)', category: 'technical', completed: false, notes: '' },
  { name: 'Architecture and scalability review', category: 'technical', completed: false, notes: '' },
  { name: 'Security assessment', category: 'technical', completed: false, notes: '' },
  { name: 'Technical debt evaluation', category: 'technical', completed: false, notes: '' },
  // Legal (4 items)
  { name: 'Corporate structure verification', category: 'legal', completed: false, notes: '' },
  { name: 'IP ownership confirmation', category: 'legal', completed: false, notes: '' },
  { name: 'Regulatory compliance status', category: 'legal', completed: false, notes: '' },
  { name: 'Material contracts review', category: 'legal', completed: false, notes: '' },
  // Market (4 items)
  { name: 'TAM/SAM/SOM validation', category: 'market', completed: false, notes: '' },
  { name: 'Competitive landscape mapping', category: 'market', completed: false, notes: '' },
  { name: 'Customer references (3+)', category: 'market', completed: false, notes: '' },
  { name: 'Market timing assessment', category: 'market', completed: false, notes: '' },
  // Team (3 items)
  { name: 'Founder background verification', category: 'team', completed: false, notes: '' },
  { name: 'Reference checks (backchannel)', category: 'team', completed: false, notes: '' },
  { name: 'Key person risk assessment', category: 'team', completed: false, notes: '' },
];

// ── Pipeline Operations ──────────────────────────────────────────────

/**
 * Create a new pipeline deal from a discovered startup.
 */
export function createDeal(
  startupId: string,
  startupName: string,
  category: string,
  source: PipelineDeal['source'],
): PipelineDeal {
  return {
    id: `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startupId,
    startupName,
    category,
    stage: 'discovered',
    outcome: 'active',
    source,
    discoveredAt: Date.now(),
    lastUpdatedAt: Date.now(),
    investmentAmount: null,
    instrumentType: null,
    notes: '',
    tags: [],
    ddChecklist: DD_CHECKLIST_TEMPLATE.map(item => ({ ...item })),
    termSheetId: null,
    escrowDealId: null,
    priority: 3,
    convictionScore: 5,
    redFlagCount: 0,
    ctsScore: null,
  };
}

/**
 * Move a deal to the next pipeline stage.
 */
export function advanceDeal(deal: PipelineDeal, toStage: PipelineStage): PipelineDeal {
  return {
    ...deal,
    stage: toStage,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Pass on a deal (no investment).
 */
export function passDeal(deal: PipelineDeal, reason: string): PipelineDeal {
  return {
    ...deal,
    outcome: 'passed',
    notes: deal.notes + `\n[PASSED] ${reason}`,
    lastUpdatedAt: Date.now(),
  };
}

/**
 * Toggle a DD checklist item.
 */
export function toggleDDItem(deal: PipelineDeal, itemName: string): PipelineDeal {
  const updatedChecklist = deal.ddChecklist.map(item =>
    item.name === itemName ? { ...item, completed: !item.completed } : item
  );
  return { ...deal, ddChecklist: updatedChecklist, lastUpdatedAt: Date.now() };
}

/**
 * Calculate pipeline statistics.
 */
export function calculatePipelineStats(deals: PipelineDeal[]): PipelineStats {
  const byStage = {} as Record<PipelineStage, number>;
  const byOutcome = {} as Record<DealOutcome, number>;
  const stages: PipelineStage[] = ['discovered', 'screening', 'due_diligence', 'valuation', 'term_sheet', 'legal_review', 'capital_deployment', 'monitoring', 'exit'];
  const outcomes: DealOutcome[] = ['active', 'passed', 'invested', 'exited', 'written_off'];

  for (const s of stages) byStage[s] = 0;
  for (const o of outcomes) byOutcome[o] = 0;

  let totalTime = 0;
  let totalInvested = 0;

  for (const deal of deals) {
    byStage[deal.stage]++;
    byOutcome[deal.outcome]++;
    totalTime += deal.lastUpdatedAt - deal.discoveredAt;
    if (deal.investmentAmount && deal.outcome === 'invested') {
      totalInvested += deal.investmentAmount;
    }
  }

  const invested = deals.filter(d => d.outcome === 'invested').length;
  const conversionRate = deals.length > 0 ? (invested / deals.length) * 100 : 0;

  return {
    totalDeals: deals.length,
    byStage,
    byOutcome,
    avgTimeInPipeline: deals.length > 0 ? totalTime / deals.length / (24 * 3600 * 1000) : 0,
    conversionRate,
    totalInvested,
    totalPassed: byOutcome.passed,
  };
}
