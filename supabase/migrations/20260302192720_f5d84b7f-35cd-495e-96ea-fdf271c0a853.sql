-- Function to get the professional_id linked to a user
CREATE OR REPLACE FUNCTION public.get_professional_id_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.professionals
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- RLS policy: professionals can read their own appointments
CREATE POLICY "Professionals can read own appointments"
ON public.appointments
FOR SELECT
USING (
  professional_id = public.get_professional_id_for_user(auth.uid())
);