-- Expose minimal appointment + patient info for QR check-in without requiring direct access to clients table
-- This function runs with elevated privileges (SECURITY DEFINER), so it must return ONLY what is needed.
CREATE OR REPLACE FUNCTION public.get_checkin_appointment_info(_code text)
RETURNS TABLE (
  id uuid,
  code text,
  scheduled_date date,
  scheduled_time time,
  end_time time,
  modality public.appointment_modality,
  status public.appointment_status,
  checked_in_at timestamptz,
  client_full_name text,
  service_name text,
  service_duration_minutes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id,
    a.code,
    a.scheduled_date,
    a.scheduled_time,
    a.end_time,
    a.modality,
    a.status,
    a.checked_in_at,
    c.full_name as client_full_name,
    s.name as service_name,
    s.duration_minutes as service_duration_minutes
  FROM public.appointments a
  LEFT JOIN public.clients c ON c.id = a.client_id
  LEFT JOIN public.services s ON s.id = a.service_id
  WHERE a.code = _code
  ORDER BY a.created_at DESC
  LIMIT 1;
$$;