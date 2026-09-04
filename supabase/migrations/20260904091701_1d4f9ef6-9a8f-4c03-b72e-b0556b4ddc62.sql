create or replace function public.admin_user_stats()
returns table(total_users bigint, new_users_7d bigint, signups jsonb)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Allow calls via service role (server-side analytics) and admins only.
  if (auth.jwt() ->> 'role') is distinct from 'service_role'
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  return query
  select
    (select count(*) from auth.users where coalesce(raw_user_meta_data->>'demo_account', 'false') <> 'true' and lower(coalesce(email, '')) <> 'investor@myflove.se')::bigint,
    (select count(*) from auth.users where created_at >= now() - interval '7 days' and coalesce(raw_user_meta_data->>'demo_account', 'false') <> 'true' and lower(coalesce(email, '')) <> 'investor@myflove.se')::bigint,
    coalesce((
      select jsonb_object_agg(day::text, cnt) from (
        select (created_at at time zone 'UTC')::date as day, count(*)::int as cnt
        from auth.users
        where created_at >= now() - interval '14 days'
          and coalesce(raw_user_meta_data->>'demo_account', 'false') <> 'true'
          and lower(coalesce(email, '')) <> 'investor@myflove.se'
        group by 1
      ) s
    ), '{}'::jsonb);
end;
$function$;