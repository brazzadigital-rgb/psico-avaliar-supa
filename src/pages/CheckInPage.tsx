import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  Loader2,
  AlertTriangle,
  Home,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function CheckInPage() {
  const { code } = useParams<{ code: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Fetch appointment data using the secure RPC function
  const { data: appointment, isLoading, error } = useQuery({
    queryKey: ["appointment-checkin", code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .rpc("get_checkin_appointment_info", { _code: code });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      // Transform the RPC result to match the expected format
      const row = data[0];
      return {
        id: row.id,
        code: row.code,
        scheduled_date: row.scheduled_date,
        scheduled_time: row.scheduled_time,
        end_time: row.end_time,
        modality: row.modality,
        status: row.status,
        checked_in_at: row.checked_in_at,
        client: { full_name: row.client_full_name },
        service: { name: row.service_name, duration_minutes: row.service_duration_minutes }
      };
    },
    enabled: !!code,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) throw new Error("Agendamento não encontrado");
      
      const { error } = await supabase
        .from("appointments")
        .update({
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id || null,
          status: "confirmed" // Also confirm the appointment if it was pending
        })
        .eq("id", appointment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setCheckInSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["appointment-checkin", code] });
      toast.success("Presença confirmada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao confirmar presença");
    },
  });

  // Determine appointment status for check-in
  const getCheckInStatus = () => {
    if (!appointment) return { canCheckIn: false, message: "", type: "error" as const };
    
    const appointmentDate = parseISO(appointment.scheduled_date);
    const today = startOfDay(new Date());
    
    // Already checked in
    if (appointment.checked_in_at) {
      return { 
        canCheckIn: false, 
        message: `Presença já confirmada em ${format(parseISO(appointment.checked_in_at), "dd/MM/yyyy 'às' HH:mm")}`,
        type: "success" as const
      };
    }
    
    // Canceled appointment
    if (appointment.status === "canceled") {
      return { 
        canCheckIn: false, 
        message: "Este agendamento foi cancelado",
        type: "error" as const
      };
    }
    
    // Past appointment (not today)
    if (isBefore(appointmentDate, today) && !isToday(appointmentDate)) {
      return { 
        canCheckIn: false, 
        message: "Este agendamento já passou",
        type: "warning" as const
      };
    }
    
    // Future appointment (not today)
    if (!isToday(appointmentDate)) {
      return { 
        canCheckIn: false, 
        message: `Este agendamento é para ${format(appointmentDate, "dd/MM/yyyy")}. O check-in só pode ser feito no dia da consulta.`,
        type: "warning" as const
      };
    }
    
    // Online appointment
    if (appointment.modality === "online") {
      return { 
        canCheckIn: false, 
        message: "Check-in não é necessário para consultas online",
        type: "info" as const
      };
    }
    
    // Can check in
    return { canCheckIn: true, message: "", type: "success" as const };
  };

  const status = getCheckInStatus();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
            <p className="text-white/80 font-medium">Verificando agendamento...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !appointment) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-destructive/80 via-destructive/70 to-red-900/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">
              Agendamento não encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              O código <span className="font-mono font-bold">{code}</span> não corresponde a nenhum agendamento.
            </p>
            <Button asChild className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Success state after check-in
  if (checkInSuccess || appointment.checked_in_at) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            {/* Success animation */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Presença Confirmada!
            </h1>
            
            <p className="text-muted-foreground mb-6">
              {appointment.client?.full_name || "Paciente"} teve sua presença registrada com sucesso.
            </p>
            
            {/* Appointment details */}
            <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paciente</p>
                    <p className="font-semibold text-sm">{appointment.client?.full_name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Serviço</p>
                    <p className="font-semibold text-sm">{appointment.service?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Horário</p>
                    <p className="font-semibold text-sm">{appointment.scheduled_time?.slice(0, 5)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Check-in timestamp */}
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              <span>
                Check-in realizado às {format(appointment.checked_in_at ? parseISO(appointment.checked_in_at) : new Date(), "HH:mm")}
              </span>
            </div>
            
            <div className="flex gap-3">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Início
                </Link>
              </Button>
              <Button asChild className="flex-1 bg-gradient-to-r from-primary to-primary/90">
                <Link to="/admin/agendamentos">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ver Agenda
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Check-in form
  return (
    <Layout>
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        status.canCheckIn 
          ? "bg-gradient-to-br from-primary via-primary/95 to-accent/80"
          : status.type === "warning"
            ? "bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500"
            : status.type === "error"
              ? "bg-gradient-to-br from-destructive/80 via-destructive/70 to-red-900/80"
              : "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              status.canCheckIn 
                ? "bg-primary/10"
                : status.type === "warning"
                  ? "bg-yellow-100"
                  : status.type === "error"
                    ? "bg-red-100"
                    : "bg-blue-100"
            }`}>
              {status.canCheckIn ? (
                <User className="w-8 h-8 text-primary" />
              ) : status.type === "warning" ? (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              ) : status.type === "error" ? (
                <XCircle className="w-8 h-8 text-destructive" />
              ) : (
                <Calendar className="w-8 h-8 text-blue-600" />
              )}
            </div>
            
            <h1 className="text-xl font-display font-bold text-foreground mb-2">
              {status.canCheckIn ? "Confirmar Presença" : "Check-in Indisponível"}
            </h1>
            
            {!status.canCheckIn && (
              <p className={`text-sm ${
                status.type === "warning" ? "text-yellow-700" :
                status.type === "error" ? "text-destructive" :
                "text-blue-700"
              }`}>
                {status.message}
              </p>
            )}
          </div>
          
          {/* Appointment Info */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {appointment.code}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paciente</span>
                <span className="text-sm font-semibold">{appointment.client?.full_name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Serviço</span>
                <span className="text-sm font-semibold">{appointment.service?.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm font-semibold">
                  {format(parseISO(appointment.scheduled_date), "dd/MM/yyyy")}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Horário</span>
                <span className="text-sm font-semibold">
                  {appointment.scheduled_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Modalidade</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  appointment.modality === "online" 
                    ? "bg-accent/20 text-accent" 
                    : "bg-primary/20 text-primary"
                }`}>
                  {appointment.modality === "online" ? "ONLINE" : "PRESENCIAL"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          {status.canCheckIn ? (
            <Button 
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {checkInMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Confirmar Presença
                </>
              )}
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
