-- Update has_role function with caller validation
-- Only allow users to check their own role OR admins to check anyone's role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Allow checking own role
    WHEN _user_id = auth.uid() THEN
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
      )
    -- Allow admins to check anyone's role in their organization
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.organization_id = (
          SELECT organization_id FROM public.profiles WHERE id = _user_id
        )
    ) THEN
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
      )
    -- Deny all other cases
    ELSE FALSE
  END
$$;

-- Update get_user_organization function with caller validation
-- Only allow users to get their own organization OR admins to get anyone's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    -- Allow getting own organization
    WHEN _user_id = auth.uid() THEN
      (SELECT organization_id FROM public.profiles WHERE id = _user_id)
    -- Allow admins to get organization of users in their organization
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
        AND ur.organization_id = (
          SELECT organization_id FROM public.profiles WHERE id = _user_id
        )
    ) THEN
      (SELECT organization_id FROM public.profiles WHERE id = _user_id)
    -- Deny all other cases (return NULL)
    ELSE NULL
  END
$$;