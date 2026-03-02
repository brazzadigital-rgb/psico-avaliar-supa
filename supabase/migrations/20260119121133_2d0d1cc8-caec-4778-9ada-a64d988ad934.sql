-- Blog system tables
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);

-- Site settings table
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Media assets table
CREATE TABLE public.media_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Plans/subscriptions table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  price_display TEXT,
  benefits TEXT[],
  is_highlighted BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Blog RLS policies
CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage posts" ON public.blog_posts FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.blog_categories FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage tags" ON public.blog_tags FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view post tags" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage post tags" ON public.blog_post_tags FOR ALL USING (is_admin(auth.uid()));

-- Site settings RLS
CREATE POLICY "Anyone can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL USING (is_admin(auth.uid()));

-- Email templates RLS
CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL USING (is_admin(auth.uid()));

-- Media assets RLS
CREATE POLICY "Anyone can view media" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Admins can manage media" ON public.media_assets FOR ALL USING (is_admin(auth.uid()));

-- Audit logs RLS
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Plans RLS
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL USING (is_admin(auth.uid()));

-- Insert default email templates
INSERT INTO public.email_templates (key, name, subject, html_content, variables) VALUES
('appointment_confirmation', 'Confirmação de Agendamento', 'Sua consulta foi agendada - {{codigo_consulta}}', '<h1>Olá, {{cliente_nome}}!</h1><p>Sua consulta foi agendada com sucesso.</p><p><strong>Serviço:</strong> {{servico_nome}}</p><p><strong>Data:</strong> {{data}} às {{hora}}</p><p><strong>Modalidade:</strong> {{modalidade}}</p><p><strong>Código:</strong> {{codigo_consulta}}</p>', ARRAY['cliente_nome', 'servico_nome', 'data', 'hora', 'modalidade', 'codigo_consulta', 'profissional', 'endereco', 'link_online']),
('admin_new_appointment', 'Novo Agendamento', 'Novo agendamento - {{cliente_nome}}', '<h1>Novo agendamento recebido</h1><p><strong>Cliente:</strong> {{cliente_nome}}</p><p><strong>Serviço:</strong> {{servico_nome}}</p><p><strong>Data:</strong> {{data}} às {{hora}}</p>', ARRAY['cliente_nome', 'servico_nome', 'data', 'hora', 'modalidade', 'codigo_consulta']),
('reminder_24h', 'Lembrete 24h', 'Lembrete: sua consulta é amanhã', '<h1>Olá, {{cliente_nome}}!</h1><p>Lembramos que sua consulta está marcada para amanhã.</p><p><strong>Data:</strong> {{data}} às {{hora}}</p>', ARRAY['cliente_nome', 'servico_nome', 'data', 'hora', 'modalidade', 'codigo_consulta']),
('reminder_2h', 'Lembrete 2h', 'Sua consulta é em 2 horas', '<h1>Olá, {{cliente_nome}}!</h1><p>Sua consulta começa em 2 horas.</p><p><strong>Horário:</strong> {{hora}}</p>', ARRAY['cliente_nome', 'servico_nome', 'data', 'hora', 'link_online']),
('appointment_rescheduled', 'Consulta Remarcada', 'Sua consulta foi remarcada', '<h1>Olá, {{cliente_nome}}!</h1><p>Sua consulta foi remarcada.</p><p><strong>Nova data:</strong> {{data}} às {{hora}}</p>', ARRAY['cliente_nome', 'servico_nome', 'data', 'hora', 'modalidade']),
('appointment_canceled', 'Consulta Cancelada', 'Sua consulta foi cancelada', '<h1>Olá, {{cliente_nome}}!</h1><p>Informamos que sua consulta foi cancelada.</p><p>Entre em contato para reagendar.</p>', ARRAY['cliente_nome', 'servico_nome', 'data', 'hora']);

-- Insert default plans
INSERT INTO public.plans (name, description, price_display, benefits, is_highlighted, display_order) VALUES
('Essencial', '1 sessão por semana', 'Sob consulta', ARRAY['1 sessão semanal de 50 min', 'Atendimento presencial ou online', 'Acompanhamento contínuo', 'Relatório mensal de evolução'], false, 1),
('Intensivo', '2 sessões por semana', 'Sob consulta', ARRAY['2 sessões semanais de 50 min', 'Atendimento presencial ou online', 'Acompanhamento intensivo', 'Relatório mensal de evolução', 'Suporte via WhatsApp'], true, 2),
('Familiar', 'Ideal para crianças e adolescentes', 'Sob consulta', ARRAY['1 sessão semanal com paciente', 'Orientação mensal aos responsáveis', 'Atendimento presencial ou online', 'Relatório de evolução'], false, 3);

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
('general', '{"business_name": "Centro de Psicologia Psicoavaliar", "phone": "(51) 99280-9471", "email": "centropsicoavaliar@gmail.com", "address": "Rua João Salomoni, 650 - Bairro Vila Nova, Porto Alegre - RS | CEP: 91740-830", "working_hours": "Segunda a Sexta: 8h às 20h | Sábado: 8h às 12h"}'),
('social', '{"instagram": "", "facebook": "", "linkedin": "", "youtube": ""}'),
('seo', '{"default_title": "Psicoavaliar - Centro de Psicologia em Porto Alegre", "default_description": "Avaliação psicológica, neuropsicológica, psicoterapia e atendimento especializado em TEA, TDAH. Atendimento presencial e online.", "og_image": ""}'),
('whatsapp', '{"default_message": "Olá! Gostaria de mais informações sobre os serviços da Psicoavaliar."}');

-- Insert default blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
('Saúde Mental', 'saude-mental', 'Artigos sobre bem-estar e saúde mental'),
('TEA e TDAH', 'tea-tdah', 'Conteúdos sobre Transtorno do Espectro Autista e TDAH'),
('Desenvolvimento Infantil', 'desenvolvimento-infantil', 'Dicas e orientações para pais'),
('Avaliações', 'avaliacoes', 'Informações sobre avaliações psicológicas e neuropsicológicas');