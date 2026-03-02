import { useState } from "react";
import { Bell, BellOff, Smartphone, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClienteConfigNotificacoes() {
  const {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    subscriptions,
    subscribe,
    unsubscribe,
    revokeSubscription,
    isLoading,
  } = usePushNotifications();

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    await revokeSubscription(id);
    setRevokingId(null);
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return "Dispositivo";
    if (userAgent.includes("Mobile")) return "📱 Celular";
    if (userAgent.includes("Tablet")) return "📱 Tablet";
    return "💻 Computador";
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-display font-bold mb-2">
          Configurações de Notificações
        </h1>
        <p className="text-muted-foreground">
          Gerencie como você recebe avisos sobre consultas e atualizações.
        </p>
      </div>

      {/* Push Notifications Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <BellOff className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">Notificações Push</CardTitle>
                <CardDescription>
                  Receba alertas diretamente no seu navegador
                </CardDescription>
              </div>
            </div>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "Ativadas" : "Desativadas"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isSupported ? (
            <div className="p-4 bg-amber-500/10 text-amber-700 rounded-lg text-sm">
              Seu navegador não suporta notificações push. Tente usar Chrome, Firefox, Edge ou Safari.
            </div>
          ) : !isConfigured ? (
            <div className="p-4 bg-muted text-muted-foreground rounded-lg text-sm">
              O sistema de notificações push ainda não foi configurado pelo administrador.
            </div>
          ) : permission === "denied" ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              Você bloqueou as notificações neste navegador. Para ativar, acesse as configurações do navegador e permita notificações para este site.
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  id="push-toggle"
                  checked={isSubscribed}
                  disabled={isLoading}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      subscribe();
                    } else {
                      unsubscribe();
                    }
                  }}
                />
                <Label htmlFor="push-toggle" className="cursor-pointer">
                  {isSubscribed
                    ? "Notificações ativadas neste dispositivo"
                    : "Ativar notificações neste dispositivo"}
                </Label>
              </div>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Devices List */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Dispositivos Autorizados</CardTitle>
                <CardDescription>
                  {subscriptions.length} dispositivo{subscriptions.length > 1 ? "s" : ""} receberá{subscriptions.length > 1 ? "ão" : ""} notificações
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub, index) => (
                <div key={sub.id}>
                  {index > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getDeviceIcon(sub.user_agent)}</span>
                      <div>
                        <div className="font-medium text-sm">
                          {sub.device_label || "Navegador"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Adicionado em{" "}
                          {format(new Date(sub.created_at), "dd 'de' MMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                          {sub.last_used_at && (
                            <>
                              {" • "}
                              Último uso:{" "}
                              {format(new Date(sub.last_used_at), "dd/MM/yyyy HH:mm", {
                                locale: ptBR,
                              })}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          disabled={revokingId === sub.id}
                        >
                          {revokingId === sub.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover dispositivo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Este dispositivo deixará de receber notificações push. Você pode reativar a qualquer momento.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(sub.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            As notificações push são enviadas mesmo quando você não está com o site aberto. Você receberá lembretes de consultas, confirmações de agendamento e outras atualizações importantes.
          </span>
        </p>
      </div>
    </div>
  );
}
