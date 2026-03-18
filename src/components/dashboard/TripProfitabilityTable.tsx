import { TrendingUp, TrendingDown, ArrowRight, MapPin, Fuel, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TripProfit } from "@/hooks/useTripProfitability";
import { formatCurrency } from "@/lib/formatters";

interface TripProfitabilityTableProps {
  tripProfits: TripProfit[];
  limit?: number;
}

const TripProfitabilityTable = ({ tripProfits, limit }: TripProfitabilityTableProps) => {
  const displayTrips = limit ? tripProfits.slice(0, limit) : tripProfits;

  if (displayTrips.length === 0) {
    return (
      <div className="stat-card text-center py-8">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">Nenhuma viagem para calcular lucro</p>
      </div>
    );
  }

  return (
    <div className="stat-card overflow-hidden p-0">
      <div className="p-4 pb-2">
        <h3 className="text-lg font-semibold text-foreground">Lucro Real por Viagem</h3>
        <p className="text-sm text-muted-foreground">Frete − Combustível − Despesas = Lucro</p>
      </div>
      <ScrollArea className="w-full">
        <div className="min-w-[900px]">
          <table className="data-table">
            <thead>
              <tr className="bg-secondary/30">
                <th>Viagem</th>
                <th>Veículo</th>
                <th>Data</th>
                <th className="text-right">Frete</th>
                <th className="text-right">Combustível</th>
                <th className="text-right">Despesas</th>
                <th className="text-right">Lucro</th>
                <th className="text-right">Margem</th>
              </tr>
            </thead>
            <tbody>
              {displayTrips.map((trip) => {
                const isProfitable = trip.profit >= 0;
                return (
                  <tr key={trip.tripId}>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="max-w-[100px] truncate text-foreground font-medium">{trip.origin}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <span className="max-w-[100px] truncate text-foreground font-medium">{trip.destination}</span>
                      </div>
                      {trip.clientName && (
                        <p className="text-xs text-muted-foreground mt-0.5">{trip.clientName}</p>
                      )}
                    </td>
                    <td className="text-muted-foreground">{trip.vehiclePrefix}</td>
                    <td className="text-muted-foreground">{new Date(trip.startDate).toLocaleDateString("pt-BR")}</td>
                    <td className="text-right text-foreground font-medium">{formatCurrency(trip.freightValue)}</td>
                    <td className="text-right text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <Fuel className="w-3 h-3" />
                        {formatCurrency(trip.fuelCost)}
                      </div>
                    </td>
                    <td className="text-right text-muted-foreground">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(trip.expensesCost)}
                      </div>
                    </td>
                    <td className="text-right">
                      <span className={`font-semibold ${isProfitable ? "text-emerald-500" : "text-destructive"}`}>
                        {formatCurrency(trip.profit)}
                      </span>
                    </td>
                    <td className="text-right">
                      <Badge variant={isProfitable ? "outline" : "destructive"} className={`text-xs ${isProfitable ? "border-emerald-500/30 text-emerald-500" : ""}`}>
                        {isProfitable ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trip.profitMargin.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default TripProfitabilityTable;
