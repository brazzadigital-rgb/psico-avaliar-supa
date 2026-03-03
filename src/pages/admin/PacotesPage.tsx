import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Star, Package, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PackageItem {
  service_id: string;
  quantity: number;
  service_name?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  promotional_price: number;
  original_price: number;
  is_active: boolean;
  is_highlighted: boolean;
  display_order: number;
  items: PackageItem[];
}

interface Service {
  id: string;
  name: string;
  price: number | null;
}

export default function PacotesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    promotional_price: "",
    is_active: true,
    is_highlighted: false,
  });
  const [items, setItems] = useState<PackageItem[]>([]);

  // Fetch services for the selector
  const { data: services = [] } = useQuery({
    queryKey: ["admin-services-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Service[];
    },
  });

  // Fetch packages with items
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data: pkgs, error } = await supabase
        .from("service_packages")
        .select("*")
        .order("display_order");
      if (error) throw error;

      const { data: allItems, error: itemsError } = await supabase
        .from("service_package_items")
        .select("*, services(name)");
      if (itemsError) throw itemsError;

      return (pkgs || []).map((pkg: any) => ({
        ...pkg,
        items: (allItems || [])
          .filter((item: any) => item.package_id === pkg.id)
          .map((item: any) => ({
            service_id: item.service_id,
            quantity: item.quantity,
            service_name: item.services?.name,
          })),
      })) as ServicePackage[];
    },
  });

  const calculateOriginalPrice = (packageItems: PackageItem[]) => {
    return packageItems.reduce((total, item) => {
      const service = services.find((s) => s.id === item.service_id);
      return total + (service?.price || 0) * item.quantity;
    }, 0);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const original_price = calculateOriginalPrice(items);
      const payload = {
        name: formData.name,
        description: formData.description || null,
        promotional_price: parseFloat(formData.promotional_price) || 0,
        original_price,
        is_active: formData.is_active,
        is_highlighted: formData.is_highlighted,
        updated_at: new Date().toISOString(),
      };

      let packageId: string;

      if (editingPackage) {
        packageId = editingPackage.id;
        const { error } = await supabase
          .from("service_packages")
          .update(payload)
          .eq("id", packageId);
        if (error) throw error;

        // Delete old items and re-insert
        await supabase
          .from("service_package_items")
          .delete()
          .eq("package_id", packageId);
      } else {
        const { data, error } = await supabase
          .from("service_packages")
          .insert([{ ...payload, display_order: packages.length }])
          .select("id")
          .single();
        if (error) throw error;
        packageId = data.id;
      }

      // Insert items
      if (items.length > 0) {
        const { error } = await supabase.from("service_package_items").insert(
          items.map((item) => ({
            package_id: packageId,
            service_id: item.service_id,
            quantity: item.quantity,
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success(editingPackage ? "Pacote atualizado!" : "Pacote criado!");
      handleCloseDialog();
    },
    onError: () => toast.error("Erro ao salvar pacote"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("Pacote excluído!");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("service_packages")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("Status atualizado!");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPackage(null);
    setFormData({ name: "", description: "", promotional_price: "", is_active: true, is_highlighted: false });
    setItems([]);
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      promotional_price: String(pkg.promotional_price),
      is_active: pkg.is_active,
      is_highlighted: pkg.is_highlighted,
    });
    setItems(pkg.items.map((i) => ({ service_id: i.service_id, quantity: i.quantity })));
    setIsDialogOpen(true);
  };

  const addItem = () => {
    if (services.length === 0) return;
    // Add first service not already in the list
    const available = services.find((s) => !items.some((i) => i.service_id === s.id));
    if (available) {
      setItems([...items, { service_id: available.id, quantity: 1 }]);
    } else {
      // Allow duplicate
      setItems([...items, { service_id: services[0].id, quantity: 1 }]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "service_id" | "quantity", value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Adicione pelo menos um serviço ao pacote");
      return;
    }
    saveMutation.mutate();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const discount = (original: number, promo: number) => {
    if (original <= 0) return 0;
    return Math.round(((original - promo) / original) * 100);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Pacotes de Serviços</h1>
          <p className="text-muted-foreground">
            Combine serviços com preço promocional
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="btn-premium text-white gap-2">
          <Plus className="w-4 h-4" />
          Novo Pacote
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : packages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            Nenhum pacote cadastrado
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={cn("relative", !pkg.is_active && "opacity-60")}>
              {pkg.is_highlighted && (
                <div className="absolute -top-3 left-4">
                  <Badge className="gap-1 bg-accent text-accent-foreground">
                    <Star className="w-3 h-3" /> Destaque
                  </Badge>
                </div>
              )}
              <CardContent className="pt-8 pb-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{pkg.name}</h3>
                  <Switch
                    checked={pkg.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: pkg.id, is_active: checked })
                    }
                  />
                </div>
                {pkg.description && (
                  <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                )}

                <div className="space-y-1 mb-4">
                  {pkg.items.map((item, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.quantity}x</Badge>
                      <span>{item.service_name || "Serviço"}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  {pkg.original_price > pkg.promotional_price && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatCurrency(pkg.original_price)}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(pkg.promotional_price)}
                    </span>
                    {pkg.original_price > pkg.promotional_price && (
                      <Badge variant="secondary" className="text-xs">
                        -{discount(pkg.original_price, pkg.promotional_price)}%
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(pkg)}>
                    <Edit className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Excluir este pacote?")) deleteMutation.mutate(pkg.id);
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? "Editar Pacote" : "Novo Pacote"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pacote Avaliação Completa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do pacote..."
                rows={2}
              />
            </div>

            {/* Service items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Serviços do Pacote *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                  Nenhum serviço adicionado
                </p>
              )}

              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={item.service_id}
                    onValueChange={(v) => updateItem(index, "service_id", v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.price ? `(R$ ${s.price})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {items.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Preço original calculado: {formatCurrency(calculateOriginalPrice(items))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preço Promocional (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.promotional_price}
                onChange={(e) => setFormData({ ...formData, promotional_price: e.target.value })}
                placeholder="0,00"
                required
              />
              {items.length > 0 && formData.promotional_price && (
                <p className="text-sm text-accent font-medium">
                  Desconto de {discount(calculateOriginalPrice(items), parseFloat(formData.promotional_price) || 0)}%
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <span className="text-sm">Ativo</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={formData.is_highlighted}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked })}
                />
                <span className="text-sm">Destaque</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium text-white" disabled={saveMutation.isPending}>
                {editingPackage ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
