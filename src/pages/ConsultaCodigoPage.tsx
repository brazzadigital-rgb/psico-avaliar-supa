import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default function ConsultaCodigoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const [searchCode, setSearchCode] = useState(codigo || "");
  const [activeCode, setActiveCode] = useState(codigo || "");

  const { data: appointment, isLoading, error } = useQuery({
    queryKey: ["appointment-by-code", activeCode],
    queryFn: async () => {
      if (!activeCode) return null;
      
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name, duration_minutes, description),
          professional:professionals(name, photo_url),
          client:clients(full_name, email, phone)
        `)
        .eq("code", activeCode.toUpperCase())
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeCode,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveCode(searchCode.toUpperCase());
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmado", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 };
      case "pending":
        return { label: "Aguardando Confirmação", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock };
      case "canceled":
        return { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle };
      case "completed":
        return { label: "Concluído", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 };
      case "rescheduled":
        return { label: "Remarcado", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Clock };
      default:
        return { label: status, color: "bg-gray-100 text-gray-700", icon: Clock };
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 md:py-20">
        <div className="container-narrow">
          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-display font-bold">Consultar Agendamento</CardTitle>
              <CardDescription>
                Digite o código do seu agendamento para ver os detalhes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3 max-w-md mx-auto">
                <div className="flex-1">
                  <Input
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                    placeholder="Ex: PSI-B86FFF6A"
                    className="font-mono text-center text-lg"
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <Search className="w-4 h-4" /> Buscar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Buscando agendamento...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-destructive/50">
              <CardContent className="py-12 text-center">
                <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive font-medium">Erro ao buscar agendamento</p>
                <p className="text-sm text-muted-foreground mt-2">Tente novamente mais tarde</p>
              </CardContent>
            </Card>
          )}

          {activeCode && !isLoading && !appointment && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="font-medium">Agendamento não encontrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Verifique se o código está correto: <code className="bg-muted px-2 py-1 rounded">{activeCode}</code>
                </p>
              </CardContent>
            </Card>
          )}

          {appointment && (
            <Card className="overflow-hidden">
              {/* Status Header */}
              <div className={`px-6 py-4 ${getStatusInfo(appointment.status).color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const StatusIcon = getStatusInfo(appointment.status).icon;
                      return <StatusIcon className="w-5 h-5" />;
                    })()}
                    <span className="font-medium">{getStatusInfo(appointment.status).label}</span>
                  </div>
                  <Badge variant="outline" className="font-mono bg-white/50">
                    {appointment.code}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Service Info */}
                <div>
                  <h3 className="text-xl font-semibold mb-2">{appointment.service?.name}</h3>
                  {appointment.service?.description && (
                    <p className="text-sm text-muted-foreground">{appointment.service.description}</p>
                  )}
                </div>

                <Separator />

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-medium">
                        {format(parseISO(appointment.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horário</p>
                      <p className="font-medium">
                        {appointment.scheduled_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({appointment.service?.duration_minutes} min)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Modality */}
                <div className="flex items-start gap-3">
                  {appointment.modality === "presencial" ? (
                    <>
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Local (Presencial)</p>
                        <p className="font-medium">
                          {appointment.location_address || "Rua João Salomoni, 650 - Vila Nova, Porto Alegre - RS"}
                        </p>
                        <a 
                          href="https://maps.google.com/?q=Rua+Jo%C3%A3o+Salomoni,+650+-+Vila+Nova,+Porto+Alegre+-+RS"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Ver no mapa <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Consulta Online</p>
                        {appointment.video_link ? (
                          <Button asChild className="mt-2 gap-2">
                            <a href={appointment.video_link} target="_blank" rel="noopener noreferrer">
                              <Video className="w-4 h-4" /> Entrar na Videochamada
                            </a>
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            O link será disponibilizado antes da consulta
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Professional */}
                {appointment.professional && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {appointment.professional.photo_url ? (
                          <img 
                            src={appointment.professional.photo_url} 
                            alt={appointment.professional.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profissional</p>
                        <p className="font-medium">{appointment.professional.name}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <Separator />
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" asChild className="flex-1 gap-2">
                    <a href="https://wa.me/5551992809471" target="_blank" rel="noopener noreferrer">
                      <Phone className="w-4 h-4" /> Falar no WhatsApp
                    </a>
                  </Button>
                  <Button asChild className="flex-1 gap-2">
                    <Link to="/cadastro">
                      <ArrowRight className="w-4 h-4" /> Criar minha conta
                    </Link>
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Crie sua conta para gerenciar seus agendamentos, receber lembretes e acessar o histórico completo.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
