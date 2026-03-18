
-- 1. Create check_cnpj_available RPC (SECURITY DEFINER, callable by anon)
CREATE OR REPLACE FUNCTION public.check_cnpj_available(p_cnpj TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE cnpj = REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g')
  );
$$;

-- Grant execute to anon and authenticated so unauthenticated users can call it
GRANT EXECUTE ON FUNCTION public.check_cnpj_available(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.check_cnpj_available(TEXT) TO authenticated;

-- 2. Update handle_new_user trigger to handle unique_violation gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  org_name TEXT;
  org_slug TEXT;
  full_name_val TEXT;
  cnpj_val TEXT;
  whatsapp_val TEXT;
  new_org_id UUID;
BEGIN
  -- Extract metadata from signup
  org_name := NEW.raw_user_meta_data ->> 'organization_name';
  full_name_val := NEW.raw_user_meta_data ->> 'full_name';
  cnpj_val := NEW.raw_user_meta_data ->> 'cnpj';
  whatsapp_val := NEW.raw_user_meta_data ->> 'whatsapp';
  
  -- Only create organization if org_name is provided (new organization signup)
  IF org_name IS NOT NULL AND org_name != '' THEN
    -- Validate lengths to prevent DoS
    IF LENGTH(org_name) > 100 THEN
      RAISE EXCEPTION 'Organization name too long (max 100 characters)';
    END IF;
    
    IF full_name_val IS NOT NULL AND LENGTH(full_name_val) > 100 THEN
      RAISE EXCEPTION 'Full name too long (max 100 characters)';
    END IF;
    
    -- Validate CNPJ length
    IF cnpj_val IS NOT NULL AND LENGTH(cnpj_val) > 14 THEN
      RAISE EXCEPTION 'CNPJ too long (max 14 characters)';
    END IF;
    
    -- Validate CNPJ format and checksum (backend enforcement)
    IF cnpj_val IS NOT NULL AND NOT validate_cnpj(cnpj_val) THEN
      RAISE EXCEPTION 'Invalid CNPJ format or checksum';
    END IF;
    
    -- Generate unique slug (input is now validated)
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug) || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
    -- Ensure slug isn't too long
    org_slug := LEFT(org_slug, 100);
    
    -- Create organization with CNPJ (with unique_violation handling)
    BEGIN
      INSERT INTO public.organizations (name, slug, cnpj)
      VALUES (org_name, org_slug, cnpj_val)
      RETURNING id INTO new_org_id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE EXCEPTION 'CNPJ already registered';
    END;
    
    -- Create profile linked to organization with WhatsApp as phone
    INSERT INTO public.profiles (id, organization_id, full_name, is_owner, phone)
    VALUES (NEW.id, new_org_id, full_name_val, true, whatsapp_val);
    
    -- Create admin role for the new owner
    INSERT INTO public.user_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'admin');
  ELSE
    -- For OAuth users without org data, create a basic profile
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'))
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;
