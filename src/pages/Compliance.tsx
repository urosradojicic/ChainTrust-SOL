import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck, Globe, Shield, CheckCircle, Clock, AlertTriangle,
  Download, ExternalLink, ChevronDown, ChevronUp, Package,
  Scan, Recycle, Factory, Truck, ShieldCheck, FileText,
  Scale, Fingerprint, MapPin, Leaf, BarChart3,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

/* ── EU Digital Product Passport categories ── */
const DPP_CATEGORIES = [
  {
    id: 'identity',
    title: 'Product Identity & Traceability',
    icon: Fingerprint,
    description: 'Unique digital identity for each product in the supply chain',
    regulation: 'EU Regulation 2024/1781 — Ecodesign for Sustainable Products',
    deadline: 'January 2026 (Active)',
    items: [
      { label: 'Unique Product Identifier (UID)', status: 'active', detail: 'SHA-256 hash stored on Solana — immutable, timestamped, verifiable' },
      { label: 'Manufacturer Identification', status: 'active', detail: 'On-chain startup registry with KYC-verified founder data' },
      { label: 'Product Category Classification', status: 'active', detail: 'ISO-standard category taxonomy integrated in registration flow' },
      { label: 'Geographic Origin Tracking', status: 'active', detail: 'Supply chain node geolocation stored in metrics proof chain' },
      { label: 'Bill of Materials (BOM) Hash', status: 'active', detail: 'Component-level BOM hashed and committed to Solana ledger' },
      { label: 'Batch/Lot Serialization', status: 'in-progress', detail: 'Batch-level tracking via PDA sub-accounts — Q2 2026 rollout' },
    ],
  },
  {
    id: 'sustainability',
    title: 'Sustainability & Environmental Data',
    icon: Leaf,
    description: 'Carbon footprint, recyclability, and environmental impact metrics',
    regulation: 'EU Green Deal — Carbon Border Adjustment Mechanism (CBAM)',
    deadline: 'Phased 2026-2028',
    items: [
      { label: 'Carbon Footprint per Product', status: 'active', detail: 'CO2e tonnes tracked per startup, published on-chain monthly' },
      { label: 'Energy Source Disclosure', status: 'active', detail: 'Energy source type (renewable %) captured in sustainability score' },
      { label: 'Recyclability Score', status: 'active', detail: 'Sustainability scoring engine: energy 25% + carbon 25% + tokenomics 25% + governance 25%' },
      { label: 'Hazardous Substance Declaration', status: 'planned', detail: 'REACH/RoHS substance registry integration planned Q3 2026' },
      { label: 'Circular Economy Indicators', status: 'in-progress', detail: 'Waste reduction and reuse metrics added to proof chain schema' },
      { label: 'Water Usage Metrics', status: 'planned', detail: 'Water footprint tracking in next sustainability module update' },
    ],
  },
  {
    id: 'compliance',
    title: 'Regulatory Compliance',
    icon: Scale,
    description: 'MiCA, GDPR, KYC/AML, and cross-border regulatory alignment',
    regulation: 'MiCA (Markets in Crypto-Assets) — Full enforcement 2026',
    deadline: 'July 1, 2026 (CASP deadline)',
    items: [
      { label: 'MiCA CASP Authorization', status: 'in-progress', detail: 'Application submitted — EUR 150K capital reserve allocated' },
      { label: 'Travel Rule Compliance', status: 'active', detail: 'Sender/receiver metadata attached to all on-chain transfers' },
      { label: 'KYC/AML Verification', status: 'active', detail: 'Sumsub integration for startup founder identity verification' },
      { label: 'GDPR Data Protection', status: 'active', detail: 'EU data residency, right to erasure (off-chain only), consent management' },
      { label: 'Anti-Money Laundering Screening', status: 'active', detail: 'Transaction monitoring with configurable risk thresholds' },
      { label: 'Cross-Border Reporting', status: 'planned', detail: 'Multi-jurisdiction tax reporting framework in development' },
    ],
  },
  {
    id: 'verification',
    title: 'Verification & Audit Trail',
    icon: ShieldCheck,
    description: 'Cryptographic proof chains, oracle attestation, and audit records',
    regulation: 'ISO 27001 / SOC 2 Type II — Industry standard',
    deadline: 'SOC 2 expected Q2 2026',
    items: [
      { label: 'SHA-256 Metric Hashing', status: 'active', detail: 'Every metric set hashed before on-chain submission — tamper-evident' },
      { label: 'Independent Oracle Verification', status: 'in-progress', detail: 'Pyth Network integration for real-time price/data attestation' },
      { label: 'Soulbound Verification Badges', status: 'active', detail: 'Non-transferable NFT badges issued to verified startups on Solana' },
      { label: 'Immutable Audit Trail', status: 'active', detail: 'All state changes logged to Supabase + Solana — dual-layer audit' },
      { label: 'Third-Party Audit Reports', status: 'active', detail: '3 independent audits (OtterSec, Sec3, CertiK) — zero critical findings' },
      { label: 'Real-Time Anomaly Detection', status: 'planned', detail: 'ML-based anomaly flagging for suspicious metric submissions' },
    ],
  },
  {
    id: 'supply-chain',
    title: 'Supply Chain Transparency',
    icon: Truck,
    description: 'End-to-end supply chain visibility from source to consumer',
    regulation: 'EU Supply Chain Due Diligence Directive (CSDDD)',
    deadline: '2026-2028 phased implementation',
    items: [
      { label: 'Supplier Registry', status: 'active', detail: 'On-chain startup registry with verified supply chain participants' },
      { label: 'Provenance Certification', status: 'active', detail: 'Proof chain visualizer traces full verification history per product' },
      { label: 'Multi-Tier Visibility', status: 'in-progress', detail: 'Sub-supplier tracking via nested PDA accounts on Solana' },
      { label: 'Conflict Mineral Tracking', status: 'planned', detail: 'Dodd-Frank 1502 / EU Conflict Minerals Regulation compliance' },
      { label: 'Labor Standards Verification', status: 'planned', detail: 'ILO core convention compliance attestation framework' },
      { label: 'Real-Time Shipment Tracking', status: 'planned', detail: 'IoT sensor data integration for live supply chain monitoring' },
    ],
  },
];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  'in-progress': { label: 'In Progress', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
  planned: { label: 'Planned', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: AlertTriangle },
};

function ComplianceScore() {
  const allItems = DPP_CATEGORIES.flatMap(c => c.items);
  const active = allItems.filter(i => i.status === 'active').length;
  const inProgress = allItems.filter(i => i.status === 'in-progress').length;
  const planned = allItems.filter(i => i.status === 'planned').length;
  const total = allItems.length;
  const score = Math.round(((active + inProgress * 0.5) / total) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Compliance Readiness Score</h2>
        <span className="text-3xl font-display font-bold text-primary tabular-nums">{score}%</span>
      </div>
      <Progress value={score} className="h-3 mb-4 [&>div]:bg-primary" />
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400 tabular-nums">{active}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-center">
          <div className="text-2xl font-bold text-amber-400 tabular-nums">{inProgress}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-center">
          <div className="text-2xl font-bold text-blue-400 tabular-nums">{planned}</div>
          <div className="text-xs text-muted-foreground">Planned</div>
        </div>
      </div>
    </motion.div>
  );
}

function RegulationTimeline() {
  const milestones = [
    { date: 'Jan 2026', title: 'EU Digital Product Passport', desc: 'Regulation active — product traceability mandated', status: 'active' as const },
    { date: 'Mar 2026', title: 'MiCA Phase 2 Enforcement', desc: 'Full enforcement for crypto-asset service providers', status: 'active' as const },
    { date: 'Jul 2026', title: 'CASP Authorization Deadline', desc: 'All CASPs must be authorized or cease operations', status: 'in-progress' as const },
    { date: 'Q3 2026', title: 'SOC 2 Type II Certification', desc: 'Independent audit of security controls', status: 'in-progress' as const },
    { date: 'Q4 2026', title: 'ISO 27001 Certification', desc: 'Information security management system', status: 'planned' as const },
    { date: '2027', title: 'CSDDD Full Compliance', desc: 'EU supply chain due diligence directive', status: 'planned' as const },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" /> Regulatory Timeline
      </h2>
      <div className="space-y-0">
        {milestones.map((m, i) => {
          const cfg = STATUS_CONFIG[m.status];
          return (
            <div key={i} className="flex gap-4 py-3 border-b border-border last:border-0">
              <div className="w-20 shrink-0">
                <span className="text-xs font-mono text-muted-foreground">{m.date}</span>
              </div>
              <div className="relative">
                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${m.status === 'active' ? 'bg-emerald-400' : m.status === 'in-progress' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                {i < milestones.length - 1 && <div className="absolute top-4 left-[4.5px] w-px h-[calc(100%+4px)] bg-border" />}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{m.title}</h4>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function CategorySection({ category, index }: { category: typeof DPP_CATEGORIES[0]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const active = category.items.filter(i => i.status === 'active').length;
  const total = category.items.length;
  const pct = Math.round((active / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left transition hover:bg-muted/30"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <category.icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-foreground">{category.title}</h3>
            <span className="text-xs font-mono text-primary tabular-nums">{active}/{total}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{category.regulation}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-20">
            <Progress value={pct} className="h-2 [&>div]:bg-primary" />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-8">{pct}%</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border">
          <div className="p-5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">{category.description}</span>
              <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto shrink-0">Deadline: {category.deadline}</span>
            </div>
            <div className="space-y-2">
              {category.items.map((item, i) => {
                const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${item.status === 'active' ? 'text-emerald-400' : item.status === 'in-progress' ? 'text-amber-400' : 'text-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Compliance() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">EU Digital Product Passport</h1>
            <p className="text-xs text-muted-foreground font-mono">Regulation (EU) 2024/1781 — Ecodesign for Sustainable Products</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-3xl mt-2">
          ChainTrust is built for the EU Digital Product Passport mandate. Every product in your supply chain gets a verifiable digital identity on Solana — traceability, sustainability data, and compliance records, all cryptographically secured and audit-ready.
        </p>
      </motion.div>

      {/* Key regulation callout */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-4">
          <Globe className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground">Why This Matters</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The EU Digital Product Passport regulation took effect <strong className="text-foreground">January 2026</strong>.
              All products sold in the EU must have verifiable digital provenance records. MiCA enforcement for
              crypto-asset service providers has a hard deadline of <strong className="text-foreground">July 1, 2026</strong>.
              Non-compliance means fines up to <strong className="text-foreground">EUR 5.6M or 10% of annual turnover</strong>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">EU Ecodesign Regulation</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">MiCA Framework</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">CSDDD</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">CBAM</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">GDPR</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score + Timeline */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <ComplianceScore />
        <RegulationTimeline />
      </div>

      {/* DPP Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Compliance Modules
        </h2>
        <div className="space-y-4">
          {DPP_CATEGORIES.map((cat, i) => (
            <CategorySection key={cat.id} category={cat} index={i} />
          ))}
        </div>
      </div>

      {/* Solana advantage callout */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Why Solana for Compliance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { stat: '$0.00025', label: 'Per verification', detail: 'Makes per-product compliance economically viable at scale' },
            { stat: '400ms', label: 'Finality', detail: 'Real-time compliance checks at point of sale or customs' },
            { stat: '65,000', label: 'TPS capacity', detail: 'Handle millions of product passports without congestion' },
            { stat: '100%', label: 'Immutable', detail: 'Once recorded, compliance data cannot be altered or deleted' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-lg bg-muted/30 p-4">
              <div className="text-xl font-display font-bold text-primary tabular-nums">{s.stat}</div>
              <div className="text-xs font-medium text-foreground mt-0.5">{s.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{s.detail}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
