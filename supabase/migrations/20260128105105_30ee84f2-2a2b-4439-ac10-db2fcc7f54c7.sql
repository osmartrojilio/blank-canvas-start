-- Fix get_all_users_for_admin function to cast email to text
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
 RETURNS TABLE(id uuid, email text, full_name text, phone text, organization_id uuid, organization_name text, role text, is_owner boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    u.email::text,
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
$function$;