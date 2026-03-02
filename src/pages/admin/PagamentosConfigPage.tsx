import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, CreditCard, QrCode, FileText, Shield, Webhook, Copy, Check, Eye, EyeOff } from "lucide-react";
import type { PaymentProviderConfig, PaymentSettings } from "@/lib/payment-types";

export default function PagamentosConfigPage() {
  const queryClient = useQueryClient();
  const [copiedWebhook, setCopiedWebhook] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  // Fetch provider configs
  const { data: providerConfigs, isLoading: loadingConfigs } = useQuery({
    queryKey: ["payment-provider-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_provider_configs")
        .select("*")
        .order("provider");
      if (error) throw error;
      return data as PaymentProviderConfig[];
    },
  });

  // Fetch payment settings
  const { data: paymentSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*");
      if (error) throw error;
      
      const settings: Partial<PaymentSettings> = {};
      data?.forEach((row: { key: string; value: unknown }) => {
        (settings as Record<string, unknown>)[row.key] = row.value;
      });
      return settings as PaymentSettings;
    },
  });

  // State for form
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<Partial<PaymentSettings>>({});

  useEffect(() => {
    if (providerConfigs) {
      const configMap: Record<string, Partial<PaymentProviderConfig>> = {};
      providerConfigs.forEach((config) => {
        configMap[config.provider] = config;
      });
      setConfigs(configMap);
    }
  }, [providerConfigs]);

  useEffect(() => {
    if (paymentSettings) {
      setSettings(paymentSettings);
    }
  }, [paymentSettings]);

  // Update provider config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ provider, updates }: { provider: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("payment_provider_configs")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("provider", provider);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-provider-configs"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("payment_settings")
        .update({
          value: JSON.parse(JSON.stringify(value)),
          updated_at: new Date().toISOString(),
        })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      toast.success("Configuração salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const handleCopyWebhook = (provider: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(provider);
    setTimeout(() => setCopiedWebhook(null), 2000);
  };

  const getWebhookUrl = (provider: string) => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "uzpugegwpypaqcavxuxe";
    return `https://${projectId}.supabase.co/functions/v1/webhook-${provider}`;
  };

  const providerInfo: Record<string, { name: string; icon: React.ReactNode; description: string; fields: { key: string; label: string; type: string; placeholder: string }[] }> = {
    mercadopago: {
      name: "Mercado Pago",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Aceite Pix, cartões de crédito/débito e boleto via Mercado Pago",
      fields: [
        { key: "access_token", label: "Access Token", type: "password", placeholder: "APP_USR-..." },
        { key: "public_key", label: "Public Key", type: "text", placeholder: "APP_USR-..." },
      ],
    },
    appmax: {
      name: "Appmax",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Gateway brasileiro com foco em alta conversão",
      fields: [
        { key: "api_key", label: "API Key", type: "password", placeholder: "Sua API Key" },
        { key: "secret_key", label: "Secret Key", type: "password", placeholder: "Sua Secret Key" },
      ],
    },
  };

  if (loadingConfigs || loadingSettings) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações de Pagamento</h1>
          <p className="text-muted-foreground">Gerencie gateways, métodos de pagamento e configurações do checkout</p>
        </div>
      </div>

      <Tabs defaultValue="gateways" className="space-y-6">
        <TabsList>
          <TabsTrigger value="gateways" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Gateways
          </TabsTrigger>
          <TabsTrigger value="methods" className="gap-2">
            <QrCode className="h-4 w-4" />
            Métodos
          </TabsTrigger>
          <TabsTrigger value="checkout" className="gap-2">
            <FileText className="h-4 w-4" />
            Checkout
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Gateways Tab */}
        <TabsContent value="gateways" className="space-y-6">
          {Object.entries(providerInfo).map(([provider, info]) => {
            const config = configs[provider] || {};
            const credentials = (config.credentials_encrypted_json || {}) as Record<string, string>;

            return (
              <Card key={provider}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {info.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {info.name}
                          {config.is_active && (
                            <Badge variant="default" className="text-xs">Ativo</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config.is_active || false}
                      onCheckedChange={(checked) => {
                        updateConfigMutation.mutate({
                          provider,
                          updates: { is_active: checked },
                        });
                      }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Ambiente</Label>
                      <Select
                        value={config.environment || "sandbox"}
                        onValueChange={(value) => {
                          setConfigs({
                            ...configs,
                            [provider]: { ...config, environment: value as "sandbox" | "production" },
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                          <SelectItem value="production">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-medium">Credenciais</h4>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      {info.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                          <Label htmlFor={`${provider}-${field.key}`}>{field.label}</Label>
                          <div className="relative">
                            <Input
                              id={`${provider}-${field.key}`}
                              type={showCredentials[`${provider}-${field.key}`] ? "text" : field.type}
                              placeholder={field.placeholder}
                              value={credentials[field.key] || ""}
                              onChange={(e) => {
                                setConfigs({
                                  ...configs,
                                  [provider]: {
                                    ...config,
                                    credentials_encrypted_json: {
                                      ...credentials,
                                      [field.key]: e.target.value,
                                    },
                                  },
                                });
                              }}
                            />
                            {field.type === "password" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => {
                                  setShowCredentials({
                                    ...showCredentials,
                                    [`${provider}-${field.key}`]: !showCredentials[`${provider}-${field.key}`],
                                  });
                                }}
                              >
                                {showCredentials[`${provider}-${field.key}`] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => {
                        updateConfigMutation.mutate({
                          provider,
                          updates: {
                            environment: config.environment,
                            credentials_encrypted_json: config.credentials_encrypted_json,
                          },
                        });
                      }}
                      disabled={updateConfigMutation.isPending}
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>Ative ou desative métodos de pagamento no checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <QrCode className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Pix</p>
                      <p className="text-sm text-muted-foreground">Pagamento instantâneo via QR Code</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enabled_methods?.pix ?? true}
                    onCheckedChange={(checked) => {
                      const newMethods = { ...settings.enabled_methods, pix: checked };
                      updateSettingsMutation.mutate({ key: "enabled_methods", value: newMethods });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Cartão de Crédito/Débito</p>
                      <p className="text-sm text-muted-foreground">Visa, Mastercard, Elo e outros</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enabled_methods?.card ?? true}
                    onCheckedChange={(checked) => {
                      const newMethods = { ...settings.enabled_methods, card: checked };
                      updateSettingsMutation.mutate({ key: "enabled_methods", value: newMethods });
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Boleto Bancário</p>
                      <p className="text-sm text-muted-foreground">Compensação em até 3 dias úteis</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.enabled_methods?.boleto ?? false}
                    onCheckedChange={(checked) => {
                      const newMethods = { ...settings.enabled_methods, boleto: checked };
                      updateSettingsMutation.mutate({ key: "enabled_methods", value: newMethods });
                    }}
                  />
                </div>
              </div>

              <div className="pt-6 border-t space-y-4">
                <h4 className="font-medium">Parcelamento</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Habilitar parcelamento</p>
                      <p className="text-sm text-muted-foreground">Permitir pagamento parcelado no cartão</p>
                    </div>
                    <Switch
                      checked={settings.installments?.enabled ?? true}
                      onCheckedChange={(checked) => {
                        const newInstallments = { ...settings.installments, enabled: checked };
                        updateSettingsMutation.mutate({ key: "installments", value: newInstallments });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máximo de parcelas</Label>
                    <Select
                      value={String(settings.installments?.max || 12)}
                      onValueChange={(value) => {
                        const newInstallments = { ...settings.installments, max: parseInt(value) };
                        updateSettingsMutation.mutate({ key: "installments", value: newInstallments });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checkout Tab */}
        <TabsContent value="checkout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Textos do Checkout</CardTitle>
              <CardDescription>Personalize os textos exibidos na página de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={settings.checkout_text?.title || ""}
                  onChange={(e) => {
                    const newText = { ...settings.checkout_text, title: e.target.value };
                    setSettings({ ...settings, checkout_text: newText });
                  }}
                  onBlur={() => {
                    updateSettingsMutation.mutate({ key: "checkout_text", value: settings.checkout_text });
                  }}
                  placeholder="Finalizar Pagamento"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={settings.checkout_text?.description || ""}
                  onChange={(e) => {
                    const newText = { ...settings.checkout_text, description: e.target.value };
                    setSettings({ ...settings, checkout_text: newText });
                  }}
                  onBlur={() => {
                    updateSettingsMutation.mutate({ key: "checkout_text", value: settings.checkout_text });
                  }}
                  placeholder="Complete seu pagamento de forma segura"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Política de Cancelamento</CardTitle>
              <CardDescription>Texto exibido sobre a política de reembolso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Texto da política</Label>
                <Textarea
                  value={settings.cancellation_policy?.text || ""}
                  onChange={(e) => {
                    const newPolicy = { text: e.target.value };
                    setSettings({ ...settings, cancellation_policy: newPolicy });
                  }}
                  onBlur={() => {
                    updateSettingsMutation.mutate({ key: "cancellation_policy", value: settings.cancellation_policy });
                  }}
                  placeholder="Cancelamentos devem ser feitos com 24h de antecedência..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>URLs de Webhook</CardTitle>
              <CardDescription>
                Configure estas URLs no painel de cada gateway para receber notificações de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(providerInfo).map(([provider, info]) => (
                <div key={provider} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {info.icon}
                    <span className="font-medium">{info.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                      {getWebhookUrl(provider)}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyWebhook(provider, getWebhookUrl(provider))}
                    >
                      {copiedWebhook === provider ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs de Webhook</CardTitle>
              <CardDescription>Últimos eventos recebidos dos gateways</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                Os logs de webhook aparecerão aqui após configurar as credenciais e receber eventos.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
