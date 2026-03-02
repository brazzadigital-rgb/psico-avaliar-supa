import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import specialtyImg from "@/assets/specialty-psiquiatria.jpg";
import {
  Stethoscope,
  CheckCircle2,
  Brain,
  Heart,
  Users,
  ArrowRight,
  Calendar,
  MessageCircle,
  ChevronRight,
  Shield,
  Pill,
  Activity,
} from "lucide-react";

const benefits = [
  {
    icon: Brain,
    title: "Diagnóstico Especializado",
    description: "Avaliação psiquiátrica completa para identificar transtornos mentais e definir o melhor tratamento.",
  },
  {
    icon: Pill,
    title: "Tratamento Medicamentoso",
    description: "Quando indicado, prescrição e acompanhamento de medicação com segurança e responsabilidade.",
  },
  {
    icon: Heart,
    title: "Abordagem Integrativa",
    description: "Tratamento integrado com psicoterapia e outras especialidades para resultados completos.",
  },
  {
    icon: Activity,
    title: "Acompanhamento Contínuo",
    description: "Monitoramento regular para ajustes e otimização do tratamento ao longo do tempo.",
  },
];

const conditions = [
  { name: "Depressão", category: "Humor" },
  { name: "Transtorno Bipolar", category: "Humor" },
  { name: "Ansiedade Generalizada", category: "Ansiedade" },
  { name: "Transtorno do Pânico", category: "Ansiedade" },
  { name: "TOC", category: "Ansiedade" },
  { name: "TDAH", category: "Neurodesenvolvimento" },
  { name: "TEA", category: "Neurodesenvolvimento" },
  { name: "Insônia e Distúrbios do Sono", category: "Sono" },
  { name: "Esquizofrenia", category: "Psicótico" },
  { name: "Transtorno de Personalidade", category: "Personalidade" },
];

const integrationPoints = [
  {
    title: "Psicoterapia + Psiquiatria",
    description: "O tratamento combinado de psicoterapia e acompanhamento psiquiátrico oferece os melhores resultados para diversos transtornos.",
  },
  {
    title: "Avaliação Diagnóstica",
    description: "Integração com nossa equipe de avaliação psicológica e neuropsicológica para diagnósticos precisos.",
  },
  {
    title: "Comunicação Contínua",
    description: "Profissionais em diálogo constante para alinhar estratégias e otimizar seu tratamento.",
  },
];

export default function PsiquiatriaPage() {
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
                <span className="text-white">Psiquiatria</span>
              </nav>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
                <Stethoscope className="w-4 h-4 text-brand-gold" />
                Tratamento Integrado
              </div>

              <h1 className="text-white mb-6">
                <span className="text-gradient-animated">Psiquiatria</span> Humanizada
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Acompanhamento psiquiátrico integrado à equipe terapêutica. Diagnóstico preciso e tratamento responsável para sua saúde mental.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/5551992809471?text=Olá! Gostaria de agendar uma consulta psiquiátrica."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Consulta
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="https://wa.me/5551992809471?text=Olá! Tenho dúvidas sobre a consulta psiquiátrica."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5" />
                  Tirar Dúvidas
                </a>
              </div>
            </div>

            <div className="hidden lg:block animate-fade-in-scale" style={{ animationDelay: "0.3s" }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/30 to-primary/30 rounded-3xl blur-2xl" />
                <img
                  src={specialtyImg}
                  alt="Psiquiatria"
                  className="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Nossa Abordagem
            </span>
            <h2 className="text-foreground mb-4">Psiquiatria de Excelência</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cuidado responsável e integrado para sua saúde mental
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="card-premium p-8 group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="icon-container w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent">
                  <benefit.icon className="w-7 h-7 text-primary transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Áreas de Atuação
              </span>
              <h2 className="text-foreground mb-6">Condições Tratadas</h2>
              <p className="text-lg text-muted-foreground mb-10">
                Nossa equipe de psiquiatria está preparada para diagnosticar e tratar uma ampla variedade de transtornos mentais.
              </p>

              <div className="flex flex-wrap gap-3">
                {conditions.map((condition, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {condition.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-scale" style={{ animationDelay: "0.2s" }}>
              <div className="card-premium p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-[100px]" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                    <Shield className="w-4 h-4" />
                    Quando Procurar
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-4">
                    Sinais de Alerta
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      Tristeza ou ansiedade persistentes
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      Dificuldade para dormir ou dormir demais
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      Mudanças bruscas de humor
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      Dificuldade de concentração
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      Pensamentos intrusivos ou preocupações excessivas
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="section-padding bg-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container-wide relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Tratamento Integrado
            </span>
            <h2 className="text-white mb-4">Psiquiatria + Equipe Multidisciplinar</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Na Psicoavaliar, a psiquiatria trabalha em conjunto com psicólogos e outros profissionais para um cuidado completo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {integrationPoints.map((point, index) => (
              <div
                key={index}
                className="p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-3">{point.title}</h3>
                <p className="text-white/70">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-mesh">
        <div className="container-wide text-center">
          <h2 className="text-foreground mb-6 animate-fade-in">
            Cuidar da mente é cuidar da vida
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up">
            Agende uma consulta psiquiátrica e dê o primeiro passo para uma vida com mais equilíbrio e bem-estar.
          </p>
          <a
            href="https://wa.me/5551992809471?text=Olá! Quero agendar uma consulta psiquiátrica."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 btn-premium text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Calendar className="w-5 h-5" />
            Agendar Consulta
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </Layout>
  );
}
