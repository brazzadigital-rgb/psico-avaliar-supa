import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Mail, CheckCircle2, KeyRound, Shield } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import authBg from "@/assets/auth-recuperar-bg.jpg";
import logoImage from "@/assets/logo-psicoavaliar-new.png";

const emailSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        }
      );

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("E-mail enviado com sucesso!");
    } catch (err) {
      toast.error("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: KeyRound, text: "Link seguro de recuperação" },
    { icon: Shield, text: "Processo protegido e criptografado" },
    { icon: Mail, text: "Instruções enviadas por e-mail" },
  ];

  // Success state
  if (sent) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={authBg}
              alt="Jardim zen"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/60" />
          </div>
          <div className="floating-shape floating-shape-1" />
          <div className="floating-shape floating-shape-2" />
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
            <div className="space-y-6 text-center animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto border border-white/30">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight">
                E-mail enviado!
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Verifique sua caixa de entrada para redefinir sua senha.
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side - Success Content */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-muted/30">
          <div className="w-full max-w-md text-center">
            <div className="lg:hidden mb-8 animate-fade-in-scale">
              <div className="w-20 h-20 rounded-full bg-accent/10 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">
                E-mail enviado!
              </h2>
            </div>
            
            <div className="hidden lg:block mb-8 animate-fade-in-scale">
              <div className="w-20 h-20 rounded-full bg-accent/10 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Verifique seu e-mail
              </h2>
            </div>
            
            <div className="space-y-4 animate-slide-up">
              <p className="text-muted-foreground">
                Se existe uma conta com o e-mail
              </p>
              <p className="font-semibold text-foreground text-lg bg-muted/50 rounded-xl py-3 px-4">
                {email}
              </p>
              <p className="text-muted-foreground">
                você receberá um link para redefinir sua senha.
              </p>
              
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  💡 Verifique também a pasta de <strong>spam</strong>. O link expira em 1 hora.
                </p>
              </div>
            </div>
            
            <div className="space-y-3 mt-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <Button
                variant="outline"
                className="w-full h-13 rounded-2xl border-2 hover:bg-muted/50"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Enviar novamente
              </Button>
              <Button asChild className="w-full h-14 rounded-2xl btn-premium">
                <Link to="/login">Voltar ao login</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={authBg}
            alt="Jardim zen"
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
          <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
          
          <div className="space-y-8">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight">
                Esqueceu sua senha?
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Não se preocupe! Enviaremos um link seguro para você criar uma nova senha.
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
            to="/login"
            className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao login
          </Link>
          
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-32 h-32 sm:w-36 sm:h-36">
              <img src={logoImage} alt="Psicoavaliar - Centro de Psicologia" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-foreground mb-2">
              Recuperar senha
            </h2>
            <p className="text-muted-foreground">
              Digite seu e-mail cadastrado
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
                    error 
                      ? "border-destructive focus:border-destructive" 
                      : focusedField === "email"
                        ? "border-primary shadow-lg shadow-primary/10"
                        : "border-border hover:border-primary/50"
                  }`}
                  disabled={loading}
                />
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === "email" ? "opacity-100" : ""}`} />
              </div>
              {error && (
                <p className="text-sm text-destructive animate-fade-in flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-destructive" />
                  {error}
                </p>
              )}
            </div>

            <div className="pt-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl btn-premium group relative overflow-hidden" 
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 transition-transform group-hover:scale-110" />
                      Enviar link de recuperação
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                Lembrou a senha?
              </span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center w-full h-14 px-6 text-base font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group"
            >
              <span className="mr-2">Fazer login</span>
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
