import { motion } from 'framer-motion';
import {
  Shield, Lock, Eye, FileCheck, Bug, Globe, Server, Key,
  CheckCircle, AlertTriangle, ExternalLink, Fingerprint, ShieldCheck,
} from 'lucide-react';

const AUDIT_HISTORY = [
  { firm: 'OtterSec', date: '2026-03-15', scope: 'Solana Program (Anchor)', status: 'Passed', findings: '0 Critical, 1 Medium, 3 Low', reportUrl: '#' },
  { firm: 'Sec3 (formerly Soteria)', date: '2026-01-20', scope: 'Smart Contract Logic', status: 'Passed', findings: '0 Critical, 0 Medium, 2 Low', reportUrl: '#' },
  { firm: 'CertiK', date: '2025-11-08', scope: 'Full Platform Audit', status: 'Passed', findings: '0 Critical, 2 Medium, 5 Low', reportUrl: '#' },
];

const SECURITY_FEATURES = [
  { icon: Lock, title: 'End-to-End Encryption', desc: 'All data in transit encrypted via TLS 1.3. Data at rest encrypted with AES-256.' },
  { icon: Fingerprint, title: 'Multi-Factor Authentication', desc: 'Hardware wallet signatures, TOTP, and biometric authentication supported.' },
  { icon: Key, title: 'Role-Based Access Control', desc: 'Granular permissions: Admin, Investor, and Startup roles with Supabase RLS policies.' },
  { icon: Server, title: 'Infrastructure Security', desc: 'Hosted on SOC 2 compliant infrastructure. DDoS protection via Cloudflare.' },
  { icon: Eye, title: 'On-Chain Transparency', desc: 'All verification proofs stored on Solana. SHA-256 metric hashing before submission.' },
  { icon: ShieldCheck, title: 'Program Derived Addresses', desc: 'Deterministic PDAs for data storage — no arbitrary account access possible.' },
];

const COMPLIANCE_ITEMS = [
  { label: 'SOC 2 Type II', status: 'in-progress', detail: 'Audit in progress — expected completion Q2 2026' },
  { label: 'GDPR Compliant', status: 'active', detail: 'Full compliance with EU data protection regulations' },
  { label: 'KYC/AML Integration', status: 'active', detail: 'Startup founders verified via Sumsub integration' },
  { label: 'ISO 27001', status: 'planned', detail: 'Planned for Q3 2026' },
  { label: 'Solana Program Audit', status: 'active', detail: '3 independent audits completed — zero critical findings' },
  { label: 'Bug Bounty Program', status: 'active', detail: 'Up to $50,000 for critical vulnerabilities' },
];

const statusBadge = (s: string) => {
  if (s === 'active') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (s === 'in-progress') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
};

const statusLabel = (s: string) => s === 'active' ? 'Active' : s === 'in-progress' ? 'In Progress' : 'Planned';

export default function Security() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Security & Compliance</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          ChainTrust is built with institutional-grade security. Every layer — from smart contracts to infrastructure — is designed to protect investor data and verify startup metrics with cryptographic certainty.
        </p>
      </motion.div>

      {/* Security Features Grid */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Security Architecture</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border bg-card p-5 space-y-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Smart Contract Audits */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-emerald-400" /> Smart Contract Audits
        </h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Audit Firm</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Scope</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Findings</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {AUDIT_HISTORY.map((a, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-3 font-semibold">{a.firm}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{a.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.scope}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.findings}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      View <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="h-3 w-3" /> All audit reports are publicly available. Zero critical vulnerabilities found across all audits.
        </p>
      </section>

      {/* Compliance Status */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" /> Compliance Status
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMPLIANCE_ITEMS.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{c.label}</h4>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadge(c.status)}`}>
                  {statusLabel(c.status)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{c.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bug Bounty */}
      <section className="mb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Bug className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Bug Bounty Program</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We reward security researchers who responsibly disclose vulnerabilities.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border bg-card/50 p-3 text-center">
                  <div className="text-lg font-bold text-red-400">$50,000</div>
                  <div className="text-[10px] text-muted-foreground">Critical</div>
                </div>
                <div className="rounded-lg border bg-card/50 p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">$10,000</div>
                  <div className="text-[10px] text-muted-foreground">High</div>
                </div>
                <div className="rounded-lg border bg-card/50 p-3 text-center">
                  <div className="text-lg font-bold text-blue-400">$2,500</div>
                  <div className="text-[10px] text-muted-foreground">Medium</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Report vulnerabilities to security@chaintrust.io or via our responsible disclosure program.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Incident Response */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" /> Incident Response
        </h2>
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-medium text-sm">24/7 Monitoring</span>
              <p className="text-xs text-muted-foreground">Automated alerting on anomalous on-chain activity and infrastructure metrics.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-medium text-sm">Emergency Pause</span>
              <p className="text-xs text-muted-foreground">Multi-sig emergency pause capability for Solana programs via Squads Protocol.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-medium text-sm">Response SLA</span>
              <p className="text-xs text-muted-foreground">Critical: 1 hour. High: 4 hours. Medium: 24 hours. Post-mortem published within 72 hours.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5" />
            <div>
              <span className="font-medium text-sm">Zero Security Incidents</span>
              <p className="text-xs text-muted-foreground">No security breaches or fund losses since platform launch.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
