import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Globe, Share2, Mail, MessageSquare, Save, Loader2, Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SiteSettings {
  general: {
    business_name: string;
    phone: string;
    email: string;
    address: string;
    working_hours: string;
    online_scheduling_enabled: boolean;
  };
  social: {
    instagram: string;
    facebook: string;
    linkedin: string;
    youtube: string;
  };
  seo: {
    default_title: string;
    default_description: string;
    og_image: string;
  };
  whatsapp: {
    default_message: string;
  };
  smtp: {
    host: string;
    port: number;
    username: string;
    password: string;
    from_name: string;
    from_email: string;
    encryption: string;
    enabled: boolean;
  };
}

const defaultSettings: SiteSettings = {
  general: {
    business_name: "",
    phone: "",
    email: "",
    address: "",
    working_hours: "",
    online_scheduling_enabled: true,
  },
  social: {
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
  },
  seo: {
    default_title: "",
    default_description: "",
    og_image: "",
  },
  whatsapp: {
    default_message: "",
  },
  smtp: {
    host: "smtp-relay.brevo.com",
    port: 587,
    username: "",
    password: "",
    from_name: "Psicoavaliar",
    from_email: "",
    encryption: "tls",
    enabled: false,
  },
};

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<"success" | "error" | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settingsData) {
      const newSettings = { ...defaultSettings };
      settingsData.forEach((item: any) => {
        if (item.key === "general" && item.value) newSettings.general = { ...defaultSettings.general, ...item.value };
        if (item.key === "social" && item.value) newSettings.social = { ...defaultSettings.social, ...item.value };
        if (item.key === "seo" && item.value) newSettings.seo = { ...defaultSettings.seo, ...item.value };
        if (item.key === "whatsapp" && item.value) newSettings.whatsapp = { ...defaultSettings.whatsapp, ...item.value };
        if (item.key === "smtp" && item.value) newSettings.smtp = { ...defaultSettings.smtp, ...item.value };
      });
      setSettings(newSettings);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: async (key: string) => {
      const value = settings[key as keyof SiteSettings];
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_settings")
          .insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Configurações salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar");
    },
  });

  const testSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    
    try {
      // First save the current SMTP settings
      await saveMutation.mutateAsync("smtp");
      
      // Then test via edge function
      const { data, error } = await supabase.functions.invoke('test-smtp');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        setSmtpTestResult("success");
        toast.success(data.message || "Conexão SMTP testada com sucesso!");
      } else {
        setSmtpTestResult("error");
        toast.error(data?.error || "Erro ao testar conexão SMTP");
      }
    } catch (error: any) {
      console.error("SMTP test error:", error);
      setSmtpTestResult("error");
      toast.error(`Erro: ${error.message}`);
    } finally {
      setTestingSmtp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais do site</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4 hidden sm:inline" /> Geral
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="w-4 h-4 hidden sm:inline" /> Redes
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="w-4 h-4 hidden sm:inline" /> SEO
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="w-4 h-4 hidden sm:inline" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Mail className="w-4 h-4 hidden sm:inline" /> SMTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>Dados básicos da clínica exibidos no site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Negócio</Label>
                  <Input
                    value={settings.general.business_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, business_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input
                    value={settings.general.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        general: { ...settings.general, phone: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={settings.general.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Textarea
                  value={settings.general.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, address: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Horário de Funcionamento</Label>
                <Input
                  value={settings.general.working_hours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, working_hours: e.target.value },
                    })
                  }
                  placeholder="Ex: Segunda a Sexta: 8h às 20h"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <Label className="text-base">Agendamento Online</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe o botão "Agendar Online" na página inicial e permite acesso à página de agendamento
                  </p>
                </div>
                <Switch
                  checked={settings.general.online_scheduling_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      general: { ...settings.general, online_scheduling_enabled: checked },
                    })
                  }
                />
              </div>
              <Button onClick={() => saveMutation.mutate("general")} className="gap-2">
                <Save className="w-4 h-4" /> Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociais</CardTitle>
              <CardDescription>Links das redes sociais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={settings.social.instagram}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, instagram: e.target.value },
                    })
                  }
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={settings.social.facebook}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, facebook: e.target.value },
                    })
                  }
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={settings.social.linkedin}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, linkedin: e.target.value },
                    })
                  }
                  placeholder="https://linkedin.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input
                  value={settings.social.youtube}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, youtube: e.target.value },
                    })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
              <Button onClick={() => saveMutation.mutate("social")} className="gap-2">
                <Save className="w-4 h-4" /> Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Configurações padrão de SEO</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Título Padrão</Label>
                <Input
                  value={settings.seo.default_title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, default_title: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição Padrão</Label>
                <Textarea
                  value={settings.seo.default_description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, default_description: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input
                  value={settings.seo.og_image}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      seo: { ...settings.seo, og_image: e.target.value },
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              <Button onClick={() => saveMutation.mutate("seo")} className="gap-2">
                <Save className="w-4 h-4" /> Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp</CardTitle>
              <CardDescription>Mensagem pré-preenchida para o WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem Padrão</Label>
                <Textarea
                  value={settings.whatsapp.default_message}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      whatsapp: { ...settings.whatsapp, default_message: e.target.value },
                    })
                  }
                  rows={3}
                />
              </div>
              <Button onClick={() => saveMutation.mutate("whatsapp")} className="gap-2">
                <Save className="w-4 h-4" /> Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configurações SMTP (Brevo/Sendinblue)
              </CardTitle>
              <CardDescription>
                Configure o servidor SMTP para envio de e-mails automáticos. 
                Recomendamos usar o Brevo (antigo Sendinblue) para melhor entregabilidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <Label className="text-base">Ativar envio de e-mails</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilite para enviar e-mails de confirmação e lembretes
                  </p>
                </div>
                <Switch
                  checked={settings.smtp.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      smtp: { ...settings.smtp, enabled: checked },
                    })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Servidor SMTP *</Label>
                  <Input
                    value={settings.smtp.host}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, host: e.target.value },
                      })
                    }
                    placeholder="smtp-relay.brevo.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Para Brevo: smtp-relay.brevo.com
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Porta *</Label>
                  <Select
                    value={settings.smtp.port.toString()}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, port: parseInt(value) },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 (Não recomendado)</SelectItem>
                      <SelectItem value="465">465 (SSL)</SelectItem>
                      <SelectItem value="587">587 (TLS - Recomendado)</SelectItem>
                      <SelectItem value="2525">2525 (Alternativo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Login/Usuário SMTP *</Label>
                  <Input
                    value={settings.smtp.username}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, username: e.target.value },
                      })
                    }
                    placeholder="seu-email@dominio.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    No Brevo, use seu e-mail de login
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Senha/API Key SMTP *</Label>
                  <Input
                    type="password"
                    value={settings.smtp.password}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, password: e.target.value },
                      })
                    }
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    No Brevo, use a chave SMTP (não a API Key)
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Remetente</Label>
                  <Input
                    value={settings.smtp.from_name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, from_name: e.target.value },
                      })
                    }
                    placeholder="Psicoavaliar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Remetente *</Label>
                  <Input
                    type="email"
                    value={settings.smtp.from_email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        smtp: { ...settings.smtp, from_email: e.target.value },
                      })
                    }
                    placeholder="contato@psicoavaliar.com.br"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deve ser um e-mail verificado no Brevo
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Criptografia</Label>
                <Select
                  value={settings.smtp.encryption}
                  onValueChange={(value) =>
                    setSettings({
                      ...settings,
                      smtp: { ...settings.smtp, encryption: value },
                    })
                  }
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                    <SelectItem value="tls">TLS (Recomendado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={() => saveMutation.mutate("smtp")} className="gap-2">
                  <Save className="w-4 h-4" /> Salvar Configurações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={testSmtp}
                  disabled={testingSmtp}
                  className="gap-2"
                >
                  {testingSmtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : smtpTestResult === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : smtpTestResult === "error" ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Testar Conexão
                </Button>
              </div>

              <div className="mt-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Como configurar o Brevo:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Acesse <a href="https://app.brevo.com" target="_blank" rel="noopener" className="underline">app.brevo.com</a> e crie uma conta gratuita</li>
                  <li>Vá em "Transactional" → "SMTP & API"</li>
                  <li>Copie a chave SMTP (não a API Key geral)</li>
                  <li>Verifique seu domínio de e-mail em "Senders & Domains"</li>
                  <li>Use as configurações acima com servidor smtp-relay.brevo.com na porta 587</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
