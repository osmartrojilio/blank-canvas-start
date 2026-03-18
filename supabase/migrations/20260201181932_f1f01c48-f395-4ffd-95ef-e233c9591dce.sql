-- Fix: Restrict driver personal data access to admins, managers, and the driver themselves
-- Issue: Any org user can currently view all driver CNH numbers, emergency contacts, etc.

-- Step 1: Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view drivers in their organization" ON public.drivers;

-- Step 2: Create a new restrictive policy that allows:
-- - Admins: can view all drivers in their organization (for management)
-- - Managers: can view all drivers in their organization (for operations)
-- - Drivers: can only view their own driver record (privacy)
CREATE POLICY "Restricted driver data access"
ON public.drivers
FOR SELECT
USING (
  organization_id = get_user_organization(auth.uid())
  AND (
    -- Admins and managers can view all drivers
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
    -- Drivers can only view their own record
    OR profile_id = auth.uid()
  )
);