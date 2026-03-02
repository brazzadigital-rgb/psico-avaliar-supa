import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";
import { HeroWithImage } from "@/components/ui/hero-with-image";
import { Section, SectionHeader } from "@/components/ui/section";
import { PremiumCard, IconBox } from "@/components/ui/premium-card";
import { CopyButton } from "@/components/ui/copy-button";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";
import heroImage from "@/assets/hero-contato.jpg";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Star,
  MessageCircle,
  ExternalLink,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWhatsApp } from "@/hooks/useWhatsApp";

const contactInfo = [
  {
    icon: MapPin,
    title: "Endereço",
    content: "Rua João Salomoni, 650",
    subtitle: "Vila Nova, Porto Alegre - RS",
    copyable: "Rua João Salomoni, 650, Vila Nova, Porto Alegre - RS",
    action: {
      label: "Abrir no Maps",
      href: "https://maps.google.com/?q=Rua+João+Salomoni,+650,+Vila+Nova,+Porto+Alegre+-+RS",
      external: true,
    },
  },
  {
    icon: Phone,
    title: "WhatsApp",
    content: "(51) 99280-9471",
    copyable: "5551992809471",
    action: {
      label: "Enviar mensagem",
      href: "https://wa.me/5551992809471",
      external: true,
    },
  },
  {
    icon: Mail,
    title: "E-mail",
    content: "centropsicoavaliar@gmail.com",
    copyable: "centropsicoavaliar@gmail.com",
    action: {
      label: "Enviar e-mail",
      href: "mailto:centropsicoavaliar@gmail.com",
      external: false,
    },
  },
  {
    icon: Clock,
    title: "Horário de Atendimento",
    content: "Segunda a Sexta: 8h às 20h",
    subtitle: "Sábado: 8h às 12h",
  },
];

export default function ContatoPage() {
  const { toast } = useToast();
  const { getWhatsAppUrl, formattedPhone, phoneDigits } = useWhatsApp();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Mensagem enviada!",
      description: "Em breve entraremos em contato.",
    });
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <Layout>
      {/* Hero */}
      <HeroWithImage
        badge={{ icon: Star, text: "Entre em Contato" }}
        title="Fale Conosco"
        description="Estamos prontos para atender você. Entre em contato pelo formulário, WhatsApp ou visite nosso consultório."
        size="sm"
        backgroundImage={heroImage}
        overlay="gradient"
      >
        <div className="flex flex-wrap gap-4 mt-8">
          <Button asChild className="btn-premium text-white rounded-full">
            <a
              href={getWhatsAppUrl("Olá! Gostaria de informações sobre atendimento.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Falar no WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-2">
            <a href="mailto:centropsicoavaliar@gmail.com">
              <Mail className="w-4 h-4 mr-2" />
              Enviar E-mail
            </a>
          </Button>
        </div>
      </HeroWithImage>

      {/* Contact Cards */}
      <Section size="md">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item, index) => (
              <ScrollAnimate key={index} animation="fade-up" delay={index * 0.1}>
                <PremiumCard padding="md" className="h-full group">
                  <div className="flex items-start justify-between mb-4">
                    <IconBox icon={item.icon} size="md" />
                    {item.copyable && (
                      <CopyButton text={item.copyable} label={`${item.title} copiado!`} />
                    )}
                  </div>
                  <h3 className="font-display font-semibold mb-1">{item.title}</h3>
                  <p className="text-foreground font-medium">{item.content}</p>
                  {item.subtitle && (
                    <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                  )}
                  {item.action && (
                    <a
                      href={item.action.href}
                      target={item.action.external ? "_blank" : undefined}
                      rel={item.action.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-2 mt-4 text-sm text-primary font-medium hover:underline"
                    >
                      {item.action.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </PremiumCard>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </Section>

      {/* Map & Form */}
      <Section variant="muted">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map */}
            <ScrollAnimate animation="slide-right">
              <div className="h-full">
                <SectionHeader
                  badge="Localização"
                  title="Como Chegar"
                  description="Visite nosso consultório em Porto Alegre"
                  align="left"
                />
                
                <PremiumCard padding="sm" className="overflow-hidden h-80 lg:h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3454.8654387927383!2d-51.1746883!3d-30.0346!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951979a4b5c3c3c3%3A0x8f8f8f8f8f8f8f8f!2sRua%20Jo%C3%A3o%20Salomoni%2C%20650%20-%20Vila%20Nova%2C%20Porto%20Alegre%20-%20RS!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-2xl"
                  />
                </PremiumCard>
                
                <Button asChild variant="outline" className="mt-4 rounded-full w-full">
                  <a
                    href="https://maps.google.com/?q=Rua+João+Salomoni,+650,+Vila+Nova,+Porto+Alegre+-+RS"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Abrir no Google Maps
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </a>
                </Button>
              </div>
            </ScrollAnimate>

            {/* Form */}
            <ScrollAnimate animation="slide-left">
              <div>
                <SectionHeader
                  badge="Formulário"
                  title="Envie uma Mensagem"
                  description="Preencha o formulário e retornaremos o mais breve possível"
                  align="left"
                />
                
                <PremiumCard padding="lg">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Nome completo
                        </Label>
                        <Input
                          id="name"
                          placeholder="Seu nome"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          WhatsApp
                        </Label>
                        <Input
                          id="phone"
                          placeholder="(51) 99999-9999"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="rounded-xl h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">
                        Assunto
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Qual o motivo do contato?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">
                        Mensagem
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Escreva sua mensagem..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        required
                        className="rounded-xl resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full btn-premium text-white rounded-full h-12"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </>
                      )}
                    </Button>
                  </form>
                </PremiumCard>
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </Section>

      {/* Schedule CTA */}
      <Section>
        <div className="container-narrow">
          <ScrollAnimate animation="fade-up">
            <PremiumCard padding="lg" className="text-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-[100px]" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-[80px]" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-primary" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-display font-semibold mb-4">
                  Agende sua Consulta
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Prefere agendar diretamente? Use nosso sistema de agendamento online para escolher o melhor horário.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild className="btn-premium text-white rounded-full" size="lg">
                    <Link to="/agendar">
                      Agendar Online
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full" size="lg">
                    <a
                      href={getWhatsAppUrl("Olá! Gostaria de agendar uma consulta.")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Agendar pelo WhatsApp
                    </a>
                  </Button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    Atendimento presencial
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    Atendimento online
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    Resposta rápida
                  </span>
                </div>
              </div>
            </PremiumCard>
          </ScrollAnimate>
        </div>
      </Section>
    </Layout>
  );
}
