import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Eye, Send, X, RefreshCw, Plus, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, getOrderStatusLabel, getPaymentStatusLabel, getPaymentMethodLabel } from "@/lib/payment-types";
import type { Order, OrderItem, Payment, OrderStatus } from "@/lib/payment-types";

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          client:clients(id, full_name, email, phone),
          appointment:appointments(id, code, scheduled_date, scheduled_time),
          items:order_items(*),
          payments(*)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Pedido atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const filteredOrders = orders?.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.code.toLowerCase().includes(searchLower) ||
      order.client?.full_name?.toLowerCase().includes(searchLower) ||
      order.client?.email?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      pending: "secondary",
      paid: "default",
      refunded: "outline",
      canceled: "destructive",
      expired: "destructive",
    };
    return <Badge variant={variants[status]}>{getOrderStatusLabel(status)}</Badge>;
  };

  const handleCopyPaymentLink = (order: Order) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/checkout?order=${order.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success("Link copiado!");
  };

  const handleResendPaymentLink = async (order: Order) => {
    // TODO: Implement email sending
    toast.success("Link de pagamento reenviado para " + order.client?.email);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie pedidos e pagamentos</p>
        </div>
        <Button onClick={() => setIsNewOrderOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Cobrança
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, cliente ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.client?.full_name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{order.client?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.items?.length || 0} {order.items?.length === 1 ? "item" : "itens"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status as any)}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDetailOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyPaymentLink(order)}
                              title="Copiar link de pagamento"
                            >
                              {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResendPaymentLink(order)}
                              title="Reenviar link"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido {selectedOrder?.code}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="payments">Pagamentos</TabsTrigger>
                <TabsTrigger value="actions">Ações</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status as any)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data</Label>
                    <p className="mt-1">
                      {format(new Date(selectedOrder.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Cliente</h4>
                  {selectedOrder.client ? (
                    <div className="space-y-1">
                      <p>{selectedOrder.client.full_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.client.email}</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.client.phone}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Cliente não vinculado</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Itens</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: OrderItem) => (
                      <div key={item.id} className="flex justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {selectedOrder.payments?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum pagamento registrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrder.payments?.map((payment: Payment) => (
                      <div key={payment.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                              {getPaymentStatusLabel(payment.status as any)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {getPaymentMethodLabel(payment.method as any)}
                            </span>
                          </div>
                          <span className="font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Provedor: {payment.provider}</p>
                          {payment.provider_payment_id && (
                            <p className="font-mono text-xs">ID: {payment.provider_payment_id}</p>
                          )}
                          <p>Criado: {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm")}</p>
                          {payment.paid_at && (
                            <p>Pago: {format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="grid gap-4">
                  {selectedOrder.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleCopyPaymentLink(selectedOrder)}
                      >
                        <Copy className="h-4 w-4" />
                        Copiar Link de Pagamento
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => handleResendPaymentLink(selectedOrder)}
                      >
                        <Send className="h-4 w-4" />
                        Reenviar por E-mail
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          updateOrderMutation.mutate({
                            id: selectedOrder.id,
                            updates: { status: "paid", paid_at: new Date().toISOString() },
                          });
                          setIsDetailOpen(false);
                        }}
                      >
                        <Check className="h-4 w-4" />
                        Marcar como Pago (Manual)
                      </Button>
                    </>
                  )}

                  {selectedOrder.status === "paid" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        toast.info("Funcionalidade de reembolso em desenvolvimento");
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Iniciar Reembolso
                    </Button>
                  )}

                  {["pending", "draft"].includes(selectedOrder.status) && (
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => {
                        updateOrderMutation.mutate({
                          id: selectedOrder.id,
                          updates: { status: "canceled" },
                        });
                        setIsDetailOpen(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <NewOrderDialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
    </div>
  );
}

// New Order Dialog Component
function NewOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Search clients
  const { data: clients } = useQuery({
    queryKey: ["search-clients", clientSearch],
    queryFn: async () => {
      if (!clientSearch || clientSearch.length < 2) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${clientSearch}%,email.ilike.%${clientSearch}%`)
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: clientSearch.length >= 2,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !description || !amount) {
        throw new Error("Preencha todos os campos");
      }

      const orderAmount = parseFloat(amount.replace(",", "."));
      const tempCode = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          code: tempCode,
          client_id: selectedClient.id,
          total_amount: orderAmount,
          status: "pending",
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemError } = await supabase.from("order_items").insert([{
        order_id: order.id,
        description,
        unit_price: orderAmount,
        quantity: 1,
        total_price: orderAmount,
      }]);

      if (itemError) throw itemError;

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Cobrança criada! Código: " + order.code);
      onOpenChange(false);
      setSelectedClient(null);
      setDescription("");
      setAmount("");
      setClientSearch("");
    },
    onError: (error) => {
      toast.error("Erro ao criar cobrança: " + error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Cobrança Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            {selectedClient ? (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{selectedClient.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Buscar cliente por nome ou email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {clients && clients.length > 0 && (
                  <div className="border rounded-lg divide-y">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        className="w-full p-3 text-left hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedClient(client);
                          setClientSearch("");
                        }}
                      >
                        <p className="font-medium">{client.full_name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Avaliação Psicológica"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => createOrderMutation.mutate()}
            disabled={!selectedClient || !description || !amount || createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? "Criando..." : "Criar Cobrança"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
