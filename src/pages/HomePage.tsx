import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/ui/section";
import { PremiumCard, IconBox, FeatureList } from "@/components/ui/premium-card";
import { ScrollAnimate } from "@/hooks/useScrollAnimation";
import heroBg from "@/assets/hero-bg.jpg";
import blogPsicoterapia from "@/assets/blog/psicoterapia-hero.jpg";
import blogAba from "@/assets/blog/terapia-aba-criancas.jpg";
import blogMindfulness from "@/assets/blog/ansiedade-meditacao.jpg";
import blogFamilia from "@/assets/blog/familia-apoio.jpg";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Brain, Heart, Users, Baby, GraduationCap, Stethoscope, CheckCircle2, ArrowRight, Calendar, Video, MapPin, Sparkles, Shield, Clock, Star, ArrowUpRight, BookOpen, MessageCircle } from "lucide-react";

// Map local images to slugs
const blogImageMap: Record<string, string> = {
  "beneficios-psicoterapia-saude-mental": blogPsicoterapia,
  "terapia-aba-beneficios-criancas-autismo": blogAba,
  "5-tecnicas-mindfulness-controlar-ansiedade": blogMindfulness,
  "importancia-apoio-familiar-saude-mental": blogFamilia
};
const services = [{
  icon: Brain,
  title: "Avaliação Psicológica e Neuropsicológica",
  description: "Diagnóstico preciso para TEA, TDAH, dificuldades de aprendizagem e outras condições.",
  href: "/especialidades/avaliacao-psicologica-e-neuropsicologica",
  featured: true
}, {
  icon: Heart,
  title: "Psicoterapia",
  description: "Atendimento humanizado para crianças, adolescentes e adultos com TCC e Psicanálise.",
  href: "/especialidades/psicoterapia"
}, {
  icon: Sparkles,
  title: "Terapia ABA",
  description: "Intervenção comportamental especializada para pessoas com TEA.",
  href: "/especialidades/terapia-aba"
}, {
  icon: Stethoscope,
  title: "Psiquiatria",
  description: "Acompanhamento psiquiátrico integrado à equipe terapêutica.",
  href: "/especialidades/psiquiatria"
}, {
  icon: GraduationCap,
  title: "Psicopedagogia",
  description: "Apoio para dificuldades escolares, dislexia, discalculia e mais.",
  href: "/especialidades/psicopedagogia"
}, {
  icon: Users,
  title: "Equipe Multidisciplinar",
  description: "Fonoaudiologia e outros profissionais para atendimento integrado.",
  href: "/especialidades"
}];
const steps = [{
  number: "01",
  title: "Agende sua Triagem",
  description: "Entre em contato pelo WhatsApp ou agende online. Nossa equipe vai entender suas necessidades.",
  icon: Calendar
}, {
  number: "02",
  title: "Avaliação Especializada",
  description: "Realizamos a avaliação com profissionais qualificados, presencial ou online.",
  icon: Brain
}, {
  number: "03",
  title: "Plano Personalizado",
  description: "Receba o diagnóstico e um plano de tratamento sob medida para você ou seu filho.",
  icon: Heart
}];
const audiences = [{
  icon: Baby,
  title: "Infantil",
  description: "A partir de 4 anos. Avaliação e terapia com abordagem lúdica e acolhedora.",
  gradient: "from-brand-green-vivid/20 to-brand-teal/20"
}, {
  icon: GraduationCap,
  title: "Adolescentes",
  description: "Apoio especializado para os desafios únicos dessa fase da vida.",
  gradient: "from-brand-teal/20 to-brand-green-light/20"
}, {
  icon: Users,
  title: "Adultos",
  description: "Psicoterapia, avaliação e acompanhamento para sua saúde mental.",
  gradient: "from-brand-green-light/20 to-brand-gold/20"
}];
const stats = [{
  value: "500+",
  label: "Pacientes atendidos"
}, {
  value: "98%",
  label: "Satisfação"
}, {
  value: "30",
  label: "Dias p/ laudo"
}, {
  value: "2023",
  label: "Fundação"
}];
const trustBadges = [{
  icon: Shield,
  text: "Equipe credenciada"
}, {
  icon: Clock,
  text: "Laudos em 30 dias"
}, {
  icon: CheckCircle2,
  text: "Financiamento próprio"
}];
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  category: {
    name: string;
    slug: string;
  } | null;
}
export default function HomePage() {
  const {
    data: blogPosts
  } = useQuery({
    queryKey: ["home-blog-posts"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("blog_posts").select("id, title, slug, excerpt, cover_image_url, published_at, category:blog_categories(name, slug)").eq("status", "published").order("published_at", {
        ascending: false
      }).limit(3);
      if (error) throw error;
      return data as BlogPost[];
    }
  });

  const { data: generalSettings } = useQuery({
    queryKey: ["site-settings-general"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "general")
        .single();
      if (error) return null;
      return data?.value as { online_scheduling_enabled?: boolean } | null;
    }
  });

  const isSchedulingEnabled = generalSettings?.online_scheduling_enabled !== false;
  const getPostImage = (post: BlogPost) => {
    if (blogImageMap[post.slug]) return blogImageMap[post.slug];
    if (post.cover_image_url && !post.cover_image_url.startsWith("/src/")) return post.cover_image_url;
    return null;
  };
  return <Layout>
      {/* ============================================ */}
      {/* HERO SECTION - Ultra Premium Modern         */}
      {/* ============================================ */}
      <section className="relative min-h-[100svh] flex items-center hero-premium -mt-20 overflow-hidden">
        {/* Background Image with Enhanced Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:scale-105"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-accent/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Animated mesh pattern - hidden on mobile */}
        <div className="hero-mesh opacity-40 hidden md:block" />
        
        {/* Morphing Blobs - Desktop only for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-gradient-to-br from-accent/30 to-brand-gold/20 blob-morph blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-gradient-to-tr from-brand-teal/25 to-accent/15 blob-morph blur-3xl" style={{ animationDelay: '-5s' }} />
          <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-gradient-to-r from-brand-gold/15 to-transparent blob-morph blur-2xl" style={{ animationDelay: '-10s' }} />
        </div>
        
        {/* Floating Particles - Desktop only */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
          <div className="particle particle-1 absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-white/40" />
          <div className="particle particle-2 absolute top-[25%] right-[20%] w-3 h-3 rounded-full bg-brand-gold/50" />
          <div className="particle particle-3 absolute bottom-[30%] left-[25%] w-2 h-2 rounded-full bg-accent/40" />
          <div className="particle particle-4 absolute top-[60%] right-[15%] w-4 h-4 rounded-full bg-white/20" />
        </div>
        
        {/* Radial glow effects - Desktop only */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-accent/20 via-transparent to-transparent blur-3xl hidden lg:block" />
        
        {/* Content */}
        <div className="container-wide relative z-10 py-20 md:py-32">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content - Spans 7 columns */}
            <div className="lg:col-span-7 max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              {/* Badge - Simplified on mobile */}
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/15 md:bg-white/10 md:backdrop-blur-md border border-white/20 text-white text-xs md:text-sm mb-5 md:mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75 hidden md:inline-flex"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold"></span>
                </span>
                <span className="font-medium">Centro de Excelência em Saúde Mental</span>
                <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold hidden sm:block" />
              </div>

              {/* Main Headline - Simpler animation on mobile */}
              <h1 className="text-white mb-5 md:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight tracking-tight overflow-visible">
                <span className="block animate-fade-in md:text-reveal" style={{ animationDelay: '0.1s' }}>
                  Cuidado{' '}
                  <span className="text-gradient-animated relative inline-block">
                    humanizado
                  </span>
                </span>
                <span className="block animate-fade-in md:text-reveal mt-2 md:mt-4 pb-1" style={{ animationDelay: '0.2s' }}>
                  diagnóstico{' '}
                  <span className="italic font-light text-white/90">preciso</span>
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-sm md:text-lg lg:text-xl text-white/80 mb-6 md:mb-10 leading-relaxed animate-fade-in max-w-xl mx-auto lg:mx-0" style={{ animationDelay: '0.3s' }}>
                Apoio especializado para <strong className="text-white font-medium">TEA, TDAH</strong> e saúde mental. 
                Do infantil ao adulto, presencial em Porto Alegre ou online para todo Brasil.
              </p>
              
              {/* CTA Buttons - Simplified on mobile */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 md:gap-4 mb-8 md:mb-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <a 
                  href="https://wa.me/5551992809471?text=Olá! Quero agendar uma avaliação." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-white text-primary font-semibold rounded-xl md:rounded-2xl group text-sm md:text-base shadow-lg md:shadow-xl md:btn-magnetic"
                >
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Agendar Avaliação</span>
                  <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </a>
                <Link 
                  to="/especialidades" 
                  className="inline-flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-white/15 md:bg-white/10 border border-white/25 text-white font-medium rounded-xl md:rounded-2xl md:backdrop-blur-sm hover:bg-white/20 transition-colors duration-300 text-sm md:text-base"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Conhecer Especialidades</span>
                </Link>
              </div>

              {/* Trust Badges - Simplified on mobile */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                {trustBadges.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 md:gap-2 text-white/80 text-xs md:text-sm">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-md md:rounded-lg bg-white/15 md:bg-white/10 flex items-center justify-center">
                      <item.icon className="w-3 h-3 md:w-4 md:h-4 text-brand-gold" />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Stats Cards with 3D effect - Spans 5 columns */}
            <div className="lg:col-span-5 hidden lg:block">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-4 rounded-3xl border border-white/10 glow-ring" />
                
                <div className="grid grid-cols-2 gap-4 relative">
                  {stats.map((stat, index) => (
                    <div 
                      key={index} 
                      className="card-entrance shine-effect glass-card p-6 xl:p-8 text-center rounded-2xl hover-lift border border-white/10 group cursor-default"
                      style={{ animationDelay: `${0.4 + index * 0.15}s` }}
                    >
                      <div className="stat-counter text-4xl xl:text-5xl font-display font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                        {stat.value}
                      </div>
                      <div className="text-xs xl:text-sm text-muted-foreground font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Stats Row - Simplified, no heavy effects */}
            <div className="lg:hidden grid grid-cols-4 gap-2 col-span-full">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="bg-white/80 p-2.5 text-center rounded-xl border border-white/20 animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.05}s` }}
                >
                  <div className="text-lg font-display font-bold text-primary mb-0.5">
                    {stat.value}
                  </div>
                  <div className="text-[8px] text-muted-foreground leading-tight font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator - Modern Design */}
        <div className="absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2">
          <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Scroll</span>
          <div className="scroll-indicator w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-white/60" />
          </div>
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS SECTION                        */}
      {/* ============================================ */}
      <Section variant="muted" size="md">
        <div className="container-wide">
          <ScrollAnimate animation="fade-up">
            <SectionHeader badge="Processo Simplificado" title="Como Funciona" description="Seu caminho para o cuidado em 3 passos simples" />
          </ScrollAnimate>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 pt-4 md:pt-6 pl-4 md:pl-6">
            {steps.map((step, index) => <ScrollAnimate key={index} animation="fade-up" delay={index * 0.15}>
                <div className="relative group">
                  {/* Connector Line */}
                  {index < steps.length - 1 && <div className="hidden md:block absolute top-16 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />}
                  
                  <PremiumCard padding="lg" className="relative z-10">
                    {/* Step Number */}
                    <div className="absolute -top-4 -left-4 md:-top-5 md:-left-5 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg z-20">
                      <span className="text-sm md:text-lg font-bold text-white">{step.number}</span>
                    </div>
                    
                    {/* Icon */}
                    <IconBox icon={step.icon} size="lg" className="mb-4 md:mb-6 mt-2 md:mt-4" />
                    
                    <h3 className="text-lg md:text-xl font-display font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                  </PremiumCard>
                </div>
              </ScrollAnimate>)}
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* SERVICES SECTION                            */}
      {/* ============================================ */}
      <Section>
        <div className="container-wide">
          <ScrollAnimate animation="fade-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10 md:mb-14">
              <div>
                <span className="text-accent font-medium text-xs md:text-sm tracking-wider uppercase mb-2 md:mb-4 block">
                  Áreas de Atuação
                </span>
                <h2 className="text-foreground text-2xl md:text-3xl lg:text-4xl">Nossas Especialidades</h2>
              </div>
              <Link to="/especialidades" className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors group text-sm">
                Ver todas
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollAnimate>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {services.map((service, index) => <ScrollAnimate key={index} animation="scale" delay={index * 0.1}>
                <Link to={service.href} className={`group block h-full ${service.featured ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                  <PremiumCard padding="md" className="h-full">
                    <IconBox icon={service.icon} size="md" className="mb-4 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent [&>svg]:group-hover:text-white" />
                    
                    <h3 className="text-base md:text-lg font-display font-semibold mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-primary font-medium text-sm">
                      <span className="group-hover:underline">Saiba mais</span>
                      <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </PremiumCard>
                </Link>
              </ScrollAnimate>)}
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* AUDIENCES SECTION                           */}
      {/* ============================================ */}
      <Section variant="gradient">
        <div className="container-wide relative z-10">
          <ScrollAnimate animation="fade-up">
            <SectionHeader badge="Atendimento Personalizado" title="Para Quem é o Atendimento" description="Acompanhamento especializado para todas as fases da vida" light />
          </ScrollAnimate>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {audiences.map((audience, index) => <ScrollAnimate key={index} animation="blur" delay={index * 0.15}>
                <div className={`relative p-8 lg:p-10 rounded-3xl bg-gradient-to-br ${audience.gradient} backdrop-blur-sm border border-white/10 group hover-lift h-full`}>
                  <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20">
                    <audience.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-semibold text-white mb-3">
                    {audience.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">{audience.description}</p>
                </div>
              </ScrollAnimate>)}
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* MODALITIES SECTION                          */}
      {/* ============================================ */}
      <Section variant="muted">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollAnimate animation="slide-right">
              <div>
                <SectionHeader badge="Flexibilidade" title="Atendimento Presencial e Online" description="Oferecemos flexibilidade para que você receba o cuidado que precisa, onde estiver. Nosso consultório está localizado em Porto Alegre, mas também atendemos pacientes de todo o Brasil e exterior via teleconsulta." align="left" />
                
                <div className="space-y-6">
                  {[{
                  icon: MapPin,
                  title: "Presencial",
                  description: "Rua João Salomoni, 650 - Vila Nova, Porto Alegre"
                }, {
                  icon: Video,
                  title: "Online",
                  description: "Atendimento por videoconferência para todo o Brasil"
                }].map((item, index) => <div key={index} className="flex items-start gap-5 group">
                      <IconBox icon={item.icon} size="md" className="flex-shrink-0" />
                      <div>
                        <h4 className="font-display font-semibold text-lg mb-1">{item.title}</h4>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>)}
                </div>
              </div>
            </ScrollAnimate>

            {/* Special Conditions Card */}
            <ScrollAnimate animation="slide-left" delay={0.2}>
              <PremiumCard padding="lg" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-accent/20 to-transparent rounded-bl-[100px]" />
                
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    Condições Especiais
                  </div>
                  
                  <h3 className="text-2xl font-display font-semibold mb-8">
                    Tornamos o tratamento acessível
                  </h3>
                  
                  <div className="space-y-6 mb-10">
                    {[{
                    title: "Planos de Assinatura",
                    description: "Sessões semanais com valores diferenciados"
                  }, {
                    title: "Financiamento Próprio",
                    description: "Parcelamento para avaliações psicológicas"
                  }].map((item, index) => <div key={index} className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>)}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="btn-premium text-white rounded-full flex-1">
                      <Link to="/assinaturas">Ver Planos</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-full flex-1 border-2">
                      <Link to="/financiamento">Financiamento</Link>
                    </Button>
                  </div>
                </div>
              </PremiumCard>
            </ScrollAnimate>
          </div>
        </div>
      </Section>

      {/* ============================================ */}
      {/* BLOG SECTION                                */}
      {/* ============================================ */}
      {blogPosts && blogPosts.length > 0 && <Section>
          <div className="container-wide">
            <ScrollAnimate animation="fade-up">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
                <div>
                  <span className="text-accent font-medium text-sm tracking-wider uppercase mb-4 block">
                    Blog & Artigos
                  </span>
                  <h2 className="text-foreground">Conteúdo para você</h2>
                  <p className="text-muted-foreground mt-2 max-w-xl">
                    Artigos sobre saúde mental, desenvolvimento infantil e bem-estar
                  </p>
                </div>
                <Link to="/blog" className="inline-flex items-center gap-2 text-primary font-medium hover:text-accent transition-colors group">
                  Ver todos os artigos
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollAnimate>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => {
            const imageUrl = getPostImage(post);
            return <ScrollAnimate key={post.id} animation="fade-up" delay={index * 0.1}>
                    <article className="group h-full">
                      <PremiumCard padding="sm" className="overflow-hidden h-full flex flex-col">
                        <Link to={`/blog/${post.slug}`} className="block">
                          {imageUrl ? <div className="aspect-[16/10] overflow-hidden rounded-t-2xl -m-1.5 mb-0">
                              <img src={imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            </div> : <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center rounded-t-2xl -m-1.5 mb-0">
                              <BookOpen className="w-12 h-12 text-primary/30" />
                            </div>}
                        </Link>
                        <div className="p-5 flex-1 flex flex-col">
                          {post.category && <Badge variant="secondary" className="mb-3 w-fit">
                              {post.category.name}
                            </Badge>}
                          <h3 className="font-display font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                          </h3>
                          {post.excerpt && <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                              {post.excerpt}
                            </p>}
                          <div className="flex items-center justify-between pt-4 border-t mt-auto">
                            {post.published_at && <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(post.published_at), "dd MMM yyyy", {
                          locale: ptBR
                        })}
                              </span>}
                            <Link to={`/blog/${post.slug}`} className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all">
                              Ler <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </PremiumCard>
                    </article>
                  </ScrollAnimate>;
          })}
            </div>
          </div>
        </Section>}

      {/* ============================================ */}
      {/* FINAL CTA SECTION                           */}
      {/* ============================================ */}
      <Section variant="gradient" size="lg">
        <div className="container-narrow relative z-10 text-center">
          <ScrollAnimate animation="fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm mb-8">
              <Heart className="w-4 h-4" />
              Comece sua jornada
            </div>
            
            <h2 className="text-white mb-6">
              Dê o Primeiro Passo para sua Saúde Mental
            </h2>
            
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
              Nossa equipe está pronta para acolher você ou seu filho com o cuidado e atenção que vocês merecem.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://wa.me/5551992809471?text=Olá! Gostaria de agendar uma consulta." target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-primary font-semibold rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl group">
                <MessageCircle className="w-5 h-5" />
                Falar pelo WhatsApp
                <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>
              {isSchedulingEnabled && (
                <Link to="/agendar" className="inline-flex items-center gap-3 px-10 py-5 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300">
                  Agendar Online
                </Link>
              )}
            </div>
          </ScrollAnimate>
        </div>
      </Section>
    </Layout>;
}