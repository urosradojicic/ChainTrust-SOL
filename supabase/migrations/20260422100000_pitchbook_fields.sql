-- ============================================================================
-- Phase 5: Pitchbook-style profile fields (ROADMAP_V2)
-- ----------------------------------------------------------------------------
-- Extends `startups` with the institutional-grade metadata investors expect
-- on a Crunchbase / Pitchbook profile: founding team, headquarters, stage,
-- LinkedIn, sector tags, ticker. Nullable so existing rows migrate safely.
-- All additions use `IF NOT EXISTS` to allow re-runs.
-- ============================================================================

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS headquarters       TEXT,
  ADD COLUMN IF NOT EXISTS employee_count     INTEGER,
  ADD COLUMN IF NOT EXISTS linkedin_url       TEXT,
  ADD COLUMN IF NOT EXISTS twitter_handle     TEXT,
  ADD COLUMN IF NOT EXISTS founding_team      JSONB,         -- [{name, role, linkedin}, ...]
  ADD COLUMN IF NOT EXISTS sector_tags        TEXT[],        -- ['SaaS', 'AI', 'ClimateTech']
  ADD COLUMN IF NOT EXISTS stage              TEXT,          -- 'pre-seed' | 'seed' | 'series-a' | ...
  ADD COLUMN IF NOT EXISTS ticker             TEXT,          -- Optional on-chain ticker symbol
  ADD COLUMN IF NOT EXISTS total_raised_usd   NUMERIC;

-- Bounded stage values — reject bogus strings at write time.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_stage_valid' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_stage_valid
      CHECK (stage IS NULL OR stage IN (
        'idea', 'pre-seed', 'seed',
        'series-a', 'series-b', 'series-c',
        'series-d', 'growth', 'exit'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_employee_count_positive' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_employee_count_positive
      CHECK (employee_count IS NULL OR (employee_count >= 0 AND employee_count <= 1000000));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'startups_ticker_format' AND conrelid = 'public.startups'::regclass
  ) THEN
    ALTER TABLE public.startups
      ADD CONSTRAINT startups_ticker_format
      CHECK (ticker IS NULL OR (length(ticker) BETWEEN 1 AND 20 AND ticker ~* '^[a-z0-9-]+$'));
  END IF;
END $$;

-- Funding round enrichment (extend existing funding_rounds)
ALTER TABLE public.funding_rounds
  ADD COLUMN IF NOT EXISTS round_type         TEXT,          -- 'SAFE' | 'Priced Round' | 'Convertible Note' | 'Token Sale'
  ADD COLUMN IF NOT EXISTS lead_investor      TEXT,
  ADD COLUMN IF NOT EXISTS participating      JSONB,         -- [{name, amount}, ...]
  ADD COLUMN IF NOT EXISTS announcement_url   TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'funding_rounds_round_type_valid' AND conrelid = 'public.funding_rounds'::regclass
  ) THEN
    ALTER TABLE public.funding_rounds
      ADD CONSTRAINT funding_rounds_round_type_valid
      CHECK (round_type IS NULL OR round_type IN (
        'SAFE', 'Priced Round', 'Convertible Note', 'Token Sale', 'Grant', 'Revenue-Based'
      ));
  END IF;
END $$;

-- Indexes for the most common new access patterns.
CREATE INDEX IF NOT EXISTS idx_startups_stage      ON public.startups (stage)       WHERE stage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_ticker     ON public.startups (ticker)      WHERE ticker IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_startups_hq         ON public.startups (headquarters) WHERE headquarters IS NOT NULL;

COMMENT ON COLUMN public.startups.founding_team IS
  'JSONB array of {name, role, linkedin?}. Populated by MyStartup UI.';

COMMENT ON COLUMN public.startups.sector_tags IS
  'Free-form sector tags, e.g. {SaaS, AI, ClimateTech}. Used by Screener.';
