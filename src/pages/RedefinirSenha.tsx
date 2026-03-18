import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import logoImg from "@/assets/logo-gerenciar-frotas.png";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRecovery, setIsRecovery] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate password
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setErrors({ password: result.error.errors[0].message });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "As senhas não coincidem" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        if (import.meta.env.DEV) console.error("Password update error:", error);
        toast.error("Erro ao redefinir senha. Tente novamente.");
      } else {
        setSuccess(true);
        toast.success("Senha redefinida com sucesso!");
        setTimeout(() => navigate("/"), 2000);
      }
    } catch {
      toast.error("Erro ao processar sua solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <img src={logoImg} alt="Gerenciar Frotas" className="w-64 h-auto mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Link inválido</h2>
            <p className="text-muted-foreground">
              Este link de redefinição de senha é inválido ou expirou.
            </p>
          </div>
          <Button onClick={() => navigate("/auth")} className="w-full">
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <img src={logoImg} alt="Gerenciar Frotas" className="w-64 h-auto mx-auto" />
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Senha redefinida!</h2>
            <p className="text-muted-foreground">
              Sua senha foi alterada com sucesso. Redirecionando...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <img src={logoImg} alt="Gerenciar Frotas" className="w-64 h-auto" />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-foreground">Redefinir senha</h2>
          <p className="text-muted-foreground">Digite sua nova senha abaixo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <PasswordInput
                id="new-password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, com maiúscula, minúscula e número.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              "Redefinir senha"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
