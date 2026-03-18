-- Create a secure function to complete user signup after Google OAuth
CREATE OR REPLACE FUNCTION public.complete_user_signup(
  _organization_name TEXT,
  _cnpj TEXT,
  _whatsapp TEXT,
  _full_name TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  new_org_id UUID;
  org_slug TEXT;
  clean_cnpj TEXT;
BEGIN
  current_user_id := auth.uid();
  
  -- Verify user is authenticated
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User must be authenticated');
  END IF;
  
  -- Validate input lengths
  IF LENGTH(_organization_name) < 2 OR LENGTH(_organization_name) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization name must be between 2 and 100 characters');
  END IF;
  
  -- Clean and validate CNPJ
  clean_cnpj := REGEXP_REPLACE(_cnpj, '[^0-9]', '', 'g');
  IF NOT validate_cnpj(clean_cnpj) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid CNPJ');
  END IF;
  
  -- Check if user already has an organization
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id AND organization_id IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already belongs to an organization');
  END IF;
  
  -- Check if CNPJ already exists
  IF EXISTS (SELECT 1 FROM public.organizations WHERE cnpj = clean_cnpj) THEN
    RETURN jsonb_build_object('success', false, 'error', 'CNPJ already registered');
  END IF;
  
  -- Generate unique slug
  org_slug := LOWER(REGEXP_REPLACE(_organization_name, '[^a-zA-Z0-9]+', '-', 'g'));
  org_slug := TRIM(BOTH '-' FROM org_slug) || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
  org_slug := LEFT(org_slug, 100);
  
  -- Create organization
  INSERT INTO public.organizations (name, slug, cnpj, subscription_status, trial_ends_at)
  VALUES (_organization_name, org_slug, clean_cnpj, 'trialing', NOW() + INTERVAL '14 days')
  RETURNING id INTO new_org_id;
  
  -- Update or create profile
  INSERT INTO public.profiles (id, organization_id, full_name, phone, is_owner)
  VALUES (current_user_id, new_org_id, _full_name, REGEXP_REPLACE(_whatsapp, '[^0-9]', '', 'g'), true)
  ON CONFLICT (id) DO UPDATE SET
    organization_id = new_org_id,
    full_name = COALESCE(_full_name, public.profiles.full_name),
    phone = REGEXP_REPLACE(_whatsapp, '[^0-9]', '', 'g'),
    is_owner = true,
    updated_at = NOW();
  
  -- Create admin role
  INSERT INTO public.user_roles (user_id, organization_id, role)
  VALUES (current_user_id, new_org_id, 'admin')
  ON CONFLICT DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'organization_id', new_org_id,
    'message', 'Organization created successfully'
  );
END;
$$;