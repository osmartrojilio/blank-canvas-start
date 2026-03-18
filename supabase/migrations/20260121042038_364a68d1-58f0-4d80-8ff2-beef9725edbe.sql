-- ============================================
-- Move salary to a separate admin-only table for true column-level protection
-- This ensures salary data can ONLY be accessed by admins at the database level
-- ============================================

-- Drop the policy that exposes all driver data
DROP POLICY IF EXISTS "Org members can view drivers basic info" ON public.drivers;

-- Create a new table for sensitive driver financial data (admin-only)
CREATE TABLE public.driver_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  salary numeric,
  effective_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(driver_id)
);

-- Enable RLS on the salaries table
ALTER TABLE public.driver_salaries ENABLE ROW LEVEL SECURITY;

-- Only admins can access salary data - strict policy
CREATE POLICY "Only admins can access driver salaries"
ON public.driver_salaries
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = driver_salaries.driver_id
      AND d.organization_id = get_user_organization(auth.uid())
      AND has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.id = driver_salaries.driver_id
      AND d.organization_id = get_user_organization(auth.uid())
      AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Migrate existing salary data to the new table
INSERT INTO public.driver_salaries (driver_id, salary)
SELECT id, salary FROM public.drivers WHERE salary IS NOT NULL;

-- Remove the salary column from the drivers table
ALTER TABLE public.drivers DROP COLUMN IF EXISTS salary;

-- Now recreate a clean SELECT policy for drivers (no salary column exists anymore)
CREATE POLICY "Users can view drivers in their organization"
ON public.drivers
FOR SELECT
TO authenticated
USING (organization_id = get_user_organization(auth.uid()));

-- Add trigger for updated_at on driver_salaries
CREATE TRIGGER update_driver_salaries_updated_at
  BEFORE UPDATE ON public.driver_salaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_driver_salaries_driver_id ON public.driver_salaries(driver_id);

-- Drop the function we created earlier as it's no longer needed
DROP FUNCTION IF EXISTS public.get_drivers_for_user();

-- Drop the view that's no longer needed
DROP VIEW IF EXISTS public.drivers_public;