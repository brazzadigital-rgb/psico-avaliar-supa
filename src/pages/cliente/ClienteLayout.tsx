import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  MessageCircle,
  CreditCard,
  Bell,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PushOptIn } from "@/components/notifications/PushOptIn";
import logoPsicoavaliar from "@/assets/logo-cliente-panel.webp";

const navigation = [
  { name: "Início", href: "/cliente", icon: LayoutDashboard },
  { name: "Minhas Consultas", href: "/cliente/consultas", icon: Calendar },
  { name: "Meus Pagamentos", href: "/cliente/pagamentos", icon: CreditCard },
  { name: "Notificações", href: "/cliente/notificacoes", icon: Bell },
  { name: "Config. Notificações", href: "/cliente/config-notificacoes", icon: Settings },
  { name: "Meu Perfil", href: "/cliente/perfil", icon: User },
];

export default function ClienteLayout() {
  const { user, loading, signOut, userRole } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // Get client data
  const { data: clientData } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is admin/staff/professional, redirect to admin
  if (userRole && userRole !== "client") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-50">
        <Link to="/cliente" className="flex items-center gap-2">
          <img src={logoPsicoavaliar} alt="Psicoavaliar" className="w-10 h-10 rounded-full object-contain" />
          <span className="font-display font-bold">Minha Área</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell basePath="/cliente" />
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 z-40",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/cliente" className="flex items-center gap-3">
            <img src={logoPsicoavaliar} alt="Psicoavaliar" className="w-12 h-12 rounded-full object-contain" />
            <div>
              <span className="font-display font-bold block">Psicoavaliar</span>
              <span className="text-xs text-muted-foreground">Área do Cliente</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
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
        </nav>

        {/* WhatsApp CTA */}
        <div className="px-4 mt-4">
          <a
            href="https://wa.me/5551992809471?text=Olá! Gostaria de tirar uma dúvida."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Tirar dúvidas no WhatsApp</span>
          </a>
        </div>

        {/* User Menu */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-medium text-primary">
                {clientData?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {clientData?.full_name || user.email}
              </div>
              <div className="text-xs text-muted-foreground">Cliente</div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
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

      {/* Push Opt-In Banner */}
      <PushOptIn />
    </div>
  );
}
