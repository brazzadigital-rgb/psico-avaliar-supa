import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Search,
  CheckCheck,
  Calendar,
  CreditCard,
  Settings,
  FileText,
  ExternalLink,
  Filter,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function NotificacoesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const getCategoryIcon = (category: Notification["category"]) => {
    switch (category) {
      case "consultas":
        return <Calendar className="w-4 h-4" />;
      case "pagamentos":
        return <CreditCard className="w-4 h-4" />;
      case "sistema":
        return <Settings className="w-4 h-4" />;
      case "conteudo":
        return <FileText className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: Notification["category"]) => {
    switch (category) {
      case "consultas":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "pagamentos":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "sistema":
        return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "conteudo":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (category: Notification["category"]) => {
    switch (category) {
      case "consultas":
        return "Consultas";
      case "pagamentos":
        return "Pagamentos";
      case "sistema":
        return "Sistema";
      case "conteudo":
        return "Conteúdo";
      default:
        return category;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch =
      search === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "todas" || n.category === categoryFilter;
    
    const matchesStatus =
      statusFilter === "todas" ||
      (statusFilter === "lidas" && n.read_at) ||
      (statusFilter === "nao-lidas" && !n.read_at);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    consultas: notifications.filter((n) => n.category === "consultas").length,
    pagamentos: notifications.filter((n) => n.category === "pagamentos").length,
    sistema: notifications.filter((n) => n.category === "sistema").length,
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMarkSelectedAsRead = () => {
    if (selectedNotifications.length > 0) {
      markAsRead(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Central de Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas notificações do sistema
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="gap-2" onClick={() => markAllAsRead()}>
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unread}</p>
              <p className="text-xs text-muted-foreground">Não lidas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.consultas}</p>
              <p className="text-xs text-muted-foreground">Consultas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pagamentos}</p>
              <p className="text-xs text-muted-foreground">Pagamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sistema}</p>
              <p className="text-xs text-muted-foreground">Sistema</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificações..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="consultas">Consultas</SelectItem>
                <SelectItem value="pagamentos">Pagamentos</SelectItem>
                <SelectItem value="sistema">Sistema</SelectItem>
                <SelectItem value="conteudo">Conteúdo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="lidas">Lidas</SelectItem>
                <SelectItem value="nao-lidas">Não lidas</SelectItem>
              </SelectContent>
            </Select>
            {selectedNotifications.length > 0 && (
              <Button variant="outline" className="gap-2" onClick={handleMarkSelectedAsRead}>
                <Check className="w-4 h-4" />
                Marcar selecionadas ({selectedNotifications.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-muted-foreground">Carregando...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">Nenhuma notificação encontrada</p>
              <p className="text-sm">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !notification.read_at && "bg-primary/5",
                    false
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1.5 w-4 h-4 rounded border-border"
                    />
                    
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        getCategoryColor(notification.category)
                      )}
                    >
                      {getCategoryIcon(notification.category)}
                    </div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "font-medium",
                                !notification.read_at && "font-semibold"
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.read_at && (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                          {notification.body && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className={cn("text-xs", getCategoryColor(notification.category))}>
                              {getCategoryLabel(notification.category)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                        </div>
                        {notification.link && (
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
