
-- 1. CLIENTS: Restrict SELECT to admin/manager only (drivers don't need client PII)
DROP POLICY IF EXISTS "Users can view clients in their organization" ON public.clients;
CREATE POLICY "Admins and managers can view clients"
  ON public.clients FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );

-- 2. ORGANIZATION_FISCAL_DATA: Restrict SELECT to admin only
DROP POLICY IF EXISTS "Users can view their org fiscal data" ON public.organization_fiscal_data;
CREATE POLICY "Only admins can view fiscal data"
  ON public.organization_fiscal_data FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- 3. TRIPS: Drivers can only see their own assigned trips
DROP POLICY IF EXISTS "Users can view trips in their organization" ON public.trips;
CREATE POLICY "Users can view trips based on role"
  ON public.trips FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR driver_id = (SELECT id FROM public.drivers WHERE profile_id = auth.uid() AND organization_id = trips.organization_id LIMIT 1)
    )
  );

-- 4. FUEL_RECORDS: Drivers can only see their own fuel records
DROP POLICY IF EXISTS "Users can view fuel records in their organization" ON public.fuel_records;
CREATE POLICY "Users can view fuel records based on role"
  ON public.fuel_records FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR driver_id = (SELECT id FROM public.drivers WHERE profile_id = auth.uid() AND organization_id = fuel_records.organization_id LIMIT 1)
      OR created_by = auth.uid()
    )
  );

-- 5. EXPENSES: Drivers can only see expenses they created
DROP POLICY IF EXISTS "Users can view expenses in their organization" ON public.expenses;
CREATE POLICY "Users can view expenses based on role"
  ON public.expenses FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
      OR created_by = auth.uid()
      OR driver_id = (SELECT id FROM public.drivers WHERE profile_id = auth.uid() AND organization_id = expenses.organization_id LIMIT 1)
    )
  );

-- 6. MAINTENANCE_RECORDS: Restrict SELECT to admin/manager only
DROP POLICY IF EXISTS "Users can view maintenance records in their organization" ON public.maintenance_records;
CREATE POLICY "Admins and managers can view maintenance records"
  ON public.maintenance_records FOR SELECT
  USING (
    organization_id = get_user_organization(auth.uid())
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  );
