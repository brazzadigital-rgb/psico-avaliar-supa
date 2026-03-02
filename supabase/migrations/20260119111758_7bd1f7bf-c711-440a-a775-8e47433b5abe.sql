-- Password reset tokens table
CREATE TABLE public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Email logs table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template_key text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Appointment audit logs table
CREATE TABLE public.appointment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  action text NOT NULL,
  by_user_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view appointment logs" ON public.appointment_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert appointment logs" ON public.appointment_logs
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Add video conferencing fields to appointments
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS video_provider text,
  ADD COLUMN IF NOT EXISTS video_link text,
  ADD COLUMN IF NOT EXISTS video_event_id text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo';

-- Update clients table to link with auth.users
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS lgpd_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_consent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS notification_email boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_whatsapp boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_modality text DEFAULT 'presencial';

-- RLS policy for clients to view their own data
CREATE POLICY "Clients can view own data" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clients can update own data" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policy for clients to view their own appointments
CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

-- Create function to check if user is a client
CREATE OR REPLACE FUNCTION public.is_client(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'client'
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Google OAuth tokens table (encrypted storage)
CREATE TABLE public.google_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamp with time zone,
  calendar_id text DEFAULT 'primary',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage google integrations" ON public.google_integrations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create auth_logs table for security
CREATE TABLE public.auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view auth logs" ON public.auth_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- Fix the permissive RLS policies from previous migration
DROP POLICY IF EXISTS "System can insert appointment logs" ON public.appointment_logs;
DROP POLICY IF EXISTS "Anyone can create appointments " ON public.appointments;

-- Create secure policy for appointment creation (clients and admins)
CREATE POLICY "Authenticated users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      is_admin(auth.uid()) OR 
      is_client(auth.uid())
    )
  );