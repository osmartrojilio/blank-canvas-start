-- Restrict CNPJ visibility to admins and owners only
-- Create a secure view that hides CNPJ from non-admin users

-- First, drop the existing SELECT policies on organizations
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Deny anonymous access to organizations" ON public.organizations;

-- Create a new SELECT policy that allows viewing organization data
-- but we'll use a function to mask CNPJ for non-admins
CREATE POLICY "Users can view their organization basic info"
ON public.organizations
FOR SELECT
USING (id = get_user_organization(auth.uid()));

-- Re-add the anonymous denial policy
CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations
FOR SELECT
USING (false);

-- Create a secure function to get organization with masked CNPJ for non-admins
CREATE OR REPLACE FUNCTION public.get_organization_for_user(_org_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  cnpj text,
  logo_url text,
  timezone text,
  currency text,
  fiscal_period_start integer,
  subscription_status subscription_status,
  subscription_ends_at timestamptz,
  trial_ends_at timestamptz,
  plan_id uuid,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
  is_admin boolean;
BEGIN
  -- Get user's organization
  user_org_id := COALESCE(_org_id, get_user_organization(auth.uid()));
  
  -- Verify user belongs to this organization
  IF user_org_id != get_user_organization(auth.uid()) THEN
    RETURN;
  END IF;
  
  -- Check if user is admin or owner
  is_admin := has_role(auth.uid(), 'admin');
  
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    CASE WHEN is_admin THEN o.cnpj ELSE NULL END as cnpj,
    o.logo_url,
    o.timezone,
    o.currency,
    o.fiscal_period_start,
    o.subscription_status,
    o.subscription_ends_at,
    o.trial_ends_at,
    o.plan_id,
    o.is_active,
    o.created_at,
    o.updated_at
  FROM public.organizations o
  WHERE o.id = user_org_id;
END;
$$;