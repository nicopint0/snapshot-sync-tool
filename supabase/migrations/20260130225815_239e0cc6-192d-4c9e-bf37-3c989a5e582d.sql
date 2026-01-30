-- Fix: whatsapp_config - Restrict SELECT to admins only (same pattern as payment_config)
-- WhatsApp access tokens are sensitive and should only be visible to admins

DROP POLICY IF EXISTS "Users can view their clinic whatsapp config" ON public.whatsapp_config;

CREATE POLICY "Only admins can view whatsapp config"
ON public.whatsapp_config FOR SELECT TO authenticated
USING (
  clinic_id = get_user_clinic_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);