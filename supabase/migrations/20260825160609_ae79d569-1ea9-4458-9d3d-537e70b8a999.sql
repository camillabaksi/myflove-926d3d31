DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
ALTER TABLE public.analytics_events DROP COLUMN IF EXISTS user_id;
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);