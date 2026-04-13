/**
 * APAC Regulatory Mapper
 * ──────────────────────
 * Maps regulatory requirements across Asia-Pacific jurisdictions.
 * What Hong Kong family offices, Singapore VCs, and Japanese corporates need.
 *
 * Jurisdictions: Hong Kong (SFC), Singapore (MAS), Japan (JFSA),
 * Australia (ASIC), South Korea (FSC), India (SEBI/RBI)
 */

// ── Types ────────────────────────────────────────────────────────────

export type APACJurisdiction = 'hong_kong' | 'singapore' | 'japan' | 'australia' | 'south_korea' | 'india';

export interface APACRegulator {
  jurisdiction: APACJurisdiction;
  name: string;
  fullName: string;
  regulator: string;
  cryptoStance: 'progressive' | 'neutral' | 'restrictive' | 'evolving';
  keyFramework: string;
  licensingRequired: boolean;
  retailAccess: boolean;
  institutionalAccess: boolean;
  stablecoinRegulation: 'regulated' | 'under_review' | 'unregulated';
  defiRegulation: 'clear' | 'evolving' | 'unclear' | 'restricted';
  taxTreatment: string;
  keyRequirements: string[];
  recentDevelopments: string[];
  investorProtection: 'strong' | 'moderate' | 'weak';
  complianceCost: { setup: number; annual: number };
  timeToLicense: string;
  suitableFor: string[];
}

export interface CrossBorderMatrix {
  from: APACJurisdiction;
  to: APACJurisdiction;
  feasibility: 'easy' | 'moderate' | 'complex' | 'restricted';
  requirements: string[];
  estimatedCost: number;
  timelineWeeks: number;
}

export interface APACReport {
  /** All jurisdiction profiles */
  jurisdictions: APACRegulator[];
  /** Recommended jurisdiction for the startup */
  recommended: APACJurisdiction;
  /** Recommendation rationale */
  rationale: string;
  /** Cross-border investment matrix */
  crossBorderMatrix: CrossBorderMatrix[];
  /** Regional trends */
  trends: string[];
  /** Key risks by jurisdiction */
  jurisdictionRisks: { jurisdiction: APACJurisdiction; risks: string[] }[];
  /** Computed at */
  computedAt: number;
}

// ── Jurisdiction Database ────────────────────────────────────────────

const JURISDICTIONS: APACRegulator[] = [
  {
    jurisdiction: 'hong_kong',
    name: 'Hong Kong',
    fullName: 'Hong Kong Special Administrative Region',
    regulator: 'Securities and Futures Commission (SFC)',
    cryptoStance: 'progressive',
    keyFramework: 'Virtual Asset Trading Platform (VATP) Licensing Regime',
    licensingRequired: true,
    retailAccess: true,
    institutionalAccess: true,
    stablecoinRegulation: 'under_review',
    defiRegulation: 'evolving',
    taxTreatment: 'No capital gains tax on crypto (for most investors)',
    keyRequirements: [
      'SFC Type 1 or Type 9 license for VA services',
      'VATP license for exchanges',
      'AML/CTF compliance (AMLO)',
      'Fit and proper assessment for key personnel',
      'Insurance requirements (hot wallet coverage)',
      'Minimum liquid capital requirements',
    ],
    recentDevelopments: [
      'VATP licensing regime fully operational since June 2023',
      'Retail access to licensed VA trading platforms approved',
      'Stablecoin regulatory framework under consultation',
      'Web3 development hub initiative by government',
    ],
    investorProtection: 'strong',
    complianceCost: { setup: 500000, annual: 200000 },
    timeToLicense: '6-12 months',
    suitableFor: ['Crypto Funds', 'Family Offices', 'Trading Platforms', 'Asset Managers'],
  },
  {
    jurisdiction: 'singapore',
    name: 'Singapore',
    fullName: 'Republic of Singapore',
    regulator: 'Monetary Authority of Singapore (MAS)',
    cryptoStance: 'progressive',
    keyFramework: 'Payment Services Act (PSA) 2019 / Securities and Futures Act (SFA)',
    licensingRequired: true,
    retailAccess: true,
    institutionalAccess: true,
    stablecoinRegulation: 'regulated',
    defiRegulation: 'evolving',
    taxTreatment: 'No capital gains tax; income tax on trading as business',
    keyRequirements: [
      'MAS Digital Payment Token (DPT) license',
      'Capital Market Services (CMS) license for securities tokens',
      'AML/CFT compliance',
      'Technology risk management guidelines (TRM)',
      'Business continuity management',
      'Minimum base capital requirements',
    ],
    recentDevelopments: [
      'Stablecoin regulatory framework finalized (2023)',
      'Project Guardian exploring institutional DeFi',
      'Enhanced retail investor protection measures',
      'Green finance taxonomy includes crypto sustainability',
    ],
    investorProtection: 'strong',
    complianceCost: { setup: 300000, annual: 150000 },
    timeToLicense: '6-9 months',
    suitableFor: ['VC Funds', 'Token Issuers', 'Payment Services', 'Institutional Platforms'],
  },
  {
    jurisdiction: 'japan',
    name: 'Japan',
    fullName: 'Japan',
    regulator: 'Japan Financial Services Agency (JFSA)',
    cryptoStance: 'neutral',
    keyFramework: 'Payment Services Act (PSA) / Financial Instruments and Exchange Act (FIEA)',
    licensingRequired: true,
    retailAccess: true,
    institutionalAccess: true,
    stablecoinRegulation: 'regulated',
    defiRegulation: 'evolving',
    taxTreatment: 'Crypto gains taxed as miscellaneous income (up to 55%)',
    keyRequirements: [
      'Crypto-Asset Exchange Service Provider (CAESP) registration',
      'JFSA pre-registration for new token listings',
      'Strict AML/CFT compliance (FATF compliant)',
      'Cold wallet segregation requirements',
      'Annual audits',
      'Minimum capital requirements (¥10M+)',
    ],
    recentDevelopments: [
      'Web3 strategy paper by government (2024)',
      'Relaxation of token listing requirements',
      'Corporate crypto tax reform (unrealized gains exemption)',
      'Stablecoin framework implemented (2023)',
    ],
    investorProtection: 'strong',
    complianceCost: { setup: 400000, annual: 180000 },
    timeToLicense: '9-18 months',
    suitableFor: ['Exchanges', 'Corporate VCs', 'Token Projects', 'Gaming/NFT'],
  },
  {
    jurisdiction: 'australia',
    name: 'Australia',
    fullName: 'Commonwealth of Australia',
    regulator: 'Australian Securities and Investments Commission (ASIC)',
    cryptoStance: 'evolving',
    keyFramework: 'Corporations Act / Token Mapping Framework (proposed)',
    licensingRequired: true,
    retailAccess: true,
    institutionalAccess: true,
    stablecoinRegulation: 'under_review',
    defiRegulation: 'unclear',
    taxTreatment: 'Capital gains tax applies; CGT discount for >12 month holdings',
    keyRequirements: [
      'AFS license (if token is a financial product)',
      'AML/CTF compliance with AUSTRAC',
      'Consumer protection obligations',
      'Dispute resolution membership',
      'Compensation arrangements',
    ],
    recentDevelopments: [
      'Token mapping consultation completed',
      'ASIC crypto regulatory guidance updated',
      'Digital asset platform licensing regime proposed',
      'CBDCs pilot (eAUD) ongoing',
    ],
    investorProtection: 'strong',
    complianceCost: { setup: 250000, annual: 120000 },
    timeToLicense: '6-12 months',
    suitableFor: ['DeFi Platforms', 'Investment Funds', 'Payment Services'],
  },
  {
    jurisdiction: 'south_korea',
    name: 'South Korea',
    fullName: 'Republic of Korea',
    regulator: 'Financial Services Commission (FSC)',
    cryptoStance: 'evolving',
    keyFramework: 'Virtual Asset User Protection Act (2024)',
    licensingRequired: true,
    retailAccess: true,
    institutionalAccess: true,
    stablecoinRegulation: 'under_review',
    defiRegulation: 'unclear',
    taxTreatment: '20% tax on crypto gains above ₩50M (delayed to 2025)',
    keyRequirements: [
      'VASP registration with FSC',
      'Real-name account verification (partnership with bank)',
      'ISMS-P certification',
      'AML/CFT compliance',
      'User asset segregation',
      'Insurance/reserve requirements',
    ],
    recentDevelopments: [
      'Virtual Asset User Protection Act effective July 2024',
      'Institutional investment in crypto being explored',
      'Travel rule enforcement strengthened',
      'STO (Security Token Offering) framework under development',
    ],
    investorProtection: 'strong',
    complianceCost: { setup: 350000, annual: 160000 },
    timeToLicense: '6-12 months',
    suitableFor: ['Exchanges', 'Gaming/Metaverse', 'NFT Platforms'],
  },
  {
    jurisdiction: 'india',
    name: 'India',
    fullName: 'Republic of India',
    regulator: 'Securities and Exchange Board of India (SEBI) / Reserve Bank of India (RBI)',
    cryptoStance: 'restrictive',
    keyFramework: 'Virtual Digital Assets taxation (2022) / Comprehensive framework pending',
    licensingRequired: false,
    retailAccess: true,
    institutionalAccess: false,
    stablecoinRegulation: 'unregulated',
    defiRegulation: 'unclear',
    taxTreatment: '30% flat tax on crypto gains + 1% TDS on transfers',
    keyRequirements: [
      'FIU registration for VDAs',
      'AML compliance',
      '30% tax + 1% TDS reporting',
      'No loss offset against other income',
      'GST may apply to services',
    ],
    recentDevelopments: [
      'FIU registration requirement enforced (2024)',
      'Offshore exchanges blocked for non-compliance',
      'Comprehensive crypto regulation still pending',
      'G20 crypto framework discussions led by India',
    ],
    investorProtection: 'moderate',
    complianceCost: { setup: 100000, annual: 50000 },
    timeToLicense: '3-6 months (FIU only)',
    suitableFor: ['Tech Startups', 'B2B Platforms'],
  },
];

// ── Cross-Border Matrix ──────────────────────────────────────────────

function generateCrossBorderMatrix(): CrossBorderMatrix[] {
  const matrix: CrossBorderMatrix[] = [];
  const jurisdictions: APACJurisdiction[] = ['hong_kong', 'singapore', 'japan', 'australia', 'south_korea', 'india'];

  for (const from of jurisdictions) {
    for (const to of jurisdictions) {
      if (from === to) continue;

      let feasibility: CrossBorderMatrix['feasibility'] = 'moderate';
      let cost = 50000;
      let weeks = 12;
      const requirements: string[] = ['Legal opinion on cross-border applicability', 'AML/KYC harmonization'];

      if ((from === 'singapore' && to === 'hong_kong') || (from === 'hong_kong' && to === 'singapore')) {
        feasibility = 'easy';
        cost = 30000;
        weeks = 8;
        requirements.push('Mutual recognition of licensing standards');
      } else if (from === 'india' || to === 'india') {
        feasibility = 'complex';
        cost = 100000;
        weeks = 24;
        requirements.push('RBI approval for cross-border crypto transactions', 'FEMA compliance');
      } else if (from === 'japan' || to === 'japan') {
        feasibility = 'moderate';
        cost = 75000;
        weeks = 16;
        requirements.push('JFSA pre-approval for token distribution');
      }

      matrix.push({ from, to, feasibility, requirements, estimatedCost: cost, timelineWeeks: weeks });
    }
  }

  return matrix;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate APAC regulatory landscape report.
 */
export function analyzeAPACRegulatory(
  preferredJurisdictions?: APACJurisdiction[],
): APACReport {
  const jurisdictions = preferredJurisdictions
    ? JURISDICTIONS.filter(j => preferredJurisdictions.includes(j.jurisdiction))
    : JURISDICTIONS;

  // Recommend based on crypto-friendliness and compliance cost
  const ranked = [...jurisdictions].sort((a, b) => {
    const scoreA = (a.cryptoStance === 'progressive' ? 3 : a.cryptoStance === 'neutral' ? 2 : 1) * 2 - a.complianceCost.setup / 100000;
    const scoreB = (b.cryptoStance === 'progressive' ? 3 : b.cryptoStance === 'neutral' ? 2 : 1) * 2 - b.complianceCost.setup / 100000;
    return scoreB - scoreA;
  });

  const recommended = ranked[0]?.jurisdiction ?? 'singapore';
  const rationale = `${ranked[0]?.name} recommended due to ${ranked[0]?.cryptoStance} regulatory stance, ${ranked[0]?.investorProtection} investor protection, and comprehensive licensing framework (${ranked[0]?.keyFramework}).`;

  const crossBorderMatrix = generateCrossBorderMatrix();

  const trends = [
    'APAC is emerging as the global hub for regulated crypto activity',
    'Singapore and Hong Kong are in a regulatory "race to the top"',
    'Japan is gradually opening up with corporate tax reforms',
    'Stablecoin regulation is becoming standardized across the region',
    'Cross-border regulatory cooperation increasing (IOSCO, FATF alignment)',
    'Institutional participation expanding in SG, HK, and JP markets',
  ];

  const jurisdictionRisks = jurisdictions.map(j => ({
    jurisdiction: j.jurisdiction,
    risks: j.cryptoStance === 'restrictive'
      ? ['Regulatory uncertainty', 'Potential for sudden policy changes', 'Limited institutional access']
      : j.cryptoStance === 'evolving'
      ? ['Framework still developing', 'Compliance requirements may change', 'Transition period uncertainty']
      : ['Increasing compliance costs', 'Potential for more restrictive rules in future'],
  }));

  return {
    jurisdictions,
    recommended,
    rationale,
    crossBorderMatrix,
    trends,
    jurisdictionRisks,
    computedAt: Date.now(),
  };
}
