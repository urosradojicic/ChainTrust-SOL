
-- Create startups table
CREATE TABLE public.startups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'SaaS',
  blockchain text NOT NULL DEFAULT 'Base Sepolia',
  mrr integer NOT NULL DEFAULT 0,
  users integer NOT NULL DEFAULT 0,
  growth_rate numeric(6,2) NOT NULL DEFAULT 0,
  sustainability_score integer NOT NULL DEFAULT 0,
  energy_score integer NOT NULL DEFAULT 0,
  carbon_score integer NOT NULL DEFAULT 0,
  tokenomics_score integer NOT NULL DEFAULT 0,
  governance_score integer NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  logo_url text,
  description text,
  founded_date date,
  website text,
  carbon_offset_tonnes numeric(10,2) NOT NULL DEFAULT 0,
  energy_per_transaction text DEFAULT '0.001 kWh',
  token_concentration_pct numeric(5,2) NOT NULL DEFAULT 0,
  trust_score integer NOT NULL DEFAULT 50,
  chain_type text DEFAULT 'PoS',
  inflation_rate numeric(5,2) NOT NULL DEFAULT 0,
  team_size integer NOT NULL DEFAULT 1,
  treasury numeric(14,2) NOT NULL DEFAULT 0,
  energy_consumption numeric(10,2) NOT NULL DEFAULT 0,
  whale_concentration numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create metrics_history table
CREATE TABLE public.metrics_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  month text NOT NULL,
  month_date date NOT NULL DEFAULT CURRENT_DATE,
  revenue numeric(14,2) NOT NULL DEFAULT 0,
  costs numeric(14,2) NOT NULL DEFAULT 0,
  mau integer NOT NULL DEFAULT 0,
  transactions integer NOT NULL DEFAULT 0,
  carbon_offsets numeric(10,2) NOT NULL DEFAULT 0,
  growth_rate numeric(6,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create pledges table
CREATE TABLE public.pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid REFERENCES public.startups(id) ON DELETE CASCADE NOT NULL,
  pledge_text text NOT NULL,
  committed_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create proposals table
CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  proposer text NOT NULL,
  votes_for integer NOT NULL DEFAULT 0,
  votes_against integer NOT NULL DEFAULT 0,
  votes_abstain integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active',
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read startups" ON public.startups FOR SELECT USING (true);
CREATE POLICY "Public read metrics_history" ON public.metrics_history FOR SELECT USING (true);
CREATE POLICY "Public read pledges" ON public.pledges FOR SELECT USING (true);
CREATE POLICY "Public read proposals" ON public.proposals FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admin insert startups" ON public.startups FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update startups" ON public.startups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete startups" ON public.startups FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin insert metrics" ON public.metrics_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert pledges" ON public.pledges FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert proposals" ON public.proposals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
