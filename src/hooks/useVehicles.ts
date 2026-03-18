import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Vehicle {
  id: string;
  prefix: string;
  plate: string;
  model: string;
  brand: string | null;
  year: number | null;
  color: string | null;
  fuel_type: string;
  tank_capacity: number | null;
  current_km: number;
  current_hours: number;
  status: "available" | "in_use" | "maintenance" | "inactive";
  driver_id: string | null;
  acquisition_date: string | null;
  acquisition_value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleFormData {
  prefix: string;
  plate: string;
  model: string;
  brand?: string;
  year?: number;
  color?: string;
  fuel_type?: string;
  tank_capacity?: number;
  current_km?: number;
  current_hours?: number;
  status: "available" | "in_use" | "maintenance" | "inactive";
  driver_id?: string;
  acquisition_date?: string;
  acquisition_value?: number;
  notes?: string;
}

export function useVehicles() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("prefix", { ascending: true });

      if (error) throw error;

      setVehicles(data as Vehicle[]);
    } catch (err) {
      setError(err as Error);
      if (import.meta.env.DEV) {
        console.error("Error fetching vehicles:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [profile?.organization_id]);

  const createVehicle = async (data: VehicleFormData) => {
    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newVehicle, error } = await supabase
        .from("vehicles")
        .insert({
          organization_id: profile.organization_id,
          prefix: data.prefix,
          plate: data.plate,
          model: data.model,
          brand: data.brand || null,
          year: data.year || null,
          color: data.color || null,
          fuel_type: data.fuel_type || "diesel",
          tank_capacity: data.tank_capacity || null,
          current_km: data.current_km || 0,
          current_hours: data.current_hours || 0,
          status: data.status,
          driver_id: data.driver_id || null,
          acquisition_date: data.acquisition_date || null,
          acquisition_value: data.acquisition_value || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setVehicles([...vehicles, newVehicle as Vehicle]);
      toast({
        title: "Veículo cadastrado",
        description: `O veículo ${data.prefix} foi cadastrado com sucesso.`,
      });
      return newVehicle;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating vehicle:", err);
      }
      toast({
        title: "Erro ao cadastrar veículo",
        description: err.message || "Ocorreu um erro ao cadastrar o veículo.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateVehicle = async (id: string, data: Partial<VehicleFormData>) => {
    try {
      const { data: updatedVehicle, error } = await supabase
        .from("vehicles")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setVehicles(vehicles.map((v) => (v.id === id ? (updatedVehicle as Vehicle) : v)));
      toast({
        title: "Veículo atualizado",
        description: `O veículo ${data.prefix || ""} foi atualizado com sucesso.`,
      });
      return updatedVehicle;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating vehicle:", err);
      }
      toast({
        title: "Erro ao atualizar veículo",
        description: err.message || "Ocorreu um erro ao atualizar o veículo.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteVehicle = async (id: string, prefix: string) => {
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
      toast({
        title: "Veículo excluído",
        description: `O veículo ${prefix} foi excluído com sucesso.`,
      });
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error deleting vehicle:", err);
      }
      toast({
        title: "Erro ao excluir veículo",
        description: err.message || "Ocorreu um erro ao excluir o veículo.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    vehicles,
    loading,
    error,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
  };
}
