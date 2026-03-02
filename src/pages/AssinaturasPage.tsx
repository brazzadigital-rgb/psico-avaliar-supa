import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HeroWithImage } from "@/components/ui/hero-with-image";
import { Section, SectionHeader } from "@/components/ui/section";
import { PremiumCard, IconBox, FeatureList } from "@/components/ui/premium-card";
import { PremiumAccordion, PremiumAccordionItem, PremiumAccordionTrigger, PremiumAccordionContent } from "@/components/ui/premium-accordion";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";
import heroImage from "@/assets/hero-assinaturas.jpg";
import {
  CheckCircle2,
  Star,
  Clock,
  Users,
  Sparkles,
  ArrowUpRight,
  Heart,
  Shield,
  CalendarCheck,
  MessageCircle,
  CreditCard,
  Percent,
  HelpCircle,
} from "lucide-react";

const plans = [
  {
    name: "Essencial",
    description: "Ideal para manutenção do tratamento",
    frequency: "1 sessão por semana",
    features: [
      "1 sessão semanal de 50 minutos",
      "Psicoterapia individual",
      "Modalidade presencial ou online",
      "Acompanhamento contínuo",
      "Relatórios de evolução",
    ],
    highlight: false,
    gradient: "from-primary/5 to-accent/5",
    icon: Heart,
  },
  {
    name: "Intensivo",
    description: "Recomendado para tratamentos que exigem maior frequência",
    frequency: "2 sessões por semana",
    features: [
      "2 sessões semanais de 50 minutos",
      "Psicoterapia individual",
      "Modalidade presencial ou online",
      "Acompanhamento intensivo",
      "Relatórios de evolução mensais",
      "Contato com profissional entre sessões",
    ],
    highlight: true,
    gradient: "from-accent/10 to-primary/10",
    icon: Sparkles,
  },
  {
    name: "Familiar",
    description: "Para crianças com suporte aos responsáveis",
    frequency: "1 sessão + orientação familiar",
    features: [
      "1 sessão semanal de 50 minutos",
      "Psicoterapia infantil especializada",
      "Orientação mensal aos pais",
      "Comunicação com escola",
      "Relatórios de evolução",
    ],
    highlight: false,
    gradient: "from-amber-500/5 to-yellow-500/5",
    icon: Users,
  },
];

const benefits = [
  {
    icon: Percent,
    title: "Valores Diferenciados",
    description: "Economia significativa em relação às sessões avulsas, tornando o tratamento mais acessível.",
  },
  {
    icon: CalendarCheck,
    title: "Constância no Tratamento",
    description: "A regularidade é fundamental para resultados efetivos em qualquer processo terapêutico.",
  },
  {
    icon: Shield,
    title: "Suporte Completo",
    description: "Acompanhamento próximo, relatórios de evolução e orientação contínua.",
  },
  {
    icon: CreditCard,
    title: "Facilidade de Pagamento",
    description: "Diversas formas de pagamento e condições especiais para planos de assinatura.",
  },
];

const faqs = [
  {
    question: "Posso trocar de profissional durante o plano?",
    answer: "Sim, caso necessário, você pode solicitar a troca de profissional. Faremos uma nova triagem para direcionar ao profissional mais adequado para suas necessidades.",
  },
  {
    question: "Como funciona o atendimento online?",
    answer: "O atendimento online é realizado por videochamada em plataforma segura, com a mesma qualidade do atendimento presencial. Você receberá o link de acesso antes da sessão.",
  },
  {
    question: "Posso cancelar o plano a qualquer momento?",
    answer: "Sim, você pode cancelar o plano com aviso prévio de 30 dias. Não há multa por cancelamento, apenas solicitamos comunicação prévia para organizarmos a transição.",
  },
  {
    question: "O plano inclui atendimento de emergência?",
    answer: "Os planos não incluem atendimento de emergência, mas oferecemos suporte prioritário para reagendamentos e orientações urgentes pelo WhatsApp.",
  },
  {
    question: "Há desconto para pagamento anual?",
    answer: "Sim, oferecemos condições especiais para pagamento trimestral ou semestral. Entre em contato para conhecer as opções disponíveis.",
  },
];

const included = [
  "Sessões individuais com profissional especializado",
  "Acompanhamento de evolução do tratamento",
  "Relatórios periódicos de progresso",
  "Comunicação direta com o profissional",
  "Reagendamento flexível de sessões",
  "Orientação e suporte familiar",
];

export default function AssinaturasPage() {
  return (
    <Layout>
      {/* Hero */}
      <HeroWithImage
        badge={{ icon: Sparkles, text: "Condições Especiais", variant: "accent" }}
        title="Planos de Assinatura"
        description="Condições acessíveis para cuidar da sua saúde mental com constância e qualidade. Atendimento presencial e online."
        size="md"
        backgroundImage={heroImage}
        overlay="gradient"
      >
        <div className="flex items-center gap-3 mt-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium">
            <Star className="w-4 h-4" />
            Valores diferenciados
          </span>
        </div>
      </HeroWithImage>

      {/* Plans */}
      <Section>
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, index) => (
              <ScrollAnimate key={index} animation="fade-up" delay={index * 0.15}>
                <div
                  className={`relative h-full transition-all duration-500 ${
                    plan.highlight ? "md:-mt-4 md:mb-4 z-10" : ""
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-accent to-primary text-white text-sm font-medium rounded-full shadow-lg">
                        <Star className="w-4 h-4" />
                        Recomendado
                      </span>
                    </div>
                  )}
                  
                  <PremiumCard
                    variant={plan.highlight ? "highlight" : "default"}
                    padding="lg"
                    className="h-full flex flex-col"
                  >
                    <div className="mb-6">
                      <IconBox
                        icon={plan.icon}
                        size="lg"
                        className={`mb-4 bg-gradient-to-br ${plan.gradient}`}
                      />
                      <h3 className="text-2xl font-display font-semibold mb-2">{plan.name}</h3>
                      <p className="text-muted-foreground text-sm">{plan.description}</p>
                    </div>
                    
                    <div className="mb-6 pb-6 border-b border-border">
                      <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                        <Clock className="w-5 h-5" />
                        {plan.frequency}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Valores sob consulta
                      </p>
                    </div>

                    <div className="flex-1">
                      <FeatureList features={plan.features} variant="check" className="mb-8" />
                    </div>

                    <Button
                      asChild
                      className={`w-full rounded-full ${
                        plan.highlight ? "btn-premium text-white" : ""
                      }`}
                      variant={plan.highlight ? "default" : "outline"}
                      size="lg"
                    >
                      <a
                        href={`https://wa.me/5551992809471?text=Olá! Tenho interesse no plano ${plan.name}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Quero saber mais
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </PremiumCard>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </Section>

      {/* What's Included */}
      <Section variant="muted">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollAnimate animation="slide-right">
              <div>
                <SectionHeader
                  badge="Benefícios"
                  title="O que está incluso"
                  description="Todos os planos incluem benefícios pensados para o seu bem-estar"
                  align="left"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {included.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-accent group-hover:scale-110">
                        <CheckCircle2 className="w-4 h-4 text-accent group-hover:text-white" />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimate>

            <ScrollAnimate animation="slide-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <PremiumCard key={index} padding="md" className="group">
                    <IconBox icon={benefit.icon} size="md" className="mb-4" />
                    <h4 className="font-display font-semibold mb-2">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </PremiumCard>
                ))}
              </div>
            </ScrollAnimate>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="container-narrow">
          <ScrollAnimate animation="fade-up">
            <SectionHeader
              badge="Dúvidas Frequentes"
              title="Perguntas e Respostas"
              description="Tire suas dúvidas sobre nossos planos de assinatura"
            />
          </ScrollAnimate>

          <ScrollAnimate animation="fade-up" delay={0.2}>
            <PremiumAccordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <PremiumAccordionItem key={index} value={`item-${index}`}>
                  <PremiumAccordionTrigger>
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-accent flex-shrink-0" />
                      {faq.question}
                    </div>
                  </PremiumAccordionTrigger>
                  <PremiumAccordionContent>{faq.answer}</PremiumAccordionContent>
                </PremiumAccordionItem>
              ))}
            </PremiumAccordion>
          </ScrollAnimate>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="gradient">
        <div className="container-narrow relative z-10 text-center">
          <ScrollAnimate animation="fade-up">
            <h2 className="text-white mb-6">
              Precisa de ajuda para escolher?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Nossa equipe está pronta para esclarecer suas dúvidas e encontrar o plano ideal para você.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/5551992809471?text=Olá! Preciso de ajuda para escolher um plano."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-xl"
              >
                <MessageCircle className="w-5 h-5" />
                Falar pelo WhatsApp
              </a>
              <Link
                to="/financiamento"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all duration-300"
              >
                Conhecer Financiamento
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </Section>
    </Layout>
  );
}
