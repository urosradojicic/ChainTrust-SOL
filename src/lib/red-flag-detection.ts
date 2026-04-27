/**
 * Red Flag Detection Engine
 * ─────────────────────────
 * Statistical anomaly detection system for startup metrics.
 * Detects suspicious patterns, data inconsistencies, and early warning signals
 * that rule-based systems miss.
 *
 * Detection categories:
 *   1. Statistical anomalies  — z-score outliers in time-series data
 *   2. Cross-metric conflicts — metrics that should correlate but don't
 *   3. Trajectory warnings    — sudden reversals or unsustainable trends
 *   4. Tokenomics risks       — concentration, inflation, distribution red flags
 *   5. Operational concerns   — team size vs revenue mismatch, burn rate patterns
 *
 * Zero API calls. Zero cost. Pure math.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type FlagSeverity = 'info' | 'warning' | 'critical' | 'alert';

export type FlagCategory =
  | 'anomaly'
  | 'correlation'
  | 'trajectory'
  | 'tokenomics'
  | 'operational'
  | 'verification';

export interface RedFlag {
  /** Unique identifier for de-duplication */
  id: string;
  /** Human-readable title */
  title: string;
  /** Detailed explanation with data */
  description: string;
  /** Severity level */
  severity: FlagSeverity;
  /** Detection category */
  category: FlagCategory;
  /** Specific metric(s) involved */
  metrics: string[];
  /** Confidence in this detection (0-1) */
  confidence: number;
  /** Recommended action */
  recommendation: string;
  /** Raw data that triggered the flag */
  evidence: Record<string, number | string>;
}

export interface RedFlagReport {
  /** Overall risk level based on aggregated flags */
  riskLevel: 'clean' | 'watch' | 'cautious' | 'danger';
  /** Numeric risk score (0-100, higher = more flags) */
  riskScore: number;
  /** All detected flags, sorted by severity */
  flags: RedFlag[];
  /** Counts by severity */
  counts: Record<FlagSeverity, number>;
  /** Timestamp of analysis */
  analyzedAt: number;
  /** Number of data points analyzed */
  dataPointsAnalyzed: number;
}

// ── Statistical Utilities ────────────────────────────────────────────

/** Calculate mean of an array */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Calculate standard deviation */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squaredDiffs.reduce((s, d) => s + d, 0) / (values.length - 1));
}

/** Calculate z-score (how many std deviations from mean) */
function zScore(value: number, values: number[]): number {
  const sd = stdDev(values);
  if (sd === 0) return 0;
  return (value - mean(values)) / sd;
}

/** Calculate month-over-month percentage change */
function momChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Calculate coefficient of variation (CV%) */
function coefficientOfVariation(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  return (stdDev(values) / Math.abs(avg)) * 100;
}

/** Calculate Pearson correlation coefficient between two arrays */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);
  const xMean = mean(xSlice);
  const yMean = mean(ySlice);
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;
  for (let i = 0; i < n; i++) {
    const xDiff = xSlice[i] - xMean;
    const yDiff = ySlice[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }
  const denominator = Math.sqrt(xDenominator * yDenominator);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/** Detect if a trend reversed direction recently */
function detectTrendReversal(values: number[]): { reversed: boolean; direction: 'up-to-down' | 'down-to-up' | 'none' } {
  if (values.length < 4) return { reversed: false, direction: 'none' };
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const firstTrend = firstHalf[firstHalf.length - 1] - firstHalf[0];
  const secondTrend = secondHalf[secondHalf.length - 1] - secondHalf[0];
  if (firstTrend > 0 && secondTrend < 0) return { reversed: true, direction: 'up-to-down' };
  if (firstTrend < 0 && secondTrend > 0) return { reversed: true, direction: 'down-to-up' };
  return { reversed: false, direction: 'none' };
}

// ── Detection Functions ──────────────────────────────────────────────

/**
 * 1. STATISTICAL ANOMALIES
 * Detect z-score outliers in time-series metrics.
 */
function detectStatisticalAnomalies(
  metrics: DbMetricsHistory[],
  startup: DbStartup,
): RedFlag[] {
  const flags: RedFlag[] = [];
  if (metrics.length < 3) return flags;

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const latest = sorted[sorted.length - 1];
  const revenues = sorted.map(m => Number(m.revenue));
  const costs = sorted.map(m => Number(m.costs));
  const maus = sorted.map(m => Number(m.mau));
  const growthRates = sorted.map(m => Number(m.growth_rate));

  // Revenue spike/drop detection
  const revenueZ = zScore(Number(latest.revenue), revenues);
  if (Math.abs(revenueZ) > 2.5) {
    const direction = revenueZ > 0 ? 'spike' : 'drop';
    flags.push({
      id: `anomaly-revenue-${direction}`,
      title: `Unusual revenue ${direction}`,
      description: `Latest revenue ($${Number(latest.revenue).toLocaleString()}) is ${Math.abs(revenueZ).toFixed(1)} standard deviations ${direction === 'spike' ? 'above' : 'below'} the historical average ($${mean(revenues).toLocaleString()}).`,
      severity: Math.abs(revenueZ) > 3.5 ? 'critical' : 'warning',
      category: 'anomaly',
      metrics: ['revenue'],
      confidence: Math.min(Math.abs(revenueZ) / 5, 1),
      recommendation: direction === 'spike'
        ? 'Verify revenue source — sudden spikes may indicate one-time events or data errors.'
        : 'Investigate revenue decline — check for customer churn, pricing changes, or market shifts.',
      evidence: { zScore: +revenueZ.toFixed(2), latest: Number(latest.revenue), mean: +mean(revenues).toFixed(0), stdDev: +stdDev(revenues).toFixed(0) },
    });
  }

  // Cost spike detection
  const costZ = zScore(Number(latest.costs), costs);
  if (costZ > 2.5) {
    flags.push({
      id: 'anomaly-cost-spike',
      title: 'Unusual cost increase',
      description: `Latest costs ($${Number(latest.costs).toLocaleString()}) are ${costZ.toFixed(1)}σ above the historical average. This may signal uncontrolled spending or one-time expenses.`,
      severity: costZ > 3.5 ? 'critical' : 'warning',
      category: 'anomaly',
      metrics: ['costs'],
      confidence: Math.min(costZ / 5, 1),
      recommendation: 'Review expense categories — distinguish between growth investment and waste.',
      evidence: { zScore: +costZ.toFixed(2), latest: Number(latest.costs), mean: +mean(costs).toFixed(0) },
    });
  }

  // MAU spike without revenue correlation
  const mauZ = zScore(Number(latest.mau), maus);
  if (mauZ > 2.5 && revenueZ < 1) {
    flags.push({
      id: 'anomaly-mau-no-revenue',
      title: 'User growth without revenue growth',
      description: `MAU spiked ${mauZ.toFixed(1)}σ above average but revenue did not follow. This may indicate non-paying users, bot traffic, or promotional signups.`,
      severity: 'warning',
      category: 'anomaly',
      metrics: ['mau', 'revenue'],
      confidence: 0.7,
      recommendation: 'Analyze user cohort quality — are new users converting to paid?',
      evidence: { mauZScore: +mauZ.toFixed(2), revenueZScore: +revenueZ.toFixed(2) },
    });
  }

  // Growth rate instability
  const growthCV = coefficientOfVariation(growthRates);
  if (growthCV > 80) {
    flags.push({
      id: 'anomaly-volatile-growth',
      title: 'Highly volatile growth rate',
      description: `Growth rate coefficient of variation is ${growthCV.toFixed(0)}% — growth is unpredictable and inconsistent across reporting periods.`,
      severity: growthCV > 120 ? 'warning' : 'info',
      category: 'anomaly',
      metrics: ['growth_rate'],
      confidence: 0.8,
      recommendation: 'Identify what drives growth variability — seasonality, marketing spend, or fundamental instability.',
      evidence: { cv: +growthCV.toFixed(1), values: growthRates.map(g => +g.toFixed(1)).join(', ') },
    });
  }

  return flags;
}

/**
 * 2. CROSS-METRIC CORRELATION CONFLICTS
 * Detect metrics that should move together but don't.
 */
function detectCorrelationConflicts(
  metrics: DbMetricsHistory[],
  startup: DbStartup,
): RedFlag[] {
  const flags: RedFlag[] = [];
  if (metrics.length < 4) return flags;

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const revenues = sorted.map(m => Number(m.revenue));
  const maus = sorted.map(m => Number(m.mau));
  const costs = sorted.map(m => Number(m.costs));
  const transactions = sorted.map(m => Number(m.transactions));

  // Revenue vs MAU should be positively correlated
  const revMauCorr = pearsonCorrelation(revenues, maus);
  if (revMauCorr < -0.3) {
    flags.push({
      id: 'correlation-revenue-mau-negative',
      title: 'Revenue and users moving in opposite directions',
      description: `Revenue and MAU have a negative correlation (r=${revMauCorr.toFixed(2)}). As users increase, revenue decreases — this is a fundamental business model concern.`,
      severity: revMauCorr < -0.6 ? 'critical' : 'warning',
      category: 'correlation',
      metrics: ['revenue', 'mau'],
      confidence: 0.85,
      recommendation: 'Investigate monetization — are new users lower-quality or is pricing under pressure?',
      evidence: { correlation: +revMauCorr.toFixed(3) },
    });
  }

  // Revenue vs Transactions should correlate
  if (transactions.some(t => t > 0)) {
    const revTxCorr = pearsonCorrelation(revenues, transactions);
    if (revTxCorr < -0.2 && mean(transactions) > 100) {
      flags.push({
        id: 'correlation-revenue-tx-divergence',
        title: 'Transaction activity diverges from revenue',
        description: `Transaction volume and revenue are moving in different directions (r=${revTxCorr.toFixed(2)}). This may indicate wash trading, bot activity, or revenue from non-transactional sources.`,
        severity: 'warning',
        category: 'correlation',
        metrics: ['revenue', 'transactions'],
        confidence: 0.7,
        recommendation: 'Verify transaction authenticity — check for organic vs artificial activity.',
        evidence: { correlation: +revTxCorr.toFixed(3) },
      });
    }
  }

  // Cost-revenue ratio should be stable or improving
  const costRatios = sorted.map((m, i) => {
    const rev = Number(m.revenue);
    return rev > 0 ? Number(m.costs) / rev : 0;
  }).filter(r => r > 0);

  if (costRatios.length >= 3) {
    const recentRatio = costRatios[costRatios.length - 1];
    const avgRatio = mean(costRatios.slice(0, -1));
    if (recentRatio > avgRatio * 1.3 && recentRatio > 0.8) {
      flags.push({
        id: 'correlation-cost-ratio-spike',
        title: 'Cost-to-revenue ratio deteriorating',
        description: `Current cost/revenue ratio (${(recentRatio * 100).toFixed(0)}%) is significantly higher than historical average (${(avgRatio * 100).toFixed(0)}%). Margins are compressing.`,
        severity: recentRatio > 1 ? 'critical' : 'warning',
        category: 'correlation',
        metrics: ['costs', 'revenue'],
        confidence: 0.9,
        recommendation: recentRatio > 1
          ? 'CRITICAL: Costs exceed revenue. Identify and cut unprofitable spending immediately.'
          : 'Review cost structure — identify which costs are growing faster than revenue.',
        evidence: { currentRatio: +recentRatio.toFixed(2), historicalAvg: +avgRatio.toFixed(2) },
      });
    }
  }

  return flags;
}

/**
 * 3. TRAJECTORY WARNINGS
 * Detect dangerous trends and sudden reversals.
 */
function detectTrajectoryWarnings(
  metrics: DbMetricsHistory[],
  startup: DbStartup,
): RedFlag[] {
  const flags: RedFlag[] = [];
  if (metrics.length < 3) return flags;

  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  const revenues = sorted.map(m => Number(m.revenue));
  const growthRates = sorted.map(m => Number(m.growth_rate));

  // Revenue trend reversal
  const reversal = detectTrendReversal(revenues);
  if (reversal.reversed && reversal.direction === 'up-to-down') {
    flags.push({
      id: 'trajectory-revenue-reversal',
      title: 'Revenue growth has reversed',
      description: 'Revenue was trending upward but has reversed to a downward trajectory. This is a critical inflection point that needs immediate attention.',
      severity: 'critical',
      category: 'trajectory',
      metrics: ['revenue'],
      confidence: 0.85,
      recommendation: 'Urgent: identify what caused the growth reversal — market shift, product issues, or customer churn.',
      evidence: { trend: reversal.direction },
    });
  }

  // Consecutive declining growth
  if (growthRates.length >= 3) {
    const lastThree = growthRates.slice(-3);
    const allDeclining = lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2];
    if (allDeclining && lastThree[2] < lastThree[0] * 0.5) {
      flags.push({
        id: 'trajectory-growth-deceleration',
        title: 'Sustained growth deceleration',
        description: `Growth rate has declined for 3 consecutive periods: ${lastThree.map(g => g.toFixed(1) + '%').join(' → ')}. This pattern typically precedes a growth stall.`,
        severity: lastThree[2] < 0 ? 'critical' : 'warning',
        category: 'trajectory',
        metrics: ['growth_rate'],
        confidence: 0.9,
        recommendation: 'Analyze growth channels — identify which acquisition channels are saturating.',
        evidence: { lastThree: lastThree.map(g => +g.toFixed(1)).join(', ') },
      });
    }
  }

  // Burn rate acceleration
  const costs = sorted.map(m => Number(m.costs));
  if (costs.length >= 3) {
    const costChanges = costs.slice(1).map((c, i) => momChange(c, costs[i]));
    const recentCostGrowth = mean(costChanges.slice(-2));
    const recentRevGrowth = revenues.length >= 3
      ? mean(revenues.slice(-2).map((r, i) => momChange(r, revenues[revenues.length - 3 + i])))
      : 0;

    if (recentCostGrowth > recentRevGrowth * 1.5 && recentCostGrowth > 10) {
      flags.push({
        id: 'trajectory-burn-acceleration',
        title: 'Burn rate accelerating faster than revenue',
        description: `Costs are growing at ${recentCostGrowth.toFixed(1)}% MoM while revenue grows at ${recentRevGrowth.toFixed(1)}% MoM. If sustained, this will compress runway rapidly.`,
        severity: recentCostGrowth > recentRevGrowth * 3 ? 'critical' : 'warning',
        category: 'trajectory',
        metrics: ['costs', 'revenue'],
        confidence: 0.85,
        recommendation: 'Review hiring plan and marketing spend — ensure cost growth is tied to revenue-generating activities.',
        evidence: { costGrowth: +recentCostGrowth.toFixed(1), revenueGrowth: +recentRevGrowth.toFixed(1) },
      });
    }
  }

  // Runway danger zone
  if (sorted.length >= 2) {
    const latestRev = Number(sorted[sorted.length - 1].revenue);
    const latestCost = Number(sorted[sorted.length - 1].costs);
    const monthlyBurn = Math.max(latestCost - latestRev, 0);
    if (monthlyBurn > 0) {
      const runway = startup.treasury / monthlyBurn;
      if (runway < 6) {
        flags.push({
          id: 'trajectory-runway-critical',
          title: `Critical: ${runway.toFixed(0)} months runway remaining`,
          description: `At current burn rate ($${monthlyBurn.toLocaleString()}/mo) with $${startup.treasury.toLocaleString()} treasury, the startup has approximately ${runway.toFixed(1)} months before running out of cash.`,
          severity: runway < 3 ? 'alert' : 'critical',
          category: 'trajectory',
          metrics: ['treasury', 'costs', 'revenue'],
          confidence: 0.95,
          recommendation: runway < 3
            ? 'EMERGENCY: Secure bridge funding immediately or implement drastic cost cuts.'
            : 'Begin fundraising process now — runway below 6-month institutional safety threshold.',
          evidence: { runway: +runway.toFixed(1), monthlyBurn, treasury: startup.treasury },
        });
      }
    }
  }

  return flags;
}

/**
 * 4. TOKENOMICS RISKS
 * Detect dangerous token distribution and inflation patterns.
 */
function detectTokenomicsRisks(startup: DbStartup): RedFlag[] {
  const flags: RedFlag[] = [];

  const whale = Number(startup.whale_concentration);
  const inflation = Number(startup.inflation_rate);
  const tokenConcentration = Number(startup.token_concentration_pct);

  // Extreme whale concentration
  if (whale > 50) {
    flags.push({
      id: 'tokenomics-whale-extreme',
      title: 'Extreme whale concentration',
      description: `Top wallets control ${whale}% of token supply. This creates severe rug-pull risk and governance centralization. A single whale can manipulate price and governance outcomes.`,
      severity: whale > 70 ? 'alert' : 'critical',
      category: 'tokenomics',
      metrics: ['whale_concentration'],
      confidence: 0.95,
      recommendation: 'Implement token distribution programs: liquidity mining, community airdrops, or vesting extensions for large holders.',
      evidence: { whaleConcentration: whale },
    });
  } else if (whale > 35) {
    flags.push({
      id: 'tokenomics-whale-high',
      title: 'Elevated whale concentration',
      description: `Top wallets hold ${whale}% of supply — above the 35% institutional comfort threshold.`,
      severity: 'warning',
      category: 'tokenomics',
      metrics: ['whale_concentration'],
      confidence: 0.85,
      recommendation: 'Monitor whale wallet activity for large sell orders. Consider distribution incentives.',
      evidence: { whaleConcentration: whale },
    });
  }

  // Unsustainable inflation
  if (inflation > 10) {
    flags.push({
      id: 'tokenomics-inflation-extreme',
      title: 'Unsustainable token inflation',
      description: `${inflation}% annual inflation rate will rapidly dilute existing holders. At this rate, token value is reduced by ${(1 - 1 / (1 + inflation / 100)).toFixed(0)}% annually from dilution alone.`,
      severity: 'critical',
      category: 'tokenomics',
      metrics: ['inflation_rate'],
      confidence: 0.9,
      recommendation: 'Reduce emission schedule or implement burn mechanisms to offset inflation.',
      evidence: { inflationRate: inflation, yearlyDilution: +(inflation / (1 + inflation / 100)).toFixed(1) },
    });
  } else if (inflation > 6) {
    flags.push({
      id: 'tokenomics-inflation-high',
      title: 'High token inflation',
      description: `${inflation}% annual inflation exceeds the 5% benchmark for sustainable tokenomics.`,
      severity: 'warning',
      category: 'tokenomics',
      metrics: ['inflation_rate'],
      confidence: 0.85,
      recommendation: 'Consider implementing deflationary mechanisms (fee burns, buybacks).',
      evidence: { inflationRate: inflation },
    });
  }

  // Combined whale + inflation = toxic
  if (whale > 30 && inflation > 5) {
    flags.push({
      id: 'tokenomics-toxic-combination',
      title: 'Toxic tokenomics combination',
      description: `High whale concentration (${whale}%) combined with high inflation (${inflation}%) creates a scenario where whales capture inflationary rewards while retail holders are diluted.`,
      severity: 'critical',
      category: 'tokenomics',
      metrics: ['whale_concentration', 'inflation_rate'],
      confidence: 0.9,
      recommendation: 'Address both issues simultaneously — distribution + emission reduction.',
      evidence: { whaleConcentration: whale, inflationRate: inflation },
    });
  }

  return flags;
}

/**
 * 5. OPERATIONAL CONCERNS
 * Detect mismatches between team, revenue, and operational metrics.
 */
function detectOperationalConcerns(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): RedFlag[] {
  const flags: RedFlag[] = [];

  // Revenue per employee benchmark
  if (startup.team_size > 0 && startup.mrr > 0) {
    const revenuePerEmployee = (startup.mrr * 12) / startup.team_size;
    if (revenuePerEmployee < 30000 && startup.mrr > 50000) {
      flags.push({
        id: 'operational-low-revenue-per-head',
        title: 'Low revenue per employee',
        description: `Annual revenue per employee is $${revenuePerEmployee.toLocaleString()} — significantly below the $100K+ benchmark for efficient startups. The team may be too large for current revenue.`,
        severity: revenuePerEmployee < 15000 ? 'warning' : 'info',
        category: 'operational',
        metrics: ['mrr', 'team_size'],
        confidence: 0.7,
        recommendation: 'Evaluate hiring plan — focus on revenue-generating roles before support roles.',
        evidence: { annualRevenuePerEmployee: +revenuePerEmployee.toFixed(0), teamSize: startup.team_size, arr: startup.mrr * 12 },
      });
    }
  }

  // Team size vs growth mismatch
  const growth = Number(startup.growth_rate);
  if (startup.team_size > 20 && growth < 5) {
    flags.push({
      id: 'operational-team-growth-mismatch',
      title: 'Large team with slow growth',
      description: `${startup.team_size} team members but only ${growth}% growth rate. The team size suggests Series A+ maturity, but growth rate is pre-seed level.`,
      severity: growth < 0 ? 'critical' : 'warning',
      category: 'operational',
      metrics: ['team_size', 'growth_rate'],
      confidence: 0.75,
      recommendation: 'Audit team composition — are there too many non-essential hires?',
      evidence: { teamSize: startup.team_size, growthRate: growth },
    });
  }

  // Peer comparison outliers
  const categoryPeers = allStartups.filter(s => s.category === startup.category && s.id !== startup.id);
  if (categoryPeers.length >= 2) {
    const peerMrrs = categoryPeers.map(s => s.mrr);
    const mrrZ = zScore(startup.mrr, [...peerMrrs, startup.mrr]);
    if (mrrZ < -2) {
      flags.push({
        id: 'operational-underperforming-peers',
        title: 'Significantly underperforming category peers',
        description: `MRR ($${startup.mrr.toLocaleString()}) is ${Math.abs(mrrZ).toFixed(1)}σ below the ${startup.category} category average ($${mean(peerMrrs).toLocaleString()}).`,
        severity: 'info',
        category: 'operational',
        metrics: ['mrr'],
        confidence: 0.65,
        recommendation: 'Benchmark against peers to identify competitive gaps.',
        evidence: { mrrZScore: +mrrZ.toFixed(2), categoryAvgMrr: +mean(peerMrrs).toFixed(0), peerCount: categoryPeers.length },
      });
    }
  }

  // Sustainability score extremely low
  if (startup.sustainability_score < 30) {
    flags.push({
      id: 'operational-poor-sustainability',
      title: 'Very low sustainability score',
      description: `Sustainability score of ${startup.sustainability_score}/100 is in the bottom tier. This may exclude the startup from ESG-mandated institutional capital.`,
      severity: 'info',
      category: 'operational',
      metrics: ['sustainability_score'],
      confidence: 0.8,
      recommendation: 'Implement basic sustainability practices to access ESG-focused investor capital.',
      evidence: { sustainabilityScore: startup.sustainability_score },
    });
  }

  return flags;
}

/**
 * 6. VERIFICATION CONCERNS
 * Detect issues with the verification and trust infrastructure.
 */
function detectVerificationConcerns(startup: DbStartup): RedFlag[] {
  const flags: RedFlag[] = [];

  if (!startup.verified) {
    flags.push({
      id: 'verification-not-verified',
      title: 'Metrics not verified on-chain',
      description: 'This startup has not completed on-chain metric verification. All data is self-reported and unaudited.',
      severity: 'warning',
      category: 'verification',
      metrics: ['verified'],
      confidence: 1.0,
      recommendation: 'Complete on-chain verification to build investor trust and access institutional capital.',
      evidence: { verified: 'false' },
    });
  }

  if (startup.trust_score < 40) {
    flags.push({
      id: 'verification-low-trust',
      title: 'Trust score below institutional minimum',
      description: `Trust score of ${startup.trust_score}/100 is below the 40-point minimum for institutional investors. Multiple trust factors are failing.`,
      severity: 'critical',
      category: 'verification',
      metrics: ['trust_score'],
      confidence: 0.9,
      recommendation: 'Review trust score breakdown — address the lowest-scoring components first.',
      evidence: { trustScore: startup.trust_score },
    });
  }

  return flags;
}

// ── Main Analysis Function ───────────────────────────────────────────

/**
 * Run the full red flag detection suite against a startup.
 *
 * @param startup    - The startup to analyze
 * @param metrics    - Historical metrics (sorted by date)
 * @param allStartups - All startups for peer comparison
 * @returns          - Complete red flag report
 */
export function analyzeRedFlags(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): RedFlagReport {
  const allFlags: RedFlag[] = [
    ...detectStatisticalAnomalies(metrics, startup),
    ...detectCorrelationConflicts(metrics, startup),
    ...detectTrajectoryWarnings(metrics, startup),
    ...detectTokenomicsRisks(startup),
    ...detectOperationalConcerns(startup, metrics, allStartups),
    ...detectVerificationConcerns(startup),
  ];

  // Sort by severity (alert > critical > warning > info)
  const severityOrder: Record<FlagSeverity, number> = { alert: 0, critical: 1, warning: 2, info: 3 };
  allFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Count by severity
  const counts: Record<FlagSeverity, number> = { alert: 0, critical: 0, warning: 0, info: 0 };
  for (const flag of allFlags) {
    counts[flag.severity]++;
  }

  // Calculate risk score (weighted by severity)
  const riskScore = Math.min(100,
    counts.alert * 30 +
    counts.critical * 15 +
    counts.warning * 5 +
    counts.info * 1
  );

  // Determine overall risk level
  const riskLevel: RedFlagReport['riskLevel'] =
    counts.alert > 0 || riskScore > 60 ? 'danger' :
    counts.critical > 0 || riskScore > 30 ? 'cautious' :
    counts.warning > 0 || riskScore > 10 ? 'watch' :
    'clean';

  return {
    riskLevel,
    riskScore,
    flags: allFlags,
    counts,
    analyzedAt: Date.now(),
    dataPointsAnalyzed: metrics.length * 6 + 8, // 6 fields per metric row + 8 startup fields
  };
}
