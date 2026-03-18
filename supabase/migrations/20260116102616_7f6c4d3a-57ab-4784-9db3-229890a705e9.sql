-- Fix subscription_plans public access - restrict to authenticated users only
DROP POLICY IF EXISTS "Plans are publicly readable" ON public.subscription_plans;

CREATE POLICY "Authenticated users can view active plans"
ON public.subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);