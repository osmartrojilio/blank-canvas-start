import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Building2, AlertCircle, Loader2, Phone, CheckCircle } from "lucide-react";
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

const completeSignupSchema = z.object({
  organizationName: z.string().min(2, "Nome da empresa deve ter no mínimo 2 caracteres").max(100, "Nome da empresa muito longo"),
  cnpj: z.string()
    .min(1, "CNPJ é obrigatório")
    .refine((val) => validateCNPJ(val), "CNPJ inválido"),
  whatsapp: z.string()
    .min(1, "WhatsApp é obrigatório")
    .refine((val) => validatePhone(val), "Número de WhatsApp inválido"),
});

export default function CompletarCadastro() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cnpjChecking, setCnpjChecking] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Form state
  const [organizationName, setOrganizationName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Not logged in, redirect to auth
        navigate("/auth");
        return;
      }

      // Get user metadata from Google
      const user = session.user;
      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || "");

      // Check if user already has a profile with organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.organization_id) {
        // User already has organization, redirect to dashboard
        navigate("/");
        return;
      }

      setIsCheckingUser(false);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error checking user status:", error);
      }
      navigate("/auth");
    }
  };

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
    
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: "" }));
    }
  };

  const handleWhatsappChange = (value: string) => {
    const formatted = formatPhone(value);
    setWhatsapp(formatted);
    
    if (errors.whatsapp) {
      setErrors((prev) => ({ ...prev, whatsapp: "" }));
    }
  };

  const handleCnpjBlur = async () => {
    if (!validateCNPJ(cnpj)) return;
    
    const exists = await checkCnpjExists(cnpj);
    if (exists) {
      setErrors((prev) => ({ ...prev, cnpj: "CNPJ já cadastrado no sistema" }));
      toast.error("Este CNPJ já está cadastrado.");
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const validated = completeSignupSchema.parse({
        organizationName,
        cnpj,
        whatsapp,
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      // Use secure RPC function to complete signup
      const { data, error } = await supabase.rpc("complete_user_signup", {
        _organization_name: validated.organizationName,
        _cnpj: validated.cnpj,
        _whatsapp: validated.whatsapp,
        _full_name: userName || null,
      });

      if (error) {
        if (import.meta.env.DEV) console.error("Complete signup error:", error);
        toast.error("Erro ao completar cadastro. Tente novamente.");
        setIsLoading(false);
        return;
      }

      const result = data as { success: boolean; error?: string; organization_id?: string };

      if (!result.success) {
        // Handle specific errors from the RPC function
        if (result.error === "CNPJ already registered") {
          setErrors({ cnpj: "CNPJ já cadastrado no sistema" });
          toast.error("Este CNPJ já está cadastrado");
        } else if (result.error === "User already belongs to an organization") {
          toast.error("Você já pertence a uma organização");
          window.location.href = "/";
        } else if (result.error === "Invalid CNPJ") {
          setErrors({ cnpj: "CNPJ inválido" });
          toast.error("CNPJ inválido");
        } else {
          toast.error(result.error || "Erro ao completar cadastro");
        }
        setIsLoading(false);
        return;
      }

      toast.success("Cadastro concluído com sucesso!");
      
      // Force refresh session to get updated profile
      window.location.href = "/";
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        if (import.meta.env.DEV) console.error("Complete signup error:", error);
        toast.error("Erro ao completar cadastro. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando conta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">gerenciarfrotas</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Falta pouco para começar!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Complete seu cadastro com os dados da sua empresa para ter acesso completo ao sistema.
          </p>
          
          <div className="space-y-3 pt-8">
            <div className="flex items-center gap-3 text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>Login com Google ✓</span>
            </div>
            <div className="flex items-center gap-3 text-foreground font-medium">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                <span className="text-xs">2</span>
              </div>
              <span>Dados da empresa</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-5 h-5 rounded-full border-2 border-muted flex items-center justify-center">
                <span className="text-xs">3</span>
              </div>
              <span>Começar a usar</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2024 gerenciarfrotas. Todos os direitos reservados.
        </p>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">gerenciarfrotas</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-foreground">Complete seu cadastro</h2>
              <p className="text-muted-foreground">
                Olá, <span className="font-medium text-foreground">{userName || userEmail}</span>!
              </p>
              <p className="text-sm text-muted-foreground">
                Precisamos de mais alguns dados para criar sua conta
              </p>
            </div>

            <form onSubmit={handleCompleteSignup} className="space-y-4">
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
                    autoFocus
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

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    "Finalizar Cadastro"
                  )}
                </Button>
              </div>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              Ao finalizar, você concorda com nossos{" "}
              <a href="#" className="text-primary hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
