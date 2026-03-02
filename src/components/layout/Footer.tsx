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

// Defaults used when settings are not yet loaded
const defaults = {
  phone: "(51) 99280-9471",
  email: "centropsicoavaliar@gmail.com",
  address: "Rua João Salomoni, 650 - Vila Nova, Porto Alegre - RS",
  working_hours: "Seg-Sex: 8h às 20h | Sáb: 8h às 12h",
  business_name: "Psicoavaliar",
  instagram: "https://instagram.com/centropsicoavaliar",
  facebook: "https://facebook.com/centropsicoavaliar",
  linkedin: "https://linkedin.com/company/centropsicoavaliar",
};

function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/\D/g, "");
}

export function Footer() {
  const { data: allSettings } = useQuery({
    queryKey: ["site-settings-footer"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["general", "social", "whatsapp"]);
      if (error) return null;
      const map: Record<string, any> = {};
      data?.forEach((item: any) => { map[item.key] = item.value; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const general = allSettings?.general || {};
  const social = allSettings?.social || {};
  const whatsapp = allSettings?.whatsapp || {};

  const phone = general.phone || defaults.phone;
  const email = general.email || defaults.email;
  const address = general.address || defaults.address;
  const workingHours = general.working_hours || defaults.working_hours;
  const businessName = general.business_name || defaults.business_name;
  const isSchedulingEnabled = general.online_scheduling_enabled !== false;

  const instagramUrl = social.instagram || defaults.instagram;
  const facebookUrl = social.facebook || defaults.facebook;
  const linkedinUrl = social.linkedin || defaults.linkedin;

  const whatsappPhone = formatPhoneForWhatsApp(phone);
  const whatsappMessage = whatsapp.default_message || "Olá! Gostaria de agendar uma consulta.";

  const socialLinks = [
    { icon: Instagram, href: instagramUrl },
    { icon: Facebook, href: facebookUrl },
    { icon: Linkedin, href: linkedinUrl },
  ];

  // Split address for desktop two-line display
  const addressParts = address.split(" - ");
  const addressLine1 = addressParts[0] || address;
  const addressLine2 = addressParts.length > 1 ? addressParts.slice(1).join(" - ") : "";

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
                href={`https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`}
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
                <img src={logoImage} alt={businessName} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white">{businessName}</span>
                <span className="block text-xs text-white/60">Centro de Psicologia</span>
              </div>
            </div>
            <p className="text-sm text-white/70 mb-4 leading-relaxed">
              Cuidado humanizado e diagnóstico preciso para sua saúde mental.
            </p>
            
            {/* Social + Contact Compact */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex gap-2">
                {socialLinks.map((s, index) => (
                  <a
                    key={index}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <s.icon className="w-4 h-4 text-white" />
                  </a>
                ))}
              </div>
              <a href={`tel:+55${whatsappPhone}`} className="text-sm text-white/70 hover:text-white flex items-center gap-2">
                <Phone className="w-4 h-4" /> {phone}
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
                <p>{address}</p>
                <p className="mt-1">{workingHours}</p>
              </div>
            </div>
          </div>

          {/* Desktop: Full Grid */}
          <div className="hidden lg:grid grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                  <img src={logoImage} alt={businessName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-display font-bold text-xl text-white">{businessName}</span>
                  <span className="block text-xs text-white/60">Centro de Psicologia</span>
                </div>
              </Link>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                Cuidado humanizado, diagnóstico preciso.
              </p>
              <div className="flex gap-3">
                {socialLinks.map((s, index) => (
                  <a
                    key={index}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
                  >
                    <s.icon className="w-5 h-5 text-white" />
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
                    {addressLine1}
                    {addressLine2 && <><br />{addressLine2}</>}
                  </span>
                </li>
                <li>
                  <a
                    href={`https://wa.me/55${whatsappPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-accent" />
                    </div>
                    {phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-accent" />
                    </div>
                    {email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm text-white/70">
                    {workingHours}
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
              © {new Date().getFullYear()} {businessName}. Todos os direitos reservados.
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
