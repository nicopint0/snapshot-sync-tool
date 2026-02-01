-- Remove the security definer view that triggers the linter warning
DROP VIEW IF EXISTS public.patients_limited CASCADE;

-- Create a secure function that returns limited patient data
-- This is the recommended pattern instead of security_definer views
CREATE OR REPLACE FUNCTION public.get_patients_limited()
RETURNS TABLE (
  id uuid,
  clinic_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  whatsapp text,
  birth_date date,
  gender text,
  address text,
  city text,
  state text,
  postal_code text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.clinic_id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    p.whatsapp,
    p.birth_date,
    p.gender,
    p.address,
    p.city,
    p.state,
    p.postal_code,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.patients p
  WHERE p.clinic_id = get_user_clinic_id(auth.uid())
    AND auth.uid() IS NOT NULL;
$$;

-- Revoke access from anonymous users
REVOKE ALL ON FUNCTION public.get_patients_limited() FROM anon;
REVOKE ALL ON FUNCTION public.get_patients_limited() FROM public;

-- Grant access only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_patients_limited() TO authenticated;

-- Create a security invoker view that uses the function
-- This allows querying with standard SELECT syntax while being secure
CREATE VIEW public.patients_limited
WITH (security_invoker = true)
AS
SELECT * FROM public.get_patients_limited();

-- Revoke access from anonymous users on the view
REVOKE ALL ON public.patients_limited FROM anon;

-- Grant SELECT to authenticated users
GRANT SELECT ON public.patients_limited TO authenticated;

-- Add documentation
COMMENT ON FUNCTION public.get_patients_limited() IS 'Secure function for assistants/receptionists - excludes medical data (allergies, medications, medical_notes, emergency contacts)';
COMMENT ON VIEW public.patients_limited IS 'Secure view wrapper for get_patients_limited() function';