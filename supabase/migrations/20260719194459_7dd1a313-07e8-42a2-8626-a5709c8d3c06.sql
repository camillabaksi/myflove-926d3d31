
CREATE OR REPLACE FUNCTION public.admin_user_stats()
RETURNS TABLE(total_users bigint, new_users_7d bigint, signups jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM auth.users)::bigint,
    (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '7 days')::bigint,
    COALESCE((
      SELECT jsonb_object_agg(day::text, cnt) FROM (
        SELECT (created_at at time zone 'UTC')::date AS day, count(*)::int AS cnt
        FROM auth.users
        WHERE created_at >= now() - interval '14 days'
        GROUP BY 1
      ) s
    ), '{}'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_user_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_user_stats() TO authenticated;
