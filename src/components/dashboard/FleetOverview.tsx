import { Car, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Vehicle } from "@/hooks/useVehicles";

interface FleetOverviewProps {
  vehicles: Vehicle[];
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  available: { icon: CheckCircle, color: "text-success", label: "Disponível" },
  in_use: { icon: CheckCircle, color: "text-primary", label: "Em Uso" },
  maintenance: { icon: AlertTriangle, color: "text-warning", label: "Manutenção" },
  inactive: { icon: XCircle, color: "text-destructive", label: "Inativo" },
};

const FleetOverview = ({ vehicles }: FleetOverviewProps) => {
  // Show only first 5 vehicles
  const displayVehicles = vehicles.slice(0, 5);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Status da Frota</h3>
        <span className="text-sm text-muted-foreground">{vehicles.length} veículos</span>
      </div>

      {displayVehicles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum veículo cadastrado</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[350px]">
          <div className="space-y-3 min-w-[300px]">
            {displayVehicles.map((vehicle) => {
              const config = statusConfig[vehicle.status || 'available'] || statusConfig.available;
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{vehicle.prefix}</p>
                      <p className="text-xs text-muted-foreground">{vehicle.plate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {(vehicle.current_km || 0).toLocaleString("pt-BR")} km
                    </span>
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      <span className={`text-xs font-medium ${config.color} whitespace-nowrap`}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetOverview;
