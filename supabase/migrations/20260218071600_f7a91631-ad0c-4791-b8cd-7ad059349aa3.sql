
-- RPC to remove a user from the organization (admin only)
CREATE OR REPLACE FUNCTION public.remove_user_from_organization(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  user_org_id UUID;
  target_org_id UUID;
  target_is_owner BOOLEAN;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User must be authenticated');
  END IF;
  
  -- Cannot remove yourself
  IF current_user_id = _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove yourself from the organization');
  END IF;
  
  -- Get caller's organization
  user_org_id := get_user_organization(current_user_id);
  
  IF user_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;
  
  -- Check caller is admin
  IF NOT has_role(current_user_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can remove users');
  END IF;
  
  -- Check target user belongs to same organization
  SELECT organization_id, is_owner INTO target_org_id, target_is_owner
  FROM public.profiles WHERE id = _user_id;
  
  IF target_org_id IS NULL OR target_org_id != user_org_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found in your organization');
  END IF;
  
  -- Cannot remove the owner
  IF target_is_owner THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the organization owner');
  END IF;
  
  -- Remove user role
  DELETE FROM public.user_roles WHERE user_id = _user_id AND organization_id = user_org_id;
  
  -- Remove driver record if exists
  DELETE FROM public.drivers WHERE profile_id = _user_id AND organization_id = user_org_id;
  
  -- Unlink vehicles assigned to this user
  UPDATE public.vehicles SET driver_id = NULL WHERE driver_id = _user_id AND organization_id = user_org_id;
  
  -- Remove profile organization link
  UPDATE public.profiles SET organization_id = NULL, is_owner = false WHERE id = _user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$function$;
