import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  bg: string;
}

export default function MetricCard({ label, value, icon: Icon, bg }: MetricCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-4 ${bg}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1.5 text-lg font-bold font-mono">{value}</div>
    </motion.div>
  );
}
