import { useState } from "react";
import { Bell, Check, CheckCheck, ExternalLink, Calendar, CreditCard, Settings, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationBellProps {
  basePath?: string;
}

export function NotificationBell({ basePath = "/admin" }: NotificationBellProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("todas");

  const getCategoryIcon = (category: string) => {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "consultas":
        return "bg-blue-500/10 text-blue-600";
      case "pagamentos":
        return "bg-green-500/10 text-green-600";
      case "sistema":
        return "bg-orange-500/10 text-orange-600";
      case "conteudo":
        return "bg-purple-500/10 text-purple-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "todas") return true;
    return n.category === activeTab;
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    if (notification.link) {
      setOpen(false);
      navigate(notification.link);
    }
  };

  const unreadInCategory = (category: string) => {
    if (category === "todas") return unreadCount;
    return notifications.filter((n) => n.category === category && !n.is_read).length;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-2 pt-2 border-b border-border">
            <TabsList className="w-full h-9 bg-muted/50">
              <TabsTrigger value="todas" className="flex-1 text-xs relative">
                Todas
                {unreadInCategory("todas") > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                    {unreadInCategory("todas")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="consultas" className="flex-1 text-xs">
                Consultas
              </TabsTrigger>
              <TabsTrigger value="pagamentos" className="flex-1 text-xs">
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="sistema" className="flex-1 text-xs">
                Sistema
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse text-muted-foreground text-sm">
                    Carregando...
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Bell className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.slice(0, 20).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                        !notification.is_read && "bg-primary/5"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            getCategoryColor(notification.category)
                          )}
                        >
                          {getCategoryIcon(notification.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm font-medium leading-tight",
                                !notification.is_read && "font-semibold"
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notification.body && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {notification.link && (
                          <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => {
              setOpen(false);
              navigate(`${basePath}/notificacoes`);
            }}
          >
            Ver central de notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
