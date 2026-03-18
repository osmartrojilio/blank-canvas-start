-- ==============================================
-- FLEET MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ==============================================

-- 1. VEHICLES TABLE (Veículos)
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT,
  year INTEGER,
  color TEXT,
  chassis TEXT,
  renavam TEXT,
  fuel_type TEXT DEFAULT 'diesel',
  tank_capacity NUMERIC,
  current_km INTEGER DEFAULT 0,
  current_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'inactive')),
  driver_id UUID REFERENCES public.profiles(id),
  acquisition_date DATE,
  acquisition_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, plate)
);

-- 2. DRIVERS TABLE (Motoristas - extensão do profiles)
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cnh_number TEXT,
  cnh_category TEXT,
  cnh_expiry DATE,
  hire_date DATE,
  salary NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vacation', 'suspended')),
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, profile_id)
);

-- 3. TRIPS TABLE (Viagens)
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  start_km INTEGER NOT NULL,
  end_km INTEGER,
  cargo_type TEXT,
  tonnage NUMERIC,
  freight_value NUMERIC,
  client_name TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. FUEL RECORDS TABLE (Abastecimentos)
CREATE TABLE public.fuel_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  trip_id UUID REFERENCES public.trips(id),
  fuel_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  liters NUMERIC NOT NULL,
  price_per_liter NUMERIC NOT NULL,
  total_value NUMERIC NOT NULL,
  odometer INTEGER NOT NULL,
  fuel_type TEXT DEFAULT 'diesel',
  gas_station TEXT,
  city TEXT,
  state TEXT,
  payment_method TEXT,
  receipt_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. EXPENSES TABLE (Despesas)
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id),
  trip_id UUID REFERENCES public.trips(id),
  expense_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expense_type TEXT NOT NULL CHECK (expense_type IN ('maintenance', 'tire', 'toll', 'parts', 'insurance', 'tax', 'fine', 'other')),
  description TEXT NOT NULL,
  supplier TEXT,
  value NUMERIC NOT NULL,
  payment_method TEXT,
  invoice_number TEXT,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. MAINTENANCE RECORDS TABLE (Manutenções)
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id),
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'emergency')),
  description TEXT NOT NULL,
  service_provider TEXT,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  exit_date TIMESTAMP WITH TIME ZONE,
  entry_km INTEGER,
  exit_km INTEGER,
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  next_maintenance_km INTEGER,
  next_maintenance_date DATE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. ATTACHMENTS TABLE (Anexos)
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle', 'trip', 'fuel_record', 'expense', 'maintenance', 'driver')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ==============================================
-- ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- RLS POLICIES - VEHICLES
-- ==============================================

CREATE POLICY "Users can view vehicles in their organization"
ON public.vehicles FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins and managers can insert vehicles"
ON public.vehicles FOR INSERT
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update vehicles"
ON public.vehicles FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete vehicles"
ON public.vehicles FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- ==============================================
-- RLS POLICIES - DRIVERS
-- ==============================================

CREATE POLICY "Users can view drivers in their organization"
ON public.drivers FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage drivers"
ON public.drivers FOR ALL
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- ==============================================
-- RLS POLICIES - TRIPS
-- ==============================================

CREATE POLICY "Users can view trips in their organization"
ON public.trips FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins and managers can insert trips"
ON public.trips FOR INSERT
WITH CHECK (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update trips"
ON public.trips FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete trips"
ON public.trips FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- ==============================================
-- RLS POLICIES - FUEL RECORDS
-- ==============================================

CREATE POLICY "Users can view fuel records in their organization"
ON public.fuel_records FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can insert fuel records in their organization"
ON public.fuel_records FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins and managers can update fuel records"
ON public.fuel_records FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete fuel records"
ON public.fuel_records FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- ==============================================
-- RLS POLICIES - EXPENSES
-- ==============================================

CREATE POLICY "Users can view expenses in their organization"
ON public.expenses FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can insert expenses in their organization"
ON public.expenses FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins and managers can update expenses"
ON public.expenses FOR UPDATE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete expenses"
ON public.expenses FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- ==============================================
-- RLS POLICIES - MAINTENANCE RECORDS
-- ==============================================

CREATE POLICY "Users can view maintenance records in their organization"
ON public.maintenance_records FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins and managers can manage maintenance records"
ON public.maintenance_records FOR ALL
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- ==============================================
-- RLS POLICIES - ATTACHMENTS
-- ==============================================

CREATE POLICY "Users can view attachments in their organization"
ON public.attachments FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can insert attachments in their organization"
ON public.attachments FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Admins can delete attachments"
ON public.attachments FOR DELETE
USING (
  organization_id = get_user_organization(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- ==============================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fuel_records_updated_at
  BEFORE UPDATE ON public.fuel_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX idx_vehicles_organization ON public.vehicles(organization_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_plate ON public.vehicles(plate);

CREATE INDEX idx_drivers_organization ON public.drivers(organization_id);
CREATE INDEX idx_drivers_profile ON public.drivers(profile_id);

CREATE INDEX idx_trips_organization ON public.trips(organization_id);
CREATE INDEX idx_trips_vehicle ON public.trips(vehicle_id);
CREATE INDEX idx_trips_driver ON public.trips(driver_id);
CREATE INDEX idx_trips_status ON public.trips(status);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);

CREATE INDEX idx_fuel_records_organization ON public.fuel_records(organization_id);
CREATE INDEX idx_fuel_records_vehicle ON public.fuel_records(vehicle_id);
CREATE INDEX idx_fuel_records_date ON public.fuel_records(fuel_date);

CREATE INDEX idx_expenses_organization ON public.expenses(organization_id);
CREATE INDEX idx_expenses_vehicle ON public.expenses(vehicle_id);
CREATE INDEX idx_expenses_type ON public.expenses(expense_type);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_status ON public.expenses(status);

CREATE INDEX idx_maintenance_organization ON public.maintenance_records(organization_id);
CREATE INDEX idx_maintenance_vehicle ON public.maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_status ON public.maintenance_records(status);

CREATE INDEX idx_attachments_organization ON public.attachments(organization_id);
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);