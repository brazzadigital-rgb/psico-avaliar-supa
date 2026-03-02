import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import specialtyImg from "@/assets/specialty-avaliacao.jpg";
import {
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Target,
  ArrowRight,
  Calendar,
  MessageCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useWhatsApp } from "@/hooks/useWhatsApp";
const benefits = [
  {
    icon: Target,
    title: "Diagnóstico Preciso",
    description: "Identificação detalhada de condições como TEA, TDAH, dificuldades de aprendizagem e transtornos emocionais.",
  },
  {
    icon: FileText,
    title: "Laudo Completo",
    description: "Relatório técnico detalhado para fins clínicos, escolares, judiciais ou de benefícios.",
  },
  {
    icon: Users,
    title: "Devolutiva Humanizada",
    description: "Sessão explicativa com linguagem acessível para paciente e família.",
  },
  {
    icon: Clock,
    title: "Prazo de 30 Dias",
    description: "Entrega do laudo em até 30 dias úteis após a conclusão das sessões.",
  },
];

const steps = [
  {
    number: "01",
    title: "Anamnese Inicial",
    description: "Entrevista detalhada para compreender histórico, queixas e expectativas.",
    duration: "1-2 sessões",
  },
  {
    number: "02",
    title: "Aplicação de Testes",
    description: "Bateria de testes padronizados adaptados ao perfil do paciente.",
    duration: "3-5 sessões",
  },
  {
    number: "03",
    title: "Análise e Integração",
    description: "Interpretação dos resultados e elaboração do laudo técnico.",
    duration: "Interno",
  },
  {
    number: "04",
    title: "Devolutiva",
    description: "Apresentação dos resultados e orientações para o tratamento.",
    duration: "1 sessão",
  },
];

const faqs = [
  {
    question: "Qual a diferença entre avaliação psicológica e neuropsicológica?",
    answer: "A avaliação psicológica foca em aspectos emocionais, comportamentais e de personalidade. Já a neuropsicológica investiga funções cognitivas como memória, atenção, linguagem e funções executivas. Muitas vezes, são realizadas de forma integrada.",
  },
  {
    question: "A partir de que idade pode ser feita a avaliação?",
    answer: "Realizamos avaliações a partir dos 4 anos de idade. Para crianças menores, utilizamos instrumentos específicos e observação clínica.",
  },
  {
    question: "Quantas sessões são necessárias?",
    answer: "Em média, são necessárias de 5 a 8 sessões, dependendo da complexidade do caso e da idade do paciente.",
  },
  {
    question: "O laudo é aceito em escolas e órgãos públicos?",
    answer: "Sim. Nossos laudos seguem todas as normas do CFP e são aceitos para fins escolares, judiciais, INSS e outras instituições.",
  },
];

export default function AvaliacaoPage() {
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
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <Link to="/" className="hover:text-white transition-colors">Início</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to="/especialidades" className="hover:text-white transition-colors">Especialidades</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">Avaliação</span>
              </nav>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
                <Brain className="w-4 h-4 text-brand-gold" />
                Especialidade Principal
              </div>

              <h1 className="text-white mb-6">
                Avaliação <span className="text-gradient-animated">Psicológica</span> e Neuropsicológica
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Diagnóstico preciso e personalizado para TEA, TDAH, dificuldades de aprendizagem e outras condições. Laudo completo em até 30 dias.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={getWhatsAppUrl("Olá! Gostaria de agendar uma avaliação psicológica.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Avaliação
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href={getWhatsAppUrl("Olá! Tenho dúvidas sobre avaliação psicológica.")}
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
                  alt="Avaliação Psicológica"
                  className="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Por Que Escolher Nossa Avaliação
            </span>
            <h2 className="text-foreground mb-4">Benefícios do Processo</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma avaliação completa e humanizada que vai além do diagnóstico
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

      {/* Process Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Etapas do Processo
            </span>
            <h2 className="text-foreground mb-4">Como Funciona a Avaliação</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 pl-6">
            {steps.map((step, index) => (
              <div key={index} className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
                )}
                <div className="card-premium p-8 relative z-10">
                  <div className="absolute -top-5 -left-5 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg z-20">
                    <span className="text-lg font-bold text-white">{step.number}</span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xl font-display font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <span className="inline-flex items-center gap-2 text-sm text-accent font-medium">
                      <Clock className="w-4 h-4" />
                      {step.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Dúvidas Frequentes
              </span>
              <h2 className="text-foreground mb-6">Perguntas Sobre Avaliação</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Tire suas principais dúvidas sobre o processo de avaliação psicológica e neuropsicológica.
              </p>
              <a
                href={getWhatsAppUrl("Olá! Tenho uma dúvida sobre avaliação psicológica.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors group"
              >
                Tem outra dúvida? Fale conosco
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="card-premium p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <h4 className="font-display font-bold text-lg mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="container-wide relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-brand-gold" />
            Financiamento Próprio Disponível
          </div>
          <h2 className="text-white mb-6 animate-fade-in-up">
            Pronto para dar o primeiro passo?
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Agende sua avaliação e receba um diagnóstico preciso com nossa equipe especializada.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <a
              href={getWhatsAppUrl("Olá! Quero agendar uma avaliação psicológica.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              Agendar pelo WhatsApp
            </a>
            <Link
              to="/financiamento"
              className="inline-flex items-center gap-3 px-8 py-4 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all duration-300"
            >
              Conhecer Financiamento
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
