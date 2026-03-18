-- Update handle_new_user function to include CNPJ and WhatsApp
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
    
    -- Generate unique slug (input is now validated)
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug) || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
    -- Ensure slug isn't too long
    org_slug := LEFT(org_slug, 100);
    
    -- Create organization with CNPJ
    INSERT INTO public.organizations (name, slug, cnpj)
    VALUES (org_name, org_slug, cnpj_val)
    RETURNING id INTO new_org_id;
    
    -- Create profile linked to organization with WhatsApp as phone
    INSERT INTO public.profiles (id, organization_id, full_name, is_owner, phone)
    VALUES (NEW.id, new_org_id, full_name_val, true, whatsapp_val);
    
    -- Create admin role for the new owner
    INSERT INTO public.user_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$function$;