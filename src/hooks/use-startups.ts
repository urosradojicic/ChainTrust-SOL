import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DbStartup, DbMetricsHistory, DbPledge, DbAuditEntry, DbProposal, DbVote, DbFundingRound, DbTokenUnlock } from '@/types/database';

// Re-export types so existing imports don't break
export type { DbStartup, DbMetricsHistory, DbPledge, DbAuditEntry, DbProposal, DbVote, DbFundingRound, DbTokenUnlock };

export function useStartups() {
  return useQuery({
    queryKey: ['startups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('startups')
        .select('*')
        .order('mrr', { ascending: false });
      if (error) throw error;
      return data as DbStartup[];
    },
  });
}

export function useStartup(id: string | undefined) {
  return useQuery({
    queryKey: ['startup', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('startups')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as DbStartup | null;
    },
    enabled: !!id,
  });
}

export function useMetricsHistory(startupId: string | undefined) {
  return useQuery({
    queryKey: ['metrics_history', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      const { data, error } = await supabase
        .from('metrics_history')
        .select('*')
        .eq('startup_id', startupId)
        .order('month_date', { ascending: true });
      if (error) throw error;
      return data as DbMetricsHistory[];
    },
    enabled: !!startupId,
  });
}

export function useStartupPledges(startupId: string | undefined) {
  return useQuery({
    queryKey: ['pledges', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      const { data, error } = await supabase
        .from('pledges')
        .select('*')
        .eq('startup_id', startupId)
        .order('committed_date', { ascending: true });
      if (error) throw error;
      return data as DbPledge[];
    },
    enabled: !!startupId,
  });
}

export function useAllPledges() {
  return useQuery({
    queryKey: ['all-pledges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pledges')
        .select('*')
        .order('committed_date', { ascending: true });
      if (error) throw error;
      return data as DbPledge[];
    },
  });
}

export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbProposal[];
    },
  });
}

export function useAuditLog(startupId: string | undefined) {
  return useQuery({
    queryKey: ['audit_log', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      const { data, error } = await supabase
        .from('startup_audit_log')
        .select('*')
        .eq('startup_id', startupId)
        .order('changed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as DbAuditEntry[];
    },
    enabled: !!startupId,
  });
}

export function useUserVotes(userId: string | undefined) {
  return useQuery({
    queryKey: ['votes', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      return data as DbVote[];
    },
    enabled: !!userId,
  });
}

export function useFundingRounds(startupId: string | undefined) {
  return useQuery({
    queryKey: ['funding_rounds', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      const { data, error } = await supabase
        .from('funding_rounds')
        .select('*')
        .eq('startup_id', startupId)
        .order('round_date', { ascending: true });
      if (error) throw error;
      return data as DbFundingRound[];
    },
    enabled: !!startupId,
  });
}

export function useTokenUnlocks(startupId: string | undefined) {
  return useQuery({
    queryKey: ['token_unlocks', startupId],
    queryFn: async () => {
      if (!startupId) return [];
      const { data, error } = await supabase
        .from('token_unlocks')
        .select('*')
        .eq('startup_id', startupId)
        .order('unlock_date', { ascending: true });
      if (error) throw error;
      return data as DbTokenUnlock[];
    },
    enabled: !!startupId,
  });
}
