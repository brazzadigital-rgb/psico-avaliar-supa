import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { CreditCard, Clock, Check, X, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, getOrderStatusLabel, getPaymentMethodLabel } from "@/lib/payment-types";
import type { Order, Payment, OrderStatus } from "@/lib/payment-types";

export default function ClientePagamentos() {
  const { user } = useAuth();

  // Get client data
  const { data: client } = useQuery({
    queryKey: ["client-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get client orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["client-orders", client?.id],
    queryFn: async () => {
      if (!client?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*),
          payments(*)
        `)
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!client?.id,
  });

  const pendingOrders = orders?.filter(o => o.status === "pending") || [];
  const paidOrders = orders?.filter(o => o.status === "paid") || [];
  const otherOrders = orders?.filter(o => !["pending", "paid"].includes(o.status)) || [];

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<OrderStatus, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      draft: { variant: "outline", icon: <Clock className="w-3 h-3" /> },
      pending: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
      paid: { variant: "default", icon: <Check className="w-3 h-3" /> },
      refunded: { variant: "outline", icon: <CreditCard className="w-3 h-3" /> },
      canceled: { variant: "destructive", icon: <X className="w-3 h-3" /> },
      expired: { variant: "destructive", icon: <AlertCircle className="w-3 h-3" /> },
    };
    const { variant, icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        {icon}
        {getOrderStatusLabel(status)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Meus Pagamentos</h1>
        <p className="text-muted-foreground">Acompanhe seus pedidos e pagamentos</p>
      </div>

      {/* Pending Payments */}
      {pendingOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Pagamentos Pendentes
          </h2>
          <div className="grid gap-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="border-warning/30 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm">{order.code}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.[0]?.description || "Serviço"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                      </div>
                      <Button asChild>
                        <Link to={`/checkout?order=${order.id}`}>
                          Pagar Agora
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Paid Orders */}
      {paidOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-primary" />
            Pagamentos Confirmados
          </h2>
          <div className="grid gap-4">
            {paidOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm">{order.code}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.[0]?.description || "Serviço"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pago em {order.paid_at ? format(new Date(order.paid_at), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                      {order.payments?.[0] && (
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodLabel(order.payments[0].method)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Orders */}
      {otherOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Outros</h2>
          <div className="grid gap-4">
            {otherOrders.map((order) => (
              <Card key={order.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm">{order.code}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items?.[0]?.description || "Serviço"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!orders || orders.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Nenhum pagamento encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não tem nenhum pedido ou pagamento registrado.
            </p>
            <Button asChild>
              <Link to="/agendar">Agendar Consulta</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
