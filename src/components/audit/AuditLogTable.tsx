import { ExternalLink, History, CheckCircle2, Loader2 } from 'lucide-react';
import type { DbAuditEntry } from '@/types/database';
import { useAuditLog } from '@/hooks/use-startups';
import { explorerTxUrl } from '@/lib/solana-config';

interface AuditLogTableProps {
  entries: DbAuditEntry[];
  showStatus?: boolean;
}

export function AuditLogTable({ entries, showStatus = false }: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        <History className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>No on-chain changes recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Field</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Old</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">New</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tx Hash</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              {showStatus && (
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20 transition">
                <td className="px-4 py-3 font-medium capitalize">{e.field_changed.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">{e.old_value || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs max-w-[120px] truncate">{e.new_value || '—'}</td>
                <td className="px-4 py-3">
                  <a
                    href={explorerTxUrl(e.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    {e.tx_hash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(e.changed_at).toLocaleDateString()}
                </td>
                {showStatus && (
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AuditTrailTab({ startupId }: { startupId: string }) {
  const { data: entries = [], isLoading } = useAuditLog(startupId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return <AuditLogTable entries={entries} />;
}
