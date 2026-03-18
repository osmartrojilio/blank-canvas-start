import { MapPin, ArrowRight } from "lucide-react";
import { Trip } from "@/hooks/useTrips";

interface RecentTripsProps {
  trips: Trip[];
}

const statusLabels: Record<string, { label: string; class: string }> = {
  scheduled: { label: "Agendada", class: "badge-status badge-warning" },
  in_progress: { label: "Em Andamento", class: "badge-status badge-warning" },
  completed: { label: "Concluída", class: "badge-status badge-success" },
  cancelled: { label: "Cancelada", class: "badge-status badge-danger" },
};

const RecentTrips = ({ trips }: RecentTripsProps) => {
  // Show only the 5 most recent trips
  const recentTrips = trips.slice(0, 5);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Viagens Recentes</h3>
        <span className="text-sm text-muted-foreground">{trips.length} viagens</span>
      </div>

      {recentTrips.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma viagem registrada</p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <div className="space-y-4 min-w-[500px]">
            {recentTrips.map((trip) => {
              const statusConfig = statusLabels[trip.status || 'scheduled'] || statusLabels.scheduled;
              const vehiclePrefix = trip.vehicle?.prefix || 'N/A';
              
              return (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                        <span className="max-w-[120px] truncate">{trip.origin}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="max-w-[120px] truncate">{trip.destination}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {vehiclePrefix} • {new Date(trip.start_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={statusConfig.class}>
                      {statusConfig.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                      R$ {Number(trip.freight_value || 0).toLocaleString("pt-BR")}
                    </span>
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

export default RecentTrips;
