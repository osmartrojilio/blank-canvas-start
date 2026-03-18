import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface UpgradeBannerProps {
  message?: string;
  compact?: boolean;
}

export default function UpgradeBanner({ 
  message = "Esta funcionalidade não está disponível no plano gratuito.",
  compact = false
}: UpgradeBannerProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <Crown className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm text-primary">{message}</span>
        <Button size="sm" variant="default" className="ml-auto" onClick={() => navigate("/planos")}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-primary/5 border border-primary/20 text-center space-y-4">
      <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
        <Crown className="w-7 h-7 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">Funcionalidade Premium</h3>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
      <Button onClick={() => navigate("/planos")}>
        <Crown className="w-4 h-4 mr-2" />
        Ver Planos
      </Button>
    </div>
  );
}
