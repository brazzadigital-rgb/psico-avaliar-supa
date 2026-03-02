import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import specialtyImg from "@/assets/specialty-psicopedagogia.jpg";
import {
  GraduationCap,
  CheckCircle2,
  BookOpen,
  Brain,
  Target,
  ArrowRight,
  Calendar,
  MessageCircle,
  ChevronRight,
  Lightbulb,
  Users,
  PenTool,
} from "lucide-react";

const difficulties = [
  {
    icon: BookOpen,
    title: "Dislexia",
    description: "Dificuldade na leitura e escrita, afetando o reconhecimento de palavras e fluência.",
  },
  {
    icon: PenTool,
    title: "Disgrafia",
    description: "Dificuldade na expressão escrita, caligrafia e organização do texto.",
  },
  {
    icon: Brain,
    title: "Discalculia",
    description: "Dificuldade com conceitos matemáticos, cálculos e raciocínio numérico.",
  },
  {
    icon: Target,
    title: "TDAH e Aprendizagem",
    description: "Impactos da desatenção e hiperatividade no desempenho escolar.",
  },
];

const services = [
  "Avaliação psicopedagógica completa",
  "Intervenção em dificuldades de leitura e escrita",
  "Estimulação de funções cognitivas",
  "Técnicas de estudo e organização",
  "Orientação a pais e escola",
  "Acompanhamento escolar integrado",
  "Jogos e atividades lúdicas",
  "Reforço em áreas específicas",
];

const process = [
  {
    number: "01",
    title: "Avaliação Inicial",
    description: "Entrevista com família, análise de material escolar e testes psicopedagógicos.",
  },
  {
    number: "02",
    title: "Plano de Intervenção",
    description: "Desenvolvimento de estratégias personalizadas para as necessidades identificadas.",
  },
  {
    number: "03",
    title: "Sessões de Intervenção",
    description: "Atendimentos semanais com atividades e técnicas específicas.",
  },
  {
    number: "04",
    title: "Orientação Familiar e Escolar",
    description: "Parceria com família e escola para potencializar resultados.",
  },
];

const faqs = [
  {
    question: "A partir de que idade pode iniciar a psicopedagogia?",
    answer: "Atendemos a partir dos 4 anos, quando as primeiras dificuldades de aprendizagem podem ser identificadas. Quanto mais cedo a intervenção, melhores os resultados.",
  },
  {
    question: "O atendimento é só para crianças com diagnóstico?",
    answer: "Não! Atendemos tanto crianças e adolescentes com diagnósticos (dislexia, TDAH, etc.) quanto aqueles que apresentam dificuldades pontuais ou precisam de suporte para melhorar o desempenho escolar.",
  },
  {
    question: "Qual a frequência das sessões?",
    answer: "Recomendamos sessões semanais para melhores resultados. A frequência pode ser ajustada conforme a evolução e necessidades individuais.",
  },
];

export default function PsicopedagogiaPage() {
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
                <span className="text-white">Psicopedagogia</span>
              </nav>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
                <GraduationCap className="w-4 h-4 text-brand-gold" />
                Aprendizagem e Desenvolvimento
              </div>

              <h1 className="text-white mb-6">
                <span className="text-gradient-animated">Psicopedagogia</span> Clínica
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Apoio especializado para dificuldades de aprendizagem, dislexia, discalculia e outros desafios escolares. Desbloqueie o potencial de aprender.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/5551992809471?text=Olá! Gostaria de agendar uma avaliação psicopedagógica."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Avaliação
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="https://wa.me/5551992809471?text=Olá! Tenho dúvidas sobre psicopedagogia."
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
                  alt="Psicopedagogia"
                  className="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Difficulties */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              O Que Tratamos
            </span>
            <h2 className="text-foreground mb-4">Dificuldades de Aprendizagem</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Atuamos com diversas condições que podem impactar o desempenho escolar e o desenvolvimento cognitivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {difficulties.map((item, index) => (
              <div
                key={index}
                className="card-premium p-8 group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="icon-container w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent">
                  <item.icon className="w-7 h-7 text-primary transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Nossos Serviços
              </span>
              <h2 className="text-foreground mb-6">O Que Oferecemos</h2>
              <p className="text-lg text-muted-foreground mb-10">
                Intervenções personalizadas para desenvolver habilidades e superar barreiras no processo de aprendizagem.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-scale" style={{ animationDelay: "0.2s" }}>
              <div className="card-premium p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-gold/20 to-transparent rounded-bl-[100px]" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 text-brand-gold text-sm font-medium mb-6">
                    <Lightbulb className="w-4 h-4" />
                    Abordagem Lúdica
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-4">
                    Aprender Pode Ser Divertido
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Utilizamos jogos, atividades criativas e recursos tecnológicos para tornar o aprendizado uma experiência prazerosa e significativa.
                  </p>
                  <a
                    href="https://wa.me/5551992809471?text=Olá! Quero saber mais sobre a psicopedagogia."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors group"
                  >
                    Saiba mais
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding bg-primary relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="container-wide relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              Como Funciona
            </span>
            <h2 className="text-white mb-4">Nosso Processo</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 pl-6">
            {process.map((step, index) => (
              <div
                key={index}
                className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -top-5 -left-5 w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-brand-gold flex items-center justify-center shadow-lg z-10">
                  <span className="text-lg font-bold text-white">{step.number}</span>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-display font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/70">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* School Partnership */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="card-premium p-12 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
              <Users className="w-4 h-4" />
              Parceria Escola-Família
            </div>
            <h2 className="text-foreground mb-6 max-w-2xl mx-auto">
              Trabalhamos em Conjunto para o Sucesso do Aluno
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Mantemos comunicação ativa com a escola e oferecemos orientação aos professores, criando uma rede de apoio integrada para potencializar o desenvolvimento e a aprendizagem.
            </p>
            <a
              href="https://wa.me/5551992809471?text=Olá! Gostaria de saber mais sobre a orientação escolar."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors group"
            >
              Saiba mais sobre nossa abordagem
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Dúvidas Frequentes
              </span>
              <h2 className="text-foreground mb-6">Perguntas Sobre Psicopedagogia</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Esclarecemos as principais dúvidas sobre nosso atendimento psicopedagógico.
              </p>
              <a
                href="https://wa.me/5551992809471?text=Olá! Tenho uma dúvida sobre psicopedagogia."
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

      {/* CTA */}
      <section className="section-padding">
        <div className="container-wide text-center">
          <h2 className="text-foreground mb-6 animate-fade-in">
            Toda criança pode aprender
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up">
            Agende uma avaliação e descubra como podemos ajudar no desenvolvimento e na aprendizagem.
          </p>
          <a
            href="https://wa.me/5551992809471?text=Olá! Quero agendar uma avaliação psicopedagógica."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 btn-premium text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Calendar className="w-5 h-5" />
            Agendar Avaliação
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </Layout>
  );
}
