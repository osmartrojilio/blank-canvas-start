CREATE OR REPLACE FUNCTION public.has_role_in_organization(
  _user_id uuid,
  _organization_id uuid,
  _role public.app_role
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
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
$$;