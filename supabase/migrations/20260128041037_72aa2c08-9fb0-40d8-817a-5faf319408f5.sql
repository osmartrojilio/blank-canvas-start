-- Fix: Replace overly permissive notifications INSERT policy
-- The trigger function notify_invitation_accepted() is SECURITY DEFINER and bypasses RLS,
-- so we can remove the permissive policy and add a proper admin-only policy for direct inserts

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a proper policy that validates organization membership for direct inserts
-- The SECURITY DEFINER trigger will still work because it bypasses RLS
CREATE POLICY "Admins can insert notifications in their org"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND organization_id = get_user_organization(auth.uid())
  AND has_role(auth.uid(), 'admin')
);