export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatCMT(baseUnits: bigint | number): string {
  const val = typeof baseUnits === 'bigint' ? Number(baseUnits) / 1e6 : baseUnits;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M CMT`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K CMT`;
  return `${val.toFixed(2)} CMT`;
}

export function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
