-- Create organization_settings table for flexible key-value configuration
CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Enable RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their organization's settings
CREATE POLICY "Users can view their organization settings"
ON public.organization_settings
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

-- Policy: Only admins can modify settings
CREATE POLICY "Admins can manage organization settings"
ON public.organization_settings
FOR ALL
USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_organization_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_organization_settings_org_key ON public.organization_settings(organization_id, key);

-- Add CNPJ and timezone columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS fiscal_period_start INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;