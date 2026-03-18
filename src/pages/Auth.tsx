import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Mail, Lock, User, Building2, AlertCircle, Loader2, Phone } from "lucide-react";
import { PasswordRequirements, allPasswordRulesMet } from "@/components/auth/PasswordRequirements";
import logoImg from "@/assets/logo-gerenciar-frotas.png";
import { toast } from "sonner";
import { z } from "zod";
import { 
  validateCNPJ, 
  formatCNPJ, 
  cleanCNPJ,
  validatePhone,
  formatPhone,
  cleanPhone 
} from "@/lib/validators";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const passwordSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[!@#$%&*]/, "Senha deve conter pelo menos um caractere especial (!@#$%&*)");

const signupSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  organizationName: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres").max(100, "Nome da empresa muito longo"),
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .refine((val) => validateCNPJ(val), "CNPJ inválido"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .refine((val) => validatePhone(val), "Número de WhatsApp inválido"),
  email: z.string().email("Email inválido"),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cnpjChecking, setCnpjChecking] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { error } = await signIn(validated.email, validated.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Por favor, confirme seu email antes de fazer login");
        } else {
          // Log detailed error in dev mode only, show generic message to user
          if (import.meta.env.DEV) {
            console.error("Auth error:", error);
          }
          toast.error("Erro ao processar sua solicitação. Tente novamente.");
        }
      } else {
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check if CNPJ already exists using SECURITY DEFINER RPC
  const checkCnpjExists = async (cnpjValue: string): Promise<boolean> => {
    const cleanedCnpj = cleanCNPJ(cnpjValue);
    if (cleanedCnpj.length !== 14) return false;
    
    setCnpjChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_cnpj_available', {
        p_cnpj: cleanedCnpj,
      });
      
      if (error) {
        if (import.meta.env.DEV) console.error("CNPJ check error:", error);
        return false;
      }
      
      // RPC returns true if available, so invert for "exists"
      return data === false;
    } catch {
      return false;
    } finally {
      setCnpjChecking(false);
    }
  };

  const handleCnpjChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setCnpj(formatted);
    
    // Clear CNPJ error when user starts typing
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: "" }));
    }
  };

  const handleWhatsappChange = (value: string) => {
    const formatted = formatPhone(value);
    setWhatsapp(formatted);
    
    // Clear error when user starts typing
    if (errors.whatsapp) {
      setErrors((prev) => ({ ...prev, whatsapp: "" }));
    }
  };

  const handleCnpjBlur = async () => {
    if (!validateCNPJ(cnpj)) return;
    
    const exists = await checkCnpjExists(cnpj);
    if (exists) {
      setErrors((prev) => ({ ...prev, cnpj: "CNPJ já cadastrado no sistema" }));
      toast.error("Este CNPJ já está cadastrado. Use 'Já tenho conta' para fazer login.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = signupSchema.parse({
        fullName,
        organizationName,
        cnpj,
        whatsapp,
        email: signupEmail,
        password: signupPassword,
        confirmPassword,
      });

      // Check if CNPJ already exists before signup
      const cnpjExists = await checkCnpjExists(validated.cnpj);
      if (cnpjExists) {
        setErrors({ cnpj: "CNPJ já cadastrado no sistema" });
        toast.error("Este CNPJ já está cadastrado");
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(
        validated.email,
        validated.password,
        validated.fullName,
        validated.organizationName,
        cleanCNPJ(validated.cnpj),
        cleanPhone(validated.whatsapp)
      );

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado");
        } else if (error.message.includes("CNPJ already registered")) {
          setErrors({ cnpj: "CNPJ já cadastrado no sistema" });
          toast.error("Este CNPJ já está cadastrado");
        } else {
          if (import.meta.env.DEV) {
            console.error("Signup error:", error);
          }
          toast.error("Erro ao criar conta. Verifique os dados e tente novamente.");
        }
      } else {
        toast.success("Conta criada! Verifique seu e-mail para ativar sua conta.");
        navigate("/verificar-email");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        if (import.meta.env.DEV) console.error("Google sign-in error:", error);
        toast.error("Erro ao entrar com Google. Tente novamente.");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Google sign-in error:", error);
      toast.error("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="Gerenciar Frotas" className="w-[500px] h-auto" />
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Gerencie sua frota com{" "}
            <span className="text-gradient">inteligência</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Controle abastecimentos, viagens, despesas e muito mais. 
            Tudo em uma única plataforma simples e poderosa.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            {[
              "Gestão de Frota",
              "Controle de Viagens",
              "Relatórios Avançados",
              "Multi-usuários",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2024 gerenciarfrotas. Todos os direitos reservados.
        </p>
      </div>

      {/* Right side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <img src={logoImg} alt="Gerenciar Frotas" className="w-[416px] h-auto" />
          </div>

          <Tabs defaultValue="login" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
                  <p className="text-muted-foreground">Entre com suas credenciais</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PasswordInput
                        id="login-password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-medium"
                      onClick={() => setActiveTab("forgot")}
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGoogleSignIn()}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Entrar com Google
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setActiveTab("signup")}
                  >
                    Crie sua conta aqui
                  </button>
                </p>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Crie sua conta</h2>
                  <p className="text-muted-foreground">Comece seu trial de 14 dias grátis</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Seu nome"
                        className="pl-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization-name">Nome da Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="organization-name"
                        type="text"
                        placeholder="Sua Transportadora"
                        className="pl-10"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                      />
                    </div>
                    {errors.organizationName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.organizationName}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          className="pl-10"
                          value={cnpj}
                          onChange={(e) => handleCnpjChange(e.target.value)}
                          onBlur={handleCnpjBlur}
                          maxLength={18}
                        />
                      </div>
                      {cnpjChecking && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
                        </p>
                      )}
                      {errors.cnpj && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.cnpj}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="whatsapp"
                          type="text"
                          placeholder="(00) 00000-0000"
                          className="pl-10"
                          value={whatsapp}
                          onChange={(e) => handleWhatsappChange(e.target.value)}
                          maxLength={15}
                        />
                      </div>
                      {errors.whatsapp && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.whatsapp}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PasswordInput
                        id="signup-password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    <PasswordRequirements password={signupPassword} />
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <PasswordInput
                        id="confirm-password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !allPasswordRulesMet(signupPassword)}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar Conta Grátis"
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGoogleSignIn()}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Entrar com Google
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Ao criar sua conta, você concorda com nossos{" "}
                  <Link to="/termos-de-uso" className="text-primary hover:underline">Termos de Uso</Link>
                  {" "}e{" "}
                  <Link to="/politica-de-privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="forgot">
              <div className="space-y-6">
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold text-foreground">Esqueceu sua senha?</h2>
                  <p className="text-muted-foreground">
                    {forgotSent
                      ? "Verifique sua caixa de entrada"
                      : "Digite seu email para receber o link de redefinição"}
                  </p>
                </div>

                {forgotSent ? (
                  <div className="space-y-4 text-center">
                    <Mail className="w-12 h-12 text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Se existe uma conta com o email informado, você receberá um link para redefinir sua senha.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setForgotSent(false);
                        setForgotEmail("");
                        setActiveTab("login");
                      }}
                    >
                      Voltar para o login
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!forgotEmail) {
                        setErrors({ forgotEmail: "Email é obrigatório" });
                        return;
                      }
                      setIsLoading(true);
                      setErrors({});
                      try {
                        await supabase.auth.resetPasswordForEmail(forgotEmail, {
                          redirectTo: `${window.location.origin}/redefinir-senha`,
                        });
                        // Always show success (avoid email enumeration)
                        setForgotSent(true);
                      } catch {
                        toast.error("Erro ao processar sua solicitação.");
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                      </div>
                      {errors.forgotEmail && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.forgotEmail}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar link de redefinição"
                      )}
                    </Button>

                    <button
                      type="button"
                      className="text-xs text-primary hover:underline font-medium w-full text-center block"
                      onClick={() => {
                        setActiveTab("login");
                        setErrors({});
                      }}
                    >
                      Voltar para o login
                    </button>
                  </form>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
