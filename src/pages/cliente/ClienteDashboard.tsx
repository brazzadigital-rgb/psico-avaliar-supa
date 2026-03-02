import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ArrowRight,
  CalendarPlus,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClienteDashboard() {
  const { user } = useAuth();

  // Check if online scheduling is enabled
  const { data: generalSettings } = useQuery({
    queryKey: ["site-settings-general"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "general")
        .single();
      if (error) return null;
      return data?.value as { online_scheduling_enabled?: boolean } | null;
    },
  });

  const isSchedulingEnabled = generalSettings?.online_scheduling_enabled !== false;

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

  // Get upcoming appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["client-appointments", clientData?.id],
    queryFn: async () => {
      if (!clientData?.id) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration_minutes),
          professional:professionals(name)
        `)
        .eq("client_id", clientData.id)
        .gte("scheduled_date", today)
        .in("status", ["pending", "confirmed"])
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientData?.id,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-display font-bold">
          Olá, {clientData?.full_name?.split(" ")[0] || "Cliente"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo à sua área exclusiva. Aqui você pode acompanhar suas consultas.
        </p>
      </div>

      {/* Quick Actions */}
      <div className={`grid grid-cols-1 ${isSchedulingEnabled ? 'sm:grid-cols-2' : ''} gap-4`}>
        {isSchedulingEnabled && (
          <Card className="card-premium hover:shadow-lg transition-all cursor-pointer">
            <Link to="/agendar">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarPlus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Agendar Consulta</h3>
                  <p className="text-sm text-muted-foreground">
                    Marque uma nova consulta
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>
        )}

        <Card className="card-premium hover:shadow-lg transition-all cursor-pointer">
          <a
            href="https://wa.me/5551992809471?text=Olá! Gostaria de tirar uma dúvida."
            target="_blank"
            rel="noopener noreferrer"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Tirar Dúvidas</h3>
                <p className="text-sm text-muted-foreground">
                  Fale conosco pelo WhatsApp
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </a>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card className="card-premium">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Próximas Consultas</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/cliente/consultas">
              Ver todas <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : appointments && appointments.length > 0 ? (
            <div className="space-y-4">
              {appointments.map((apt: any) => (
                <div
                  key={apt.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
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
                        <span>{apt.professional?.name || "A definir"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
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
                    </div>

                    {apt.modality === "online" && apt.video_link && apt.status === "confirmed" && (
                      <Button size="sm" asChild className="btn-premium">
                        <a href={apt.video_link} target="_blank" rel="noopener noreferrer">
                          <Video className="w-4 h-4 mr-1" />
                          Entrar
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhuma consulta agendada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Você ainda não tem consultas marcadas.
              </p>
              {isSchedulingEnabled && (
                <Button asChild className="btn-premium">
                  <Link to="/agendar">
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Agendar Consulta
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Política de Cancelamento</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência.
              Cancelamentos em cima da hora podem estar sujeitos a cobrança.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
