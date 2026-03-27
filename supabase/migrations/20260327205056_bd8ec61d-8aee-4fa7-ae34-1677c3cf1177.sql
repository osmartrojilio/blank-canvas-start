UPDATE public.organizations
SET subscription_ends_at = NOW() + INTERVAL '365 days',
    last_payment_at = NOW()
WHERE id = '7becf174-03ea-4cf2-aafe-6ed20414b3ea';