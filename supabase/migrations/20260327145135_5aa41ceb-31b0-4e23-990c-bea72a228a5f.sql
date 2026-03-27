
-- Add new subscription statuses to the enum
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'trial_canceled';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'canceled_pending_refund';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'canceled_active_until_end';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'expired';
