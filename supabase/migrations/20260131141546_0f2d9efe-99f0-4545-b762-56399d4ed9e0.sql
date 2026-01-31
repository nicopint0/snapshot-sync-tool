-- Add unique constraint for odontogram entries (patient + tooth)
ALTER TABLE public.odontograms 
ADD CONSTRAINT odontograms_patient_tooth_unique UNIQUE (patient_id, tooth_number);