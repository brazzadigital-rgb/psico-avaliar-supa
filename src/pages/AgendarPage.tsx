import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowRight, ArrowLeft, CheckCircle2, MapPin, Video, Clock, User, Mail, Phone, FileText, ChevronRight, Sparkles, CreditCard, DollarSign, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BookingFormData, AppointmentModality } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPriceDisplay } from "@/lib/payment-types";
import type { PriceMode, PaymentType } from "@/lib/payment-types";

interface ExtendedService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  modalities: AppointmentModality[];
  is_active: boolean;
  display_order: number;
  // Pricing fields
  price_mode: PriceMode;
  price_from_amount: number | null;
  currency: string;
  allow_installments: boolean;
  max_installments: number;
  require_payment_to_confirm: boolean;
  payment_type: PaymentType;
  deposit_amount: number | null;
  show_price_publicly: boolean;
}

const steps = [
  { id: 1, title: "Serviço", icon: Calendar },
  { id: 2, title: "Data e Hora", icon: Clock },
  { id: 3, title: "Seus Dados", icon: User },
  { id: 4, title: "Pagamento", icon: CreditCard },
  { id: 5, title: "Confirmação", icon: CheckCircle2 },
];

export default function AgendarPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    serviceId: "",
    professionalId: null,
    modality: "presencial",
    date: null,
    time: null,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientBirthDate: "",
    isMinor: false,
    guardianName: "",
    reasonForVisit: "",
    acceptTerms: false,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return (data || []).map((s: Record<string, unknown>) => ({
        ...s,
        modalities: Array.isArray(s.modalities) 
          ? s.modalities 
          : typeof s.modalities === 'string' 
            ? (s.modalities as string).replace(/[{}]/g, '').split(',').filter(Boolean)
            : [],
      })) as ExtendedService[];
    },
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: professionalServices = [] } = useQuery({
    queryKey: ["professional-services-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professional_services")
        .select("professional_id, service_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: availabilityRules = [] } = useQuery({
    queryKey: ["availability-rules-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: timeOffBlocks = [] } = useQuery({
    queryKey: ["time-off-blocks-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_blocks")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: dateOverrides = [] } = useQuery({
    queryKey: ["date-overrides-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("date_overrides")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingAppointments = [] } = useQuery({
    queryKey: ["existing-appointments-booking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_date, scheduled_time, professional_id")
        .in("status", ["pending", "confirmed"]);
      if (error) throw error;
      return data;
    },
  });

  const selectedService = services.find((s) => s.id === formData.serviceId);

  // Get professionals that offer the selected service
  const professionalsForService = formData.serviceId
    ? professionalServices
        .filter((ps) => ps.service_id === formData.serviceId)
        .map((ps) => ps.professional_id)
    : professionals.map((p) => p.id);

  // Filter availability rules by professionals who offer the selected service
  const filteredAvailabilityRules = formData.serviceId
    ? availabilityRules.filter((rule) => professionalsForService.includes(rule.professional_id))
    : availabilityRules;

  const filteredDateOverrides = formData.serviceId
    ? dateOverrides.filter((override) => professionalsForService.includes(override.professional_id))
    : dateOverrides;

  const filteredTimeOffBlocks = formData.serviceId
    ? timeOffBlocks.filter((block) => professionalsForService.includes(block.professional_id))
    : timeOffBlocks;

  const availableDaysOfWeek = [...new Set(filteredAvailabilityRules.map(rule => rule.day_of_week))];

  const isDateBlocked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (!formData.serviceId) {
      return timeOffBlocks.some(block => dateStr >= format(new Date(block.start_datetime), "yyyy-MM-dd") && dateStr <= format(new Date(block.end_datetime), "yyyy-MM-dd"));
    }
    if (professionalsForService.length === 0) return true;
    return professionalsForService.every(profId => {
      return filteredTimeOffBlocks.some(block => 
        block.professional_id === profId && dateStr >= format(new Date(block.start_datetime), "yyyy-MM-dd") && dateStr <= format(new Date(block.end_datetime), "yyyy-MM-dd")
      );
    });
  };

  const getDateOverride = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return filteredDateOverrides.find(override => override.override_date === dateStr && !override.is_blocked);
  };

  const isDateBlockedByOverride = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    if (!formData.serviceId || professionalsForService.length === 0) {
      return dateOverrides.some(o => o.override_date === dateStr && o.is_blocked);
    }
    const overridesForDate = filteredDateOverrides.filter(o => o.override_date === dateStr);
    if (overridesForDate.length === 0) return false;
    return professionalsForService.every(profId => {
      const override = overridesForDate.find(o => o.professional_id === profId);
      return override && override.is_blocked;
    });
  };

  const availableDates = Array.from({ length: 60 }, (_, i) => addDays(new Date(), i + 1))
    .filter((date) => {
      if (formData.serviceId && professionalsForService.length === 0) return false;
      const override = getDateOverride(date);
      if (override) return true;
      if (isDateBlockedByOverride(date)) return false;
      const dayOfWeek = date.getDay();
      if (!availableDaysOfWeek.includes(dayOfWeek)) return false;
      if (isDateBlocked(date)) return false;
      return true;
    });

  const getTimeSlotsForDate = (date: Date): string[] => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    const slots: string[] = [];
    
    const overridesForDate = filteredDateOverrides.filter(
      o => o.override_date === dateStr && !o.is_blocked && o.start_time && o.end_time
    );
    
    if (overridesForDate.length > 0) {
      overridesForDate.forEach(override => {
        const startHour = parseInt(override.start_time!.split(":")[0]);
        const endHour = parseInt(override.end_time!.split(":")[0]);
        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
          const isBooked = existingAppointments.some(
            apt => apt.scheduled_date === dateStr && apt.scheduled_time === timeSlot
          );
          if (!isBooked) slots.push(timeSlot);
        }
      });
      return [...new Set(slots)].sort();
    }
    
    const dayOfWeek = date.getDay();
    const rulesForDay = filteredAvailabilityRules.filter(rule => rule.day_of_week === dayOfWeek);
    if (rulesForDay.length === 0) return [];
    
    rulesForDay.forEach(rule => {
      const startHour = parseInt(rule.start_time.split(":")[0]);
      const endHour = parseInt(rule.end_time.split(":")[0]);
      for (let hour = startHour; hour < endHour; hour++) {
        const timeSlot = `${hour.toString().padStart(2, "0")}:00`;
        const isBooked = existingAppointments.some(
          apt => apt.scheduled_date === dateStr && apt.scheduled_time === timeSlot
        );
        if (!isBooked) slots.push(timeSlot);
      }
    });
    
    return [...new Set(slots)].sort();
  };

  const timeSlots = formData.date ? getTimeSlotsForDate(formData.date) : [];

  const handleServiceSelect = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    const defaultModality = service?.modalities?.length === 1 
      ? service.modalities[0] as AppointmentModality 
      : "presencial";
    
    setFormData((prev) => ({ 
      ...prev, 
      serviceId, 
      modality: defaultModality,
      date: null, 
      time: null 
    }));

    setTimeout(() => {
      const modalitySection = document.getElementById('modality-section');
      if (modalitySection) {
        modalitySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleModalitySelect = (modality: AppointmentModality) => {
    setFormData((prev) => ({ ...prev, modality }));
    setTimeout(() => {
      setCurrentStep(2);
      // Scroll to step 2 content on mobile
      setTimeout(() => {
        const stepElement = document.getElementById('step-2-content');
        if (stepElement && window.innerWidth < 768) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 300);
  };

  const handleDateSelect = (date: Date) => {
    setFormData((prev) => ({ ...prev, date, time: null }));
    // Scroll to time selection on mobile
    setTimeout(() => {
      const timeSection = document.getElementById('time-selection-section');
      if (timeSection && window.innerWidth < 768) {
        timeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, time }));
    // Auto advance to step 3 and scroll on mobile
    setTimeout(() => {
      setCurrentStep(3);
      setTimeout(() => {
        const stepElement = document.getElementById('step-3-content');
        if (stepElement && window.innerWidth < 768) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }, 300);
  };

  const handleInputChange = (field: keyof BookingFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      // Scroll to next step content on mobile
      setTimeout(() => {
        const stepElement = document.getElementById(`step-${nextStepNum}-content`);
        if (stepElement && window.innerWidth < 768) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prevStepNum = currentStep - 1;
      setCurrentStep(prevStepNum);
      // Scroll to previous step content on mobile
      setTimeout(() => {
        const stepElement = document.getElementById(`step-${prevStepNum}-content`);
        if (stepElement && window.innerWidth < 768) {
          stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.serviceId && formData.modality;
      case 2:
        return formData.date && formData.time;
      case 3:
        return (
          formData.clientName &&
          formData.clientEmail &&
          formData.clientPhone &&
          formData.acceptTerms &&
          (!formData.isMinor || formData.guardianName)
        );
      case 4:
        // Payment step - always can proceed (payment is shown as info)
        return true;
      default:
        return true;
    }
  };

  // Get the display price based on service config
  const getServicePriceDisplay = (service: ExtendedService) => {
    if (!service.show_price_publicly || service.price_mode === "consult") {
      return null;
    }
    return formatPriceDisplay(service.price_mode, service.price, service.price_from_amount, service.show_price_publicly);
  };

  // Get the amount to pay (for payment required services)
  const getPaymentAmount = () => {
    if (!selectedService) return 0;
    if (selectedService.payment_type === "deposit" && selectedService.deposit_amount) {
      return selectedService.deposit_amount;
    }
    return selectedService.price || 0;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    
    setIsSubmitting(true);
    console.log("[Agendar] Iniciando agendamento...", {
      service: selectedService?.name,
      date: formData.date,
      time: formData.time,
      modality: formData.modality,
      clientEmail: formData.clientEmail,
    });

    try {
      // Step 1: Create or get client
      console.log("[Agendar] Step 1: Criando/buscando cliente...");
      
      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      let birthDateForDb: string | null = null;
      if (formData.clientBirthDate && formData.clientBirthDate.length === 10) {
        const [day, month, year] = formData.clientBirthDate.split("/");
        if (day && month && year && year.length === 4) {
          birthDateForDb = `${year}-${month}-${day}`;
        }
      }
      
      const { data: clientId, error: clientError } = await supabase
        .rpc("get_or_create_client_for_booking", {
          _email: formData.clientEmail,
          _name: formData.clientName,
          _phone: formData.clientPhone,
          _birth_date: birthDateForDb,
          _is_minor: formData.isMinor,
          _guardian: formData.guardianName || null,
        });

      if (clientError) {
        console.error("[Agendar] ❌ Erro ao criar cliente:", {
          code: clientError.code,
          message: clientError.message,
          details: clientError.details,
          hint: clientError.hint,
        });
        toast.error(`Erro ao registrar cliente: ${clientError.message}`);
        return;
      }

      if (!clientId) {
        console.error("[Agendar] ❌ Cliente não retornado (clientId null)");
        toast.error("Erro ao registrar cliente: ID não retornado");
        return;
      }

      console.log("[Agendar] ✓ Cliente criado/encontrado:", clientId);

      // Step 2: Create appointment
      console.log("[Agendar] Step 2: Criando agendamento...");
      const appointmentStatus = "pending";

      const appointmentPayload = {
        client_id: clientId,
        professional_id: formData.professionalId || professionals[0]?.id,
        service_id: formData.serviceId,
        scheduled_date: format(formData.date!, "yyyy-MM-dd"),
        scheduled_time: formData.time,
        end_time: formData.time,
        modality: formData.modality,
        reason_for_visit: formData.reasonForVisit || null,
        status: appointmentStatus,
        code: "",
      };
      console.log("[Agendar] Payload do agendamento:", appointmentPayload);

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert([appointmentPayload])
        .select("id, code")
        .single();

      if (appointmentError) {
        console.error("[Agendar] ❌ Erro ao criar agendamento:", {
          code: appointmentError.code,
          message: appointmentError.message,
          details: appointmentError.details,
          hint: appointmentError.hint,
        });
        toast.error(`Erro ao criar agendamento: ${appointmentError.message}`);
        return;
      }

      console.log("[Agendar] ✓ Agendamento criado:", appointment);

      // Step 3: If payment required, create order
      if (selectedService?.require_payment_to_confirm && selectedService.payment_type !== "none") {
        console.log("[Agendar] Step 3: Criando pedido (pagamento necessário)...");
        const paymentAmount = getPaymentAmount();
        const tempCode = `ORD-${Date.now().toString(36).toUpperCase()}`;

        const orderPayload = {
          code: tempCode,
          client_id: clientId,
          appointment_id: appointment.id,
          status: "pending" as const,
          total_amount: paymentAmount,
          currency: "BRL" as const,
          metadata: {
            payment_type: selectedService.payment_type === "deposit" ? "deposit" : "full",
            deposit_amount: selectedService.payment_type === "deposit" ? selectedService.deposit_amount : null,
          },
        };
        console.log("[Agendar] Payload do pedido:", orderPayload);

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([orderPayload])
          .select()
          .single();

        if (orderError) {
          console.error("[Agendar] ❌ Erro ao criar pedido:", {
            code: orderError.code,
            message: orderError.message,
            details: orderError.details,
            hint: orderError.hint,
          });
          toast.error(`Erro ao criar pedido: ${orderError.message}`);
          return;
        }

        console.log("[Agendar] ✓ Pedido criado:", order);

        // Step 4: Create order item
        console.log("[Agendar] Step 4: Criando item do pedido...");
        const { error: orderItemError } = await supabase.from("order_items").insert([{
          order_id: order.id,
          service_id: formData.serviceId,
          description: selectedService.name,
          unit_price: paymentAmount,
          quantity: 1,
          total_price: paymentAmount,
        }]);

        if (orderItemError) {
          console.error("[Agendar] ❌ Erro ao criar item do pedido:", {
            code: orderItemError.code,
            message: orderItemError.message,
            details: orderItemError.details,
            hint: orderItemError.hint,
          });
          // Non-blocking - continue to checkout
          console.warn("[Agendar] ⚠️ Continuando sem item do pedido...");
        } else {
          console.log("[Agendar] ✓ Item do pedido criado");
        }

        console.log("[Agendar] ✅ Sucesso! Redirecionando para checkout...", { checkout_token: order.checkout_token });
        toast.success("Agendamento criado! Redirecionando para pagamento...");
        navigate(`/checkout?token=${order.checkout_token}`);
      } else {
        console.log("[Agendar] ✅ Sucesso! Sem pagamento necessário, redirecionando para confirmação...");
        toast.success("Agendamento realizado com sucesso!");
        navigate(`/agendar/confirmacao?code=${appointment.code}`);
      }
    } catch (error: unknown) {
      // Catch-all for unexpected errors
      const err = error as { code?: string; message?: string; details?: string; hint?: string };
      console.error("[Agendar] ❌ Erro inesperado:", {
        error,
        code: err?.code,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
      });
      
      const errorMessage = err?.message || "Erro desconhecido";
      toast.error(`Erro ao realizar agendamento: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle WhatsApp contact for price consultation
  const handleWhatsAppConsult = () => {
    const message = encodeURIComponent(`Olá! Gostaria de saber o valor do serviço: ${selectedService?.name}`);
    window.open(`https://wa.me/5551992809471?text=${message}`, "_blank");
  };

  return (
    <Layout>
      {/* ============================================ */}
      {/* HERO SECTION - Ultra Premium Modern         */}
      {/* ============================================ */}
      <section className="relative min-h-[50svh] md:min-h-[60svh] flex items-center hero-premium -mt-20 overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Animated mesh pattern - hidden on mobile */}
        <div className="hero-mesh opacity-30 hidden md:block" />
        
        {/* Morphing Blobs - Desktop only for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="absolute top-10 right-20 w-[350px] h-[350px] bg-gradient-to-br from-accent/30 to-brand-gold/20 blob-morph blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-[400px] h-[400px] bg-gradient-to-tr from-brand-teal/25 to-accent/15 blob-morph blur-3xl" style={{ animationDelay: '-5s' }} />
        </div>
        
        {/* Floating Particles - Desktop only */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="particle particle-1 absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-white/40" />
          <div className="particle particle-2 absolute top-[30%] right-[25%] w-3 h-3 rounded-full bg-brand-gold/50" />
          <div className="particle particle-3 absolute bottom-[25%] left-[30%] w-2 h-2 rounded-full bg-accent/40" />
        </div>
        
        {/* Radial glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-radial from-accent/20 via-transparent to-transparent blur-3xl hidden lg:block" />
        
        {/* Content */}
        <div className="container-wide relative z-10 py-20 md:py-32 pt-28 md:pt-40">
          <div className="max-w-3xl mx-auto text-center">
            {/* Breadcrumb */}
            <nav className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-sm mb-6 md:mb-8">
              <Link to="/" className="hover:text-white transition-colors">Início</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-medium">Agendar</span>
            </nav>
            
            {/* Main Headline */}
            <h1 className="text-white mb-4 md:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight">
              <span className="block animate-fade-in">
                Agendar{' '}
                <span className="text-gradient-animated relative inline-block">Consulta</span>
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-base md:text-xl text-white/80 mb-8 md:mb-10 leading-relaxed animate-fade-in max-w-xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Escolha o serviço, data e horário que melhor se encaixam na sua rotina.
            </p>

            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
              </span>
              <span className="font-medium">Agendamento 100% Online e Seguro</span>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ============================================ */}
      {/* PREMIUM STEPS INDICATOR                     */}
      {/* ============================================ */}
      <section className="relative py-6 md:py-10 bg-gradient-to-b from-secondary/80 to-background border-b border-border/50 -mt-12 md:-mt-16 z-20">
        <div className="container-wide">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 md:gap-2 bg-white/80 backdrop-blur-sm rounded-2xl p-2 md:p-3 shadow-xl border border-border/50">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (step.id < currentStep) {
                        setCurrentStep(step.id);
                        // Scroll to step content on mobile
                        setTimeout(() => {
                          const stepElement = document.getElementById(`step-${step.id}-content`);
                          if (stepElement && window.innerWidth < 768) {
                            stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }
                    }}
                    disabled={step.id > currentStep}
                    className={cn(
                      "flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-3 rounded-xl transition-all duration-300",
                      currentStep === step.id
                        ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105"
                        : currentStep > step.id
                          ? "bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer"
                          : "bg-transparent text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
                      currentStep === step.id
                        ? "bg-white/20 text-white"
                        : currentStep > step.id
                          ? "bg-accent/20 text-accent"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {currentStep > step.id ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="hidden lg:inline font-medium text-sm">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-4 md:w-8 h-0.5 mx-1 md:mx-2 rounded-full transition-colors duration-300",
                      currentStep > step.id ? "bg-accent" : "bg-border"
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FORM CONTENT - Premium Cards               */}
      {/* ============================================ */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-background via-secondary/20 to-background">
        <div className="container-narrow">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <div id="step-1-content" className="space-y-8 animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  Passo 1 de 5
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Escolha o Serviço</h2>
                <p className="text-muted-foreground">Selecione o tipo de atendimento que você precisa</p>
              </div>

              <div className="grid gap-4 md:gap-5">
                {services.map((service) => {
                  const priceDisplay = getServicePriceDisplay(service);
                  
                  return (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className={cn(
                        "group relative p-6 md:p-8 rounded-2xl md:rounded-3xl text-left transition-all duration-300 overflow-hidden",
                        formData.serviceId === service.id
                          ? "bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-2 border-primary shadow-xl scale-[1.02]"
                          : "bg-white border-2 border-border hover:border-primary/30 hover:shadow-lg hover:scale-[1.01]"
                      )}
                    >
                      {/* Background gradient on hover */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300",
                        formData.serviceId !== service.id && "group-hover:opacity-100"
                      )} />
                      
                      <div className="relative flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            <h3 className="font-display font-bold text-lg md:text-xl">{service.name}</h3>
                            {service.require_payment_to_confirm && (
                              <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
                                <CreditCard className="w-3 h-3" />
                                Pag. Online
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm md:text-base mb-4 leading-relaxed">{service.description}</p>
                          <div className="flex items-center gap-4 md:gap-6 text-sm flex-wrap">
                            <span className="flex items-center gap-1.5 text-primary font-medium">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Clock className="w-4 h-4" />
                              </div>
                              {service.duration_minutes} min
                            </span>
                            {service.modalities.includes("presencial") && (
                              <span className="flex items-center gap-1.5 text-foreground/70">
                                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                Presencial
                              </span>
                            )}
                            {service.modalities.includes("online") && (
                              <span className="flex items-center gap-1.5 text-foreground/70">
                                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                                  <Video className="w-4 h-4" />
                                </div>
                                Online
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {priceDisplay ? (
                            <div className="space-y-1">
                              <div className="text-xl md:text-2xl font-bold text-primary">{priceDisplay}</div>
                              {service.allow_installments && service.price && (
                                <div className="text-xs text-muted-foreground">
                                  até {service.max_installments}x de {formatCurrency(service.price / service.max_installments)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground font-medium">
                              Sob consulta
                            </div>
                          )}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mt-3 ml-auto transition-all duration-300",
                            formData.serviceId === service.id
                              ? "bg-primary text-white scale-110"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                          )}>
                            {formData.serviceId === service.id ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <ArrowRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.serviceId && selectedService && (
                <div id="modality-section" className="mt-8 p-6 md:p-8 bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-2xl md:rounded-3xl border border-border/50 animate-fade-in shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Como deseja ser atendido?</h3>
                      <p className="text-sm text-muted-foreground">Selecione a modalidade para continuar</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
                    {selectedService.modalities.includes("presencial") && (
                      <button
                        onClick={() => handleModalitySelect("presencial")}
                        className={cn(
                          "group relative p-6 rounded-2xl flex items-center gap-4 transition-all duration-300 overflow-hidden",
                          formData.modality === "presencial"
                            ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl scale-[1.02]"
                            : "bg-white border-2 border-border hover:border-primary/50 hover:shadow-lg"
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                          formData.modality === "presencial" 
                            ? "bg-white/20 text-white" 
                            : "bg-primary/10 text-primary group-hover:bg-primary/20"
                        )}>
                          <MapPin className="w-7 h-7" />
                        </div>
                        <div className="text-left flex-1">
                          <div className={cn(
                            "font-display font-bold text-lg",
                            formData.modality === "presencial" ? "text-white" : "text-foreground"
                          )}>Presencial</div>
                          <div className={cn(
                            "text-sm",
                            formData.modality === "presencial" ? "text-white/80" : "text-muted-foreground"
                          )}>Porto Alegre, RS</div>
                        </div>
                        {formData.modality === "presencial" && (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        )}
                      </button>
                    )}
                    {selectedService.modalities.includes("online") && (
                      <button
                        onClick={() => handleModalitySelect("online")}
                        className={cn(
                          "group relative p-6 rounded-2xl flex items-center gap-4 transition-all duration-300 overflow-hidden",
                          formData.modality === "online"
                            ? "bg-gradient-to-br from-accent to-accent/80 text-white shadow-xl scale-[1.02]"
                            : "bg-white border-2 border-border hover:border-accent/50 hover:shadow-lg"
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                          formData.modality === "online" 
                            ? "bg-white/20 text-white" 
                            : "bg-accent/10 text-accent group-hover:bg-accent/20"
                        )}>
                          <Video className="w-7 h-7" />
                        </div>
                        <div className="text-left flex-1">
                          <div className={cn(
                            "font-display font-bold text-lg",
                            formData.modality === "online" ? "text-white" : "text-foreground"
                          )}>Online</div>
                          <div className={cn(
                            "text-sm",
                            formData.modality === "online" ? "text-white/80" : "text-muted-foreground"
                          )}>Videoconferência</div>
                        </div>
                        {formData.modality === "online" && (
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {currentStep === 2 && (
            <div id="step-2-content" className="space-y-8 animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  Passo 2 de 5
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Escolha Data e Horário</h2>
                <p className="text-muted-foreground">Selecione o melhor dia e horário para você</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Date Selection */}
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-border shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg">Data</h3>
                  </div>
                  {availableDates.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-2">
                      {availableDates.map((date) => (
                        <button
                          key={date.toISOString()}
                          onClick={() => handleDateSelect(date)}
                          className={cn(
                            "group p-3 rounded-xl text-center transition-all duration-300",
                            formData.date && isSameDay(formData.date, date)
                              ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg scale-105"
                              : "bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 hover:shadow-md"
                          )}
                        >
                          <div className={cn(
                            "text-[10px] uppercase font-medium",
                            formData.date && isSameDay(formData.date, date) ? "text-white/80" : "text-muted-foreground"
                          )}>
                            {format(date, "EEE", { locale: ptBR })}
                          </div>
                          <div className="text-xl font-bold">
                            {format(date, "dd")}
                          </div>
                          <div className={cn(
                            "text-[10px] font-medium",
                            formData.date && isSameDay(formData.date, date) ? "text-white/80" : "text-muted-foreground"
                          )}>
                            {format(date, "MMM", { locale: ptBR })}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-secondary/50 text-center text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="font-medium mb-2">Nenhuma data disponível</p>
                      <p className="text-sm">Não há horários configurados no momento.</p>
                    </div>
                  )}
                </div>

                {/* Time Selection */}
                <div id="time-selection-section" className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-border shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="font-display font-bold text-lg">Horário</h3>
                  </div>
                  {formData.date ? (
                    timeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={cn(
                              "p-4 rounded-xl text-center font-bold transition-all duration-300",
                              formData.time === time
                                ? "bg-gradient-to-br from-accent to-primary text-white shadow-lg scale-105"
                                : "bg-secondary/50 hover:bg-secondary border border-transparent hover:border-accent/20 hover:shadow-md"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 rounded-2xl bg-secondary/50 text-center text-muted-foreground">
                        <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="font-medium mb-2">Nenhum horário disponível</p>
                        <p className="text-sm">Todos os horários deste dia já estão ocupados.</p>
                      </div>
                    )
                  ) : (
                    <div className="p-8 rounded-2xl bg-secondary/50 text-center text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="font-medium">Selecione uma data primeiro</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Client Data */}
          {currentStep === 3 && (
            <div id="step-3-content" className="space-y-8 animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                  <User className="w-3.5 h-3.5" />
                  Passo 3 de 5
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Seus Dados</h2>
                <p className="text-muted-foreground">Preencha suas informações para confirmar o agendamento</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-border shadow-lg space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Nome Completo *
                    </Label>
                    <Input
                      id="name"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange("clientName", e.target.value)}
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
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange("clientEmail", e.target.value)}
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
                        value={formData.clientPhone}
                        onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                        placeholder="(51) 99999-9999"
                        className="h-12 rounded-xl border-border focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Data de Nascimento
                      </Label>
                      <Input
                        id="birthDate"
                        type="text"
                        inputMode="numeric"
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        value={formData.clientBirthDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
                          if (value.length > 5) value = value.slice(0, 5) + "/" + value.slice(5, 9);
                          handleInputChange("clientBirthDate", value);
                        }}
                        className="h-12 rounded-xl border-border focus:border-primary"
                      />
                      <p className="text-xs text-muted-foreground">Formato: DD/MM/AAAA</p>
                    </div>
                    <div className="flex items-end gap-3 pb-2">
                      <Checkbox
                        id="isMinor"
                        checked={formData.isMinor}
                        onCheckedChange={(checked) => handleInputChange("isMinor", !!checked)}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="isMinor" className="text-sm cursor-pointer">Paciente menor de idade</Label>
                    </div>
                  </div>

                  {formData.isMinor && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="guardian" className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-accent" />
                        Nome do Responsável *
                      </Label>
                      <Input
                        id="guardian"
                        value={formData.guardianName}
                        onChange={(e) => handleInputChange("guardianName", e.target.value)}
                        placeholder="Nome completo do responsável"
                        className="h-12 rounded-xl border-border focus:border-primary"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Motivo da Consulta (opcional)
                    </Label>
                    <Textarea
                      id="reason"
                      value={formData.reasonForVisit}
                      onChange={(e) => handleInputChange("reasonForVisit", e.target.value)}
                      placeholder="Descreva brevemente o motivo do atendimento..."
                      rows={3}
                      className="rounded-xl border-border focus:border-primary resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-3 p-5 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => handleInputChange("acceptTerms", !!checked)}
                      className="h-5 w-5 mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      Li e aceito a{" "}
                      <Link to="/politica-de-privacidade" className="text-primary font-medium hover:underline">
                        Política de Privacidade
                      </Link>{" "}
                      e autorizo o tratamento dos meus dados para fins de atendimento.
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div id="step-4-content" className="space-y-8 animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                  <CreditCard className="w-3.5 h-3.5" />
                  Passo 4 de 5
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Pagamento</h2>
                <p className="text-muted-foreground">Revise o valor e forma de pagamento</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-border shadow-lg space-y-6">
                  {/* Service Summary */}
                  <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-xl">{selectedService?.name}</h3>
                      <p className="text-muted-foreground">{selectedService?.duration_minutes} minutos</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {selectedService?.require_payment_to_confirm && selectedService.payment_type !== "none" ? (
                    <div className="space-y-6">
                      {/* Amount to Pay */}
                      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20">
                        <div className="text-sm text-muted-foreground mb-2">Valor a Pagar</div>
                        <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                          {formatCurrency(getPaymentAmount())}
                        </div>
                        {selectedService.payment_type === "deposit" && selectedService.price && (
                          <div className="text-sm text-muted-foreground">
                            Entrada (Valor total do serviço: {formatCurrency(selectedService.price)})
                          </div>
                        )}
                        {selectedService.allow_installments && selectedService.max_installments > 1 && (
                          <div className="text-sm text-accent font-medium mt-2">
                            ou em até {selectedService.max_installments}x no cartão
                          </div>
                        )}
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <h4 className="font-display font-bold mb-4">Formas de Pagamento Aceitas</h4>
                        <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
                          <div className="group p-5 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border text-center hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                              <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <div className="font-bold text-sm">Cartão de Crédito</div>
                            <div className="text-xs text-muted-foreground">Até {selectedService.max_installments}x</div>
                          </div>
                          <div className="group p-5 rounded-2xl bg-gradient-to-br from-secondary to-secondary/50 border border-border text-center hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                              <DollarSign className="w-6 h-6 text-accent" />
                            </div>
                            <div className="font-bold text-sm">Pix</div>
                            <div className="text-xs text-muted-foreground">Aprovação instantânea</div>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <div className="text-sm">
                            <strong>Pagamento Online Obrigatório:</strong> Ao continuar, você será redirecionado para uma página segura de pagamento. Sua consulta será confirmada automaticamente após a aprovação.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedService?.price_mode === "consult" ? (
                    <div className="space-y-6">
                      <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-brand-gold/10 border border-accent/20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-accent" />
                        </div>
                        <h4 className="font-display font-bold text-xl mb-2">Valor Sob Consulta</h4>
                        <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
                          O valor deste serviço depende de uma avaliação prévia. Entre em contato conosco para saber mais.
                        </p>
                        <Button variant="outline" onClick={handleWhatsAppConsult} className="gap-2 rounded-xl h-12 px-6">
                          <MessageSquare className="w-4 h-4" />
                          Consultar pelo WhatsApp
                        </Button>
                      </div>
                      <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-accent" />
                          </div>
                          <div className="text-sm">
                            <strong>Continuar sem pagamento:</strong> Você pode confirmar o agendamento e acertar o pagamento diretamente na clínica ou após a consulta de avaliação.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Show price if available */}
                      {selectedService?.show_price_publicly && selectedService.price && (
                        <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-accent/10 via-primary/5 to-accent/5 border border-accent/20">
                          <div className="text-sm text-muted-foreground mb-2">Valor do Serviço</div>
                          <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                            {formatCurrency(selectedService.price)}
                          </div>
                          {selectedService.allow_installments && selectedService.max_installments > 1 && (
                            <div className="text-sm text-accent font-medium">
                              ou em até {selectedService.max_installments}x
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-accent" />
                          </div>
                          <div className="text-sm">
                            <strong>Pagamento na Clínica:</strong> O pagamento será realizado presencialmente ou você receberá instruções após a confirmação do agendamento.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
            <div id="step-5-content" className="space-y-8 animate-fade-in">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Passo 5 de 5
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Confirme seu Agendamento</h2>
                <p className="text-muted-foreground">Revise os dados e confirme sua consulta</p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-10 border border-border shadow-lg space-y-6">
                  {/* Service Header */}
                  <div className="flex items-center gap-4 pb-6 border-b border-border">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-xl md:text-2xl">{selectedService?.name}</h3>
                      <p className="text-muted-foreground">{selectedService?.duration_minutes} minutos de atendimento</p>
                    </div>
                    {/* Price display */}
                    {selectedService && selectedService.show_price_publicly && selectedService.price_mode !== "consult" && (
                      <div className="text-right hidden sm:block">
                        <div className="text-2xl font-bold text-primary">
                          {selectedService.payment_type === "deposit" && selectedService.deposit_amount ? (
                            formatCurrency(selectedService.deposit_amount)
                          ) : (
                            selectedService.price && formatCurrency(selectedService.price)
                          )}
                        </div>
                        {selectedService.payment_type === "deposit" && selectedService.price && (
                          <div className="text-sm text-muted-foreground">
                            Entrada (Total: {formatCurrency(selectedService.price)})
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary Grid */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="p-4 rounded-2xl bg-secondary/50 space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Data</div>
                      <div className="font-bold text-lg">
                        {formData.date && format(formData.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Horário</div>
                      <div className="font-bold text-lg">{formData.time}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Modalidade</div>
                      <div className="font-bold flex items-center gap-2">
                        {formData.modality === "presencial" ? (
                          <>
                            <MapPin className="w-5 h-5 text-primary" />
                            Presencial - Porto Alegre
                          </>
                        ) : (
                          <>
                            <Video className="w-5 h-5 text-accent" />
                            Online - Videoconferência
                          </>
                        )}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/50 space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Paciente</div>
                      <div className="font-bold text-lg">{formData.clientName}</div>
                    </div>
                  </div>

                  {formData.modality === "presencial" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Endereço</div>
                          <div className="font-bold">Rua João Salomoni, 650 - Vila Nova, Porto Alegre - RS</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment info banner */}
                  {selectedService?.require_payment_to_confirm && selectedService.payment_type !== "none" && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-sm">
                          <strong>Pagamento Online:</strong> Após confirmar, você será redirecionado para efetuar o pagamento de{" "}
                          <span className="font-bold text-primary">{formatCurrency(getPaymentAmount())}</span>
                          {selectedService.payment_type === "deposit" && " (entrada)"}. A consulta será confirmada após a aprovação.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info note */}
                <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div className="text-sm">
                      <strong>Importante:</strong> Você receberá um e-mail de confirmação com os detalhes do agendamento. Em caso de imprevistos, entre em contato pelo WhatsApp para remarcar.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-border">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2 h-12 px-6 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>

              {currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white gap-2 h-12 px-8 rounded-xl shadow-lg font-semibold"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white gap-2 h-12 px-8 rounded-xl shadow-lg font-semibold"
                >
                  {isSubmitting ? (
                    "Processando..."
                  ) : selectedService?.require_payment_to_confirm ? (
                    <>
                      Confirmar e Pagar
                      <CreditCard className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Confirmar Agendamento
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
