import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type ExpenseType = "maintenance" | "tire" | "toll" | "parts" | "insurance" | "tax" | "fine" | "other";

export interface Expense {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  trip_id: string | null;
  expense_date: string;
  expense_type: ExpenseType;
  description: string;
  supplier: string | null;
  value: number;
  payment_method: string | null;
  invoice_number: string | null;
  due_date: string | null;
  paid_at: string | null;
  status: "pending" | "paid" | "overdue" | "cancelled";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  vehicle?: {
    prefix: string;
    plate: string;
  } | null;
}

export interface ExpenseFormData {
  vehicle_id?: string;
  driver_id?: string;
  trip_id?: string;
  expense_date: string;
  expense_type: ExpenseType;
  description: string;
  supplier?: string;
  value: number;
  payment_method?: string;
  invoice_number?: string;
  due_date?: string;
  paid_at?: string;
  status?: "pending" | "paid" | "overdue" | "cancelled";
  notes?: string;
}

export function useExpenses() {
  const { profile, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExpenses = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          vehicle:vehicles(prefix, plate)
        `)
        .eq("organization_id", profile.organization_id)
        .order("expense_date", { ascending: false });

      if (error) throw error;

      setExpenses(data as Expense[]);
    } catch (err) {
      setError(err as Error);
      if (import.meta.env.DEV) {
        console.error("Error fetching expenses:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [profile?.organization_id]);

  const createExpense = async (data: ExpenseFormData) => {
    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data: newExpense, error } = await supabase
        .from("expenses")
        .insert({
          organization_id: profile.organization_id,
          vehicle_id: data.vehicle_id || null,
          driver_id: data.driver_id || null,
          trip_id: data.trip_id || null,
          expense_date: data.expense_date,
          expense_type: data.expense_type,
          description: data.description,
          supplier: data.supplier || null,
          value: data.value,
          payment_method: data.payment_method || null,
          invoice_number: data.invoice_number || null,
          due_date: data.due_date || null,
          paid_at: data.paid_at || null,
          status: data.status || "pending",
          notes: data.notes || null,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchExpenses();
      toast({
        title: "Despesa registrada",
        description: "A despesa foi registrada com sucesso.",
      });
      return newExpense;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating expense:", err);
      }
      toast({
        title: "Erro ao registrar despesa",
        description: err.message || "Ocorreu um erro ao registrar a despesa.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateExpense = async (id: string, data: Partial<ExpenseFormData>) => {
    try {
      const { data: updatedExpense, error } = await supabase
        .from("expenses")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      await fetchExpenses();
      toast({
        title: "Despesa atualizada",
        description: "A despesa foi atualizada com sucesso.",
      });
      return updatedExpense;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error updating expense:", err);
      }
      toast({
        title: "Erro ao atualizar despesa",
        description: err.message || "Ocorreu um erro ao atualizar a despesa.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;

      setExpenses(expenses.filter((e) => e.id !== id));
      toast({
        title: "Despesa excluída",
        description: "A despesa foi excluída com sucesso.",
      });
      return true;
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error deleting expense:", err);
      }
      toast({
        title: "Erro ao excluir despesa",
        description: err.message || "Ocorreu um erro ao excluir a despesa.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calculate stats by type
  const statsByType = expenses.reduce((acc, e) => {
    acc[e.expense_type] = (acc[e.expense_type] || 0) + Number(e.value);
    return acc;
  }, {} as Record<ExpenseType, number>);

  const stats = {
    total: expenses.reduce((acc, e) => acc + Number(e.value), 0),
    byType: statsByType,
  };

  return {
    expenses,
    loading,
    error,
    stats,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
