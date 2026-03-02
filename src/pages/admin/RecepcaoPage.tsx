import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  UserCheck, Clock, Users, CheckCircle2, 
  MapPin, Video, AlertCircle, Timer, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCheckInNotifications } from "@/hooks/useCheckInNotifications";
import { playCheckInSound } from "@/lib/notificationSounds";
import { toast } from "sonner";

type Appointment = {
  id: string;
  code: string;
  scheduled_time: string;
  end_time: string;
  modality: "presencial" | "online";
  status: string;
  checked_in_at: string | null;
  client: { full_name: string; phone: string } | null;
  service: { name: string; duration_minutes: number } | null;
  professional: { name: string } | null;
};

export default function RecepcaoPage() {
  useCheckInNotifications();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription for auto-refresh
  useEffect(() => {
    const channel = supabase
      .channel('recepcao-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, code, scheduled_time, end_time, modality, status, checked_in_at,
          client:clients(full_name, phone),
          service:services(name, duration_minutes),
          professional:professionals(name)
        `)
        .eq("scheduled_date", today)
        .in("status", ["confirmed", "pending", "completed"])
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      return (data || []) as Appointment[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleManualCheckIn = async (apt: Appointment) => {
    const { error } = await supabase
      .from("appointments")
      .update({ 
        checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", apt.id);

    if (error) {
      toast.error("Erro ao fazer check-in");
      return;
    }

    playCheckInSound();
    toast.success(`Check-in realizado: ${apt.client?.full_name}`);
    refetch();
  };

  // Categorize appointments
  const waitingQueue = appointments.filter(apt => 
    apt.modality === "presencial" && 
    apt.checked_in_at && 
    apt.status !== "completed"
  );

  const pendingArrivals = appointments.filter(apt =>
    apt.modality === "presencial" &&
    !apt.checked_in_at &&
    apt.status !== "completed" &&
    apt.status !== "canceled"
  );

  const onlineAppointments = appointments.filter(apt =>
    apt.modality === "online" &&
    apt.status !== "completed" &&
    apt.status !== "canceled"
  );

  const completedToday = appointments.filter(apt => apt.status === "completed");

  const getTimeStatus = (scheduledTime: string, checkedInAt: string | null) => {
    const now = currentTime;
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.round((now.getTime() - scheduled.getTime()) / 60000);

    if (!checkedInAt) {
      if (diffMinutes > 15) return { status: "late", label: `${diffMinutes}min atrasado`, color: "text-destructive" };
      if (diffMinutes > 0) return { status: "arriving", label: "Chegando", color: "text-amber-500" };
      if (diffMinutes > -30) return { status: "soon", label: `Em ${-diffMinutes}min`, color: "text-blue-500" };
      return { status: "scheduled", label: scheduledTime.slice(0, 5), color: "text-muted-foreground" };
    }

    // Calculate wait time since check-in
    const checkIn = new Date(checkedInAt);
    const waitMinutes = Math.round((now.getTime() - checkIn.getTime()) / 60000);
    
    if (waitMinutes > 30) return { status: "long-wait", label: `${waitMinutes}min esperando`, color: "text-destructive" };
    if (waitMinutes > 15) return { status: "waiting", label: `${waitMinutes}min esperando`, color: "text-amber-500" };
    return { status: "ready", label: `${waitMinutes}min na fila`, color: "text-primary" };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recepção</h1>
          <p className="text-muted-foreground">
            {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })} • {format(currentTime, "HH:mm")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waitingQueue.length}</div>
            <p className="text-xs text-muted-foreground">pacientes aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingArrivals.length}</div>
            <p className="text-xs text-muted-foreground">ainda não chegaram</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Video className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineAppointments.length}</div>
            <p className="text-xs text-muted-foreground">consultas virtuais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday.length}</div>
            <p className="text-xs text-muted-foreground">hoje</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Waiting Queue */}
        <Card className="lg:col-span-1">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <CardTitle>Fila de Atendimento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {waitingQueue.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum paciente na fila</p>
              </div>
            ) : (
              <div className="divide-y">
                {waitingQueue.map((apt, index) => {
                  const timeStatus = getTimeStatus(apt.scheduled_time, apt.checked_in_at);
                  return (
                    <div 
                      key={apt.id} 
                      className={cn(
                        "p-4 flex items-center gap-4 transition-colors",
                        index === 0 && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg",
                        index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{apt.client?.full_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{apt.service?.name}</span>
                          <span>•</span>
                          <span>{apt.professional?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Timer className="h-4 w-4" />
                          <span className={timeStatus.color}>{timeStatus.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Horário: {apt.scheduled_time.slice(0, 5)}
                        </p>
                      </div>
                      {index === 0 && (
                        <Badge variant="default" className="animate-pulse">
                          Próximo
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Arrivals */}
        <Card className="lg:col-span-1">
          <CardHeader className="bg-amber-500/5 border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle>Aguardando Chegada</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingArrivals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Todos os pacientes já chegaram</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingArrivals.map((apt) => {
                  const timeStatus = getTimeStatus(apt.scheduled_time, null);
                  return (
                    <div key={apt.id} className="p-4 flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{apt.client?.full_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{apt.service?.name}</span>
                          <span>•</span>
                          <span>{apt.professional?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          <span className={timeStatus.color}>{timeStatus.label}</span>
                        </div>
                        {timeStatus.status === "late" && (
                          <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Atrasado
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleManualCheckIn(apt)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Check-in
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Appointments */}
        {onlineAppointments.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="bg-blue-500/5 border-b">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                <CardTitle>Consultas Online</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {onlineAppointments.map((apt) => {
                  const timeStatus = getTimeStatus(apt.scheduled_time, null);
                  return (
                    <div key={apt.id} className="p-4 flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10">
                        <Video className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{apt.client?.full_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{apt.service?.name}</span>
                          <span>•</span>
                          <span>{apt.professional?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                          {apt.scheduled_time.slice(0, 5)}
                        </Badge>
                        <p className={cn("text-xs mt-1", timeStatus.color)}>
                          {timeStatus.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
