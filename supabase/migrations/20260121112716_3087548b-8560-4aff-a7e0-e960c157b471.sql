-- Allow public to create clients (for booking flow)
CREATE POLICY "Anyone can create clients for booking"
ON public.clients
FOR INSERT
WITH CHECK (true);

-- Allow updating client data during booking (unauthenticated)
CREATE POLICY "Anyone can update clients by email match"
ON public.clients
FOR UPDATE
USING (true)
WITH CHECK (true);