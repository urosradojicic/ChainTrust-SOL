/**
 * Cap Table Engine
 * ────────────────
 * Manages shareholder registry, equity modeling, and waterfall analysis.
 * Supports common/preferred shares, options, SAFEs, convertible notes.
 *
 * Features:
 *   - Shareholder registry with ownership tracking
 *   - Scenario modeling (new rounds, exits)
 *   - Waterfall analysis at different exit valuations
 *   - SAFE/note conversion simulation
 *   - Option pool management
 *   - Round-over-round dilution tracking
 */

// ── Types ────────────────────────────────────────────────────────────

export type ShareholderType = 'founder' | 'investor' | 'employee' | 'advisor' | 'option_pool' | 'safe' | 'note';

export type ShareClass = 'common' | 'preferred_a' | 'preferred_b' | 'preferred_seed' | 'options' | 'safe' | 'note';

export interface Shareholder {
  /** Unique ID */
  id: string;
  /** Name of shareholder */
  name: string;
  /** Type of shareholder */
  type: ShareholderType;
  /** Share class */
  shareClass: ShareClass;
  /** Number of shares (0 for unconverted SAFEs/notes) */
  shares: number;
  /** Ownership percentage */
  ownershipPct: number;
  /** Total invested amount */
  invested: number;
  /** Price per share (at time of investment) */
  pricePerShare: number;
  /** Vesting: months remaining (null if fully vested) */
  vestingMonthsRemaining: number | null;
  /** For SAFEs: valuation cap */
  valuationCap: number | null;
  /** For SAFEs/notes: discount rate */
  discount: number | null;
  /** For preferred: liquidation preference multiplier */
  liquidationPreference: number | null;
  /** For preferred: participating */
  participating: boolean;
  /** Date of investment/grant */
  date: string;
}

export interface CapTable {
  /** Company name */
  companyName: string;
  /** Total shares authorized */
  totalSharesAuthorized: number;
  /** Total shares outstanding (issued) */
  totalSharesOutstanding: number;
  /** All shareholders */
  shareholders: Shareholder[];
  /** Total raised to date */
  totalRaised: number;
  /** Latest valuation (post-money) */
  latestValuation: number;
  /** Created timestamp */
  createdAt: number;
}

export interface WaterfallRow {
  /** Shareholder name */
  name: string;
  /** Share class */
  shareClass: ShareClass;
  /** Ownership percentage */
  ownershipPct: number;
  /** Proceeds at this exit value */
  proceeds: number;
  /** Return multiple (proceeds / invested) */
  returnMultiple: number;
  /** Percentage of total exit value received */
  proceedsPct: number;
}

export interface WaterfallAnalysis {
  /** Exit valuation */
  exitValuation: number;
  /** Distribution by shareholder */
  rows: WaterfallRow[];
  /** Total proceeds distributed */
  totalDistributed: number;
  /** Remaining after all preferences */
  remainingForCommon: number;
}

export interface ScenarioResult {
  /** Scenario name */
  name: string;
  /** New shares issued */
  newSharesIssued: number;
  /** New investor ownership */
  newInvestorOwnership: number;
  /** Founder ownership after */
  founderOwnershipAfter: number;
  /** Dilution to existing shareholders */
  dilution: number;
  /** Post-money valuation */
  postMoney: number;
  /** Updated cap table */
  updatedCapTable: CapTable;
}

// ── Cap Table Factory ────────────────────────────────────────────────

/**
 * Create a cap table for a new startup.
 */
export function createCapTable(
  companyName: string,
  founders: { name: string; shares: number; vestingMonths: number }[],
  authorizedShares: number = 10000000,
): CapTable {
  const totalFounderShares = founders.reduce((s, f) => s + f.shares, 0);

  const shareholders: Shareholder[] = founders.map((f, i) => ({
    id: `founder-${i}`,
    name: f.name,
    type: 'founder' as ShareholderType,
    shareClass: 'common' as ShareClass,
    shares: f.shares,
    ownershipPct: (f.shares / totalFounderShares) * 100,
    invested: 0,
    pricePerShare: 0.0001, // Nominal
    vestingMonthsRemaining: f.vestingMonths,
    valuationCap: null,
    discount: null,
    liquidationPreference: null,
    participating: false,
    date: new Date().toISOString().split('T')[0],
  }));

  return {
    companyName,
    totalSharesAuthorized: authorizedShares,
    totalSharesOutstanding: totalFounderShares,
    shareholders,
    totalRaised: 0,
    latestValuation: 0,
    createdAt: Date.now(),
  };
}

/**
 * Add a SAFE investor to the cap table.
 */
export function addSafe(
  capTable: CapTable,
  investorName: string,
  amount: number,
  valuationCap: number,
  discount: number = 20,
): CapTable {
  const newShareholder: Shareholder = {
    id: `safe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: investorName,
    type: 'safe',
    shareClass: 'safe',
    shares: 0, // Not yet converted
    ownershipPct: 0, // Calculated on conversion
    invested: amount,
    pricePerShare: 0,
    vestingMonthsRemaining: null,
    valuationCap,
    discount,
    liquidationPreference: null,
    participating: false,
    date: new Date().toISOString().split('T')[0],
  };

  return {
    ...capTable,
    shareholders: [...capTable.shareholders, newShareholder],
    totalRaised: capTable.totalRaised + amount,
  };
}

/**
 * Add a priced equity round to the cap table.
 */
export function addPricedRound(
  capTable: CapTable,
  investorName: string,
  investmentAmount: number,
  preMoney: number,
  shareClass: ShareClass = 'preferred_a',
  liquidationPreference: number = 1,
  optionPoolExpansionPct: number = 0,
): CapTable {
  const postMoney = preMoney + investmentAmount;
  const existingShares = capTable.totalSharesOutstanding;

  // Create option pool first (dilutes pre-money)
  let poolShares = 0;
  const updatedShareholders = [...capTable.shareholders];
  if (optionPoolExpansionPct > 0) {
    poolShares = Math.round(existingShares * (optionPoolExpansionPct / 100) / (1 - optionPoolExpansionPct / 100));
    updatedShareholders.push({
      id: `pool-${Date.now()}`,
      name: 'Unallocated Option Pool',
      type: 'option_pool',
      shareClass: 'options',
      shares: poolShares,
      ownershipPct: 0,
      invested: 0,
      pricePerShare: 0,
      vestingMonthsRemaining: null,
      valuationCap: null,
      discount: null,
      liquidationPreference: null,
      participating: false,
      date: new Date().toISOString().split('T')[0],
    });
  }

  const totalPreRoundShares = existingShares + poolShares;
  const pricePerShare = preMoney / totalPreRoundShares;
  const newShares = Math.round(investmentAmount / pricePerShare);

  // Convert any SAFEs
  const convertedSafes = updatedShareholders.filter(s => s.type === 'safe');
  let safeConvertedShares = 0;
  for (const safe of convertedSafes) {
    if (safe.valuationCap && safe.invested > 0) {
      const effectivePrice = Math.min(
        pricePerShare,
        safe.valuationCap / totalPreRoundShares,
        pricePerShare * (1 - (safe.discount ?? 0) / 100),
      );
      const shares = Math.round(safe.invested / effectivePrice);
      safe.shares = shares;
      safe.pricePerShare = effectivePrice;
      safe.shareClass = shareClass;
      safe.type = 'investor';
      safeConvertedShares += shares;
    }
  }

  // Add new investor
  updatedShareholders.push({
    id: `investor-${Date.now()}`,
    name: investorName,
    type: 'investor',
    shareClass,
    shares: newShares,
    ownershipPct: 0,
    invested: investmentAmount,
    pricePerShare,
    vestingMonthsRemaining: null,
    valuationCap: null,
    discount: null,
    liquidationPreference,
    participating: false,
    date: new Date().toISOString().split('T')[0],
  });

  const totalShares = totalPreRoundShares + newShares + safeConvertedShares;

  // Recalculate ownership percentages
  for (const sh of updatedShareholders) {
    sh.ownershipPct = +(sh.shares / totalShares * 100).toFixed(2);
  }

  return {
    ...capTable,
    shareholders: updatedShareholders,
    totalSharesOutstanding: totalShares,
    totalRaised: capTable.totalRaised + investmentAmount,
    latestValuation: postMoney,
  };
}

/**
 * Run waterfall analysis at a given exit valuation.
 */
export function runWaterfall(capTable: CapTable, exitValuation: number): WaterfallAnalysis {
  let remaining = exitValuation;
  const rows: WaterfallRow[] = [];

  // Step 1: Pay liquidation preferences (preferred first)
  const preferred = capTable.shareholders.filter(
    s => s.liquidationPreference && s.liquidationPreference > 0 && s.shares > 0
  );
  for (const p of preferred) {
    const preference = p.invested * (p.liquidationPreference ?? 1);
    const payout = Math.min(preference, remaining);
    remaining -= payout;
    rows.push({
      name: p.name,
      shareClass: p.shareClass,
      ownershipPct: p.ownershipPct,
      proceeds: payout,
      returnMultiple: p.invested > 0 ? payout / p.invested : 0,
      proceedsPct: exitValuation > 0 ? (payout / exitValuation) * 100 : 0,
    });
  }

  // Step 2: Distribute remaining pro-rata to all shareholders
  const allWithShares = capTable.shareholders.filter(s => s.shares > 0 && !preferred.find(p => p.id === s.id));
  const totalShares = capTable.totalSharesOutstanding;

  // Also include preferred if non-participating (they choose the higher of preference OR pro-rata)
  for (const sh of allWithShares) {
    const proRata = totalShares > 0 ? (sh.shares / totalShares) * remaining : 0;
    const existingRow = rows.find(r => r.name === sh.name);
    if (existingRow) {
      // Preferred already got their preference, add participating pro-rata if applicable
      if (sh.participating) {
        existingRow.proceeds += proRata;
        existingRow.returnMultiple = sh.invested > 0 ? existingRow.proceeds / sh.invested : 0;
        existingRow.proceedsPct = exitValuation > 0 ? (existingRow.proceeds / exitValuation) * 100 : 0;
      }
    } else {
      rows.push({
        name: sh.name,
        shareClass: sh.shareClass,
        ownershipPct: sh.ownershipPct,
        proceeds: proRata,
        returnMultiple: sh.invested > 0 ? proRata / sh.invested : 0,
        proceedsPct: exitValuation > 0 ? (proRata / exitValuation) * 100 : 0,
      });
    }
  }

  // For preferred non-participating: they take the MAX of preference or pro-rata
  for (const p of preferred) {
    const proRata = totalShares > 0 ? (p.shares / totalShares) * exitValuation : 0;
    const row = rows.find(r => r.name === p.name);
    if (row && !p.participating && proRata > row.proceeds) {
      // They'd rather take pro-rata than their preference
      row.proceeds = proRata;
      row.returnMultiple = p.invested > 0 ? proRata / p.invested : 0;
      row.proceedsPct = exitValuation > 0 ? (proRata / exitValuation) * 100 : 0;
    }
  }

  const totalDistributed = rows.reduce((s, r) => s + r.proceeds, 0);

  return {
    exitValuation,
    rows: rows.sort((a, b) => b.proceeds - a.proceeds),
    totalDistributed,
    remainingForCommon: Math.max(0, remaining),
  };
}

/**
 * Generate a demo cap table for a startup.
 */
export function createDemoCapTable(companyName: string): CapTable {
  let cap = createCapTable(companyName, [
    { name: 'Founder 1 (CEO)', shares: 4500000, vestingMonths: 36 },
    { name: 'Founder 2 (CTO)', shares: 3500000, vestingMonths: 36 },
    { name: 'Founder 3 (COO)', shares: 2000000, vestingMonths: 42 },
  ]);

  cap = addSafe(cap, 'Angel Investor 1', 150000, 5000000, 20);
  cap = addSafe(cap, 'Angel Investor 2', 100000, 5000000, 20);
  cap = addSafe(cap, 'Pre-Seed Fund', 500000, 8000000, 15);

  cap = addPricedRound(cap, 'Seed VC Fund', 2000000, 15000000, 'preferred_seed', 1, 10);

  return cap;
}
