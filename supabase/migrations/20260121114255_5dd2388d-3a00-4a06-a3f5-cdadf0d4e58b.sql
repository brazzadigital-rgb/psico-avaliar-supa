-- Create a secure RPC to link user_id to existing client after registration
CREATE OR REPLACE FUNCTION public.link_user_to_client(
  _user_id uuid,
  _email text,
  _full_name text,
  _phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Try to find existing client by email (case-insensitive)
  SELECT c.id INTO v_client_id
  FROM public.clients c
  WHERE lower(c.email) = lower(_email)
    AND c.user_id IS NULL
  ORDER BY c.created_at DESC
  LIMIT 1;

  IF v_client_id IS NOT NULL THEN
    -- Link existing client to user account
    UPDATE public.clients
    SET 
      user_id = _user_id,
      full_name = COALESCE(NULLIF(_full_name, ''), full_name),
      phone = COALESCE(NULLIF(_phone, ''), phone),
      lgpd_consent = true,
      lgpd_consent_at = now()
    WHERE id = v_client_id;
    
    RETURN v_client_id;
  END IF;

  -- No existing client found, create new one
  INSERT INTO public.clients (
    full_name,
    email,
    phone,
    user_id,
    lgpd_consent,
    lgpd_consent_at
  )
  VALUES (
    COALESCE(NULLIF(_full_name, ''), 'Cliente'),
    lower(_email),
    COALESCE(NULLIF(_phone, ''), 'N/A'),
    _user_id,
    true,
    now()
  )
  RETURNING id INTO v_client_id;

  RETURN v_client_id;
END;
$$;

-- Grant execute to authenticated users (they just registered)
GRANT EXECUTE ON FUNCTION public.link_user_to_client(uuid, text, text, text) TO authenticated;