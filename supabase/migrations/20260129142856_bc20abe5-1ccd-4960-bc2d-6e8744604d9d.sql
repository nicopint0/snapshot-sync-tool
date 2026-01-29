-- Add explicit admin-only policies for user_roles table management

-- Allow only admins to INSERT roles within their clinic
CREATE POLICY "Only admins can assign roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') AND
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Allow only admins to UPDATE roles within their clinic
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Allow only admins to DELETE roles within their clinic
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') AND
  clinic_id = public.get_user_clinic_id(auth.uid())
);