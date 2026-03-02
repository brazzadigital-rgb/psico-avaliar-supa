// RBAC Route and Permission Configuration

export type AppRole = 'admin' | 'receptionist' | 'professional' | 'client';

// Route protection configuration
export interface RouteConfig {
  path: string;
  roles?: AppRole[];
  permissions?: string[];
  permissionMode?: 'any' | 'all';
  public?: boolean;
}

// Public routes (no auth required)
export const PUBLIC_ROUTES: string[] = [
  '/',
  '/quem-somos',
  '/especialidades',
  '/especialidades/avaliacao',
  '/especialidades/psicoterapia',
  '/especialidades/psicopedagogia',
  '/especialidades/psiquiatria',
  '/especialidades/terapia-aba',
  '/assinaturas',
  '/contato',
  '/blog',
  '/faq',
  '/agendar',
  '/confirmacao',
  '/consulta',
  '/politica-privacidade',
  '/termos-uso',
  '/financiamento'
];

// Auth routes (only for non-authenticated users)
export const AUTH_ROUTES: string[] = [
  '/login',
  '/cadastro',
  '/recuperar-senha'
];

// Admin route permissions mapping
export const ADMIN_ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/admin': ['dashboard.read'],
  '/admin/agendamentos': ['appointments.read', 'appointments.read_own'],
  '/admin/clientes': ['clients.read', 'clients.read_own'],
  '/admin/servicos': ['services.read'],
  '/admin/profissionais': ['professionals.read'],
  '/admin/disponibilidade': ['availability.read'],
  '/admin/planos': ['plans.read'],
  '/admin/blog': ['blog.read'],
  '/admin/mensagens': ['messages.read'],
  '/admin/email-templates': ['email_templates.read'],
  '/admin/briefing': ['briefing.read'],
  '/admin/configuracoes': ['settings.read'],
  '/admin/ajuda': ['dashboard.read'],
  // Super sensitive routes (admin only)
  '/admin/usuarios': ['users.read'],
  '/admin/roles': ['roles.read'],
  '/admin/permissoes': ['permissions.read'],
  '/admin/auditoria': ['audit_logs.read']
};

// Client route permissions
export const CLIENT_ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/cliente': ['portal.read'],
  '/cliente/consultas': ['appointments.read_self'],
  '/cliente/perfil': ['profile.read_self']
};

// Admin sidebar navigation with permission requirements
export const ADMIN_NAVIGATION = [
  { 
    name: "Dashboard", 
    href: "/admin", 
    icon: "LayoutDashboard",
    permissions: ['dashboard.read']
  },
  { 
    name: "Agendamentos", 
    href: "/admin/agendamentos", 
    icon: "Calendar",
    permissions: ['appointments.read', 'appointments.read_own']
  },
  { 
    name: "Clientes", 
    href: "/admin/clientes", 
    icon: "Users",
    permissions: ['clients.read', 'clients.read_own']
  },
  { 
    name: "Serviços", 
    href: "/admin/servicos", 
    icon: "Briefcase",
    permissions: ['services.read']
  },
  { 
    name: "Profissionais", 
    href: "/admin/profissionais", 
    icon: "Users",
    permissions: ['professionals.read']
  },
  { 
    name: "Disponibilidade", 
    href: "/admin/disponibilidade", 
    icon: "Clock",
    permissions: ['availability.read']
  },
  { 
    name: "Planos", 
    href: "/admin/planos", 
    icon: "CreditCard",
    permissions: ['plans.read']
  },
  { 
    name: "Blog", 
    href: "/admin/blog", 
    icon: "FileText",
    permissions: ['blog.read']
  },
  { 
    name: "Mensagens", 
    href: "/admin/mensagens", 
    icon: "MessageSquare",
    permissions: ['messages.read']
  },
  { 
    name: "E-mail Templates", 
    href: "/admin/email-templates", 
    icon: "Mail",
    permissions: ['email_templates.read']
  },
  { 
    name: "Briefing", 
    href: "/admin/briefing", 
    icon: "ClipboardCheck",
    permissions: ['briefing.read']
  },
  { 
    name: "Configurações", 
    href: "/admin/configuracoes", 
    icon: "Settings",
    permissions: ['settings.read']
  },
  { 
    name: "Ajuda", 
    href: "/admin/ajuda", 
    icon: "HelpCircle",
    permissions: ['dashboard.read']
  }
] as const;

// Security navigation (admin only section)
export const SECURITY_NAVIGATION = [
  {
    name: "Usuários",
    href: "/admin/usuarios",
    icon: "UserCog",
    permissions: ['users.read']
  },
  {
    name: "Roles",
    href: "/admin/roles",
    icon: "Shield",
    permissions: ['roles.read']
  },
  {
    name: "Permissões",
    href: "/admin/permissoes",
    icon: "Key",
    permissions: ['permissions.read']
  },
  {
    name: "Auditoria",
    href: "/admin/auditoria",
    icon: "FileSearch",
    permissions: ['audit_logs.read']
  }
] as const;

// Role display names
export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  admin: 'Administrador',
  receptionist: 'Recepcionista',
  professional: 'Profissional',
  client: 'Cliente'
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acesso total ao sistema, incluindo gestão de usuários e configurações',
  receptionist: 'Gerencia agendamentos, clientes, blog e configurações básicas',
  professional: 'Acesso às próprias consultas e clientes vinculados',
  client: 'Acesso ao portal do cliente para visualizar consultas e perfil'
};

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = [
  'Dashboard',
  'Consultas',
  'Clientes',
  'Serviços',
  'Profissionais',
  'Planos',
  'Disponibilidade',
  'CMS/Site',
  'Blog',
  'Mídia',
  'E-mails',
  'Configurações',
  'Segurança',
  'Portal',
  'Briefing',
  'Mensagens'
] as const;
