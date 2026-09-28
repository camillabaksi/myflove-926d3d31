CREATE TABLE public.user_last_active (
  user_id uuid PRIMARY KEY,
  last_active_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.user_last_active TO service_role;
ALTER TABLE public.user_last_active ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own last active" ON public.user_last_active FOR SELECT TO authenticated USING (auth.uid() = user_id);
GRANT SELECT ON public.user_last_active TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_last_active()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.user_last_active(user_id, last_active_at)
  SELECT auth.uid(), now() WHERE auth.uid() IS NOT NULL
  ON CONFLICT (user_id) DO UPDATE SET last_active_at = now();
$$;
REVOKE ALL ON FUNCTION public.touch_last_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_active() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_used_activity()
RETURNS TABLE(used_1d bigint, used_7d bigint, used_30d bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FILTER (WHERE last_active_at > now() - interval '1 day'),
         count(*) FILTER (WHERE last_active_at > now() - interval '7 days'),
         count(*) FILTER (WHERE last_active_at > now() - interval '30 days')
  FROM public.user_last_active;
$$;
REVOKE ALL ON FUNCTION public.admin_used_activity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_used_activity() TO service_role;