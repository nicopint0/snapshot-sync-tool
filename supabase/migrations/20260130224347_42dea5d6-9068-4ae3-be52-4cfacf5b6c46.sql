-- Fix 1: patients table - Convert RESTRICTIVE policies to PERMISSIVE (default)
-- The current RESTRICTIVE policies require ALL policies to pass (AND logic)
-- We need PERMISSIVE so ANY policy grants access (OR logic)

DROP POLICY IF EXISTS "Dentists and admins can view all patient data" ON public.patients;
DROP POLICY IF EXISTS "Assistants and receptionists can view basic patient info" ON public.patients;

-- Recreate as PERMISSIVE (default) - only one needs to pass for SELECT access
CREATE POLICY "Dentists and admins can view all patient data"
ON public.patients FOR SELECT TO authenticated
USING (
  clinic_id = get_user_clinic_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dentist'))
);

CREATE POLICY "Assistants and receptionists can view basic patient info"
ON public.patients FOR SELECT TO authenticated
USING (
  clinic_id = get_user_clinic_id(auth.uid())
  AND (has_role(auth.uid(), 'assistant') OR has_role(auth.uid(), 'receptionist'))
);

-- Fix 2: payment_config - Restrict SELECT to admins only (secrets should not be visible to all staff)
DROP POLICY IF EXISTS "Users can view their clinic payment config" ON public.payment_config;

CREATE POLICY "Only admins can view payment config"
ON public.payment_config FOR SELECT TO authenticated
USING (
  clinic_id = get_user_clinic_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);