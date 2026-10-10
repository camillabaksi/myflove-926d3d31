-- Kör som postgres innan den här versionen av push-tick publiceras.
-- Transaktionell och idempotent: befintligt cron-jobb behåller schema, URL och
-- gamla headers, och får dessutom den privata Authorization-headern.
-- Den gamla serverversionen fortsätter därför fungera under utrullningen.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('paceable_push_tick_auth_setup'));

DO $setup$
DECLARE
  matches integer;
BEGIN
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE EXCEPTION 'Supabase Vault is required';
  END IF;
  SELECT count(*) INTO matches FROM cron.job WHERE jobname = 'myflove-push-tick';
  IF matches <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one myflove-push-tick cron job';
  END IF;
  SELECT count(*) INTO matches FROM vault.secrets WHERE name = 'paceable_push_tick_secret';
  IF matches > 1 THEN
    RAISE EXCEPTION 'Duplicate push tick secrets';
  END IF;
  IF matches = 0 THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'paceable_push_tick_secret',
      'Private authorization for the Paceable push cron job'
    );
  END IF;
END
$setup$;

CREATE OR REPLACE FUNCTION public.validate_push_tick_secret(_secret text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $verify$
  SELECT coalesce(
    _secret ~ '^[a-f0-9]{64}$' AND (
      SELECT extensions.digest(_secret, 'sha256') = extensions.digest(s.decrypted_secret, 'sha256')
      FROM vault.decrypted_secrets s WHERE s.name = 'paceable_push_tick_secret'
    ), false
  )
$verify$;
REVOKE ALL ON FUNCTION public.validate_push_tick_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_push_tick_secret(text) TO service_role;

DO $cron$
DECLARE
  job record;
  target_url text;
  original_headers jsonb;
BEGIN
  SELECT jobid, command INTO STRICT job FROM cron.job WHERE jobname = 'myflove-push-tick';
  target_url := substring(job.command from $regex$url\s*:=\s*'([^']+)'$regex$);
  original_headers := substring(job.command from $regex$headers\s*:=\s*'([^']+)'$regex$)::jsonb;
  IF target_url IS NULL OR target_url NOT LIKE 'https://%/api/public/hooks/push-tick'
     OR original_headers IS NULL OR jsonb_typeof(original_headers) <> 'object' THEN
    RAISE EXCEPTION 'Unexpected cron command; refusing to replace it';
  END IF;
  -- Behåll apikey under övergången. Den nya servern använder bara Authorization.
  original_headers := original_headers - 'Authorization' - 'authorization';
  PERFORM cron.alter_job(job.jobid, command := format($command$
    SELECT net.http_post(
      url := %L,
      headers := %L::jsonb || jsonb_build_object(
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'paceable_push_tick_secret'
        )
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $command$, target_url, original_headers::text));
END
$cron$;

NOTIFY pgrst, 'reload schema';
COMMIT;
