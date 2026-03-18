
-- RPC to delete an organization (platform admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_organization(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;

  -- Remove user roles
  DELETE FROM public.user_roles WHERE organization_id = _org_id;
  -- Remove drivers
  DELETE FROM public.drivers WHERE organization_id = _org_id;
  -- Unlink profiles
  UPDATE public.profiles SET organization_id = NULL, is_owner = false WHERE organization_id = _org_id;
  -- Remove invitations
  DELETE FROM public.invitations WHERE organization_id = _org_id;
  -- Remove notifications
  DELETE FROM public.notifications WHERE organization_id = _org_id;
  -- Remove organization settings
  DELETE FROM public.organization_settings WHERE organization_id = _org_id;
  -- Remove fiscal data
  DELETE FROM public.organization_fiscal_data WHERE organization_id = _org_id;
  -- Remove expenses
  DELETE FROM public.expenses WHERE organization_id = _org_id;
  -- Remove fuel records
  DELETE FROM public.fuel_records WHERE organization_id = _org_id;
  -- Remove maintenance records
  DELETE FROM public.maintenance_records WHERE organization_id = _org_id;
  -- Remove trips
  DELETE FROM public.trips WHERE organization_id = _org_id;
  -- Remove vehicles
  DELETE FROM public.vehicles WHERE organization_id = _org_id;
  -- Remove clients
  DELETE FROM public.clients WHERE organization_id = _org_id;
  -- Remove attachments
  DELETE FROM public.attachments WHERE organization_id = _org_id;
  -- Remove webhook logs and configs
  DELETE FROM public.webhook_logs WHERE organization_id = _org_id;
  DELETE FROM public.webhook_configs WHERE organization_id = _org_id;
  -- Remove API keys
  DELETE FROM public.api_keys WHERE organization_id = _org_id;
  -- Remove integrations
  DELETE FROM public.accounting_integrations WHERE organization_id = _org_id;
  DELETE FROM public.erp_integrations WHERE organization_id = _org_id;
  -- Remove payment events
  DELETE FROM public.payment_events WHERE organization_id = _org_id;
  -- Finally delete the organization
  DELETE FROM public.organizations WHERE id = _org_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC to update organization details (platform admin only)
CREATE OR REPLACE FUNCTION public.admin_update_organization(
  _org_id uuid,
  _name text DEFAULT NULL,
  _subscription_status subscription_status DEFAULT NULL,
  _is_active boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;

  UPDATE public.organizations SET
    name = COALESCE(_name, name),
    subscription_status = COALESCE(_subscription_status, subscription_status),
    is_active = COALESCE(_is_active, is_active),
    updated_at = now()
  WHERE id = _org_id;

  RETURN FOUND;
END;
$$;

-- RPC to remove a user from platform (platform admin only)
CREATE OR REPLACE FUNCTION public.admin_remove_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_org_id uuid;
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Platform admin required';
  END IF;

  -- Cannot remove yourself
  IF auth.uid() = _user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove yourself');
  END IF;

  SELECT organization_id INTO user_org_id FROM public.profiles WHERE id = _user_id;

  -- Remove user role
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  -- Remove driver record
  DELETE FROM public.drivers WHERE profile_id = _user_id;
  -- Unlink vehicles
  UPDATE public.vehicles SET driver_id = NULL WHERE driver_id = _user_id;
  -- Unlink profile from org
  UPDATE public.profiles SET organization_id = NULL, is_owner = false WHERE id = _user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
