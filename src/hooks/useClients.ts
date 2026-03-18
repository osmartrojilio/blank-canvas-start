import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Client {
  id: string;
  organization_id: string;
  client_type: "sender" | "receiver" | "both";
  name: string;
  trade_name: string | null;
  cpf_cnpj: string;
  ie: string | null;
  email: string | null;
  phone: string | null;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  city_ibge_code: string | null;
  state: string | null;
  country_code: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  client_type: string;
  name: string;
  trade_name?: string;
  cpf_cnpj: string;
  ie?: string;
  email?: string;
  phone?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  city_ibge_code?: string;
  state?: string;
  notes?: string;
}

export function useClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!profile?.organization_id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("name");
      if (error) throw error;
      setClients(data as Client[]);
    } catch (err: any) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [profile?.organization_id]);

  const createClient = async (data: ClientFormData) => {
    if (!profile?.organization_id) return null;
    try {
      const { data: newClient, error } = await supabase
        .from("clients")
        .insert({ ...data, organization_id: profile.organization_id })
        .select()
        .single();
      if (error) throw error;
      await fetchClients();
      toast({ title: "Cliente cadastrado", description: "Cliente salvo com sucesso." });
      return newClient;
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar cliente", description: err.message, variant: "destructive" });
      return null;
    }
  };

  const updateClient = async (id: string, data: Partial<ClientFormData>) => {
    try {
      const { error } = await supabase.from("clients").update(data).eq("id", id);
      if (error) throw error;
      await fetchClients();
      toast({ title: "Cliente atualizado", description: "Dados atualizados com sucesso." });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
      setClients(clients.filter(c => c.id !== id));
      toast({ title: "Cliente excluído" });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { clients, loading, fetchClients, createClient, updateClient, deleteClient };
}
