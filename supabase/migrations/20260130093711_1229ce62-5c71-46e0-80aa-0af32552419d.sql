-- Table for WhatsApp Business API configuration
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  verify_token TEXT DEFAULT 'wh_verify_' || substr(gen_random_uuid()::text, 1, 12),
  is_connected BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_config
CREATE POLICY "Users can view their clinic whatsapp config"
ON public.whatsapp_config FOR SELECT
USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert their clinic whatsapp config"
ON public.whatsapp_config FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their clinic whatsapp config"
ON public.whatsapp_config FOR UPDATE
USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can delete whatsapp config"
ON public.whatsapp_config FOR DELETE
USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Table for payment gateway configuration
CREATE TABLE IF NOT EXISTS public.payment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Stripe configuration
  stripe_enabled BOOLEAN DEFAULT false,
  stripe_mode TEXT DEFAULT 'test',
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  stripe_webhook_secret TEXT,
  
  -- MercadoPago configuration
  mp_enabled BOOLEAN DEFAULT false,
  mp_public_key TEXT,
  mp_access_token TEXT,
  mp_country TEXT,
  
  -- Common settings
  default_currency TEXT DEFAULT 'USD',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT stripe_mode_check CHECK (stripe_mode IN ('test', 'live')),
  CONSTRAINT mp_country_check CHECK (mp_country IS NULL OR mp_country IN ('AR', 'BR', 'CL', 'CO', 'MX', 'PE', 'UY'))
);

-- Enable RLS
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_config
CREATE POLICY "Users can view their clinic payment config"
ON public.payment_config FOR SELECT
USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert their clinic payment config"
ON public.payment_config FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their clinic payment config"
ON public.payment_config FOR UPDATE
USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can delete payment config"
ON public.payment_config FOR DELETE
USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Function to seed demo treatments when a clinic is created
CREATE OR REPLACE FUNCTION public.seed_clinic_demo_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default treatment catalog
  INSERT INTO public.treatments (clinic_id, name, description, price, duration_minutes, category)
  VALUES
    (NEW.id, 'Limpieza dental', 'Limpieza profesional y pulido dental', 50.00, 45, 'Prevención'),
    (NEW.id, 'Blanqueamiento dental', 'Blanqueamiento dental profesional en consultorio', 200.00, 60, 'Estética'),
    (NEW.id, 'Extracción simple', 'Extracción de pieza dental no quirúrgica', 80.00, 30, 'Cirugía'),
    (NEW.id, 'Extracción de muela del juicio', 'Extracción quirúrgica de tercer molar', 150.00, 60, 'Cirugía'),
    (NEW.id, 'Resina (por superficie)', 'Restauración con resina compuesta fotopolimerizable', 40.00, 30, 'Restauración'),
    (NEW.id, 'Corona de porcelana', 'Corona dental de porcelana libre de metal', 350.00, 90, 'Prótesis'),
    (NEW.id, 'Endodoncia', 'Tratamiento de conducto radicular', 250.00, 90, 'Endodoncia'),
    (NEW.id, 'Consulta de ortodoncia', 'Evaluación inicial para tratamiento de ortodoncia', 0.00, 45, 'Ortodoncia'),
    (NEW.id, 'Brackets metálicos', 'Tratamiento de ortodoncia con brackets tradicionales', 1500.00, 60, 'Ortodoncia'),
    (NEW.id, 'Implante dental', 'Implante de titanio con corona de porcelana', 1200.00, 120, 'Implantes');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_clinic_created_seed ON public.clinics;
CREATE TRIGGER on_clinic_created_seed
AFTER INSERT ON public.clinics
FOR EACH ROW EXECUTE FUNCTION public.seed_clinic_demo_data();

-- Updated at trigger for whatsapp_config
CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON public.whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Updated at trigger for payment_config
CREATE TRIGGER update_payment_config_updated_at
BEFORE UPDATE ON public.payment_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();