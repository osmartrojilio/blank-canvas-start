-- Table for webhook configurations
CREATE TABLE public.webhook_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for webhook delivery logs
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhook_configs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Table for API keys
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{"read"}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for ERP integrations
CREATE TABLE public.erp_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  sync_vehicles BOOLEAN NOT NULL DEFAULT true,
  sync_trips BOOLEAN NOT NULL DEFAULT true,
  sync_expenses BOOLEAN NOT NULL DEFAULT true,
  sync_fuel BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Accounting integrations
CREATE TABLE public.accounting_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  export_format TEXT NOT NULL DEFAULT 'csv',
  auto_export BOOLEAN NOT NULL DEFAULT false,
  export_day INTEGER DEFAULT 1,
  last_export_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for webhook_configs
CREATE POLICY "Admins can manage webhooks"
  ON public.webhook_configs
  FOR ALL
  USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- RLS policies for webhook_logs
CREATE POLICY "Admins can view webhook logs"
  ON public.webhook_logs
  FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- RLS policies for api_keys
CREATE POLICY "Admins can manage API keys"
  ON public.api_keys
  FOR ALL
  USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- RLS policies for erp_integrations
CREATE POLICY "Admins can manage ERP integration"
  ON public.erp_integrations
  FOR ALL
  USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- RLS policies for accounting_integrations
CREATE POLICY "Admins can manage accounting integration"
  ON public.accounting_integrations
  FOR ALL
  USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON public.webhook_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_erp_integrations_updated_at
  BEFORE UPDATE ON public.erp_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounting_integrations_updated_at
  BEFORE UPDATE ON public.accounting_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for API key lookup
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix) WHERE is_active = true;