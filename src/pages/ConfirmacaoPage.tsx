import { Link, useSearchParams } from "react-router-dom";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  Video, 
  Phone, 
  Mail, 
  ArrowRight, 
  Copy, 
  Clock, 
  User, 
  Shield, 
  Bell,
  Home,
  Sparkles,
  FileText,
  Heart,
  Star,
  MonitorPlay,
  Building2,
  ExternalLink,
  Download,
  Loader2,
  Send
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { Appointment, Service, Client } from "@/lib/types";
import { useEffect, useState } from "react";
import { generateAppointmentPDF } from "@/lib/generateAppointmentPDF";

// Confetti particle component
const ConfettiParticle = ({ delay, left, color }: { delay: number; left: number; color: string }) => (
  <div
    className="absolute w-3 h-3 rounded-sm animate-confetti"
    style={{
      left: `${left}%`,
      backgroundColor: color,
      animationDelay: `${delay}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }}
  />
);

// Floating celebration icons
const CelebrationIcon = ({ Icon, delay, left, top }: { Icon: any; delay: number; left: number; top: number }) => (
  <div
    className="absolute animate-float-celebration text-white/60"
    style={{
      left: `${left}%`,
      top: `${top}%`,
      animationDelay: `${delay}s`,
    }}
  >
    <Icon className="w-5 h-5" />
  </div>
);

export default function ConfirmacaoPage() {
  const [searchParams] = useSearchParams();
  const { getWhatsAppUrl } = useWhatsApp();
  const code = searchParams.get("code");
  const [showConfetti, setShowConfetti] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment", code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          service:services(*),
          client:clients(*)
        `)
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      return data as Appointment & { service: Service; client: Client };
    },
    enabled: !!code,
  });

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const copyCode = () => {
    if (appointment?.code) {
      navigator.clipboard.writeText(appointment.code);
      toast.success("Código copiado!");
    }
  };

  const handleDownloadPDF = async () => {
    if (!appointment) return;
    
    setIsGeneratingPDF(true);
    try {
      await generateAppointmentPDF(appointment);
      const fichaType = appointment.modality === "online" ? "Ficha de consulta online" : "Ficha de comparecimento";
      toast.success(`${fichaType} baixada com sucesso!`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar a ficha. Tente novamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSendEmail = async () => {
    if (!appointment || !appointment.client) return;
    
    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-appointment-email", {
        body: {
          appointmentCode: appointment.code,
          recipientEmail: appointment.client.email,
          recipientName: appointment.client.full_name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("E-mail enviado com sucesso! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      toast.error(error.message || "Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Generate confetti particles
  const confettiColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    left: Math.random() * 100,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }));

  if (isLoading) {
    return (
      <Layout>
        {/* Premium Loading State */}
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-accent/80">
          <div className="container-narrow py-20">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm animate-pulse" />
              <div className="h-8 w-48 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout>
        {/* Premium Not Found State */}
        <div className="relative min-h-screen overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/80" />
          <div className="absolute inset-0 bg-mesh opacity-30" />
          
          <div className="relative container-narrow py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white mb-4">
              Agendamento não encontrado
            </h1>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              O código informado não corresponde a nenhum agendamento em nosso sistema.
            </p>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-display font-semibold rounded-xl px-8 gap-2">
              <Link to="/agendar">
                <Calendar className="w-5 h-5" />
                Fazer Novo Agendamento
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOnline = appointment.modality === "online";
  const isPresencial = appointment.modality === "presencial";

  return (
    <Layout>
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 4s ease-in-out forwards;
        }
        @keyframes float-celebration {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) scale(1.2);
            opacity: 1;
          }
        }
        .animate-float-celebration {
          animation: float-celebration 3s ease-in-out infinite;
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out forwards;
        }
      `}</style>
      
      <div className="min-h-screen bg-secondary/30">
        {/* Premium Hero Header with Celebration */}
        <div className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent via-accent/95 to-primary/80" />
          
          {/* Mesh Pattern */}
          <div className="absolute inset-0 bg-mesh opacity-20" />
          
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {confettiParticles.map((particle) => (
                <ConfettiParticle
                  key={particle.id}
                  delay={particle.delay}
                  left={particle.left}
                  color={particle.color}
                />
              ))}
            </div>
          )}

          {/* Floating Celebration Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <CelebrationIcon Icon={Star} delay={0} left={10} top={20} />
            <CelebrationIcon Icon={Heart} delay={0.5} left={85} top={15} />
            <CelebrationIcon Icon={Sparkles} delay={1} left={20} top={70} />
            <CelebrationIcon Icon={Star} delay={1.5} left={75} top={65} />
            <CelebrationIcon Icon={Heart} delay={2} left={50} top={25} />
          </div>
          
          {/* Animated Decorative Elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          
          {/* Content */}
          <div className="relative container-narrow py-16 md:py-20">
            {/* Success Animation */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                {/* Pulsing rings */}
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-ring" />
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse" />
                
                <div className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 animate-bounce-in">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                
                {/* Sparkle decorations */}
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-white/80 animate-pulse" />
                <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-white/60 animate-pulse" style={{ animationDelay: "0.5s" }} />
                <Star className="absolute top-0 -left-4 w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: "0.3s" }} />
                <Star className="absolute -bottom-2 right-0 w-4 h-4 text-yellow-300 animate-pulse" style={{ animationDelay: "0.8s" }} />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3 animate-fade-in">
                🎉 Agendamento Confirmado!
              </h1>
              <p className="text-lg text-white/80 max-w-md animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Parabéns! Seu agendamento foi realizado com sucesso.
              </p>
              
              {/* Trust Badge */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                <Shield className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Confirmação segura</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container-narrow py-10 md:py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            
            {/* Modality-Specific Welcome Message */}
            {isPresencial && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20 animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10" />
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-foreground mb-2">
                        Estamos te esperando! 🏥
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Será um prazer recebê-lo em nossa clínica. Chegue com <strong>10 minutos de antecedência</strong> para realizar o cadastro na recepção. 
                        Traga um documento de identificação e, se houver, exames ou laudos anteriores.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-primary font-medium">
                        <MapPin className="w-4 h-4" />
                        <span>Rua João Salomoni, 650 - Vila Nova, Porto Alegre</span>
                      </div>
                      
                      {/* Download PDF Button */}
                      <div className="mt-5 pt-5 border-t border-primary/10">
                        <Button 
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPDF}
                          className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-display font-semibold rounded-xl gap-2 shadow-lg shadow-primary/25"
                        >
                          {isGeneratingPDF ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Gerando ficha...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Baixar Ficha de Comparecimento
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Apresente esta ficha na recepção ao chegar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isOnline && (
              <div className="relative overflow-hidden rounded-2xl border-2 border-accent/20 animate-fade-in">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-accent/5 to-primary/10" />
                <div className="relative p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-lg flex-shrink-0">
                      <MonitorPlay className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg text-foreground mb-2">
                        Sua consulta será online! 💻
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        Você receberá o <strong>link da videoconferência por e-mail</strong> algumas horas antes da consulta. 
                        Certifique-se de estar em um ambiente tranquilo, com boa conexão de internet e com a câmera funcionando.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-accent font-medium">
                        <Video className="w-4 h-4" />
                        <span>O link estará disponível no seu painel do cliente</span>
                      </div>
                      
                      {/* Download PDF Button for Online */}
                      <div className="mt-5 pt-5 border-t border-accent/10">
                        <Button 
                          onClick={handleDownloadPDF}
                          disabled={isGeneratingPDF}
                          className="w-full sm:w-auto bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white font-display font-semibold rounded-xl gap-2 shadow-lg shadow-accent/25"
                        >
                          {isGeneratingPDF ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Gerando ficha...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Baixar Ficha da Consulta Online
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Contém instruções e requisitos técnicos para sua consulta
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Panel Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 p-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-semibold text-foreground mb-1">
                    Acompanhe sua consulta no Painel do Cliente
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acesse o painel para ver detalhes da consulta, receber lembretes e obter o link da videoconferência (consultas online).
                  </p>
                  <Button asChild size="sm" className="bg-blue-500 hover:bg-blue-600 text-white font-display font-medium rounded-lg gap-2">
                    <Link to="/cliente">
                      <ExternalLink className="w-4 h-4" />
                      Acessar Painel do Cliente
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Appointment Code Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Código do Agendamento</div>
                  <div className="text-3xl font-mono font-bold text-primary tracking-wider">{appointment.code}</div>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={copyCode}
                  className="h-12 w-12 rounded-xl border-2 hover:bg-primary/5 hover:border-primary transition-all"
                >
                  <Copy className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Guarde este código para consultar ou gerenciar seu agendamento.
              </p>
              
              {/* Send by Email Button */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  variant="outline"
                  className="w-full sm:w-auto font-display font-medium rounded-xl gap-2 border-2 hover:bg-primary/5 hover:border-primary"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Ficha por E-mail
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Enviaremos os detalhes do agendamento para {appointment.client?.email}
                </p>
              </div>
            </div>

            {/* Appointment Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 overflow-hidden animate-fade-in" style={{ animationDelay: "0.2s" }}>
              {/* Service Header */}
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl text-foreground">{appointment.service?.name}</h3>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {appointment.service?.duration_minutes} minutos
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data
                    </div>
                    <div className="font-display font-semibold text-foreground">
                      {format(parseISO(appointment.scheduled_date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário
                    </div>
                    <div className="font-display font-semibold text-foreground text-lg">
                      {appointment.scheduled_time.slice(0, 5)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {isPresencial ? (
                        <MapPin className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      Modalidade
                    </div>
                    <div className="font-display font-semibold text-foreground flex items-center gap-2">
                      {isPresencial ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          Presencial
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          Online
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Paciente
                    </div>
                    <div className="font-display font-semibold text-foreground">
                      {appointment.client?.full_name}
                    </div>
                  </div>
                </div>

                {/* Address for presencial */}
                {isPresencial && (
                  <div className="mt-6 p-4 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-display font-semibold text-foreground mb-1">Endereço</div>
                        <div className="text-muted-foreground text-sm leading-relaxed">
                          Rua João Salomoni, 650 - Vila Nova<br />
                          Porto Alegre - RS, CEP 91740-830
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-6 animate-fade-in" style={{ animationDelay: "0.25s" }}>
              <h3 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Próximos Passos
              </h3>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Aguarde a confirmação",
                    description: "Nossa equipe entrará em contato para confirmar o agendamento."
                  },
                  {
                    step: 2,
                    title: "Lembretes automáticos",
                    description: "Você receberá lembretes 24h e 2h antes da consulta."
                  },
                  {
                    step: 3,
                    title: isOnline ? "Acesse o link da consulta" : "Prepare-se para a consulta",
                    description: isOnline
                      ? "O link da videoconferência estará disponível no seu painel do cliente."
                      : "Chegue 10 minutos antes para realizar o cadastro na recepção."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-sm font-bold text-white">{item.step}</span>
                    </div>
                    <div>
                      <div className="font-display font-semibold text-foreground">{item.title}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Account CTA */}
            <div className="relative overflow-hidden rounded-2xl animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5" />
              <div className="absolute inset-0 bg-mesh opacity-20" />
              <div className="relative p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <User className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">
                  Ainda não tem conta? Crie agora!
                </h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  Com uma conta você pode gerenciar seus agendamentos, receber lembretes e acessar facilmente o link da consulta online.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-display font-semibold rounded-xl px-6 gap-2 shadow-lg shadow-primary/25">
                    <Link to="/cadastro">
                      <ArrowRight className="w-4 h-4" />
                      Criar minha conta
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="font-display font-medium rounded-xl px-6 border-2">
                    <Link to={`/consulta/${appointment.code}`}>
                      Consultar pelo código
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.35s" }}>
              <p className="text-muted-foreground mb-5 font-medium">
                Precisa remarcar ou tem dúvidas? Entre em contato:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-display font-semibold rounded-xl hover:bg-[#20bd5a] transition-all shadow-lg shadow-[#25D366]/25"
                >
                  <Phone className="w-5 h-5" />
                  WhatsApp
                </a>
                <a
                  href="mailto:centropsicoavaliar@gmail.com"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-border rounded-xl font-display font-medium hover:bg-secondary transition-all"
                >
                  <Mail className="w-5 h-5" />
                  E-mail
                </a>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center pt-4">
              <Button asChild variant="ghost" className="gap-2 font-display text-muted-foreground hover:text-foreground">
                <Link to="/">
                  <Home className="w-4 h-4" />
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
