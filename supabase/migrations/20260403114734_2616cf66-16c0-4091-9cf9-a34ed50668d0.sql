CREATE POLICY "Authenticated insert proposals"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (true);