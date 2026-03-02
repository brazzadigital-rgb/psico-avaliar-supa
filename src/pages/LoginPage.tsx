import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2, Shield, Clock, Heart } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import authBg from "@/assets/auth-login-bg.jpg";
import logoImage from "@/assets/logo-psicoavaliar-new.png";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Credenciais inválidas. Verifique seu e-mail e senha.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("E-mail não verificado. Por favor, verifique sua caixa de entrada.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        let role: string | null = null;

        try {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .maybeSingle();

          if (roleError) throw roleError;
          role = roleData?.role ?? null;
        } catch {
          role = null;
        }

        toast.success("Login realizado com sucesso!");

        if (role === "client") {
          navigate("/cliente");
        } else if (role === "admin" || role === "receptionist" || role === "professional") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Shield, text: "Seus dados protegidos com segurança" },
    { icon: Clock, text: "Agende consultas 24h por dia" },
    { icon: Heart, text: "Acompanhamento personalizado" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={authBg}
            alt="Ambiente acolhedor"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60" />
        </div>
        
        {/* Floating shapes */}
        <div className="floating-shape floating-shape-1" />
        <div className="floating-shape floating-shape-2" />
        <div className="floating-shape floating-shape-3" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
          
          <div className="space-y-8">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Entre na sua conta para acessar seu histórico de consultas e agendar novos atendimentos.
              </p>
            </div>
            
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.
          </p>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="w-full max-w-md">
          {/* Mobile back link */}
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
          
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-32 h-32 sm:w-36 sm:h-36">
              <img src={logoImage} alt="Psicoavaliar - Centro de Psicologia" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Entrar na conta
            </h2>
            <p className="text-muted-foreground">
              Digite seus dados para acessar
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </Label>
              <div className={`relative group transition-all duration-300 ${focusedField === "email" ? "scale-[1.02]" : ""}`}>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={`h-14 px-5 text-base rounded-2xl border-2 transition-all duration-300 bg-card ${
                    errors.email 
                      ? "border-destructive focus:border-destructive" 
                      : focusedField === "email"
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50"
                  }`}
                  disabled={loading}
                />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === "email" ? "opacity-100" : ""}`} />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive animate-fade-in flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <Link
                  to="/recuperar-senha"
                  className="text-sm text-primary hover:text-accent transition-colors font-medium"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className={`relative group transition-all duration-300 ${focusedField === "password" ? "scale-[1.02]" : ""}`}>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`h-14 px-5 pr-12 text-base rounded-2xl border-2 transition-all duration-300 bg-card ${
                    errors.password 
                      ? "border-destructive focus:border-destructive" 
                      : focusedField === "password"
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50"
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === "password" ? "opacity-100" : ""}`} />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive animate-fade-in flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="pt-2 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl btn-premium group relative overflow-hidden" 
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      Entrar
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                Novo por aqui?
              </span>
            </div>
          </div>

          {/* Register link */}
          <div className="text-center animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Link 
              to="/cadastro" 
              className="inline-flex items-center justify-center w-full h-14 px-6 text-base font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group"
            >
              <span className="mr-2">Criar uma conta</span>
              <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8 lg:hidden">
            © {new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
