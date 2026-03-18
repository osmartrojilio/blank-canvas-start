import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Types
export interface WebhookConfig {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  organization_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string;
  success: boolean;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ErpIntegration {
  id: string;
  organization_id: string;
  provider: string;
  api_endpoint: string | null;
  sync_vehicles: boolean;
  sync_trips: boolean;
  sync_expenses: boolean;
  sync_fuel: boolean;
  last_sync_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountingIntegration {
  id: string;
  organization_id: string;
  provider: string;
  api_endpoint: string | null;
  export_format: string;
  auto_export: boolean;
  export_day: number | null;
  last_export_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Webhooks hooks
export function useWebhooks() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["webhooks", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_configs_safe" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as WebhookConfig[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useWebhookLogs(webhookId?: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["webhook-logs", profile?.organization_id, webhookId],
    queryFn: async () => {
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("delivered_at", { ascending: false })
        .limit(50);

      if (webhookId) {
        query = query.eq("webhook_id", webhookId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WebhookLog[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (webhook: { name: string; url: string; events: string[] }) => {
      const { data, error } = await supabase
        .from("webhook_configs")
        .insert({
          organization_id: profile!.organization_id!,
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook criado com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar webhook");
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<WebhookConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from("webhook_configs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar webhook");
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhook_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook removido");
    },
    onError: () => {
      toast.error("Erro ao remover webhook");
    },
  });
}

// API Keys hooks
export function useApiKeys() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["api-keys", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys_safe" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ApiKey[];
    },
    enabled: !!profile?.organization_id,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      scopes: string[];
      expires_in_days?: number;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "create",
            ...params,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create API key");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Chave de API criada com sucesso");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar chave de API");
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-keys`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "revoke",
            key_id: keyId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke API key");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("Chave de API revogada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao revogar chave");
    },
  });
}

// ERP Integration hooks
export function useErpIntegration() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["erp-integration", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("erp_integrations")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ErpIntegration | null;
    },
    enabled: !!profile?.organization_id,
  });
}

export function useUpsertErpIntegration() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<ErpIntegration> & { provider: string }) => {
      const { data: result, error } = await supabase
        .from("erp_integrations")
        .upsert({
          organization_id: profile!.organization_id!,
          provider: data.provider,
          api_endpoint: data.api_endpoint,
          sync_vehicles: data.sync_vehicles ?? true,
          sync_trips: data.sync_trips ?? true,
          sync_expenses: data.sync_expenses ?? true,
          sync_fuel: data.sync_fuel ?? true,
          is_active: data.is_active ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["erp-integration"] });
      toast.success("Integração ERP atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar integração ERP");
    },
  });
}

// Accounting Integration hooks
export function useAccountingIntegration() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ["accounting-integration", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_integrations")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as AccountingIntegration | null;
    },
    enabled: !!profile?.organization_id,
  });
}

export function useUpsertAccountingIntegration() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<AccountingIntegration> & { provider: string }) => {
      const { data: result, error } = await supabase
        .from("accounting_integrations")
        .upsert({
          organization_id: profile!.organization_id!,
          provider: data.provider,
          api_endpoint: data.api_endpoint,
          export_format: data.export_format ?? "csv",
          auto_export: data.auto_export ?? false,
          export_day: data.export_day ?? 1,
          is_active: data.is_active ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounting-integration"] });
      toast.success("Integração contábil atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar integração contábil");
    },
  });
}

// Available events for webhooks
export const WEBHOOK_EVENTS = [
  { value: "vehicle.created", label: "Veículo criado" },
  { value: "vehicle.updated", label: "Veículo atualizado" },
  { value: "vehicle.deleted", label: "Veículo removido" },
  { value: "trip.created", label: "Viagem criada" },
  { value: "trip.started", label: "Viagem iniciada" },
  { value: "trip.completed", label: "Viagem concluída" },
  { value: "expense.created", label: "Despesa criada" },
  { value: "expense.paid", label: "Despesa paga" },
  { value: "fuel.recorded", label: "Abastecimento registrado" },
  { value: "maintenance.scheduled", label: "Manutenção agendada" },
  { value: "maintenance.completed", label: "Manutenção concluída" },
];

// ERP providers
export const ERP_PROVIDERS = [
  { value: "sap", label: "SAP" },
  { value: "totvs", label: "TOTVS" },
  { value: "oracle", label: "Oracle ERP" },
  { value: "sankhya", label: "Sankhya" },
  { value: "senior", label: "Senior Sistemas" },
  { value: "custom", label: "API Personalizada" },
];

// Accounting providers
export const ACCOUNTING_PROVIDERS = [
  { value: "contaazul", label: "Conta Azul" },
  { value: "dominio", label: "Domínio Sistemas" },
  { value: "alterdata", label: "Alterdata" },
  { value: "fortes", label: "Fortes" },
  { value: "custom", label: "Exportação Manual" },
];
