import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, Search, Eye, CheckCircle2, XCircle, 
  MapPin, Video, Edit, ExternalLink, Phone, Mail,
  Clock, User, Clipboard, Link as LinkIcon, Save, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useCheckInNotifications } from "@/hooks/useCheckInNotifications";
import { useProfessionalId } from "@/hooks/useProfessionalId";

type AppointmentStatus = "pending" | "confirmed" | "rescheduled" | "canceled" | "completed";

export default function AgendamentosPage() {
  // Enable real-time check-in notifications
  useCheckInNotifications();

  const queryClient = useQueryClient();
  const { professionalId, isProfessional } = useProfessionalId();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "pending" as AppointmentStatus,
    video_link: "",
    internal_notes: "",
    canceled_reason: "",
  });

  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ["appointments", statusFilter, professionalId],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration_minutes, price),
          client:clients(full_name, email, phone),
          professional:professionals(name)
        `)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as AppointmentStatus);
      }

      if (isProfessional && professionalId) {
        query = query.eq("professional_id", professionalId);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching appointments:", error);
        throw error;
      }
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ ...data.updates, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento atualizado!");
      handleCloseDialog();
    },
    onError: (err) => {
      console.error("Update error:", err);
      toast.error("Erro ao atualizar agendamento");
    },
  });

  const handleOpenEdit = (apt: any) => {
    setSelectedAppointment(apt);
    setEditForm({
      status: apt.status,
      video_link: apt.video_link || "",
      internal_notes: apt.internal_notes || "",
      canceled_reason: apt.canceled_reason || "",
    });
    setIsEditing(true);
  };

  const handleCloseDialog = () => {
    setSelectedAppointment(null);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedAppointment) return;
    updateMutation.mutate({
      id: selectedAppointment.id,
      updates: {
        status: editForm.status,
        video_link: editForm.video_link || null,
        internal_notes: editForm.internal_notes || null,
        canceled_reason: editForm.canceled_reason || null,
      },
    });
  };

  const handleQuickStatus = (id: string, status: AppointmentStatus) => {
    updateMutation.mutate({ id, updates: { status } });
  };

  const filteredAppointments = appointments.filter((apt: any) =>
    apt.client?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    apt.code?.toLowerCase().includes(search.toLowerCase()) ||
    apt.service?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "pending_payment": return "bg-orange-100 text-orange-700 border-orange-200";
      case "canceled": return "bg-red-100 text-red-700 border-red-200";
      case "completed": return "bg-blue-100 text-blue-700 border-blue-200";
      case "rescheduled": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "Confirmado";
      case "pending": return "Pendente";
      case "pending_payment": return "Aguardando Pagamento";
      case "canceled": return "Cancelado";
      case "completed": return "Concluído";
      case "rescheduled": return "Remarcado";
      default: return status;
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="card-premium p-8 text-center">
          <p className="text-destructive mb-4">Erro ao carregar agendamentos</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["appointments"] })}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Agendamentos</h1>
          <p className="text-muted-foreground">
            {appointments.length} agendamento{appointments.length !== 1 ? "s" : ""} encontrado{appointments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código ou serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
            <SelectItem value="confirmed">Confirmados</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="rescheduled">Remarcados</SelectItem>
            <SelectItem value="canceled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Código</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Serviço</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data/Hora</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Modalidade</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando agendamentos...
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum agendamento encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros de busca</p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded">
                        {apt.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{apt.client?.full_name || "Cliente não informado"}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {apt.client?.phone || "-"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{apt.service?.name || "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        {apt.service?.duration_minutes} min • {formatCurrency(apt.service?.price)}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="font-medium">
                        {format(parseISO(apt.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.scheduled_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Criado: {format(parseISO(apt.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="p-4">
                      {apt.modality === "presencial" ? (
                        <Badge variant="outline" className="gap-1">
                          <MapPin className="w-3 h-3" /> Presencial
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-primary border-primary">
                          <Video className="w-3 h-3" /> Online
                          {apt.video_link && <CheckCircle2 className="w-3 h-3 ml-1" />}
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant="outline" 
                          className={cn("border w-fit", getStatusColor(apt.status))}
                        >
                          {getStatusLabel(apt.status)}
                        </Badge>
                        {apt.checked_in_at && (
                          <Badge className="bg-emerald-100 text-emerald-700 gap-1 w-fit text-xs">
                            <UserCheck className="w-3 h-3" />
                            Check-in {format(parseISO(apt.checked_in_at), "HH:mm")}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(apt)}
                          title="Ver/Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(apt.status === "pending" || apt.status === "pending_payment") && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickStatus(apt.id, "confirmed")}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Confirmar"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickStatus(apt.id, "canceled")}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Cancelar"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {apt.status === "confirmed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickStatus(apt.id, "completed")}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Marcar como concluído"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        {apt.video_link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Abrir link da reunião"
                          >
                            <a href={apt.video_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/View Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>Agendamento</span>
              <Badge variant="outline" className="font-mono">
                {selectedAppointment?.code}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="client">Cliente</TabsTrigger>
                <TabsTrigger value="notes">Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={editForm.status} 
                      onValueChange={(v) => setEditForm({ ...editForm, status: v as AppointmentStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="rescheduled">Remarcado</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Profissional</Label>
                    <Input 
                      value={selectedAppointment.professional?.name || "Não atribuído"} 
                      disabled 
                    />
                  </div>
                </div>

                {/* Service Info */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Serviço</span>
                    <span className="font-medium">{selectedAppointment.service?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Duração</span>
                    <span>{selectedAppointment.service?.duration_minutes} minutos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor</span>
                    <span className="font-medium text-primary">
                      {formatCurrency(selectedAppointment.service?.price)}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Data Agendada
                    </Label>
                    <Input 
                      value={format(parseISO(selectedAppointment.scheduled_date), "dd/MM/yyyy")} 
                      disabled 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Horário
                    </Label>
                    <Input 
                      value={`${selectedAppointment.scheduled_time?.slice(0, 5)} - ${selectedAppointment.end_time?.slice(0, 5)}`} 
                      disabled 
                    />
                  </div>
                </div>

                {/* Creation Date */}
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">
                      {format(parseISO(selectedAppointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {selectedAppointment.updated_at !== selectedAppointment.created_at && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Atualizado em:</span>
                      <span className="font-medium">
                        {format(parseISO(selectedAppointment.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Modality */}
                <div className="space-y-2">
                  <Label>Modalidade</Label>
                  <div className="flex items-center gap-2">
                    {selectedAppointment.modality === "presencial" ? (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="w-4 h-4" /> Presencial
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-primary">
                        <Video className="w-4 h-4" /> Online
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Video Link (for online appointments) */}
                {selectedAppointment.modality === "online" && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" /> Link da Videochamada (Google Meet)
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={editForm.video_link}
                        onChange={(e) => setEditForm({ ...editForm, video_link: e.target.value })}
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      />
                      {editForm.video_link && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={editForm.video_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cole aqui o link do Google Meet para esta consulta. O cliente poderá acessar pelo portal.
                    </p>
                  </div>
                )}

                {/* Cancel Reason */}
                {editForm.status === "canceled" && (
                  <div className="space-y-2">
                    <Label>Motivo do Cancelamento</Label>
                    <Textarea 
                      value={editForm.canceled_reason}
                      onChange={(e) => setEditForm({ ...editForm, canceled_reason: e.target.value })}
                      placeholder="Informe o motivo do cancelamento..."
                      rows={2}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="client" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg border space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{selectedAppointment.client?.full_name}</h4>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAppointment.client?.email || "Não informado"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAppointment.client?.phone || "Não informado"}</span>
                      {selectedAppointment.client?.phone && (
                        <Button variant="ghost" size="sm" asChild>
                          <a 
                            href={`https://wa.me/55${selectedAppointment.client.phone.replace(/\D/g, "")}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            WhatsApp
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {selectedAppointment.reason_for_visit && (
                  <div className="space-y-2">
                    <Label>Motivo da Consulta</Label>
                    <p className="text-sm p-3 bg-muted rounded-lg">
                      {selectedAppointment.reason_for_visit}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clipboard className="w-4 h-4" /> Notas Internas
                  </Label>
                  <Textarea 
                    value={editForm.internal_notes}
                    onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                    placeholder="Anotações internas sobre esta consulta (visível apenas para a equipe)..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Estas notas são visíveis apenas para administradores e profissionais.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span>{format(parseISO(selectedAppointment.created_at), "dd/MM/yyyy 'às' HH:mm")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span>{format(parseISO(selectedAppointment.updated_at), "dd/MM/yyyy 'às' HH:mm")}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
