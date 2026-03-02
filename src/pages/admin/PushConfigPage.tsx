import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bell,
  Key,
  RefreshCw,
  Send,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CopyButton } from "@/components/ui/copy-button";

interface PushConfig {
  id: string;
  vapid_public_key: string | null;
  vapid_private_key: string | null;
  vapid_email: string | null;
  updated_at: string;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  p256dh: string;
  auth: string;
}

export default function PushConfigPage() {
  const queryClient = useQueryClient();
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [vapidPrivateKey, setVapidPrivateKey] = useState("");
  const [senderName, setSenderName] = useState("Psicoavaliar");
  const [testTitle, setTestTitle] = useState("Teste de Notificação");
  const [testBody, setTestBody] = useState("Esta é uma notificação de teste do sistema.");

  // Fetch push config
  const { data: config, isLoading: loadingConfig, refetch: refetchConfig } = useQuery({
    queryKey: ["push-config-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_config")
        .select("*")
        .single();
      if (error) {
        console.error("Error fetching push config:", error);
        throw error;
      }
      return data as PushConfig;
    },
    staleTime: 0, // Always fetch fresh data
  });

  // Fetch all subscriptions
  const { data: subscriptions = [], isLoading: loadingSubscriptions } = useQuery({
    queryKey: ["push-subscriptions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PushSubscription[];
    },
  });

  // Populate form when config loads
  useEffect(() => {
    if (config) {
      setVapidPublicKey(config.vapid_public_key || "");
      setSenderName("Psicoavaliar");
    }
  }, [config]);

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error("Config not found");

      const updateData: any = {
        vapid_public_key: vapidPublicKey || null,
        sender_name: senderName,
        is_configured: !!vapidPublicKey && !!vapidPrivateKey,
        updated_at: new Date().toISOString(),
      };

      // Only update private key if provided (to avoid overwriting with empty)
      if (vapidPrivateKey) {
        updateData.vapid_private_key_encrypted = vapidPrivateKey;
      }

      const { error } = await supabase
        .from("push_config")
        .update(updateData)
        .eq("id", config.id);

      if (error) {
        console.error("Error saving push config:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Force refetch to get fresh data
      await refetchConfig();
      queryClient.invalidateQueries({ queryKey: ["push-config"] });
      toast.success("Configurações salvas com sucesso!");
      setVapidPrivateKey(""); // Clear private key from form
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Erro ao salvar configurações");
    },
  });

  // Test push mutation
  const testPushMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-push", {
        body: {
          test: true,
          title: testTitle,
          body: testBody,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Notificação de teste enviada!");
      } else {
        toast.error(data.message || "Falha ao enviar notificação");
      }
    },
    onError: () => {
      toast.error("Erro ao enviar notificação de teste");
    },
  });

  const handleGenerateKeys = () => {
    // Open VAPID key generator in new tab
    window.open("https://vapidkeys.com/", "_blank");
    toast.info("Use o gerador online para criar suas chaves VAPID");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Push Notifications
        </h1>
        <p className="text-muted-foreground">
          Configure notificações push para o navegador
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  config?.vapid_public_key
                    ? "bg-green-500/10 text-green-600"
                    : "bg-yellow-500/10 text-yellow-600"
                }`}
              >
                {config?.vapid_public_key ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">
                  {config?.vapid_public_key
                    ? "Push Notifications Configurado"
                    : "Push Notifications Não Configurado"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {config?.vapid_public_key
                    ? `${subscriptions.length} dispositivo(s) registrado(s)`
                    : "Configure as chaves VAPID para ativar"}
                </p>
              </div>
            </div>
            <Badge variant={config?.vapid_public_key ? "default" : "secondary"}>
              {config?.vapid_public_key ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Key className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Dispositivos ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Send className="w-4 h-4" />
            Testar
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Chaves VAPID</CardTitle>
              <CardDescription>
                As chaves VAPID são necessárias para enviar notificações push.{" "}
                <button
                  onClick={handleGenerateKeys}
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Gerar chaves online
                  <ExternalLink className="w-3 h-3" />
                </button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sender_name">Nome do Remetente</Label>
                <Input
                  id="sender_name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Psicoavaliar"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nome exibido nas notificações
                </p>
              </div>

              <div>
                <Label htmlFor="vapid_public">Chave Pública (Public Key)</Label>
                <div className="flex gap-2">
                  <Input
                    id="vapid_public"
                    value={vapidPublicKey}
                    onChange={(e) => setVapidPublicKey(e.target.value)}
                    placeholder="BNnF..."
                    className="font-mono text-sm"
                  />
                  {vapidPublicKey && <CopyButton text={vapidPublicKey} />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Usada pelo navegador para verificar a origem das notificações
                </p>
              </div>

              <div>
                <Label htmlFor="vapid_private">
                  Chave Privada (Private Key){" "}
                  {config?.vapid_private_key && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Configurada
                    </Badge>
                  )}
                </Label>
                <Input
                  id="vapid_private"
                  type="password"
                  value={vapidPrivateKey}
                  onChange={(e) => setVapidPrivateKey(e.target.value)}
                  placeholder={
                    config?.vapid_private_key
                      ? "••••••••••••••••"
                      : "Digite a chave privada..."
                  }
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usada pelo servidor para assinar as notificações (armazenada de forma segura)
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                  className="gap-2"
                >
                  {saveConfigMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos Registrados</CardTitle>
              <CardDescription>
                Lista de navegadores/dispositivos que aceitaram receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubscriptions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum dispositivo registrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Registrado em</TableHead>
                      <TableHead>Último uso</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{sub.user_agent?.slice(0, 30) || "Navegador"}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {sub.endpoint.slice(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(sub.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          -
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              await supabase
                                .from("push_subscriptions")
                                .delete()
                                .eq("id", sub.id);
                              queryClient.invalidateQueries({ queryKey: ["push-subscriptions-admin"] });
                              toast.success("Dispositivo removido");
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Notificação de Teste</CardTitle>
              <CardDescription>
                Envie uma notificação para todos os dispositivos registrados (ou seu próprio)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!config?.vapid_public_key && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning-foreground">
                  <p className="text-sm font-medium">⚠️ Push não configurado</p>
                  <p className="text-xs mt-1">
                    Configure as chaves VAPID antes de testar
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="test_title">Título</Label>
                <Input
                  id="test_title"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Título da notificação"
                />
              </div>

              <div>
                <Label htmlFor="test_body">Mensagem</Label>
                <Input
                  id="test_body"
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  placeholder="Corpo da notificação"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => testPushMutation.mutate()}
                  disabled={testPushMutation.isPending || !config?.vapid_public_key}
                  className="gap-2"
                >
                  {testPushMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
