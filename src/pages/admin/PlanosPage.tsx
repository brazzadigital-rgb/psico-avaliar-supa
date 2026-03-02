import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  sessions_included: number | null;
  features: unknown;
  is_active: boolean;
  display_order: number;
}

export default function PlanosPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_days: "30",
    sessions_included: "",
    is_active: true,
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        duration_days: parseInt(data.duration_days) || 30,
        sessions_included: data.sessions_included ? parseInt(data.sessions_included) : null,
        is_active: data.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("plans")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plans").insert([{
          ...payload,
          display_order: (plans?.length || 0) + 1,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao salvar plano");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Plano excluído!");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("plans")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-plans"] });
      toast.success("Status atualizado!");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_days: "30",
      sessions_included: "",
      is_active: true,
    });
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price: String(plan.price || ""),
      duration_days: String(plan.duration_days || 30),
      sessions_included: plan.sessions_included ? String(plan.sessions_included) : "",
      is_active: plan.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Planos de Assinatura</h1>
          <p className="text-muted-foreground">Gerencie os planos exibidos no site</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="btn-premium text-white gap-2">
          <Plus className="w-4 h-4" />
          Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : plans?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum plano cadastrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative",
                !plan.is_active && "opacity-60"
              )}
            >
              <CardContent className="pt-8 pb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: plan.id, is_active: checked })
                      }
                    />
                  </div>
                </div>

                <div className="text-2xl font-bold text-primary mb-4">
                  {plan.price ? `R$ ${plan.price}` : "Sob consulta"}
                </div>

                {plan.duration_days && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Duração: {plan.duration_days} dias
                  </p>
                )}
                {plan.sessions_included && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.sessions_included} sessões incluídas
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Excluir este plano?")) {
                        deleteMutation.mutate(plan.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: 1 sessão por semana"
              />
            </div>

            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Ex: 450.00"
                type="number"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label>Duração (dias)</Label>
              <Input
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                placeholder="30"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label>Sessões incluídas</Label>
              <Input
                value={formData.sessions_included}
                onChange={(e) => setFormData({ ...formData, sessions_included: e.target.value })}
                placeholder="Ex: 4"
                type="number"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <span className="text-sm">Ativo</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white">
                {editingPlan ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
