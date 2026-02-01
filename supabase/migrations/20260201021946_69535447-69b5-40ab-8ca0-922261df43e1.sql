-- Create table for professional working hours
CREATE TABLE public.professional_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_working_day BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, day_of_week)
);

-- Enable Row Level Security
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view schedules in their clinic" 
ON public.professional_schedules 
FOR SELECT 
USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can insert schedules in their clinic" 
ON public.professional_schedules 
FOR INSERT 
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Users can update their own schedule" 
ON public.professional_schedules 
FOR UPDATE 
USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schedules in their clinic" 
ON public.professional_schedules 
FOR DELETE 
USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_professional_schedules_updated_at
BEFORE UPDATE ON public.professional_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();