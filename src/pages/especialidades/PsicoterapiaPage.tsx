import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import specialtyImg from "@/assets/specialty-psicoterapia.jpg";
import {
  Heart,
  CheckCircle2,
  Users,
  Baby,
  GraduationCap,
  ArrowRight,
  Calendar,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Brain,
  Shield,
} from "lucide-react";
import { useWhatsApp } from "@/hooks/useWhatsApp";
const approaches = [
  {
    title: "Terapia Cognitivo-Comportamental (TCC)",
    description: "Foco em identificar e modificar padrões de pensamento e comportamento disfuncionais. Abordagem prática e orientada para resultados.",
    indications: ["Ansiedade", "Depressão", "Fobias", "TOC", "TDAH"],
  },
  {
    title: "Psicanálise",
    description: "Exploração profunda do inconsciente, trabalhando conflitos internos e padrões relacionais para transformação duradoura.",
    indications: ["Autoconhecimento", "Relacionamentos", "Traumas", "Identidade"],
  },
];

const audiences = [
  {
    icon: Baby,
    title: "Infantil",
    age: "A partir de 4 anos",
    description: "Atendimento lúdico e acolhedor, utilizando jogos, desenhos e brincadeiras como ferramentas terapêuticas.",
    topics: ["Dificuldades emocionais", "Problemas de comportamento", "Medos e ansiedade", "Adaptação escolar"],
  },
  {
    icon: GraduationCap,
    title: "Adolescentes",
    age: "12 a 18 anos",
    description: "Espaço seguro para lidar com as transformações e desafios únicos dessa fase da vida.",
    topics: ["Identidade", "Autoestima", "Relacionamentos", "Pressão escolar", "Redes sociais"],
  },
  {
    icon: Users,
    title: "Adultos",
    age: "A partir de 18 anos",
    description: "Suporte para questões do dia a dia, carreira, relacionamentos e desenvolvimento pessoal.",
    topics: ["Ansiedade e estresse", "Depressão", "Relacionamentos", "Carreira", "Autoconhecimento"],
  },
];

const benefits = [
  "Acolhimento humanizado e sem julgamentos",
  "Profissionais especializados e em constante atualização",
  "Modalidade presencial e online",
  "Planos de assinatura com valores acessíveis",
  "Integração com equipe multidisciplinar quando necessário",
  "Ambiente seguro e confidencial",
];

export default function PsicoterapiaPage() {
  const { getWhatsAppUrl } = useWhatsApp();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center hero-premium">
        <div className="hero-mesh" />
        <div className="floating-shape floating-shape-1" />
        <div className="floating-shape floating-shape-2" />

        <div className="container-wide relative z-10 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <Link to="/" className="hover:text-white transition-colors">Início</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to="/especialidades" className="hover:text-white transition-colors">Especialidades</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">Psicoterapia</span>
              </nav>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
                <Heart className="w-4 h-4 text-brand-gold" />
                Cuidado Integral
              </div>

              <h1 className="text-white mb-6">
                <span className="text-gradient-animated">Psicoterapia</span> para Todas as Idades
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Atendimento psicológico humanizado com abordagens especializadas para crianças, adolescentes e adultos. Presencial em Porto Alegre e online para todo Brasil.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={getWhatsAppUrl("Olá! Gostaria de agendar uma sessão de psicoterapia.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Sessão
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  to="/assinaturas"
                  className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  Ver Planos
                </Link>
              </div>
            </div>

            <div className="hidden lg:block animate-fade-in-scale" style={{ animationDelay: "0.3s" }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/30 rounded-3xl blur-2xl" />
                <img
                  src={specialtyImg}
                  alt="Psicoterapia"
                  className="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approaches Section */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Nossas Abordagens
            </span>
            <h2 className="text-foreground mb-4">Métodos Terapêuticos</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trabalhamos com abordagens cientificamente validadas, adaptadas às necessidades de cada paciente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {approaches.map((approach, index) => (
              <div
                key={index}
                className="card-premium p-10 group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="icon-container w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent">
                  <Brain className="w-8 h-8 text-primary transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">{approach.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{approach.description}</p>
                <div className="flex flex-wrap gap-2">
                  {approach.indications.map((indication, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-secondary text-sm font-medium text-secondary-foreground"
                    >
                      {indication}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Para Quem é
            </span>
            <h2 className="text-foreground mb-4">Atendimento Especializado</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {audiences.map((audience, index) => (
              <div
                key={index}
                className="card-premium p-8 group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110">
                  <audience.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">{audience.title}</h3>
                <span className="text-accent font-medium text-sm mb-4 block">{audience.age}</span>
                <p className="text-muted-foreground mb-6">{audience.description}</p>
                <ul className="space-y-2">
                  {audience.topics.map((topic, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container-wide relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Diferenciais
              </span>
              <h2 className="text-white mb-6">Por Que Escolher a Psicoavaliar?</h2>
              <p className="text-xl text-white/70 mb-10">
                Nosso compromisso é oferecer um atendimento de excelência, acolhedor e acessível.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-white/80 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-fade-in-scale" style={{ animationDelay: "0.3s" }}>
              <div className="glass-card p-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  Condições Especiais
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Planos de Assinatura
                </h3>
                <p className="text-muted-foreground mb-8">
                  Sessões semanais com valores diferenciados para tornar seu tratamento mais acessível.
                </p>
                <div className="flex flex-col gap-4">
                  <Link
                    to="/assinaturas"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white font-semibold rounded-full hover:bg-primary/90 transition-all duration-300"
                  >
                    Ver Planos
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href={getWhatsAppUrl("Olá! Quero saber mais sobre os planos de assinatura.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-border text-foreground font-medium rounded-full hover:bg-muted transition-all duration-300"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Falar com Atendimento
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-mesh">
        <div className="container-wide text-center">
          <h2 className="text-foreground mb-6 animate-fade-in">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up">
            O primeiro passo é o mais importante. Agende uma conversa inicial sem compromisso.
          </p>
          <a
            href={getWhatsAppUrl("Olá! Gostaria de agendar uma sessão de psicoterapia.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 btn-premium text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Calendar className="w-5 h-5" />
            Agendar Primeira Sessão
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </Layout>
  );
}
