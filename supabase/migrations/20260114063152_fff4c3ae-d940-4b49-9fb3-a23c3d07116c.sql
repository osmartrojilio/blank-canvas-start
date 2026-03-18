-- Fix: Admin users can view phone numbers across all organizations
-- The current policy allows ANY admin to see ALL profiles, violating multi-tenant isolation

-- Drop the vulnerable policy
DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;

-- Create a properly scoped policy where admins can only view profiles in their own organization
CREATE POLICY "Users can view own profile or org admins can view org profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (
    has_role(auth.uid(), 'admin'::app_role)
    AND organization_id = get_user_organization(auth.uid())
  )
);