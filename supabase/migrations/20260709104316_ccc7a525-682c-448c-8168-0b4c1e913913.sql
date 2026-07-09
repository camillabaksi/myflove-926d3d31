
DROP POLICY "Anyone can insert analytics events" ON public.analytics_events;

CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(session_id) BETWEEN 1 AND 128
    AND length(section) BETWEEN 1 AND 64
    AND length(action) BETWEEN 1 AND 64
    AND (user_id IS NULL OR user_id = auth.uid())
  );
