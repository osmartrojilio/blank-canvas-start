
-- Add cancellation tracking columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_payment_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refund_eligible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancellation_reason text DEFAULT NULL;
