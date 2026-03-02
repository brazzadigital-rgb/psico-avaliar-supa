import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  Calendar, Users, Clock, AlertCircle, ArrowRight, CheckCircle2, XCircle,
  DollarSign, TrendingUp, CreditCard, BarChart3
} from "lucide-react";
import { format, parseISO, subDays, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function DashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [revenueRange, setRevenueRange] = useState("30");

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["todayAppointments", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name),
          client:clients(full_name, phone)
        `)
        .eq("scheduled_date", today)
        .order("scheduled_time");
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingAppointments = [] } = useQuery({
    queryKey: ["pendingAppointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(name),
          client:clients(full_name)
        `)
        .eq("status", "pending")
        .gte("scheduled_date", today)
        .order("scheduled_date")
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const [appointmentsRes, clientsRes, servicesRes] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact" }),
        supabase.from("clients").select("id", { count: "exact" }),
        supabase.from("services").select("id", { count: "exact" }).eq("is_active", true),
      ]);
      return {
        appointments: appointmentsRes.count || 0,
        clients: clientsRes.count || 0,
        services: servicesRes.count || 0,
      };
    },
  });

  // Revenue stats
  const { data: revenueData } = useQuery({
    queryKey: ["dashboardRevenue", revenueRange],
    queryFn: async () => {
      const fromDate = revenueRange === "today" 
        ? new Date() 
        : revenueRange === "7" 
        ? subDays(new Date(), 7)
        : revenueRange === "30"
        ? subDays(new Date(), 30)
        : startOfMonth(new Date());

      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, status, paid_at")
        .gte("created_at", fromDate.toISOString());

      if (error) throw error;

      const paid = payments?.filter(p => p.status === "paid") || [];
      const pending = payments?.filter(p => p.status === "pending" || p.status === "created") || [];

      return {
        total: paid.reduce((sum, p) => sum + Number(p.amount), 0),
        pending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
        count: paid.length,
        avgTicket: paid.length > 0 ? paid.reduce((sum, p) => sum + Number(p.amount), 0) / paid.length : 0,
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "canceled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "canceled":
        return "Cancelado";
      case "completed":
        return "Concluído";
      case "rescheduled":
        return "Remarcado";
      default:
        return status;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao painel administrativo da Psicoavaliar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.appointments || 0}</div>
              <div className="text-sm text-muted-foreground">Total de Agendamentos</div>
            </div>
          </div>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats?.clients || 0}</div>
              <div className="text-sm text-muted-foreground">Clientes Cadastrados</div>
            </div>
          </div>
        </div>
        <div className="card-premium p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <div className="text-sm text-muted-foreground">Consultas Hoje</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Block */}
      <Card className="mb-8 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-display font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Receita
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={revenueRange} onValueChange={setRevenueRange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/relatorios">
                Ver Relatórios
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Receita Total
              </div>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(revenueData?.total || 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <BarChart3 className="w-4 h-4" />
                Ticket Médio
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(revenueData?.avgTicket || 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background/80 border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Pagamentos
              </div>
              <p className="text-2xl font-bold">{revenueData?.count || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-background/80 border border-yellow-200 bg-yellow-50/50">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="w-4 h-4" />
                Pendentes
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(revenueData?.pending || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Appointments */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-lg">Consultas de Hoje</h2>
            <Link
              to="/admin/agendamentos"
              className="text-sm text-primary hover:text-accent flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma consulta agendada para hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50"
                >
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-bold text-primary">
                      {appointment.scheduled_time?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {appointment.client?.full_name || "Cliente"}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {appointment.service?.name}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      getStatusColor(appointment.status)
                    )}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Confirmations */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pendentes de Confirmação
            </h2>
          </div>

          {pendingAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum agendamento pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAppointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-yellow-50 border border-yellow-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {appointment.client?.full_name || "Cliente"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(appointment.scheduled_date), "dd/MM")} às{" "}
                      {appointment.scheduled_time?.slice(0, 5)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
