-- =============================================
-- NOTIFICATIONS SYSTEM
-- =============================================

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'sistema' CHECK (category IN ('consultas', 'pagamentos', 'sistema', 'conteudo')),
  event_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  resource_type TEXT CHECK (resource_type IN ('appointment', 'payment', 'post', 'user', 'system', 'order')),
  resource_id UUID,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  toggles_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_label TEXT,
  user_agent TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification jobs (scheduled notifications)
CREATE TABLE public.notification_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_key TEXT NOT NULL,
  run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed', 'canceled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- System health logs
CREATE TABLE public.system_health_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL CHECK (service IN ('smtp', 'push', 'payment', 'google', 'system')),
  status TEXT NOT NULL CHECK (status IN ('ok', 'warning', 'error')),
  message TEXT,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- VAPID configuration for push notifications
CREATE TABLE public.push_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vapid_public_key TEXT,
  vapid_private_key_encrypted TEXT,
  sender_name TEXT DEFAULT 'Psicoavaliar',
  is_configured BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default push config row
INSERT INTO public.push_config (id, is_configured) VALUES (gen_random_uuid(), false);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX idx_notifications_read ON public.notifications(recipient_user_id, read_at);
CREATE INDEX idx_notifications_category ON public.notifications(category);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notification_jobs_run_at ON public.notification_jobs(run_at) WHERE status = 'pending';
CREATE INDEX idx_notification_jobs_status ON public.notification_jobs(status);
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_payments_paid_at ON public.payments(paid_at);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_date, scheduled_time);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can view own preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all preferences"
  ON public.notification_preferences FOR SELECT
  USING (is_admin(auth.uid()));

-- Push subscriptions policies
CREATE POLICY "Users can manage own subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (is_admin(auth.uid()));

-- Notification jobs policies
CREATE POLICY "Admins can manage notification jobs"
  ON public.notification_jobs FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "System can manage notification jobs"
  ON public.notification_jobs FOR ALL
  USING (true);

-- System health logs policies
CREATE POLICY "Admins can view system health"
  ON public.system_health_logs FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert health logs"
  ON public.system_health_logs FOR INSERT
  WITH CHECK (true);

-- Push config policies
CREATE POLICY "Admins can manage push config"
  ON public.push_config FOR ALL
  USING (is_admin(auth.uid()));

-- =============================================
-- PERMISSIONS
-- =============================================

INSERT INTO public.permissions (key, name, description, category) VALUES
  ('notifications.read', 'Visualizar Notificações', 'Permite visualizar notificações do sistema', 'Notificações'),
  ('notifications.manage', 'Gerenciar Notificações', 'Permite gerenciar configurações de notificações', 'Notificações'),
  ('notifications.send_test', 'Enviar Notificação de Teste', 'Permite enviar notificações de teste', 'Notificações'),
  ('reports.read', 'Visualizar Relatórios', 'Permite visualizar relatórios e métricas', 'Relatórios'),
  ('reports.export', 'Exportar Relatórios', 'Permite exportar relatórios em CSV/PDF', 'Relatórios'),
  ('system_health.read', 'Visualizar Saúde do Sistema', 'Permite visualizar status dos serviços', 'Sistema')
ON CONFLICT (key) DO NOTHING;

-- Add permissions to receptionist role
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'receptionist', id FROM public.permissions 
WHERE key IN ('notifications.read', 'reports.read')
ON CONFLICT DO NOTHING;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _recipient_user_id UUID,
  _category TEXT,
  _event_key TEXT,
  _title TEXT,
  _body TEXT DEFAULT NULL,
  _action_url TEXT DEFAULT NULL,
  _resource_type TEXT DEFAULT NULL,
  _resource_id UUID DEFAULT NULL,
  _priority TEXT DEFAULT 'normal',
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  prefs notification_preferences%ROWTYPE;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs FROM notification_preferences WHERE user_id = _recipient_user_id;
  
  -- Check if in-app is enabled (default true if no preferences)
  IF prefs.user_id IS NULL OR prefs.in_app_enabled THEN
    INSERT INTO notifications (
      recipient_user_id, category, event_key, title, body, 
      action_url, resource_type, resource_id, priority, metadata_json
    ) VALUES (
      _recipient_user_id, _category, _event_key, _title, _body,
      _action_url, _resource_type, _resource_id, _priority, _metadata
    )
    RETURNING id INTO notification_id;
  END IF;
  
  RETURN notification_id;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE recipient_user_id = _user_id AND read_at IS NULL;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(_user_id UUID, _notification_ids UUID[] DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF _notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET read_at = now()
    WHERE recipient_user_id = _user_id AND read_at IS NULL;
  ELSE
    -- Mark specific ones as read
    UPDATE notifications
    SET read_at = now()
    WHERE recipient_user_id = _user_id 
      AND id = ANY(_notification_ids) 
      AND read_at IS NULL;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to schedule appointment reminders
CREATE OR REPLACE FUNCTION public.schedule_appointment_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_datetime TIMESTAMP WITH TIME ZONE;
  client_user_id UUID;
BEGIN
  -- Only schedule reminders when appointment is confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Get the appointment datetime
    appointment_datetime := (NEW.scheduled_date || ' ' || NEW.scheduled_time)::TIMESTAMP AT TIME ZONE COALESCE(NEW.timezone, 'America/Sao_Paulo');
    
    -- Get client user_id
    SELECT user_id INTO client_user_id FROM clients WHERE id = NEW.client_id;
    
    -- Cancel any existing pending jobs for this appointment
    UPDATE notification_jobs 
    SET status = 'canceled'
    WHERE payload_json->>'appointment_id' = NEW.id::TEXT 
      AND status = 'pending';
    
    -- Schedule 24h reminder
    IF appointment_datetime - INTERVAL '24 hours' > now() THEN
      INSERT INTO notification_jobs (event_key, run_at, payload_json) VALUES (
        'appointment.reminder_24h',
        appointment_datetime - INTERVAL '24 hours',
        jsonb_build_object(
          'appointment_id', NEW.id,
          'client_id', NEW.client_id,
          'client_user_id', client_user_id,
          'scheduled_date', NEW.scheduled_date,
          'scheduled_time', NEW.scheduled_time
        )
      );
    END IF;
    
    -- Schedule 2h reminder
    IF appointment_datetime - INTERVAL '2 hours' > now() THEN
      INSERT INTO notification_jobs (event_key, run_at, payload_json) VALUES (
        'appointment.reminder_2h',
        appointment_datetime - INTERVAL '2 hours',
        jsonb_build_object(
          'appointment_id', NEW.id,
          'client_id', NEW.client_id,
          'client_user_id', client_user_id,
          'scheduled_date', NEW.scheduled_date,
          'scheduled_time', NEW.scheduled_time
        )
      );
    END IF;
    
    -- Schedule 15min reminder
    IF appointment_datetime - INTERVAL '15 minutes' > now() THEN
      INSERT INTO notification_jobs (event_key, run_at, payload_json) VALUES (
        'appointment.reminder_15m',
        appointment_datetime - INTERVAL '15 minutes',
        jsonb_build_object(
          'appointment_id', NEW.id,
          'client_id', NEW.client_id,
          'client_user_id', client_user_id,
          'scheduled_date', NEW.scheduled_date,
          'scheduled_time', NEW.scheduled_time
        )
      );
    END IF;
  END IF;
  
  -- Cancel reminders if appointment is canceled
  IF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
    UPDATE notification_jobs 
    SET status = 'canceled'
    WHERE payload_json->>'appointment_id' = NEW.id::TEXT 
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for appointment reminders
CREATE TRIGGER trigger_schedule_appointment_reminders
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_appointment_reminders();

-- =============================================
-- REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;