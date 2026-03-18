-- Add explicit policy to deny anonymous access to profiles table
-- This prevents unauthenticated users from reading sensitive user data (phone, full_name)

CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- Also add protection to organizations and user_roles for consistency
CREATE POLICY "Deny anonymous access to organizations"
ON public.organizations FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles FOR SELECT
TO anon
USING (false);