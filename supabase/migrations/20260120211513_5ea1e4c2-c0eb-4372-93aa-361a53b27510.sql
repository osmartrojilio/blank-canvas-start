-- First drop the function that depends on the view
DROP FUNCTION IF EXISTS public.get_all_organizations_for_admin();

-- Now drop the view
DROP VIEW IF EXISTS public.admin_organizations_view;

-- Recreate get_all_organizations_for_admin as a standalone function
CREATE OR REPLACE FUNCTION public.get_all_organizations_for_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  logo_url TEXT,
  subscription_status subscription_status,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  plan_name TEXT,
  price_monthly NUMERIC,
  user_count BIGINT,
  admin_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;
  
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.logo_url,
    o.subscription_status,
    o.is_active,
    o.created_at,
    o.trial_ends_at,
    o.subscription_ends_at,
    sp.name as plan_name,
    sp.price_monthly,
    (SELECT COUNT(*) FROM public.profiles p WHERE p.organization_id = o.id) as user_count,
    (SELECT COUNT(*) FROM public.user_roles ur WHERE ur.organization_id = o.id AND ur.role = 'admin') as admin_count
  FROM public.organizations o
  LEFT JOIN public.subscription_plans sp ON o.plan_id = sp.id;
END;
$$;