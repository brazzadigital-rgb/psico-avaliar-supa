-- Fix orders RLS - drop restrictive policies and recreate as permissive
-- This allows public booking to create orders

-- Drop existing policies on orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Recreate as PERMISSIVE policies (default, uses OR logic)
CREATE POLICY "Admins can manage orders" 
ON public.orders 
FOR ALL 
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Clients can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Allow anyone (including anonymous) to create orders for public booking
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow system updates (for payment webhooks)
CREATE POLICY "System can update orders" 
ON public.orders 
FOR UPDATE 
USING (true)
WITH CHECK (true);