-- ============================================================================
-- Phase 7: Deal Rooms (ROADMAP_V2)
-- ----------------------------------------------------------------------------
-- AngelList-style fundraise pipeline: a verified startup creates a Deal
-- Room with target/min-ticket/deadline; investors pledge on-chain via
-- existing pledges table (with a new deal_room_id FK).
--
-- Everything nullable-friendly + IF NOT EXISTS for safe re-runs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.deal_rooms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id        UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  creator_id        UUID NOT NULL REFERENCES auth.users(id),
  title             TEXT NOT NULL,
  summary           TEXT,
  target_amount     NUMERIC NOT NULL CHECK (target_amount > 0),
  min_ticket        NUMERIC NOT NULL CHECK (min_ticket > 0),
  raised_amount     NUMERIC NOT NULL DEFAULT 0 CHECK (raised_amount >= 0),
  accepted_tokens   TEXT[] DEFAULT ARRAY['USDC','SOL']::TEXT[],
  deadline          TIMESTAMPTZ NOT NULL,
  terms             JSONB,
  escrow_address    TEXT,
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'funded', 'closed', 'cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deal_rooms_startup_status   ON public.deal_rooms (startup_id, status);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_status_deadline  ON public.deal_rooms (status, deadline DESC);
CREATE INDEX IF NOT EXISTS idx_deal_rooms_creator          ON public.deal_rooms (creator_id);

-- Link existing pledges table to deal rooms when a pledge is part of one.
ALTER TABLE public.pledges
  ADD COLUMN IF NOT EXISTS deal_room_id   UUID REFERENCES public.deal_rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pledge_amount  NUMERIC CHECK (pledge_amount IS NULL OR pledge_amount > 0),
  ADD COLUMN IF NOT EXISTS investor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS escrow_tx_sig  TEXT;

CREATE INDEX IF NOT EXISTS idx_pledges_deal_room           ON public.pledges (deal_room_id)
  WHERE deal_room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pledges_investor            ON public.pledges (investor_id)
  WHERE investor_id IS NOT NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active deal rooms"   ON public.deal_rooms;
DROP POLICY IF EXISTS "Creators manage own deal rooms"  ON public.deal_rooms;
DROP POLICY IF EXISTS "Admins manage all deal rooms"    ON public.deal_rooms;

-- Everyone (authenticated or not) can read active or funded deal rooms.
CREATE POLICY "Public read active deal rooms"
  ON public.deal_rooms FOR SELECT
  USING (status IN ('active', 'funded'));

-- Creators can insert/update/delete their own rooms.
CREATE POLICY "Creators manage own deal rooms"
  ON public.deal_rooms FOR ALL
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Admins can manage anything.
CREATE POLICY "Admins manage all deal rooms"
  ON public.deal_rooms FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Automatically bump updated_at on any row edit.
CREATE OR REPLACE FUNCTION public.bump_deal_rooms_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deal_rooms_updated_at ON public.deal_rooms;
CREATE TRIGGER deal_rooms_updated_at
  BEFORE UPDATE ON public.deal_rooms
  FOR EACH ROW EXECUTE FUNCTION public.bump_deal_rooms_updated_at();

COMMENT ON TABLE public.deal_rooms IS
  'ROADMAP_V2 Phase 7: Deal pipeline rooms. Targets/min-ticket/deadline, linked to startups.';
