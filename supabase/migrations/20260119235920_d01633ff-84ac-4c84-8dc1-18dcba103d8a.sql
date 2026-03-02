-- Allow public to update access tracking fields on briefing_links
CREATE POLICY "Anyone can update access tracking"
ON public.briefing_links FOR UPDATE
USING (true)
WITH CHECK (true);

-- Since we can't restrict columns via RLS, let's use a trigger instead to handle this securely
-- Drop the overly permissive policy we just created
DROP POLICY IF EXISTS "Anyone can update access tracking" ON public.briefing_links;

-- Create a database function to safely increment access count
CREATE OR REPLACE FUNCTION public.increment_briefing_link_access(link_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.briefing_links 
  SET 
    access_count = access_count + 1,
    last_accessed_at = now()
  WHERE token = link_token AND is_active = true;
END;
$$;