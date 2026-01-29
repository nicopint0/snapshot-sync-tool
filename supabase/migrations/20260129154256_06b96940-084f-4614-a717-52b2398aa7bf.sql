-- Fix patients_limited view security issue
-- The view has security_invoker=on but the global GRANT bypasses multi-tenant isolation

-- Step 1: Revoke the overly permissive global grant
REVOKE SELECT ON public.patients_limited FROM authenticated;

-- Step 2: Add RLS policies on patients_limited view to enforce clinic isolation
-- Note: Views with security_invoker inherit caller's privileges, but we need explicit policies

-- Policy for admins and dentists - they should use the full patients table directly
-- This view is specifically for assistants and receptionists

-- Drop and recreate the view with proper security
DROP VIEW IF EXISTS public.patients_limited;

-- Create secure view that only shows patients from user's clinic
-- Using security_invoker ensures the base table RLS is respected
CREATE VIEW public.patients_limited
WITH (security_invoker = on)
AS SELECT 
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

-- Grant access to authenticated users - now the view itself enforces clinic isolation
GRANT SELECT ON public.patients_limited TO authenticated;