import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  Clock,
  Settings,
  Menu,
  X,
  FileText,
  CreditCard,
  Mail,
  MessageSquare,
  HelpCircle,
  ClipboardCheck,
  UserCog,
  Shield,
  Key,
  FileSearch,
  ShoppingCart,
  Wallet,
  UserCheck,
  Bell,
  BarChart3,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-psicoavaliar.png";
import { NotificationBell } from "@/components/notifications/NotificationBell";

// Navegação organizada por categorias
const navCategories = [
  {
    label: null, // Sem label = itens principais
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard, permissions: ['dashboard.read'] },
    ]
  },
  {
    label: "Atendimento",
    items: [
      { name: "Recepção", href: "/admin/recepcao", icon: UserCheck, permissions: ['appointments.read', 'appointments.read_own'] },
      { name: "Agendamentos", href: "/admin/agendamentos", icon: Calendar, permissions: ['appointments.read', 'appointments.read_own'] },
      { name: "Clientes", href: "/admin/clientes", icon: Users, permissions: ['clients.read', 'clients.read_own'] },
    ]
  },
  {
    label: "Clínica",
    items: [
      { name: "Serviços", href: "/admin/servicos", icon: Briefcase, permissions: ['services.read'] },
      { name: "Profissionais", href: "/admin/profissionais", icon: Users, permissions: ['professionals.read'] },
      { name: "Disponibilidade", href: "/admin/disponibilidade", icon: Clock, permissions: ['availability.read'] },
      { name: "Planos", href: "/admin/planos", icon: CreditCard, permissions: ['plans.read'] },
    ]
  },
  {
    label: "Financeiro",
    items: [
      { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart, permissions: ['dashboard.read'] },
      { name: "Pagamentos", href: "/admin/pagamentos", icon: Wallet, permissions: ['dashboard.read'] },
    ]
  },
  {
    label: "Conteúdo",
    items: [
      { name: "Blog", href: "/admin/blog", icon: FileText, permissions: ['blog.read'] },
      { name: "Mensagens", href: "/admin/mensagens", icon: MessageSquare, permissions: ['messages.read'] },
      { name: "E-mail Templates", href: "/admin/email-templates", icon: Mail, permissions: ['email_templates.read'] },
      { name: "Push Config", href: "/admin/push", icon: Bell, permissions: ['notifications.manage'] },
      { name: "Briefing", href: "/admin/briefing", icon: ClipboardCheck, permissions: ['briefing.read'] },
    ]
  },
  {
    label: "Segurança",
    items: [
      { name: "Usuários", href: "/admin/usuarios", icon: UserCog, permissions: ['users.read'] },
      { name: "Roles", href: "/admin/roles", icon: Shield, permissions: ['roles.read'] },
      { name: "Permissões", href: "/admin/permissoes", icon: Key, permissions: ['permissions.read'] },
      { name: "Auditoria", href: "/admin/auditoria", icon: FileSearch, permissions: ['audit_logs.read'] },
    ]
  },
  {
    label: "Sistema",
    items: [
      { name: "Notificações", href: "/admin/notificacoes", icon: Bell, permissions: ['notifications.read'] },
      { name: "Relatórios", href: "/admin/relatorios", icon: BarChart3, permissions: ['reports.read'] },
      { name: "Configurações", href: "/admin/configuracoes", icon: Settings, permissions: ['settings.read'] },
      { name: "Ajuda", href: "/admin/ajuda", icon: HelpCircle, permissions: ['dashboard.read'] },
    ]
  },
];

export default function AdminLayout() {
  const { user, loading, isAdmin, signOut, userRole } = useAuth();
  const { hasAnyPermission, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao Site</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Filter navigation categories based on permissions
  const visibleCategories = navCategories
    .map(category => ({
      ...category,
      items: category.items.filter(item => hasAnyPermission(item.permissions))
    }))
    .filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-sm">
            <img src={logoImage} alt="Psicoavaliar" className="w-full h-full object-cover" />
          </div>
          <span className="font-display font-semibold text-primary">Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell basePath="/admin" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 z-40 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex-shrink-0 flex items-center px-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white shadow-sm">
              <img src={logoImage} alt="Psicoavaliar" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-display font-bold text-primary block leading-tight">Psicoavaliar</span>
              <span className="text-xs text-muted-foreground">
                {userRole === 'professional' ? 'Painel Profissional' : 'Painel Admin'}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation by Categories - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {visibleCategories.map((category, categoryIndex) => (
            <div key={category.label || 'main'} className={categoryIndex > 0 ? "mt-5" : ""}>
              {category.label && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category.label}
                </div>
              )}
              <div className="space-y-1">
                {category.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Menu - Fixed at bottom */}
        <ProfileMenu variant="admin" />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
