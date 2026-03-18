import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface MaintenanceRecord {
  id: string;
  organization_id: string;
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  status: string | null;
  entry_date: string;
  exit_date: string | null;
  entry_km: number | null;
  exit_km: number | null;
  service_provider: string | null;
  parts_cost: number | null;
  labor_cost: number | null;
  total_cost: number | null;
  next_maintenance_date: string | null;
  next_maintenance_km: number | null;
  notes: string | null;
  expense_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    prefix: string;
    plate: string;
    model: string;
  };
}

export interface MaintenanceFormData {
  vehicle_id: string;
  maintenance_type: string;
  description: string;
  status?: string;
  entry_date: string;
  exit_date?: string;
  entry_km?: number;
  exit_km?: number;
  service_provider?: string;
  parts_cost?: number;
  labor_cost?: number;
  total_cost?: number;
  next_maintenance_date?: string;
  next_maintenance_km?: number;
  notes?: string;
}

export function useMaintenanceRecords() {
  const { profile, user } = useAuth();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("maintenance_records")
        .select(`
          *,
          vehicle:vehicles(prefix, plate, model)
        `)
        .eq("organization_id", profile.organization_id)
        .order("entry_date", { ascending: false });

      if (error) throw error;
      setRecords(data as MaintenanceRecord[]);
    } catch (err) {
      if (import.meta.env.DEV) console.error("Error fetching maintenance records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [profile?.organization_id]);

  const createRecord = async (data: MaintenanceFormData) => {
    if (!profile?.organization_id) {
      toast({ title: "Erro", description: "Organização não encontrada", variant: "destructive" });
      return null;
    }

    try {
      const { data: newRecord, error } = await supabase
        .from("maintenance_records")
        .insert({
          organization_id: profile.organization_id,
          vehicle_id: data.vehicle_id,
          maintenance_type: data.maintenance_type,
          description: data.description,
          status: data.status || "scheduled",
          entry_date: data.entry_date,
          exit_date: data.exit_date || null,
          entry_km: data.entry_km || null,
          exit_km: data.exit_km || null,
          service_provider: data.service_provider || null,
          parts_cost: data.parts_cost || 0,
          labor_cost: data.labor_cost || 0,
          total_cost: data.total_cost || 0,
          next_maintenance_date: data.next_maintenance_date || null,
          next_maintenance_km: data.next_maintenance_km || null,
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRecords();
      toast({ title: "Manutenção registrada", description: "A manutenção foi registrada com sucesso." });
      return newRecord;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("Error creating maintenance record:", err);
      toast({ title: "Erro ao registrar manutenção", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateRecord = async (id: string, data: Partial<MaintenanceFormData>) => {
    try {
      const { data: updated, error } = await supabase
        .from("maintenance_records")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchRecords();
      toast({ title: "Manutenção atualizada", description: "A manutenção foi atualizada com sucesso." });
      return updated;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("Error updating maintenance record:", err);
      toast({ title: "Erro ao atualizar manutenção", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from("maintenance_records").delete().eq("id", id);
      if (error) throw error;

      setRecords(records.filter((r) => r.id !== id));
      toast({ title: "Manutenção excluída", description: "A manutenção foi excluída com sucesso." });
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("Error deleting maintenance record:", err);
      toast({ title: "Erro ao excluir manutenção", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const stats = {
    total: records.length,
    scheduled: records.filter((r) => r.status === "scheduled").length,
    inProgress: records.filter((r) => r.status === "in_progress").length,
    completed: records.filter((r) => r.status === "completed").length,
    totalCost: records.reduce((acc, r) => acc + Number(r.total_cost || 0), 0),
  };

  return { records, loading, stats, fetchRecords, createRecord, updateRecord, deleteRecord };
}
