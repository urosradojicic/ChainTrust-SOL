import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Award, Shield, Lock, FileCheck, ExternalLink, Search, Filter,
  ArrowRight, CheckCircle, Clock, Package, Fingerprint, Globe,
  Leaf, BarChart3, Download, Eye, Hash, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ── Mock provenance certificates ── */
const CERTIFICATES = [
  {
    id: 'cert-001',
    product: 'Organic Coffee Batch #2847',
    issuer: 'GreenChain',
    category: 'Agriculture',
    status: 'verified' as const,
    trustScore: 94,
    issuedAt: '2026-03-15T10:30:00Z',
    proofHash: 'sha256:a7f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    solTx: '5KjPnT2xqR7vY8mN3wL6bJ4cH9dF2gS1kQ5pR8tU0vW3xZ6yB',
    origin: 'Colombia, Huila Region',
    carbonOffset: 12.5,
    certType: 'Origin & Sustainability',
    stages: [
      { name: 'Farm Harvest', date: '2026-01-20', verified: true, hash: 'sha256:1a2b...3c4d' },
      { name: 'Processing Mill', date: '2026-01-28', verified: true, hash: 'sha256:5e6f...7g8h' },
      { name: 'Export Customs', date: '2026-02-05', verified: true, hash: 'sha256:9i0j...1k2l' },
      { name: 'Import Verification', date: '2026-02-15', verified: true, hash: 'sha256:3m4n...5o6p' },
      { name: 'Retail Distribution', date: '2026-03-01', verified: true, hash: 'sha256:7q8r...9s0t' },
    ],
  },
  {
    id: 'cert-002',
    product: 'Recycled Aluminum Sheet #R-4092',
    issuer: 'EcoMetal',
    category: 'Manufacturing',
    status: 'verified' as const,
    trustScore: 88,
    issuedAt: '2026-03-10T14:20:00Z',
    proofHash: 'sha256:b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
    solTx: '3zKmN4xqR7vY8mN3wL6bJ4cH9dF2gS1kQ5pR8tU0vW3xZ6yB',
    origin: 'Germany, Ruhr Valley',
    carbonOffset: 34.2,
    certType: 'Circular Economy',
    stages: [
      { name: 'Scrap Collection', date: '2026-01-15', verified: true, hash: 'sha256:aa1b...cc2d' },
      { name: 'Smelting & Purification', date: '2026-02-01', verified: true, hash: 'sha256:ee3f...gg4h' },
      { name: 'Quality Testing', date: '2026-02-20', verified: true, hash: 'sha256:ii5j...kk6l' },
      { name: 'Sheet Rolling', date: '2026-03-05', verified: true, hash: 'sha256:mm7n...oo8p' },
    ],
  },
  {
    id: 'cert-003',
    product: 'Solar Panel Module SP-X200',
    issuer: 'SolBridge',
    category: 'Energy',
    status: 'pending' as const,
    trustScore: 72,
    issuedAt: '2026-04-01T09:00:00Z',
    proofHash: 'sha256:c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
    solTx: '7yBnT2xqR7vY8mN3wL6bJ4cH9dF2gS1kQ5pR8tU0vW3xZ6yB',
    origin: 'Vietnam, Ho Chi Minh City',
    carbonOffset: 0,
    certType: 'Product Identity',
    stages: [
      { name: 'Silicon Wafer Source', date: '2026-02-10', verified: true, hash: 'sha256:pp1q...rr2s' },
      { name: 'Cell Manufacturing', date: '2026-03-01', verified: true, hash: 'sha256:tt3u...vv4w' },
      { name: 'Module Assembly', date: '2026-03-20', verified: true, hash: 'sha256:xx5y...zz6a' },
      { name: 'Quality Certification', date: '2026-04-01', verified: false, hash: '' },
    ],
  },
  {
    id: 'cert-004',
    product: 'Fair Trade Cocoa Lot #FT-7821',
    issuer: 'PayFlow',
    category: 'Agriculture',
    status: 'verified' as const,
    trustScore: 91,
    issuedAt: '2026-02-28T16:45:00Z',
    proofHash: 'sha256:d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
    solTx: '4xRmT2xqR7vY8mN3wL6bJ4cH9dF2gS1kQ5pR8tU0vW3xZ6yB',
    origin: "Ivory Coast, San-Pedro",
    carbonOffset: 8.7,
    certType: 'Origin & Labor Standards',
    stages: [
      { name: 'Cooperative Harvest', date: '2026-01-10', verified: true, hash: 'sha256:bb1c...dd2e' },
      { name: 'Fermentation & Drying', date: '2026-01-25', verified: true, hash: 'sha256:ff3g...hh4i' },
      { name: 'Fair Trade Audit', date: '2026-02-10', verified: true, hash: 'sha256:jj5k...ll6m' },
      { name: 'Export & Shipping', date: '2026-02-20', verified: true, hash: 'sha256:nn7o...pp8q' },
      { name: 'Roaster Delivery', date: '2026-02-28', verified: true, hash: 'sha256:rr9s...tt0u' },
    ],
  },
  {
    id: 'cert-005',
    product: 'Pharmaceutical API Compound #PH-301',
    issuer: 'NovaPay',
    category: 'Healthcare',
    status: 'verified' as const,
    trustScore: 96,
    issuedAt: '2026-03-22T11:15:00Z',
    proofHash: 'sha256:e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
    solTx: '9wFnT2xqR7vY8mN3wL6bJ4cH9dF2gS1kQ5pR8tU0vW3xZ6yB',
    origin: 'Switzerland, Basel',
    carbonOffset: 2.1,
    certType: 'Full Chain of Custody',
    stages: [
      { name: 'Raw Material Sourcing', date: '2026-01-05', verified: true, hash: 'sha256:vv1w...xx2y' },
      { name: 'Synthesis & Purification', date: '2026-02-01', verified: true, hash: 'sha256:zz3a...bb4c' },
      { name: 'GMP Quality Control', date: '2026-02-28', verified: true, hash: 'sha256:dd5e...ff6g' },
      { name: 'Regulatory Submission', date: '2026-03-15', verified: true, hash: 'sha256:hh7i...jj8k' },
      { name: 'Distribution Clearance', date: '2026-03-22', verified: true, hash: 'sha256:ll9m...nn0o' },
    ],
  },
];

const CATEGORIES_FILTER = ['All', 'Agriculture', 'Manufacturing', 'Energy', 'Healthcare'];

const CERT_TYPE_COLORS: Record<string, string> = {
  'Origin & Sustainability': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Circular Economy': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Product Identity': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Origin & Labor Standards': 'bg-primary/10 text-primary border-primary/20',
  'Full Chain of Custody': 'bg-primary/10 text-primary border-primary/20',
};

function CertificateCard({ cert, index }: { cert: typeof CERTIFICATES[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const completedStages = cert.stages.filter(s => s.verified).length;
  const totalStages = cert.stages.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${CERT_TYPE_COLORS[cert.certType] || 'bg-muted text-muted-foreground'}`}>
                {cert.certType}
              </span>
              <span className="text-[10px] text-muted-foreground">{cert.category}</span>
            </div>
            <h3 className="mt-2 font-bold text-foreground">{cert.product}</h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>Issued by <strong className="text-foreground">{cert.issuer}</strong></span>
              <span>{cert.origin}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            {cert.status === 'verified' ? (
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle className="h-3 w-3" /> Verified
              </div>
            ) : (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
                <Clock className="h-3 w-3" /> Pending
              </div>
            )}
            <div className="mt-1 text-xl font-bold font-mono text-primary">{cert.trustScore}</div>
            <div className="text-[10px] text-muted-foreground">Trust Score</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Supply chain verification</span>
            <span className="text-xs font-mono text-primary">{completedStages}/{totalStages}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completedStages / totalStages) * 100}%` }} />
          </div>
        </div>

        {/* Quick info */}
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="font-mono">{cert.proofHash.slice(0, 20)}...</span>
          </div>
          {cert.carbonOffset > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Leaf className="h-3 w-3" />
              <span>{cert.carbonOffset}t CO2 offset</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-primary"
          >
            <Eye className="h-3 w-3" />
            {expanded ? 'Hide' : 'View'} Proof Chain
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-primary">
            <ExternalLink className="h-3 w-3" /> Solana Explorer
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground hover:border-primary">
            <Download className="h-3 w-3" /> Export PDF
          </button>
        </div>
      </div>

      {/* Expanded proof chain */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-5 bg-muted/20">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Proof Chain — {totalStages} Stages</h4>
              <div className="space-y-0">
                {cert.stages.map((stage, i) => (
                  <div key={i} className="flex gap-3 py-2.5 border-b border-border last:border-0">
                    <div className="relative flex flex-col items-center">
                      <div className={`h-3 w-3 rounded-full mt-1 ${stage.verified ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                      {i < cert.stages.length - 1 && <div className="flex-1 w-px bg-border mt-1" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stage.name}</span>
                        <span className="text-xs font-mono text-muted-foreground">{stage.date}</span>
                      </div>
                      {stage.verified ? (
                        <div className="flex items-center gap-2 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          <span className="text-[11px] font-mono text-emerald-400">{stage.hash}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span className="text-[11px] text-amber-400">Awaiting verification</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Provenance() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = CERTIFICATES.filter(c => {
    if (category !== 'All' && c.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.product.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q) || c.origin.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Provenance Certificates</h1>
            <p className="text-xs text-muted-foreground font-mono">RWA-tokenized supply chain verification on Solana</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mt-2">
          Every product gets a tokenized provenance certificate on Solana — an immutable, verifiable record of its
          entire supply chain journey. From raw materials to retail shelf, every stage is cryptographically attested.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { icon: Award, label: 'Certificates Issued', value: '2,847', change: '+342 this month' },
          { icon: Shield, label: 'Verified', value: '2,491', change: '87.5% verification rate' },
          { icon: Package, label: 'Products Tracked', value: '14,200', change: 'Across 5 categories' },
          { icon: Leaf, label: 'CO2 Offset Verified', value: '1,240t', change: 'Via provenance chain' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <s.icon className="h-4 w-4" /> {s.label}
            </div>
            <div className="mt-1 text-2xl font-bold font-display tabular-nums">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{s.change}</div>
          </motion.div>
        ))}
      </div>

      {/* RWA explainer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-4">
          <Fingerprint className="h-6 w-6 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground">Real-World Asset Tokenization</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Each provenance certificate is a tokenized RWA on Solana — connecting to the <strong className="text-foreground">$9.4 trillion</strong> tokenization
              market. BlackRock's BUIDL fund ($500M+ on Solana) proved institutional demand. These certificates can be used for
              trade finance, insurance underwriting, and compliance verification across borders.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">EU Digital Product Passport</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">Trade Finance Collateral</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">Insurance Underwriting</span>
              <span className="rounded border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">Cross-Border Compliance</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, issuers, origins..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES_FILTER.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} certificate{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Certificate list */}
      <div className="space-y-4 mb-8">
        {filtered.map((cert, i) => (
          <CertificateCard key={cert.id} cert={cert} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No certificates match your search.</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 mb-8">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> How Provenance Certificates Work
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: '01', title: 'Register Product', desc: 'Create a digital identity with unique hash on Solana. Cost: $0.00025.' },
            { step: '02', title: 'Track Supply Chain', desc: 'Each stage (harvest, processing, shipping) adds a verified checkpoint.' },
            { step: '03', title: 'Oracle Attestation', desc: 'Independent oracles verify real-world data at each checkpoint.' },
            { step: '04', title: 'Issue Certificate', desc: 'Tokenized RWA certificate minted — immutable, transferable, verifiable.' },
          ].map((item, i) => (
            <div key={item.step} className="rounded-lg bg-muted/30 p-4">
              <span className="text-xs font-mono text-primary">{item.step}</span>
              <h4 className="font-bold text-sm mt-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-xl border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Issue provenance certificates for your products</h3>
          <p className="text-sm text-muted-foreground">Register your supply chain and start issuing verifiable certificates on Solana.</p>
        </div>
        <Link to="/register" className="flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-90 shrink-0">
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
