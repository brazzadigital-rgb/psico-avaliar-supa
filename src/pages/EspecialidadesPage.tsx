import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HeroWithImage } from "@/components/ui/hero-with-image";
import { Section, SectionHeader } from "@/components/ui/section";
import { PremiumCard, IconBox, FeatureList } from "@/components/ui/premium-card";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import heroImage from "@/assets/hero-especialidades.jpg";
import {
  Brain,
  Heart,
  Sparkles,
  Stethoscope,
  GraduationCap,
  Users,
  ArrowRight,
  ArrowUpRight,
  Star,
  Search,
  ClipboardCheck,
  MessageSquare,
  CalendarCheck,
} from "lucide-react";

const specialties = [
  {
    icon: Brain,
    title: "Avaliação Psicológica e Neuropsicológica",
    description:
      "Avaliação completa para diagnóstico de TEA, TDAH, dificuldades de aprendizagem, superdotação e outras condições. Inclui entrevistas, testes padronizados, laudo detalhado e devolutiva.",
    features: [
      "Diagnóstico preciso com instrumentos validados",
      "Laudo completo em até 30 dias",
      "Devolutiva detalhada para família",
      "Orientações para escola e profissionais",
    ],
    href: "/especialidades/avaliacao-psicologica-e-neuropsicologica",
    gradient: "from-primary/10 to-accent/10",
    featured: true,
    tags: ["Infantil", "Adulto", "Presencial"],
  },
  {
    icon: Heart,
    title: "Psicoterapia",
    description:
      "Atendimento terapêutico individualizado para crianças, adolescentes e adultos. Trabalhamos com TCC e Psicanálise.",
    features: [
      "Atendimento infantil, adolescente e adulto",
      "TCC e Psicanálise",
      "Modalidade presencial e online",
      "Planos de assinatura disponíveis",
    ],
    href: "/especialidades/psicoterapia",
    gradient: "from-rose-500/10 to-pink-500/10",
    tags: ["Infantil", "Adulto", "Online", "Presencial"],
  },
  {
    icon: Sparkles,
    title: "Terapia ABA",
    description:
      "Análise do Comportamento Aplicada (ABA) é uma intervenção baseada em evidências para TEA.",
    features: [
      "Intervenção baseada em evidências",
      "Plano individualizado",
      "Acompanhamento de evolução",
      "Orientação familiar",
    ],
    href: "/especialidades/terapia-aba",
    gradient: "from-amber-500/10 to-yellow-500/10",
    tags: ["Infantil", "Presencial"],
  },
  {
    icon: Stethoscope,
    title: "Psiquiatria",
    description:
      "Avaliação e acompanhamento psiquiátrico integrado à equipe terapêutica.",
    features: [
      "Avaliação psiquiátrica completa",
      "Acompanhamento medicamentoso",
      "Integração com equipe terapêutica",
      "Atendimento a todas as idades",
    ],
    href: "/especialidades/psiquiatria",
    gradient: "from-blue-500/10 to-indigo-500/10",
    tags: ["Infantil", "Adulto", "Presencial"],
  },
  {
    icon: GraduationCap,
    title: "Psicopedagogia",
    description:
      "Avaliação e intervenção em dificuldades de aprendizagem, dislexia e outros transtornos.",
    features: [
      "Avaliação de dificuldades escolares",
      "Intervenção especializada",
      "Orientação para pais e escola",
      "Apoio ao desenvolvimento acadêmico",
    ],
    href: "/especialidades/psicopedagogia",
    gradient: "from-emerald-500/10 to-teal-500/10",
    tags: ["Infantil", "Presencial", "Online"],
  },
  {
    icon: Users,
    title: "Equipe Multidisciplinar",
    description:
      "Fonoaudiólogos e outros profissionais para atendimento integrado.",
    features: [
      "Fonoaudiologia",
      "Atendimento integrado",
      "Discussão de casos em equipe",
      "Plano terapêutico conjunto",
    ],
    href: "/contato",
    gradient: "from-purple-500/10 to-violet-500/10",
    tags: ["Infantil", "Adulto", "Presencial"],
  },
];

const howItWorks = [
  {
    icon: MessageSquare,
    step: "1",
    title: "Entre em Contato",
    description: "Fale conosco pelo WhatsApp ou agende online para iniciar sua jornada.",
  },
  {
    icon: ClipboardCheck,
    step: "2",
    title: "Triagem Inicial",
    description: "Realizamos uma conversa inicial para entender suas necessidades.",
  },
  {
    icon: CalendarCheck,
    step: "3",
    title: "Inicie o Tratamento",
    description: "Comece seu atendimento com o profissional mais adequado para você.",
  },
];

const filterTags = ["Todos", "Infantil", "Adulto", "Online", "Presencial"];

export default function EspecialidadesPage() {
  const { getWhatsAppUrl } = useWhatsApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");

  const filteredSpecialties = specialties.filter((specialty) => {
    const matchesSearch = specialty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "Todos" || specialty.tags?.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      {/* Hero with Search */}
      <HeroWithImage
        badge={{ icon: Star, text: "Áreas de Atuação" }}
        title="Nossas Especialidades"
        description="Equipe multidisciplinar preparada para oferecer atendimento especializado em saúde mental para crianças, adolescentes e adultos."
        size="md"
        backgroundImage={heroImage}
        overlay="gradient"
      >
        {/* Search and Filters */}
        <div className="mt-10 max-w-2xl">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-full bg-white/80 backdrop-blur-sm border-border/50 shadow-md focus:shadow-lg transition-shadow"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filterTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeFilter === tag
                    ? "bg-primary text-white shadow-md"
                    : "bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </HeroWithImage>

      {/* Specialties Grid */}
      <Section>
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredSpecialties.map((specialty, index) => (
              <ScrollAnimate key={index} animation="fade-up" delay={index * 0.1}>
                <PremiumCard
                  padding="lg"
                  className={`group overflow-hidden ${specialty.featured ? "lg:col-span-2" : ""}`}
                  variant={specialty.featured ? "highlight" : "default"}
                >
                  <div className={specialty.featured ? "lg:flex lg:gap-12" : ""}>
                    <div className={specialty.featured ? "lg:flex-1" : ""}>
                      <div className="flex items-start gap-4 mb-4">
                        <IconBox
                          icon={specialty.icon}
                          size="lg"
                          className={`bg-gradient-to-br ${specialty.gradient}`}
                        />
                        <div className="flex-1">
                          <h3 className="text-xl md:text-2xl font-display font-semibold mb-2">
                            {specialty.title}
                          </h3>
                          {specialty.tags && (
                            <div className="flex flex-wrap gap-2">
                              {specialty.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {specialty.description}
                      </p>
                    </div>

                    <div className={specialty.featured ? "lg:flex-1" : ""}>
                      <FeatureList features={specialty.features} variant="dot" className="mb-8" />

                      <div className="flex flex-wrap gap-3">
                        <Button asChild className="btn-premium text-white rounded-full">
                          <Link to={specialty.href}>
                            Saiba mais
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-full border-2">
                          <a
                            href={getWhatsAppUrl("Olá! Gostaria de saber mais sobre esta especialidade.")}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Tirar dúvidas
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </ScrollAnimate>
            ))}
          </div>
          
          {filteredSpecialties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma especialidade encontrada.</p>
            </div>
          )}
        </div>
      </Section>

      {/* How It Works */}
      <Section variant="muted">
        <div className="container-wide">
          <ScrollAnimate animation="fade-up">
            <SectionHeader
              badge="Processo Simples"
              title="Como Funciona"
              description="Conheça as etapas para iniciar seu tratamento conosco"
            />
          </ScrollAnimate>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <ScrollAnimate key={index} animation="fade-up" delay={index * 0.15}>
                <PremiumCard className="text-center group relative overflow-hidden">
                  {/* Step number background */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center">
                    <span className="text-6xl font-display font-bold text-primary/10">{step.step}</span>
                  </div>
                  
                  <IconBox icon={step.icon} size="lg" className="mx-auto mb-6 relative z-10" />
                  <h3 className="font-display font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </PremiumCard>
              </ScrollAnimate>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="gradient">
        <div className="container-narrow relative z-10 text-center">
          <ScrollAnimate animation="fade-up">
            <h2 className="text-white mb-6">
              Ainda tem dúvidas sobre qual especialidade procurar?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Nossa equipe pode ajudar a direcionar você para o atendimento mais adequado.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href={getWhatsAppUrl("Olá! Preciso de ajuda para entender qual especialidade procurar.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-xl"
              >
                Falar com nossa equipe
                <ArrowUpRight className="w-5 h-5" />
              </a>
              <Link
                to="/faq"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all duration-300"
              >
                Ver perguntas frequentes
              </Link>
            </div>
          </ScrollAnimate>
        </div>
      </Section>
    </Layout>
  );
}
