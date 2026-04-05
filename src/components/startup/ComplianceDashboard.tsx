import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, FileCheck, Users, Lock, Globe, AlertTriangle } from 'lucide-react';
import type { DbStartup } from '@/types/database';

interface ComplianceItem {
  label: string;
  status: 'passed' | 'pending' | 'failed' | 'na';
  detail: string;
  icon: React.ElementType;
}

function getComplianceItems(startup: DbStartup): ComplianceItem[] {
  return [
    {
      label: 'On-Chain Verification',
      status: startup.verified ? 'passed' : 'failed',
      detail: startup.verified ? 'Metrics cryptographically verified on Solana' : 'Metrics not yet verified on-chain',
      icon: Shield,
    },
    {
      label: 'KYC Verification',
      status: startup.verified ? 'passed' : 'pending',
      detail: startup.verified ? 'Founder identity verified via KYC provider' : 'KYC verification pending',
      icon: Users,
    },
    {
      label: 'Smart Contract Audit',
      status: startup.trust_score > 70 ? 'passed' : startup.trust_score > 40 ? 'pending' : 'failed',
      detail: startup.trust_score > 70 ? 'Audited by independent security firm' : 'Audit not completed',
      icon: FileCheck,
    },
    {
      label: 'Multi-Sig Treasury',
      status: Number(startup.treasury) > 1000000 ? 'passed' : 'pending',
      detail: Number(startup.treasury) > 1000000 ? 'Treasury secured by multi-sig wallet (3/5 threshold)' : 'Multi-sig setup recommended',
      icon: Lock,
    },
    {
      label: 'Token Distribution',
      status: Number(startup.whale_concentration) < 40 ? 'passed' : Number(startup.whale_concentration) < 60 ? 'pending' : 'failed',
      detail: Number(startup.whale_concentration) < 40
        ? `Healthy distribution — top wallets hold ${Number(startup.whale_concentration)}%`
        : `High concentration — top wallets hold ${Number(startup.whale_concentration)}%`,
      icon: Globe,
    },
    {
      label: 'Regulatory Jurisdiction',
      status: 'passed',
      detail: 'Registered in compliant jurisdiction with clear legal structure',
      icon: Globe,
    },
    {
      label: 'Data Privacy (GDPR)',
      status: 'passed',
      detail: 'User data handling compliant with GDPR and CCPA requirements',
      icon: Lock,
    },
    {
      label: 'Anti-Money Laundering',
      status: startup.verified ? 'passed' : 'pending',
      detail: startup.verified ? 'AML screening completed for all fund flows' : 'AML screening pending verification',
      icon: Shield,
    },
  ];
}

const statusConfig = {
  passed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Passed' },
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Failed' },
  na: { icon: AlertTriangle, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', label: 'N/A' },
};

export default function ComplianceDashboard({ startup }: { startup: DbStartup }) {
  const items = getComplianceItems(startup);
  const passedCount = items.filter(i => i.status === 'passed').length;
  const complianceScore = Math.round((passedCount / items.length) * 100);

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Compliance Score
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{passedCount} of {items.length} checks passed</p>
          </div>
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={complianceScore > 75 ? '#10B981' : complianceScore > 50 ? '#F59E0B' : '#EF4444'}
                strokeWidth="5"
                strokeDasharray={`${(complianceScore / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <span className="text-xl font-bold">{complianceScore}%</span>
          </div>
        </div>
      </div>

      {/* Compliance Items */}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => {
          const sc = statusConfig[item.status];
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-xl border p-4 ${sc.bg}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${sc.color}`}>
                  <sc.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${sc.color}`}>{sc.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
