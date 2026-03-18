-- Create a public view that excludes sensitive fields (phone, is_owner)
-- This view is safe for all organization members to query
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id, 
  organization_id, 
  full_name, 
  avatar_url, 
  created_at, 
  updated_at
FROM public.profiles;

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create new restrictive policy: users can only see their own full profile OR admins can see all
CREATE POLICY "Users can view own profile or admins can view all"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin')
);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;