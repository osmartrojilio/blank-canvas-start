-- Drop the problematic policy that queries auth.users table
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.invitations;

-- Create a new policy using auth.email() which is the safe way to get the current user's email
CREATE POLICY "Users can view invitations for their email"
ON public.invitations
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND lower(email) = lower(auth.email())
);