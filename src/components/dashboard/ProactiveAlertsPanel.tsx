import { AlertTriangle, AlertCircle, Info, ShieldAlert, Wrench, FileWarning, IdCard } from "lucide-react";
import { ProactiveAlert, AlertLevel, AlertCategory } from "@/hooks/useProactiveAlerts";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProactiveAlertsPanelProps {
  alerts: ProactiveAlert[];
}

const levelConfig: Record<AlertLevel, { icon: typeof AlertTriangle; color: string; bg: string; badge: string }> = {
  critical: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", badge: "destructive" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", badge: "secondary" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", badge: "outline" },
};

const categoryIcons: Record<AlertCategory, typeof IdCard> = {
  cnh: IdCard,
  maintenance: Wrench,
  document: FileWarning,
  insurance: ShieldAlert,
};

const categoryLabels: Record<AlertCategory, string> = {
  cnh: "CNH",
  maintenance: "Manutenção",
  document: "Documento",
  insurance: "Seguro",
};

const ProactiveAlertsPanel = ({ alerts }: ProactiveAlertsPanelProps) => {
  if (alerts.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-semibold text-foreground">Alertas</h3>
        </div>
        <div className="text-center py-6">
          <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
          <p className="text-sm text-muted-foreground">Tudo em dia! Nenhum alerta no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive" />
          <h3 className="text-lg font-semibold text-foreground">Alertas Proativos</h3>
        </div>
        <Badge variant="destructive" className="text-xs">
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </Badge>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = levelConfig[alert.level];
            const LevelIcon = config.icon;
            const CategoryIcon = categoryIcons[alert.category];

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border border-border/50`}
              >
                <div className={`flex-shrink-0 mt-0.5 ${config.color}`}>
                  <LevelIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <CategoryIcon className="w-3 h-3 mr-1" />
                      {categoryLabels[alert.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                  {alert.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Vencimento: {new Date(alert.dueDate).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProactiveAlertsPanel;
