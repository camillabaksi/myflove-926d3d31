-- Voluntary product feedback, protocol v1. No drafts, free text or telemetry joins.
CREATE TABLE public.pilot_weekly_pulses (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL CHECK (extract(isodow FROM week_start) = 1),
  opened_at timestamptz,
  dismissed_at timestamptz,
  submitted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  overview smallint,
  relief smallint,
  burden smallint,
  consent_version smallint,
  PRIMARY KEY (user_id, week_start),
  CONSTRAINT weekly_pulse_complete CHECK (
    (submitted_at IS NULL AND num_nonnulls(overview, relief, burden, consent_version) = 0)
    OR (submitted_at IS NOT NULL AND opened_at IS NOT NULL AND consent_version = 1
      AND num_nonnulls(overview, relief, burden, consent_version) = 4
      AND overview BETWEEN 1 AND 5 AND relief BETWEEN 1 AND 5 AND burden BETWEEN 1 AND 5)
  )
);
CREATE INDEX pilot_weekly_pulses_week_start_idx ON public.pilot_weekly_pulses (week_start);
--> statement-breakpoint
ALTER TABLE public.pilot_weekly_pulses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pilot_weekly_pulses FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.pilot_weekly_pulses TO authenticated;
CREATE POLICY "Read only my weekly pulse" ON public.pilot_weekly_pulses
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
--> statement-breakpoint
CREATE FUNCTION public.update_my_weekly_pulse(
  p_week date, p_action text, p_revision integer DEFAULT NULL,
  p_consent boolean DEFAULT false, p_overview integer DEFAULT NULL,
  p_relief integer DEFAULT NULL, p_burden integer DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  this_week date := date_trunc('week', timezone('Europe/Stockholm', statement_timestamp()))::date;
  existing public.pilot_weekly_pulses;
BEGIN
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501'; END IF;
  IF p_week IS DISTINCT FROM this_week OR p_action IS NULL OR p_action NOT IN ('open', 'dismiss', 'submit', 'withdraw') THEN
    RAISE EXCEPTION 'Invalid week or action' USING ERRCODE = '22023';
  END IF;
  IF p_action IN ('open', 'dismiss') THEN
    INSERT INTO public.pilot_weekly_pulses(user_id, week_start, opened_at, dismissed_at)
    VALUES (owner_id, this_week,
      CASE WHEN p_action = 'open' THEN statement_timestamp() END,
      CASE WHEN p_action = 'dismiss' THEN statement_timestamp() END)
    ON CONFLICT (user_id, week_start) DO UPDATE SET
      opened_at = CASE WHEN p_action = 'open' THEN coalesce(pilot_weekly_pulses.opened_at, statement_timestamp()) ELSE pilot_weekly_pulses.opened_at END,
      dismissed_at = CASE WHEN p_action = 'dismiss' THEN statement_timestamp() ELSE NULL END,
      updated_at = statement_timestamp();
    RETURN;
  END IF;
  -- Row lock and revision protect simultaneous edits. Retried identical saves are idempotent.
  SELECT * INTO existing FROM public.pilot_weekly_pulses WHERE user_id = owner_id AND week_start = this_week FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Open the form first' USING ERRCODE = '22023'; END IF;
  IF p_action = 'withdraw' AND existing.submitted_at IS NULL THEN RETURN; END IF;
  IF p_action = 'submit' THEN
    IF p_consent IS DISTINCT FROM true OR p_overview IS NULL OR p_relief IS NULL OR p_burden IS NULL
      OR p_overview NOT BETWEEN 1 AND 5 OR p_relief NOT BETWEEN 1 AND 5 OR p_burden NOT BETWEEN 1 AND 5 THEN
      RAISE EXCEPTION 'Complete answers and consent required' USING ERRCODE = '22023';
    END IF;
    IF existing.submitted_at IS NOT NULL AND existing.overview = p_overview AND existing.relief = p_relief AND existing.burden = p_burden THEN RETURN; END IF;
  END IF;
  IF p_revision IS DISTINCT FROM existing.revision THEN RAISE EXCEPTION 'Answer has changed' USING ERRCODE = '40001'; END IF;
  IF p_action = 'withdraw' THEN
    UPDATE public.pilot_weekly_pulses SET overview = NULL, relief = NULL, burden = NULL,
      consent_version = NULL, submitted_at = NULL, dismissed_at = statement_timestamp(),
      revision = revision + 1, updated_at = statement_timestamp()
    WHERE user_id = owner_id AND week_start = this_week;
  ELSE
    IF existing.opened_at IS NULL THEN RAISE EXCEPTION 'Open the form first' USING ERRCODE = '22023'; END IF;
    UPDATE public.pilot_weekly_pulses SET overview = p_overview, relief = p_relief, burden = p_burden,
      consent_version = 1, submitted_at = coalesce(submitted_at, statement_timestamp()),
      dismissed_at = NULL, revision = revision + 1, updated_at = statement_timestamp()
    WHERE user_id = owner_id AND week_start = this_week;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.update_my_weekly_pulse(date, text, integer, boolean, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_my_weekly_pulse(date, text, integer, boolean, integer, integer, integer) TO authenticated;
--> statement-breakpoint
CREATE FUNCTION public.get_weekly_pulse_stats()
RETURNS TABLE (week_start date, opened integer, answered integer, overview_counts integer[], relief_counts integer[], burden_counts integer[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH weeks AS (
    SELECT (date_trunc('week', timezone('Europe/Stockholm', statement_timestamp()))::date - (n * 7))::date AS start
    FROM generate_series(0, 7) n
  ), eligible AS MATERIALIZED (
    SELECT p.* FROM public.pilot_weekly_pulses p JOIN auth.users u ON u.id = p.user_id
    WHERE p.week_start >= (SELECT min(start) FROM weeks)
      AND p.week_start <= (SELECT max(start) FROM weeks)
      AND NOT public.has_role(p.user_id, 'admin')
      AND coalesce(u.raw_user_meta_data ->> 'demo_account', 'false') <> 'true'
      AND lower(coalesce(u.email, '')) <> 'investor@myflove.se'
  )
  SELECT w.start,
    (SELECT count(*)::integer FROM eligible p WHERE p.week_start = w.start AND p.opened_at IS NOT NULL),
    (SELECT count(*)::integer FROM eligible p WHERE p.week_start = w.start AND p.submitted_at IS NOT NULL),
    ARRAY(SELECT (SELECT count(*)::integer FROM eligible p WHERE p.week_start = w.start AND p.overview = score) FROM generate_series(1, 5) score),
    ARRAY(SELECT (SELECT count(*)::integer FROM eligible p WHERE p.week_start = w.start AND p.relief = score) FROM generate_series(1, 5) score),
    ARRAY(SELECT (SELECT count(*)::integer FROM eligible p WHERE p.week_start = w.start AND p.burden = score) FROM generate_series(1, 5) score)
  FROM weeks w ORDER BY w.start DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_weekly_pulse_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_pulse_stats() TO authenticated;
