/**
 * Scenario Planning Engine
 * ────────────────────────
 * What-if analysis for business decisions.
 * Models the impact of strategic changes on key metrics.
 *
 * Scenarios:
 *   - "What if we raise $X at Y valuation?"
 *   - "What if growth accelerates to Z%?"
 *   - "What if we hire N more people?"
 *   - "What if we cut burn by X%?"
 *   - "What if a competitor enters the market?"
 *   - "What if we achieve product-market fit?"
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type ScenarioType =
  | 'fundraise'
  | 'growth_change'
  | 'hiring'
  | 'burn_cut'
  | 'competitor_entry'
  | 'pmf_achieved'
  | 'market_downturn'
  | 'custom';

export interface ScenarioInput {
  type: ScenarioType;
  label: string;
  description: string;
  parameters: Record<string, number>;
}

export interface ScenarioOutput {
  /** Scenario name */
  label: string;
  /** Scenario type */
  type: ScenarioType;
  /** Monthly projections (12 months) */
  projections: MonthProjection[];
  /** Impact summary */
  impact: {
    mrrChange: number;
    mrrChangePct: number;
    runwayChange: number;
    growthChange: number;
    burnChange: number;
    dilution: number;
    teamSizeChange: number;
  };
  /** Key takeaway */
  takeaway: string;
  /** Risk level of this scenario */
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface MonthProjection {
  month: number;
  mrr: number;
  users: number;
  costs: number;
  treasury: number;
  runway: number;
  headcount: number;
}

export interface ScenarioComparison {
  /** Baseline (current trajectory) */
  baseline: ScenarioOutput;
  /** All scenarios */
  scenarios: ScenarioOutput[];
  /** Best case scenario name */
  bestCase: string;
  /** Worst case scenario name */
  worstCase: string;
}

// ── Scenario Templates ───────────────────────────────────────────────

export const SCENARIO_TEMPLATES: ScenarioInput[] = [
  {
    type: 'fundraise',
    label: 'Raise $2M Seed Round',
    description: 'Model the impact of raising a $2M seed round at $10M post-money valuation',
    parameters: { amount: 2000000, postMoney: 10000000, monthsToClose: 2 },
  },
  {
    type: 'growth_change',
    label: 'Growth Accelerates to 25%',
    description: 'What if monthly growth rate increases to 25% MoM',
    parameters: { newGrowthRate: 25, rampMonths: 3 },
  },
  {
    type: 'growth_change',
    label: 'Growth Decelerates to 5%',
    description: 'What if growth slows to 5% MoM due to market saturation',
    parameters: { newGrowthRate: 5, rampMonths: 2 },
  },
  {
    type: 'hiring',
    label: 'Aggressive Hiring (+10 people)',
    description: 'Hire 10 more people over 6 months (avg $8K/mo fully loaded)',
    parameters: { newHires: 10, avgMonthlyCost: 8000, rampMonths: 6 },
  },
  {
    type: 'burn_cut',
    label: 'Cut Burn by 30%',
    description: 'Reduce monthly costs by 30% through operational efficiency',
    parameters: { cutPercent: 30, implementationMonths: 2 },
  },
  {
    type: 'competitor_entry',
    label: 'Well-Funded Competitor Enters',
    description: 'A competitor with $10M+ funding enters your market, reducing growth',
    parameters: { growthImpact: -8, churnIncrease: 2, monthsToFeel: 3 },
  },
  {
    type: 'pmf_achieved',
    label: 'Product-Market Fit Achieved',
    description: 'Strong PMF signals: growth accelerates, churn drops, expansion revenue kicks in',
    parameters: { growthBoost: 15, churnReduction: 50, expansionRevenuePct: 10 },
  },
  {
    type: 'market_downturn',
    label: 'Market Downturn',
    description: 'Crypto/tech market downturn: fundraising freezes, growth halves, churn increases',
    parameters: { growthMultiplier: 0.5, fundraisingDelay: 6, churnIncrease: 5 },
  },
];

// ── Scenario Execution ───────────────────────────────────────────────

function projectBaseline(startup: DbStartup, metrics: DbMetricsHistory[], months: number = 12): MonthProjection[] {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const currentMrr = sorted.length > 0 ? Number(sorted[sorted.length - 1].revenue) : startup.mrr;
  const currentCosts = sorted.length > 0 ? Number(sorted[sorted.length - 1].costs) : startup.mrr * 0.65;
  const growthRate = Number(startup.growth_rate) / 100;
  const costGrowthRate = 0.03; // 3% monthly cost growth baseline

  const projections: MonthProjection[] = [];
  let mrr = currentMrr;
  let costs = currentCosts;
  let treasury = startup.treasury;
  let users = startup.users;
  const headcount = startup.team_size;

  for (let m = 1; m <= months; m++) {
    mrr *= (1 + growthRate);
    costs *= (1 + costGrowthRate);
    users = Math.round(users * (1 + growthRate * 0.8));
    treasury += mrr - costs;
    const runway = costs > mrr ? Math.max(0, treasury / (costs - mrr)) : 999;

    projections.push({
      month: m,
      mrr: Math.round(mrr),
      users,
      costs: Math.round(costs),
      treasury: Math.round(treasury),
      runway: Math.round(runway),
      headcount,
    });
  }

  return projections;
}

function executeScenario(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  scenario: ScenarioInput,
): ScenarioOutput {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const currentMrr = sorted.length > 0 ? Number(sorted[sorted.length - 1].revenue) : startup.mrr;
  const currentCosts = sorted.length > 0 ? Number(sorted[sorted.length - 1].costs) : startup.mrr * 0.65;
  let growthRate = Number(startup.growth_rate) / 100;
  const costGrowthRate = 0.03;
  const params = scenario.parameters;

  const projections: MonthProjection[] = [];
  let mrr = currentMrr;
  let costs = currentCosts;
  let treasury = startup.treasury;
  let users = startup.users;
  let headcount = startup.team_size;
  let dilution = 0;

  for (let m = 1; m <= 12; m++) {
    // Apply scenario effects
    switch (scenario.type) {
      case 'fundraise':
        if (m === (params.monthsToClose ?? 2)) {
          treasury += params.amount;
          dilution = (params.amount / params.postMoney) * 100;
        }
        break;

      case 'growth_change': {
        const ramp = params.rampMonths ?? 3;
        const target = (params.newGrowthRate ?? 15) / 100;
        if (m <= ramp) {
          growthRate += (target - growthRate) / ramp;
        } else {
          growthRate = target;
        }
        break;
      }

      case 'hiring': {
        const ramp = params.rampMonths ?? 6;
        if (m <= ramp) {
          const hiresThisMonth = Math.ceil((params.newHires ?? 5) / ramp);
          headcount += hiresThisMonth;
          costs += hiresThisMonth * (params.avgMonthlyCost ?? 8000);
        }
        break;
      }

      case 'burn_cut': {
        const impl = params.implementationMonths ?? 2;
        if (m <= impl) {
          costs *= (1 - (params.cutPercent ?? 20) / 100 / impl);
        }
        break;
      }

      case 'competitor_entry': {
        const delay = params.monthsToFeel ?? 3;
        if (m >= delay) {
          growthRate = Math.max(-0.1, growthRate + (params.growthImpact ?? -5) / 100);
        }
        break;
      }

      case 'pmf_achieved': {
        growthRate += (params.growthBoost ?? 10) / 100 / 6; // Gradually ramp
        mrr *= (1 + (params.expansionRevenuePct ?? 5) / 100 / 12); // Expansion revenue
        break;
      }

      case 'market_downturn': {
        growthRate *= params.growthMultiplier ?? 0.5;
        break;
      }
    }

    mrr *= (1 + growthRate);
    costs *= (1 + costGrowthRate);
    users = Math.round(users * (1 + growthRate * 0.8));
    treasury += mrr - costs;
    const runway = costs > mrr ? Math.max(0, treasury / (costs - mrr)) : 999;

    projections.push({
      month: m,
      mrr: Math.round(mrr),
      users,
      costs: Math.round(costs),
      treasury: Math.round(treasury),
      runway: Math.round(Math.min(runway, 999)),
      headcount,
    });
  }

  const finalMrr = projections[projections.length - 1].mrr;
  const finalTreasury = projections[projections.length - 1].treasury;
  const finalRunway = projections[projections.length - 1].runway;

  const baselineEndMrr = currentMrr * Math.pow(1 + Number(startup.growth_rate) / 100, 12);
  const mrrChange = finalMrr - baselineEndMrr;
  const mrrChangePct = baselineEndMrr > 0 ? (mrrChange / baselineEndMrr) * 100 : 0;

  // Risk level
  const riskLevel: ScenarioOutput['riskLevel'] =
    finalRunway < 6 || finalMrr < currentMrr * 0.5 ? 'high' :
    finalRunway < 12 || mrrChangePct < -20 ? 'moderate' : 'low';

  // Takeaway
  let takeaway: string;
  if (mrrChangePct > 50) takeaway = `This scenario projects ${mrrChangePct.toFixed(0)}% higher MRR than baseline — high upside.`;
  else if (mrrChangePct > 10) takeaway = `Positive impact: ${mrrChangePct.toFixed(0)}% higher MRR with manageable risk.`;
  else if (mrrChangePct > -10) takeaway = `Minimal MRR impact (${mrrChangePct.toFixed(0)}%), but other factors may justify this move.`;
  else takeaway = `Warning: projects ${Math.abs(mrrChangePct).toFixed(0)}% lower MRR — proceed with caution.`;

  return {
    label: scenario.label,
    type: scenario.type,
    projections,
    impact: {
      mrrChange: Math.round(mrrChange),
      mrrChangePct: +mrrChangePct.toFixed(1),
      runwayChange: Math.round(finalRunway - (currentCosts > currentMrr ? startup.treasury / (currentCosts - currentMrr) : 999)),
      growthChange: +(growthRate * 100 - Number(startup.growth_rate)).toFixed(1),
      burnChange: Math.round(projections[projections.length - 1].costs - currentCosts),
      dilution,
      teamSizeChange: headcount - startup.team_size,
    },
    takeaway,
    riskLevel,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Run all scenario templates and compare against baseline.
 */
export function runScenarioAnalysis(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  scenarios?: ScenarioInput[],
): ScenarioComparison {
  const scenariosToRun = scenarios ?? SCENARIO_TEMPLATES;

  const baselineProjections = projectBaseline(startup, metrics, 12);
  const baseline: ScenarioOutput = {
    label: 'Current Trajectory',
    type: 'custom',
    projections: baselineProjections,
    impact: { mrrChange: 0, mrrChangePct: 0, runwayChange: 0, growthChange: 0, burnChange: 0, dilution: 0, teamSizeChange: 0 },
    takeaway: 'Baseline projection assuming current growth rate continues unchanged.',
    riskLevel: 'low',
  };

  const results = scenariosToRun.map(s => executeScenario(startup, metrics, s));

  // Find best and worst
  const sortedByMrr = [...results].sort((a, b) => b.impact.mrrChangePct - a.impact.mrrChangePct);
  const bestCase = sortedByMrr[0]?.label ?? 'N/A';
  const worstCase = sortedByMrr[sortedByMrr.length - 1]?.label ?? 'N/A';

  return { baseline, scenarios: results, bestCase, worstCase };
}
