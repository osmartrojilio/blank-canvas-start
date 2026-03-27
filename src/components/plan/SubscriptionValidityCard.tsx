import { useState, useEffect } from "react";
import { Calendar, Gift, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

function useCountdown(endDate: Date | null) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!endDate) return;
    const diff = endDate.getTime() - Date.now();
    // Only tick if less than 24h remaining
    if (diff > 24 * 60 * 60 * 1000 || diff <= 0) return;

    const interval = setInterval(() => setNow(new Date()), 60_000); // update every minute
    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) return null;

  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
  if (diff > 24 * 60 * 60 * 1000) return null; // more than 1 day

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, expired: false };
}

export default function SubscriptionValidityCard() {
  const navigate = useNavigate();
  const { organization } = useAuth();

  // Determine end date early so hook is always called
  let endDate: Date | null = null;
  let startDate: Date | null = null;

  if (organization) {
    const status = organization.subscription_status;
    const isTrialing = status === "trialing";
    const isActive = status === "active";
    const isCanceledActive = status === "canceled_active_until_end";

    if (isTrialing && organization.trial_ends_at) {
      endDate = new Date(organization.trial_ends_at);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 14);
    } else if ((isActive || isCanceledActive) && organization.subscription_ends_at) {
      endDate = new Date(organization.subscription_ends_at);
      startDate = new Date(endDate);
      startDate.setMonth(startDate.getMonth() - 1);
    }
  }

  const countdown = useCountdown(endDate);

  if (!organization || !startDate || !endDate) return null;

  const status = organization.subscription_status;
  const isTrialing = status === "trialing";
  const isCanceledActive = status === "canceled_active_until_end";

  const now = new Date();
  const totalDays = Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 1);
  const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
  const progressPercent = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

  const formatDateBR = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const label = isTrialing ? "Período de teste" : "Vigência da assinatura";

  const renderTimeLeft = () => {
    if (countdown) {
      if (countdown.expired) {
        return (
          <span className="text-sm font-bold text-destructive">
            Expirado
          </span>
        );
      }
      return (
        <span className="text-sm font-bold text-destructive flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 animate-pulse" />
          {countdown.hours}h {String(countdown.minutes).padStart(2, "0")}min restantes
        </span>
      );
    }
    return (
      <span className="text-sm font-bold text-primary">
        {daysLeft} {daysLeft === 1 ? "dia restante" : "dias restantes"}
      </span>
    );
  };

  return (
    <Card className="border-primary/30 bg-card">
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {label}
          </div>
          {renderTimeLeft()}
        </div>

        <Progress value={progressPercent} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDateBR(startDate)}</span>
          <span>{formatDateBR(endDate)}</span>
        </div>

        {daysLeft <= 3 && (
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
        )}
      </CardContent>
    </Card>
  );
}
