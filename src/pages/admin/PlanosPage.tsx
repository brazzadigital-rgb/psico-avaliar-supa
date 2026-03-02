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
  price: number | null;
  price_display: string | null;
  benefits: string[] | null;
  is_highlighted: boolean;
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
    price_display: "",
    benefits: "",
    is_highlighted: false,
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
        price_display: data.price_display || null,
        benefits: data.benefits ? data.benefits.split("\n").filter(Boolean) : null,
        is_highlighted: data.is_highlighted,
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
      price_display: "",
      benefits: "",
      is_highlighted: false,
      is_active: true,
    });
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      price_display: plan.price_display || "",
      benefits: plan.benefits?.join("\n") || "",
      is_highlighted: plan.is_highlighted,
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
                plan.is_highlighted && "ring-2 ring-primary",
                !plan.is_active && "opacity-60"
              )}
            >
              {plan.is_highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Recomendado
                  </span>
                </div>
              )}
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
                  {plan.price_display || "Sob consulta"}
                </div>

                {plan.benefits && plan.benefits.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
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
              <Label>Preço (exibição)</Label>
              <Input
                value={formData.price_display}
                onChange={(e) => setFormData({ ...formData, price_display: e.target.value })}
                placeholder="Ex: R$ 450/mês ou Sob consulta"
              />
            </div>

            <div className="space-y-2">
              <Label>Benefícios (um por linha)</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                rows={5}
                placeholder="1 sessão semanal de 50 min&#10;Atendimento presencial ou online&#10;Acompanhamento contínuo"
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={formData.is_highlighted}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_highlighted: checked })
                  }
                />
                <span className="text-sm">Destacar</span>
              </label>
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
