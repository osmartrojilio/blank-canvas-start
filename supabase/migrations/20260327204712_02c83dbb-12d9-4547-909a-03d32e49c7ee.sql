UPDATE public.organizations
SET subscription_ends_at = created_at + INTERVAL '365 days'
WHERE id = '7becf174-03ea-4cf2-aafe-6ed20414b3ea';