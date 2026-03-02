-- Add new pricing fields to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS price_mode TEXT NOT NULL DEFAULT 'fixed' CHECK (price_mode IN ('fixed', 'from', 'consult')),
ADD COLUMN IF NOT EXISTS price_from_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS allow_installments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_installments INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS require_payment_to_confirm BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'none' CHECK (payment_type IN ('full', 'deposit', 'none')),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS show_price_publicly BOOLEAN DEFAULT true;

-- Add pending_payment status to appointments
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Create payment provider configs table
CREATE TABLE IF NOT EXISTS public.payment_provider_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE CHECK (provider IN ('mercadopago', 'appmax', 'stripe', 'pagarme')),
  is_active BOOLEAN DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  credentials_encrypted_json JSONB,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'refunded', 'canceled', 'expired')),
  currency TEXT NOT NULL DEFAULT 'BRL',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_required BOOLEAN DEFAULT true,
  payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'deposit')),
  deposit_amount DECIMAL(10,2),
  balance_due DECIMAL(10,2) DEFAULT 0,
  provider_selected TEXT,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payable_type TEXT NOT NULL CHECK (payable_type IN ('appointment', 'service_fee', 'plan_subscription')),
  payable_id UUID,
  description TEXT NOT NULL,
  unit_amount DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'appmax', 'stripe', 'pagarme', 'manual')),
  provider_payment_id TEXT,
  method TEXT CHECK (method IN ('pix', 'card', 'boleto', 'manual')),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'paid', 'failed', 'refunded', 'canceled', 'expired')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_url TEXT,
  pix_qr_base64 TEXT,
  pix_copy_paste TEXT,
  boleto_url TEXT,
  boleto_barcode TEXT,
  installments INTEGER DEFAULT 1,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  raw_provider_response_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment refunds table
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  reason TEXT,
  provider_refund_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provider_event_id TEXT,
  signature_valid BOOLEAN,
  payload_json JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment settings table (general config)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Generate order code function
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code := 'ORD-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for order code
DROP TRIGGER IF EXISTS generate_order_code_trigger ON public.orders;
CREATE TRIGGER generate_order_code_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_code();

-- Enable RLS on all new tables
ALTER TABLE public.payment_provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_provider_configs (admin only)
CREATE POLICY "Admins can manage payment configs" ON public.payment_provider_configs
  FOR ALL USING (is_admin(auth.uid()));

-- RLS policies for orders
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view own orders" ON public.orders
  FOR SELECT USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- RLS policies for order_items
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view own order items" ON public.order_items
  FOR SELECT USING (order_id IN (SELECT id FROM public.orders WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- RLS policies for payments
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view own payments" ON public.payments
  FOR SELECT USING (order_id IN (SELECT id FROM public.orders WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())));

CREATE POLICY "Anyone can create payments" ON public.payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (true);

-- RLS policies for payment_refunds
CREATE POLICY "Admins can manage refunds" ON public.payment_refunds
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view own refunds" ON public.payment_refunds
  FOR SELECT USING (payment_id IN (
    SELECT p.id FROM public.payments p 
    JOIN public.orders o ON p.order_id = o.id 
    WHERE o.client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ));

-- RLS policies for webhook_events (admin only)
CREATE POLICY "Admins can view webhook events" ON public.webhook_events
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert webhook events" ON public.webhook_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update webhook events" ON public.webhook_events
  FOR UPDATE USING (true);

-- RLS policies for payment_settings
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view payment settings" ON public.payment_settings
  FOR SELECT USING (true);

-- Insert default payment settings
INSERT INTO public.payment_settings (key, value) VALUES
  ('enabled_methods', '{"pix": true, "card": true, "boleto": false}'::jsonb),
  ('checkout_text', '{"title": "Finalizar Pagamento", "description": "Complete seu pagamento de forma segura"}'::jsonb),
  ('cancellation_policy', '{"text": "Cancelamentos devem ser feitos com 24h de antecedência para reembolso integral."}'::jsonb),
  ('installments', '{"enabled": true, "max": 12, "min_amount": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Insert default provider configs (inactive)
INSERT INTO public.payment_provider_configs (provider, is_active, environment, settings_json) VALUES
  ('mercadopago', false, 'sandbox', '{"name": "Mercado Pago", "supports": ["pix", "card", "boleto"]}'::jsonb),
  ('appmax', false, 'sandbox', '{"name": "Appmax", "supports": ["pix", "card", "boleto"]}'::jsonb)
ON CONFLICT (provider) DO NOTHING;

-- Add email templates for payments
INSERT INTO public.email_templates (key, name, subject, html_content, variables, is_active) VALUES
  ('payment_link', 'Link de Pagamento', 'Link para pagamento - {{servico_nome}}', 
   '<h1>Olá {{cliente_nome}},</h1><p>Segue o link para pagamento do serviço <strong>{{servico_nome}}</strong>.</p><p><strong>Valor:</strong> {{valor}}</p><p><a href="{{link_pagamento}}">Clique aqui para pagar</a></p><p>Este link expira em {{expiracao}}.</p>', 
   ARRAY['cliente_nome', 'servico_nome', 'valor', 'link_pagamento', 'expiracao'], true),
  ('payment_confirmed', 'Pagamento Confirmado', 'Pagamento confirmado - Pedido {{order_id}}',
   '<h1>Pagamento Confirmado!</h1><p>Olá {{cliente_nome}},</p><p>Seu pagamento foi confirmado com sucesso.</p><p><strong>Pedido:</strong> {{order_id}}<br><strong>Valor:</strong> {{valor}}<br><strong>Método:</strong> {{metodo}}</p><p>{{detalhes_consulta}}</p>',
   ARRAY['cliente_nome', 'order_id', 'valor', 'metodo', 'detalhes_consulta'], true),
  ('payment_pending', 'Pagamento Pendente', 'Aguardando pagamento - Pedido {{order_id}}',
   '<h1>Pagamento Pendente</h1><p>Olá {{cliente_nome}},</p><p>Estamos aguardando a confirmação do seu pagamento.</p><p><strong>Pedido:</strong> {{order_id}}<br><strong>Valor:</strong> {{valor}}<br><strong>Método:</strong> {{metodo}}</p>{{instrucoes_pagamento}}',
   ARRAY['cliente_nome', 'order_id', 'valor', 'metodo', 'instrucoes_pagamento'], true),
  ('payment_expired', 'Pagamento Expirado', 'Pagamento expirado - Pedido {{order_id}}',
   '<h1>Pagamento Expirado</h1><p>Olá {{cliente_nome}},</p><p>O prazo para pagamento do pedido {{order_id}} expirou.</p><p>Se ainda deseja realizar o pagamento, entre em contato conosco ou gere um novo pedido.</p>',
   ARRAY['cliente_nome', 'order_id'], true),
  ('refund_confirmed', 'Reembolso Confirmado', 'Reembolso confirmado - Pedido {{order_id}}',
   '<h1>Reembolso Confirmado</h1><p>Olá {{cliente_nome}},</p><p>O reembolso do seu pagamento foi processado com sucesso.</p><p><strong>Pedido:</strong> {{order_id}}<br><strong>Valor reembolsado:</strong> {{valor}}</p><p>O valor será creditado em sua conta conforme o prazo do seu banco/operadora.</p>',
   ARRAY['cliente_nome', 'order_id', 'valor'], true)
ON CONFLICT (key) DO NOTHING;