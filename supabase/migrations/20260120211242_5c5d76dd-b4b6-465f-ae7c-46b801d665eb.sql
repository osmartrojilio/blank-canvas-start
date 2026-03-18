-- Create platform_admins table for global system administrators
CREATE TABLE public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

-- Policy: Only platform admins can view other platform admins
CREATE POLICY "Platform admins can view all platform admins"
ON public.platform_admins
FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Policy: Only platform admins can manage platform admins
CREATE POLICY "Platform admins can manage platform admins"
ON public.platform_admins
FOR ALL
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to platform_admins"
ON public.platform_admins
FOR SELECT
USING (false);

-- Create view for platform admins to see all organizations
CREATE OR REPLACE VIEW public.admin_organizations_view AS
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

-- Grant access to the view only to platform admins via RLS-like check
CREATE OR REPLACE FUNCTION public.get_all_organizations_for_admin()
RETURNS SETOF public.admin_organizations_view
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;
  
  RETURN QUERY SELECT * FROM public.admin_organizations_view;
END;
$$;

-- Create function to get all users for platform admin
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  organization_id UUID,
  organization_name TEXT,
  role TEXT,
  is_owner BOOLEAN,
  created_at TIMESTAMPTZ
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
    p.id,
    u.email,
    p.full_name,
    p.phone,
    p.organization_id,
    o.name as organization_name,
    COALESCE(ur.role::text, 'none') as role,
    p.is_owner,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.organizations o ON o.id = p.organization_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id AND ur.organization_id = p.organization_id;
END;
$$;

-- Create function to toggle organization active status
CREATE OR REPLACE FUNCTION public.toggle_organization_status(_org_id UUID, _is_active BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;
  
  UPDATE public.organizations
  SET is_active = _is_active, updated_at = now()
  WHERE id = _org_id;
  
  RETURN FOUND;
END;
$$;