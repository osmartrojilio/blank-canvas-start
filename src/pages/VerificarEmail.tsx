import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-gerenciar-frotas.png";

export default function VerificarEmail() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Redirect if already verified
  useEffect(() => {
    if (!loading && profile?.is_email_verified) {
      navigate("/");
    }
  }, [profile, loading, navigate]);

  // Send code on mount
  useEffect(() => {
    if (user && !codeSent && !loading) {
      sendCode();
    }
  }, [user, loading]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendCode = async () => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("send-verification-code");

      if (fnError) {
        // Parse the error message which may contain JSON from the edge function
        let errorMsg = "Erro ao enviar código. Tente novamente.";
        try {
          const parsed = JSON.parse(fnError.message);
          if (parsed?.error) errorMsg = parsed.error;
        } catch {
          // If the context field itself has the message
          if (typeof data?.error === "string") errorMsg = data.error;
        }
        
        // If it's a rate limit message, start cooldown
        if (errorMsg.includes("Aguarde") || errorMsg.includes("minuto")) {
          setCodeSent(true);
          setCooldown(60);
        }
        
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (data?.error) {
        setError(data.error);
        toast.error(data.error);
      } else {
        setCodeSent(true);
        setCooldown(60);
        toast.success("Código enviado para seu e-mail!");
      }
    } catch (err: any) {
      setError("Erro ao enviar código. Tente novamente.");
      toast.error("Erro ao enviar código");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError("Digite o código completo de 6 dígitos");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-email-code", {
        body: { code },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        setError(data.error);
        setCode("");
      } else {
        toast.success("E-mail verificado com sucesso!");
        // Force reload profile data
        window.location.href = "/";
      }
    } catch (err: any) {
      setError("Erro ao verificar código. Tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoImg} alt="Gerenciar Frotas" className="w-48 h-auto" />
          </div>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
          <CardDescription className="text-base">
            Enviamos um código de 6 dígitos para{" "}
            <strong className="text-foreground">{user?.email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => {
                setCode(value);
                setError("");
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error}
            </p>
          )}

          <Button
            onClick={verifyCode}
            className="w-full"
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={sendCode}
              disabled={isSending || cooldown > 0}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              {cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : "Reenviar código"}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            O código expira em 10 minutos. Verifique também a pasta de spam.
          </p>

          <div className="pt-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth");
              }}
            >
              Voltar para o Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
