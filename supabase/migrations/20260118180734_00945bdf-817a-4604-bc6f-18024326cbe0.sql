-- Enable Row Level Security on payment_events table
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access to payment_events
CREATE POLICY "Deny anonymous access to payment_events"
ON public.payment_events
FOR SELECT
TO anon
USING (false);

-- Allow authenticated organization admins to view their organization's payment events
CREATE POLICY "Admins can view their organization payment events"
ON public.payment_events
FOR SELECT
TO authenticated
USING (
  (organization_id = get_user_organization(auth.uid())) 
  AND has_role(auth.uid(), 'admin'::app_role)
);