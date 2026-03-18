-- Fix the drivers_public view to use SECURITY INVOKER (the safe option)
-- This ensures the view respects the RLS policies of the querying user

DROP VIEW IF EXISTS public.drivers_public;

CREATE VIEW public.drivers_public 
WITH (security_invoker = true) AS
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
  d.created_at,
  d.updated_at
  -- Explicitly excluding: salary
FROM public.drivers d
WHERE d.organization_id = get_user_organization(auth.uid());

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.drivers_public TO authenticated;

-- Also need to add a policy for non-admins to access the drivers table
-- through the view (the view itself enforces org isolation and excludes salary)
CREATE POLICY "Non-admins can view drivers via view"
ON public.drivers
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid())
);