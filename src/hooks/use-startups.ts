import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_STARTUPS, DEMO_METRICS, DEMO_PROPOSALS } from '@/lib/demo-data';
import { logDataError } from '@/lib/error-handler';
import type { DbStartup, DbMetricsHistory, DbPledge, DbAuditEntry, DbProposal, DbVote, DbFundingRound, DbTokenUnlock } from '@/types/database';

// Re-export types so existing imports don't break
export type { DbStartup, DbMetricsHistory, DbPledge, DbAuditEntry, DbProposal, DbVote, DbFundingRound, DbTokenUnlock };

/**
 * Merge live Supabase rows with the DEMO_STARTUPS catalogue so investors
 * always see the full ecosystem variety, even when the DB only has the
 * 8 originally-seeded rows. DB IDs always win on collision (real data
 * takes precedence). Removed cleanly when production seeds 33+ rows.
 */
function mergeWithDemo(dbRows: DbStartup[] | null | undefined): DbStartup[] {
  const dbList = Array.isArray(dbRows) ? dbRows : [];
  const dbIds = new Set(dbList.map((s) => s.id));
  const fillers = DEMO_STARTUPS.filter((s) => !dbIds.has(s.id));
  // DB first (already MRR-sorted), then demo top-up sorted by MRR descending too
  const sortedFillers = [...fillers].sort((a, b) => (b.mrr ?? 0) - (a.mrr ?? 0));
  return [...dbList, ...sortedFillers];
}

export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .order('mrr', { ascending: false });
        if (error) {
          logDataError(error, 'useStartups.select');
          return DEMO_STARTUPS;
        }
        // Always supplement with demo entries so the platform looks populated
        return mergeWithDemo(data as DbStartup[] | null);
      } catch (err) {
        logDataError(err, 'useStartups.catch');
        return DEMO_STARTUPS;
      }
    },
  });
}

export function useStartup(id: string | undefined) {
  return useQuery({
    queryKey: ['startup', id],
    queryFn: async () => {
      if (!id) return null;
      // Demo startups are read-only and only live in the local catalogue,
      // so resolve them locally before round-tripping to Supabase.
      const demoMatch = DEMO_STARTUPS.find((s) => s.id === id);
      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) {
          logDataError(error, 'useStartup.select');
          return demoMatch ?? null;
        }
        if (!data) return demoMatch ?? null;
        return data as DbStartup;
      } catch (err) {
        logDataError(err, 'useStartup.catch');
        return demoMatch ?? null;
      }
    },
    enabled: !!id,
  });
}

export function useMetricsHistory(startupId: string | undefined) {
  return useQuery({
    queryKey: ['metrics_history', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      const demoMetrics = DEMO_METRICS.filter((m) => m.startup_id === startupId);
      try {
        const { data, error } = await supabase
          .from('metrics_history')
          .select('*')
          .eq('startup_id', startupId)
          .order('month_date', { ascending: true });
        if (error) {
          logDataError(error, 'useMetricsHistory.select');
          return demoMetrics;
        }
        if (!data || data.length === 0) return demoMetrics;
        return data as DbMetricsHistory[];
      } catch (err) {
        logDataError(err, 'useMetricsHistory.catch');
        return demoMetrics;
      }
    },
    enabled: !!startupId,
  });
}

/** Fetch metrics for ALL startups, returned as a Map keyed by startup_id */
export function useAllMetricsMap(startupIds: string[]) {
  return useQuery({
    queryKey: ['all_metrics_map', ...startupIds],
    queryFn: async () => {
      const map = new Map<string, DbMetricsHistory[]>();
      if (startupIds.length === 0) return map;

      try {
        const { data, error } = await supabase
          .from('metrics_history')
          .select('*')
          .in('startup_id', startupIds)
          .order('month_date', { ascending: true });

        if (!error && data) {
          for (const m of data as DbMetricsHistory[]) {
            const arr = map.get(m.startup_id) ?? [];
            arr.push(m);
            map.set(m.startup_id, arr);
          }
          // For any requested ID that wasn't in the DB response, supplement
          // with the demo metrics so charts render across the whole list.
          for (const id of startupIds) {
            if (!map.has(id)) {
              const demoForId = DEMO_METRICS.filter((m) => m.startup_id === id);
              if (demoForId.length > 0) map.set(id, demoForId);
            }
          }
          if (map.size > 0) return map;
        }
      } catch { /* fall through to demo */ }

      // Fallback to demo data
      for (const id of startupIds) {
        const demoMetrics = DEMO_METRICS.filter(m => m.startup_id === id);
        if (demoMetrics.length > 0) map.set(id, demoMetrics);
      }
      return map;
    },
    enabled: startupIds.length > 0,
  });
}

export function useStartupPledges(startupId: string | undefined) {
  return useQuery({
    queryKey: ['pledges', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      try {
        const { data, error } = await supabase
          .from('pledges')
          .select('*')
          .eq('startup_id', startupId)
          .order('committed_date', { ascending: true });
        if (error) return [];
        return data as DbPledge[];
      } catch {
        return [];
      }
    },
    enabled: !!startupId,
  });
}

export function useAllPledges() {
  return useQuery({
    queryKey: ['all-pledges'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('pledges')
          .select('*')
          .order('committed_date', { ascending: true });
        if (error) return [];
        return data as DbPledge[];
      } catch {
        return [];
      }
    },
  });
}

export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .order('created_at', { ascending: false });
        if (error || !data || data.length === 0) return DEMO_PROPOSALS;
        return data as DbProposal[];
      } catch {
        return DEMO_PROPOSALS;
      }
    },
  });
}

export function useAuditLog(startupId: string | undefined) {
  return useQuery({
    queryKey: ['audit_log', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      try {
        const { data, error } = await supabase
          .from('startup_audit_log')
          .select('*')
          .eq('startup_id', startupId)
          .order('changed_at', { ascending: false })
          .limit(100);
        if (error) return [];
        return data as DbAuditEntry[];
      } catch {
        return [];
      }
    },
    enabled: !!startupId,
  });
}

export function useUserVotes(userId: string | undefined) {
  return useQuery({
    queryKey: ['votes', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', userId);
        if (error) return [];
        return data as DbVote[];
      } catch {
        return [];
      }
    },
    enabled: !!userId,
  });
}

export function useFundingRounds(startupId: string | undefined) {
  return useQuery({
    queryKey: ['funding_rounds', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      try {
        const { data, error } = await supabase
          .from('funding_rounds')
          .select('*')
          .eq('startup_id', startupId)
          .order('round_date', { ascending: true });
        if (error) return [];
        return data as DbFundingRound[];
      } catch {
        return [];
      }
    },
    enabled: !!startupId,
  });
}

export function useTokenUnlocks(startupId: string | undefined) {
  return useQuery({
    queryKey: ['token_unlocks', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      try {
        const { data, error } = await supabase
          .from('token_unlocks')
          .select('*')
          .eq('startup_id', startupId)
          .order('unlock_date', { ascending: true });
        if (error) return [];
        return data as DbTokenUnlock[];
      } catch {
        return [];
      }
    },
    enabled: !!startupId,
  });
}
