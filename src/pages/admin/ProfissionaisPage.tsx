import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, User, Phone, Mail, Briefcase } from "lucide-react";
import { toast } from "sonner";

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  registration_number: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[] | null;
  modalities: ("presencial" | "online")[] | null;
  is_active: boolean;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
}

export default function ProfissionaisPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    registration_number: "",
    bio: "",
    specialties: "",
    modality_presencial: true,
    modality_online: true,
    is_active: true,
  });

  const { data: professionals, isLoading } = useQuery({
    queryKey: ["admin-professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Professional[];
    },
  });

  const { data: services } = useQuery({
    queryKey: ["admin-services-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as Service[];
    },
  });

  const { data: professionalServices } = useQuery({
    queryKey: ["professional-services", editingProfessional?.id],
    queryFn: async () => {
      if (!editingProfessional) return [];
      const { data, error } = await supabase
        .from("professional_services")
        .select("service_id")
        .eq("professional_id", editingProfessional.id);
      if (error) throw error;
      return data.map((ps) => ps.service_id);
    },
    enabled: !!editingProfessional,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const modalities: ("presencial" | "online")[] = [];
      if (data.modality_presencial) modalities.push("presencial");
      if (data.modality_online) modalities.push("online");

      const { data: professional, error } = await supabase
        .from("professionals")
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          registration_number: data.registration_number || null,
          bio: data.bio || null,
          specialties: data.specialties ? data.specialties.split(",").map((s) => s.trim()) : null,
          modalities,
          is_active: data.is_active,
        })
        .select()
        .single();
      if (error) throw error;

      // Add services
      if (selectedServices.length > 0) {
        const { error: servicesError } = await supabase
          .from("professional_services")
          .insert(
            selectedServices.map((serviceId) => ({
              professional_id: professional.id,
              service_id: serviceId,
            }))
          );
        if (servicesError) throw servicesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
      toast.success("Profissional criado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao criar profissional");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const modalities: ("presencial" | "online")[] = [];
      if (data.modality_presencial) modalities.push("presencial");
      if (data.modality_online) modalities.push("online");

      const { error } = await supabase
        .from("professionals")
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          registration_number: data.registration_number || null,
          bio: data.bio || null,
          specialties: data.specialties ? data.specialties.split(",").map((s) => s.trim()) : null,
          modalities,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;

      // Update services - remove old and add new
      await supabase.from("professional_services").delete().eq("professional_id", id);
      if (selectedServices.length > 0) {
        const { error: servicesError } = await supabase
          .from("professional_services")
          .insert(
            selectedServices.map((serviceId) => ({
              professional_id: id,
              service_id: serviceId,
            }))
          );
        if (servicesError) throw servicesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
      toast.success("Profissional atualizado com sucesso!");
      handleCloseDialog();
    },
    onError: () => {
      toast.error("Erro ao atualizar profissional");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-professionals"] });
      toast.success("Profissional excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir profissional");
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setSelectedServices([]);
    setFormData({
      name: "",
      email: "",
      phone: "",
      registration_number: "",
      bio: "",
      specialties: "",
      modality_presencial: true,
      modality_online: true,
      is_active: true,
    });
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      email: professional.email || "",
      phone: professional.phone || "",
      registration_number: professional.registration_number || "",
      bio: professional.bio || "",
      specialties: professional.specialties?.join(", ") || "",
      modality_presencial: professional.modalities?.includes("presencial") ?? true,
      modality_online: professional.modalities?.includes("online") ?? true,
      is_active: professional.is_active,
    });
    setIsDialogOpen(true);
  };

  // Update selected services when editing
  useState(() => {
    if (professionalServices) {
      setSelectedServices(professionalServices);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProfessional) {
      updateMutation.mutate({ id: editingProfessional.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredProfessionals = professionals?.filter(
    (professional) =>
      professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.registration_number?.includes(searchTerm)
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleCloseDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? "Editar Profissional" : "Novo Profissional"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registro (CRP/CRM)</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_number: e.target.value })
                  }
                  placeholder="Ex: CRP 01/12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                <Input
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  placeholder="Ex: Terapia Cognitivo-Comportamental, Psicanálise"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Modalidades de Atendimento</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="modality_presencial"
                      checked={formData.modality_presencial}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, modality_presencial: !!checked })
                      }
                    />
                    <Label htmlFor="modality_presencial">Presencial</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="modality_online"
                      checked={formData.modality_online}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, modality_online: !!checked })
                      }
                    />
                    <Label htmlFor="modality_online">Online</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Serviços</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {services?.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id]);
                          } else {
                            setSelectedServices(
                              selectedServices.filter((id) => id !== service.id)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`service-${service.id}`} className="text-sm">
                        {service.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProfessional ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar profissionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : filteredProfessionals?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum profissional encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Modalidades</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessionals?.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{professional.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {professional.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {professional.email}
                          </div>
                        )}
                        {professional.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {professional.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {professional.registration_number ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Briefcase className="h-3 w-3" />
                          {professional.registration_number}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {professional.specialties?.slice(0, 2).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {(professional.specialties?.length ?? 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(professional.specialties?.length ?? 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {professional.modalities?.map((modality) => (
                          <Badge
                            key={modality}
                            variant={modality === "presencial" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {modality === "presencial" ? "Presencial" : "Online"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={professional.is_active ? "default" : "secondary"}
                      >
                        {professional.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(professional)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(professional.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
