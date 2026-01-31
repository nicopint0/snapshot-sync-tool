-- 1. Create function to generate masked hints server-side
CREATE OR REPLACE FUNCTION public.get_secret_hint(secret TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF secret IS NULL OR length(secret) < 8 THEN 
    RETURN '';
  ELSE 
    RETURN '••••••••' || right(secret, 4);
  END IF;
END;
$$;

-- 2. Create RPC to get payment config with hints (without actual secrets)
CREATE OR REPLACE FUNCTION public.get_payment_config_safe(p_clinic_id UUID)
RETURNS TABLE (
  id UUID,
  stripe_enabled BOOLEAN,
  stripe_mode TEXT,
  stripe_publishable_key TEXT,
  stripe_secret_key_hint TEXT,
  stripe_webhook_secret_hint TEXT,
  mp_enabled BOOLEAN,
  mp_public_key TEXT,
  mp_access_token_hint TEXT,
  mp_country TEXT,
  default_currency TEXT,
  has_stripe_secret BOOLEAN,
  has_webhook_secret BOOLEAN,
  has_mp_access_token BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller has access to this clinic (RLS check)
  IF p_clinic_id != get_user_clinic_id(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Verify caller is admin (only admins can view payment config)
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied - admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    pc.id,
    COALESCE(pc.stripe_enabled, false),
    COALESCE(pc.stripe_mode, 'test'),
    pc.stripe_publishable_key,
    get_secret_hint(pc.stripe_secret_key),
    get_secret_hint(pc.stripe_webhook_secret),
    COALESCE(pc.mp_enabled, false),
    pc.mp_public_key,
    get_secret_hint(pc.mp_access_token),
    pc.mp_country,
    COALESCE(pc.default_currency, 'USD'),
    pc.stripe_secret_key IS NOT NULL AND pc.stripe_secret_key != '',
    pc.stripe_webhook_secret IS NOT NULL AND pc.stripe_webhook_secret != '',
    pc.mp_access_token IS NOT NULL AND pc.mp_access_token != ''
  FROM payment_config pc
  WHERE pc.clinic_id = p_clinic_id;
END;
$$;

-- 3. Create RPC to get WhatsApp config with hints (without actual secrets)
CREATE OR REPLACE FUNCTION public.get_whatsapp_config_safe(p_clinic_id UUID)
RETURNS TABLE (
  id UUID,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token_hint TEXT,
  verify_token TEXT,
  is_connected BOOLEAN,
  last_verified_at TIMESTAMPTZ,
  has_access_token BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller has access to this clinic (RLS check)
  IF p_clinic_id != get_user_clinic_id(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Verify caller is admin (only admins can view whatsapp config)
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied - admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    wc.id,
    wc.phone_number_id,
    wc.business_account_id,
    get_secret_hint(wc.access_token),
    wc.verify_token,
    COALESCE(wc.is_connected, false),
    wc.last_verified_at,
    wc.access_token IS NOT NULL AND wc.access_token != ''
  FROM whatsapp_config wc
  WHERE wc.clinic_id = p_clinic_id;
END;
$$;

-- 4. Create edge function to test WhatsApp connection (token never leaves server)
-- This will be done via edge function

-- 5. Add security_barrier to patients_limited view
ALTER VIEW public.patients_limited SET (security_barrier = true);

-- 6. Grant execute on new functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_secret_hint(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payment_config_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_whatsapp_config_safe(UUID) TO authenticated;