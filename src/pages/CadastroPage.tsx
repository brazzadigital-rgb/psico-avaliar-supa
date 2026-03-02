import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, UserPlus, ArrowLeft, Loader2, CheckCircle2, Users, Calendar, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import authBg from "@/assets/auth-cadastro-bg.jpg";
import logoImage from "@/assets/logo-psicoavaliar-new.png";

const registerSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(255),
  phone: z.string().min(10, "WhatsApp inválido").max(20),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
  lgpdConsent: z.boolean().refine((val) => val === true, "Você deve aceitar os termos"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function CadastroPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    lgpdConsent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = () => {
    const pwd = formData.password;
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const getStrengthColor = (index: number) => {
    const s = passwordStrength();
    if (index >= s) return "bg-muted";
    if (s <= 2) return "bg-destructive";
    if (s <= 3) return "bg-yellow-500";
    return "bg-accent";
  };

  const getStrengthLabel = () => {
    const s = passwordStrength();
    if (s <= 2) return { text: "Fraca", color: "text-destructive" };
    if (s <= 3) return { text: "Média", color: "text-yellow-600" };
    return { text: "Forte", color: "text-accent" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast.error("Este e-mail já está cadastrado. Tente fazer login.");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      if (authData.user) {
        // Use secure RPC to link or create client (bypasses RLS safely)
        const { error: linkError } = await supabase.rpc("link_user_to_client", {
          _user_id: authData.user.id,
          _email: formData.email.trim().toLowerCase(),
          _full_name: formData.fullName,
          _phone: formData.phone,
        });

        if (linkError) {
          console.error("Error linking client:", linkError);
        }

        // Create user role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "client" as const,
        });

        if (roleError) {
          console.error("Error creating role:", roleError);
        }

        toast.success("Conta criada com sucesso! Redirecionando...");
        navigate("/cliente");
      }
    } catch (err) {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Calendar, text: "Agende consultas online 24h" },
    { icon: Users, text: "Equipe multidisciplinar" },
    { icon: ShieldCheck, text: "Seus dados protegidos (LGPD)" },
  ];

  const renderInput = (
    id: string,
    label: string,
    type: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void,
    delay: string,
    isPassword?: boolean,
    showPwd?: boolean,
    togglePwd?: () => void
  ) => (
    <div className="space-y-2 animate-slide-up" style={{ animationDelay: delay }}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} *
      </Label>
      <div className={`relative transition-all duration-300 ${focusedField === id ? "scale-[1.02]" : ""}`}>
        <Input
          id={id}
          type={isPassword ? (showPwd ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocusedField(id)}
          onBlur={() => setFocusedField(null)}
          className={`h-13 px-4 text-base rounded-xl border-2 transition-all duration-300 bg-card ${
            errors[id]
              ? "border-destructive focus:border-destructive"
              : focusedField === id
                ? "border-primary shadow-lg shadow-primary/10"
                : "border-border hover:border-primary/50"
          } ${isPassword ? "pr-12" : ""}`}
          disabled={loading}
        />
        {isPassword && togglePwd && (
          <button
            type="button"
            onClick={togglePwd}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === id ? "opacity-100" : ""}`} />
      </div>
      {errors[id] && (
        <p className="text-sm text-destructive animate-fade-in flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-destructive" />
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={authBg}
            alt="Clínica acolhedora"
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
                Comece sua jornada de bem-estar
              </h1>
              <p className="text-lg text-white/80 max-w-md leading-relaxed">
                Crie sua conta e tenha acesso a uma equipe de profissionais dedicados ao seu cuidado.
              </p>
            </div>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 animate-slide-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <benefit.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90">{benefit.text}</span>
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
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-background via-background to-muted/30 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          {/* Mobile back link */}
          <Link
            to="/"
            className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao site
          </Link>
          
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32">
              <img src={logoImage} alt="Psicoavaliar - Centro de Psicologia" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
              Criar sua conta
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Preencha os dados para começar
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderInput(
              "fullName",
              "Nome completo",
              "text",
              "Seu nome completo",
              formData.fullName,
              (value) => setFormData({ ...formData, fullName: value }),
              "0ms"
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderInput(
                "email",
                "E-mail",
                "email",
                "seu@email.com",
                formData.email,
                (value) => setFormData({ ...formData, email: value }),
                "50ms"
              )}
              {renderInput(
                "phone",
                "WhatsApp",
                "tel",
                "(51) 99999-9999",
                formData.phone,
                (value) => setFormData({ ...formData, phone: value }),
                "100ms"
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "150ms" }}>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha *
                </Label>
                <div className={`relative transition-all duration-300 ${focusedField === "password" ? "scale-[1.02]" : ""}`}>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className={`h-13 px-4 pr-12 text-base rounded-xl border-2 transition-all duration-300 bg-card ${
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
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === "password" ? "opacity-100" : ""}`} />
                </div>
                {formData.password && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${getStrengthColor(i)}`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${getStrengthLabel().color}`}>
                      Força: {getStrengthLabel().text}
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive animate-fade-in flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirmar senha *
                </Label>
                <div className={`relative transition-all duration-300 ${focusedField === "confirmPassword" ? "scale-[1.02]" : ""}`}>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className={`h-13 px-4 pr-12 text-base rounded-xl border-2 transition-all duration-300 bg-card ${
                      errors.confirmPassword
                        ? "border-destructive focus:border-destructive"
                        : focusedField === "confirmPassword"
                          ? "border-primary shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/50"
                    }`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 transition-opacity duration-300 pointer-events-none ${focusedField === "confirmPassword" ? "opacity-100" : ""}`} />
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-sm text-accent animate-fade-in flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Senhas coincidem
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive animate-fade-in flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* LGPD Consent */}
            <div className="flex items-start space-x-3 pt-3 animate-slide-up" style={{ animationDelay: "250ms" }}>
              <Checkbox
                id="lgpd"
                checked={formData.lgpdConsent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, lgpdConsent: checked as boolean })
                }
                disabled={loading}
                className="mt-1 h-5 w-5 rounded-md border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="space-y-1">
                <Label htmlFor="lgpd" className="text-sm font-normal leading-relaxed cursor-pointer text-foreground/80">
                  Li e concordo com a{" "}
                  <Link to="/politica-privacidade" className="text-primary hover:underline font-medium">
                    Política de Privacidade
                  </Link>{" "}
                  e{" "}
                  <Link to="/termos-uso" className="text-primary hover:underline font-medium">
                    Termos de Uso
                  </Link>
                  , autorizando o tratamento dos meus dados conforme a LGPD.
                </Label>
                {errors.lgpdConsent && (
                  <p className="text-sm text-destructive animate-fade-in">{errors.lgpdConsent}</p>
                )}
              </div>
            </div>

            <div className="pt-3 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-2xl btn-premium group relative overflow-hidden" 
                disabled={loading}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
                      Criar conta
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                Já tem uma conta?
              </span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center w-full h-13 px-6 text-base font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group"
            >
              <span className="mr-2">Fazer login</span>
              <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6 lg:hidden">
            © {new Date().getFullYear()} Psicoavaliar. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
