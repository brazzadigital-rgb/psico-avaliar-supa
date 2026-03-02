import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Clock, MapPin, Video, DollarSign, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PriceMode, PaymentType } from "@/lib/payment-types";
import { formatCurrency, formatPriceDisplay } from "@/lib/payment-types";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  modalities: string[];
  is_active: boolean;
  display_order: number;
  // New pricing fields
  price_mode: PriceMode;
  price_from_amount: number | null;
  currency: string;
  allow_installments: boolean;
  max_installments: number;
  require_payment_to_confirm: boolean;
  payment_type: PaymentType;
  deposit_amount: number | null;
  show_price_publicly: boolean;
}

interface FormData {
  name: string;
  description: string;
  duration_minutes: number;
  price: string;
  presencial: boolean;
  online: boolean;
  // Pricing
  price_mode: PriceMode;
  price_from_amount: string;
  allow_installments: boolean;
  max_installments: number;
  require_payment_to_confirm: boolean;
  payment_type: PaymentType;
  deposit_amount: string;
  show_price_publicly: boolean;
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  duration_minutes: 50,
  price: "",
  presencial: true,
  online: true,
  price_mode: "fixed",
  price_from_amount: "",
  allow_installments: false,
  max_installments: 12,
  require_payment_to_confirm: false,
  payment_type: "none",
  deposit_amount: "",
  show_price_publicly: true,
};

export default function ServicosPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["adminServices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        modalities: Array.isArray(s.modalities) 
          ? s.modalities 
          : typeof s.modalities === 'string' 
            ? (s.modalities as string).replace(/[{}]/g, '').split(',').filter(Boolean)
            : [],
      })) as Service[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const modalities: ("presencial" | "online")[] = [];
      if (data.presencial) modalities.push("presencial");
      if (data.online) modalities.push("online");

      const payload = {
        name: data.name,
        description: data.description || null,
        duration_minutes: data.duration_minutes,
        price: data.price ? parseFloat(data.price) : null,
        modalities,
        // New pricing fields
        price_mode: data.price_mode,
        price_from_amount: data.price_from_amount ? parseFloat(data.price_from_amount) : null,
        allow_installments: data.allow_installments,
        max_installments: data.max_installments,
        require_payment_to_confirm: data.require_payment_to_confirm,
        payment_type: data.payment_type,
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : null,
        show_price_publicly: data.show_price_publicly,
        updated_at: new Date().toISOString(),
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
      toast.success(editingService ? "Serviço atualizado!" : "Serviço criado!");
      closeDialog();
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Erro ao salvar serviço");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("services")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
      toast.success("Status atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminServices"] });
      toast.success("Serviço excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir serviço");
    },
  });

  const openNewDialog = () => {
    setEditingService(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    const modalities = service.modalities || [];
    setFormData({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price: service.price?.toString() || "",
      presencial: modalities.includes("presencial"),
      online: modalities.includes("online"),
      // Pricing fields
      price_mode: service.price_mode || "fixed",
      price_from_amount: service.price_from_amount?.toString() || "",
      allow_installments: service.allow_installments || false,
      max_installments: service.max_installments || 12,
      require_payment_to_confirm: service.require_payment_to_confirm || false,
      payment_type: service.payment_type || "none",
      deposit_amount: service.deposit_amount?.toString() || "",
      show_price_publicly: service.show_price_publicly ?? true,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getPriceModeLabel = (mode: PriceMode) => {
    const labels: Record<PriceMode, string> = {
      fixed: "Valor Fixo",
      from: "A partir de",
      consult: "Sob Consulta",
    };
    return labels[mode];
  };

  const getPaymentTypeLabel = (type: PaymentType) => {
    const labels: Record<PaymentType, string> = {
      full: "Pagamento Total",
      deposit: "Entrada",
      none: "Sem Pagamento",
    };
    return labels[type];
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos e precificação</p>
        </div>
        <Button onClick={openNewDialog} className="btn-premium text-white gap-2">
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum serviço cadastrado
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="card-premium p-6 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  {!service.is_active && (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                  {service.require_payment_to_confirm && (
                    <Badge variant="default" className="gap-1">
                      <CreditCard className="w-3 h-3" />
                      Pag. Obrigatório
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    {service.duration_minutes} min
                  </span>
                  {service.modalities?.includes("presencial") && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Presencial
                    </span>
                  )}
                  {service.modalities?.includes("online") && (
                    <span className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      Online
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium text-primary">
                    <DollarSign className="w-4 h-4" />
                    {formatPriceDisplay(
                      service.price_mode,
                      service.price,
                      service.price_from_amount,
                      service.show_price_publicly
                    )}
                  </span>
                  {service.allow_installments && (
                    <span className="text-muted-foreground">
                      até {service.max_installments}x
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={service.is_active}
                  onCheckedChange={(checked) =>
                    toggleActiveMutation.mutate({ id: service.id, is_active: checked })
                  }
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openEditDialog(service)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    if (confirm("Deseja excluir este serviço?")) {
                      deleteMutation.mutate(service.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Serviço" : "Novo Serviço"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="pricing">Precificação</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min) *</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 50 })
                    }
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>Modalidades</Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={formData.presencial}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, presencial: checked })
                        }
                      />
                      Presencial
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={formData.online}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, online: checked })
                        }
                      />
                      Online
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="space-y-2">
                  <Label>Modo de Preço</Label>
                  <Select
                    value={formData.price_mode}
                    onValueChange={(value: PriceMode) =>
                      setFormData({ ...formData, price_mode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                      <SelectItem value="from">A partir de</SelectItem>
                      <SelectItem value="consult">Sob Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.price_mode === "fixed" && (
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                )}

                {formData.price_mode === "from" && (
                  <div className="space-y-2">
                    <Label>Preço mínimo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price_from_amount}
                      onChange={(e) => setFormData({ ...formData, price_from_amount: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Exibir preço publicamente</p>
                    <p className="text-sm text-muted-foreground">
                      {formData.price_mode === "consult" 
                        ? "Mostrará 'Sob Consulta'" 
                        : "O preço será visível no site"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.show_price_publicly}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, show_price_publicly: checked })
                    }
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium">Configurações de Pagamento</h4>

                  <div className="space-y-2">
                    <Label>Tipo de Pagamento</Label>
                    <Select
                      value={formData.payment_type}
                      onValueChange={(value: PaymentType) =>
                        setFormData({ ...formData, payment_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem Pagamento Online</SelectItem>
                        <SelectItem value="full">Pagamento Total</SelectItem>
                        <SelectItem value="deposit">Entrada/Sinal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.payment_type === "deposit" && (
                    <div className="space-y-2">
                      <Label>Valor da Entrada (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                  )}

                  {formData.payment_type !== "none" && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Exigir pagamento para confirmar</p>
                        <p className="text-sm text-muted-foreground">
                          A consulta só será confirmada após o pagamento
                        </p>
                      </div>
                      <Switch
                        checked={formData.require_payment_to_confirm}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, require_payment_to_confirm: checked })
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Permitir parcelamento</p>
                      <p className="text-sm text-muted-foreground">
                        Pagamento em até 12x no cartão
                      </p>
                    </div>
                    <Switch
                      checked={formData.allow_installments}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allow_installments: checked })
                      }
                    />
                  </div>

                  {formData.allow_installments && (
                    <div className="space-y-2">
                      <Label>Máximo de parcelas</Label>
                      <Select
                        value={String(formData.max_installments)}
                        onValueChange={(value) =>
                          setFormData({ ...formData, max_installments: parseInt(value) })
                        }
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
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white" disabled={saveMutation.isPending}>
                {editingService ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
