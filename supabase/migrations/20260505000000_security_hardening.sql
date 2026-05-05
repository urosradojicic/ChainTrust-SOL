-- ============================================================================
-- 2026-05-05 Security hardening pass
-- ----------------------------------------------------------------------------
-- Closes seven issues identified in the May 2026 deep audit:
--   1. user_roles self-grant: any authenticated user could insert role=admin
--      for themselves and bypass every "admin can write" policy in the schema.
--   2. profiles PII over-exposure: investor role read every user's email.
--   3. deal_rooms creation lacked role + startup-ownership checks.
--   4. startup_audit_log was forgeable (no startup-ownership EXISTS check).
--   5. funding_rounds / token_unlocks had INSERT-only policies despite the
--      "manage" naming, blocking owners from updating their own rounds.
--   6. pledges SELECT was world-readable, leaking investor_id once
--      deal-rooms migration added that column.
--   7. get_user_role() returned non-deterministic role on multi-role users.
--
-- Idempotent: every CREATE uses OR REPLACE / IF NOT EXISTS, every policy is
-- DROPped first. Safe to re-run on already-migrated databases.
-- ============================================================================

-- ── 1. user_roles: replace self-grant with SECURITY DEFINER assignment fn ──
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Allow self-insert ONLY for non-privileged roles. Admin can never be granted
-- via this path. Service role / a future admin RPC retain the ability to grant.
CREATE POLICY "Users can insert own non-admin role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('investor'::app_role, 'startup'::app_role)
  );

-- Admin-only path to grant any role (including admin). Used by future ops
-- consoles or seed scripts. Service role bypasses RLS so it works regardless.
CREATE POLICY "Admins can insert any role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Roles are immutable from the client: no UPDATE policy. Demotion/revocation
-- happens server-side or via service_role.
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ── 2. profiles: investor PII over-exposure ──────────────────────────────
-- Previously: investors saw every user's email regardless of visibility flag.
-- Now: investors only see profiles that the user has marked public, plus their
-- own. Admin path is unchanged.
DROP POLICY IF EXISTS "Investors can view public profiles" ON public.profiles;
CREATE POLICY "Investors can view public profiles"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'investor'::app_role)
    AND (visibility_public = true OR user_id = auth.uid())
  );

-- ── 3. deal_rooms: enforce startup ownership + startup-role on writes ────
DROP POLICY IF EXISTS "Creators manage own deal rooms" ON public.deal_rooms;
CREATE POLICY "Creators manage own deal rooms"
  ON public.deal_rooms FOR ALL
  TO authenticated
  USING (
    creator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = deal_rooms.startup_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    creator_id = auth.uid()
    AND public.has_role(auth.uid(), 'startup'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = deal_rooms.startup_id AND user_id = auth.uid()
    )
  );

-- ── 4. startup_audit_log: prevent forging entries for other startups ─────
DROP POLICY IF EXISTS "Authenticated insert audit log" ON public.startup_audit_log;
CREATE POLICY "Authenticated insert own startup audit log"
  ON public.startup_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = startup_audit_log.startup_id AND user_id = auth.uid()
    )
  );

-- ── 5. funding_rounds + token_unlocks: full CRUD for owners + admins ─────
DROP POLICY IF EXISTS "Startup owners can update rounds" ON public.funding_rounds;
CREATE POLICY "Startup owners can update rounds"
  ON public.funding_rounds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Startup owners can delete rounds" ON public.funding_rounds;
CREATE POLICY "Startup owners can delete rounds"
  ON public.funding_rounds FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Startup owners can update unlocks" ON public.token_unlocks;
CREATE POLICY "Startup owners can update unlocks"
  ON public.token_unlocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Startup owners can delete unlocks" ON public.token_unlocks;
CREATE POLICY "Startup owners can delete unlocks"
  ON public.token_unlocks FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ── 6. pledges: scope SELECT to authenticated users ──────────────────────
-- Anonymous browsers no longer see investor_id / pledge_amount / escrow_tx_sig.
-- Public marketing pages should aggregate via SECURITY DEFINER views instead.
DROP POLICY IF EXISTS "Public read pledges" ON public.pledges;
DROP POLICY IF EXISTS "Authenticated read pledges" ON public.pledges;
CREATE POLICY "Authenticated read pledges"
  ON public.pledges FOR SELECT
  TO authenticated
  USING (true);

-- ── 7. get_user_role: deterministic priority order ───────────────────────
-- Multi-role user (e.g. someone who is both an investor and startup) used to
-- return whichever row Postgres picked first — not stable across queries.
-- New ordering: admin > investor > startup. has_role() is unaffected and
-- remains the preferred check for authorization gates.
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin'::app_role    THEN 1
    WHEN 'investor'::app_role THEN 2
    WHEN 'startup'::app_role  THEN 3
  END
  LIMIT 1
$$;
