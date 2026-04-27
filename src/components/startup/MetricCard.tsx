import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import DataProvenance, { type ProvenanceType } from '@/components/common/DataProvenance';

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  bg: string;
  provenance?: ProvenanceType;
}

export default function MetricCard({ label, value, icon: Icon, provenance }: MetricCardProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs">{label}</span>
        </div>
        {provenance && <DataProvenance type={provenance} compact />}
      </div>
      <div className="mt-1.5 text-lg font-bold font-mono tabular-nums">{value}</div>
    </motion.div>
  );
}
