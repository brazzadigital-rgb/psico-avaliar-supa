import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HeroWithImage } from "@/components/ui/hero-with-image";
import { Section, SectionHeader } from "@/components/ui/section";
import { PremiumCard, IconBox, FeatureList } from "@/components/ui/premium-card";
import { Timeline } from "@/components/ui/timeline";
import heroImage from "@/assets/hero-quem-somos.jpg";
import { ScrollAnimate, StaggerContainer } from "@/hooks/useScrollAnimation";
import {
  Heart,
  Target,
  Shield,
  Users,
  CheckCircle2,
  Award,
  Clock,
  ArrowUpRight,
  Star,
  Eye,
  Sparkles,
  MessageCircle,
} from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Acolhimento",
    description: "Cada pessoa é única e merece ser ouvida com respeito e empatia.",
    gradient: "from-rose-500/20 to-pink-500/20",
  },
  {
    icon: Shield,
    title: "Ética",
    description: "Atuação pautada nos mais altos padrões éticos da profissão.",
    gradient: "from-blue-500/20 to-indigo-500/20",
  },
  {
    icon: Target,
    title: "Responsabilidade",
    description: "Comprometimento com diagnósticos precisos e tratamentos eficazes.",
    gradient: "from-primary/20 to-accent/20",
  },
  {
    icon: Users,
    title: "Respeito à Infância",
    description: "Abordagem especializada e cuidadosa para o público infantil.",
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
];

const team = [
  {
    name: "Equipe de Psicólogos",
    role: "Avaliação e Psicoterapia",
    description: "Profissionais especializados em avaliação psicológica, neuropsicológica e psicoterapia.",
    icon: Award,
  },
  {
    name: "Analistas do Comportamento",
    role: "Terapia ABA",
    description: "Especialistas em análise do comportamento aplicada para intervenção em TEA.",
    icon: Sparkles,
  },
  {
    name: "Psiquiatras",
    role: "Acompanhamento Médico",
    description: "Médicos psiquiatras para avaliação e acompanhamento medicamentoso.",
    icon: Heart,
  },
  {
    name: "Psicopedagogos",
    role: "Dificuldades de Aprendizagem",
    description: "Profissionais focados em dificuldades escolares e transtornos de aprendizagem.",
    icon: Users,
  },
];

const timeline = [
  { step: "1", title: "Triagem Inicial", description: "Primeiro contato para entender suas necessidades e direcionar para o profissional adequado." },
  { step: "2", title: "Avaliação", description: "Processo especializado com instrumentos validados cientificamente." },
  { step: "3", title: "Devolutiva", description: "Apresentação detalhada dos resultados e orientações personalizadas." },
  { step: "4", title: "Acompanhamento", description: "Plano terapêutico individualizado com suporte contínuo." },
];

const differentials = [
  "Equipe multidisciplinar especializada",
  "Avaliações com instrumentos validados cientificamente",
  "Laudos detalhados entregues em até 30 dias",
  "Atendimento presencial e online",
  "Financiamento próprio para avaliações",
  "Planos de assinatura com valores acessíveis",
  "Ambiente acolhedor para o público infantil",
  "Transparência em todo o processo",
];

export default function QuemSomosPage() {
  return (
    <Layout>
      {/* Hero */}
      <HeroWithImage
        badge={{ icon: Star, text: "Sobre Nós" }}
        title="Acolhimento em Cada Etapa da Vida"
        description="Fundado em outubro de 2023, o Centro de Psicologia Psicoavaliar nasceu com a missão de oferecer atendimento especializado em saúde mental com excelência técnica e cuidado humanizado."
        size="md"
        backgroundImage={heroImage}
        overlay="gradient"
      >
        <div className="flex flex-wrap gap-4 mt-8">
          <Button asChild className="btn-premium text-white rounded-full">
            <a
              href="https://wa.me/5551992809471?text=Olá! Gostaria de agendar uma triagem."
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Agendar Triagem
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-2">
            <Link to="/agendar">Agendar Online</Link>
          </Button>
        </div>
        <div className="mt-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Atendimento presencial e online
          </span>
        </div>
      </HeroWithImage>

      {/* Mission & Vision */}
      <Section>
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScrollAnimate animation="fade-up">
              <PremiumCard padding="lg" className="group h-full">
                <IconBox icon={Target} size="lg" className="mb-6" />
                <h3 className="text-2xl font-display font-semibold mb-4">Nossa Missão</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Promover saúde mental através de avaliações precisas, intervenções terapêuticas eficazes e acolhimento genuíno, contribuindo para a qualidade de vida de nossos pacientes e suas famílias.
                </p>
              </PremiumCard>
            </ScrollAnimate>

            <ScrollAnimate animation="fade-up" delay={0.1}>
              <PremiumCard padding="lg" className="group h-full">
                <IconBox icon={Eye} size="lg" variant="accent" className="mb-6" />
                <h3 className="text-2xl font-display font-semibold mb-4">Nossa Visão</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ser referência em saúde mental no Rio Grande do Sul, reconhecidos pela excelência em avaliações neuropsicológicas e pela qualidade do atendimento multidisciplinar.
                </p>
              </PremiumCard>
            </ScrollAnimate>
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section variant="muted">
        <div className="container-wide">
          <ScrollAnimate animation="fade-up">
            <SectionHeader
              badge="O Que Nos Guia"
              title="Nossos Valores"
              description="Princípios que norteiam cada atendimento e decisão"
            />
          </ScrollAnimate>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <ScrollAnimate key={index} animation="fade-up" delay={index * 0.1}>
                <PremiumCard className="text-center group h-full">
                  <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto mb-6 transition-all duration-500 group-hover:scale-110`}>
                    <value.icon className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-xl mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </PremiumCard>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </Section>

      {/* Team */}
      <Section>
        <div className="container-wide">
          <ScrollAnimate animation="fade-up">
            <SectionHeader
              badge="Profissionais"
              title="Nossa Equipe"
              description="Profissionais qualificados e comprometidos com sua saúde mental"
            />
          </ScrollAnimate>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {team.map((member, index) => (
              <ScrollAnimate key={index} animation="fade-up" delay={index * 0.1}>
                <PremiumCard className="flex items-start gap-6 group">
                  <IconBox icon={member.icon} className="flex-shrink-0" />
                  <div>
                    <h3 className="font-display font-semibold text-lg">{member.name}</h3>
                    <p className="text-accent text-sm font-medium mb-2">{member.role}</p>
                    <p className="text-sm text-muted-foreground">{member.description}</p>
                  </div>
                </PremiumCard>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </Section>

      {/* Process Timeline */}
      <Section variant="gradient">
        <div className="container-wide relative z-10">
          <ScrollAnimate animation="fade-up">
            <SectionHeader
              badge="Jornada do Paciente"
              title="Estrutura do Atendimento"
              description="Conheça as etapas do nosso processo de cuidado"
              light
            />
          </ScrollAnimate>

          <Timeline items={timeline} variant="horizontal" />
        </div>
      </Section>

      {/* Differentials */}
      <Section>
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <ScrollAnimate animation="slide-right">
              <div>
                <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                  Por Que Nos Escolher
                </span>
                <h2 className="text-foreground mb-8">Nossos Diferenciais</h2>
                <div className="space-y-4">
                  {differentials.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-accent group-hover:scale-110">
                        <CheckCircle2 className="w-4 h-4 text-accent group-hover:text-white" />
                      </div>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollAnimate>

            <ScrollAnimate animation="slide-left">
              <PremiumCard padding="lg" className="text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-[80px]" />
                
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-8">
                  <Clock className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-semibold mb-4">Pronto para Começar?</h3>
                <p className="text-muted-foreground mb-8">
                  Agende sua triagem e dê o primeiro passo para o cuidado com sua saúde mental.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild className="btn-premium text-white rounded-full">
                    <a
                      href="https://wa.me/5551992809471?text=Olá! Gostaria de agendar uma triagem."
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Agendar pelo WhatsApp
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full border-2">
                    <Link to="/agendar">Agendar Online</Link>
                  </Button>
                </div>
              </PremiumCard>
            </ScrollAnimate>
          </div>
        </div>
      </Section>
    </Layout>
  );
}
