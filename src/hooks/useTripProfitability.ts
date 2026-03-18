import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TripProfit {
  tripId: string;
  origin: string;
  destination: string;
  vehiclePrefix: string;
  clientName: string | null;
  startDate: string;
  status: string;
  freightValue: number;
  fuelCost: number;
  expensesCost: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  km: number;
  costPerKm: number;
}

export function useTripProfitability() {
  const { profile } = useAuth();
  const [tripProfits, setTripProfits] = useState<TripProfit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [tripsRes, fuelRes, expensesRes] = await Promise.all([
          supabase
            .from("trips")
            .select("*, vehicle:vehicles(prefix, plate)")
            .eq("organization_id", profile.organization_id)
            .order("start_date", { ascending: false }),
          supabase
            .from("fuel_records")
            .select("trip_id, total_value")
            .eq("organization_id", profile.organization_id)
            .not("trip_id", "is", null),
          supabase
            .from("expenses")
            .select("trip_id, value")
            .eq("organization_id", profile.organization_id)
            .not("trip_id", "is", null),
        ]);

        if (tripsRes.error) throw tripsRes.error;

        // Group fuel costs by trip
        const fuelByTrip: Record<string, number> = {};
        (fuelRes.data || []).forEach((r) => {
          if (r.trip_id) {
            fuelByTrip[r.trip_id] = (fuelByTrip[r.trip_id] || 0) + Number(r.total_value || 0);
          }
        });

        // Group expenses by trip
        const expensesByTrip: Record<string, number> = {};
        (expensesRes.data || []).forEach((e) => {
          if (e.trip_id) {
            expensesByTrip[e.trip_id] = (expensesByTrip[e.trip_id] || 0) + Number(e.value || 0);
          }
        });

        const profits: TripProfit[] = (tripsRes.data || []).map((trip: any) => {
          const freightValue = Number(trip.freight_value || 0);
          const fuelCost = fuelByTrip[trip.id] || 0;
          const expensesCost = expensesByTrip[trip.id] || 0;
          const totalCost = fuelCost + expensesCost;
          const profit = freightValue - totalCost;
          const km = (trip.end_km || 0) - (trip.start_km || 0);
          const profitMargin = freightValue > 0 ? (profit / freightValue) * 100 : 0;
          const costPerKm = km > 0 ? totalCost / km : 0;

          return {
            tripId: trip.id,
            origin: trip.origin,
            destination: trip.destination,
            vehiclePrefix: trip.vehicle?.prefix || "N/A",
            clientName: trip.client_name,
            startDate: trip.start_date,
            status: trip.status || "scheduled",
            freightValue,
            fuelCost,
            expensesCost,
            totalCost,
            profit,
            profitMargin,
            km: km > 0 ? km : 0,
            costPerKm,
          };
        });

        setTripProfits(profits);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Error calculating trip profitability:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.organization_id]);

  const summary = {
    totalRevenue: tripProfits.reduce((s, t) => s + t.freightValue, 0),
    totalCosts: tripProfits.reduce((s, t) => s + t.totalCost, 0),
    totalProfit: tripProfits.reduce((s, t) => s + t.profit, 0),
    avgMargin: tripProfits.length > 0
      ? tripProfits.reduce((s, t) => s + t.profitMargin, 0) / tripProfits.filter(t => t.freightValue > 0).length || 0
      : 0,
    profitableTrips: tripProfits.filter((t) => t.profit > 0).length,
    unprofitableTrips: tripProfits.filter((t) => t.profit < 0).length,
  };

  return { tripProfits, loading, summary };
}
