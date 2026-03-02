import { Link } from "react-router-dom";
import { Layout } from "@/components/layout";
import specialtyImg from "@/assets/specialty-aba.jpg";
import {
  Sparkles,
  CheckCircle2,
  Target,
  Heart,
  Users,
  ArrowRight,
  Calendar,
  MessageCircle,
  ChevronRight,
  Puzzle,
  Trophy,
  BookOpen,
} from "lucide-react";

const whatIsABA = [
  {
    icon: Target,
    title: "Baseada em Evidências",
    description: "A ABA é a intervenção com maior suporte científico para o tratamento do TEA.",
  },
  {
    icon: Puzzle,
    title: "Personalizada",
    description: "Cada plano é desenvolvido individualmente, respeitando as características únicas de cada pessoa.",
  },
  {
    icon: Trophy,
    title: "Foco em Resultados",
    description: "Trabalha habilidades funcionais que fazem diferença real no dia a dia.",
  },
  {
    icon: Heart,
    title: "Abordagem Positiva",
    description: "Utiliza reforço positivo para motivar e ensinar novos comportamentos.",
  },
];

const areas = [
  "Comunicação verbal e não-verbal",
  "Habilidades sociais e interação",
  "Autonomia e autocuidado",
  "Comportamentos adaptativos",
  "Redução de comportamentos desafiadores",
  "Prontidão escolar e acadêmica",
  "Habilidades de brincar",
  "Regulação emocional",
];

const process = [
  {
    number: "01",
    title: "Avaliação Inicial",
    description: "Avaliação comportamental completa para identificar habilidades, desafios e definir objetivos.",
  },
  {
    number: "02",
    title: "Plano Individualizado",
    description: "Desenvolvimento de um programa personalizado com metas específicas e mensuráveis.",
  },
  {
    number: "03",
    title: "Intervenção Intensiva",
    description: "Sessões regulares com aplicação de técnicas baseadas em evidências.",
  },
  {
    number: "04",
    title: "Acompanhamento",
    description: "Monitoramento contínuo do progresso e ajustes no plano conforme necessário.",
  },
];

const faqs = [
  {
    question: "A partir de que idade pode iniciar a Terapia ABA?",
    answer: "A intervenção precoce é ideal, podendo iniciar a partir dos 2 anos. Quanto mais cedo o início, melhores os resultados. Porém, adolescentes e adultos também podem se beneficiar.",
  },
  {
    question: "Quantas horas por semana são recomendadas?",
    answer: "A literatura recomenda entre 15 a 40 horas semanais para melhores resultados. Porém, adaptamos a intensidade conforme a realidade de cada família e as necessidades individuais.",
  },
  {
    question: "Os pais participam do tratamento?",
    answer: "Sim! O envolvimento da família é fundamental. Oferecemos orientação e treinamento para que os pais possam aplicar estratégias em casa e no dia a dia.",
  },
];

export default function TerapiaABAPage() {
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
                <span className="text-white">Terapia ABA</span>
              </nav>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                Especializado em TEA
              </div>

              <h1 className="text-white mb-6">
                Terapia <span className="text-gradient-animated">ABA</span> para Autismo
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Análise do Comportamento Aplicada (ABA): a intervenção com maior evidência científica para o desenvolvimento de pessoas com Transtorno do Espectro Autista.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="https://wa.me/5551992809471?text=Olá! Gostaria de saber mais sobre a Terapia ABA."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Avaliação
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="https://wa.me/5551992809471?text=Olá! Tenho dúvidas sobre Terapia ABA."
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
                  alt="Terapia ABA"
                  className="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is ABA */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="text-center mb-16 animate-fade-in">
            <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
              O Que é ABA?
            </span>
            <h2 className="text-foreground mb-4">Análise do Comportamento Aplicada</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A ABA é uma ciência que aplica princípios do comportamento para ensinar habilidades importantes e reduzir comportamentos que interferem na qualidade de vida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whatIsABA.map((item, index) => (
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

      {/* Areas of Work */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Áreas Trabalhadas
              </span>
              <h2 className="text-foreground mb-6">O Que Desenvolvemos</h2>
              <p className="text-lg text-muted-foreground mb-10">
                A Terapia ABA trabalha diversas áreas do desenvolvimento, sempre respeitando o ritmo e as necessidades individuais.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {areas.map((area, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-fade-in-scale" style={{ animationDelay: "0.2s" }}>
              <div className="card-premium p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-[100px]" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                    <Users className="w-4 h-4" />
                    Orientação Familiar
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-4">
                    Família como Parceira
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Oferecemos treinamento e orientação para pais e cuidadores, permitindo que as estratégias sejam aplicadas no ambiente familiar e potencializando os resultados da terapia.
                  </p>
                  <a
                    href="https://wa.me/5551992809471?text=Olá! Quero saber mais sobre a orientação familiar na ABA."
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((step, index) => (
              <div
                key={index}
                className="relative p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-brand-gold flex items-center justify-center shadow-lg">
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

      {/* FAQ */}
      <section className="section-padding bg-mesh">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="animate-fade-in">
              <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                Dúvidas Frequentes
              </span>
              <h2 className="text-foreground mb-6">Perguntas Sobre ABA</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Esclarecemos as principais dúvidas sobre a Terapia ABA e nosso atendimento.
              </p>
              <a
                href="https://wa.me/5551992809471?text=Olá! Tenho uma dúvida sobre Terapia ABA."
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
            Cada passo importa
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up">
            Inicie o acompanhamento com nossa equipe especializada em ABA e veja o potencial do seu filho florescer.
          </p>
          <a
            href="https://wa.me/5551992809471?text=Olá! Quero iniciar a Terapia ABA."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 btn-premium text-white font-semibold rounded-full hover:scale-105 transition-all duration-300 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Calendar className="w-5 h-5" />
            Agendar Avaliação Inicial
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </Layout>
  );
}
