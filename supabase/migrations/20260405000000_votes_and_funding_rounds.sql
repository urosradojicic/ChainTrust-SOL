-- Create votes table for governance proposal voting
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL CHECK (vote IN ('For', 'Against', 'Abstain')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create funding_rounds table
CREATE TABLE IF NOT EXISTS public.funding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  valuation NUMERIC(14,2) NOT NULL DEFAULT 0,
  round_date DATE NOT NULL,
  investors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.funding_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read funding rounds" ON public.funding_rounds FOR SELECT USING (true);
CREATE POLICY "Startup owners can insert rounds" ON public.funding_rounds FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Create token_unlocks table
CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  unlock_date DATE NOT NULL,
  amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read token unlocks" ON public.token_unlocks FOR SELECT USING (true);
CREATE POLICY "Startup owners can manage unlocks" ON public.token_unlocks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.startups WHERE id = startup_id AND user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Function to update proposal vote counts after a vote is cast
CREATE OR REPLACE FUNCTION public.update_proposal_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.proposals SET
    votes_for = (SELECT COUNT(*) FROM public.votes WHERE proposal_id = NEW.proposal_id AND vote = 'For'),
    votes_against = (SELECT COUNT(*) FROM public.votes WHERE proposal_id = NEW.proposal_id AND vote = 'Against'),
    votes_abstain = (SELECT COUNT(*) FROM public.votes WHERE proposal_id = NEW.proposal_id AND vote = 'Abstain')
  WHERE id = NEW.proposal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_cast
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_proposal_votes();
