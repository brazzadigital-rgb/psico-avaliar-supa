import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, User, LogIn, UserPlus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo-psicoavaliar.png";
import mobileMenuBg from "@/assets/mobile-menu-bg.jpg";

const navigation: Array<{ name: string; href: string; children?: Array<{ name: string; href: string }> }> = [
  { name: "Início", href: "/" },
  { name: "Quem Somos", href: "/quem-somos" },
  { name: "Especialidades", href: "/especialidades" },
  { name: "Blog", href: "/blog" },
  { 
    name: "Assinaturas", 
    href: "/assinaturas",
    children: [
      { name: "Planos de Assinatura", href: "/assinaturas" },
      { name: "Financiamento", href: "/financiamento" },
    ]
  },
  { name: "Contato", href: "/contato" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, signOut, userRole } = useAuth();
  const isAdmin = userRole === "admin" || userRole === "receptionist" || userRole === "professional";
  const solidHeader = scrolled || location.pathname !== "/";

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300",
          solidHeader ? "glass-effect py-2 shadow-lg" : "bg-transparent py-4"
        )}
        style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
      >
        <nav className="container-wide flex items-center justify-between py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className={cn(
                "w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105 overflow-hidden",
                solidHeader
                  ? "bg-white shadow-lg"
                  : "bg-white/10 backdrop-blur-sm border border-white/20"
              )}
            >
              <img
                src={logoImage}
                alt="Psicoavaliar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span
                className={cn(
                  "font-display font-bold text-base sm:text-lg md:text-xl transition-colors block leading-tight",
                  solidHeader ? "text-primary" : "text-white"
                )}
              >
                Psicoavaliar
              </span>
              <span
                className={cn(
                  "text-[9px] sm:text-[10px] md:text-xs font-medium transition-colors hidden sm:block",
                  solidHeader ? "text-muted-foreground" : "text-white/70"
                )}
              >
                Centro de Psicologia
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-full transition-all",
                solidHeader ? "bg-muted/50" : "bg-white/5 backdrop-blur-sm"
              )}
            >
              {navigation.map((item) => 
                item.children ? (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full inline-flex items-center gap-1 outline-none",
                          isActive(item.href) || item.children.some(c => isActive(c.href))
                            ? solidHeader
                              ? "text-white bg-primary shadow-md"
                              : "text-primary bg-white shadow-md"
                            : solidHeader
                              ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                              : "text-white/80 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {item.name}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48 bg-popover z-50">
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link to={child.href} className="w-full">
                            {child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-full",
                      isActive(item.href)
                        ? solidHeader
                          ? "text-white bg-primary shadow-md"
                          : "text-primary bg-white shadow-md"
                        : solidHeader
                          ? "text-foreground/70 hover:text-foreground hover:bg-muted"
                          : "text-white/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Client Area */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant={solidHeader ? "outline" : "ghost"} 
                    size="sm" 
                    className={cn(
                      "rounded-full gap-2",
                      !solidHeader && "text-white border-white/20 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      solidHeader ? "bg-primary/10" : "bg-white/20"
                    )}>
                      <User className={cn("w-3.5 h-3.5", solidHeader ? "text-primary" : "text-white")} />
                    </div>
                    <span>Conta</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={isAdmin ? "/admin" : "/cliente"} className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {isAdmin ? "Painel Admin" : "Minha Área"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className={cn(
                "flex items-center rounded-full border",
                solidHeader ? "border-border" : "border-white/20"
              )}>
                <Link 
                  to="/login"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-l-full",
                    solidHeader 
                      ? "text-foreground/70 hover:text-primary hover:bg-primary/5" 
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </Link>
                <div className={cn("w-px h-5", solidHeader ? "bg-border" : "bg-white/20")} />
                <Link
                  to="/cadastro"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-r-full",
                    solidHeader 
                      ? "text-foreground/70 hover:text-primary hover:bg-primary/5" 
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Criar Conta</span>
                </Link>
              </div>
            )}

            {/* CTA Button */}
            {isSchedulingEnabled && (
              <Button
                asChild
                className={cn(
                  "rounded-full px-6 font-medium transition-all duration-500 shadow-lg",
                  solidHeader
                    ? "btn-premium text-white"
                    : "bg-white text-primary hover:bg-white/90"
                )}
              >
                <Link to="/agendar">Agendar Consulta</Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {solidHeader && !user && (
              <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link to="/login">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
            )}
            <button
              type="button"
              className={cn(
                "p-2.5 rounded-xl transition-all",
                solidHeader ? "text-foreground hover:bg-muted" : "text-white hover:bg-white/10"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation - Outside header for proper z-index */}
      <div 
        className={cn(
          "lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 z-[100]",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          "lg:hidden fixed top-0 right-0 h-full w-[85%] max-w-sm z-[101] transition-transform duration-300 ease-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(148 96% 12%) 0%, hsl(168 45% 35%) 50%, hsl(142 76% 30%) 100%)' }}>
          {/* Background Image */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${mobileMenuBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsla(148, 96%, 12%, 0.6) 0%, hsla(168, 45%, 25%, 0.5) 50%, hsla(142, 76%, 20%, 0.4) 100%)' }} />
          {/* Header do Menu */}
          <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                <img src={logoImage} alt="Psicoavaliar" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-display font-bold text-lg">Psicoavaliar</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="relative z-10 flex-1 overflow-y-auto p-5 space-y-1.5">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 py-3.5 px-4 rounded-xl text-base font-medium transition-all",
                    isActive(item.href)
                      ? "bg-white text-primary shadow-lg"
                      : "text-white/90 hover:bg-white/10"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    isActive(item.href) ? "bg-primary" : "bg-white/40"
                  )} />
                  {item.name}
                </Link>
                {item.children?.map((child) => (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 py-2.5 px-4 pl-10 rounded-xl text-sm font-medium transition-all",
                      isActive(child.href)
                        ? "bg-white text-primary shadow-lg"
                        : "text-white/70 hover:bg-white/10"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isActive(child.href) ? "bg-primary" : "bg-white/30"
                    )} />
                    {child.name}
                  </Link>
                ))}
              </div>
            ))}
            
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              {user ? (
                <div className="p-4 rounded-xl bg-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">{user.email}</p>
                      <p className="text-white/60 text-xs">Conectado</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild size="sm" className="rounded-lg bg-white/20 text-white border-0 hover:bg-white/30">
                      <Link to={isAdmin ? "/admin" : "/cliente"} onClick={() => setMobileMenuOpen(false)}>
                        {isAdmin ? "Painel" : "Minha Área"}
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      className="rounded-lg bg-white/10 text-white/80 border-0 hover:bg-white/20"
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    >
                      Sair
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button asChild className="w-full rounded-xl py-5 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="w-4 h-4 mr-2" />
                      Entrar
                    </Link>
                  </Button>
                  <Button asChild className="w-full rounded-xl py-5 bg-white/20 text-white hover:bg-white/30 font-semibold border border-white/30">
                    <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Conta
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer do Menu */}
          <div className="relative z-10 p-5 border-t border-white/10 bg-black/10">
            <a
              href="tel:+5551992809471"
              className="flex items-center justify-center gap-2 py-2.5 mb-3 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm"
            >
              <Phone className="w-4 h-4" />
              <span>(51) 99280-9471</span>
            </a>
            {isSchedulingEnabled && (
              <Button asChild className="w-full rounded-xl py-5 bg-accent text-white hover:bg-accent/90 font-semibold">
                <Link to="/agendar" onClick={() => setMobileMenuOpen(false)}>
                  Agendar Consulta
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
