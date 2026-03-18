
-- 1. Add user as platform admin
INSERT INTO public.platform_admins (user_id, notes)
VALUES ('dba64806-36b4-4577-815a-bc18c0a3b9c0', 'Administrador da plataforma - trojilio.mga@gmail.com')
ON CONFLICT DO NOTHING;

-- 2. Set organization to Enterprise plan with active subscription
UPDATE public.organizations
SET plan_id = 'f736bad2-a9f8-44d0-a25a-599f6fea1ad4',
    subscription_status = 'active',
    subscription_ends_at = NOW() + INTERVAL '100 years',
    is_active = true,
    updated_at = NOW()
WHERE id = '7becf174-03ea-4cf2-aafe-6ed20414b3ea';

-- 3. Ensure user role is admin
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = 'dba64806-36b4-4577-815a-bc18c0a3b9c0'
  AND organization_id = '7becf174-03ea-4cf2-aafe-6ed20414b3ea';

-- 4. Mark email as verified
UPDATE public.profiles
SET is_email_verified = true
WHERE id = 'dba64806-36b4-4577-815a-bc18c0a3b9c0';
