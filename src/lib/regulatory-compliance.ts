/**
 * Regulatory Compliance Engine
 * ────────────────────────────
 * Multi-jurisdiction securities compliance for startup investments.
 * Tracks requirements across US, EU, UK, Singapore, UAE.
 *
 * Covers: Reg D, Reg CF, Reg A+, Reg S, MiCA, FCA, MAS, VARA
 * Plus: KYC/AML requirements, accredited investor verification,
 * and cross-border investment rules.
 */

// ── Types ────────────────────────────────────────────────────────────

export type Jurisdiction = 'us' | 'eu' | 'uk' | 'singapore' | 'uae' | 'global';
export type RegulationType = 'securities' | 'kyc_aml' | 'data_protection' | 'tax' | 'token_specific';
export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable' | 'pending_review';

export interface RegulatoryRequirement {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  type: RegulationType;
  /** Regulation reference (e.g., "SEC Rule 506(c)") */
  reference: string;
  description: string;
  /** What's required to comply */
  requirements: string[];
  /** Current compliance status */
  status: ComplianceStatus;
  /** Risk level if non-compliant */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Deadline (if any) */
  deadline: string | null;
  /** Actions needed to achieve compliance */
  actions: string[];
  /** Estimated cost to comply (USD) */
  estimatedCost: number;
  /** Estimated time to comply (days) */
  estimatedDays: number;
}

export interface InvestmentExemption {
  name: string;
  jurisdiction: Jurisdiction;
  reference: string;
  /** Maximum raise amount */
  maxRaise: number | null;
  /** Investor types allowed */
  investorTypes: ('accredited' | 'non_accredited' | 'institutional' | 'qualified')[];
  /** General solicitation allowed? */
  generalSolicitation: boolean;
  /** Reporting requirements */
  reportingRequirements: string[];
  /** Key restrictions */
  restrictions: string[];
  /** Recommended for ChainTrust? */
  recommended: boolean;
  /** Why recommended/not */
  rationale: string;
}

export interface ComplianceReport {
  /** Overall compliance score (0-100) */
  complianceScore: number;
  /** Grade */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** All requirements */
  requirements: RegulatoryRequirement[];
  /** Requirement counts by status */
  statusCounts: Record<ComplianceStatus, number>;
  /** Available investment exemptions */
  exemptions: InvestmentExemption[];
  /** Recommended exemption */
  recommendedExemption: InvestmentExemption | null;
  /** Critical compliance gaps */
  criticalGaps: string[];
  /** Estimated total cost to full compliance */
  totalComplianceCost: number;
  /** Estimated total time to full compliance */
  totalComplianceDays: number;
  /** Jurisdictions covered */
  jurisdictionsCovered: Jurisdiction[];
  /** Computed at */
  computedAt: number;
}

// ── Exemption Registry ───────────────────────────────────────────────

export const INVESTMENT_EXEMPTIONS: InvestmentExemption[] = [
  {
    name: 'Reg D 506(b)',
    jurisdiction: 'us',
    reference: 'Securities Act Rule 506(b)',
    maxRaise: null, // Unlimited
    investorTypes: ['accredited', 'non_accredited'],
    generalSolicitation: false,
    reportingRequirements: ['Form D filing within 15 days', 'Blue Sky filings per state'],
    restrictions: ['Up to 35 non-accredited investors', 'No general solicitation', 'Must have pre-existing relationship'],
    recommended: false,
    rationale: 'No general solicitation limits distribution on ChainTrust platform.',
  },
  {
    name: 'Reg D 506(c)',
    jurisdiction: 'us',
    reference: 'Securities Act Rule 506(c)',
    maxRaise: null,
    investorTypes: ['accredited'],
    generalSolicitation: true,
    reportingRequirements: ['Form D filing', 'Accredited investor verification required'],
    restrictions: ['Accredited investors ONLY', 'Must verify accredited status (not self-certification)'],
    recommended: true,
    rationale: 'General solicitation allowed + unlimited raise. Best fit for ChainTrust platform. Requires accredited verification.',
  },
  {
    name: 'Reg CF (Crowdfunding)',
    jurisdiction: 'us',
    reference: 'Securities Act Regulation Crowdfunding',
    maxRaise: 5000000,
    investorTypes: ['accredited', 'non_accredited'],
    generalSolicitation: true,
    reportingRequirements: ['Annual report (Form C-AR)', 'SAR filing', 'Financial statements'],
    restrictions: ['$5M max per 12 months', 'Investment limits for non-accredited', 'Must use registered platform'],
    recommended: false,
    rationale: '$5M cap limits growth-stage startups. Good for community rounds.',
  },
  {
    name: 'Reg A+ (Tier 2)',
    jurisdiction: 'us',
    reference: 'Securities Act Regulation A+ Tier 2',
    maxRaise: 75000000,
    investorTypes: ['accredited', 'non_accredited'],
    generalSolicitation: true,
    reportingRequirements: ['SEC qualification required', 'Audited financials', 'Semi-annual reports', 'Annual reports'],
    restrictions: ['$75M max per year', 'SEC qualification process (3-6 months)', 'Ongoing reporting'],
    recommended: false,
    rationale: 'High compliance cost but allows non-accredited investors up to $75M.',
  },
  {
    name: 'Reg S',
    jurisdiction: 'global',
    reference: 'Securities Act Regulation S',
    maxRaise: null,
    investorTypes: ['accredited', 'non_accredited', 'institutional'],
    generalSolicitation: true,
    reportingRequirements: ['Compliance with local securities laws'],
    restrictions: ['Non-US persons only', 'No directed selling efforts in US', 'Distribution compliance period'],
    recommended: true,
    rationale: 'Enables non-US investors to participate alongside Reg D 506(c) for US investors.',
  },
  {
    name: 'MiCA (EU)',
    jurisdiction: 'eu',
    reference: 'Markets in Crypto-Assets Regulation',
    maxRaise: null,
    investorTypes: ['accredited', 'non_accredited', 'institutional'],
    generalSolicitation: true,
    reportingRequirements: ['White paper publication', 'Registration with national authority', 'Ongoing disclosure'],
    restrictions: ['White paper requirements', 'Consumer protection rules', 'Reserve requirements for stablecoins'],
    recommended: true,
    rationale: 'EU-wide framework for crypto assets. Harmonized regulation across 27 member states.',
  },
  {
    name: 'VARA (UAE/Dubai)',
    jurisdiction: 'uae',
    reference: 'Virtual Assets Regulatory Authority',
    maxRaise: null,
    investorTypes: ['accredited', 'institutional', 'qualified'],
    generalSolicitation: true,
    reportingRequirements: ['VARA registration', 'AML compliance', 'Regular reporting'],
    restrictions: ['Must register with VARA', 'Minimum capital requirements', 'Fit and proper assessments'],
    recommended: true,
    rationale: 'Progressive crypto regulation. Dubai is a hub for Web3 companies.',
  },
];

// ── Requirement Templates ────────────────────────────────────────────

function generateUSRequirements(): RegulatoryRequirement[] {
  return [
    {
      id: 'us-kyc', name: 'KYC/AML Compliance', jurisdiction: 'us', type: 'kyc_aml',
      reference: 'Bank Secrecy Act / FinCEN',
      description: 'Know Your Customer and Anti-Money Laundering compliance for all investors.',
      requirements: ['Government ID verification', 'Address verification', 'Sanctions screening (OFAC)', 'PEP screening'],
      status: 'pending_review', riskLevel: 'critical', deadline: null,
      actions: ['Integrate KYC provider (Persona, Jumio, Sumsub)', 'Implement sanctions screening', 'Create AML policy document'],
      estimatedCost: 5000, estimatedDays: 30,
    },
    {
      id: 'us-accredited', name: 'Accredited Investor Verification', jurisdiction: 'us', type: 'securities',
      reference: 'SEC Rule 506(c)',
      description: 'Verify accredited investor status for all US investors under Reg D 506(c).',
      requirements: ['Income verification ($200K+/$300K+ joint)', 'Net worth verification ($1M+ excluding primary residence)', 'Professional certification (Series 7, 65, 82)'],
      status: 'non_compliant', riskLevel: 'critical', deadline: null,
      actions: ['Integrate accredited verification service', 'Create verification workflow', 'Store verification certificates'],
      estimatedCost: 3000, estimatedDays: 14,
    },
    {
      id: 'us-form-d', name: 'Form D Filing', jurisdiction: 'us', type: 'securities',
      reference: 'SEC Regulation D',
      description: 'File Form D with SEC within 15 days of first sale of securities.',
      requirements: ['Form D submission via SEC EDGAR', 'Blue Sky filings in each state where securities are sold'],
      status: 'not_applicable', riskLevel: 'medium', deadline: null,
      actions: ['Prepare Form D', 'File via EDGAR', 'Complete state-level Blue Sky filings'],
      estimatedCost: 2000, estimatedDays: 7,
    },
    {
      id: 'us-data', name: 'Data Protection (CCPA)', jurisdiction: 'us', type: 'data_protection',
      reference: 'California Consumer Privacy Act',
      description: 'Comply with CCPA for California resident investors.',
      requirements: ['Privacy policy disclosure', 'Right to access personal data', 'Right to deletion', 'Do not sell personal information'],
      status: 'partial', riskLevel: 'medium', deadline: null,
      actions: ['Update privacy policy for CCPA', 'Implement data subject request workflow'],
      estimatedCost: 1000, estimatedDays: 10,
    },
  ];
}

function generateEURequirements(): RegulatoryRequirement[] {
  return [
    {
      id: 'eu-mica', name: 'MiCA Compliance', jurisdiction: 'eu', type: 'token_specific',
      reference: 'Regulation (EU) 2023/1114',
      description: 'Markets in Crypto-Assets Regulation compliance for token-based investments.',
      requirements: ['White paper publication', 'National authority registration', 'Consumer protection measures', 'Market abuse prevention'],
      status: 'pending_review', riskLevel: 'high', deadline: '2025-12-30',
      actions: ['Prepare MiCA-compliant white paper', 'Register with national competent authority', 'Implement market surveillance'],
      estimatedCost: 15000, estimatedDays: 90,
    },
    {
      id: 'eu-gdpr', name: 'GDPR Compliance', jurisdiction: 'eu', type: 'data_protection',
      reference: 'Regulation (EU) 2016/679',
      description: 'General Data Protection Regulation for EU investor data.',
      requirements: ['Data processing agreements', 'Privacy impact assessment', 'DPO appointment (if applicable)', 'Data breach notification (72h)', 'Right to erasure'],
      status: 'partial', riskLevel: 'high', deadline: null,
      actions: ['Complete DPIA', 'Update DPAs with sub-processors', 'Implement breach notification procedure'],
      estimatedCost: 8000, estimatedDays: 45,
    },
    {
      id: 'eu-aml', name: 'EU AML Directive (6AMLD)', jurisdiction: 'eu', type: 'kyc_aml',
      reference: '6th Anti-Money Laundering Directive',
      description: 'EU anti-money laundering compliance for crypto-asset service providers.',
      requirements: ['Customer due diligence', 'Enhanced due diligence for high-risk', 'Suspicious activity reporting', 'Record keeping (5 years)'],
      status: 'pending_review', riskLevel: 'critical', deadline: null,
      actions: ['Implement EU CDD procedures', 'Create SAR filing workflow', 'Train staff on AML'],
      estimatedCost: 10000, estimatedDays: 60,
    },
  ];
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate comprehensive regulatory compliance report.
 */
export function generateComplianceReport(
  targetJurisdictions: Jurisdiction[] = ['us', 'eu'],
): ComplianceReport {
  let requirements: RegulatoryRequirement[] = [];

  if (targetJurisdictions.includes('us')) requirements.push(...generateUSRequirements());
  if (targetJurisdictions.includes('eu')) requirements.push(...generateEURequirements());

  // Status counts
  const statusCounts: Record<ComplianceStatus, number> = {
    compliant: 0, partial: 0, non_compliant: 0, not_applicable: 0, pending_review: 0,
  };
  for (const r of requirements) statusCounts[r.status]++;

  // Available exemptions
  const exemptions = INVESTMENT_EXEMPTIONS.filter(e =>
    targetJurisdictions.includes(e.jurisdiction) || e.jurisdiction === 'global'
  );
  const recommendedExemption = exemptions.find(e => e.recommended) ?? null;

  // Critical gaps
  const criticalGaps = requirements
    .filter(r => r.riskLevel === 'critical' && r.status !== 'compliant')
    .map(r => `${r.name} (${r.reference})`);

  // Total cost and time
  const nonCompliant = requirements.filter(r => r.status !== 'compliant' && r.status !== 'not_applicable');
  const totalCost = nonCompliant.reduce((s, r) => s + r.estimatedCost, 0);
  const totalDays = Math.max(...nonCompliant.map(r => r.estimatedDays), 0);

  // Score
  const totalReqs = requirements.filter(r => r.status !== 'not_applicable').length;
  const compliantCount = statusCounts.compliant + statusCounts.partial * 0.5;
  const score = totalReqs > 0 ? Math.round((compliantCount / totalReqs) * 100) : 100;
  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';

  return {
    complianceScore: score,
    grade,
    requirements,
    statusCounts,
    exemptions,
    recommendedExemption,
    criticalGaps,
    totalComplianceCost: totalCost,
    totalComplianceDays: totalDays,
    jurisdictionsCovered: targetJurisdictions,
    computedAt: Date.now(),
  };
}
