-- Schedule daily cron job to expire subscriptions at midnight UTC
SELECT cron.schedule(
  'expire-subscriptions-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://poqfgwtovpkugpdqskbm.supabase.co/functions/v1/expire-subscriptions',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcWZnd3RvdnBrdWdwZHFza2JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MTQ3MDcsImV4cCI6MjA4NzM5MDcwN30.2wmV8PrzzGkb58PauRO422bLuCFblNoneNah6IkpuvQ"}'::jsonb,
    body:=concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);