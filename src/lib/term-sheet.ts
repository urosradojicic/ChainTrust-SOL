/**
 * Term Sheet Builder Engine
 * ─────────────────────────
 * Generates, validates, and compares investment term sheets.
 * Supports SAFE notes, convertible notes, and priced equity rounds.
 *
 * Features:
 *   - Template generation with market-standard defaults
 *   - Cap table impact modeling (dilution, waterfall)
 *   - Term comparison against market benchmarks
 *   - Smart contract encoding preparation
 */

// ── Types ────────────────────────────────────────────────────────────

export type InstrumentType = 'safe' | 'convertible_note' | 'series_preferred';

export type SafeType = 'pre_money' | 'post_money';

export interface SafeTerms {
  instrument: 'safe';
  safeType: SafeType;
  /** Valuation cap (0 = uncapped) */
  valuationCap: number;
  /** Discount rate (0-100%, 0 = no discount) */
  discountRate: number;
  /** Investment amount */
  investmentAmount: number;
  /** Most Favored Nation clause */
  mfnClause: boolean;
  /** Pro-rata rights for future rounds */
  proRataRights: boolean;
  /** Investor name/entity */
  investorName: string;
  /** Date of SAFE */
  date: string;
}

export interface ConvertibleNoteTerms {
  instrument: 'convertible_note';
  /** Principal amount */
  principalAmount: number;
  /** Annual interest rate (%) */
  interestRate: number;
  /** Maturity date (months from issuance) */
  maturityMonths: number;
  /** Valuation cap */
  valuationCap: number;
  /** Conversion discount (%) */
  conversionDiscount: number;
  /** Qualified financing threshold (minimum raise for auto-conversion) */
  qualifiedFinancingThreshold: number;
  /** Investor name */
  investorName: string;
  /** Date */
  date: string;
}

export interface SeriesTerms {
  instrument: 'series_preferred';
  /** Round name (Series A, B, etc.) */
  roundName: string;
  /** Pre-money valuation */
  preMoney: number;
  /** Total raise amount */
  raiseAmount: number;
  /** Price per share */
  pricePerShare: number;
  /** Shares issued */
  sharesIssued: number;
  /** Liquidation preference multiplier (1x, 2x, etc.) */
  liquidationPreference: number;
  /** Participating preferred */
  participatingPreferred: boolean;
  /** Anti-dilution type */
  antiDilution: 'none' | 'broad_weighted_average' | 'narrow_weighted_average' | 'full_ratchet';
  /** Board seats for investor */
  boardSeats: number;
  /** Protective provisions */
  protectiveProvisions: boolean;
  /** Pro-rata rights */
  proRataRights: boolean;
  /** Drag-along */
  dragAlong: boolean;
  /** Tag-along */
  tagAlong: boolean;
  /** ROFR (Right of First Refusal) */
  rofr: boolean;
  /** Information rights (quarterly financials, etc.) */
  informationRights: boolean;
  /** Option pool expansion (%) to be created pre-money */
  optionPoolExpansion: number;
  /** No-shop period (days) */
  noShopDays: number;
  /** Investor name */
  investorName: string;
  /** Date */
  date: string;
}

export type TermSheet = SafeTerms | ConvertibleNoteTerms | SeriesTerms;

export interface TermSheetComparison {
  /** What's being compared */
  field: string;
  /** The value in this term sheet */
  value: string;
  /** Market standard / benchmark */
  benchmark: string;
  /** Assessment */
  assessment: 'founder_friendly' | 'market_standard' | 'investor_friendly' | 'aggressive';
  /** Explanation */
  explanation: string;
}

export interface DilutionImpact {
  /** Ownership percentage before this investment */
  founderOwnershipBefore: number;
  /** Ownership percentage after this investment */
  founderOwnershipAfter: number;
  /** Dilution percentage */
  dilution: number;
  /** Post-money valuation */
  postMoney: number;
  /** Effective price per percentage point */
  pricePerPercent: number;
}

// ── Market Benchmarks ────────────────────────────────────────────────

export const MARKET_BENCHMARKS = {
  safe: {
    typicalCap: { preSeed: [2000000, 6000000], seed: [5000000, 15000000] },
    typicalDiscount: [15, 25],
    standardMfn: true,
    standardProRata: true,
    standardType: 'post_money' as SafeType,
  },
  convertible: {
    typicalInterest: [4, 8],
    typicalMaturity: [18, 24],
    typicalDiscount: [15, 25],
    typicalQualifiedFinancing: [1000000, 3000000],
  },
  series: {
    typicalLiqPref: 1,
    standardAntiDilution: 'broad_weighted_average' as const,
    standardBoardSeats: { seriesA: 1, seriesB: 1, seriesC: 1 },
    typicalOptionPool: [10, 20],
    typicalNoShop: [30, 60],
    standardProtectiveProvisions: true,
    standardProRata: true,
    standardDragAlong: true,
    standardInfoRights: true,
  },
};

// ── Template Generators ──────────────────────────────────────────────

export function createSafeTemplate(investmentAmount: number, stage: 'pre_seed' | 'seed' = 'seed'): SafeTerms {
  const capRange = MARKET_BENCHMARKS.safe.typicalCap[stage === 'pre_seed' ? 'preSeed' : 'seed'];
  return {
    instrument: 'safe',
    safeType: 'post_money',
    valuationCap: Math.round((capRange[0] + capRange[1]) / 2),
    discountRate: 20,
    investmentAmount,
    mfnClause: true,
    proRataRights: true,
    investorName: '',
    date: new Date().toISOString().split('T')[0],
  };
}

export function createConvertibleTemplate(principalAmount: number): ConvertibleNoteTerms {
  return {
    instrument: 'convertible_note',
    principalAmount,
    interestRate: 6,
    maturityMonths: 24,
    valuationCap: 10000000,
    conversionDiscount: 20,
    qualifiedFinancingThreshold: 1000000,
    investorName: '',
    date: new Date().toISOString().split('T')[0],
  };
}

export function createSeriesTemplate(raiseAmount: number, preMoney: number): SeriesTerms {
  const postMoney = preMoney + raiseAmount;
  const pricePerShare = preMoney / 10000000; // Assume 10M shares outstanding
  return {
    instrument: 'series_preferred',
    roundName: 'Series A',
    preMoney,
    raiseAmount,
    pricePerShare,
    sharesIssued: Math.round(raiseAmount / pricePerShare),
    liquidationPreference: 1,
    participatingPreferred: false,
    antiDilution: 'broad_weighted_average',
    boardSeats: 1,
    protectiveProvisions: true,
    proRataRights: true,
    dragAlong: true,
    tagAlong: true,
    rofr: true,
    informationRights: true,
    optionPoolExpansion: 10,
    noShopDays: 45,
    investorName: '',
    date: new Date().toISOString().split('T')[0],
  };
}

// ── Analysis Functions ───────────────────────────────────────────────

/**
 * Compare a term sheet against market benchmarks.
 */
export function compareToMarket(terms: TermSheet): TermSheetComparison[] {
  const comparisons: TermSheetComparison[] = [];

  if (terms.instrument === 'safe') {
    const range = terms.valuationCap <= 6000000
      ? MARKET_BENCHMARKS.safe.typicalCap.preSeed
      : MARKET_BENCHMARKS.safe.typicalCap.seed;

    comparisons.push({
      field: 'Valuation Cap',
      value: `$${(terms.valuationCap / 1000000).toFixed(1)}M`,
      benchmark: `$${(range[0] / 1000000).toFixed(0)}-${(range[1] / 1000000).toFixed(0)}M`,
      assessment: terms.valuationCap < range[0] ? 'investor_friendly'
        : terms.valuationCap > range[1] ? 'founder_friendly' : 'market_standard',
      explanation: terms.valuationCap < range[0]
        ? 'Cap is below market range — investor gets a better deal.'
        : terms.valuationCap > range[1]
        ? 'Cap is above market range — founder retains more ownership.'
        : 'Cap is within market range.',
    });

    comparisons.push({
      field: 'Discount',
      value: `${terms.discountRate}%`,
      benchmark: '15-25%',
      assessment: terms.discountRate < 15 ? 'founder_friendly'
        : terms.discountRate > 25 ? 'investor_friendly' : 'market_standard',
      explanation: terms.discountRate === 0
        ? 'No discount — unusual, typically indicates a high cap.'
        : `${terms.discountRate}% discount is ${terms.discountRate <= 15 ? 'favorable to founders' : terms.discountRate >= 25 ? 'favorable to investors' : 'standard'}.`,
    });

    comparisons.push({
      field: 'SAFE Type',
      value: terms.safeType === 'post_money' ? 'Post-Money' : 'Pre-Money',
      benchmark: 'Post-Money (YC standard)',
      assessment: terms.safeType === 'post_money' ? 'market_standard' : 'founder_friendly',
      explanation: terms.safeType === 'post_money'
        ? 'Post-money SAFE (YC standard since 2018) — ownership is clear and predictable.'
        : 'Pre-money SAFE — dilution is less predictable for founders.',
    });
  }

  if (terms.instrument === 'series_preferred') {
    comparisons.push({
      field: 'Liquidation Preference',
      value: `${terms.liquidationPreference}x ${terms.participatingPreferred ? 'participating' : 'non-participating'}`,
      benchmark: '1x non-participating',
      assessment: terms.liquidationPreference === 1 && !terms.participatingPreferred ? 'market_standard'
        : terms.liquidationPreference > 1 || terms.participatingPreferred ? 'investor_friendly' : 'founder_friendly',
      explanation: terms.liquidationPreference > 1
        ? `${terms.liquidationPreference}x liquidation preference is aggressive — investors get ${terms.liquidationPreference}x their money before anyone else.`
        : terms.participatingPreferred
        ? 'Participating preferred gives investors both their liquidation preference AND a pro-rata share of remaining proceeds. This is investor-friendly.'
        : '1x non-participating is the market standard — fair to both sides.',
    });

    comparisons.push({
      field: 'Anti-Dilution',
      value: terms.antiDilution.replace(/_/g, ' '),
      benchmark: 'Broad-based weighted average',
      assessment: terms.antiDilution === 'broad_weighted_average' ? 'market_standard'
        : terms.antiDilution === 'full_ratchet' ? 'aggressive' : 'market_standard',
      explanation: terms.antiDilution === 'full_ratchet'
        ? 'Full ratchet is very aggressive — in a down round, existing investors get repriced to the new lower price regardless of round size.'
        : 'Broad-based weighted average is the standard protection mechanism.',
    });

    comparisons.push({
      field: 'Option Pool',
      value: `${terms.optionPoolExpansion}% (pre-money)`,
      benchmark: '10-20%',
      assessment: terms.optionPoolExpansion >= 10 && terms.optionPoolExpansion <= 20 ? 'market_standard'
        : terms.optionPoolExpansion > 20 ? 'investor_friendly' : 'founder_friendly',
      explanation: terms.optionPoolExpansion > 20
        ? `${terms.optionPoolExpansion}% option pool is large — created pre-money, it dilutes founders more than investors.`
        : 'Option pool size is within standard range.',
    });

    comparisons.push({
      field: 'Board Seats',
      value: `${terms.boardSeats} investor seat(s)`,
      benchmark: '1 (Series A), 1-2 (Series B+)',
      assessment: terms.boardSeats <= 1 ? 'market_standard' : 'investor_friendly',
      explanation: terms.boardSeats > 1
        ? 'Multiple board seats gives investors significant governance control.'
        : 'Standard single board seat maintains founder control.',
    });

    comparisons.push({
      field: 'No-Shop Period',
      value: `${terms.noShopDays} days`,
      benchmark: '30-60 days',
      assessment: terms.noShopDays >= 30 && terms.noShopDays <= 60 ? 'market_standard'
        : terms.noShopDays > 60 ? 'investor_friendly' : 'founder_friendly',
      explanation: terms.noShopDays > 60
        ? `${terms.noShopDays}-day exclusivity is long — limits founder's negotiating leverage.`
        : 'No-shop period is within standard range.',
    });
  }

  return comparisons;
}

/**
 * Calculate dilution impact of a term sheet.
 */
export function calculateDilution(
  terms: TermSheet,
  currentFounderOwnership: number = 80,
  currentSharesOutstanding: number = 10000000,
): DilutionImpact {
  let dilution = 0;
  let postMoney = 0;

  if (terms.instrument === 'safe') {
    postMoney = terms.valuationCap > 0 ? terms.valuationCap : 10000000;
    if (terms.safeType === 'post_money') {
      dilution = (terms.investmentAmount / postMoney) * 100;
    } else {
      const preMoney = postMoney - terms.investmentAmount;
      dilution = (terms.investmentAmount / postMoney) * 100;
    }
  } else if (terms.instrument === 'convertible_note') {
    const effectiveCap = terms.valuationCap > 0 ? terms.valuationCap : 10000000;
    const discountedCap = effectiveCap * (1 - terms.conversionDiscount / 100);
    const effectiveVal = Math.min(effectiveCap, discountedCap);
    postMoney = effectiveVal + terms.principalAmount;
    dilution = (terms.principalAmount / postMoney) * 100;
  } else if (terms.instrument === 'series_preferred') {
    postMoney = terms.preMoney + terms.raiseAmount;
    const optionPoolDilution = terms.optionPoolExpansion;
    dilution = ((terms.raiseAmount / postMoney) + optionPoolDilution / 100) * 100;
  }

  const founderAfter = currentFounderOwnership * (1 - dilution / 100);
  const pricePerPercent = postMoney > 0 ? postMoney / 100 : 0;

  return {
    founderOwnershipBefore: currentFounderOwnership,
    founderOwnershipAfter: +founderAfter.toFixed(2),
    dilution: +dilution.toFixed(2),
    postMoney,
    pricePerPercent,
  };
}
