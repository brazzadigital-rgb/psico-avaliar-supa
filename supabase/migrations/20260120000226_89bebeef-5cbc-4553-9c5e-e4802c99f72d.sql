-- Create a security definer function to submit briefing approval
CREATE OR REPLACE FUNCTION public.submit_briefing_approval(
  _token TEXT,
  _approver_name TEXT,
  _approver_email TEXT,
  _status TEXT,
  _notes TEXT,
  _responses JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_approval_id UUID;
  response_item JSONB;
BEGIN
  -- Validate that the token exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.briefing_links 
    WHERE token = _token AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive token';
  END IF;

  -- Insert the approval record
  INSERT INTO public.briefing_approvals (token, approver_name, approver_email, status, notes)
  VALUES (_token, _approver_name, _approver_email, _status, _notes)
  RETURNING id INTO new_approval_id;

  -- Insert checklist responses
  FOR response_item IN SELECT * FROM jsonb_array_elements(_responses)
  LOOP
    INSERT INTO public.briefing_checklist_responses (approval_id, item_id, decision, comment)
    VALUES (
      new_approval_id,
      (response_item->>'item_id')::UUID,
      response_item->>'decision',
      response_item->>'comment'
    );
  END LOOP;

  RETURN new_approval_id;
END;
$$;