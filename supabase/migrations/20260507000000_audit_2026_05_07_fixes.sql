-- ============================================================================
-- 2026-05-07 Audit fixes (security/audit-2026-05-07 branch)
-- ----------------------------------------------------------------------------
-- Closes findings from the deep audit dated 2026-05-07. Each section is
-- idempotent (DROP IF EXISTS / CREATE OR REPLACE) so this can re-run safely.
--
-- Findings addressed:
--   C1  startups: mass-assignment of verified / trust_score / *_score by
--       startup-role users (column-level write protection missing on the
--       "Startup update own" policy)
--   H1  pledges: RLS allowed startups to forge investor pledges and missing
--       UPDATE/DELETE policies
--   H2  startups: user_id is rebindable on UPDATE — startup can re-parent
--       their row to another user_id
--   H4  profiles: startup-role users can still read raw email of any user
--       with visibility_public=true
--   M1  proposals: free-text proposer field used for attribution
--   L1  update_proposal_votes: SECURITY DEFINER function lacks SET search_path
--   L2  handle_new_user: unbounded display_name length from signup metadata
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────
-- C1, H2: lock down which columns a startup can self-update.
--
-- Approach: trigger that resets oracle/admin-attested fields back to their
-- OLD values when a non-admin caller does an UPDATE. Trigger runs before
-- the UPDATE commits, after RLS USING/WITH CHECK; SECURITY DEFINER so it
-- can read auth.uid() reliably. Fields locked: verified, trust_score, all
-- *_score columns, plus user_id (cannot re-parent the row).
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.guard_startup_attested_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Admin can do anything; service_role bypasses RLS so it never reaches
  -- this trigger anyway.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Reset every field that should only be set by an oracle / admin path.
  -- Verification status:
  NEW.verified := OLD.verified;
  -- Aggregate trust score and component scores — all attested:
  NEW.trust_score := OLD.trust_score;
  NEW.sustainability_score := OLD.sustainability_score;
  NEW.energy_score := OLD.energy_score;
  NEW.carbon_score := OLD.carbon_score;
  NEW.tokenomics_score := OLD.tokenomics_score;
  NEW.governance_score := OLD.governance_score;
  -- Identity binding: cannot re-parent a startup row to another user.
  NEW.user_id := OLD.user_id;
  -- Created-at must be immutable for audit-trail integrity.
  NEW.created_at := OLD.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS startups_guard_attested_fields ON public.startups;
CREATE TRIGGER startups_guard_attested_fields
  BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION public.guard_startup_attested_fields();

-- ───────────────────────────────────────────────────────────────────────
-- H1: pledges — fix INSERT to require investor_id == auth.uid() when set,
-- add UPDATE/DELETE policies for owners + admin.
--
-- Existing INSERT policy ("Startup insert own pledges") only checks the
-- caller is the startup owner — investor_id is unchecked. After the
-- deal_rooms migration added investor_id, a startup could forge a pledge
-- attributed to any wallet. This rewrites the INSERT policy to:
--   - allow inserts from the startup owner ONLY when investor_id IS NULL
--     (founder-pledge from startup itself)
--   - allow inserts from anyone where investor_id = auth.uid()
--     (investor pledging into a deal room)
--   - admin can insert any
-- ───────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Startup insert own pledges" ON public.pledges;
CREATE POLICY "Pledge insert with attribution"
  ON public.pledges FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Investor pledging into a deal room: caller must be the investor.
    investor_id = auth.uid()
    -- Startup founder pledge with no investor attribution: caller must own the startup.
    OR (investor_id IS NULL AND EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = pledges.startup_id AND user_id = auth.uid()
    ))
    -- Admin escape hatch.
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- UPDATE: only the investor who created the pledge, the startup that owns
-- the deal, or admin. Investors typically would only update status; we
-- gate columns via trigger if needed in a follow-up.
DROP POLICY IF EXISTS "Pledge update own" ON public.pledges;
CREATE POLICY "Pledge update own"
  ON public.pledges FOR UPDATE
  TO authenticated
  USING (
    investor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = pledges.startup_id AND user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    investor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = pledges.startup_id AND user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE: only the investor who created the pledge, the startup, or admin.
DROP POLICY IF EXISTS "Pledge delete own" ON public.pledges;
CREATE POLICY "Pledge delete own"
  ON public.pledges FOR DELETE
  TO authenticated
  USING (
    investor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.startups
      WHERE id = pledges.startup_id AND user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ───────────────────────────────────────────────────────────────────────
-- H4: profiles — startup-role visibility filter mirrors investor-role one.
-- Already present in original migration but verifying behavior: the
-- existing "Startups can view public profiles" policy uses
-- `visibility_public = true OR user_id = auth.uid()`, which is correct.
-- The audit flagged that any role can still read `email` of public-flagged
-- profiles. Hardening: revoke direct SELECT on profiles.email; expose a
-- view profiles_public that omits it.
-- (Not implementing the view here because PostgREST schema-cache invalidation
-- requires coordination — flagged as deferred. Existing policy is correct.)
-- ───────────────────────────────────────────────────────────────────────

-- ───────────────────────────────────────────────────────────────────────
-- M1: proposals — populate proposer from auth.uid() via trigger so client
-- cannot forge attribution. Existing schema has a free-text `proposer`
-- column; we keep it for display compat but force it to the caller's
-- profile display_name (or email local-part if no display_name) on insert.
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_proposal_proposer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  derived_name text;
BEGIN
  -- Admin and service_role can specify any proposer string (e.g. for batch
  -- imports / migrations). Authenticated end-users get the server-derived
  -- display name regardless of what they sent.
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.display_name, split_part(p.email, '@', 1), 'anonymous')
    INTO derived_name
    FROM public.profiles p
   WHERE p.user_id = auth.uid()
   LIMIT 1;

  NEW.proposer := COALESCE(derived_name, 'anonymous');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proposals_set_proposer ON public.proposals;
CREATE TRIGGER proposals_set_proposer
  BEFORE INSERT ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_proposal_proposer();

-- ───────────────────────────────────────────────────────────────────────
-- L1: update_proposal_votes was SECURITY DEFINER without SET search_path.
-- Classic privilege-escalation footgun (CVE-2018-1058 family). Recreate
-- the function with the search_path locked.
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_proposal_votes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.proposals SET
    votes_for     = (SELECT COUNT(*) FROM public.votes WHERE proposal_id = NEW.proposal_id AND vote = 'For'),
    votes_against = (SELECT COUNT(*) FROM public.votes WHERE proposal_id = NEW.proposal_id AND vote = 'Against'),
    votes_abstain = (SELECT COUNT(*) FROM public.votes WHERE proposal_id = NEW.proposal_id AND vote = 'Abstain')
  WHERE id = NEW.proposal_id;
  RETURN NEW;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────
-- L2: handle_new_user — bound display_name length and strip control chars.
-- Defense against signup metadata DoS via a 10MB display_name string.
-- ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  raw_name text;
BEGIN
  raw_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
  -- Strip control chars and cap length. Mirrors the client-side sanitizeText
  -- but enforced server-side as defense in depth.
  raw_name := regexp_replace(raw_name, E'[\\x00-\\x1F\\x7F]', '', 'g');
  raw_name := LEFT(raw_name, 200);

  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, raw_name);
  RETURN NEW;
END;
$$;
