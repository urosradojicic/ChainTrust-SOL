/**
 * Cohort Analysis Engine
 * ──────────────────────
 * Deep user retention and unit economics analysis by cohort.
 * Generates retention curves, LTV calculations, and cohort matrices.
 *
 * This is what institutional investors use to evaluate product-market fit.
 * Retention is the MOST important metric for long-term value.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface CohortData {
  /** Cohort identifier (e.g., "2025-01" for January 2025 cohort) */
  cohortId: string;
  /** Display label */
  label: string;
  /** Starting users in this cohort */
  startingUsers: number;
  /** Retention rates by month (0-indexed: month 0 = 100%, month 1 = first retention) */
  retentionRates: number[];
  /** Absolute users retained by month */
  usersRetained: number[];
  /** Revenue per user by month (if available) */
  revenuePerUser: number[];
  /** Cumulative LTV by month */
  cumulativeLtv: number[];
}

export interface CohortMatrix {
  /** All cohorts */
  cohorts: CohortData[];
  /** Number of months tracked */
  maxMonths: number;
  /** Average retention by month across all cohorts */
  avgRetention: number[];
  /** Best cohort (highest M3 retention) */
  bestCohort: { id: string; m3Retention: number };
  /** Worst cohort */
  worstCohort: { id: string; m3Retention: number };
  /** Retention trend (are newer cohorts retaining better?) */
  retentionTrend: 'improving' | 'stable' | 'declining';
}

export interface UnitEconomics {
  /** Customer Acquisition Cost */
  cac: number;
  /** Lifetime Value */
  ltv: number;
  /** LTV/CAC ratio */
  ltvCacRatio: number;
  /** Months to payback CAC */
  paybackMonths: number;
  /** Monthly churn rate */
  monthlyChurnRate: number;
  /** Average revenue per user (ARPU) */
  arpu: number;
  /** Gross margin */
  grossMargin: number;
  /** Net revenue retention */
  netRevenueRetention: number;
  /** Assessment */
  assessment: {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    details: string[];
  };
}

export interface CohortReport {
  /** Cohort retention matrix */
  matrix: CohortMatrix;
  /** Unit economics */
  unitEconomics: UnitEconomics;
  /** Key insights */
  insights: string[];
  /** Product-market fit indicators */
  pmfIndicators: { indicator: string; value: string; signal: 'strong' | 'moderate' | 'weak' }[];
  /** Computed at */
  computedAt: number;
}

// ── Cohort Generation ────────────────────────────────────────────────

/**
 * Generate cohort data from metrics history.
 * Since we don't have real cohort-level data, we synthesize it from
 * MAU growth patterns — each month's new users form a cohort.
 */
function generateCohorts(metrics: DbMetricsHistory[], startup: DbStartup): CohortData[] {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  if (sorted.length < 2) return [];

  const cohorts: CohortData[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const currentMau = Number(sorted[i].mau);
    const prevMau = i > 0 ? Number(sorted[i - 1].mau) : 0;
    const newUsers = Math.max(0, currentMau - Math.round(prevMau * 0.85)); // Assume 15% natural churn
    if (newUsers <= 0) continue;

    const monthsAfter = sorted.length - i;
    const retentionRates: number[] = [100]; // Month 0 = 100%
    const usersRetained: number[] = [newUsers];

    // Model retention decay: exponential with category-specific curves
    const baseRetention = startup.trust_score >= 70 ? 0.85 : startup.trust_score >= 50 ? 0.78 : 0.7;
    const growth = Number(startup.growth_rate);
    const retentionBoost = growth > 20 ? 0.05 : growth > 10 ? 0.02 : 0;

    for (let m = 1; m < monthsAfter; m++) {
      const prevRate = retentionRates[m - 1];
      // Retention decays but stabilizes (logarithmic curve)
      const decayFactor = (baseRetention + retentionBoost) - 0.02 * Math.log(m + 1);
      const rate = Math.max(5, prevRate * Math.max(0.5, decayFactor));
      retentionRates.push(+rate.toFixed(1));
      usersRetained.push(Math.round(newUsers * rate / 100));
    }

    // Revenue per user (derived from total revenue / total users)
    const avgRevenuePerUser = currentMau > 0 ? Number(sorted[i].revenue) / currentMau : 0;
    const revenuePerUser = retentionRates.map((_, m) => {
      // Revenue per user may increase (expansion) or decrease over time
      return +(avgRevenuePerUser * (1 + m * 0.01)).toFixed(2); // 1% monthly expansion
    });

    // Cumulative LTV
    const cumulativeLtv = revenuePerUser.reduce<number[]>((acc, rpu, m) => {
      const retained = retentionRates[m] / 100;
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0;
      acc.push(+(prev + rpu * retained).toFixed(2));
      return acc;
    }, []);

    cohorts.push({
      cohortId: sorted[i].month_date.slice(0, 7),
      label: sorted[i].month_date.slice(0, 7),
      startingUsers: newUsers,
      retentionRates,
      usersRetained,
      revenuePerUser,
      cumulativeLtv,
    });
  }

  return cohorts;
}

// ── Cohort Matrix ────────────────────────────────────────────────────

function buildMatrix(cohorts: CohortData[]): CohortMatrix {
  if (cohorts.length === 0) {
    return {
      cohorts: [],
      maxMonths: 0,
      avgRetention: [],
      bestCohort: { id: 'N/A', m3Retention: 0 },
      worstCohort: { id: 'N/A', m3Retention: 0 },
      retentionTrend: 'stable',
    };
  }

  const maxMonths = Math.max(...cohorts.map(c => c.retentionRates.length));

  // Average retention by month
  const avgRetention: number[] = [];
  for (let m = 0; m < maxMonths; m++) {
    const rates = cohorts
      .filter(c => c.retentionRates.length > m)
      .map(c => c.retentionRates[m]);
    avgRetention.push(rates.length > 0 ? +(rates.reduce((s, r) => s + r, 0) / rates.length).toFixed(1) : 0);
  }

  // Best and worst cohort by M3 retention
  const cohortsWithM3 = cohorts.filter(c => c.retentionRates.length > 3);
  const best = cohortsWithM3.reduce((b, c) => c.retentionRates[3] > b.m3Retention ? { id: c.cohortId, m3Retention: c.retentionRates[3] } : b, { id: 'N/A', m3Retention: 0 });
  const worst = cohortsWithM3.reduce((w, c) => c.retentionRates[3] < w.m3Retention ? { id: c.cohortId, m3Retention: c.retentionRates[3] } : w, { id: 'N/A', m3Retention: 100 });

  // Retention trend (compare first half cohorts vs second half)
  let trend: CohortMatrix['retentionTrend'] = 'stable';
  if (cohortsWithM3.length >= 4) {
    const mid = Math.floor(cohortsWithM3.length / 2);
    const earlyAvg = cohortsWithM3.slice(0, mid).reduce((s, c) => s + c.retentionRates[3], 0) / mid;
    const lateAvg = cohortsWithM3.slice(mid).reduce((s, c) => s + c.retentionRates[3], 0) / (cohortsWithM3.length - mid);
    if (lateAvg > earlyAvg * 1.05) trend = 'improving';
    else if (lateAvg < earlyAvg * 0.95) trend = 'declining';
  }

  return { cohorts, maxMonths, avgRetention, bestCohort: best, worstCohort: worst, retentionTrend: trend };
}

// ── Unit Economics ───────────────────────────────────────────────────

function computeUnitEconomics(startup: DbStartup, metrics: DbMetricsHistory[], cohorts: CohortData[]): UnitEconomics {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const latestRevenue = sorted.length > 0 ? Number(sorted[sorted.length - 1].revenue) : startup.mrr;
  const latestCosts = sorted.length > 0 ? Number(sorted[sorted.length - 1].costs) : startup.mrr * 0.65;
  const currentUsers = startup.users;

  // ARPU
  const arpu = currentUsers > 0 ? latestRevenue / currentUsers : 0;

  // Churn rate (derived from average retention decay)
  const avgM1Retention = cohorts.length > 0
    ? cohorts.filter(c => c.retentionRates.length > 1).reduce((s, c) => s + c.retentionRates[1], 0) / cohorts.filter(c => c.retentionRates.length > 1).length
    : 85;
  const monthlyChurnRate = 100 - avgM1Retention;

  // LTV = ARPU / monthly churn rate (simplified)
  const ltv = monthlyChurnRate > 0 ? arpu / (monthlyChurnRate / 100) : arpu * 24;

  // CAC (estimated from costs / new users per month)
  const avgNewUsers = sorted.length >= 2
    ? Math.max(1, (Number(sorted[sorted.length - 1].mau) - Number(sorted[sorted.length - 2].mau)))
    : Math.max(1, currentUsers * 0.1);
  const marketingSpend = latestCosts * 0.3; // Assume 30% of costs go to acquisition
  const cac = marketingSpend / avgNewUsers;

  // LTV/CAC
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  // Payback
  const paybackMonths = arpu > 0 ? Math.ceil(cac / arpu) : 999;

  // Gross margin
  const grossMargin = latestRevenue > 0 ? ((latestRevenue - latestCosts * 0.4) / latestRevenue) * 100 : 0;

  // Net revenue retention (simplified)
  const nrr = sorted.length >= 2
    ? (Number(sorted[sorted.length - 1].revenue) / Number(sorted[sorted.length - 2].revenue)) * 100
    : 100 + Number(startup.growth_rate);

  // Assessment
  const details: string[] = [];
  let overall: UnitEconomics['assessment']['overall'] = 'fair';

  if (ltvCacRatio >= 5) { details.push('Outstanding LTV/CAC ratio — strong unit economics'); overall = 'excellent'; }
  else if (ltvCacRatio >= 3) { details.push('Healthy LTV/CAC ratio'); overall = 'good'; }
  else if (ltvCacRatio >= 1) { details.push('LTV/CAC below 3x — room for improvement'); }
  else { details.push('LTV/CAC below 1x — unsustainable unit economics'); overall = 'poor'; }

  if (paybackMonths <= 6) details.push('Excellent payback period — capital efficient');
  else if (paybackMonths <= 12) details.push('Good payback period');
  else if (paybackMonths <= 18) details.push('Payback period is acceptable but long');
  else details.push('Long payback period — capital intensive');

  if (nrr >= 120) details.push(`Strong net revenue retention (${nrr.toFixed(0)}%) — expansion revenue is working`);
  else if (nrr >= 100) details.push(`Healthy NRR (${nrr.toFixed(0)}%) — existing customers are retaining well`);
  else details.push(`NRR below 100% (${nrr.toFixed(0)}%) — contraction outpacing expansion`);

  return {
    cac: +cac.toFixed(2),
    ltv: +ltv.toFixed(2),
    ltvCacRatio: +ltvCacRatio.toFixed(2),
    paybackMonths,
    monthlyChurnRate: +monthlyChurnRate.toFixed(1),
    arpu: +arpu.toFixed(2),
    grossMargin: +grossMargin.toFixed(1),
    netRevenueRetention: +nrr.toFixed(1),
    assessment: { overall, details },
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate complete cohort analysis report.
 */
export function analyzeCohorts(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): CohortReport {
  const cohorts = generateCohorts(metrics, startup);
  const matrix = buildMatrix(cohorts);
  const unitEconomics = computeUnitEconomics(startup, metrics, cohorts);

  // PMF indicators
  const pmfIndicators: CohortReport['pmfIndicators'] = [];
  const growth = Number(startup.growth_rate);

  // Retention curve flattening
  if (matrix.avgRetention.length >= 4 && matrix.avgRetention[3] >= 40) {
    pmfIndicators.push({ indicator: 'M3 Retention', value: `${matrix.avgRetention[3]}%`, signal: matrix.avgRetention[3] >= 50 ? 'strong' : 'moderate' });
  } else {
    pmfIndicators.push({ indicator: 'M3 Retention', value: matrix.avgRetention.length >= 4 ? `${matrix.avgRetention[3]}%` : 'N/A', signal: 'weak' });
  }

  // NRR
  pmfIndicators.push({
    indicator: 'Net Revenue Retention',
    value: `${unitEconomics.netRevenueRetention}%`,
    signal: unitEconomics.netRevenueRetention >= 110 ? 'strong' : unitEconomics.netRevenueRetention >= 100 ? 'moderate' : 'weak',
  });

  // Organic growth
  pmfIndicators.push({
    indicator: 'Growth Rate',
    value: `${growth}% MoM`,
    signal: growth >= 20 ? 'strong' : growth >= 10 ? 'moderate' : 'weak',
  });

  // LTV/CAC
  pmfIndicators.push({
    indicator: 'LTV/CAC',
    value: `${unitEconomics.ltvCacRatio.toFixed(1)}x`,
    signal: unitEconomics.ltvCacRatio >= 3 ? 'strong' : unitEconomics.ltvCacRatio >= 1.5 ? 'moderate' : 'weak',
  });

  // Retention trend
  pmfIndicators.push({
    indicator: 'Cohort Trend',
    value: matrix.retentionTrend,
    signal: matrix.retentionTrend === 'improving' ? 'strong' : matrix.retentionTrend === 'stable' ? 'moderate' : 'weak',
  });

  // Insights
  const insights: string[] = [];
  if (matrix.retentionTrend === 'improving') insights.push('Newer cohorts retain better than older ones — product is improving');
  if (matrix.retentionTrend === 'declining') insights.push('WARNING: Newer cohorts have worse retention — investigate product changes');
  if (unitEconomics.ltvCacRatio >= 5) insights.push(`Exceptional unit economics with ${unitEconomics.ltvCacRatio.toFixed(1)}x LTV/CAC`);
  if (unitEconomics.monthlyChurnRate > 10) insights.push(`High monthly churn (${unitEconomics.monthlyChurnRate}%) is eroding the user base`);
  if (unitEconomics.netRevenueRetention >= 120) insights.push('Strong expansion revenue — existing customers spending more over time');
  if (unitEconomics.paybackMonths > 18) insights.push('Long CAC payback — consider optimizing acquisition channels');

  const strongCount = pmfIndicators.filter(p => p.signal === 'strong').length;
  if (strongCount >= 4) insights.unshift('STRONG PRODUCT-MARKET FIT — majority of indicators are positive');
  else if (strongCount >= 2) insights.unshift('EMERGING PMF — some positive signals, continue monitoring');
  else insights.unshift('PRE-PMF — product-market fit has not yet been achieved');

  return { matrix, unitEconomics, insights, pmfIndicators, computedAt: Date.now() };
}
