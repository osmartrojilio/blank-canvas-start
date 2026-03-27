import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function ExpirationAlert() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  if (!organization) return null;

  const status = organization.subscription_status;
  let endDate: Date | null = null;

  if (status === "trialing" && organization.trial_ends_at) {
    endDate = new Date(organization.trial_ends_at);
  } else if (
    (status === "active" || status === "canceled_active_until_end") &&
    organization.subscription_ends_at
  ) {
    endDate = new Date(organization.subscription_ends_at);
  }

  if (!endDate) return null;

  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft > 3 || daysLeft < 0) return null;

  const label =
    status === "trialing"
      ? `Seu período de teste expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}. Assine agora para não perder acesso.`
      : status === "canceled_active_until_end"
        ? `Seu acesso termina em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}. Renove para continuar usando.`
        : `Sua assinatura expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}. Renove para não perder acesso.`;

  return (
    <Alert className="border-destructive/50 bg-destructive/10 mb-6">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm font-medium text-destructive">{label}</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => navigate("/configuracoes?tab=planos")}
        >
          Renovar agora
        </Button>
      </AlertDescription>
    </Alert>
  );
}
