import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Linkedin, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo-psicoavaliar.png";

const footerLinks = {
  services: [
    { name: "Avaliação Psicológica", href: "/especialidades/avaliacao-psicologica-e-neuropsicologica" },
    { name: "Psicoterapia", href: "/especialidades/psicoterapia" },
    { name: "Terapia ABA", href: "/especialidades/terapia-aba" },
    { name: "Psiquiatria", href: "/especialidades/psiquiatria" },
    { name: "Psicopedagogia", href: "/especialidades/psicopedagogia" },
  ],
  company: [
    { name: "Quem Somos", href: "/quem-somos" },
    { name: "Blog", href: "/blog" },
    { name: "FAQ", href: "/faq" },
    { name: "Contato", href: "/contato" },
  ],
  legal: [
    { name: "Política de Privacidade", href: "/politica-de-privacidade" },
    { name: "Termos de Uso", href: "/termos-de-uso" },
  ],
};

export function Footer() {
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
    },
  });
  const isSchedulingEnabled = generalSettings?.online_scheduling_enabled !== false;

  return (
    <footer className="relative bg-primary overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="container-wide relative z-10">
        {/* Top CTA Section */}
        <div className="py-12 md:py-16 border-b border-white/10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
            <div className="text-center lg:text-left max-w-xl">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-white mb-2">
                Pronto para cuidar da sua saúde mental?
              </h3>
              <p className="text-sm md:text-base text-white/70">
                Agende sua consulta e dê o primeiro passo.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="https://wa.me/5551992809471?text=Olá! Gostaria de agendar uma consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary font-medium rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-xl text-sm"
              >
                WhatsApp
                <ArrowUpRight className="w-4 h-4" />
              </a>
              {isSchedulingEnabled && (
                <Link
                  to="/agendar"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white font-medium rounded-full hover:bg-white/10 transition-all duration-300 text-sm"
                >
                  Agendar Online
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Footer - Responsive Grid */}
        <div className="py-10 md:py-16">
          {/* Mobile: Brand + Contact Row */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img src={logoImage} alt="Psicoavaliar" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white">Psicoavaliar</span>
                <span className="block text-xs text-white/60">Centro de Psicologia</span>
              </div>
            </div>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Cuidado humanizado e diagnóstico preciso para sua saúde mental.
            </p>
            
            {/* Social + Contact Compact */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex gap-2">
                {[
                  { icon: Instagram, href: "https://instagram.com/centropsicoavaliar" },
                  { icon: Facebook, href: "https://facebook.com/centropsicoavaliar" },
                  { icon: Linkedin, href: "https://linkedin.com/company/centropsicoavaliar" },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <social.icon className="w-4 h-4 text-white" />
                  </a>
                ))}
              </div>
              <a href="tel:+5551992809471" className="text-sm text-white/70 hover:text-white flex items-center gap-2">
                <Phone className="w-4 h-4" /> (51) 99280-9471
              </a>
            </div>
          </div>

          {/* Mobile: Links Grid 2x2 */}
          <div className="grid grid-cols-2 gap-6 lg:hidden mb-8">
            <div>
              <h4 className="font-display text-sm font-bold text-white mb-3">Especialidades</h4>
              <ul className="space-y-2">
                {footerLinks.services.slice(0, 4).map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-xs text-white/70 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-white mb-3">Institucional</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-xs text-white/70 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-xs text-white/70 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: Address Compact */}
          <div className="lg:hidden p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/70">
                <p className="font-medium text-white mb-1">Endereço</p>
                <p>Rua João Salomoni, 650 - Vila Nova, Porto Alegre - RS</p>
                <p className="mt-1">Seg-Sex: 8h-20h | Sáb: 8h-12h</p>
              </div>
            </div>
          </div>

          {/* Desktop: Full Grid */}
          <div className="hidden lg:grid grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  <img src={logoImage} alt="Psicoavaliar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-display font-bold text-xl text-white">Psicoavaliar</span>
                  <span className="block text-xs text-white/60">Centro de Psicologia</span>
                </div>
              </Link>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                Cuidado humanizado, diagnóstico preciso.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Instagram, href: "https://instagram.com/centropsicoavaliar" },
                  { icon: Facebook, href: "https://facebook.com/centropsicoavaliar" },
                  { icon: Linkedin, href: "https://linkedin.com/company/centropsicoavaliar" },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
                  >
                    <social.icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-display text-lg font-bold text-white mb-6">Especialidades</h4>
              <ul className="space-y-3">
                {footerLinks.services.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company + Legal */}
            <div>
              <h4 className="font-display text-lg font-bold text-white mb-6">Institucional</h4>
              <ul className="space-y-3 mb-8">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{link.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <h4 className="font-display text-lg font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display text-lg font-bold text-white mb-6">Contato</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm text-white/70 leading-relaxed">
                    Rua João Salomoni, 650<br />
                    Vila Nova, Porto Alegre - RS
                  </span>
                </li>
                <li>
                  <a
                    href="https://wa.me/5551992809471"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-accent" />
                    </div>
                    (51) 99280-9471
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:centropsicoavaliar@gmail.com"
                    className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-accent" />
                    </div>
                    centropsicoavaliar@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm text-white/70">
                    Seg-Sex: 8h às 20h<br />
                    Sábado: 8h às 12h
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="py-4 md:py-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
            <p className="text-xs md:text-sm text-white/50 text-center md:text-left">
              © {new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.
            </p>
            <p className="text-[10px] md:text-xs text-white/40 text-center md:text-right">
              Emergência: <a href="tel:188" className="underline hover:text-white/60">CVV 188</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
