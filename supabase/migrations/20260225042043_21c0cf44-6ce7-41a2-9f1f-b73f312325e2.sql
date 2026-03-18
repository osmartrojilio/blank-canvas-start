-- Fix: Remove SET row_security = off from has_role_in_organization functions
-- SECURITY DEFINER with superuser owner already bypasses RLS; explicit disable is unnecessary risk

-- Recreate the app_role overload without row_security = off
CREATE OR REPLACE FUNCTION public.has_role_in_organization(
  _user_id uuid,
  _organization_id uuid,
  _role app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN FALSE
    WHEN auth.uid() <> _user_id THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND organization_id = _organization_id
        AND role = _role
    )
  END
$function$;

-- Recreate the text overload without row_security = off
CREATE OR REPLACE FUNCTION public.has_role_in_organization(
  _user_id uuid,
  _organization_id uuid,
  _role text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  IF auth.uid() <> _user_id THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role = _role::public.app_role
  );
END;
$function$;