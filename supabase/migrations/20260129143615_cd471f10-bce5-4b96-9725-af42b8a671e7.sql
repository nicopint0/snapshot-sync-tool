-- Add explicit denial policy for anonymous users on profiles table
-- This follows defense-in-depth principles matching the pattern used for odontograms table

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous write access to profiles"
ON public.profiles FOR ALL
TO anon
USING (false);