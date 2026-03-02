import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Mail, Calendar, MapPin, Video, Loader2, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  phone: z.string().min(10, "Telefone inválido").max(20),
  birth_date: z.string().optional(),
  preferred_modality: z.enum(["presencial", "online", "ambos"]),
});

export default function ClientePerfil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    preferred_modality: "presencial",
    notification_email: true,
    notification_whatsapp: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Get client data
  const { data: clientData, isLoading } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching client:", error);
      }
      return data;
    },
    enabled: !!user,
  });

  // Initialize form with user metadata if no client record exists
  useEffect(() => {
    if (clientData) {
      setFormData({
        full_name: clientData.full_name || "",
        phone: clientData.phone || "",
        birth_date: clientData.birth_date || "",
        preferred_modality: clientData.preferred_modality || "presencial",
        notification_email: clientData.notification_email ?? true,
        notification_whatsapp: clientData.notification_whatsapp ?? true,
      });
    } else if (user) {
      // Use metadata from auth user if no client record
      const metadata = user.user_metadata;
      setFormData(prev => ({
        ...prev,
        full_name: metadata?.full_name || "",
      }));
    }
  }, [clientData, user]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error("User not found");
      
      if (clientData?.id) {
        // Update existing client
        const { error } = await supabase
          .from("clients")
          .update({
            full_name: data.full_name,
            phone: data.phone,
            birth_date: data.birth_date || null,
            preferred_modality: data.preferred_modality as "online" | "presencial",
            notification_email: data.notification_email,
            notification_whatsapp: data.notification_whatsapp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientData.id);

        if (error) throw error;
      } else {
        // Create new client record if it doesn't exist
        const { error } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            email: user.email || "",
            full_name: data.full_name,
            phone: data.phone,
            birth_date: data.birth_date || null,
            preferred_modality: data.preferred_modality as "online" | "presencial",
            notification_email: data.notification_email,
            notification_whatsapp: data.notification_whatsapp,
            lgpd_consent: true,
            lgpd_consent_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Erro ao atualizar perfil. Tente novamente.");
    },
  });

  const handleSave = () => {
    setErrors({});

    const result = profileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  // If no client data and not loading, prompt to complete profile
  const needsProfileSetup = !clientData && !isLoading;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            {needsProfileSetup 
              ? "Complete seu perfil para uma experiência personalizada."
              : "Gerencie suas informações pessoais e preferências."
            }
          </p>
        </div>
        {!needsProfileSetup && !isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto btn-premium">
            Editar perfil
          </Button>
        ) : isEditing || needsProfileSetup ? (
          <div className="flex gap-2 w-full sm:w-auto">
            {!needsProfileSetup && (
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
            )}
            <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 sm:flex-none btn-premium">
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {needsProfileSetup ? "Salvar perfil" : "Salvar alterações"}
            </Button>
          </div>
        ) : null}
      </div>

      {needsProfileSetup && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">Complete seu cadastro</h4>
                <p className="text-sm text-muted-foreground">
                  Preencha suas informações para agendar consultas e receber lembretes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info */}
        <Card className="card-premium overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">Nome completo *</Label>
              <div className={`relative transition-all duration-300 ${focusedField === "full_name" ? "scale-[1.01]" : ""}`}>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  onFocus={() => setFocusedField("full_name")}
                  onBlur={() => setFocusedField(null)}
                  disabled={!isEditing && !needsProfileSetup}
                  placeholder="Seu nome completo"
                  className={`h-12 px-4 rounded-xl border-2 transition-all duration-300 ${
                    errors.full_name 
                      ? "border-destructive" 
                      : focusedField === "full_name"
                        ? "border-primary shadow-sm"
                        : "border-border"
                  } ${!isEditing && !needsProfileSetup ? "bg-muted/50" : "bg-card"}`}
                />
              </div>
              {errors.full_name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {errors.full_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="h-12 pl-11 rounded-xl border-2 bg-muted/50 text-muted-foreground"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">WhatsApp *</Label>
              <div className={`relative transition-all duration-300 ${focusedField === "phone" ? "scale-[1.01]" : ""}`}>
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  disabled={!isEditing && !needsProfileSetup}
                  placeholder="(51) 99999-9999"
                  className={`h-12 pl-11 rounded-xl border-2 transition-all duration-300 ${
                    errors.phone 
                      ? "border-destructive" 
                      : focusedField === "phone"
                        ? "border-primary shadow-sm"
                        : "border-border"
                  } ${!isEditing && !needsProfileSetup ? "bg-muted/50" : "bg-card"}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date" className="text-sm font-medium">Data de Nascimento</Label>
              <div className={`relative transition-all duration-300 ${focusedField === "birth_date" ? "scale-[1.01]" : ""}`}>
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  onFocus={() => setFocusedField("birth_date")}
                  onBlur={() => setFocusedField(null)}
                  disabled={!isEditing && !needsProfileSetup}
                  className={`h-12 pl-11 rounded-xl border-2 transition-all duration-300 ${
                    focusedField === "birth_date"
                      ? "border-primary shadow-sm"
                      : "border-border"
                  } ${!isEditing && !needsProfileSetup ? "bg-muted/50" : "bg-card"}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="card-premium overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b">
            <CardTitle className="text-lg">Preferências</CardTitle>
            <CardDescription>Configure suas preferências de atendimento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Modalidade preferida</Label>
              <RadioGroup
                value={formData.preferred_modality}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferred_modality: value })
                }
                disabled={!isEditing && !needsProfileSetup}
                className="space-y-2"
              >
                {[
                  { value: "presencial", label: "Presencial", icon: MapPin },
                  { value: "online", label: "Online", icon: Video },
                  { value: "ambos", label: "Sem preferência", icon: null },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      formData.preferred_modality === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    } ${!isEditing && !needsProfileSetup ? "opacity-70" : ""}`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer flex-1">
                      {option.icon && <option.icon className="w-4 h-4 text-muted-foreground" />}
                      {option.label}
                    </Label>
                    {formData.preferred_modality === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Notificações</Label>
              
              {[
                { id: "notification_email", label: "E-mail", description: "Receber lembretes por e-mail" },
                { id: "notification_whatsapp", label: "WhatsApp", description: "Receber lembretes por WhatsApp" },
              ].map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                    formData[notification.id as keyof typeof formData]
                      ? "border-accent/30 bg-accent/5"
                      : "border-border"
                  }`}
                >
                  <div className="space-y-0.5">
                    <Label htmlFor={notification.id} className="font-medium">{notification.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                  <Switch
                    id={notification.id}
                    checked={formData[notification.id as keyof typeof formData] as boolean}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, [notification.id]: checked })
                    }
                    disabled={!isEditing && !needsProfileSetup}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LGPD Info */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">Seus dados estão protegidos</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seus dados são tratados conforme a LGPD. Você pode solicitar a exclusão
                dos seus dados a qualquer momento entrando em contato conosco.
              </p>
              {clientData?.lgpd_consent_at && (
                <p className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                  <Check className="w-3 h-3 text-accent" />
                  Consentimento registrado em:{" "}
                  {new Date(clientData.lgpd_consent_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
