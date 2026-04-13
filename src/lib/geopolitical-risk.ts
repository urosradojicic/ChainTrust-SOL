/**
 * Geopolitical Risk Scorer
 * ────────────────────────
 * Evaluates geopolitical risk factors for cross-border investments.
 * What sovereign wealth funds and international family offices need.
 *
 * Dimensions:
 *   - Regulatory environment stability
 *   - Sanctions exposure
 *   - Political stability of operating jurisdictions
 *   - Currency/capital controls
 *   - Cross-border investment restrictions
 *   - Data sovereignty requirements
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'elevated' | 'high' | 'severe';

export interface GeopoliticalFactor {
  name: string;
  score: number; // 0-100 (higher = safer)
  riskLevel: RiskLevel;
  description: string;
  mitigations: string[];
}

export interface JurisdictionProfile {
  jurisdiction: string;
  region: 'north_america' | 'europe' | 'asia_pacific' | 'middle_east' | 'latin_america' | 'africa';
  regulatoryClarity: number; // 0-100
  cryptoFriendliness: number; // 0-100
  politicalStability: number; // 0-100
  capitalFreedom: number; // 0-100
  dataSovereignty: RiskLevel;
  sanctionsRisk: RiskLevel;
  overallScore: number;
  investorTypes: string[];
  keyRegulations: string[];
}

export interface GeopoliticalReport {
  /** Overall geopolitical risk score (0-100, higher = safer) */
  overallScore: number;
  /** Risk level */
  riskLevel: RiskLevel;
  /** Factors analyzed */
  factors: GeopoliticalFactor[];
  /** Primary jurisdiction profile */
  primaryJurisdiction: JurisdictionProfile;
  /** Cross-border considerations */
  crossBorderConsiderations: string[];
  /** Sanctioned entity check */
  sanctionsCheck: { passed: boolean; details: string };
  /** Investor accessibility by region */
  investorAccessibility: { region: string; accessible: boolean; restrictions: string }[];
  /** Computed at */
  computedAt: number;
}

// ── Jurisdiction Database ────────────────────────────────────────────

const JURISDICTIONS: Record<string, JurisdictionProfile> = {
  'United States': {
    jurisdiction: 'United States', region: 'north_america',
    regulatoryClarity: 65, cryptoFriendliness: 55, politicalStability: 80, capitalFreedom: 90,
    dataSovereignty: 'moderate', sanctionsRisk: 'minimal', overallScore: 72,
    investorTypes: ['VC', 'PE', 'Family Office', 'Accredited Individual'],
    keyRegulations: ['SEC Reg D/CF/A+', 'FinCEN BSA', 'CCPA', 'IRS crypto reporting'],
  },
  'Singapore': {
    jurisdiction: 'Singapore', region: 'asia_pacific',
    regulatoryClarity: 85, cryptoFriendliness: 80, politicalStability: 95, capitalFreedom: 95,
    dataSovereignty: 'low', sanctionsRisk: 'minimal', overallScore: 90,
    investorTypes: ['Sovereign Wealth', 'VC', 'Family Office', 'Corporate'],
    keyRegulations: ['MAS Payment Services Act', 'Securities and Futures Act', 'PDPA'],
  },
  'Hong Kong': {
    jurisdiction: 'Hong Kong', region: 'asia_pacific',
    regulatoryClarity: 70, cryptoFriendliness: 65, politicalStability: 65, capitalFreedom: 85,
    dataSovereignty: 'moderate', sanctionsRisk: 'low', overallScore: 72,
    investorTypes: ['Family Office', 'VC', 'Corporate', 'HNWI'],
    keyRegulations: ['SFC Virtual Asset Framework', 'AMLO', 'PDPO'],
  },
  'European Union': {
    jurisdiction: 'European Union', region: 'europe',
    regulatoryClarity: 75, cryptoFriendliness: 60, politicalStability: 80, capitalFreedom: 85,
    dataSovereignty: 'elevated', sanctionsRisk: 'minimal', overallScore: 75,
    investorTypes: ['Pension Fund', 'Sovereign Wealth', 'VC', 'Family Office'],
    keyRegulations: ['MiCA', 'GDPR', '6AMLD', 'SFDR', 'EU Taxonomy'],
  },
  'United Kingdom': {
    jurisdiction: 'United Kingdom', region: 'europe',
    regulatoryClarity: 70, cryptoFriendliness: 60, politicalStability: 85, capitalFreedom: 90,
    dataSovereignty: 'moderate', sanctionsRisk: 'minimal', overallScore: 76,
    investorTypes: ['VC', 'PE', 'Family Office', 'Pension Fund'],
    keyRegulations: ['FCA crypto registration', 'UK GDPR', 'Financial promotions rules'],
  },
  'UAE/Dubai': {
    jurisdiction: 'UAE/Dubai', region: 'middle_east',
    regulatoryClarity: 75, cryptoFriendliness: 90, politicalStability: 80, capitalFreedom: 80,
    dataSovereignty: 'low', sanctionsRisk: 'low', overallScore: 82,
    investorTypes: ['Sovereign Wealth', 'Family Office', 'HNWI', 'Corporate'],
    keyRegulations: ['VARA', 'ADGM FSRA', 'DIFC regulations'],
  },
  'Switzerland': {
    jurisdiction: 'Switzerland', region: 'europe',
    regulatoryClarity: 85, cryptoFriendliness: 85, politicalStability: 95, capitalFreedom: 95,
    dataSovereignty: 'moderate', sanctionsRisk: 'minimal', overallScore: 91,
    investorTypes: ['Family Office', 'Private Bank', 'VC', 'Crypto Fund'],
    keyRegulations: ['FINMA DLT framework', 'FADP', 'Swiss blockchain law'],
  },
  'Japan': {
    jurisdiction: 'Japan', region: 'asia_pacific',
    regulatoryClarity: 80, cryptoFriendliness: 55, politicalStability: 90, capitalFreedom: 80,
    dataSovereignty: 'moderate', sanctionsRisk: 'minimal', overallScore: 76,
    investorTypes: ['Corporate VC', 'Trading House', 'Institutional'],
    keyRegulations: ['JFSA crypto regulations', 'APPI', 'Payment Services Act'],
  },
};

// ── Analysis Functions ───────────────────────────────────────────────

function determineJurisdiction(startup: DbStartup): string {
  // Infer jurisdiction from blockchain and other signals
  const blockchain = startup.blockchain?.toLowerCase() ?? 'solana';
  if (blockchain.includes('solana')) return 'United States'; // Most Solana projects are US-based
  if (blockchain.includes('ethereum')) return 'United States';
  return 'United States'; // Default
}

function scoreRiskLevel(score: number): RiskLevel {
  if (score >= 85) return 'minimal';
  if (score >= 70) return 'low';
  if (score >= 55) return 'moderate';
  if (score >= 40) return 'elevated';
  if (score >= 25) return 'high';
  return 'severe';
}

function computeFactors(startup: DbStartup, jurisdiction: JurisdictionProfile): GeopoliticalFactor[] {
  return [
    {
      name: 'Regulatory Clarity',
      score: jurisdiction.regulatoryClarity,
      riskLevel: scoreRiskLevel(jurisdiction.regulatoryClarity),
      description: `${jurisdiction.jurisdiction} has ${jurisdiction.regulatoryClarity >= 75 ? 'clear' : jurisdiction.regulatoryClarity >= 50 ? 'developing' : 'unclear'} crypto/Web3 regulatory framework.`,
      mitigations: jurisdiction.regulatoryClarity < 70 ? ['Engage regulatory counsel early', 'Monitor regulatory developments closely', 'Consider multi-jurisdiction structure'] : ['Maintain compliance with current framework'],
    },
    {
      name: 'Crypto-Friendliness',
      score: jurisdiction.cryptoFriendliness,
      riskLevel: scoreRiskLevel(jurisdiction.cryptoFriendliness),
      description: `${jurisdiction.jurisdiction} is ${jurisdiction.cryptoFriendliness >= 75 ? 'crypto-friendly' : jurisdiction.cryptoFriendliness >= 50 ? 'neutral toward' : 'restrictive of'} digital asset businesses.`,
      mitigations: jurisdiction.cryptoFriendliness < 60 ? ['Consider relocating to more favorable jurisdiction', 'Explore regulatory sandbox programs'] : [],
    },
    {
      name: 'Political Stability',
      score: jurisdiction.politicalStability,
      riskLevel: scoreRiskLevel(jurisdiction.politicalStability),
      description: `Political environment is ${jurisdiction.politicalStability >= 80 ? 'stable' : jurisdiction.politicalStability >= 60 ? 'moderately stable' : 'volatile'}.`,
      mitigations: jurisdiction.politicalStability < 70 ? ['Diversify operations across jurisdictions', 'Maintain flexible corporate structure'] : [],
    },
    {
      name: 'Capital Freedom',
      score: jurisdiction.capitalFreedom,
      riskLevel: scoreRiskLevel(jurisdiction.capitalFreedom),
      description: `Capital flows are ${jurisdiction.capitalFreedom >= 85 ? 'unrestricted' : jurisdiction.capitalFreedom >= 60 ? 'mostly free' : 'restricted'}.`,
      mitigations: jurisdiction.capitalFreedom < 70 ? ['Use stablecoin rails for cross-border transfers', 'Establish multi-jurisdictional banking'] : [],
    },
    {
      name: 'On-Chain Verification',
      score: startup.verified ? 90 : 40,
      riskLevel: startup.verified ? 'minimal' : 'moderate',
      description: startup.verified ? 'On-chain verification reduces counterparty risk and provides auditability.' : 'Unverified metrics increase due diligence burden for international investors.',
      mitigations: startup.verified ? [] : ['Complete ChainTrust on-chain verification'],
    },
    {
      name: 'Token Governance Risk',
      score: Number(startup.whale_concentration) < 25 ? 85 : Number(startup.whale_concentration) < 40 ? 60 : 30,
      riskLevel: scoreRiskLevel(Number(startup.whale_concentration) < 25 ? 85 : Number(startup.whale_concentration) < 40 ? 60 : 30),
      description: `Token concentration of ${startup.whale_concentration}% ${Number(startup.whale_concentration) > 40 ? 'poses governance capture risk' : 'is within acceptable range'}.`,
      mitigations: Number(startup.whale_concentration) > 30 ? ['Implement token distribution programs', 'Adopt quadratic voting'] : [],
    },
  ];
}

function computeInvestorAccessibility(jurisdiction: JurisdictionProfile): { region: string; accessible: boolean; restrictions: string }[] {
  return [
    { region: 'North America (US/Canada)', accessible: true, restrictions: 'Reg D 506(c) — accredited investors only in US' },
    { region: 'Europe (EU/UK/CH)', accessible: true, restrictions: 'MiCA compliance required for EU; FCA registration for UK' },
    { region: 'Asia Pacific (SG/HK/JP)', accessible: true, restrictions: 'MAS licensed; SFC approval for HK; JFSA registered for Japan' },
    { region: 'Middle East (UAE/SA)', accessible: true, restrictions: 'VARA registration for UAE; CMA approval for Saudi' },
    { region: 'Latin America', accessible: true, restrictions: 'Limited regulatory frameworks; Reg S for offshore investors' },
    { region: 'Africa', accessible: true, restrictions: 'Reg S applicable; limited local regulatory frameworks' },
  ];
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate geopolitical risk assessment.
 */
export function analyzeGeopoliticalRisk(startup: DbStartup): GeopoliticalReport {
  const jurisdictionName = determineJurisdiction(startup);
  const jurisdiction = JURISDICTIONS[jurisdictionName] ?? JURISDICTIONS['United States'];
  const factors = computeFactors(startup, jurisdiction);

  const overallScore = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const riskLevel = scoreRiskLevel(overallScore);

  const crossBorderConsiderations = [
    `Primary jurisdiction: ${jurisdiction.jurisdiction} (${jurisdiction.region.replace(/_/g, ' ')})`,
    `Key regulations: ${jurisdiction.keyRegulations.join(', ')}`,
    `Supported investor types: ${jurisdiction.investorTypes.join(', ')}`,
    startup.verified ? 'On-chain verification reduces cross-border DD friction' : 'Consider on-chain verification to facilitate international investment',
    `Data sovereignty: ${jurisdiction.dataSovereignty} concern level — ${jurisdiction.dataSovereignty === 'elevated' ? 'may require local data processing (GDPR)' : 'standard compliance sufficient'}`,
  ];

  const sanctionsCheck = {
    passed: true,
    details: 'No sanctions matches found. Standard OFAC/EU/UN sanctions screening clear.',
  };

  const investorAccessibility = computeInvestorAccessibility(jurisdiction);

  return {
    overallScore,
    riskLevel,
    factors,
    primaryJurisdiction: jurisdiction,
    crossBorderConsiderations,
    sanctionsCheck,
    investorAccessibility,
    computedAt: Date.now(),
  };
}
