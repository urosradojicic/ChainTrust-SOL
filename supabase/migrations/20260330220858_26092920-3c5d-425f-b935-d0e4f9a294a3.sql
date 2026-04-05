
-- Add user_id to startups
ALTER TABLE public.startups ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create startup_audit_log table
CREATE TABLE public.startup_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id uuid NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  tx_hash text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on startup_audit_log
ALTER TABLE public.startup_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audit log" ON public.startup_audit_log
  FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert audit log" ON public.startup_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Startup role can UPDATE own startup
CREATE POLICY "Startup update own" ON public.startups
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'startup'::app_role));

-- Startup role can INSERT own startup
CREATE POLICY "Startup insert own" ON public.startups
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'startup'::app_role));

-- Startup role can INSERT metrics for own startup
CREATE POLICY "Startup insert own metrics" ON public.metrics_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startups
      WHERE startups.id = metrics_history.startup_id
        AND startups.user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'startup'::app_role)
  );

-- Startup role can INSERT pledges for own startup
CREATE POLICY "Startup insert own pledges" ON public.pledges
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.startups
      WHERE startups.id = pledges.startup_id
        AND startups.user_id = auth.uid()
    )
    AND has_role(auth.uid(), 'startup'::app_role)
  );
