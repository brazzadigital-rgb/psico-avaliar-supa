
-- =============================================
-- EXTENSÕES
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =============================================
-- TIPOS ENUM
-- =============================================
DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('pending','confirmed','rescheduled','canceled','completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','receptionist','professional','client');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_modality AS ENUM ('presencial','online');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  price NUMERIC(10,2),
  modalities public.appointment_modality[] NOT NULL DEFAULT '{presencial}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  price_mode TEXT NOT NULL DEFAULT 'fixed',
  price_from_amount NUMERIC(10,2),
  currency TEXT NOT NULL DEFAULT 'BRL',
  allow_installments BOOLEAN NOT NULL DEFAULT false,
  max_installments INTEGER NOT NULL DEFAULT 1,
  require_payment_to_confirm BOOLEAN NOT NULL DEFAULT false,
  payment_type TEXT NOT NULL DEFAULT 'none',
  deposit_amount NUMERIC(10,2),
  show_price_publicly BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- professionals
CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  registration_number TEXT,
  bio TEXT,
  specialties TEXT[],
  modalities public.appointment_modality[] NOT NULL DEFAULT '{presencial}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- professional_services
CREATE TABLE IF NOT EXISTS public.professional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, service_id)
);

-- availability_rules
CREATE TABLE IF NOT EXISTS public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- time_off_blocks
CREATE TABLE IF NOT EXISTS public.time_off_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date DATE,
  is_minor BOOLEAN NOT NULL DEFAULT false,
  guardian_name TEXT,
  notes TEXT,
  tags TEXT[],
  lgpd_consent BOOLEAN NOT NULL DEFAULT false,
  lgpd_consent_at TIMESTAMPTZ,
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_whatsapp BOOLEAN NOT NULL DEFAULT false,
  preferred_modality public.appointment_modality,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  end_time TIME NOT NULL,
  modality public.appointment_modality NOT NULL DEFAULT 'presencial',
  status public.appointment_status NOT NULL DEFAULT 'pending',
  reason_for_visit TEXT,
  online_meeting_link TEXT,
  internal_notes TEXT,
  canceled_reason TEXT,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_2h_sent BOOLEAN NOT NULL DEFAULT false,
  video_provider TEXT,
  video_link TEXT,
  video_event_id TEXT,
  location_address TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- contact_messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- password_resets
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointment_logs
CREATE TABLE IF NOT EXISTS public.appointment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status public.appointment_status,
  new_status public.appointment_status,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- google_integrations
CREATE TABLE IF NOT EXISTS public.google_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  calendar_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- auth_logs
CREATE TABLE IF NOT EXISTS public.auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blog_categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blog_tags
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blog_posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  gallery_images TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- blog_post_tags
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);

-- site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- media_assets
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  sessions_included INTEGER,
  features JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- date_overrides
CREATE TABLE IF NOT EXISTS public.date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professional_id, override_date)
);

-- briefing_links
CREATE TABLE IF NOT EXISTS public.briefing_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  client_name TEXT NOT NULL,
  client_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  max_accesses INTEGER NOT NULL DEFAULT 1,
  current_accesses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- briefing_link_access_logs
CREATE TABLE IF NOT EXISTS public.briefing_link_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_link_id UUID NOT NULL REFERENCES public.briefing_links(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- briefing_checklist_items
CREATE TABLE IF NOT EXISTS public.briefing_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- briefing_approvals
CREATE TABLE IF NOT EXISTS public.briefing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_link_id UUID NOT NULL REFERENCES public.briefing_links(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  signature_data TEXT
);

-- briefing_checklist_responses
CREATE TABLE IF NOT EXISTS public.briefing_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES public.briefing_approvals(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.briefing_checklist_items(id) ON DELETE CASCADE,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(approval_id, checklist_item_id)
);

-- briefing_content
CREATE TABLE IF NOT EXISTS public.briefing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  permission_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- role_permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- user_permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- invites
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'receptionist',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payment_provider_configs
CREATE TABLE IF NOT EXISTS public.payment_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  checkout_token TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  method TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending',
  installments INTEGER NOT NULL DEFAULT 1,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payment_refunds
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_refund_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- webhook_events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payment_settings
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  categories JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notification_jobs
CREATE TABLE IF NOT EXISTS public.notification_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id, job_type)
);

-- system_health_logs
CREATE TABLE IF NOT EXISTS public.system_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- push_config
CREATE TABLE IF NOT EXISTS public.push_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vapid_public_key TEXT,
  vapid_private_key TEXT,
  vapid_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- checkout_rate_limits
CREATE TABLE IF NOT EXISTS public.checkout_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- RLS
-- =============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_link_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_rate_limits ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNÇÕES
-- =============================================

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- is_client
CREATE OR REPLACE FUNCTION public.is_client(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'client'
  );
$$;

-- get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- generate_appointment_code
CREATE OR REPLACE FUNCTION public.generate_appointment_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'PSI-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- generate_briefing_token
CREATE OR REPLACE FUNCTION public.generate_briefing_token()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(32), 'hex');
$$;

-- increment_briefing_link_access
CREATE OR REPLACE FUNCTION public.increment_briefing_link_access(_link_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.briefing_links
  SET current_accesses = current_accesses + 1
  WHERE id = _link_id;
END;
$$;

-- submit_briefing_approval
CREATE OR REPLACE FUNCTION public.submit_briefing_approval(
  _link_id UUID,
  _client_name TEXT,
  _client_email TEXT,
  _ip TEXT,
  _user_agent TEXT,
  _signature TEXT,
  _responses JSONB
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _approval_id UUID;
  _item JSONB;
BEGIN
  INSERT INTO public.briefing_approvals (briefing_link_id, client_name, client_email, ip_address, user_agent, signature_data)
  VALUES (_link_id, _client_name, _client_email, _ip, _user_agent, _signature)
  RETURNING id INTO _approval_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_responses)
  LOOP
    INSERT INTO public.briefing_checklist_responses (approval_id, checklist_item_id, is_checked)
    VALUES (_approval_id, (_item->>'checklist_item_id')::UUID, (_item->>'is_checked')::BOOLEAN);
  END LOOP;

  RETURN _approval_id;
END;
$$;

-- has_permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _has BOOLEAN;
BEGIN
  IF public.is_admin(_user_id) THEN RETURN TRUE; END IF;

  SELECT role INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF _role IS NULL THEN RETURN FALSE; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions up
    JOIN public.permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id AND p.permission_key = _permission_key AND up.granted = true
  ) INTO _has;
  IF _has THEN RETURN TRUE; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role = _role AND p.permission_key = _permission_key
  ) INTO _has;

  IF _has THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM public.user_permissions up
      JOIN public.permissions p ON p.id = up.permission_id
      WHERE up.user_id = _user_id AND p.permission_key = _permission_key AND up.granted = false
    ) INTO _has;
  END IF;

  RETURN _has;
END;
$$;

-- get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE(permission_key TEXT, permission_name TEXT, category TEXT, source TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
BEGIN
  SELECT role INTO _role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  IF _role IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT DISTINCT p.permission_key, p.permission_name, p.category,
    CASE
      WHEN up.id IS NOT NULL AND up.granted THEN 'user_override'
      ELSE 'role'
    END AS source
  FROM public.permissions p
  LEFT JOIN public.role_permissions rp ON rp.permission_id = p.id AND rp.role = _role
  LEFT JOIN public.user_permissions up ON up.permission_id = p.id AND up.user_id = _user_id
  WHERE (rp.id IS NOT NULL OR (up.id IS NOT NULL AND up.granted = true))
    AND NOT EXISTS (
      SELECT 1 FROM public.user_permissions up2
      WHERE up2.permission_id = p.id AND up2.user_id = _user_id AND up2.granted = false
    );
END;
$$;

-- generate_order_code
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$$;

-- get_checkin_appointment_info
CREATE OR REPLACE FUNCTION public.get_checkin_appointment_info(_code TEXT)
RETURNS TABLE(
  appointment_id UUID, status public.appointment_status,
  scheduled_date DATE, scheduled_time TIME,
  client_name TEXT, service_name TEXT, professional_name TEXT,
  modality public.appointment_modality, checked_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.status, a.scheduled_date, a.scheduled_time,
    c.full_name, s.name, p.name,
    a.modality, a.checked_in_at
  FROM public.appointments a
  LEFT JOIN public.clients c ON c.id = a.client_id
  LEFT JOIN public.services s ON s.id = a.service_id
  LEFT JOIN public.professionals p ON p.id = a.professional_id
  WHERE a.code = _code;
END;
$$;

-- get_or_create_client_for_booking
CREATE OR REPLACE FUNCTION public.get_or_create_client_for_booking(
  _name TEXT, _email TEXT, _phone TEXT, _birth_date DATE DEFAULT NULL,
  _is_minor BOOLEAN DEFAULT false, _guardian TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _client_id UUID;
BEGIN
  SELECT id INTO _client_id FROM public.clients WHERE email = _email LIMIT 1;
  IF _client_id IS NULL THEN
    INSERT INTO public.clients (full_name, email, phone, birth_date, is_minor, guardian_name)
    VALUES (_name, _email, _phone, _birth_date, _is_minor, _guardian)
    RETURNING id INTO _client_id;
  ELSE
    UPDATE public.clients SET full_name = _name, phone = _phone,
      birth_date = COALESCE(_birth_date, birth_date),
      is_minor = _is_minor, guardian_name = COALESCE(_guardian, guardian_name),
      updated_at = now()
    WHERE id = _client_id;
  END IF;
  RETURN _client_id;
END;
$$;

-- link_user_to_client
CREATE OR REPLACE FUNCTION public.link_user_to_client()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clients SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  RETURN NEW;
END;
$$;

-- create_notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _recipient_id UUID, _title TEXT, _body TEXT,
  _category TEXT DEFAULT 'general', _link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _id UUID;
BEGIN
  INSERT INTO public.notifications (recipient_id, title, body, category, link)
  VALUES (_recipient_id, _title, _body, _category, _link)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- get_unread_notification_count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.notifications
  WHERE recipient_id = _user_id AND is_read = false;
$$;

-- mark_notifications_read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(_user_id UUID, _ids UUID[] DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _ids IS NULL THEN
    UPDATE public.notifications SET is_read = true, read_at = now()
    WHERE recipient_id = _user_id AND is_read = false;
  ELSE
    UPDATE public.notifications SET is_read = true, read_at = now()
    WHERE recipient_id = _user_id AND id = ANY(_ids) AND is_read = false;
  END IF;
END;
$$;

-- schedule_appointment_reminders
CREATE OR REPLACE FUNCTION public.schedule_appointment_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _dt TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'confirmed' THEN
    _dt := (NEW.scheduled_date || ' ' || NEW.scheduled_time)::TIMESTAMPTZ;
    INSERT INTO public.notification_jobs (appointment_id, job_type, scheduled_for)
    VALUES (NEW.id, '24h_reminder', _dt - interval '24 hours')
    ON CONFLICT (appointment_id, job_type) DO UPDATE SET scheduled_for = EXCLUDED.scheduled_for, status = 'pending';

    INSERT INTO public.notification_jobs (appointment_id, job_type, scheduled_for)
    VALUES (NEW.id, '2h_reminder', _dt - interval '2 hours')
    ON CONFLICT (appointment_id, job_type) DO UPDATE SET scheduled_for = EXCLUDED.scheduled_for, status = 'pending';
  ELSIF NEW.status IN ('canceled', 'rescheduled') THEN
    UPDATE public.notification_jobs SET status = 'canceled'
    WHERE appointment_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- generate_checkout_token
CREATE OR REPLACE FUNCTION public.generate_checkout_token()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT encode(gen_random_bytes(32), 'hex');
$$;

-- set_checkout_token
CREATE OR REPLACE FUNCTION public.set_checkout_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.checkout_token IS NULL THEN
    NEW.checkout_token := public.generate_checkout_token();
  END IF;
  RETURN NEW;
END;
$$;

-- check_checkout_rate_limit
CREATE OR REPLACE FUNCTION public.check_checkout_rate_limit(_ip_hash TEXT, _max_attempts INTEGER DEFAULT 10, _window_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _rec RECORD;
BEGIN
  SELECT * INTO _rec FROM public.checkout_rate_limits WHERE ip_hash = _ip_hash;
  IF NOT FOUND THEN
    INSERT INTO public.checkout_rate_limits (ip_hash) VALUES (_ip_hash);
    RETURN TRUE;
  END IF;
  IF _rec.first_attempt_at < now() - (_window_minutes || ' minutes')::interval THEN
    UPDATE public.checkout_rate_limits SET attempts = 1, first_attempt_at = now(), last_attempt_at = now() WHERE ip_hash = _ip_hash;
    RETURN TRUE;
  END IF;
  IF _rec.attempts >= _max_attempts THEN RETURN FALSE; END IF;
  UPDATE public.checkout_rate_limits SET attempts = attempts + 1, last_attempt_at = now() WHERE ip_hash = _ip_hash;
  RETURN TRUE;
END;
$$;

-- get_checkout_order
CREATE OR REPLACE FUNCTION public.get_checkout_order(_token TEXT)
RETURNS TABLE(
  order_id UUID, order_code TEXT, order_status TEXT, total_amount NUMERIC,
  currency TEXT, client_name TEXT, client_email TEXT, client_phone TEXT,
  items JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.code, o.status, o.total_amount, o.currency,
    c.full_name, c.email, c.phone,
    COALESCE(jsonb_agg(jsonb_build_object(
      'description', oi.description, 'quantity', oi.quantity,
      'unit_price', oi.unit_price, 'total_price', oi.total_price
    )) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb)
  FROM public.orders o
  LEFT JOIN public.clients c ON c.id = o.client_id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  WHERE o.checkout_token = _token AND o.status = 'pending'
  GROUP BY o.id, o.code, o.status, o.total_amount, o.currency, c.full_name, c.email, c.phone;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================
DROP TRIGGER IF EXISTS set_appointment_code ON public.appointments;
CREATE TRIGGER set_appointment_code
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_appointment_code();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS generate_order_code_trigger ON public.orders;
CREATE TRIGGER generate_order_code_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.generate_order_code();

DROP TRIGGER IF EXISTS trigger_schedule_appointment_reminders ON public.appointments;
CREATE TRIGGER trigger_schedule_appointment_reminders
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.schedule_appointment_reminders();

DROP TRIGGER IF EXISTS trigger_set_checkout_token ON public.orders;
CREATE TRIGGER trigger_set_checkout_token
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_checkout_token();

-- =============================================
-- ÍNDICES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON public.notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_checkout_rate_limits_ip_hash ON public.checkout_rate_limits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_token ON public.orders(checkout_token);

-- =============================================
-- POLICIES
-- =============================================

-- user_roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- services (public read)
DROP POLICY IF EXISTS "Anyone can read active services" ON public.services;
CREATE POLICY "Anyone can read active services" ON public.services FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (public.has_permission(auth.uid(), 'services.manage'));

-- professionals (public read)
DROP POLICY IF EXISTS "Anyone can read active professionals" ON public.professionals;
CREATE POLICY "Anyone can read active professionals" ON public.professionals FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage professionals" ON public.professionals;
CREATE POLICY "Admins can manage professionals" ON public.professionals FOR ALL USING (public.has_permission(auth.uid(), 'professionals.manage'));

-- professional_services
DROP POLICY IF EXISTS "Anyone can read professional services" ON public.professional_services;
CREATE POLICY "Anyone can read professional services" ON public.professional_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage professional services" ON public.professional_services;
CREATE POLICY "Admins can manage professional services" ON public.professional_services FOR ALL USING (public.has_permission(auth.uid(), 'professionals.manage'));

-- availability_rules
DROP POLICY IF EXISTS "Anyone can read active availability" ON public.availability_rules;
CREATE POLICY "Anyone can read active availability" ON public.availability_rules FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage availability" ON public.availability_rules;
CREATE POLICY "Admins can manage availability" ON public.availability_rules FOR ALL USING (public.has_permission(auth.uid(), 'availability.manage'));

-- time_off_blocks
DROP POLICY IF EXISTS "Anyone can read time off blocks" ON public.time_off_blocks;
CREATE POLICY "Anyone can read time off blocks" ON public.time_off_blocks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage time off" ON public.time_off_blocks;
CREATE POLICY "Admins can manage time off" ON public.time_off_blocks FOR ALL USING (public.has_permission(auth.uid(), 'availability.manage'));

-- clients
DROP POLICY IF EXISTS "Admin/receptionist can read clients" ON public.clients;
CREATE POLICY "Admin/receptionist can read clients" ON public.clients FOR SELECT USING (public.has_permission(auth.uid(), 'clients.read'));
DROP POLICY IF EXISTS "Admin/receptionist can manage clients" ON public.clients;
CREATE POLICY "Admin/receptionist can manage clients" ON public.clients FOR ALL USING (public.has_permission(auth.uid(), 'clients.manage'));
DROP POLICY IF EXISTS "Clients can read own record" ON public.clients;
CREATE POLICY "Clients can read own record" ON public.clients FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can insert clients via booking" ON public.clients;
CREATE POLICY "Anyone can insert clients via booking" ON public.clients FOR INSERT WITH CHECK (true);

-- appointments
DROP POLICY IF EXISTS "Staff can read appointments" ON public.appointments;
CREATE POLICY "Staff can read appointments" ON public.appointments FOR SELECT USING (public.has_permission(auth.uid(), 'appointments.read'));
DROP POLICY IF EXISTS "Staff can manage appointments" ON public.appointments;
CREATE POLICY "Staff can manage appointments" ON public.appointments FOR ALL USING (public.has_permission(auth.uid(), 'appointments.manage'));
DROP POLICY IF EXISTS "Clients can read own appointments" ON public.appointments;
CREATE POLICY "Clients can read own appointments" ON public.appointments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.clients c WHERE c.id = client_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Anyone can insert appointments via booking" ON public.appointments;
CREATE POLICY "Anyone can insert appointments via booking" ON public.appointments FOR INSERT WITH CHECK (true);

-- contact_messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin can read contact messages" ON public.contact_messages;
CREATE POLICY "Admin can read contact messages" ON public.contact_messages FOR SELECT USING (public.has_permission(auth.uid(), 'messages.read'));
DROP POLICY IF EXISTS "Admin can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admin can manage contact messages" ON public.contact_messages FOR ALL USING (public.has_permission(auth.uid(), 'messages.manage'));

-- password_resets
DROP POLICY IF EXISTS "Admin can manage password resets" ON public.password_resets;
CREATE POLICY "Admin can manage password resets" ON public.password_resets FOR ALL USING (public.is_admin(auth.uid()));

-- email_logs
DROP POLICY IF EXISTS "Admin can read email logs" ON public.email_logs;
CREATE POLICY "Admin can read email logs" ON public.email_logs FOR SELECT USING (public.has_permission(auth.uid(), 'email_templates.read'));
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;
CREATE POLICY "Service role can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true);

-- appointment_logs
DROP POLICY IF EXISTS "Staff can read appointment logs" ON public.appointment_logs;
CREATE POLICY "Staff can read appointment logs" ON public.appointment_logs FOR SELECT USING (public.has_permission(auth.uid(), 'appointments.read'));
DROP POLICY IF EXISTS "Service can insert appointment logs" ON public.appointment_logs;
CREATE POLICY "Service can insert appointment logs" ON public.appointment_logs FOR INSERT WITH CHECK (true);

-- google_integrations
DROP POLICY IF EXISTS "Users can manage own google integration" ON public.google_integrations;
CREATE POLICY "Users can manage own google integration" ON public.google_integrations FOR ALL USING (auth.uid() = user_id);

-- auth_logs
DROP POLICY IF EXISTS "Admin can read auth logs" ON public.auth_logs;
CREATE POLICY "Admin can read auth logs" ON public.auth_logs FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Service can insert auth logs" ON public.auth_logs;
CREATE POLICY "Service can insert auth logs" ON public.auth_logs FOR INSERT WITH CHECK (true);

-- blog_categories (public read)
DROP POLICY IF EXISTS "Anyone can read blog categories" ON public.blog_categories;
CREATE POLICY "Anyone can read blog categories" ON public.blog_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage blog categories" ON public.blog_categories;
CREATE POLICY "Admin can manage blog categories" ON public.blog_categories FOR ALL USING (public.has_permission(auth.uid(), 'blog.manage'));

-- blog_tags (public read)
DROP POLICY IF EXISTS "Anyone can read blog tags" ON public.blog_tags;
CREATE POLICY "Anyone can read blog tags" ON public.blog_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage blog tags" ON public.blog_tags;
CREATE POLICY "Admin can manage blog tags" ON public.blog_tags FOR ALL USING (public.has_permission(auth.uid(), 'blog.manage'));

-- blog_posts (public read published)
DROP POLICY IF EXISTS "Anyone can read published posts" ON public.blog_posts;
CREATE POLICY "Anyone can read published posts" ON public.blog_posts FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "Staff can read all posts" ON public.blog_posts;
CREATE POLICY "Staff can read all posts" ON public.blog_posts FOR SELECT USING (public.has_permission(auth.uid(), 'blog.read'));
DROP POLICY IF EXISTS "Staff can manage posts" ON public.blog_posts;
CREATE POLICY "Staff can manage posts" ON public.blog_posts FOR ALL USING (public.has_permission(auth.uid(), 'blog.manage'));

-- blog_post_tags
DROP POLICY IF EXISTS "Anyone can read post tags" ON public.blog_post_tags;
CREATE POLICY "Anyone can read post tags" ON public.blog_post_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff can manage post tags" ON public.blog_post_tags;
CREATE POLICY "Staff can manage post tags" ON public.blog_post_tags FOR ALL USING (public.has_permission(auth.uid(), 'blog.manage'));

-- site_settings
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage site settings" ON public.site_settings;
CREATE POLICY "Admin can manage site settings" ON public.site_settings FOR ALL USING (public.has_permission(auth.uid(), 'settings.manage'));

-- email_templates
DROP POLICY IF EXISTS "Staff can read email templates" ON public.email_templates;
CREATE POLICY "Staff can read email templates" ON public.email_templates FOR SELECT USING (public.has_permission(auth.uid(), 'email_templates.read'));
DROP POLICY IF EXISTS "Admin can manage email templates" ON public.email_templates;
CREATE POLICY "Admin can manage email templates" ON public.email_templates FOR ALL USING (public.has_permission(auth.uid(), 'email_templates.manage'));

-- media_assets
DROP POLICY IF EXISTS "Staff can read media" ON public.media_assets;
CREATE POLICY "Staff can read media" ON public.media_assets FOR SELECT USING (public.has_permission(auth.uid(), 'media.read'));
DROP POLICY IF EXISTS "Staff can manage media" ON public.media_assets;
CREATE POLICY "Staff can manage media" ON public.media_assets FOR ALL USING (public.has_permission(auth.uid(), 'media.manage'));

-- audit_logs
DROP POLICY IF EXISTS "Admin can read audit logs" ON public.audit_logs;
CREATE POLICY "Admin can read audit logs" ON public.audit_logs FOR SELECT USING (public.has_permission(auth.uid(), 'audit_logs.read'));
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- plans
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
CREATE POLICY "Anyone can read active plans" ON public.plans FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin can manage plans" ON public.plans;
CREATE POLICY "Admin can manage plans" ON public.plans FOR ALL USING (public.has_permission(auth.uid(), 'plans.manage'));

-- date_overrides
DROP POLICY IF EXISTS "Anyone can read date overrides" ON public.date_overrides;
CREATE POLICY "Anyone can read date overrides" ON public.date_overrides FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage date overrides" ON public.date_overrides;
CREATE POLICY "Admin can manage date overrides" ON public.date_overrides FOR ALL USING (public.has_permission(auth.uid(), 'availability.manage'));

-- briefing_links
DROP POLICY IF EXISTS "Admin can manage briefing links" ON public.briefing_links;
CREATE POLICY "Admin can manage briefing links" ON public.briefing_links FOR ALL USING (public.has_permission(auth.uid(), 'briefing.manage'));
DROP POLICY IF EXISTS "Anyone can read active briefing links by token" ON public.briefing_links;
CREATE POLICY "Anyone can read active briefing links by token" ON public.briefing_links FOR SELECT USING (is_active = true);

-- briefing_link_access_logs
DROP POLICY IF EXISTS "Admin can read briefing access logs" ON public.briefing_link_access_logs;
CREATE POLICY "Admin can read briefing access logs" ON public.briefing_link_access_logs FOR SELECT USING (public.has_permission(auth.uid(), 'briefing.read'));
DROP POLICY IF EXISTS "Anyone can insert briefing access logs" ON public.briefing_link_access_logs;
CREATE POLICY "Anyone can insert briefing access logs" ON public.briefing_link_access_logs FOR INSERT WITH CHECK (true);

-- briefing_checklist_items
DROP POLICY IF EXISTS "Anyone can read checklist items" ON public.briefing_checklist_items;
CREATE POLICY "Anyone can read checklist items" ON public.briefing_checklist_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage checklist items" ON public.briefing_checklist_items;
CREATE POLICY "Admin can manage checklist items" ON public.briefing_checklist_items FOR ALL USING (public.has_permission(auth.uid(), 'briefing.manage'));

-- briefing_approvals
DROP POLICY IF EXISTS "Admin can read briefing approvals" ON public.briefing_approvals;
CREATE POLICY "Admin can read briefing approvals" ON public.briefing_approvals FOR SELECT USING (public.has_permission(auth.uid(), 'briefing.read'));
DROP POLICY IF EXISTS "Anyone can insert briefing approvals" ON public.briefing_approvals;
CREATE POLICY "Anyone can insert briefing approvals" ON public.briefing_approvals FOR INSERT WITH CHECK (true);

-- briefing_checklist_responses
DROP POLICY IF EXISTS "Admin can read checklist responses" ON public.briefing_checklist_responses;
CREATE POLICY "Admin can read checklist responses" ON public.briefing_checklist_responses FOR SELECT USING (public.has_permission(auth.uid(), 'briefing.read'));
DROP POLICY IF EXISTS "Anyone can insert checklist responses" ON public.briefing_checklist_responses;
CREATE POLICY "Anyone can insert checklist responses" ON public.briefing_checklist_responses FOR INSERT WITH CHECK (true);

-- briefing_content
DROP POLICY IF EXISTS "Anyone can read briefing content" ON public.briefing_content;
CREATE POLICY "Anyone can read briefing content" ON public.briefing_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage briefing content" ON public.briefing_content;
CREATE POLICY "Admin can manage briefing content" ON public.briefing_content FOR ALL USING (public.has_permission(auth.uid(), 'briefing.manage'));

-- permissions
DROP POLICY IF EXISTS "Admin can read permissions" ON public.permissions;
CREATE POLICY "Admin can read permissions" ON public.permissions FOR SELECT USING (public.has_permission(auth.uid(), 'permissions.read'));
DROP POLICY IF EXISTS "Authenticated can read permissions" ON public.permissions;
CREATE POLICY "Authenticated can read permissions" ON public.permissions FOR SELECT USING (auth.uid() IS NOT NULL);

-- role_permissions
DROP POLICY IF EXISTS "Admin can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admin can manage role permissions" ON public.role_permissions FOR ALL USING (public.has_permission(auth.uid(), 'permissions.manage'));
DROP POLICY IF EXISTS "Authenticated can read role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated can read role permissions" ON public.role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);

-- user_permissions
DROP POLICY IF EXISTS "Admin can manage user permissions" ON public.user_permissions;
CREATE POLICY "Admin can manage user permissions" ON public.user_permissions FOR ALL USING (public.has_permission(auth.uid(), 'permissions.manage'));
DROP POLICY IF EXISTS "Users can read own permissions" ON public.user_permissions;
CREATE POLICY "Users can read own permissions" ON public.user_permissions FOR SELECT USING (auth.uid() = user_id);

-- invites
DROP POLICY IF EXISTS "Admin can manage invites" ON public.invites;
CREATE POLICY "Admin can manage invites" ON public.invites FOR ALL USING (public.has_permission(auth.uid(), 'users.manage'));
DROP POLICY IF EXISTS "Anyone can read invites by token" ON public.invites;
CREATE POLICY "Anyone can read invites by token" ON public.invites FOR SELECT USING (true);

-- payment_provider_configs
DROP POLICY IF EXISTS "Admin can manage payment configs" ON public.payment_provider_configs;
CREATE POLICY "Admin can manage payment configs" ON public.payment_provider_configs FOR ALL USING (public.has_permission(auth.uid(), 'settings.manage'));

-- orders
DROP POLICY IF EXISTS "Staff can read orders" ON public.orders;
CREATE POLICY "Staff can read orders" ON public.orders FOR SELECT USING (public.has_permission(auth.uid(), 'appointments.read'));
DROP POLICY IF EXISTS "Staff can manage orders" ON public.orders;
CREATE POLICY "Staff can manage orders" ON public.orders FOR ALL USING (public.has_permission(auth.uid(), 'appointments.manage'));
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can read own orders by token" ON public.orders;
CREATE POLICY "Anyone can read own orders by token" ON public.orders FOR SELECT USING (checkout_token IS NOT NULL);

-- order_items
DROP POLICY IF EXISTS "Staff can read order items" ON public.order_items;
CREATE POLICY "Staff can read order items" ON public.order_items FOR SELECT USING (public.has_permission(auth.uid(), 'appointments.read'));
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- payments
DROP POLICY IF EXISTS "Staff can read payments" ON public.payments;
CREATE POLICY "Staff can read payments" ON public.payments FOR SELECT USING (public.has_permission(auth.uid(), 'appointments.read'));
DROP POLICY IF EXISTS "Service can manage payments" ON public.payments;
CREATE POLICY "Service can manage payments" ON public.payments FOR ALL USING (true);

-- payment_refunds
DROP POLICY IF EXISTS "Staff can read refunds" ON public.payment_refunds;
CREATE POLICY "Staff can read refunds" ON public.payment_refunds FOR SELECT USING (public.has_permission(auth.uid(), 'appointments.read'));
DROP POLICY IF EXISTS "Service can manage refunds" ON public.payment_refunds;
CREATE POLICY "Service can manage refunds" ON public.payment_refunds FOR ALL USING (true);

-- webhook_events
DROP POLICY IF EXISTS "Service can manage webhook events" ON public.webhook_events;
CREATE POLICY "Service can manage webhook events" ON public.webhook_events FOR ALL USING (true);

-- payment_settings
DROP POLICY IF EXISTS "Anyone can read payment settings" ON public.payment_settings;
CREATE POLICY "Anyone can read payment settings" ON public.payment_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage payment settings" ON public.payment_settings;
CREATE POLICY "Admin can manage payment settings" ON public.payment_settings FOR ALL USING (public.has_permission(auth.uid(), 'settings.manage'));

-- notifications
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- notification_preferences
DROP POLICY IF EXISTS "Users can manage own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification prefs" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);

-- push_subscriptions
DROP POLICY IF EXISTS "Users can manage own push subs" ON public.push_subscriptions;
CREATE POLICY "Users can manage own push subs" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can read push subs" ON public.push_subscriptions;
CREATE POLICY "Service can read push subs" ON public.push_subscriptions FOR SELECT USING (true);

-- notification_jobs
DROP POLICY IF EXISTS "Service can manage notification jobs" ON public.notification_jobs;
CREATE POLICY "Service can manage notification jobs" ON public.notification_jobs FOR ALL USING (true);

-- system_health_logs
DROP POLICY IF EXISTS "Admin can read health logs" ON public.system_health_logs;
CREATE POLICY "Admin can read health logs" ON public.system_health_logs FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Service can insert health logs" ON public.system_health_logs;
CREATE POLICY "Service can insert health logs" ON public.system_health_logs FOR INSERT WITH CHECK (true);

-- push_config
DROP POLICY IF EXISTS "Admin can manage push config" ON public.push_config;
CREATE POLICY "Admin can manage push config" ON public.push_config FOR ALL USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can read push config public key" ON public.push_config;
CREATE POLICY "Anyone can read push config public key" ON public.push_config FOR SELECT USING (true);

-- checkout_rate_limits
DROP POLICY IF EXISTS "Service can manage rate limits" ON public.checkout_rate_limits;
CREATE POLICY "Service can manage rate limits" ON public.checkout_rate_limits FOR ALL USING (true);

-- =============================================
-- STORAGE
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================
-- SEED DATA
-- =============================================

-- push_config default
INSERT INTO public.push_config (vapid_public_key, vapid_private_key, vapid_email)
SELECT NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.push_config LIMIT 1);

-- services
INSERT INTO public.services (name, description, duration_minutes, price, modalities, display_order) VALUES
('Avaliação Neuropsicológica', 'Avaliação completa das funções cognitivas e neuropsicológicas.', 60, 350.00, '{presencial}', 1),
('Psicoterapia Individual', 'Sessão de psicoterapia individual com abordagem personalizada.', 50, 200.00, '{presencial,online}', 2),
('Psicopedagogia', 'Atendimento psicopedagógico para dificuldades de aprendizagem.', 50, 180.00, '{presencial,online}', 3),
('Psiquiatria', 'Consulta psiquiátrica para avaliação e acompanhamento.', 30, 400.00, '{presencial,online}', 4),
('Terapia ABA', 'Análise do Comportamento Aplicada para TEA e outros transtornos.', 60, 220.00, '{presencial}', 5)
ON CONFLICT DO NOTHING;

-- professionals
INSERT INTO public.professionals (name, email, specialties, modalities) VALUES
('Dra. Ana Silva', 'ana@psicoavaliar.com', '{Neuropsicologia,Avaliação}', '{presencial}'),
('Dr. Carlos Souza', 'carlos@psicoavaliar.com', '{Psicoterapia,TCC}', '{presencial,online}'),
('Dra. Maria Oliveira', 'maria@psicoavaliar.com', '{Psicopedagogia}', '{presencial,online}')
ON CONFLICT DO NOTHING;

-- email_templates
INSERT INTO public.email_templates (slug, name, subject, html_body, variables) VALUES
('appointment-confirmation', 'Confirmação de Agendamento', 'Confirmação de Agendamento - PsicoAvaliar', '<h1>Agendamento Confirmado</h1><p>Olá {{client_name}},</p><p>Seu agendamento foi confirmado.</p><p><strong>Data:</strong> {{date}}</p><p><strong>Horário:</strong> {{time}}</p><p><strong>Profissional:</strong> {{professional_name}}</p><p><strong>Serviço:</strong> {{service_name}}</p><p><strong>Código:</strong> {{code}}</p>', '{client_name,date,time,professional_name,service_name,code}'),
('appointment-reminder', 'Lembrete de Consulta', 'Lembrete: Sua consulta está próxima - PsicoAvaliar', '<h1>Lembrete de Consulta</h1><p>Olá {{client_name}},</p><p>Sua consulta está marcada para {{date}} às {{time}}.</p>', '{client_name,date,time,professional_name,service_name}'),
('appointment-canceled', 'Cancelamento de Consulta', 'Consulta Cancelada - PsicoAvaliar', '<h1>Consulta Cancelada</h1><p>Olá {{client_name}},</p><p>Informamos que sua consulta foi cancelada.</p>', '{client_name,date,time,reason}'),
('welcome', 'Boas-vindas', 'Bem-vindo à PsicoAvaliar!', '<h1>Bem-vindo!</h1><p>Olá {{name}},</p><p>Obrigado por se cadastrar na PsicoAvaliar.</p>', '{name,email}')
ON CONFLICT (slug) DO NOTHING;

-- plans
INSERT INTO public.plans (name, description, price, duration_days, sessions_included, display_order) VALUES
('Plano Mensal', '4 sessões por mês', 720.00, 30, 4, 1),
('Plano Trimestral', '12 sessões em 3 meses com desconto', 1944.00, 90, 12, 2),
('Plano Semestral', '24 sessões em 6 meses com maior desconto', 3456.00, 180, 24, 3)
ON CONFLICT DO NOTHING;

-- site_settings
INSERT INTO public.site_settings (key, value) VALUES
('general', '{"site_name":"PsicoAvaliar","tagline":"Cuidando da saúde mental","phone":"(11) 99999-9999","email":"contato@psicoavaliar.com","address":"São Paulo, SP"}'),
('smtp', '{"host":"","port":587,"user":"","from_name":"PsicoAvaliar","from_email":""}'),
('scheduling', '{"min_advance_hours":24,"max_advance_days":60,"slot_interval_minutes":30}')
ON CONFLICT (key) DO NOTHING;

-- blog_categories
INSERT INTO public.blog_categories (name, slug) VALUES
('Saúde Mental', 'saude-mental'),
('Neuropsicologia', 'neuropsicologia'),
('Psicopedagogia', 'psicopedagogia'),
('Terapia ABA', 'terapia-aba'),
('Dicas e Bem-estar', 'dicas-bem-estar')
ON CONFLICT (slug) DO NOTHING;

-- payment_settings
INSERT INTO public.payment_settings (key, value) VALUES
('general', '{"default_currency":"BRL","allow_installments":true,"max_installments":12}')
ON CONFLICT (key) DO NOTHING;

-- payment_provider_configs
INSERT INTO public.payment_provider_configs (provider, is_enabled, is_sandbox, config) VALUES
('mercadopago', false, true, '{}'),
('appmax', false, true, '{}')
ON CONFLICT (provider) DO NOTHING;

-- briefing_checklist_items
INSERT INTO public.briefing_checklist_items (label, description, display_order) VALUES
('Li e compreendi todas as informações apresentadas', NULL, 1),
('Estou ciente dos procedimentos envolvidos', NULL, 2),
('Concordo com os termos de confidencialidade', NULL, 3),
('Autorizo o início dos procedimentos descritos', NULL, 4)
ON CONFLICT DO NOTHING;

-- briefing_content
INSERT INTO public.briefing_content (section_key, title, content, display_order) VALUES
('intro', 'Introdução', 'Bem-vindo ao briefing da PsicoAvaliar. Este documento contém informações importantes sobre os serviços que serão realizados.', 1),
('services', 'Serviços', 'Descrição detalhada dos serviços contratados e procedimentos que serão realizados.', 2),
('terms', 'Termos e Condições', 'Termos de uso, política de cancelamento e condições gerais do atendimento.', 3)
ON CONFLICT (section_key) DO NOTHING;

-- =============================================
-- PERMISSIONS SEED
-- =============================================
INSERT INTO public.permissions (permission_key, permission_name, category) VALUES
-- Dashboard
('dashboard.read', 'Visualizar Dashboard', 'Dashboard'),
-- Appointments
('appointments.read', 'Visualizar Consultas', 'Consultas'),
('appointments.read_own', 'Visualizar Próprias Consultas', 'Consultas'),
('appointments.manage', 'Gerenciar Consultas', 'Consultas'),
('appointments.read_self', 'Ver Próprias Consultas (Cliente)', 'Consultas'),
-- Clients
('clients.read', 'Visualizar Clientes', 'Clientes'),
('clients.read_own', 'Visualizar Próprios Clientes', 'Clientes'),
('clients.manage', 'Gerenciar Clientes', 'Clientes'),
-- Services
('services.read', 'Visualizar Serviços', 'Serviços'),
('services.manage', 'Gerenciar Serviços', 'Serviços'),
-- Professionals
('professionals.read', 'Visualizar Profissionais', 'Profissionais'),
('professionals.manage', 'Gerenciar Profissionais', 'Profissionais'),
-- Plans
('plans.read', 'Visualizar Planos', 'Planos'),
('plans.manage', 'Gerenciar Planos', 'Planos'),
-- Availability
('availability.read', 'Visualizar Disponibilidade', 'Disponibilidade'),
('availability.manage', 'Gerenciar Disponibilidade', 'Disponibilidade'),
-- CMS
('cms.read', 'Visualizar CMS', 'CMS/Site'),
('cms.manage', 'Gerenciar CMS', 'CMS/Site'),
-- Blog
('blog.read', 'Visualizar Blog', 'Blog'),
('blog.manage', 'Gerenciar Blog', 'Blog'),
-- Media
('media.read', 'Visualizar Mídia', 'Mídia'),
('media.manage', 'Gerenciar Mídia', 'Mídia'),
-- Email templates
('email_templates.read', 'Visualizar Templates de E-mail', 'E-mails'),
('email_templates.manage', 'Gerenciar Templates de E-mail', 'E-mails'),
-- Settings
('settings.read', 'Visualizar Configurações', 'Configurações'),
('settings.manage', 'Gerenciar Configurações', 'Configurações'),
-- Security
('users.read', 'Visualizar Usuários', 'Segurança'),
('users.manage', 'Gerenciar Usuários', 'Segurança'),
('roles.read', 'Visualizar Roles', 'Segurança'),
('roles.manage', 'Gerenciar Roles', 'Segurança'),
('permissions.read', 'Visualizar Permissões', 'Segurança'),
('permissions.manage', 'Gerenciar Permissões', 'Segurança'),
('audit_logs.read', 'Visualizar Auditoria', 'Segurança'),
-- Portal
('portal.read', 'Acessar Portal', 'Portal'),
('profile.read_self', 'Ver Próprio Perfil', 'Portal'),
-- Briefing
('briefing.read', 'Visualizar Briefing', 'Briefing'),
('briefing.manage', 'Gerenciar Briefing', 'Briefing'),
-- Messages
('messages.read', 'Visualizar Mensagens', 'Mensagens'),
('messages.manage', 'Gerenciar Mensagens', 'Mensagens')
ON CONFLICT (permission_key) DO NOTHING;

-- role_permissions for receptionist
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'receptionist', id FROM public.permissions WHERE permission_key IN (
  'dashboard.read','appointments.read','appointments.manage','clients.read','clients.manage',
  'services.read','professionals.read','plans.read','availability.read','availability.manage',
  'blog.read','blog.manage','media.read','media.manage','email_templates.read',
  'messages.read','messages.manage','briefing.read','briefing.manage','settings.read'
) ON CONFLICT (role, permission_id) DO NOTHING;

-- role_permissions for professional
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'professional', id FROM public.permissions WHERE permission_key IN (
  'dashboard.read','appointments.read_own','clients.read_own','services.read',
  'availability.read','availability.manage'
) ON CONFLICT (role, permission_id) DO NOTHING;

-- role_permissions for client
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'client', id FROM public.permissions WHERE permission_key IN (
  'portal.read','appointments.read_self','profile.read_self'
) ON CONFLICT (role, permission_id) DO NOTHING;
