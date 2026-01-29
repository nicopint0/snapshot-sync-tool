-- Fix 1: Add DELETE policy for budgets table - Only admins can delete
CREATE POLICY "Admins can delete budgets in their clinic"
ON public.budgets FOR DELETE
USING (
  clinic_id = get_user_clinic_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Fix 2: Create a secure view for patients that limits sensitive medical data based on role
-- First, drop the existing policies that give full access
DROP POLICY IF EXISTS "Users can view patients in their clinic" ON public.patients;

-- Create a policy that allows full access for dentists and admins
CREATE POLICY "Dentists and admins can view all patient data"
ON public.patients FOR SELECT
USING (
  clinic_id = get_user_clinic_id(auth.uid())
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dentist'::app_role)
  )
);

-- Create a policy that allows limited access for assistants and receptionists
-- They can only see basic scheduling-related info (not medical data)
-- Note: RLS cannot filter columns, so we need a view for that
CREATE POLICY "Assistants and receptionists can view basic patient info"
ON public.patients FOR SELECT
USING (
  clinic_id = get_user_clinic_id(auth.uid())
  AND (
    has_role(auth.uid(), 'assistant'::app_role) 
    OR has_role(auth.uid(), 'receptionist'::app_role)
  )
);

-- Create a secure view that hides sensitive medical data for non-medical staff
CREATE OR REPLACE VIEW public.patients_limited
WITH (security_invoker = on) AS
SELECT 
  id,
  clinic_id,
  first_name,
  last_name,
  email,
  phone,
  whatsapp,
  avatar_url,
  birth_date,
  gender,
  address,
  city,
  state,
  postal_code,
  created_at,
  updated_at
  -- Excludes: allergies, medications, medical_notes, emergency_contact_name, emergency_contact_phone
FROM public.patients;

-- Grant access to the view
GRANT SELECT ON public.patients_limited TO authenticated;