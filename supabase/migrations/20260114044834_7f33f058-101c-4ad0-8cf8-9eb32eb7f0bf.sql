-- Create atomic signup function that handles organization, profile, and role creation
-- This runs as a trigger after auth.users INSERT for atomic transaction handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
    -- Generate unique slug
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug) || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
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

-- Create trigger on auth.users to run after insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();