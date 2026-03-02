import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DollarSign,
  TrendingUp,
  Calendar as CalendarIcon,
  Users,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  BarChart3,
  PieChart,
  FileText,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function RelatoriosPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [activeTab, setActiveTab] = useState("receita");

  // Fetch payments data
  const { data: paymentsData, isLoading: loadingPayments } = useQuery({
    queryKey: ["reports-payments", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          order:orders(
            *,
            client:clients(full_name),
            items:order_items(*)
          )
        `)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch appointments data
  const { data: appointmentsData, isLoading: loadingAppointments } = useQuery({
    queryKey: ["reports-appointments", dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          client:clients(full_name),
          service:services(name),
          professional:professionals(name)
        `)
        .gte("scheduled_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("scheduled_date", format(dateRange.to, "yyyy-MM-dd"))
        .order("scheduled_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate revenue stats
  const revenueStats = {
    total: paymentsData
      ?.filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    pending: paymentsData
      ?.filter((p) => p.status === "pending" || p.status === "created")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    refunded: paymentsData
      ?.filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
    count: paymentsData?.filter((p) => p.status === "paid").length || 0,
    avgTicket: 0,
  };
  revenueStats.avgTicket = revenueStats.count > 0 ? revenueStats.total / revenueStats.count : 0;

  // Revenue by day for chart
  const revenueByDay = paymentsData
    ?.filter((p) => p.status === "paid" && p.paid_at)
    .reduce((acc: Record<string, number>, payment) => {
      const day = format(new Date(payment.paid_at!), "dd/MM");
      acc[day] = (acc[day] || 0) + Number(payment.amount);
      return acc;
    }, {});

  const revenueChartData = Object.entries(revenueByDay || {}).map(([day, value]) => ({
    day,
    value,
  }));

  // Revenue by method
  const revenueByMethod = paymentsData
    ?.filter((p) => p.status === "paid")
    .reduce((acc: Record<string, number>, payment) => {
      const method = payment.method || "Outros";
      acc[method] = (acc[method] || 0) + Number(payment.amount);
      return acc;
    }, {});

  const methodChartData = Object.entries(revenueByMethod || {}).map(([name, value]) => ({
    name: name === "pix" ? "PIX" : name === "card" ? "Cartão" : name === "boleto" ? "Boleto" : name,
    value,
  }));

  // Appointments stats
  const appointmentStats = {
    total: appointmentsData?.length || 0,
    completed: appointmentsData?.filter((a) => a.status === "completed").length || 0,
    confirmed: appointmentsData?.filter((a) => a.status === "confirmed").length || 0,
    canceled: appointmentsData?.filter((a) => a.status === "canceled").length || 0,
    pending: appointmentsData?.filter((a) => a.status === "pending").length || 0,
  };
  const completionRate = appointmentStats.total > 0
    ? ((appointmentStats.completed / appointmentStats.total) * 100).toFixed(1)
    : "0";

  // Appointments by status
  const appointmentsByStatus = [
    { name: "Concluídas", value: appointmentStats.completed, color: "#10b981" },
    { name: "Confirmadas", value: appointmentStats.confirmed, color: "#3b82f6" },
    { name: "Pendentes", value: appointmentStats.pending, color: "#f59e0b" },
    { name: "Canceladas", value: appointmentStats.canceled, color: "#ef4444" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleExportCSV = () => {
    // Simple CSV export
    const rows = paymentsData?.map((p) => ({
      Data: format(new Date(p.created_at), "dd/MM/yyyy"),
      Status: p.status,
      Valor: Number(p.amount).toFixed(2),
      Método: p.method || "",
      Cliente: p.order?.client?.full_name || "",
    }));

    if (!rows) return;

    const headers = Object.keys(rows[0]).join(",");
    const csv = [headers, ...rows.map((r) => Object.values(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-receita-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const presetRanges = [
    { label: "Hoje", from: new Date(), to: new Date() },
    { label: "7 dias", from: subDays(new Date(), 7), to: new Date() },
    { label: "30 dias", from: subDays(new Date(), 30), to: new Date() },
    { label: "Este mês", from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de receita, consultas e métricas do negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {presetRanges.map((preset) => (
            <Button
              key={preset.label}
              variant={
                dateRange.from.toDateString() === preset.from.toDateString() &&
                dateRange.to.toDateString() === preset.to.toDateString()
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => setDateRange({ from: preset.from, to: preset.to })}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="receita" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Receita
          </TabsTrigger>
          <TabsTrigger value="consultas" className="gap-2">
            <CalendarIcon className="w-4 h-4" />
            Consultas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receita" className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(revenueStats.total)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatCurrency(revenueStats.avgTicket)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pagamentos</p>
                    <p className="text-2xl font-bold">{revenueStats.count}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(revenueStats.pending)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estornos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(revenueStats.refunded)}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Receita por Dia</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1">
                  <Download className="w-4 h-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {revenueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis
                          className="text-xs"
                          tickFormatter={(value) => `R$${value}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), "Receita"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Sem dados no período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Receita por Método</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {methodChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={methodChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {methodChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      Sem dados no período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consultas" className="space-y-6">
          {/* Appointments KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{appointmentStats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{appointmentStats.completed}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold text-blue-600">{appointmentStats.confirmed}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{appointmentStats.pending}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold text-red-600">{appointmentStats.canceled}</p>
              </CardContent>
            </Card>
          </div>

          {/* Completion rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Taxa de Comparecimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">{completionRate}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Status chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Consultas por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {appointmentsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
