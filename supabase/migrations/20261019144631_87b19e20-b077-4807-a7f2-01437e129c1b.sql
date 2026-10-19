DROP POLICY IF EXISTS "Authenticated users can upload task images" ON storage.objects;
CREATE POLICY "Project members can upload task images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-images' AND CASE WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  THEN public.has_project_access(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);

DROP POLICY IF EXISTS "Authenticated users can upload project photos" ON storage.objects;
CREATE POLICY "Project members can upload project photos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-photos' AND CASE WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
  THEN public.has_project_access(auth.uid(), ((storage.foldername(name))[1])::uuid) ELSE false END);

DROP POLICY IF EXISTS "Authenticated users can upload task update images" ON storage.objects;
CREATE POLICY "Users can upload own task update images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-update-images' AND (storage.foldername(name))[1] = (auth.uid())::text);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret') THEN
    PERFORM vault.create_secret(replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-',''), 'cron_secret');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.verify_cron_secret(_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, vault AS $$
  SELECT _secret IS NOT NULL AND length(_secret) > 0 AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'cron_secret' AND decrypted_secret = _secret);
$$;
REVOKE ALL ON FUNCTION public.verify_cron_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text) TO service_role;

SELECT cron.schedule('check-maintenance-due-daily', '0 7 * * *', $cmd$
  SELECT net.http_post(
    url := 'https://zyydltjelczdfenxvkzi.supabase.co/functions/v1/check-maintenance-due',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')),
    body := '{}'::jsonb);
$cmd$);