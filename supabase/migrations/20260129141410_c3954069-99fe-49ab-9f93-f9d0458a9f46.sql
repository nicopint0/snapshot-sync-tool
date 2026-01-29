-- Add DELETE policy for treatments table (restricted to admins)
CREATE POLICY "Admins can delete treatments in their clinic"
ON public.treatments FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));