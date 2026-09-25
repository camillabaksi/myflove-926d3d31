ALTER TABLE public.family_share_areas ADD COLUMN IF NOT EXISTS editors uuid[];
COMMENT ON COLUMN public.family_share_areas.editors IS 'NULL = alla i familjen får ändra; annars bara dessa användare';

CREATE OR REPLACE FUNCTION public.get_family_share_permissions()
RETURNS TABLE(owner_id uuid, area text, can_edit boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT DISTINCT fsa.user_id, fsa.area,
    (fsa.can_edit AND (fsa.editors IS NULL OR auth.uid() = ANY(fsa.editors)))
  FROM public.family_share_areas fsa
  JOIN public.household_members o ON o.user_id = fsa.user_id
  JOIN public.household_members me ON me.household_id = o.household_id AND me.user_id = auth.uid()
  WHERE auth.uid() IS NOT NULL AND fsa.user_id <> auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.family_edit_shared(_owner uuid, _area text, _op text, _item_id text, _title text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _uid uuid := auth.uid(); _name text; _key text; _now_ms bigint;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _uid = _owner THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.household_members o JOIN public.household_members me
      ON me.household_id = o.household_id
    WHERE o.user_id = _owner AND me.user_id = _uid
  ) THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.family_share_areas WHERE user_id = _owner AND area = _area AND can_edit
      AND (editors IS NULL OR _uid = ANY(editors))
  ) THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT display_name INTO _name FROM public.household_members WHERE user_id = _uid LIMIT 1;
  _now_ms := (extract(epoch from now()) * 1000)::bigint;

  IF _area = 'hem' AND _op = 'toggle' THEN
    IF _item_id IS NULL OR length(_item_id) > 200 THEN RAISE EXCEPTION 'invalid'; END IF;
    UPDATE public.user_kv SET value = CASE WHEN value ? _item_id THEN value - _item_id
      ELSE value || jsonb_build_object(_item_id, to_char(now() AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD')) END
    WHERE user_id = _owner AND key = 'myflove-cleaning-done' AND jsonb_typeof(value) = 'object';
    IF NOT FOUND THEN
      INSERT INTO public.user_kv (user_id, key, value)
      VALUES (_owner, 'myflove-cleaning-done', jsonb_build_object(_item_id, to_char(now() AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD')))
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN;
  END IF;

  IF _op = 'toggle' AND _area IN ('inkop','uppgifter','kalender') THEN
    FOREACH _key IN ARRAY (CASE WHEN _area = 'inkop' THEN ARRAY['myflow-shopping']
      WHEN _area = 'kalender' THEN ARRAY['myflow-tasks','myflow-reminders'] ELSE ARRAY['myflow-tasks'] END) LOOP
      UPDATE public.user_kv kv SET value = (
        SELECT coalesce(jsonb_agg(CASE WHEN e->>'id' = _item_id
          THEN e || jsonb_build_object('completed', NOT coalesce((e->>'completed')::boolean, false), 'editedBy', _name)
          ELSE e END ORDER BY ord), '[]'::jsonb)
        FROM jsonb_array_elements(kv.value) WITH ORDINALITY t(e, ord))
      WHERE kv.user_id = _owner AND kv.key = _key AND jsonb_typeof(kv.value) = 'array';
    END LOOP;
    RETURN;
  END IF;

  IF _op = 'add' AND _area = 'inkop' THEN
    IF _title IS NULL OR length(btrim(_title)) = 0 OR length(_title) > 200 THEN RAISE EXCEPTION 'invalid'; END IF;
    UPDATE public.user_kv SET value = value || jsonb_build_array(jsonb_build_object(
      'id', 'fam-' || gen_random_uuid(), 'title', btrim(_title), 'completed', false, 'createdAt', _now_ms, 'editedBy', _name))
    WHERE user_id = _owner AND key = 'myflow-shopping' AND jsonb_typeof(value) = 'array';
    IF NOT FOUND THEN
      INSERT INTO public.user_kv (user_id, key, value) VALUES (_owner, 'myflow-shopping', jsonb_build_array(jsonb_build_object(
        'id', 'fam-' || gen_random_uuid(), 'title', btrim(_title), 'completed', false, 'createdAt', _now_ms, 'editedBy', _name)))
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN;
  END IF;

  RAISE EXCEPTION 'not allowed';
END $$;

CREATE OR REPLACE FUNCTION public.get_family_shared_data()
 RETURNS TABLE(owner_id uuid, display_name text, color text, area text, key text, value jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH mine AS (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ), others AS (
    SELECT DISTINCT ON (hm.user_id) hm.user_id, hm.display_name, hm.color
    FROM public.household_members hm
    WHERE hm.household_id IN (SELECT household_id FROM mine) AND hm.user_id <> auth.uid()
  ), keymap(area, key) AS (
    VALUES ('kalender','myflow-tasks'), ('kalender','myflow-reminders'),
           ('uppgifter','myflow-tasks'),
           ('inkop','myflow-shopping'), ('inkop','myflow-meal-plans'),
           ('rutiner','myflove-routines'), ('rutiner','myflove-medications'), ('rutiner','myflove-medication-log'),
           ('traning','myflove-training'),
           ('maende','myflow-moods'), ('maende','myflove-energy-log'),
           ('ekonomi','myflove-budget'), ('ekonomi','myflow-finances'),
           ('studier','myflove-courses'), ('studier','myflove-flowstudy'),
           ('jobb','myflove-work-projects'),
           ('anteckningar','myflow-dump-ideas'),
           ('hem','myflove-cleaning-custom'), ('hem','myflove-cleaning-done'), ('hem','myflove-cleaning-hidden')
  )
  SELECT o.user_id, o.display_name, o.color, fsa.area, kv.key, kv.value
  FROM others o
  JOIN public.family_share_areas fsa ON fsa.user_id = o.user_id
  JOIN keymap km ON km.area = fsa.area
  JOIN public.user_kv kv ON kv.user_id = o.user_id AND kv.key = km.key
  WHERE auth.uid() IS NOT NULL
$function$;