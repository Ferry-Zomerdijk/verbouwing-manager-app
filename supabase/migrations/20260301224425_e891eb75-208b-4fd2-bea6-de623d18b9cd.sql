-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily maintenance check at 07:00 UTC (08:00 CET)
SELECT cron.schedule(
  'check-maintenance-due-daily',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://zyydltjelczdfenxvkzi.supabase.co/functions/v1/check-maintenance-due',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5eWRsdGplbGN6ZGZlbnh2a3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NjI3NjEsImV4cCI6MjA3NjUzODc2MX0.gaaJt6B6ZffYk1GI5pDRAHo7VlPJxXk1ipBZrJLjsLc"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);