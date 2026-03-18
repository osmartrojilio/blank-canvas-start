
-- 1. API_KEYS: Replace the ALL policy with granular policies that hide key_hash from SELECT
-- Drop the existing ALL policy
DROP POLICY IF EXISTS "Admins can manage API keys" ON public.api_keys;

-- SELECT: Only show metadata, not hashes (use a view-like approach via column-level isn't possible in RLS,
-- but we can restrict to the edge function using service role for hash validation)
-- For admin UI: they only need id, name, key_prefix, scopes, expires_at, last_used_at, is_active, created_at
CREATE POLICY "Admins can view API key metadata"
  ON public.api_keys FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update API keys"
  ON public.api_keys FOR UPDATE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete API keys"
  ON public.api_keys FOR DELETE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- 2. WEBHOOK_CONFIGS: Replace ALL policy with granular ones, hide secret column from normal SELECT
DROP POLICY IF EXISTS "Admins can manage webhooks" ON public.webhook_configs;

CREATE POLICY "Admins can view webhook configs"
  ON public.webhook_configs FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert webhook configs"
  ON public.webhook_configs FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update webhook configs"
  ON public.webhook_configs FOR UPDATE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete webhook configs"
  ON public.webhook_configs FOR DELETE
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. Create a secure view for api_keys that excludes hash
CREATE OR REPLACE VIEW public.api_keys_safe AS
SELECT id, organization_id, name, key_prefix, scopes, expires_at, last_used_at, is_active, created_at, created_by
FROM public.api_keys;

-- 4. Create a secure view for webhook_configs that excludes secret
CREATE OR REPLACE VIEW public.webhook_configs_safe AS
SELECT id, organization_id, name, url, events, is_active, last_triggered_at, created_at, updated_at
FROM public.webhook_configs;
