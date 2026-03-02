-- Fix booking errors securely: avoid public INSERT/UPDATE on clients table and use a SECURITY DEFINER RPC instead.

-- 1) Remove overly permissive public policies added previously
DROP POLICY IF EXISTS "Anyone can create clients for booking" ON public.clients;
DROP POLICY IF EXISTS "Anyone can update clients by email match" ON public.clients;

-- 2) Create a safe "get or create" RPC for booking flow
--    This prevents exposing clients table and avoids needing SELECT permission to return the inserted id.
CREATE OR REPLACE FUNCTION public.get_or_create_client_for_booking(
  _email text,
  _full_name text,
  _phone text,
  _birth_date date DEFAULT NULL,
  _is_minor boolean DEFAULT false,
  _guardian_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Normalize email match (case-insensitive)
  SELECT c.id
    INTO v_client_id
  FROM public.clients c
  WHERE lower(c.email) = lower(_email)
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    RETURN v_client_id;
  END IF;

  INSERT INTO public.clients (
    full_name,
    email,
    phone,
    birth_date,
    is_minor,
    guardian_name
  )
  VALUES (
    COALESCE(NULLIF(_full_name, ''), 'Cliente'),
    _email,
    COALESCE(NULLIF(_phone, ''), 'N/A'),
    _birth_date,
    COALESCE(_is_minor, false),
    NULLIF(_guardian_name, '')
  )
  RETURNING id INTO v_client_id;

  RETURN v_client_id;
END;
$$;

-- Allow both anonymous and authenticated visitors to use the booking RPC
GRANT EXECUTE ON FUNCTION public.get_or_create_client_for_booking(text, text, text, date, boolean, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_client_for_booking(text, text, text, date, boolean, text) TO authenticated;