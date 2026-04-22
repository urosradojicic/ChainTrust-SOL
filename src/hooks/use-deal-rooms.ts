/**
 * Hooks for Deal Rooms
 * ────────────────────
 * Thin React Query wrappers over the Supabase deal_rooms table with
 * graceful fallbacks to in-memory demo rooms when the backend is
 * unreachable (so the UI never goes blank in demo mode).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logDataError } from '@/lib/error-handler';
import type { DbStartup } from '@/types/database';
import { DEMO_STARTUPS } from '@/lib/demo-data';

export interface DealRoom {
  id: string;
  startup_id: string;
  creator_id: string;
  title: string;
  summary: string | null;
  target_amount: number;
  min_ticket: number;
  raised_amount: number;
  accepted_tokens: string[];
  deadline: string;
  terms: Record<string, unknown> | null;
  escrow_address: string | null;
  status: 'active' | 'funded' | 'closed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/** Deterministic demo rooms when Supabase can't be reached. */
function buildDemoRooms(startups: DbStartup[]): DealRoom[] {
  const now = Date.now();
  return startups.slice(0, 4).map((s, i) => {
    const raised = (i + 1) * 150_000;
    const target = raised * (2 + i * 0.4);
    return {
      id: `demo-room-${s.id}`,
      startup_id: s.id,
      creator_id: 'demo',
      title: `${s.name} Series ${String.fromCharCode(65 + i)}`,
      summary: s.description ?? 'Fundraising via ChainTrust Deal Room.',
      target_amount: Math.round(target),
      min_ticket: 10_000 * (i + 1),
      raised_amount: Math.round(raised),
      accepted_tokens: ['USDC', 'SOL'],
      deadline: new Date(now + (14 + i * 7) * 86_400_000).toISOString(),
      terms: { round_type: i % 2 === 0 ? 'SAFE' : 'Priced Round', valuation_cap_usd: 20_000_000 + i * 8_000_000 },
      escrow_address: null,
      status: 'active' as const,
      created_at: new Date(now - (30 - i) * 86_400_000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

export function useDealRooms() {
  return useQuery({
    queryKey: ['deal_rooms'],
    queryFn: async (): Promise<DealRoom[]> => {
      try {
        const { data, error } = await supabase
          .from('deal_rooms')
          .select('*')
          .order('deadline', { ascending: true });
        if (error) { logDataError(error, 'useDealRooms'); return buildDemoRooms(DEMO_STARTUPS); }
        if (!data || data.length === 0) return buildDemoRooms(DEMO_STARTUPS);
        return data as unknown as DealRoom[];
      } catch (err) {
        logDataError(err, 'useDealRooms.catch');
        return buildDemoRooms(DEMO_STARTUPS);
      }
    },
  });
}

export function useDealRoom(id: string | undefined) {
  return useQuery({
    queryKey: ['deal_room', id],
    queryFn: async (): Promise<DealRoom | null> => {
      if (!id) return null;
      try {
        const { data, error } = await supabase
          .from('deal_rooms')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) { logDataError(error, 'useDealRoom'); return null; }
        if (!data) {
          // fall back to the matching demo room
          return buildDemoRooms(DEMO_STARTUPS).find((r) => r.id === id) ?? null;
        }
        return data as unknown as DealRoom;
      } catch (err) {
        logDataError(err, 'useDealRoom.catch');
        return buildDemoRooms(DEMO_STARTUPS).find((r) => r.id === id) ?? null;
      }
    },
    enabled: !!id,
  });
}
