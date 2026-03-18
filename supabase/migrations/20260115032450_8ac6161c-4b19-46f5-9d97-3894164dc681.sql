-- Update handle_new_user function to include input length validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  org_name TEXT;
  org_slug TEXT;
  full_name_val TEXT;
  new_org_id UUID;
BEGIN
  -- Extract metadata from signup
  org_name := NEW.raw_user_meta_data ->> 'organization_name';
  full_name_val := NEW.raw_user_meta_data ->> 'full_name';
  
  -- Only create organization if org_name is provided (new organization signup)
  IF org_name IS NOT NULL AND org_name != '' THEN
    -- Validate lengths to prevent DoS
    IF LENGTH(org_name) > 100 THEN
      RAISE EXCEPTION 'Organization name too long (max 100 characters)';
    END IF;
    
    IF full_name_val IS NOT NULL AND LENGTH(full_name_val) > 100 THEN
      RAISE EXCEPTION 'Full name too long (max 100 characters)';
    END IF;
    
    -- Generate unique slug (input is now validated)
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug) || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
    -- Ensure slug isn't too long
    org_slug := LEFT(org_slug, 100);
    
    -- Create organization
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Create profile linked to organization
    INSERT INTO public.profiles (id, organization_id, full_name, is_owner)
    VALUES (NEW.id, new_org_id, full_name_val, true);
    
    -- Create admin role for the new owner
    INSERT INTO public.user_roles (user_id, organization_id, role)
    VALUES (NEW.id, new_org_id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add column constraints as additional defense layer
ALTER TABLE public.organizations 
  ADD CONSTRAINT check_org_name_length CHECK (LENGTH(name) <= 100);

ALTER TABLE public.profiles 
  ADD CONSTRAINT check_full_name_length CHECK (full_name IS NULL OR LENGTH(full_name) <= 100);