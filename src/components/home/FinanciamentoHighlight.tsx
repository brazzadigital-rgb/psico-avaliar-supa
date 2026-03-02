import { Link } from "react-router-dom";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";
import { Calculator, CreditCard, Clock, Shield, ArrowRight, Sparkles, BadgePercent } from "lucide-react";

const benefits = [
  { icon: Calculator, title: "Até 36x", subtitle: "Parcelamento flexível" },
  { icon: CreditCard, title: "Sem Cartão", subtitle: "Financiamento direto" },
  { icon: Clock, title: "24h", subtitle: "Análise rápida" },
  { icon: Shield, title: "Zero Burocracia", subtitle: "Processo simples" },
];

export function FinanciamentoHighlight() {
  return (
    <section className="relative py-20 md:py-28 lg:py-32 overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsla(45,80%,55%,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsla(142,76%,36%,0.2),transparent_60%)]" />

      {/* Animated floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-20 right-[10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, hsla(45, 80%, 55%, 0.4), transparent 70%)",
            animation: "float 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 left-[5%] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, hsla(168, 45%, 45%, 0.4), transparent 70%)",
            animation: "float 18s ease-in-out infinite",
            animationDelay: "-6s",
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full opacity-10 blur-2xl"
          style={{
            background: "radial-gradient(circle, hsla(0, 0%, 100%, 0.3), transparent 70%)",
            animation: "float 12s ease-in-out infinite",
            animationDelay: "-3s",
          }}
        />
      </div>

      {/* Mesh pattern */}
      <div className="hero-mesh opacity-20" />

      <div className="container-wide relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div>
            <ScrollAnimate animation="fade-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-6">
                <BadgePercent className="w-4 h-4 text-brand-gold" />
                <span>Carro-chefe PsicoAvaliar</span>
                <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              </div>

              <h2 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] leading-[1.1] mb-6">
                <span className="block">Financiamento</span>
                <span className="block mt-2">
                  <span className="relative inline-block">
                    <span className="text-gradient-animated">Próprio</span>
                  </span>{" "}
                  <span className="italic font-light text-white/90">sem burocracia</span>
                </span>
              </h2>

              <p className="text-lg md:text-xl text-white/75 leading-relaxed mb-8 max-w-lg">
                Parcele sua <strong className="text-white font-semibold">Avaliação Psicológica e Neuropsicológica</strong> em até 36 vezes, sem cartão de crédito. Extensão em até 60x para protocolos com maior nível de investimento.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/financiamento"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-primary font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] text-base"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Simular Financiamento</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/contato"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/25 text-white font-medium rounded-2xl hover:bg-white/20 transition-all duration-300 text-base"
                >
                  Fale Conosco
                </Link>
              </div>
            </ScrollAnimate>
          </div>

          {/* Right - Benefits Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {benefits.map((benefit, index) => (
              <ScrollAnimate key={index} animation="scale" delay={index * 0.1}>
                <div
                  className="financing-benefit-card group relative p-6 md:p-8 rounded-3xl backdrop-blur-md border border-white/15 cursor-default transition-all duration-500 hover:border-white/30 overflow-hidden"
                  style={{ background: "hsla(0, 0%, 100%, 0.08)" }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" 
                       style={{ background: "radial-gradient(circle at center, hsla(45, 80%, 55%, 0.1), transparent 70%)" }} 
                  />

                  <div className="relative z-10">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20 group-hover:shadow-lg"
                         style={{ boxShadow: "0 0 0 0 hsla(45, 80%, 55%, 0)" }}
                    >
                      <benefit.icon className="w-7 h-7 md:w-8 md:h-8 text-brand-gold transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-1 tracking-tight">
                      {benefit.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/60 font-medium">
                      {benefit.subtitle}
                    </p>
                  </div>
                </div>
              </ScrollAnimate>
            ))}
          </div>
        </div>

        {/* Bottom trust strip */}
        <ScrollAnimate animation="fade-up" delay={0.4}>
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-white/50 text-sm">
              {["Avaliação Psicológica", "Avaliação Neuropsicológica", "Avaliação Combinada"].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold/60" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimate>
      </div>
    </section>
  );
}
