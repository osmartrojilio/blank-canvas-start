import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Key, LogOut, Smartphone, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SegurancaSettings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres";
    if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula";
    if (!/[a-z]/.test(password)) return "A senha deve conter pelo menos uma letra minúscula";
    if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número";
    return null;
  };

  const handleChangePassword = async () => {
    // Rate limiting: check lockout
    if (lockedUntil && Date.now() < lockedUntil) {
      const remainingSecs = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${remainingSecs} segundos antes de tentar novamente.`,
        variant: "destructive",
      });
      return;
    }

    if (!currentPassword) {
      toast({
        title: "Senha atual obrigatória",
        description: "Por favor, digite sua senha atual.",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "Senha inválida",
        description: passwordError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Add constant delay to normalize response timing and prevent timing attacks
      const minDelay = new Promise((resolve) => setTimeout(resolve, 1000));

      // Re-authenticate with current credentials to verify identity
      const reauthPromise = supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });

      const [{ error: reauthError }] = await Promise.all([reauthPromise, minDelay]);

      if (reauthError) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        // Lockout after 5 failed attempts for 60 seconds
        if (newAttempts >= 5) {
          setLockedUntil(Date.now() + 60000);
          setFailedAttempts(0);
          toast({
            title: "Conta temporariamente bloqueada",
            description: "Muitas tentativas incorretas. Aguarde 60 segundos.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Senha atual incorreta",
          description: "A senha atual informada está incorreta.",
          variant: "destructive",
        });
        return;
      }

      // Reset failed attempts on success
      setFailedAttempts(0);
      setLockedUntil(null);

      // Now update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error changing password:", error);
      }
      toast({
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      // Sign out current session - this will end the current session
      // Note: Supabase doesn't support signing out all sessions via client SDK
      // This would require an edge function with admin privileges
      
      toast({
        title: "Funcionalidade limitada",
        description: "Para encerrar todas as sessões, altere sua senha.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error logging out:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!changingPassword ? (
            <Button onClick={() => setChangingPassword(true)}>
              <Key className="h-4 w-4 mr-2" />
              Alterar Senha
            </Button>
          ) : (
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} disabled={loading}>
                  {loading ? "Alterando..." : "Salvar Nova Senha"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChangingPassword(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2">Dicas para uma senha forte:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Mínimo de 8 caracteres
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Combine letras maiúsculas e minúsculas
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Inclua números e caracteres especiais
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Evite informações pessoais óbvias
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Sessões
          </CardTitle>
          <CardDescription>
            Gerencie suas sessões ativas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-muted">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">Sessão Atual</h4>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <Badge variant="default">Ativa</Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogoutAll}>
              Encerrar Outras Sessões
            </Button>
            <Button variant="destructive" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair desta Sessão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação em Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A autenticação em dois fatores estará disponível em breve.
              Você receberá uma notificação quando este recurso for lançado.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
