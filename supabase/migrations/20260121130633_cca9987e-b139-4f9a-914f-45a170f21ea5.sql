-- Fix public booking: ensure orders INSERT policy applies to all roles
-- and remove overly permissive UPDATE policy added previously.

-- Remove unsafe broad update policy (webhooks use service role and bypass RLS)
DROP POLICY IF EXISTS "System can update orders" ON public.orders;

-- Recreate INSERT policy without restricting roles (defaults to PUBLIC)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Optional hardening: prevent admins policy from affecting INSERT checks
-- (keep admin-all but without WITH CHECK to avoid any unexpected insert interactions)
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders"
ON public.orders
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));