import { Calendar, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionValidityCard() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  if (!organization) return null;

  const status = organization.subscription_status;
  const isTrialing = status === "trialing";
  const isActive = status === "active";
  const isCanceledActive = status === "canceled_active_until_end";

  // Determine start and end dates
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (isTrialing && organization.trial_ends_at) {
    endDate = new Date(organization.trial_ends_at);
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 14); // trial = 14 days
  } else if ((isActive || isCanceledActive) && organization.subscription_ends_at) {
    endDate = new Date(organization.subscription_ends_at);
    // Assume monthly billing
    startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 1);
  }

  if (!startDate || !endDate) return null;

  const now = new Date();
  const totalDays = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 1);
  const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
  const progressPercent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  const formatDateBR = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const label = isTrialing ? "Período de teste" : "Vigência da assinatura";

  return (
    <Card className="border-primary/30 bg-card">
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {label}
          </div>
          <span className="text-sm font-bold text-primary">
            {daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}
          </span>
        </div>

        <Progress value={progressPercent} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDateBR(startDate)}</span>
          <span>{formatDateBR(endDate)}</span>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted-foreground mb-3">
            {isCanceledActive
              ? "Sua assinatura foi cancelada. O acesso será mantido até o fim do período."
              : "Renove agora com desconto exclusivo de 20% e não perca acesso"}
          </p>
          {!isCanceledActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/configuracoes?tab=planos")}
            >
              <Gift className="h-4 w-4 mr-2" />
              Renovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
