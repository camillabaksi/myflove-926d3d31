CREATE OR REPLACE FUNCTION public.admin_account_activity()
RETURNS TABLE(active_7d bigint, active_30d bigint, unconfirmed bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '7 days')::bigint,
    (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= now() - interval '30 days')::bigint,
    (SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL)::bigint;
$$;
REVOKE ALL ON FUNCTION public.admin_account_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_account_activity() TO service_role;