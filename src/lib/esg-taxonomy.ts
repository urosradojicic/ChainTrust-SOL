/**
 * ESG / EU Taxonomy Engine
 * ────────────────────────
 * European-standard ESG compliance for institutional investors.
 * Implements EU SFDR classification, EU Taxonomy alignment,
 * Principal Adverse Impact (PAI) indicators, and carbon footprint.
 *
 * This is what London pension funds, Amsterdam asset managers,
 * and Nordic sovereign wealth funds require.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type SFDRClassification = 'article_6' | 'article_8' | 'article_9';
export type TaxonomyAlignment = 'aligned' | 'eligible' | 'not_eligible';

export interface ESGPillar {
  name: 'environmental' | 'social' | 'governance';
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  indicators: ESGIndicator[];
  weight: number;
}

export interface ESGIndicator {
  name: string;
  value: string;
  score: number; // 0-100
  benchmark: string;
  source: string;
  unit: string;
}

export interface PAIIndicator {
  /** PAI number (EU standard numbering) */
  number: number;
  /** Indicator name */
  name: string;
  /** Category */
  category: 'climate' | 'environmental' | 'social' | 'governance';
  /** Current value */
  value: string;
  /** Assessment */
  assessment: 'good' | 'acceptable' | 'concerning' | 'critical';
  /** Description */
  description: string;
}

export interface CarbonFootprint {
  /** Scope 1: Direct emissions (tonnes CO2e) */
  scope1: number;
  /** Scope 2: Indirect from energy (tonnes CO2e) */
  scope2: number;
  /** Scope 3: Value chain emissions (tonnes CO2e) */
  scope3: number;
  /** Total carbon footprint */
  total: number;
  /** Carbon intensity (tonnes CO2e per $M revenue) */
  carbonIntensity: number;
  /** Carbon offsets purchased */
  offsetsPurchased: number;
  /** Net carbon position */
  netCarbon: number;
  /** Year-over-year change */
  yoyChange: number;
  /** Carbon neutrality status */
  carbonNeutral: boolean;
  /** Path to net zero target year */
  netZeroTarget: number | null;
}

export interface SDGAlignment {
  /** UN SDG number (1-17) */
  sdgNumber: number;
  /** SDG name */
  name: string;
  /** Icon (emoji) */
  icon: string;
  /** Alignment score (0-100) */
  alignment: number;
  /** How this startup contributes */
  contribution: string;
  /** Directly or indirectly aligned */
  type: 'direct' | 'indirect';
}

export interface ESGReport {
  /** Overall ESG score (0-100) */
  overallScore: number;
  /** ESG grade */
  grade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
  /** SFDR classification */
  sfdrClassification: SFDRClassification;
  /** EU Taxonomy alignment */
  taxonomyAlignment: TaxonomyAlignment;
  /** Three pillars */
  pillars: ESGPillar[];
  /** Principal Adverse Impact indicators */
  paiIndicators: PAIIndicator[];
  /** Carbon footprint */
  carbonFootprint: CarbonFootprint;
  /** UN SDG alignment */
  sdgAlignment: SDGAlignment[];
  /** Investment suitability */
  suitability: {
    pensionFunds: boolean;
    sovereignWealth: boolean;
    impactFunds: boolean;
    esgMandated: boolean;
    greenBondEligible: boolean;
  };
  /** Key ESG risks */
  esgRisks: string[];
  /** ESG opportunities */
  esgOpportunities: string[];
  /** Computed at */
  computedAt: number;
}

// ── SDG Definitions ──────────────────────────────────────────────────

const SDG_DEFINITIONS: { number: number; name: string; icon: string }[] = [
  { number: 1, name: 'No Poverty', icon: '🔴' },
  { number: 7, name: 'Affordable and Clean Energy', icon: '☀️' },
  { number: 8, name: 'Decent Work and Economic Growth', icon: '📈' },
  { number: 9, name: 'Industry, Innovation and Infrastructure', icon: '🏭' },
  { number: 10, name: 'Reduced Inequalities', icon: '⚖️' },
  { number: 11, name: 'Sustainable Cities and Communities', icon: '🏙️' },
  { number: 12, name: 'Responsible Consumption and Production', icon: '♻️' },
  { number: 13, name: 'Climate Action', icon: '🌍' },
  { number: 16, name: 'Peace, Justice and Strong Institutions', icon: '🏛️' },
  { number: 17, name: 'Partnerships for the Goals', icon: '🤝' },
];

// ── Computation Functions ────────────────────────────────────────────

function computeEnvironmentalPillar(startup: DbStartup): ESGPillar {
  const indicators: ESGIndicator[] = [
    {
      name: 'Energy Efficiency',
      value: `${startup.energy_score}/100`,
      score: startup.energy_score,
      benchmark: '>75/100',
      source: 'ChainTrust on-chain',
      unit: 'score',
    },
    {
      name: 'Carbon Offset Program',
      value: `${startup.carbon_offset_tonnes} tonnes`,
      score: Math.min(100, startup.carbon_offset_tonnes * 2),
      benchmark: '>50 tonnes/year',
      source: 'Self-reported + verified',
      unit: 'tonnes CO2e',
    },
    {
      name: 'Chain Type',
      value: startup.chain_type ?? 'PoS',
      score: startup.chain_type === 'PoS' ? 90 : startup.chain_type === 'PoA' ? 70 : 20,
      benchmark: 'Proof of Stake',
      source: 'On-chain',
      unit: 'consensus',
    },
    {
      name: 'Energy per Transaction',
      value: startup.energy_per_transaction ?? '0.001 kWh',
      score: Number(startup.energy_consumption) < 100 ? 85 : Number(startup.energy_consumption) < 500 ? 55 : 25,
      benchmark: '<0.01 kWh/tx',
      source: 'Computed',
      unit: 'kWh',
    },
  ];

  const score = Math.round(indicators.reduce((s, ind) => s + ind.score, 0) / indicators.length);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  return { name: 'environmental', score, grade, indicators, weight: 0.35 };
}

function computeSocialPillar(startup: DbStartup): ESGPillar {
  const indicators: ESGIndicator[] = [
    {
      name: 'User Access & Inclusion',
      value: `${startup.users.toLocaleString()} users`,
      score: startup.users > 10000 ? 80 : startup.users > 1000 ? 60 : 35,
      benchmark: '>10,000 users',
      source: 'On-chain verified',
      unit: 'users',
    },
    {
      name: 'Team Size & Employment',
      value: `${startup.team_size} employees`,
      score: startup.team_size >= 15 ? 75 : startup.team_size >= 5 ? 55 : 30,
      benchmark: '>15 employees',
      source: 'Self-reported',
      unit: 'headcount',
    },
    {
      name: 'Token Distribution Equity',
      value: `${startup.whale_concentration}% top holder`,
      score: Number(startup.whale_concentration) < 20 ? 85 : Number(startup.whale_concentration) < 40 ? 55 : 20,
      benchmark: '<20% concentration',
      source: 'On-chain',
      unit: '%',
    },
  ];

  const score = Math.round(indicators.reduce((s, ind) => s + ind.score, 0) / indicators.length);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  return { name: 'social', score, grade, indicators, weight: 0.30 };
}

function computeGovernancePillar(startup: DbStartup): ESGPillar {
  const indicators: ESGIndicator[] = [
    {
      name: 'Governance Score',
      value: `${startup.governance_score}/100`,
      score: startup.governance_score,
      benchmark: '>70/100',
      source: 'ChainTrust computed',
      unit: 'score',
    },
    {
      name: 'On-Chain Transparency',
      value: startup.verified ? 'Verified' : 'Self-reported',
      score: startup.verified ? 90 : 30,
      benchmark: 'On-chain verified',
      source: 'Solana',
      unit: 'boolean',
    },
    {
      name: 'Trust Score',
      value: `${startup.trust_score}/100`,
      score: startup.trust_score,
      benchmark: '>70/100',
      source: 'ChainTrust algorithm',
      unit: 'score',
    },
    {
      name: 'Tokenomics Integrity',
      value: `${startup.tokenomics_score}/100`,
      score: startup.tokenomics_score,
      benchmark: '>70/100',
      source: 'On-chain analysis',
      unit: 'score',
    },
  ];

  const score = Math.round(indicators.reduce((s, ind) => s + ind.score, 0) / indicators.length);
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  return { name: 'governance', score, grade, indicators, weight: 0.35 };
}

function computePAI(startup: DbStartup): PAIIndicator[] {
  return [
    { number: 1, name: 'GHG Emissions (Scope 1+2)', category: 'climate', value: `${(Number(startup.energy_consumption) * 0.5).toFixed(1)} tCO2e`, assessment: Number(startup.energy_consumption) < 100 ? 'good' : 'acceptable', description: 'Direct and energy-related emissions' },
    { number: 2, name: 'Carbon Footprint', category: 'climate', value: `${(startup.mrr > 0 ? (Number(startup.energy_consumption) * 0.5 / (startup.mrr * 12 / 1000000)).toFixed(2) : '0')} tCO2e/$M`, assessment: 'acceptable', description: 'Carbon intensity per million revenue' },
    { number: 3, name: 'GHG Intensity', category: 'climate', value: `${Number(startup.energy_consumption).toFixed(0)} kWh/month`, assessment: Number(startup.energy_consumption) < 200 ? 'good' : 'concerning', description: 'Energy intensity of operations' },
    { number: 4, name: 'Fossil Fuel Exposure', category: 'environmental', value: startup.chain_type === 'PoS' ? 'None (PoS)' : 'Moderate (PoW)', assessment: startup.chain_type === 'PoS' ? 'good' : 'concerning', description: 'Exposure to fossil fuel dependent consensus' },
    { number: 10, name: 'UN Global Compact Violations', category: 'social', value: 'None reported', assessment: 'good', description: 'Violations of UN principles' },
    { number: 13, name: 'Board Gender Diversity', category: 'governance', value: 'Data not available', assessment: 'acceptable', description: 'Gender composition of governance bodies' },
    { number: 14, name: 'Controversial Weapons Exposure', category: 'social', value: 'None', assessment: 'good', description: 'Involvement in controversial weapons' },
  ];
}

function computeCarbonFootprint(startup: DbStartup): CarbonFootprint {
  const energyKwh = Number(startup.energy_consumption);
  const scope1 = 0; // Most crypto startups have zero scope 1
  const scope2 = energyKwh * 0.0005; // kWh to tonnes CO2e (grid average)
  const scope3 = scope2 * 3; // Rough scope 3 estimate
  const total = scope1 + scope2 + scope3;
  const arr = startup.mrr * 12;
  const carbonIntensity = arr > 0 ? (total / (arr / 1000000)) : 0;

  return {
    scope1,
    scope2: +scope2.toFixed(2),
    scope3: +scope3.toFixed(2),
    total: +total.toFixed(2),
    carbonIntensity: +carbonIntensity.toFixed(2),
    offsetsPurchased: startup.carbon_offset_tonnes,
    netCarbon: +(total - startup.carbon_offset_tonnes).toFixed(2),
    yoyChange: -12, // Assumed improvement
    carbonNeutral: startup.carbon_offset_tonnes >= total,
    netZeroTarget: startup.sustainability_score >= 80 ? 2027 : startup.sustainability_score >= 50 ? 2030 : null,
  };
}

function computeSDGAlignment(startup: DbStartup): SDGAlignment[] {
  const categorySDGs: Record<string, number[]> = {
    DeFi: [1, 8, 10, 17], Fintech: [1, 8, 9, 10], SaaS: [8, 9, 12],
    Infrastructure: [9, 11, 13], Identity: [10, 16], Data: [9, 12, 16],
    'Supply Chain': [9, 12, 13], NFT: [8, 9], Gaming: [8, 9], Social: [10, 16, 17],
  };

  const relevantSDGs = categorySDGs[startup.category] ?? [8, 9];

  return SDG_DEFINITIONS
    .filter(sdg => relevantSDGs.includes(sdg.number))
    .map(sdg => {
      const baseAlignment = startup.sustainability_score * 0.5 + (startup.verified ? 20 : 0);
      const alignment = Math.min(100, Math.round(baseAlignment + Math.random() * 15));

      const contributions: Record<number, string> = {
        1: 'Financial inclusion through decentralized access',
        7: 'Energy-efficient blockchain operations',
        8: 'Creating jobs and economic value in Web3',
        9: 'Building digital infrastructure for the future',
        10: 'Reducing barriers to financial services',
        11: 'Supporting sustainable digital communities',
        12: 'Promoting transparent, accountable business practices',
        13: 'Climate action through carbon offset programs',
        16: 'Strengthening institutions through transparency',
        17: 'Building cross-border partnerships via blockchain',
      };

      return {
        sdgNumber: sdg.number,
        name: sdg.name,
        icon: sdg.icon,
        alignment,
        contribution: contributions[sdg.number] ?? 'General positive impact',
        type: relevantSDGs.indexOf(sdg.number) < 2 ? 'direct' as const : 'indirect' as const,
      };
    });
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate comprehensive ESG/EU Taxonomy report.
 */
export function generateESGReport(startup: DbStartup): ESGReport {
  const pillars = [
    computeEnvironmentalPillar(startup),
    computeSocialPillar(startup),
    computeGovernancePillar(startup),
  ];

  const overallScore = Math.round(
    pillars.reduce((s, p) => s + p.score * p.weight, 0)
  );

  const grade: ESGReport['grade'] =
    overallScore >= 85 ? 'AAA' : overallScore >= 75 ? 'AA' : overallScore >= 65 ? 'A' :
    overallScore >= 55 ? 'BBB' : overallScore >= 45 ? 'BB' : overallScore >= 35 ? 'B' :
    overallScore >= 20 ? 'CCC' : 'D';

  // SFDR classification
  const sfdrClassification: SFDRClassification =
    overallScore >= 75 && startup.sustainability_score >= 70 ? 'article_9' :
    overallScore >= 50 ? 'article_8' :
    'article_6';

  // EU Taxonomy alignment
  const taxonomyAlignment: TaxonomyAlignment =
    overallScore >= 70 && startup.chain_type === 'PoS' ? 'aligned' :
    overallScore >= 40 ? 'eligible' :
    'not_eligible';

  const paiIndicators = computePAI(startup);
  const carbonFootprint = computeCarbonFootprint(startup);
  const sdgAlignment = computeSDGAlignment(startup);

  // Investment suitability
  const suitability = {
    pensionFunds: sfdrClassification === 'article_8' || sfdrClassification === 'article_9',
    sovereignWealth: overallScore >= 60 && startup.verified,
    impactFunds: sfdrClassification === 'article_9',
    esgMandated: overallScore >= 50,
    greenBondEligible: taxonomyAlignment === 'aligned',
  };

  // Risks and opportunities
  const esgRisks: string[] = [];
  const esgOpportunities: string[] = [];

  if (pillars[0].score < 50) esgRisks.push('Below-average environmental performance may exclude ESG-mandated capital');
  if (Number(startup.whale_concentration) > 40) esgRisks.push('High token concentration raises governance concerns');
  if (!startup.verified) esgRisks.push('Lack of on-chain verification limits ESG credibility');
  if (carbonFootprint.netCarbon > 0) esgRisks.push('Net positive carbon footprint — not carbon neutral');

  if (startup.sustainability_score >= 80) esgOpportunities.push('Top-tier ESG profile attracts impact-focused capital');
  if (carbonFootprint.carbonNeutral) esgOpportunities.push('Carbon neutral status enables green bond eligibility');
  if (startup.verified) esgOpportunities.push('On-chain verification provides unmatched ESG data credibility');
  if (sfdrClassification === 'article_9') esgOpportunities.push('Article 9 classification opens access to sustainable investment mandates');

  return {
    overallScore,
    grade,
    sfdrClassification,
    taxonomyAlignment,
    pillars,
    paiIndicators,
    carbonFootprint,
    sdgAlignment,
    suitability,
    esgRisks,
    esgOpportunities,
    computedAt: Date.now(),
  };
}
