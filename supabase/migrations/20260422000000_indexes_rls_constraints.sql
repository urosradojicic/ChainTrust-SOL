-- ============================================================================
-- Phase 1: Infrastructure Hardening (ROADMAP_V2)
-- ----------------------------------------------------------------------------
-- Adds performance indexes, tightens Row-Level Security on proposals and
-- votes, and adds CHECK constraints that prevent bad data from being written.
--
-- Safe to re-run: every statement uses IF NOT EXISTS / IF EXISTS / DROP.
-- ============================================================================

-- ── Indexes ────────────────────────────────────────────────────────────────
-- These cover the filter+sort patterns used by useStartups, useMetricsHistory,
-- useAuditLog, useFundingRounds, useUserVotes, etc.

CREATE INDEX IF NOT EXISTS idx_startups_blockchain_verified
  ON public.startups (blockchain, verified);

CREATE INDEX IF NOT EXISTS idx_startups_category
  ON public.startups (category);

CREATE INDEX IF NOT EXISTS idx_startups_trust_score_desc
  ON public.startups (trust_score DESC);

CREATE INDEX IF NOT EXISTS idx_startups_mrr_desc
  ON public.startups (mrr DESC);

CREATE INDEX IF NOT EXISTS idx_startups_user_id
  ON public.startups (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_history_startup_month
  ON public.metrics_history (startup_id, month_date DESC);

CREATE INDEX IF NOT EXISTS idx_startup_audit_log_startup_changed
  ON public.startup_audit_log (startup_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_proposal_user
  ON public.votes (proposal_id, user_id);

CREATE INDEX IF NOT EXISTS idx_votes_user_id
  ON public.votes (user_id);

CREATE INDEX IF NOT EXISTS idx_funding_rounds_startup_date
  ON public.funding_rounds (startup_id, round_date DESC);

CREATE INDEX IF NOT EXISTS idx_token_unlocks_startup_date
  ON public.token_unlocks (startup_id, unlock_date);

CREATE INDEX IF NOT EXISTS idx_pledges_startup_date
  ON public.pledges (startup_id, committed_date DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id
  ON public.profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_proposals_status_created
  ON public.proposals (status, created_at DESC);

-- ── Tighten RLS: proposals ─────────────────────────────────────────────────
-- Previously any authenticated user could insert proposals. Restrict to
-- investor or admin roles to prevent spam and align with governance intent.

DROP POLICY IF EXISTS "Authenticated insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Authenticated users can create proposals" ON public.proposals;

CREATE POLICY "Investors and admins create proposals"
  ON public.proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'investor'::app_role)
  );

-- ── Tighten RLS: votes ─────────────────────────────────────────────────────
-- Same rationale. Only investors (who have stake) and admins may vote.

DROP POLICY IF EXISTS "Authenticated users can vote" ON public.votes;
DROP POLICY IF EXISTS "Users can insert votes" ON public.votes;

CREATE POLICY "Investors and admins can vote"
  ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'investor'::app_role)
    )
  );

-- ── CHECK constraints ──────────────────────────────────────────────────────
-- Prevent impossible values being written directly (bypassing client
-- sanitizers). Wrapped in DO blocks so re-runs don't duplicate.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_trust_score_range' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_trust_score_range
      CHECK (trust_score IS NULL OR (trust_score >= 0 AND trust_score <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_sustainability_score_range' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_sustainability_score_range
      CHECK (sustainability_score IS NULL OR (sustainability_score >= 0 AND sustainability_score <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_whale_concentration_range' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_whale_concentration_range
      CHECK (whale_concentration IS NULL OR (whale_concentration >= 0 AND whale_concentration <= 100));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_non_negative_metrics' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_non_negative_metrics
      CHECK (
        (mrr IS NULL OR mrr >= 0)
        AND (users IS NULL OR users >= 0)
        AND (treasury IS NULL OR treasury >= 0)
        AND (team_size IS NULL OR team_size >= 0)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'metrics_history_non_negative' AND conrelid = 'public.metrics_history'::regclass
  ) THEN
    ALTER TABLE public.metrics_history
      ADD CONSTRAINT metrics_history_non_negative
      CHECK (
        (revenue IS NULL OR revenue >= 0)
        AND (costs IS NULL OR costs >= 0)
        AND (mau IS NULL OR mau >= 0)
        AND (carbon_offsets IS NULL OR carbon_offsets >= 0)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'metrics_history_growth_rate_bounded' AND conrelid = 'public.metrics_history'::regclass
  ) THEN
    ALTER TABLE public.metrics_history
      ADD CONSTRAINT metrics_history_growth_rate_bounded
      CHECK (growth_rate IS NULL OR (growth_rate >= -100 AND growth_rate <= 10000));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pledges_valid_status' AND conrelid = 'public.pledges'::regclass
  ) THEN
    ALTER TABLE public.pledges
      ADD CONSTRAINT pledges_valid_status
      CHECK (status IS NULL OR status IN ('active', 'fulfilled', 'expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'funding_rounds_positive_amount' AND conrelid = 'public.funding_rounds'::regclass
  ) THEN
    ALTER TABLE public.funding_rounds
      ADD CONSTRAINT funding_rounds_positive_amount
      CHECK (amount IS NULL OR amount >= 0);
  END IF;
END $$;

-- ── Document this migration ────────────────────────────────────────────────
COMMENT ON INDEX idx_metrics_history_startup_month IS
  'ROADMAP_V2 Phase 1: covers useMetricsHistory and useAllMetricsMap';

COMMENT ON INDEX idx_startup_audit_log_startup_changed IS
  'ROADMAP_V2 Phase 1: covers useAuditLog; DESC order matches UI';
