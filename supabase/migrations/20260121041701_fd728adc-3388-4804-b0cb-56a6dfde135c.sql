-- ============================================
-- Security Fixes: Restrict access to sensitive data
-- ============================================

-- ============================================
-- FIX 1: Profiles table - Remove overly permissive policy
-- The "Require authentication for profiles access" policy allows any authenticated
-- user to see all profiles. We need to drop it as the other policy already handles
-- proper access control (own profile or org admin viewing org profiles).
-- ============================================
DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;

-- ============================================
-- FIX 2: Invitations table - Remove overly permissive policy
-- The "Deny anonymous access to invitations" policy is poorly named and actually
-- allows any authenticated user to query the invitations table. The email-specific
-- policy already properly restricts access.
-- ============================================
DROP POLICY IF EXISTS "Deny anonymous access to invitations" ON public.invitations;

-- ============================================
-- FIX 3: Drivers table - Create secure view for non-admin users
-- The current SELECT policy exposes salary data to all org users.
-- Solution: Create a view that excludes sensitive fields, update policies to
-- give admins full access but restrict regular users.
-- ============================================

-- First, drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view drivers in their organization" ON public.drivers;

-- Create a secure view that excludes sensitive financial data
CREATE OR REPLACE VIEW public.drivers_public AS
SELECT 
  id,
  profile_id,
  organization_id,
  cnh_number,
  cnh_category,
  cnh_expiry,
  hire_date,
  status,
  emergency_contact,
  emergency_phone,
  notes,
  created_at,
  updated_at
  -- Explicitly excluding: salary
FROM public.drivers;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.drivers_public TO authenticated;

-- Create new policies for the drivers table:
-- 1. Admins can view ALL driver data including salary
CREATE POLICY "Admins can view all driver data"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- 2. Non-admin users can only view non-sensitive columns via the view
-- For the base table, non-admins get no direct SELECT access
-- They must use the drivers_public view instead

-- Note: The "Admins can manage drivers" ALL policy remains for full CRUD by admins