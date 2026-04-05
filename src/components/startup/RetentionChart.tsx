import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTooltipStyle } from '@/lib/constants';
import type { DbMetricsHistory } from '@/types/database';

interface RetentionChartProps {
  metrics: DbMetricsHistory[];
  currentUsers: number;
}

export default function RetentionChart({ metrics, currentUsers }: RetentionChartProps) {
  if (metrics.length < 2) return null;

  const data = metrics.slice(-6).map((m, i, arr) => {
    const prev = i > 0 ? arr[i - 1].mau : arr[0].mau;
    const retained = prev > 0 ? Math.min(100, (m.mau / prev) * 100) : 100;
    const newUsers = Math.max(0, m.mau - Math.round(prev * (retained / 100)));
    return {
      month: m.month,
      retention: Math.round(retained),
      mau: m.mau,
      newUsers,
    };
  });

  const avgRetention = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.retention, 0) / data.length)
    : 0;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground">User Retention</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Avg retention:</span>
          <span className={`text-sm font-bold font-mono ${avgRetention >= 90 ? 'text-accent' : avgRetention >= 70 ? 'text-amber-400' : 'text-destructive'}`}>
            {avgRetention}%
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#534AB7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#534AB7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} domain={[0, 120]} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(v: number, name: string) => [
              name === 'retention' ? `${v}%` : v.toLocaleString(),
              name === 'retention' ? 'Retention' : 'MAU',
            ]}
          />
          <Area type="monotone" dataKey="retention" stroke="#534AB7" strokeWidth={2.5} fill="url(#retGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
