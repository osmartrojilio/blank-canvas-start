-- Create payment_events table for idempotency tracking
CREATE TABLE public.payment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  organization_id UUID REFERENCES public.organizations(id),
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL,
  amount NUMERIC,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (only service role should access this table)
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- No policies needed - only service role (webhook) should access this table
-- This is intentional: payment_events is internal and should not be queryable by users

-- Create index for faster payment_id lookups
CREATE INDEX idx_payment_events_payment_id ON public.payment_events(payment_id);

-- Create index for organization lookups
CREATE INDEX idx_payment_events_org_id ON public.payment_events(organization_id);