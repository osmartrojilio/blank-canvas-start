-- Fix 1: Add explicit deny anonymous access policy for invitations table
-- This ensures unauthenticated users cannot access invitation emails/tokens
CREATE POLICY "Deny anonymous access to invitations"
ON public.invitations
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2: Drop the current "Deny anonymous access to profiles" policy
-- which uses USING (false) - this is incorrect as it blocks everyone including authenticated users
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;

-- Create a proper RESTRICTIVE policy that requires authentication
-- This ensures only authenticated users can access profiles
CREATE POLICY "Require authentication for profiles access"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() IS NOT NULL);