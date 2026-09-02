CREATE OR REPLACE FUNCTION public.admin_user_stats()
 RETURNS TABLE(total_users bigint, new_users_7d bigint, signups jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM auth.users WHERE COALESCE(raw_user_meta_data->>'demo_account', 'false') <> 'true' AND lower(COALESCE(email, '')) <> 'investor@myflove.se')::bigint,
    (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '7 days' AND COALESCE(raw_user_meta_data->>'demo_account', 'false') <> 'true' AND lower(COALESCE(email, '')) <> 'investor@myflove.se')::bigint,
    COALESCE((
      SELECT jsonb_object_agg(day::text, cnt) FROM (
        SELECT (created_at at time zone 'UTC')::date AS day, count(*)::int AS cnt
        FROM auth.users
        WHERE created_at >= now() - interval '14 days'
          AND COALESCE(raw_user_meta_data->>'demo_account', 'false') <> 'true'
          AND lower(COALESCE(email, '')) <> 'investor@myflove.se'
        GROUP BY 1
      ) s
    ), '{}'::jsonb);
END;
$function$;