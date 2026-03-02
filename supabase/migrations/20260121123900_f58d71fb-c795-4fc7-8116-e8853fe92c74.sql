-- Allow all authenticated users to read public VAPID key for push subscription
-- Keep admin-only for updates (private key management)

-- Add a SELECT policy for authenticated users
CREATE POLICY "Authenticated users can read push config" 
ON public.push_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Note: The existing "Admins can manage push config" policy covers INSERT/UPDATE/DELETE for admins