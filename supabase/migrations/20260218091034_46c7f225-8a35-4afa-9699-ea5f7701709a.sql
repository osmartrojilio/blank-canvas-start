
-- Fix SECURITY DEFINER views by setting them to SECURITY INVOKER
ALTER VIEW public.api_keys_safe SET (security_invoker = on);
ALTER VIEW public.webhook_configs_safe SET (security_invoker = on);
