export const inputCls =
  'w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition';

export const labelCls = 'mb-1.5 block text-sm font-medium text-foreground';

export const chartTooltipStyle = {
  borderRadius: 8,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  fontSize: 12,
  padding: '8px 12px',
};

export const categoryColors: Record<string, 'info' | 'primary' | 'warning' | 'success'> = {
  Fintech: 'info',
  SaaS: 'primary',
  DeFi: 'warning',
  Cleantech: 'success',
};

export const CATEGORIES = ['DeFi', 'Fintech', 'SaaS', 'Cleantech', 'Infrastructure'];
export const BLOCKCHAINS = ['Solana'];
