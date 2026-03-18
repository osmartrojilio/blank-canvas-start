import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface FuelRecord {
  id: string;
  organization_id: string;
  vehicle_id: string;
  driver_id: string | null;
  trip_id: string | null;
  fuel_date: string;
  liters: number;
  price_per_liter: number;
  total_value: number;
  odometer: number;
  fuel_type: string;
  gas_station: string | null;
  city: string | null;
  state: string | null;
  payment_method: string | null;
  receipt_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  vehicle?: {
    prefix: string;
    plate: string;
  };
}

export interface FuelRecordFormData {
  vehicle_id: string;
  driver_id?: string;
  trip_id?: string;
  fuel_date: string;
  liters: number;
  price_per_liter: number;
  total_value: number;
  odometer: number;
  fuel_type?: string;
  gas_station?: string;
  city?: string;
  state?: string;
  payment_method?: string;
  receipt_number?: string;
  notes?: string;
}

export function useFuelRecords() {
  const { profile, user } = useAuth();
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFuelRecords = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fuel_records")
        .select(`
          *,
          vehicle:vehicles(prefix, plate)
        `)
        .eq("organization_id", profile.organization_id)
        .order("fuel_date", { ascending: false });

      if (error) throw error;

      setFuelRecords(data as FuelRecord[]);
    } catch (err) {
      setError(err as Error);
      if (import.meta.env.DEV) {
        console.error("Error fetching fuel records:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelRecords();
  }, [profile?.organization_id]);

  const createFuelRecord = async (data: FuelRecordFormData) => {
    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newRecord, error } = await supabase
        .from("fuel_records")
        .insert({
          organization_id: profile.organization_id,
          vehicle_id: data.vehicle_id,
          driver_id: data.driver_id || null,
          trip_id: data.trip_id || null,
          fuel_date: data.fuel_date,
          liters: data.liters,
          price_per_liter: data.price_per_liter,
          total_value: data.total_value,
          odometer: data.odometer,
          fuel_type: data.fuel_type || "diesel",
          gas_station: data.gas_station || null,
          city: data.city || null,
          state: data.state || null,
          payment_method: data.payment_method || null,
          receipt_number: data.receipt_number || null,
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchFuelRecords();
      toast({
        title: "Abastecimento registrado",
        description: "O abastecimento foi registrado com sucesso.",
      });
      return newRecord;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating fuel record:", err);
      }
      toast({
        title: "Erro ao registrar abastecimento",
        description: err.message || "Ocorreu um erro ao registrar o abastecimento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateFuelRecord = async (id: string, data: Partial<FuelRecordFormData>) => {
    try {
      const { data: updatedRecord, error } = await supabase
        .from("fuel_records")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchFuelRecords();
      toast({
        title: "Abastecimento atualizado",
        description: "O abastecimento foi atualizado com sucesso.",
      });
      return updatedRecord;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating fuel record:", err);
      }
      toast({
        title: "Erro ao atualizar abastecimento",
        description: err.message || "Ocorreu um erro ao atualizar o abastecimento.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteFuelRecord = async (id: string) => {
    try {
      const { error } = await supabase.from("fuel_records").delete().eq("id", id);

      if (error) throw error;

      setFuelRecords(fuelRecords.filter((r) => r.id !== id));
      toast({
        title: "Abastecimento excluído",
        description: "O abastecimento foi excluído com sucesso.",
      });
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error deleting fuel record:", err);
      }
      toast({
        title: "Erro ao excluir abastecimento",
        description: err.message || "Ocorreu um erro ao excluir o abastecimento.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calculate stats
  const stats = {
    totalValue: fuelRecords.reduce((acc, r) => acc + Number(r.total_value), 0),
    totalLiters: fuelRecords.reduce((acc, r) => acc + Number(r.liters), 0),
    avgPrice: fuelRecords.length > 0 
      ? fuelRecords.reduce((acc, r) => acc + Number(r.price_per_liter), 0) / fuelRecords.length 
      : 0,
  };

  return {
    fuelRecords,
    loading,
    error,
    stats,
    fetchFuelRecords,
    createFuelRecord,
    updateFuelRecord,
    deleteFuelRecord,
  };
}
