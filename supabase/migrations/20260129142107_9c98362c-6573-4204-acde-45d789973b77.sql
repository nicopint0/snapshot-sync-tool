-- Explicitly deny anonymous access to odontograms table
CREATE POLICY "Deny anonymous access to odontograms"
ON public.odontograms FOR SELECT
TO anon
USING (false);

-- Also add explicit denial for ALL operations by anonymous users
CREATE POLICY "Deny anonymous write access to odontograms"
ON public.odontograms FOR ALL
TO anon
USING (false);