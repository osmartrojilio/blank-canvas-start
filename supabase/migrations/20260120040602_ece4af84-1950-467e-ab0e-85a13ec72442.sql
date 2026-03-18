-- Fix: Replace overly permissive invitation viewing policy
-- The old policy allows ANYONE to view ALL invitations, exposing emails and tokens

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a more secure policy that only allows viewing when using accept_invitation function
-- Users cannot directly query the invitations table without providing a valid token through the RPC
-- The accept_invitation function uses SECURITY DEFINER so it can access the table

-- Allow authenticated users to view invitations matching their email (for pending invitations UI)
CREATE POLICY "Users can view invitations for their email"
ON public.invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
);