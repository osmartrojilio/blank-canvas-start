import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { z } from "zod";
import { PasswordRequirements, allPasswordRulesMet } from "@/components/auth/PasswordRequirements";

// Strong password schema matching main auth flow
const passwordSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número")
  .regex(/[!@#$%&*]/, "Senha deve conter pelo menos um caractere especial (!@#$%&*)");

type InvitationStatus = "loading" | "valid" | "invalid" | "expired" | "accepted" | "processing" | "success";

interface InvitationData {
  email: string;
  role: string;
  organizationName: string;
}

const AceitarConvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    manager: "Gerente",
    driver: "Motorista",
  };

  const navigateToAppOrAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/");
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          email,
          role,
          accepted_at,
          expires_at,
          organizations (name)
        `)
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        setStatus("invalid");
        return;
      }

      if (data.accepted_at) {
        setStatus("accepted");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setStatus("expired");
        return;
      }

      setInvitation({
        email: data.email,
        role: data.role,
        organizationName: (data.organizations as { name: string })?.name || "Organização",
      });
      setStatus("valid");
    } catch (error) {
      setStatus("invalid");
    }
  };

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation || !token) return;

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    // Validate password with strong policy matching main auth
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      toast({
        title: "Erro",
        description: passwordValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setStatus("processing");

    try {
      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes("already registered")) {
          toast({
            title: "Usuário já existe",
            description: "Faça login com sua conta existente para aceitar o convite.",
            variant: "destructive",
          });
          setStatus("valid");
          navigate(`/auth?redirect=/aceitar-convite?token=${token}`);
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("Falha ao criar usuário");
      }

      // Accept the invitation using the database function
      const { data: acceptResult, error: acceptError } = await supabase.rpc(
        "accept_invitation",
        { _token: token }
      );

      if (acceptError) throw acceptError;

      const result = acceptResult as { success: boolean; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Falha ao aceitar convite");
      }

      setStatus("success");
      
      toast({
        title: "Bem-vindo!",
        description: `Você agora faz parte da ${invitation.organizationName}.`,
      });

      // Force full page reload to re-initialize auth context with fresh data
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error accepting invitation:", error);
      }
      toast({
        title: "Erro ao aceitar convite",
        description: error instanceof Error ? error.message : "Não foi possível aceitar o convite.",
        variant: "destructive",
      });
      setStatus("valid");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validando convite...</p>
          </div>
        );

      case "invalid":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
            <p className="text-muted-foreground mb-6">
              Este link de convite não é válido ou não foi encontrado.
            </p>
            <Button onClick={navigateToAppOrAuth}>
              Ir para Login
            </Button>
          </div>
        );

      case "expired":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Expirado</h2>
            <p className="text-muted-foreground mb-6">
              Este convite expirou. Solicite um novo convite ao administrador.
            </p>
            <Button onClick={navigateToAppOrAuth}>
              Ir para Login
            </Button>
          </div>
        );

      case "accepted":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Já Aceito</h2>
            <p className="text-muted-foreground mb-6">
              Este convite já foi aceito anteriormente.
            </p>
            <Button onClick={navigateToAppOrAuth}>
              Ir para Login
            </Button>
          </div>
        );

      case "processing":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Criando sua conta...</p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Conta Criada!</h2>
            <p className="text-muted-foreground mb-2">
              Bem-vindo à {invitation?.organizationName}!
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o sistema...
            </p>
          </div>
        );

      case "valid":
        return (
          <form onSubmit={handleAcceptInvitation} className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                Você foi convidado para:
              </p>
              <p className="font-semibold text-lg">{invitation?.organizationName}</p>
              <p className="text-sm text-muted-foreground">
                Cargo: <span className="font-medium">{roleLabels[invitation?.role || ""] || invitation?.role}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Crie uma senha forte"
                required
                minLength={8}
              />
              <PasswordRequirements password={password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={!allPasswordRulesMet(password)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Aceitar Convite e Criar Conta
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Aceitar Convite</CardTitle>
          <CardDescription>
            Complete seu cadastro para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AceitarConvite;
