-- Fix Issue 1: Remove policy that allows assistants/receptionists to see ALL patient data
-- They should only access limited data through the patients_limited view
DROP POLICY IF EXISTS "Assistants and receptionists can view basic patient info" ON public.patients;

-- Fix Issue 2: Recreate the patients_limited view with proper security settings
-- Using security_invoker=false allows the view to bypass RLS on patients
-- while still filtering by clinic using auth.uid() from request context
DROP VIEW IF EXISTS public.patients_limited CASCADE;

CREATE VIEW public.patients_limited
WITH (security_barrier = true, security_invoker = false)
AS
SELECT 
  id,
  clinic_id,
  first_name,
  last_name,
  email,
  phone,
  whatsapp,
  birth_date,
  gender,
  address,
  city,
  state,
  postal_code,
  avatar_url,
  created_at,
  updated_at
FROM public.patients
WHERE clinic_id = get_user_clinic_id(auth.uid());

-- Revoke all access from anonymous users
REVOKE ALL ON public.patients_limited FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.patients_limited TO authenticated;

-- Add comment documenting the security model
COMMENT ON VIEW public.patients_limited IS 'Secure view for assistants/receptionists - excludes medical data (allergies, medications, medical_notes, emergency contacts)';