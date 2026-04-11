import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_STARTUPS, DEMO_METRICS, DEMO_PROPOSALS } from '@/lib/demo-data';
import type { DbStartup, DbMetricsHistory, DbPledge, DbAuditEntry, DbProposal, DbVote, DbFundingRound, DbTokenUnlock } from '@/types/database';

// Re-export types so existing imports don't break
export type { DbStartup, DbMetricsHistory, DbPledge, DbAuditEntry, DbProposal, DbVote, DbFundingRound, DbTokenUnlock };

export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .order('mrr', { ascending: false });
        if (error || !data || data.length === 0) return DEMO_STARTUPS;
        return data as DbStartup[];
      } catch {
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
      try {
        const { data, error } = await supabase
          .from('startups')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error || !data) return DEMO_STARTUPS.find(s => s.id === id) ?? null;
        return data as DbStartup;
      } catch {
        return DEMO_STARTUPS.find(s => s.id === id) ?? null;
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
      try {
        const { data, error } = await supabase
          .from('metrics_history')
          .select('*')
          .eq('startup_id', startupId)
          .order('month_date', { ascending: true });
        if (error || !data || data.length === 0) {
          return DEMO_METRICS.filter(m => m.startup_id === startupId);
        }
        return data as DbMetricsHistory[];
      } catch {
        return DEMO_METRICS.filter(m => m.startup_id === startupId);
      }
    },
    enabled: !!startupId,
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
