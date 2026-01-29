-- Create enum for appointment statuses
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Create enum for payment statuses
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'dentist', 'assistant', 'receptionist');

-- Create enum for tooth conditions
CREATE TYPE public.tooth_condition AS ENUM ('healthy', 'cavity', 'filling', 'crown', 'extraction', 'implant', 'root_canal', 'bridge', 'veneer');

-- =====================================================
-- CLINICS TABLE (Multi-tenant support)
-- =====================================================
CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE (Links to auth.users)
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    specialty TEXT,
    license_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER ROLES TABLE (Secure role management)
-- =====================================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    UNIQUE (user_id, role, clinic_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PATIENTS TABLE
-- =====================================================
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    birth_date DATE,
    gender TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    allergies TEXT[],
    medications TEXT[],
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TREATMENTS TABLE (Catalog)
-- =====================================================
CREATE TABLE public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    duration_minutes INTEGER DEFAULT 30,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    dentist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ODONTOGRAM TABLE (Dental chart per patient)
-- =====================================================
CREATE TABLE public.odontograms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    tooth_number INTEGER NOT NULL CHECK (tooth_number >= 11 AND tooth_number <= 48),
    condition tooth_condition DEFAULT 'healthy',
    surfaces TEXT[], -- e.g., ['mesial', 'distal', 'occlusal', 'buccal', 'lingual']
    notes TEXT,
    treatment_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (patient_id, tooth_number)
);

ALTER TABLE public.odontograms ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BUDGETS TABLE
-- =====================================================
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BUDGET ITEMS TABLE
-- =====================================================
CREATE TABLE public.budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
    treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
    tooth_number INTEGER,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECURITY DEFINER FUNCTION (For RLS)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT clinic_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Clinics: Users can only see their own clinic
CREATE POLICY "Users can view their clinic"
ON public.clinics FOR SELECT
TO authenticated
USING (id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins can update their clinic"
ON public.clinics FOR UPDATE
TO authenticated
USING (id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view profiles in their clinic
CREATE POLICY "Users can view profiles in their clinic"
ON public.profiles FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- User Roles: Only admins can manage roles
CREATE POLICY "Users can view roles in their clinic"
ON public.user_roles FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Patients: Clinic members can manage patients
CREATE POLICY "Users can view patients in their clinic"
ON public.patients FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert patients in their clinic"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update patients in their clinic"
ON public.patients FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete patients in their clinic"
ON public.patients FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Treatments: Clinic members can manage treatments
CREATE POLICY "Users can view treatments in their clinic"
ON public.treatments FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert treatments in their clinic"
ON public.treatments FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update treatments in their clinic"
ON public.treatments FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Appointments: Clinic members can manage appointments
CREATE POLICY "Users can view appointments in their clinic"
ON public.appointments FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert appointments in their clinic"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update appointments in their clinic"
ON public.appointments FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can delete appointments in their clinic"
ON public.appointments FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Odontograms: Access through patient's clinic
CREATE POLICY "Users can view odontograms for their clinic patients"
ON public.odontograms FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = patient_id
        AND p.clinic_id = public.get_user_clinic_id(auth.uid())
    )
);

CREATE POLICY "Users can manage odontograms for their clinic patients"
ON public.odontograms FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.patients p
        WHERE p.id = patient_id
        AND p.clinic_id = public.get_user_clinic_id(auth.uid())
    )
);

-- Budgets: Clinic members can manage budgets
CREATE POLICY "Users can view budgets in their clinic"
ON public.budgets FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert budgets in their clinic"
ON public.budgets FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update budgets in their clinic"
ON public.budgets FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Budget Items: Access through budget's clinic
CREATE POLICY "Users can manage budget items"
ON public.budget_items FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.budgets b
        WHERE b.id = budget_id
        AND b.clinic_id = public.get_user_clinic_id(auth.uid())
    )
);

-- Payments: Clinic members can manage payments
CREATE POLICY "Users can view payments in their clinic"
ON public.payments FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert payments in their clinic"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()));

-- =====================================================
-- TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_odontograms_updated_at BEFORE UPDATE ON public.odontograms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER: AUTO-CREATE CLINIC + PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_clinic_id UUID;
BEGIN
    -- Create a new clinic for the user
    INSERT INTO public.clinics (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'clinic_name', 'Mi Clínica'))
    RETURNING id INTO new_clinic_id;
    
    -- Create profile linked to the clinic
    INSERT INTO public.profiles (user_id, clinic_id, first_name, last_name, email)
    VALUES (
        NEW.id,
        new_clinic_id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    );
    
    -- Assign admin role to the new user
    INSERT INTO public.user_roles (user_id, role, clinic_id)
    VALUES (NEW.id, 'admin', new_clinic_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();