import { Link } from "react-router-dom";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";
import {
  Calculator,
  CreditCard,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
  BadgePercent,
  CheckCircle2,
} from "lucide-react";

const benefits = [
  { icon: Calculator, title: "Até 36x", subtitle: "Parcelamento flexível", accent: "from-brand-gold/30 to-brand-gold/5" },
  { icon: CreditCard, title: "Sem Cartão", subtitle: "Financiamento direto", accent: "from-brand-teal/30 to-brand-teal/5" },
  { icon: Clock, title: "24h", subtitle: "Análise rápida", accent: "from-accent/30 to-accent/5" },
  { icon: Shield, title: "Sem Burocracia", subtitle: "Processo simples", accent: "from-brand-green-light/30 to-brand-green-light/5" },
];

const elegibleServices = [
  "Avaliação Psicológica",
  "Avaliação Neuropsicológica",
  "Avaliação Combinada (Psicológica + Neuropsicológica)",
];

export function FinanciamentoHighlight() {
  return (
    <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden bg-background">
      {/* Subtle background mesh */}
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      {/* Decorative blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-20 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }}
        />
      </div>

      <div className="container-wide relative z-10">
        {/* Top badge */}
        <ScrollAnimate animation="fade-up">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-6 backdrop-blur-sm">
              <BadgePercent className="w-4 h-4" />
              <span>Financiamento PsicoAvaliar</span>
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            </div>
            <h2 className="text-foreground mb-5">
              Financiamento{" "}
              <span className="text-gradient">Próprio</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Parcele sua avaliação em até <strong className="text-foreground">36 vezes</strong>, sem
              cartão de crédito e sem burocracia. Extensão em até 60x para protocolos com maior nível de investimento.
            </p>
          </div>
        </ScrollAnimate>

        {/* Benefits Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-20">
          {benefits.map((benefit, index) => (
            <ScrollAnimate key={index} animation="fade-up" delay={index * 0.08}>
              <div className="group relative card-premium p-6 md:p-8 text-center hover:border-primary/20 transition-all duration-500">
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-b ${benefit.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:from-primary/20 group-hover:to-accent/20">
                    <benefit.icon className="w-7 h-7 md:w-8 md:h-8 text-primary transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1 tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {benefit.subtitle}
                  </p>
                </div>
              </div>
            </ScrollAnimate>
          ))}
        </div>

        {/* Main content card */}
        <ScrollAnimate animation="fade-up" delay={0.2}>
          <div className="relative rounded-[2rem] overflow-hidden">
            {/* Card background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsla(45,80%,55%,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsla(142,76%,36%,0.15),transparent_50%)]" />
            <div className="hero-mesh opacity-15" />

            {/* Floating orbs inside card */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute -top-20 right-[10%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
                style={{
                  background: "radial-gradient(circle, hsla(45, 80%, 55%, 0.5), transparent 70%)",
                  animation: "float 15s ease-in-out infinite",
                }}
              />
              <div
                className="absolute -bottom-20 left-[5%] w-[300px] h-[300px] rounded-full opacity-15 blur-3xl"
                style={{
                  background: "radial-gradient(circle, hsla(168, 45%, 45%, 0.4), transparent 70%)",
                  animation: "float 18s ease-in-out infinite",
                  animationDelay: "-6s",
                }}
              />
            </div>

            <div className="relative z-10 p-8 md:p-12 lg:p-16">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* Left - Text */}
                <div>
                  <h3 className="text-white text-2xl sm:text-3xl md:text-4xl font-display font-bold leading-[1.15] mb-6">
                    Tornamos o diagnóstico{" "}
                    <span className="italic font-light text-white/90">acessível</span>{" "}
                    para você
                  </h3>
                  <p className="text-white/70 text-base md:text-lg leading-relaxed mb-8">
                    Sabemos que o investimento em uma avaliação completa pode ser significativo.
                    Por isso, oferecemos condições especiais de parcelamento direto, sem intermediários.
                  </p>

                  {/* Eligible services */}
                  <div className="space-y-3 mb-10">
                    <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-4">
                      Serviços elegíveis
                    </p>
                    {elegibleServices.map((service, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-brand-gold/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" />
                        </div>
                        <span className="text-white/80 text-sm md:text-base">{service}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/financiamento"
                      className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                    >
                      <Calculator className="w-5 h-5" />
                      <span>Simular Financiamento</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      to="/contato"
                      className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300"
                    >
                      Fale Conosco
                    </Link>
                  </div>
                </div>

                {/* Right - Steps */}
                <div className="space-y-6">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
                    Como funciona
                  </p>
                  {[
                    { step: "01", title: "Solicite uma Simulação", desc: "Preencha o formulário ou entre em contato pelo WhatsApp" },
                    { step: "02", title: "Análise e Proposta", desc: "Apresentamos as opções de parcelamento disponíveis" },
                    { step: "03", title: "Aprovação Rápida", desc: "Resposta em até 24h, sem burocracia" },
                    { step: "04", title: "Inicie sua Avaliação", desc: "Comece o processo com pagamento facilitado" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="group flex items-start gap-5 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:bg-brand-gold/20 group-hover:border-brand-gold/30">
                        <span className="text-sm font-bold text-brand-gold">{item.step}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-base mb-1">{item.title}</h4>
                        <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}
