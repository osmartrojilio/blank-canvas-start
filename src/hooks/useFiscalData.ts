import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface FiscalData {
  id: string;
  organization_id: string;
  ie: string | null;
  im: string | null;
  rntrc: string | null;
  crt: number;
  cfop_padrao: string;
  cst_icms: string;
  aliquota_icms: number;
  zip_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  city_ibge_code: string | null;
  state: string | null;
}

export function useFiscalData() {
  const { profile } = useAuth();
  const [fiscalData, setFiscalData] = useState<FiscalData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFiscalData = async () => {
    if (!profile?.organization_id) { setLoading(false); return; }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("organization_fiscal_data")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      if (error) throw error;
      setFiscalData(data as FiscalData | null);
    } catch (err: any) {
      console.error("Error fetching fiscal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiscalData(); }, [profile?.organization_id]);

  const saveFiscalData = async (data: Partial<FiscalData>) => {
    if (!profile?.organization_id) return false;
    try {
      if (fiscalData) {
        const { error } = await supabase
          .from("organization_fiscal_data")
          .update(data)
          .eq("id", fiscalData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("organization_fiscal_data")
          .insert({ ...data, organization_id: profile.organization_id });
        if (error) throw error;
      }
      await fetchFiscalData();
      toast({ title: "Dados fiscais salvos", description: "Configurações fiscais atualizadas." });
      return true;
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
      return false;
    }
  };

  return { fiscalData, loading, saveFiscalData, fetchFiscalData };
}
