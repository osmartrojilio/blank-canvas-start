
-- Simple function to increment coupon usage counter
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_coupon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.discount_coupons
  SET current_uses = current_uses + 1, updated_at = now()
  WHERE id = _coupon_id;
$$;
