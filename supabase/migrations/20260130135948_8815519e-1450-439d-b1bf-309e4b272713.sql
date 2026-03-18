-- Add CNPJ validation function with checksum verification
CREATE OR REPLACE FUNCTION public.validate_cnpj(cnpj TEXT) 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
IMMUTABLE STRICT
SET search_path = public
AS $$
DECLARE
  clean_cnpj TEXT;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  digit1 INTEGER;
  digit2 INTEGER;
  weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
  weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
  i INTEGER;
BEGIN
  -- Remove non-digits
  clean_cnpj := REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g');
  
  -- Must be exactly 14 digits
  IF LENGTH(clean_cnpj) != 14 THEN
    RETURN FALSE;
  END IF;
  
  -- Reject known invalid patterns (all same digit)
  IF clean_cnpj ~ '^(\d)\1{13}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate first check digit
  FOR i IN 1..12 LOOP
    sum1 := sum1 + (SUBSTRING(clean_cnpj, i, 1)::INTEGER * weights1[i]);
  END LOOP;
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN digit1 := 0; END IF;
  
  -- Verify first digit
  IF digit1 != SUBSTRING(clean_cnpj, 13, 1)::INTEGER THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate second check digit
  FOR i IN 1..13 LOOP
    sum2 := sum2 + (SUBSTRING(clean_cnpj, i, 1)::INTEGER * weights2[i]);
  END LOOP;
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN digit2 := 0; END IF;
  
  -- Verify second digit
  RETURN digit2 = SUBSTRING(clean_cnpj, 14, 1)::INTEGER;
END;
$$;

-- Update handle_new_user() function to include CNPJ checksum validation
-- This enforces validation on NEW signups without affecting existing data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Add unique index on CNPJ to prevent duplicates (if not exists)
-- This doesn't require existing data to be valid, just unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_cnpj_unique 
ON public.organizations(cnpj) 
WHERE cnpj IS NOT NULL;