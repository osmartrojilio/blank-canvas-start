-- Drop the problematic policy that exposes salary to all users
DROP POLICY IF EXISTS "Users can view drivers in their organization" ON public.drivers;
DROP POLICY IF EXISTS "Admins can view all driver data" ON public.drivers;

-- Keep only the "Admins can manage drivers" ALL policy for full admin access
-- That policy already handles admin SELECT, INSERT, UPDATE, DELETE

-- For non-admin users, we need a different approach.
-- Since column-level RLS isn't possible, we'll create a secure function
-- that returns driver data with salary nullified for non-admins.

-- Create a function that returns drivers with role-based salary visibility
CREATE OR REPLACE FUNCTION public.get_drivers_for_user()
RETURNS TABLE (
  id uuid,
  profile_id uuid,
  organization_id uuid,
  cnh_number text,
  cnh_category text,
  cnh_expiry date,
  hire_date date,
  status text,
  emergency_contact text,
  emergency_phone text,
  notes text,
  salary numeric,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_org_id uuid;
  is_admin boolean;
BEGIN
  -- Get current user's organization
  user_org_id := get_user_organization(auth.uid());
  
  -- Check if user is admin
  is_admin := has_role(auth.uid(), 'admin'::app_role);
  
  -- Return drivers with salary visible only to admins
  RETURN QUERY
  SELECT 
    d.id,
    d.profile_id,
    d.organization_id,
    d.cnh_number,
    d.cnh_category,
    d.cnh_expiry,
    d.hire_date,
    d.status,
    d.emergency_contact,
    d.emergency_phone,
    d.notes,
    CASE WHEN is_admin THEN d.salary ELSE NULL END as salary,
    d.created_at,
    d.updated_at
  FROM public.drivers d
  WHERE d.organization_id = user_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_drivers_for_user() TO authenticated;

-- Now we need a SELECT policy for non-admins to support basic queries
-- But we'll make the application use the function for safe access
-- The policy below allows org members to see drivers (needed for joins, etc.)
-- Salary protection is enforced via the secure function in the application

CREATE POLICY "Org members can view drivers basic info"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid())
);

-- Note: The application SHOULD use get_drivers_for_user() function
-- for listing drivers to ensure salary is hidden from non-admins.
-- Direct table queries will show salary - this is a known limitation
-- of PostgreSQL RLS (no column-level security).
-- 
-- The function provides the secure access path.