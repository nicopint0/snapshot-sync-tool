-- Drop existing DELETE policy on patients if it exists
DROP POLICY IF EXISTS "Users can delete patients in their clinic" ON public.patients;

-- Add DELETE policy restricted to admins only
CREATE POLICY "Admins can delete patients in their clinic"
ON public.patients FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));