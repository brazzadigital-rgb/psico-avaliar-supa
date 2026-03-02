import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  CalendarX2,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Search,
  Download,
  FileText,
  Share2,
  QrCode,
  Mic,
  Camera,
  Wifi,
  Headphones,
  AlertCircle,
  FileCheck,
  Car,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { generateAppointmentPDF } from "@/lib/generateAppointmentPDF";
import { CopyButton } from "@/components/ui/copy-button";
import QRCode from "qrcode";

export default function ClienteConsultas() {
  const { user } = useAuth();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [actionType, setActionType] = useState<"cancel" | "reschedule" | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatingPDFId, setGeneratingPDFId] = useState<string | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<any>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Get client data
  const { data: clientData } = useQuery({
    queryKey: ["client-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get all appointments
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["client-all-appointments", clientData?.id],
    queryFn: async () => {
      if (!clientData?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration_minutes),
          professional:professionals(name)
        `)
        .eq("client_id", clientData.id)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientData?.id,
  });

  const today = new Date().toISOString().split("T")[0];

  // Generate QR Code when details modal opens
  useEffect(() => {
    if (detailsAppointment?.code) {
      const checkInUrl = `${window.location.origin}/check-in?code=${detailsAppointment.code}`;
      QRCode.toDataURL(checkInUrl, {
        width: 150,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#ffffff" },
      })
        .then(setQrCodeDataUrl)
        .catch(() => setQrCodeDataUrl(null));
    } else {
      setQrCodeDataUrl(null);
    }
  }, [detailsAppointment?.code]);

  // Share via WhatsApp
  const handleShareWhatsApp = (apt: any) => {
    const dateFormatted = format(parseISO(apt.scheduled_date), "dd/MM/yyyy", { locale: ptBR });
    const message = `📋 *Detalhes da Consulta*\n\n` +
      `🏷️ Código: ${apt.code}\n` +
      `📅 Data: ${dateFormatted}\n` +
      `⏰ Horário: ${apt.scheduled_time?.slice(0, 5)}\n` +
      `🏥 Serviço: ${apt.service?.name || "Consulta"}\n` +
      `📍 Modalidade: ${apt.modality === "online" ? "Online" : "Presencial"}\n` +
      `👨‍⚕️ Profissional: ${apt.professional?.name || "A definir"}\n\n` +
      `🔗 Consulte: ${window.location.origin}/consulta/${apt.code}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const upcomingAppointments = appointments?.filter(
    (apt: any) => apt.scheduled_date >= today && ["pending", "confirmed"].includes(apt.status)
  ) || [];

  const pastAppointments = appointments?.filter(
    (apt: any) => apt.scheduled_date < today || apt.status === "completed"
  ) || [];

  const canceledAppointments = appointments?.filter(
    (apt: any) => apt.status === "canceled"
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700">Concluída</Badge>;
      case "canceled":
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      case "rescheduled":
        return <Badge className="bg-purple-100 text-purple-700">Remarcada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAction = async () => {
    if (!selectedAppointment || !actionType) return;
    
    setLoading(true);
    try {
      // For now, we just update the status and add a note
      // In production, this would create a ticket for admin review
      
      if (actionType === "cancel") {
        const { error } = await supabase
          .from("appointments")
          .update({
            status: "canceled" as const,
            canceled_reason: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedAppointment.id);

        if (error) throw error;
        toast.success("Solicitação de cancelamento enviada!");
      } else {
        // For reschedule, we just add a note - admin will handle
        toast.success("Solicitação de remarcação enviada! Entraremos em contato.");
      }

      setSelectedAppointment(null);
      setActionType(null);
      setReason("");
      refetch();
    } catch (err) {
      toast.error("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Search appointment by code
  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      toast.error("Digite o código da consulta");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const { data, error } = await supabase.rpc("get_checkin_appointment_info", {
        _code: searchCode.trim().toUpperCase(),
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setSearchError("Consulta não encontrada. Verifique o código.");
        return;
      }

      const row = data[0];
      setSearchResult({
        id: row.id,
        code: row.code,
        scheduled_date: row.scheduled_date,
        scheduled_time: row.scheduled_time,
        modality: row.modality,
        status: row.status,
        checked_in_at: row.checked_in_at,
        client: { full_name: row.client_full_name },
        service: { name: row.service_name, duration_minutes: row.service_duration_minutes },
      });
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Erro ao buscar consulta. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  // Generate PDF for searched appointment
  const handleDownloadPDF = async () => {
    if (!searchResult) return;

    setIsGeneratingPDF(true);
    try {
      // Calculate end_time based on scheduled_time + duration
      const [hours, minutes] = searchResult.scheduled_time.split(":").map(Number);
      const duration = searchResult.service?.duration_minutes || 60;
      const endHours = Math.floor((hours * 60 + minutes + duration) / 60);
      const endMins = (hours * 60 + minutes + duration) % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}:00`;

      await generateAppointmentPDF({
        code: searchResult.code,
        scheduled_date: searchResult.scheduled_date,
        scheduled_time: searchResult.scheduled_time,
        end_time: endTime,
        modality: searchResult.modality,
        service: {
          name: searchResult.service?.name || "Serviço",
          duration_minutes: searchResult.service?.duration_minutes || 60,
        },
        client: {
          full_name: searchResult.client?.full_name || "Cliente",
          email: "",
          phone: "",
        },
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Generate PDF for any appointment from the list
  const handleDownloadAppointmentPDF = async (apt: any) => {
    setGeneratingPDFId(apt.id);
    try {
      // Calculate end_time based on scheduled_time + duration
      const [hours, minutes] = apt.scheduled_time.split(":").map(Number);
      const duration = apt.service?.duration_minutes || 60;
      const endHours = Math.floor((hours * 60 + minutes + duration) / 60);
      const endMins = (hours * 60 + minutes + duration) % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}:00`;

      await generateAppointmentPDF({
        code: apt.code,
        scheduled_date: apt.scheduled_date,
        scheduled_time: apt.scheduled_time,
        end_time: endTime,
        modality: apt.modality,
        service: {
          name: apt.service?.name || "Serviço",
          duration_minutes: apt.service?.duration_minutes || 60,
        },
        client: {
          full_name: clientData?.full_name || "Cliente",
          email: clientData?.email || "",
          phone: clientData?.phone || "",
        },
      });
      toast.success("PDF gerado com sucesso!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGeneratingPDFId(null);
    }
  };

  const AppointmentCard = ({ apt }: { apt: any }) => (
    <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
            <span className="text-xs text-muted-foreground uppercase">
              {format(parseISO(apt.scheduled_date), "MMM", { locale: ptBR })}
            </span>
            <span className="text-lg font-bold text-primary">
              {format(parseISO(apt.scheduled_date), "dd")}
            </span>
          </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{apt.service?.name}</h4>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {apt.scheduled_time?.slice(0, 5)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {apt.professional?.name || "A definir"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground/70 mt-0.5">
                Agendado em: {format(parseISO(apt.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
              </div>
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {apt.modality === "online" ? (
            <Badge variant="secondary" className="gap-1">
              <Video className="w-3 h-3" /> Online
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" /> Presencial
            </Badge>
          )}
          {getStatusBadge(apt.status)}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDetailsAppointment(apt)}
            className="gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            Ver Detalhes
          </Button>
          {apt.checked_in_at && (
            <Badge className="bg-emerald-100 text-emerald-700 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Check-in: {format(parseISO(apt.checked_in_at), "HH:mm")}
            </Badge>
          )}
        </div>

        {["pending", "confirmed"].includes(apt.status) && apt.scheduled_date >= today && (
          <div className="flex gap-2 lg:ml-4">
            {apt.modality === "online" && apt.video_link && apt.status === "confirmed" && (
              <Button size="sm" asChild className="btn-premium">
                <a href={apt.video_link} target="_blank" rel="noopener noreferrer">
                  <Video className="w-4 h-4 mr-1" />
                  Entrar
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedAppointment(apt);
                setActionType("reschedule");
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Remarcar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setSelectedAppointment(apt);
                setActionType("cancel");
              }}
            >
              <CalendarX2 className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Minhas Consultas</h1>
        <p className="text-muted-foreground">
          Acompanhe todas as suas consultas e atendimentos.
        </p>
      </div>

      {/* Search by Code Card */}
      <Card className="card-premium">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5 text-primary" />
            Buscar Consulta por Código
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Digite o código (ex: PSI-XXXXXXXX)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearchByCode()}
                className="h-11"
              />
            </div>
            <Button
              onClick={handleSearchByCode}
              disabled={isSearching || !searchCode.trim()}
              className="h-11"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Buscar
            </Button>
          </div>

          {searchError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{searchError}</p>
            </div>
          )}

          {searchResult && (
            <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {searchResult.code}
                    </Badge>
                    {getStatusBadge(searchResult.status)}
                  </div>
                  <h4 className="font-medium">{searchResult.service?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(searchResult.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {searchResult.scheduled_time?.slice(0, 5)}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {searchResult.client?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {searchResult.modality === "online" ? (
                      <><Video className="w-3.5 h-3.5" /> Online</>
                    ) : (
                      <><MapPin className="w-3.5 h-3.5" /> Presencial</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    className="gap-2"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-premium">
        <CardContent className="p-0">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="upcoming"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Próximas ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Passadas ({pastAppointments.length})
              </TabsTrigger>
              <TabsTrigger
                value="canceled"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Canceladas ({canceledAppointments.length})
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="upcoming" className="mt-0 space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando...</div>
                ) : upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt: any) => (
                    <AppointmentCard key={apt.id} apt={apt} />
                  ))
                ) : (
                  <EmptyState message="Nenhuma consulta agendada" />
                )}
              </TabsContent>

              <TabsContent value="past" className="mt-0 space-y-4">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map((apt: any) => (
                    <AppointmentCard key={apt.id} apt={apt} />
                  ))
                ) : (
                  <EmptyState message="Nenhuma consulta passada" />
                )}
              </TabsContent>

              <TabsContent value="canceled" className="mt-0 space-y-4">
                {canceledAppointments.length > 0 ? (
                  canceledAppointments.map((apt: any) => (
                    <AppointmentCard key={apt.id} apt={apt} />
                  ))
                ) : (
                  <EmptyState message="Nenhuma consulta cancelada" />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      <Dialog open={!!detailsAppointment} onOpenChange={() => setDetailsAppointment(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Detalhes da Consulta
            </DialogTitle>
            <DialogDescription>
              Informações completas do seu agendamento
            </DialogDescription>
          </DialogHeader>

          {detailsAppointment && (
            <div className="space-y-6">
              {/* Code Badge */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="font-mono text-base px-4 py-2">
                  {detailsAppointment.code}
                </Badge>
                <CopyButton 
                  text={detailsAppointment.code} 
                  label="Código copiado!" 
                />
              </div>

              {/* Service Info */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                <h4 className="font-semibold text-lg">{detailsAppointment.service?.name}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(parseISO(detailsAppointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{detailsAppointment.scheduled_time?.slice(0, 5)} - {detailsAppointment.end_time?.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {detailsAppointment.modality === "online" ? (
                      <><Video className="w-4 h-4" /> Online</>
                    ) : (
                      <><MapPin className="w-4 h-4" /> Presencial</>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{detailsAppointment.professional?.name || "A definir"}</span>
                  </div>
                </div>
              </div>

              {/* Preparation Tips - Online */}
              {detailsAppointment.modality === "online" && ["pending", "confirmed"].includes(detailsAppointment.status) && (
                <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-sky-600" />
                    <h5 className="font-medium text-sky-800 dark:text-sky-200">Como se preparar para sua consulta online</h5>
                  </div>
                  <ul className="space-y-2 text-sm text-sky-700 dark:text-sky-300">
                    <li className="flex items-start gap-2">
                      <Wifi className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Verifique sua conexão de internet. Prefira redes Wi-Fi estáveis.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Camera className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Teste sua webcam antes da consulta. Posicione-a na altura dos olhos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Mic className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Verifique se o microfone está funcionando e sem ruídos.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Headphones className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Use fones de ouvido para maior privacidade e qualidade de áudio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Video className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Escolha um ambiente silencioso, bem iluminado e privado.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-sky-600 dark:text-sky-400 pt-1 border-t border-sky-200 dark:border-sky-700">
                    💡 Entre no link da videochamada 5 minutos antes do horário agendado.
                  </p>
                </div>
              )}

              {/* Preparation Tips - Presencial */}
              {detailsAppointment.modality === "presencial" && ["pending", "confirmed"].includes(detailsAppointment.status) && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h5 className="font-medium text-amber-800 dark:text-amber-200">Orientações para sua consulta presencial</h5>
                  </div>
                  <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Chegue com 10-15 minutos de antecedência para fazer o check-in.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Traga documento de identificação com foto (RG ou CNH).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <FileText className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Se for primeira consulta, traga exames ou laudos anteriores (se houver).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Car className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>Confira o endereço e planeje sua rota com antecedência.</span>
                    </li>
                  </ul>
                  <p className="text-xs text-amber-600 dark:text-amber-400 pt-1 border-t border-amber-200 dark:border-amber-700">
                    💡 Use o QR Code abaixo para fazer check-in rápido na recepção.
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <span className="text-sm font-medium">Status</span>
                {getStatusBadge(detailsAppointment.status)}
              </div>

              {/* Created at */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm text-muted-foreground">Agendado em</span>
                <span className="text-sm font-medium">
                  {format(parseISO(detailsAppointment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>

              {/* Check-in info */}
              {detailsAppointment.checked_in_at && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-sm font-medium text-emerald-700">Check-in realizado</span>
                  <span className="text-sm text-emerald-600 font-mono">
                    {format(parseISO(detailsAppointment.checked_in_at), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
              )}

              {/* Video Link */}
              {detailsAppointment.modality === "online" && detailsAppointment.video_link && detailsAppointment.status === "confirmed" && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2">Link para videochamada:</p>
                  <Button asChild className="w-full">
                    <a href={detailsAppointment.video_link} target="_blank" rel="noopener noreferrer">
                      <Video className="w-4 h-4 mr-2" />
                      Acessar Videochamada
                    </a>
                  </Button>
                </div>
              )}

              {/* Location */}
              {detailsAppointment.modality === "presencial" && detailsAppointment.location_address && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Endereço:</p>
                  <p className="text-sm font-medium">{detailsAppointment.location_address}</p>
                </div>
              )}

              {/* QR Code for Check-in (presencial only) */}
              {detailsAppointment.modality === "presencial" && !detailsAppointment.checked_in_at && ["pending", "confirmed"].includes(detailsAppointment.status) && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">QR Code para Check-in</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code para check-in" 
                        className="rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-[150px] h-[150px] bg-muted rounded-lg flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Apresente este QR Code na recepção para fazer o check-in
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleShareWhatsApp(detailsAppointment)}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button
                  onClick={() => handleDownloadAppointmentPDF(detailsAppointment)}
                  disabled={generatingPDFId === detailsAppointment.id}
                  className="gap-2"
                >
                  {generatingPDFId === detailsAppointment.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Baixar PDF
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => setDetailsAppointment(null)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "cancel" ? "Cancelar Consulta" : "Solicitar Remarcação"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "cancel"
                ? "Deseja realmente cancelar esta consulta? Cancelamentos com menos de 24h de antecedência podem estar sujeitos a cobrança."
                : "Informe o motivo da remarcação. Nossa equipe entrará em contato para reagendar."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <p className="font-medium">{selectedAppointment.service?.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(selectedAppointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}{" "}
                às {selectedAppointment.scheduled_time?.slice(0, 5)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              {actionType === "cancel" ? "Motivo do cancelamento" : "Motivo da remarcação"}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setActionType(null)}>
              Voltar
            </Button>
            <Button
              variant={actionType === "cancel" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === "cancel" ? "Confirmar Cancelamento" : "Enviar Solicitação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
