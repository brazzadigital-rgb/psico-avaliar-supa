-- ========================================
-- RBAC SYSTEM - PERMISSIONS & USER MANAGEMENT
-- ========================================

-- 1) Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- 3) Create user_permissions override table (allow/deny per user)
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission_id)
);

-- 4) Create invites table for team invitations
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'client',
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Add indexes for performance
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_invites_token ON public.invites(token_hash);
CREATE INDEX idx_permissions_category ON public.permissions(category);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 6) Enable RLS on new tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- 7) RLS Policies for permissions table
CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 8) RLS Policies for role_permissions table
CREATE POLICY "Anyone can view role permissions"
ON public.role_permissions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 9) RLS Policies for user_permissions table
CREATE POLICY "Users can view own permission overrides"
ON public.user_permissions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user permissions"
ON public.user_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 10) RLS Policies for invites table
CREATE POLICY "Admins can manage invites"
ON public.invites FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view invite by token"
ON public.invites FOR SELECT
USING (true);

-- 11) Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  has_role_perm BOOLEAN;
  user_override TEXT;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- If no role, deny
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Admin has all permissions (wildcard)
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Check for user-specific override first
  SELECT effect INTO user_override
  FROM public.user_permissions up
  JOIN public.permissions p ON up.permission_id = p.id
  WHERE up.user_id = _user_id AND p.key = _permission_key;
  
  IF user_override = 'deny' THEN
    RETURN FALSE;
  ELSIF user_override = 'allow' THEN
    RETURN TRUE;
  END IF;
  
  -- Check role permissions
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE rp.role = user_role AND p.key = _permission_key
  ) INTO has_role_perm;
  
  RETURN has_role_perm;
END;
$$;

-- 12) Function to get all effective permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id UUID)
RETURNS TABLE (
  permission_key TEXT,
  permission_name TEXT,
  category TEXT,
  source TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Admin gets all permissions
  IF user_role = 'admin' THEN
    RETURN QUERY
    SELECT p.key, p.name, p.category, 'role:admin'::TEXT
    FROM public.permissions p;
    RETURN;
  END IF;
  
  -- Return permissions from role + user overrides
  RETURN QUERY
  WITH role_perms AS (
    SELECT p.id, p.key, p.name, p.category, 'role'::TEXT as source
    FROM public.permissions p
    JOIN public.role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role = user_role
  ),
  user_allows AS (
    SELECT p.id, p.key, p.name, p.category, 'user:allow'::TEXT as source
    FROM public.permissions p
    JOIN public.user_permissions up ON p.id = up.permission_id
    WHERE up.user_id = _user_id AND up.effect = 'allow'
  ),
  user_denies AS (
    SELECT p.id
    FROM public.permissions p
    JOIN public.user_permissions up ON p.id = up.permission_id
    WHERE up.user_id = _user_id AND up.effect = 'deny'
  )
  -- Role permissions minus denied, plus user allows
  SELECT r.key, r.name, r.category, r.source
  FROM role_perms r
  WHERE r.id NOT IN (SELECT id FROM user_denies)
  UNION
  SELECT a.key, a.name, a.category, a.source
  FROM user_allows a;
END;
$$;

-- 13) Seed default permissions
INSERT INTO public.permissions (key, name, description, category) VALUES
-- Dashboard
('dashboard.read', 'Ver Dashboard', 'Acesso ao painel principal', 'Dashboard'),

-- Appointments
('appointments.read', 'Ver Consultas', 'Listar todas as consultas', 'Consultas'),
('appointments.read_own', 'Ver Próprias Consultas', 'Ver apenas consultas próprias (profissional)', 'Consultas'),
('appointments.read_self', 'Ver Minhas Consultas', 'Ver consultas como cliente', 'Consultas'),
('appointments.create', 'Criar Consultas', 'Agendar novas consultas', 'Consultas'),
('appointments.update', 'Editar Consultas', 'Modificar dados de consultas', 'Consultas'),
('appointments.update_own_status', 'Atualizar Status Próprio', 'Alterar status das próprias consultas', 'Consultas'),
('appointments.add_notes_own', 'Adicionar Notas', 'Adicionar notas às próprias consultas', 'Consultas'),
('appointments.cancel', 'Cancelar Consultas', 'Cancelar consultas existentes', 'Consultas'),
('appointments.reschedule', 'Reagendar Consultas', 'Alterar data/hora de consultas', 'Consultas'),
('appointments.request_reschedule', 'Solicitar Reagendamento', 'Cliente pode solicitar reagendamento', 'Consultas'),
('appointments.request_cancel', 'Solicitar Cancelamento', 'Cliente pode solicitar cancelamento', 'Consultas'),

-- Clients
('clients.read', 'Ver Clientes', 'Listar todos os clientes', 'Clientes'),
('clients.read_own', 'Ver Clientes Vinculados', 'Ver apenas clientes vinculados ao profissional', 'Clientes'),
('clients.create', 'Criar Clientes', 'Cadastrar novos clientes', 'Clientes'),
('clients.update', 'Editar Clientes', 'Modificar dados de clientes', 'Clientes'),
('clients.delete', 'Excluir Clientes', 'Remover clientes do sistema', 'Clientes'),

-- Services
('services.read', 'Ver Serviços', 'Listar serviços disponíveis', 'Serviços'),
('services.create', 'Criar Serviços', 'Cadastrar novos serviços', 'Serviços'),
('services.update', 'Editar Serviços', 'Modificar dados de serviços', 'Serviços'),
('services.delete', 'Excluir Serviços', 'Remover serviços', 'Serviços'),

-- Professionals
('professionals.read', 'Ver Profissionais', 'Listar profissionais', 'Profissionais'),
('professionals.create', 'Criar Profissionais', 'Cadastrar novos profissionais', 'Profissionais'),
('professionals.update', 'Editar Profissionais', 'Modificar dados de profissionais', 'Profissionais'),
('professionals.delete', 'Excluir Profissionais', 'Remover profissionais', 'Profissionais'),

-- Plans
('plans.read', 'Ver Planos', 'Listar planos de assinatura', 'Planos'),
('plans.create', 'Criar Planos', 'Cadastrar novos planos', 'Planos'),
('plans.update', 'Editar Planos', 'Modificar planos existentes', 'Planos'),
('plans.delete', 'Excluir Planos', 'Remover planos', 'Planos'),

-- Availability
('availability.read', 'Ver Disponibilidade', 'Ver horários disponíveis', 'Disponibilidade'),
('availability.manage', 'Gerenciar Disponibilidade', 'Criar/editar horários e bloqueios', 'Disponibilidade'),

-- CMS
('cms.read', 'Ver CMS', 'Visualizar páginas do site', 'CMS/Site'),
('cms.update', 'Editar CMS', 'Modificar conteúdo das páginas', 'CMS/Site'),

-- Blog
('blog.read', 'Ver Posts', 'Listar posts do blog', 'Blog'),
('blog.create', 'Criar Posts', 'Escrever novos posts', 'Blog'),
('blog.update', 'Editar Posts', 'Modificar posts existentes', 'Blog'),
('blog.delete', 'Excluir Posts', 'Remover posts', 'Blog'),
('blog.publish', 'Publicar Posts', 'Publicar/despublicar posts', 'Blog'),

-- Media
('media.read', 'Ver Mídia', 'Listar arquivos de mídia', 'Mídia'),
('media.create', 'Enviar Mídia', 'Fazer upload de arquivos', 'Mídia'),
('media.delete', 'Excluir Mídia', 'Remover arquivos', 'Mídia'),

-- Email
('email_templates.read', 'Ver Templates de E-mail', 'Visualizar templates', 'E-mails'),
('email_templates.update', 'Editar Templates de E-mail', 'Modificar templates', 'E-mails'),
('email_logs.read', 'Ver Logs de E-mail', 'Visualizar histórico de envios', 'E-mails'),

-- Settings
('settings.read', 'Ver Configurações', 'Visualizar configurações gerais', 'Configurações'),
('settings.update', 'Editar Configurações', 'Modificar configurações gerais', 'Configurações'),
('smtp.update', 'Configurar SMTP', 'Gerenciar configurações de e-mail SMTP', 'Configurações'),
('oauth.update', 'Configurar Integrações', 'Gerenciar Google Calendar e outras integrações', 'Configurações'),

-- Users & Security
('users.read', 'Ver Usuários', 'Listar usuários do sistema', 'Segurança'),
('users.create', 'Criar Usuários', 'Cadastrar novos usuários', 'Segurança'),
('users.update', 'Editar Usuários', 'Modificar dados de usuários', 'Segurança'),
('users.delete', 'Desativar Usuários', 'Desativar usuários do sistema', 'Segurança'),
('users.invite', 'Convidar Usuários', 'Enviar convites para equipe', 'Segurança'),
('roles.read', 'Ver Roles', 'Listar funções/cargos', 'Segurança'),
('roles.manage', 'Gerenciar Roles', 'Criar/editar funções e permissões', 'Segurança'),
('permissions.read', 'Ver Permissões', 'Listar permissões disponíveis', 'Segurança'),
('permissions.manage', 'Gerenciar Permissões', 'Criar/editar permissões', 'Segurança'),
('audit_logs.read', 'Ver Auditoria', 'Visualizar logs de auditoria', 'Segurança'),

-- Profile (client)
('portal.read', 'Acessar Portal', 'Acesso ao portal do cliente', 'Portal'),
('profile.read_self', 'Ver Meu Perfil', 'Visualizar próprio perfil', 'Portal'),
('profile.update_self', 'Editar Meu Perfil', 'Modificar próprio perfil', 'Portal'),

-- Briefing
('briefing.read', 'Ver Briefing', 'Acessar briefing do projeto', 'Briefing'),
('briefing.manage', 'Gerenciar Briefing', 'Criar links e gerenciar aprovações', 'Briefing'),

-- Messages
('messages.read', 'Ver Mensagens', 'Listar mensagens de contato', 'Mensagens'),
('messages.update', 'Gerenciar Mensagens', 'Marcar como lida/respondida', 'Mensagens');

-- 14) Seed default role permissions

-- RECEPTIONIST permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'receptionist', id FROM public.permissions WHERE key IN (
  'dashboard.read',
  'cms.read', 'cms.update',
  'blog.read', 'blog.create', 'blog.update', 'blog.publish',
  'appointments.read', 'appointments.create', 'appointments.update', 'appointments.cancel', 'appointments.reschedule',
  'clients.read', 'clients.create', 'clients.update',
  'services.read', 'services.update',
  'professionals.read',
  'availability.read', 'availability.manage',
  'plans.read', 'plans.update',
  'media.read', 'media.create', 'media.delete',
  'email_templates.read', 'email_templates.update',
  'email_logs.read',
  'settings.read',
  'messages.read', 'messages.update',
  'briefing.read', 'briefing.manage'
);

-- PROFESSIONAL permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'professional', id FROM public.permissions WHERE key IN (
  'dashboard.read',
  'appointments.read_own', 'appointments.update_own_status', 'appointments.add_notes_own',
  'clients.read_own',
  'cms.read',
  'services.read',
  'professionals.read',
  'availability.read',
  'blog.read',
  'email_templates.read',
  'briefing.read'
);

-- CLIENT permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'client', id FROM public.permissions WHERE key IN (
  'portal.read',
  'appointments.read_self', 'appointments.request_reschedule', 'appointments.request_cancel',
  'profile.read_self', 'profile.update_self'
);