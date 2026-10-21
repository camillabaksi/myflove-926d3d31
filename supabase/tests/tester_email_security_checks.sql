-- Read-only verification; run in Supabase SQL Editor after applying migrations.
-- Expected: rls_enabled=true, anon/authenticated privileges=false,
-- service_role privileges=true, and all four delivery columns present.
SELECT c.relrowsecurity AS rls_enabled,
       has_table_privilege('anon', 'public.tester_applications', 'SELECT') AS anon_can_read,
       has_table_privilege('anon', 'public.tester_applications', 'INSERT') AS anon_can_insert,
       has_table_privilege('authenticated', 'public.tester_applications', 'SELECT') AS authenticated_can_read,
       has_table_privilege('authenticated', 'public.tester_applications', 'UPDATE') AS authenticated_can_update,
       has_table_privilege('service_role', 'public.tester_applications', 'SELECT') AS service_role_can_read
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'tester_applications';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tester_applications'
  AND column_name IN (
    'confirmation_accepted_at', 'admin_notice_accepted_at',
    'confirmation_claimed_at', 'admin_notice_claimed_at'
  )
ORDER BY column_name;

-- Counts only: no applicant email addresses or other personal information.
SELECT
  count(*) FILTER (WHERE confirmation_claimed_at IS NOT NULL
                   AND confirmation_accepted_at IS NULL) AS confirmation_unresolved,
  count(*) FILTER (WHERE admin_notice_claimed_at IS NOT NULL
                   AND admin_notice_accepted_at IS NULL) AS owner_notice_unresolved,
  count(*) FILTER (WHERE confirmation_accepted_at IS NOT NULL) AS confirmation_accepted,
  count(*) FILTER (WHERE admin_notice_accepted_at IS NOT NULL) AS owner_notice_accepted
FROM public.tester_applications;
