import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, QrCode, FileText, Shield, Lock, ChevronRight, Check, Calendar, Clock, MapPin, Video, ArrowLeft, User, Mail, Phone, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/payment-types";
import type { Order, OrderItem, PaymentSettings } from "@/lib/payment-types";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/ui/copy-button";

type CheckoutStep = "dados" | "pagamento" | "confirmacao";
type PaymentSubStep = "select" | "processing" | "awaiting";

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

const steps = [
  { id: "dados", title: "Seus Dados", icon: User },
  { id: "pagamento", title: "Pagamento", icon: CreditCard },
  { id: "confirmacao", title: "Confirmação", icon: Check },
];

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkoutToken = searchParams.get("token");
  
  const [step, setStep] = useState<CheckoutStep>("dados");
  const [paymentSubStep, setPaymentSubStep] = useState<PaymentSubStep>("select");
  const [clientForm, setClientForm] = useState<ClientForm>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [selectedMethod, setSelectedMethod] = useState<"pix" | "card" | "boleto" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; copyPaste: string; expiresAt: string; paymentId: string } | null>(null);
  const [cardData, setCardData] = useState<{ paymentId: string; isTestMode: boolean; message?: string } | null>(null);
  const [pixTimeRemaining, setPixTimeRemaining] = useState<number>(30 * 60); // 30 minutes in seconds
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [cardProcessingStep, setCardProcessingStep] = useState<number>(0);

  // Generate a simple IP hash for rate limiting (client-side fingerprint)
  const getClientFingerprint = () => {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screenRes = `${screen.width}x${screen.height}`;
    const fingerprint = `${userAgent}-${language}-${timezone}-${screenRes}`;
    // Simple hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  const [checkoutError, setCheckoutError] = useState<{ type: string; message: string } | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null);

  // Validate checkout token with rate limiting and expiration check
  const { data: validationResult, isLoading: loadingValidation } = useQuery({
    queryKey: ["checkout-validation", checkoutToken],
    queryFn: async () => {
      if (!checkoutToken) return null;
      const fingerprint = getClientFingerprint();
      
      const { data, error } = await supabase.rpc("get_checkout_order", {
        _token: checkoutToken,
        _ip_hash: fingerprint,
      });
      
      if (error) {
        console.error("[Checkout] Erro na validação:", error);
        throw error;
      }
      
      return data as { 
        success?: boolean; 
        order_id?: string; 
        error?: string; 
        message?: string;
        details?: { blocked?: boolean; blocked_until?: string; message?: string };
      };
    },
    enabled: !!checkoutToken,
    retry: false,
  });

  // Handle validation result
  useEffect(() => {
    if (validationResult) {
      if (validationResult.error === "rate_limited") {
        setIsRateLimited(true);
        if (validationResult.details?.blocked_until) {
          setBlockedUntil(new Date(validationResult.details.blocked_until));
        }
        setCheckoutError({ type: "rate_limited", message: "Muitas tentativas. Tente novamente mais tarde." });
      } else if (validationResult.error === "expired") {
        setCheckoutError({ type: "expired", message: "Este link de checkout expirou (30 minutos)." });
      } else if (validationResult.error === "not_found") {
        setCheckoutError({ type: "not_found", message: "Pedido não encontrado." });
      } else if (validationResult.error === "already_paid") {
        setCheckoutError({ type: "already_paid", message: "Este pedido já foi pago." });
      }
    }
  }, [validationResult]);

  // Fetch order only if validation passed
  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["checkout-order", validationResult?.order_id],
    queryFn: async () => {
      if (!validationResult?.order_id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          client:clients(id, full_name, email, phone),
          appointment:appointments(id, code, scheduled_date, scheduled_time, modality, professional:professionals(name), service:services(name)),
          items:order_items(*)
        `)
        .eq("id", validationResult.order_id)
        .single();
      if (error) {
        console.error("[Checkout] Erro ao buscar pedido:", error);
        throw error;
      }
      return data as Order & {
        appointment?: {
          scheduled_date: string;
          scheduled_time: string;
          modality: string;
          professional?: { name: string };
          service?: { name: string };
        };
      };
    },
    enabled: !!validationResult?.success && !!validationResult?.order_id,
  });

  // Fetch payment settings
  const { data: settings } = useQuery({
    queryKey: ["checkout-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*");
      if (error) throw error;
      
      const result: Partial<PaymentSettings> = {};
      data?.forEach((row: { key: string; value: unknown }) => {
        (result as Record<string, unknown>)[row.key] = row.value;
      });
      return result as PaymentSettings;
    },
  });

  // Prefill form with client data
  useEffect(() => {
    if (order?.client) {
      setClientForm({
        name: order.client.full_name || "",
        email: order.client.email || "",
        phone: order.client.phone || "",
        cpf: "",
      });
    }
  }, [order]);

  // Polling for payment status
  useEffect(() => {
    if (!pixData?.paymentId || isPaymentConfirmed) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: payment, error } = await supabase
          .from("payments")
          .select("status")
          .eq("id", pixData.paymentId)
          .single();

        if (error) {
          console.error("Error polling payment status:", error);
          return;
        }

        if (payment?.status === "paid") {
          setIsPaymentConfirmed(true);
          clearInterval(pollInterval);
          toast.success("Pagamento confirmado!");
          
          // Small delay before redirecting
          setTimeout(() => {
            if (order?.appointment?.code) {
              navigate(`/agendar/confirmacao?code=${order.appointment.code}`);
            } else {
              setStep("confirmacao");
            }
          }, 1500);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [pixData?.paymentId, isPaymentConfirmed, navigate, order?.appointment?.code]);

  // Countdown timer for Pix expiration
  useEffect(() => {
    if (paymentSubStep !== "awaiting" || !pixData) return;

    const timer = setInterval(() => {
      setPixTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("O código Pix expirou. Gere um novo código.");
          setPaymentSubStep("select");
          setPixData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentSubStep, pixData]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // State for Appmax test mode message
  const [isAppmaxTestMode, setIsAppmaxTestMode] = useState(false);

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!order || !selectedMethod) {
        throw new Error("Dados incompletos");
      }

      // For card and boleto, use Appmax integration
      if (selectedMethod === "card" || selectedMethod === "boleto") {
        const returnUrl = `${window.location.origin}/checkout?token=${checkoutToken}`;
        
        const response = await supabase.functions.invoke("create-appmax-payment", {
          body: {
            order_id: order.id,
            payment_method: selectedMethod === "card" ? "credit_card" : "boleto",
            customer: {
              name: clientForm.name,
              email: clientForm.email,
              phone: clientForm.phone,
              cpf: clientForm.cpf,
            },
            return_url: returnUrl,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Erro ao criar pagamento");
        }

        const data = response.data;
        
        if (!data.success) {
          throw new Error(data.error || "Erro ao processar pagamento");
        }

        return {
          payment: { id: data.payment_id },
          isTestMode: data.test_mode || false,
          paymentUrl: data.payment_url,
          boletoUrl: data.boleto_url,
          boletoBarcode: data.boleto_barcode,
          message: data.message,
        };
      }

      // For Pix, use local mock (can be replaced with Appmax Pix later)
      const pixQrCode = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Ck1dswAABfpJREFUeNrt3UFu2zAQBdD0/ofuJkWBLpKNpJHI+e8ANqQ5kt+PSEk=";
      const pixCopyPaste = `00020126580014br.gov.bcb.pix0136${order.code}-pix-${Date.now()}5204000053039865802BR5925CENTRO PSICOAVALIAR6009SAO PAULO62070503***6304`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      const { data: payment, error } = await supabase
        .from("payments")
        .insert({
          order_id: order.id,
          provider: "manual",
          method: selectedMethod,
          status: "pending",
          amount: order.total,
          currency: order.currency,
          pix_qr_base64: pixQrCode,
          pix_copy_paste: pixCopyPaste,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("orders")
        .update({ status: "pending", provider_selected: "manual" })
        .eq("id", order.id);

      return { payment, pixQrCode, pixCopyPaste, expiresAt, isTestMode: false };
    },
    onSuccess: (data) => {
      if (selectedMethod === "pix") {
        setPixData({
          qrCode: data.pixQrCode!,
          copyPaste: data.pixCopyPaste!,
          expiresAt: data.expiresAt!,
          paymentId: data.payment.id,
        });
        setPixTimeRemaining(30 * 60);
        setPaymentSubStep("awaiting");
        setIsProcessing(false);
      } else if (selectedMethod === "card" || selectedMethod === "boleto") {
        // Handle Appmax response
        if (data.isTestMode) {
          // Test mode - show animated processing screen
          setIsAppmaxTestMode(true);
          setCardData({
            paymentId: data.payment.id,
            isTestMode: true,
            message: data.message,
          });
          setPaymentSubStep("awaiting");
          setIsProcessing(false);
          
          // Animate through processing steps
          setCardProcessingStep(1);
          setTimeout(() => setCardProcessingStep(2), 1500);
          setTimeout(() => setCardProcessingStep(3), 3000);
          setTimeout(() => {
            setCardProcessingStep(4);
            setIsPaymentConfirmed(true);
          }, 4500);
        } else if (data.paymentUrl) {
          // Real mode - redirect to payment gateway
          window.location.href = data.paymentUrl;
        } else {
          setStep("confirmacao");
          setIsProcessing(false);
        }
      }
    },
    onError: (error) => {
      toast.error("Erro ao processar pagamento: " + error.message);
      setIsProcessing(false);
    },
  });

  const handleProceedToPayment = () => {
    if (!clientForm.name || !clientForm.email || !clientForm.phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setStep("pagamento");
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      toast.error("Selecione um método de pagamento");
      return;
    }
    setIsProcessing(true);
    createPaymentMutation.mutate();
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const getStepIndex = (s: CheckoutStep) => steps.findIndex(st => st.id === s);

  if (loadingValidation || loadingOrder) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <p className="text-muted-foreground font-medium">Verificando checkout...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!checkoutToken) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background py-12">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-border max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Link de checkout inválido</h2>
            <p className="text-muted-foreground mb-6">Este link não contém um token de acesso válido.</p>
            <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-primary to-accent text-white rounded-xl h-12 px-6">
              Voltar ao início
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle rate limiting
  if (isRateLimited) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background py-12">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-border max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Muitas tentativas</h2>
            <p className="text-muted-foreground mb-4">
              Por segurança, o acesso foi temporariamente bloqueado.
            </p>
            {blockedUntil && (
              <p className="text-sm text-muted-foreground mb-6">
                Tente novamente após {format(blockedUntil, "HH:mm", { locale: ptBR })}.
              </p>
            )}
            <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-primary to-accent text-white rounded-xl h-12 px-6">
              Voltar ao início
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle expired checkout
  if (checkoutError?.type === "expired") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background py-12">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-border max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Link expirado</h2>
            <p className="text-muted-foreground mb-6">
              Este link de checkout expirou após 30 minutos. Por favor, faça um novo agendamento.
            </p>
            <Button onClick={() => navigate("/agendar")} className="bg-gradient-to-r from-primary to-accent text-white rounded-xl h-12 px-6">
              Novo agendamento
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!order || checkoutError) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background py-12">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-border max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">Pedido não encontrado</h2>
            <p className="text-muted-foreground mb-6">
              {checkoutError?.message || "Este pedido não existe, expirou ou já foi processado."}
            </p>
            <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-primary to-accent text-white rounded-xl h-12 px-6">
              Voltar ao início
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (order.status === "paid") {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-secondary/50 to-background py-12">
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-border max-w-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-2">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              Seu pedido <span className="font-mono font-bold text-primary">{order.code}</span> já foi pago.
            </p>
            <Button onClick={() => navigate("/cliente")} className="bg-gradient-to-r from-primary to-accent text-white rounded-xl h-12 px-6">
              Ir para o Portal
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ============================================ */}
      {/* HERO SECTION - Premium Checkout Header      */}
      {/* ============================================ */}
      <section className="relative py-16 md:py-20 hero-premium -mt-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <div className="hero-mesh opacity-20 hidden md:block" />
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="absolute top-10 right-20 w-[300px] h-[300px] bg-gradient-to-br from-accent/30 to-brand-gold/20 blob-morph blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-[350px] h-[350px] bg-gradient-to-tr from-brand-teal/25 to-accent/15 blob-morph blur-3xl" style={{ animationDelay: '-5s' }} />
        </div>
        
        <div className="container-wide relative z-10 pt-24 md:pt-28">
          <div className="max-w-3xl mx-auto text-center">
            <nav className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-sm mb-6">
              <Link to="/" className="hover:text-white transition-colors">Início</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">Pagamento</span>
            </nav>
            
            <h1 className="text-white mb-4 text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">
              Finalizar <span className="text-gradient-animated">Pagamento</span>
            </h1>
            
            <p className="text-base md:text-lg text-white/80 mb-6">
              Complete seu pedido de forma rápida e segura
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Ambiente 100% Seguro</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ============================================ */}
      {/* PREMIUM STEPS INDICATOR                     */}
      {/* ============================================ */}
      <section className="relative py-6 md:py-8 bg-gradient-to-b from-secondary/80 to-background -mt-8 z-20">
        <div className="container-wide">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 md:gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 md:p-3 shadow-xl border border-border/50">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 rounded-xl transition-all duration-300",
                      step === s.id
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg"
                        : getStepIndex(step) > index
                          ? "bg-accent/10 text-accent"
                          : "bg-transparent text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
                      step === s.id
                        ? "bg-white/20 text-white"
                        : getStepIndex(step) > index
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {getStepIndex(step) > index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="hidden lg:inline font-medium text-sm">{s.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-4 md:w-8 h-0.5 mx-1 md:mx-2 rounded-full transition-colors duration-300",
                      getStepIndex(step) > index ? "bg-accent" : "bg-border"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* MAIN CONTENT                                */}
      {/* ============================================ */}
      <section className="py-10 md:py-16 bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="container max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {step === "dados" && (
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-border shadow-lg animate-fade-in">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-xl">Seus Dados</h2>
                      <p className="text-sm text-muted-foreground">Confirme suas informações para continuar</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Nome completo *
                      </Label>
                      <Input
                        id="name"
                        value={clientForm.name}
                        onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                        placeholder="Seu nome completo"
                        className="h-12 rounded-xl border-border focus:border-primary"
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          E-mail *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={clientForm.email}
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                          placeholder="seu@email.com"
                          className="h-12 rounded-xl border-border focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          WhatsApp *
                        </Label>
                        <Input
                          id="phone"
                          value={clientForm.phone}
                          onChange={(e) => setClientForm({ ...clientForm, phone: formatPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className="h-12 rounded-xl border-border focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="text-sm font-medium">CPF</Label>
                      <Input
                        id="cpf"
                        value={clientForm.cpf}
                        onChange={(e) => setClientForm({ ...clientForm, cpf: formatCPF(e.target.value) })}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="h-12 rounded-xl border-border focus:border-primary"
                      />
                      <p className="text-xs text-muted-foreground">Necessário para pagamento via Pix</p>
                    </div>

                    <div className="pt-4">
                      <Button 
                        onClick={handleProceedToPayment} 
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white h-14 rounded-xl font-semibold text-base shadow-lg"
                      >
                        Continuar para Pagamento
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === "pagamento" && (
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-border shadow-lg animate-fade-in">
                  {paymentSubStep === "select" && (
                    <>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-xl">Escolha como pagar</h2>
                          <p className="text-sm text-muted-foreground">Selecione o método de pagamento preferido</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {settings?.enabled_methods?.pix && (
                          <button
                            className={cn(
                              "group w-full p-5 rounded-2xl text-left transition-all duration-300",
                              selectedMethod === "pix" 
                                ? "bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-2 border-primary shadow-lg" 
                                : "bg-secondary/30 border-2 border-transparent hover:border-primary/30 hover:bg-secondary/50"
                            )}
                            onClick={() => setSelectedMethod("pix")}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                selectedMethod === "pix" 
                                  ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg" 
                                  : "bg-primary/10 text-primary group-hover:bg-primary/20"
                              )}>
                                <QrCode className="h-7 w-7" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-lg">Pix</p>
                                <p className="text-sm text-muted-foreground">Aprovação imediata • Sem taxas</p>
                              </div>
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                selectedMethod === "pix" ? "bg-primary text-white" : "bg-muted"
                              )}>
                                {selectedMethod === "pix" ? <Check className="w-5 h-5" /> : null}
                              </div>
                            </div>
                          </button>
                        )}

                        {settings?.enabled_methods?.card && (
                          <button
                            className={cn(
                              "group w-full p-5 rounded-2xl text-left transition-all duration-300",
                              selectedMethod === "card" 
                                ? "bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-2 border-primary shadow-lg" 
                                : "bg-secondary/30 border-2 border-transparent hover:border-primary/30 hover:bg-secondary/50"
                            )}
                            onClick={() => setSelectedMethod("card")}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                selectedMethod === "card" 
                                  ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg" 
                                  : "bg-primary/10 text-primary group-hover:bg-primary/20"
                              )}>
                                <CreditCard className="h-7 w-7" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-lg">Cartão de Crédito</p>
                                <p className="text-sm text-muted-foreground">
                                  Até {settings?.installments?.max || 12}x sem juros
                                </p>
                              </div>
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                selectedMethod === "card" ? "bg-primary text-white" : "bg-muted"
                              )}>
                                {selectedMethod === "card" ? <Check className="w-5 h-5" /> : null}
                              </div>
                            </div>
                          </button>
                        )}

                        <div className="pt-4 space-y-3">
                          <Button 
                            onClick={handleConfirmPayment} 
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white h-14 rounded-xl font-semibold text-base shadow-lg"
                            disabled={!selectedMethod || isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Processando...
                              </>
                            ) : (
                              <>
                                {selectedMethod === "pix" ? "Gerar QR Code Pix" : "Confirmar Pagamento"}
                                <Lock className="ml-2 h-5 w-5" />
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => setStep("dados")} 
                            className="w-full h-12 rounded-xl"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {paymentSubStep === "awaiting" && selectedMethod === "pix" && pixData && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                          <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-xl">Pague com Pix</h2>
                          <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código</p>
                        </div>
                      </div>

                      {/* Pix QR Code Display */}
                      <div className="bg-gradient-to-br from-secondary to-secondary/50 p-6 md:p-8 rounded-2xl mb-6 border border-border">
                        <div className="flex flex-col items-center">
                          {/* QR Code */}
                          <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-border mb-6 p-4">
                            <QrCode className="h-40 w-40 text-primary" />
                          </div>

                          {/* Timer with countdown */}
                          <div className={cn(
                            "flex items-center gap-2 text-sm mb-4 px-4 py-2 rounded-full",
                            pixTimeRemaining <= 300 
                              ? "bg-red-100 text-red-700" 
                              : "bg-primary/10 text-primary"
                          )}>
                            <Clock className="w-4 h-4" />
                            <span className="font-mono font-bold">{formatTimeRemaining(pixTimeRemaining)}</span>
                            <span className="text-xs">restantes</span>
                          </div>

                          {/* Copy Paste Code */}
                          <div className="w-full space-y-2">
                            <p className="text-sm font-medium text-center">Código Pix Copia e Cola:</p>
                            <div className="flex items-center gap-2">
                              <Input 
                                readOnly 
                                value={pixData.copyPaste.slice(0, 40) + "..."} 
                                className="font-mono text-xs h-12 rounded-xl bg-white text-center"
                              />
                              <CopyButton text={pixData.copyPaste} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="space-y-3 mb-6">
                        <h4 className="font-display font-semibold text-sm">Como pagar:</h4>
                        <ol className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">1</span>
                            Abra o app do seu banco
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">2</span>
                            Escolha pagar com Pix e escaneie o QR Code ou cole o código
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">3</span>
                            Confirme o pagamento no app do banco
                          </li>
                        </ol>
                      </div>

                      {/* Status */}
                      {isPaymentConfirmed ? (
                        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-accent">Pagamento confirmado!</p>
                              <p className="text-xs text-muted-foreground">Redirecionando para confirmação...</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                              <div className="absolute inset-0 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Aguardando confirmação do pagamento...</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Verificando automaticamente a cada 5 segundos
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setPaymentSubStep("select");
                            setSelectedMethod(null);
                            setPixData(null);
                            setPixTimeRemaining(30 * 60);
                          }} 
                          className="flex-1 h-12 rounded-xl"
                          disabled={isPaymentConfirmed}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Escolher outro método
                        </Button>
                        <Button 
                          onClick={() => navigate("/cliente")}
                          className="flex-1 bg-gradient-to-r from-primary to-accent text-white h-12 rounded-xl"
                          disabled={isPaymentConfirmed}
                        >
                          Acompanhar no Portal
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Card/Boleto Awaiting Payment - Test Mode with Animation */}
                  {paymentSubStep === "awaiting" && (selectedMethod === "card" || selectedMethod === "boleto") && cardData && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h2 className="font-display font-bold text-xl">
                            {selectedMethod === "card" ? "Pagamento por Cartão" : "Pagamento por Boleto"}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {cardData.isTestMode ? "Simulando processamento..." : "Processando pagamento..."}
                          </p>
                        </div>
                      </div>

                      {/* Processing Animation */}
                      <div className="bg-gradient-to-br from-secondary to-secondary/50 p-6 md:p-8 rounded-2xl mb-6 border border-border">
                        <div className="flex flex-col items-center">
                          {/* Animated Card Icon */}
                          <div className={cn(
                            "w-32 h-32 rounded-3xl flex items-center justify-center shadow-lg mb-6 transition-all duration-500",
                            isPaymentConfirmed 
                              ? "bg-gradient-to-br from-accent to-primary scale-110" 
                              : "bg-white border border-border"
                          )}>
                            {isPaymentConfirmed ? (
                              <Check className="w-16 h-16 text-white animate-scale-in" />
                            ) : (
                              <div className="relative">
                                <CreditCard className="h-16 w-16 text-primary" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary/20 animate-ping" />
                              </div>
                            )}
                          </div>

                          {/* Processing Steps */}
                          <div className="w-full max-w-sm space-y-3 mb-6">
                            {[
                              { step: 1, text: "Conectando ao gateway de pagamento..." },
                              { step: 2, text: "Validando dados do cartão..." },
                              { step: 3, text: "Processando transação..." },
                              { step: 4, text: "Pagamento confirmado!" },
                            ].map((item) => (
                              <div 
                                key={item.step}
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-500",
                                  cardProcessingStep >= item.step 
                                    ? "bg-primary/10 border border-primary/20" 
                                    : "bg-muted/30 border border-transparent opacity-50"
                                )}
                              >
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                  cardProcessingStep > item.step 
                                    ? "bg-accent text-white" 
                                    : cardProcessingStep === item.step 
                                      ? "bg-primary text-white" 
                                      : "bg-muted text-muted-foreground"
                                )}>
                                  {cardProcessingStep > item.step ? (
                                    <Check className="w-4 h-4" />
                                  ) : cardProcessingStep === item.step ? (
                                    <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                  ) : (
                                    <span className="text-xs font-bold">{item.step}</span>
                                  )}
                                </div>
                                <span className={cn(
                                  "text-sm transition-all duration-300",
                                  cardProcessingStep >= item.step ? "text-foreground font-medium" : "text-muted-foreground"
                                )}>
                                  {item.text}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Test Mode Badge */}
                          {cardData.isTestMode && (
                            <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Sparkles className="w-4 h-4" />
                              <span className="font-medium">Modo de Teste</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      {isPaymentConfirmed ? (
                        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 mb-6 animate-fade-in">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-accent">Pagamento confirmado!</p>
                              <p className="text-xs text-muted-foreground">
                                {cardData.isTestMode 
                                  ? "Simulação concluída com sucesso." 
                                  : "Sua consulta está confirmada."}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                              <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary animate-ping" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-primary">Processando pagamento...</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Aguarde enquanto finalizamos sua transação
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isPaymentConfirmed && (
                        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
                          {order?.appointment?.code ? (
                            <Button 
                              onClick={() => navigate(`/agendar/confirmacao?code=${order.appointment?.code}`)}
                              className="flex-1 bg-gradient-to-r from-primary to-accent text-white h-12 rounded-xl"
                            >
                              Ver Confirmação
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => navigate("/cliente")}
                              className="flex-1 bg-gradient-to-r from-primary to-accent text-white h-12 rounded-xl"
                            >
                              Acompanhar no Portal
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          )}
                          <Button 
                            onClick={() => navigate("/")} 
                            variant="outline"
                            className="flex-1 h-12 rounded-xl"
                          >
                            Voltar ao Início
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === "confirmacao" && (
                <div className="bg-white rounded-2xl md:rounded-3xl p-8 md:p-12 border border-border shadow-lg animate-fade-in text-center">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mx-auto mb-8 shadow-xl">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl mb-3">
                    {isAppmaxTestMode 
                      ? "Modo de Teste Ativo" 
                      : selectedMethod === "card" 
                        ? "Pagamento Iniciado!" 
                        : "Pedido Recebido!"}
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    {isAppmaxTestMode
                      ? "Este é um pagamento de teste. Configure as credenciais da Appmax no painel administrativo para processar pagamentos reais."
                      : selectedMethod === "card"
                        ? "Você será redirecionado para a página segura do cartão."
                        : selectedMethod === "boleto"
                          ? "Seu boleto foi gerado. Pague até o vencimento para confirmar seu agendamento."
                          : "Seu pedido foi registrado com sucesso."}
                  </p>

                  {isAppmaxTestMode && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 mb-6 border border-amber-200 dark:border-amber-800 max-w-md mx-auto">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">Para ativar pagamentos reais:</span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 text-left">
                        Acesse Administração → Configurações → Pagamentos → Gateways e configure as credenciais APPMAX_API_KEY e APPMAX_API_SECRET.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-8">
                    Código do pedido: <span className="font-mono font-bold text-primary">{order.code}</span>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={() => navigate("/cliente")} className="bg-gradient-to-r from-primary to-accent text-white h-12 px-8 rounded-xl">
                      Acompanhar no Portal
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button onClick={() => navigate("/")} variant="outline" className="h-12 px-8 rounded-xl">
                      Voltar ao Início
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-border shadow-lg sticky top-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg">Resumo do Pedido</h3>
                </div>

                {/* Appointment Details */}
                {order.appointment && (
                  <div className="space-y-3 pb-5 border-b border-border mb-5">
                    <p className="font-bold">{order.appointment.service?.name}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        {format(new Date(order.appointment.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        {order.appointment.scheduled_time?.slice(0, 5)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                          {order.appointment.modality === "online" ? (
                            <Video className="h-4 w-4 text-accent" />
                          ) : (
                            <MapPin className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        {order.appointment.modality === "online" ? "Online" : "Presencial"}
                      </div>
                    </div>
                    {order.appointment.professional && (
                      <p className="text-sm text-muted-foreground">
                        Com <span className="font-medium">{order.appointment.professional.name}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-3 pb-5 border-b border-border mb-5">
                  {order.items?.map((item: OrderItem) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.description}</span>
                      <span className="font-medium">{formatCurrency(item.total_amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary">{formatCurrency(order.total)}</span>
                </div>

                {order.payment_type === "deposit" && order.deposit_amount && (
                  <div className="text-sm text-muted-foreground mb-6 p-4 rounded-xl bg-secondary/50">
                    <p>Entrada: <span className="font-medium">{formatCurrency(order.deposit_amount)}</span></p>
                    <p>Saldo restante: <span className="font-medium">{formatCurrency(order.balance_due)}</span></p>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="pt-5 border-t border-border space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-accent" />
                    </div>
                    <span>Pagamento 100% seguro</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-accent" />
                    </div>
                    <span>Seus dados estão protegidos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
