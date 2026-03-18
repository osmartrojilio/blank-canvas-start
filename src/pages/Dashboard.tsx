import { Truck, Fuel, Route, DollarSign, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import Layout from "@/components/layout/Layout";
import StatCard from "@/components/dashboard/StatCard";
import RecentTrips from "@/components/dashboard/RecentTrips";
import FleetOverview from "@/components/dashboard/FleetOverview";
import FuelChart from "@/components/dashboard/FuelChart";
import TripProfitabilityTable from "@/components/dashboard/TripProfitabilityTable";
import ProactiveAlertsPanel from "@/components/dashboard/ProactiveAlertsPanel";
import { useVehicles } from "@/hooks/useVehicles";
import { useTrips } from "@/hooks/useTrips";
import { useFuelRecords } from "@/hooks/useFuelRecords";
import { useExpenses } from "@/hooks/useExpenses";
import { useTripProfitability } from "@/hooks/useTripProfitability";
import { useProactiveAlerts } from "@/hooks/useProactiveAlerts";

const Dashboard = () => {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { trips, stats: tripStats, loading: tripsLoading } = useTrips();
  const { fuelRecords, stats: fuelStats, loading: fuelLoading } = useFuelRecords();
  const { stats: expenseStats, loading: expensesLoading } = useExpenses();
  const { tripProfits, summary: profitSummary, loading: profitLoading } = useTripProfitability();
  const { alerts, loading: alertsLoading } = useProactiveAlerts();

  const isLoading = vehiclesLoading || tripsLoading || fuelLoading || expensesLoading || profitLoading || alertsLoading;

  // Calculate vehicle stats
  const totalVehicles = vehicles.length;
  const vehiclesInMaintenance = vehicles.filter(v => v.status === 'maintenance').length;

  // Calculate fuel stats for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyFuelRecords = fuelRecords.filter(record => {
    const recordDate = new Date(record.fuel_date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });
  const monthlyFuelCost = monthlyFuelRecords.reduce((sum, r) => sum + Number(r.total_value || 0), 0);
  const monthlyFuelLiters = monthlyFuelRecords.reduce((sum, r) => sum + Number(r.liters || 0), 0);

  // Calculate trip stats for current month
  const monthlyTrips = trips.filter(trip => {
    const tripDate = new Date(trip.start_date);
    return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
  });
  const monthlyTripsCount = monthlyTrips.length;
  const monthlyKm = monthlyTrips.reduce((sum, t) => {
    const km = (t.end_km || 0) - (t.start_km || 0);
    return sum + (km > 0 ? km : 0);
  }, 0);

  // Calculate revenue (freight value from trips)
  const monthlyRevenue = monthlyTrips.reduce((sum, t) => sum + Number(t.freight_value || 0), 0);
  const monthlyExpenses = monthlyFuelCost + expenseStats.total;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;


  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Painel</h1>
          <p className="page-subtitle">Visão geral da sua frota de veículos</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Veículos"
            value={totalVehicles.toString()}
            subtitle={vehiclesInMaintenance > 0 ? `${vehiclesInMaintenance} em manutenção` : "Todos operacionais"}
            icon={Truck}
            variant="primary"
          />
          <StatCard
            title="Combustível (Mês)"
            value={formatCurrency(monthlyFuelCost)}
            subtitle={`${monthlyFuelLiters.toLocaleString('pt-BR')} litros`}
            icon={Fuel}
            variant="warning"
          />
          <StatCard
            title="Viagens (Mês)"
            value={monthlyTripsCount.toString()}
            subtitle={`${monthlyKm.toLocaleString('pt-BR')} km rodados`}
            icon={Route}
            variant="success"
          />
          <StatCard
            title="Faturamento"
            value={formatCurrency(monthlyRevenue)}
            subtitle={`Lucro: ${formatCurrency(monthlyProfit)}`}
            icon={DollarSign}
          />
        </div>

        {/* Proactive Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <ProactiveAlertsPanel alerts={alerts} />
          </div>
        )}

        {/* Charts & Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <FuelChart fuelRecords={fuelRecords} />
          </div>
          <div>
            <FleetOverview vehicles={vehicles} />
          </div>
        </div>

        {/* Trip Profitability */}
        <div className="mb-8">
          <TripProfitabilityTable tripProfits={tripProfits} limit={10} />
        </div>

        {/* Recent Trips */}
        <RecentTrips trips={trips} />
      </div>
    </Layout>
  );
};

export default Dashboard;
