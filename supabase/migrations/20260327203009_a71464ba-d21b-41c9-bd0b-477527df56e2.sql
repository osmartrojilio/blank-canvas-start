UPDATE public.organizations
SET subscription_status = 'active',
    canceled_at = NULL,
    cancellation_reason = NULL
WHERE id = '7becf174-03ea-4cf2-aafe-6ed20414b3ea';