import { Shield, AlertTriangle, Database, Link as LinkIcon, type LucideIcon } from 'lucide-react';

export type ProvenanceType = 'on-chain' | 'self-reported' | 'computed' | 'oracle';

// LucideIcon (not React.ElementType) lets TS infer that <c.icon className="..." />
// is a valid props pass-through. With React.ElementType the inferred prop type
// collapses to `never` because the union includes intrinsic string elements.
const config: Record<ProvenanceType, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  'on-chain': { icon: Shield, label: 'On-Chain Verified', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'self-reported': { icon: AlertTriangle, label: 'Self-Reported', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'computed': { icon: Database, label: 'Computed', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'oracle': { icon: LinkIcon, label: 'Oracle Verified', color: 'text-primary', bg: 'bg-primary/10' },
};

interface DataProvenanceProps {
  type: ProvenanceType;
  compact?: boolean;
}

export default function DataProvenance({ type, compact }: DataProvenanceProps) {
  const c = config[type];
  if (compact) {
    return (
      <span title={c.label} className={`inline-flex items-center gap-0.5 ${c.color}`}>
        <c.icon className="h-2.5 w-2.5" />
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${c.bg} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${c.color}`}>
      <c.icon className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}
