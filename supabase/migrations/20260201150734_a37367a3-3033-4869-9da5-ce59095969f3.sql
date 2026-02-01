-- Logs de emails enviados
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL DEFAULT 'patient',
  recipient_id UUID,
  template_name VARCHAR(100) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  resend_id VARCHAR(255),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda
CREATE INDEX idx_email_logs_clinic ON email_logs(clinic_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_template ON email_logs(template_name);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);

-- Configuración de emails por clínica
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE UNIQUE,
  from_name VARCHAR(255),
  reply_to_email VARCHAR(255),
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  send_appointment_confirmation BOOLEAN DEFAULT true,
  send_appointment_reminder BOOLEAN DEFAULT true,
  send_appointment_cancelled BOOLEAN DEFAULT true,
  send_budget_created BOOLEAN DEFAULT true,
  send_payment_receipt BOOLEAN DEFAULT true,
  send_welcome_email BOOLEAN DEFAULT true,
  email_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columnas a appointments para tracking de emails
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_sent BOOLEAN DEFAULT false;

-- RLS Policies para email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic's email logs"
  ON email_logs FOR SELECT
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert email logs in their clinic"
  ON email_logs FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

-- RLS Policies para email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their clinic's email settings"
  ON email_settings FOR SELECT
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can manage their clinic's email settings"
  ON email_settings FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));