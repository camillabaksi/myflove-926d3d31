ALTER TABLE public.push_preferences ALTER COLUMN personal_evening_enabled SET DEFAULT false;
UPDATE public.push_preferences SET personal_evening_enabled = false WHERE personal_evening_enabled = true;

CREATE TABLE public.push_delivery_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  source text NOT NULL,
  ref text,
  tag text,
  title text NOT NULL,
  endpoint_host text NOT NULL,
  endpoint_tail text NOT NULL,
  result text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.push_delivery_log TO authenticated;
GRANT ALL ON public.push_delivery_log TO service_role;
ALTER TABLE public.push_delivery_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own push log readable" ON public.push_delivery_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read push log" ON public.push_delivery_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX push_delivery_log_user_created ON public.push_delivery_log (user_id, created_at DESC);