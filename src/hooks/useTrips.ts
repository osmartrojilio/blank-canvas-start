import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Trip {
  id: string;
  organization_id: string;
  vehicle_id: string;
  driver_id: string | null;
  origin: string;
  destination: string;
  start_date: string;
  end_date: string | null;
  start_km: number;
  end_km: number | null;
  cargo_type: string | null;
  tonnage: number | null;
  freight_value: number | null;
  client_name: string | null;
  invoice_number: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  vehicle?: {
    prefix: string;
    plate: string;
  };
  driver?: {
    profile: {
      full_name: string;
    };
  };
}

export interface TripFormData {
  vehicle_id: string;
  driver_id?: string;
  origin: string;
  destination: string;
  start_date: string;
  end_date?: string;
  start_km: number;
  end_km?: number;
  cargo_type?: string;
  tonnage?: number;
  freight_value?: number;
  client_name?: string;
  invoice_number?: string;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  notes?: string;
}

export function useTrips() {
  const { profile, user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrips = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          vehicle:vehicles(prefix, plate),
          driver:drivers(profile:profiles(full_name))
        `)
        .eq("organization_id", profile.organization_id)
        .order("start_date", { ascending: false });

      if (error) throw error;

      setTrips(data as Trip[]);
    } catch (err) {
      setError(err as Error);
      if (import.meta.env.DEV) {
        console.error("Error fetching trips:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [profile?.organization_id]);

  const createTrip = async (data: TripFormData) => {
    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newTrip, error } = await supabase
        .from("trips")
        .insert({
          organization_id: profile.organization_id,
          vehicle_id: data.vehicle_id,
          driver_id: data.driver_id || null,
          origin: data.origin,
          destination: data.destination,
          start_date: data.start_date,
          end_date: data.end_date || null,
          start_km: data.start_km,
          end_km: data.end_km || null,
          cargo_type: data.cargo_type || null,
          tonnage: data.tonnage || null,
          freight_value: data.freight_value || null,
          client_name: data.client_name || null,
          invoice_number: data.invoice_number || null,
          status: data.status || "scheduled",
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTrips();
      toast({
        title: "Viagem registrada",
        description: "A viagem foi registrada com sucesso.",
      });
      return newTrip;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating trip:", err);
      }
      toast({
        title: "Erro ao registrar viagem",
        description: err.message || "Ocorreu um erro ao registrar a viagem.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTrip = async (id: string, data: Partial<TripFormData>) => {
    try {
      const { data: updatedTrip, error } = await supabase
        .from("trips")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchTrips();
      toast({
        title: "Viagem atualizada",
        description: "A viagem foi atualizada com sucesso.",
      });
      return updatedTrip;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating trip:", err);
      }
      toast({
        title: "Erro ao atualizar viagem",
        description: err.message || "Ocorreu um erro ao atualizar a viagem.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      const { error } = await supabase.from("trips").delete().eq("id", id);

      if (error) throw error;

      setTrips(trips.filter((t) => t.id !== id));
      toast({
        title: "Viagem excluída",
        description: "A viagem foi excluída com sucesso.",
      });
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error deleting trip:", err);
      }
      toast({
        title: "Erro ao excluir viagem",
        description: err.message || "Ocorreu um erro ao excluir a viagem.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calculate stats
  const stats = {
    totalTrips: trips.length,
    totalKm: trips.reduce((acc, t) => acc + (t.end_km && t.start_km ? t.end_km - t.start_km : 0), 0),
    totalTonnage: trips.reduce((acc, t) => acc + (t.tonnage || 0), 0),
    totalRevenue: trips.reduce((acc, t) => acc + (t.freight_value || 0), 0),
  };

  return {
    trips,
    loading,
    error,
    stats,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip,
  };
}
