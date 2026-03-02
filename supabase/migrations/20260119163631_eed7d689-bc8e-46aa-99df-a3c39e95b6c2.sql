-- Create briefing_links table for shareable tokens
CREATE TABLE public.briefing_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create briefing_link_access_logs for tracking
CREATE TABLE public.briefing_link_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.briefing_links(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create briefing_checklist_items table (configurable items)
CREATE TABLE public.briefing_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create briefing_approvals table
CREATE TABLE public.briefing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('approved', 'changes_requested')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create briefing_checklist_responses table
CREATE TABLE public.briefing_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES public.briefing_approvals(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.briefing_checklist_items(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'adjust', 'na')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create briefing_content table for editable sections
CREATE TABLE public.briefing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.briefing_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_link_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_checklist_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for briefing_links
CREATE POLICY "Admins can manage briefing links"
ON public.briefing_links FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active links by token"
ON public.briefing_links FOR SELECT
USING (is_active = true);

-- RLS Policies for briefing_link_access_logs
CREATE POLICY "Admins can view access logs"
ON public.briefing_link_access_logs FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert access logs"
ON public.briefing_link_access_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies for briefing_checklist_items
CREATE POLICY "Admins can manage checklist items"
ON public.briefing_checklist_items FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active checklist items"
ON public.briefing_checklist_items FOR SELECT
USING (is_active = true);

-- RLS Policies for briefing_approvals
CREATE POLICY "Admins can view approvals"
ON public.briefing_approvals FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert approvals"
ON public.briefing_approvals FOR INSERT
WITH CHECK (true);

-- RLS Policies for briefing_checklist_responses
CREATE POLICY "Admins can view checklist responses"
ON public.briefing_checklist_responses FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can insert checklist responses"
ON public.briefing_checklist_responses FOR INSERT
WITH CHECK (true);

-- RLS Policies for briefing_content
CREATE POLICY "Admins can manage briefing content"
ON public.briefing_content FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active briefing content"
ON public.briefing_content FOR SELECT
USING (is_active = true);

-- Insert default checklist items
INSERT INTO public.briefing_checklist_items (key, title, description, sort_order) VALUES
('design_pages', 'Design das páginas', 'Quem Somos, Especialidades, Assinaturas, Contato e demais páginas institucionais', 1),
('blog', 'Blog', 'Criação, edição e publicação de posts com categorias, tags e SEO', 2),
('scheduling', 'Agendamento', 'Criação de slots de disponibilidade e marcação de consultas', 3),
('admin_panel', 'Painel Admin', 'Acesso e permissões para gestão do sistema', 4),
('client_portal', 'Portal do Cliente', 'Visualização de consultas, perfil e histórico', 5),
('emails', 'E-mails', 'Templates de e-mail e configuração SMTP', 6),
('google_meet', 'Google Meet', 'Link manual de videochamada funcionando', 7),
('lgpd', 'Páginas legais LGPD', 'Política de Privacidade, Termos de Uso e consentimentos', 8);

-- Insert default briefing content sections
INSERT INTO public.briefing_content (key, title, content, sort_order) VALUES
('header', 'Cabeçalho', '{"version": "1.0", "responsible": "Equipe Psicoavaliar", "contact": "contato@psicoavaliar.com.br"}', 0),
('overview', 'Visão Geral', '{"objective": "Sistema completo para gestão de clínica de psicologia, incluindo site institucional, agendamento online, painel administrativo, blog, portal do cliente, e-mails automatizados e videochamadas.", "deliverables": ["Site institucional responsivo", "Sistema de agendamento online", "Painel administrativo completo", "Portal do cliente", "Blog com CMS", "E-mails automatizados", "Integração Google Meet"]}', 1),
('sitemap', 'Mapa do Site', '{"public": [{"path": "/", "name": "Home"}, {"path": "/quem-somos", "name": "Quem Somos"}, {"path": "/especialidades", "name": "Especialidades"}, {"path": "/assinaturas", "name": "Planos e Assinaturas"}, {"path": "/financiamento", "name": "Financiamento"}, {"path": "/faq", "name": "FAQ"}, {"path": "/contato", "name": "Contato"}, {"path": "/agendar", "name": "Agendar Consulta"}, {"path": "/blog", "name": "Blog"}, {"path": "/privacidade", "name": "Política de Privacidade"}, {"path": "/termos", "name": "Termos de Uso"}], "protected": [{"path": "/admin/**", "name": "Painel Admin"}, {"path": "/cliente/**", "name": "Portal do Cliente"}]}', 2);

-- Function to generate unique token
CREATE OR REPLACE FUNCTION public.generate_briefing_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token TEXT;
BEGIN
  new_token := encode(gen_random_bytes(32), 'hex');
  RETURN new_token;
END;
$$;