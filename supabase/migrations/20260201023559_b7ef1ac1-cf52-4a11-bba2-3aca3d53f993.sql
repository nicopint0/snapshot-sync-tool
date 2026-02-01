-- Move patients_limited view to a non-API-exposed schema
-- This prevents it from being accessible via the REST API directly

-- Create a private schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;

-- Drop the public view
DROP VIEW IF EXISTS public.patients_limited CASCADE;

-- Recreate in private schema (not exposed via API)
CREATE VIEW private.patients_limited
WITH (security_invoker = true)
AS
SELECT * FROM public.get_patients_limited();

-- Grant access to authenticated users via the function
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT SELECT ON private.patients_limited TO authenticated;

-- Add comment
COMMENT ON VIEW private.patients_limited IS 'Secure view for limited patient data - not exposed via REST API';