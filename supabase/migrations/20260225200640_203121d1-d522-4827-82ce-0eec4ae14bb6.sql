
-- Discount coupons table
CREATE TABLE public.discount_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT discount_coupons_code_unique UNIQUE (code)
);

-- RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage coupons
CREATE POLICY "Platform admins can manage coupons"
  ON public.discount_coupons
  FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Authenticated users can validate coupons (read active ones)
CREATE POLICY "Authenticated users can validate coupons"
  ON public.discount_coupons
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Coupon usage log table
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.discount_coupons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  payment_id TEXT,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view coupon usage"
  ON public.coupon_usage
  FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Admins can view own org coupon usage"
  ON public.coupon_usage
  FOR SELECT
  USING (organization_id = get_user_organization(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));
