import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to Supabase Realtime changes on key tables.
 * When rows change, invalidate the relevant React Query cache
 * so the UI auto-refreshes without polling.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'startups' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['startups'] });
          queryClient.invalidateQueries({ queryKey: ['startup'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'metrics_history' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['metrics_history'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proposals' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pledges' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pledges'] });
          queryClient.invalidateQueries({ queryKey: ['all-pledges'] });
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'startup_audit_log' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['audit_log'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
