DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can insert valid analytics events"
ON public.analytics_events FOR INSERT TO anon, authenticated
WITH CHECK (
  length(session_id) BETWEEN 8 AND 128
  AND length(section) BETWEEN 1 AND 64
  AND length(action) BETWEEN 1 AND 64
  AND created_at > now() - interval '5 minutes'
  AND created_at < now() + interval '5 minutes'
);